import * as BABYLON from 'babylonjs';
import { saveAs } from 'file-saver';
import * as Components from './components.js';

// define collection class (group of components)
class Collection {
    constructor(scene, numArcPts, numFillPts) {

        // initialize properties
        this.scene = scene; // scene hosting collection
        this.numArcPts = numArcPts; // # of points defining circle arc resolution
        this.numFillPts = numFillPts; // # of points defining fillet arc resolution
        this.structureMode = false; // toggle for if structural elements are showing (structural analysis mode)
        this.showingConnections = false; // toggle for if connections are visible
        this.transparent = false; // toggle for components transparency
    }

    // select specified components
    select(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].select();
        }
    }

    // deselect specified components
    deselect(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].deselect();
        }
    }

    // show specified components connections
    showConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].showConnections();
        }
        this.showingConnections = true;
    }

    // hide specified components connections
    hideConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].hideConnections();
        }
        this.showingConnections = false;
    }

    // toggle specified components connections visibility
    toggleConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleConnections();
        }
        this.showingConnections = !this.showingConnections;
    }

    // toggle specified components structural elements visibility
    toggleElements(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleElements();
        }
        this.structureMode = !this.structureMode;
    }

    // set the specified components materials opaque
    opaque(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].opaque();
        }
        this.transparent = false;
    }

    // set the specified components materials transparent (xray)
    xray(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].xray();
        }
        this.transparent = true;
    }

    // toggle specified components transparency
    toggleTransparency(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleTransparency();
        }
        this.transparent = !this.transparent;
    }
}

// define tree class (arrangement of components for furniture design)
class Tree extends Collection {
    constructor(scene, numArcPts, numFillPts, snapDist, snapRot) {
        super(scene, numArcPts, numFillPts);

        // initialize properties
        this.type = "tree"; // collection type
        this.components = []; // array of components in tree
        this.componentIDs = []; // array of component IDs in tree
        this.nextID = 1; // initialize next component ID val
        this.selComponents = []; // array of selected components in tree
        this.selComponentIDs = []; // array of selected component IDs in tree
        this.snapDist = snapDist; // snap distance for gizmo controls
        this.snapRot = snapRot; // snap rotation angle (in degrees) for gizmo controls
        this.showingGizmos = false; // toggle for gizmo visibility
        this.history = []; // array of tree versions for undo
        this.future = []; // array of tree versions for redo

        // set up controls
        this.setupControls();
    }

    // add component
    add(component) {
        this.components.push(component);
        component.ID = this.nextID;
        this.componentIDs.push(this.nextID);
        this.nextID++;
    }

    // copy specified components
    async copy(components) {
        await new Promise((resolve) => {
            for (let i = 0; i < components.length; i++) {
                // create duplicate component
                const c = components[i];
                if (c.type == "leaf") {
                    this.add(new Components.Leaf(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenX, c.lenY));
                } else if (c.type == "stem") {
                    this.add(new Components.Stem(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.angleBend, c.lenStem, c.radStem, c.radFill, 
                        c.radConn, c.lenConn, c.thickBT, c.reflected, this.numArcPts, this.numFillPts));
                } else if (c.type == "branch") {
                    this.add(new Components.Branch(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenBranch, c.thickBranch, c.radBranch, 
                        c.radHole, c.spacHole, c.lenSlot, c.reflected, this.numArcPts));
                } else if (c.type == "trunk") {
                    this.add(new Components.Trunk(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenTrunk, c.widthTile, c.thickTile, 
                        c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, c.spacHole, c.overhang, c.reflected, this.numArcPts));
                }

                // maintain visuals
                if (this.structureMode) {
                    this.components[this.components.length-1].showElements();
                }
                if (this.transparent) {
                    this.components[this.components.length-1].xray();
                }
                if (this.showingConnections) {
                    this.components[this.components.length-1].showConnections();
                }
            }

            resolve(); // resolve promise
        });

        // log updated tree
        this.log();
    }
    
    // delete specified components
    async delete(components) {
        return new Promise((resolve) => {
            // temporarily copy components array so deletion does not affect iteration
            var temp = [];
            for (let i = 0; i < components.length; i++) {
                temp.push(components[i]);
            }

            // delete components
            for (let i = 0; i < temp.length; i++) {
                const c = temp[i];
                const index = this.componentIDs.indexOf(c.ID);
                if (index > -1) {
                    this.componentIDs.splice(index, 1);
                    this.components.splice(index, 1);
                    c.deselect();
                    c.delete();
                }
            }
            temp = [];

            resolve(); // resolve promise
        });
    }

    // delete specified components & log updated tree
    async formalDelete(components) {
        await new Promise((resolve) => {
            this.delete(components);

            resolve(); // resolve promise
        });
        
        // log updated tree
        this.log();
    }

    // show specified components gizmos
    showGizmos(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].showGizmos();
        }
        if (components.length > 0) {this.showingGizmos = true};
    }

    // hide specified components gizmos
    hideGizmos(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].hideGizmos();
        }
        if (components.length > 0) {this.showingGizmos = false};
    }

    // toggle specified components gizmos visibility
    toggleGizmos(components) {
        if (this.showingGizmos) {
            this.hideGizmos(components);
        } else {
            this.showGizmos(components);
        }
    }

    // deselect specified components connections
    deselectConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].deselectConnections();
        }
    }

    // checks for intersections between specified components
    checkIntersections(components) {
        for (let j = 0; j < components.length; j++) {
            for (let i = 0; i < components.length; i++) {
                if (i != j) {
                    if (components[j].intersects(components[i])) {
                        components[j].intersecting = true;
                        break;
                    } else {
                        components[j].intersecting = false;
                    }
                }
            }
        }
    }

    // checks for connections between specified components
    checkConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].checkConnections(components);
        }
    }

    // reflects specified components
    async reflect(components) {
        await new Promise((resolve) => {
            const old = [];
            const num = components.length;
            for (let i = 0; i < num; i++) {
                const c = components[i];
                if (c.type == "stem" || c.type == "branch" || c.type == "trunk") {
                    old.push(c);

                    // update reflected toggle
                    let newReflected = 1;
                    if (c.reflected == 1) {
                        newReflected = 0;
                    }
                    
                    // create reflected version of component
                    if (c.type == "stem") {
                        this.add(new Components.Stem(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.angleBend, c.lenStem, c.radStem, c.radFill, 
                            c.radConn, c.lenConn, c.thickBT, newReflected, this.numArcPts, this.numFillPts));
                    } else if (c.type == "branch") {
                        this.add(new Components.Branch(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenBranch, c.thickBranch, c.radBranch, 
                            c.radHole, c.spacHole, c.lenSlot, newReflected, this.numArcPts));
                    } else if (c.type == "trunk") {
                        this.add(new Components.Trunk(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenTrunk, c.widthTile, c.thickTile, 
                            c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, c.spacHole, c.overhang, newReflected, this.numArcPts));
                    }

                    // maintain selections & visuals
                    this.components[this.components.length-1].select();
                    if (this.structureMode) {
                        this.components[this.components.length-1].showElements();
                    }
                    if (this.transparent) {
                        this.components[this.components.length-1].xray();
                    }
                    if (this.showingConnections) {
                        this.components[this.components.length-1].showConnections();
                    }
                }
            }

            // delete non-reflected (old) components
            this.delete(old);

            resolve(); // resolve promise
        });

        // log updated tree
        this.log();
    }

    // updates specified components visuals
    updateVisuals(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].updateVisuals();
        }
    }

    // set up tree controls & responses
    setupControls() {
        // default gizmo visibility
        this.hideGizmos(this.components);

        // keyboard controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        // a key selects all components
                        case "a":
                        case "A":
                            this.select(this.components);
                        break

                        // c key copies selected components
                        case "c":
                        case "C":
                            this.copy(this.selComponents);
                        break

                        // m key toggles gizmos visibility for selected components
                        case "m":
                        case "M":
                            if (this.selComponents.length > 0) {
                                this.toggleGizmos(this.selComponents);
                            }
                        break

                        // escape key deselects all components
                        case "Escape":
                            this.deselect(this.components);
                            this.hideGizmos(this.components);
                            this.deselectConnections(this.components);
                            // this.hideConnections(this.components);
                        break
                        
                        // delete key deletes selected components
                        case "Delete":
                            this.formalDelete(this.selComponents);
                        break

                        // n key toggles connections visibility for all components
                        case "n":
                        case "N":
                            this.toggleConnections(this.components);
                            this.deselectConnections(this.components);
                        break

                        // t key toggles transparency for all components
                        case "t":
                        case "T":
                            this.toggleTransparency(this.components);
                        break

                        // q key toggles structural elements visibility for all components
                        case "q":
                        case "Q":
                            this.toggleElements(this.components);
                        break

                        // r key reflects selected components
                        case "r":
                        case "R":
                            this.reflect(this.selComponents);
                        break

                        // [ key is undo action
                        case "[":
                            this.undo();
                        break

                        // ] key is redo action
                        case "]":
                            this.redo();
                        break

                        // l key loads tree file
                        case "l":
                        case "L":
                            this.load();
                        break

                        // s key saves tree file
                        case "s":
                        case "S":
                            this.save();
                        break
                    }
                break;
            }
        });
    }

    // compress tree to string lines
    compress() {
        const lines = [];
        for (let i = 0; i < this.components.length; i++) {
            const c = this.components[i];
            let line = [];
            if (c.type == "leaf") {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenX, c.lenY, '\n'];
            } else if (c.type == "stem") {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.angleBend, c.lenStem, c.radStem, c.radFill, c.radConn, c.lenConn, c.thickBT, c.reflected, '\n'];
            } else if (c.type == "branch") {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenBranch, c.thickBranch, c.radBranch, c.radHole, c.spacHole, c.lenSlot, c.reflected, '\n'];
            } else if (c.type == "trunk") {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenTrunk, c.widthTile, c.thickTile, c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, 
                    c.radHole, c.spacHole, c.overhang, c.reflected, '\n'];
            }
            lines.push(line.toString());
        }
        return lines;
    }

    // expand string lines to tree
    expand(lines) {
        for (let j = 0; j < lines.length; j++) {
            // process component from string
            let line = lines[j];
            let dataString = line.split(',');
            let data = [dataString[0]];
            for (let i = 1; i < dataString.length; i++) {
                data.push(parseFloat(dataString[i]));
            }
            
            // add component
            if (data[0] == "leaf") {
                this.add(new Components.Leaf(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8]));
            } else if (data[0] == "stem") {
                this.add(new Components.Stem(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14],
                    this.numArcPts, this.numFillPts));
            } else if (data[0] == "branch") {
                this.add(new Components.Branch(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], data[13], this.numArcPts));
            } else if (data[0] == "trunk") {
                this.add(new Components.Trunk(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14], 
                    data[15], data[16], data[17], data[18], this.numArcPts));
            }
            
            // maintain visuals
            if (this.structureMode) {
                this.components[this.components.length-1].showElements();
            }
            if (this.transparent) {
                this.components[this.components.length-1].xray();
            }
            if (this.showingConnections) {
                this.components[this.components.length-1].showConnections();
            }
        }
    }

    // log tree version (in history)
    log() {
        const maxVersions = 20;

        // add version to history
        this.history.push(this.compress());

        // remove oldest version if exceeding max versions
        while (this.history.length > maxVersions) {
            this.history.shift();
        }
    }

    // undo action (go back to previous tree version in history)
    undo() {
        if (this.history.length > 1) {
            // store current tree length
            let num = this.components.length;
            
            // move current tree to future
            this.future.push(this.history.pop());

            // expand previous tree version
            this.expand(this.history[this.history.length-1]);

            // clear current tree
            this.delete(this.components.slice(0, num));
        }
    }

    // redo action (go back to undone tree version in future)
    redo() {
        if (this.future.length > 0) {
            // store current tree length
            let num = this.components.length;
        
            // move undone tree from future to history
            this.history.push(this.future.pop());

            // expand undone tree version
            this.expand(this.history[this.history.length-1]);

            // clear current tree
            this.delete(this.components.slice(0, num));
        }
    }

    // save tree file
    save() {
        const file = new Blob(this.compress(), {type: "text/plain;charset=utf-8",});
        saveAs(file, "myTree.txt");
    }

    // load tree file
    async load() {
        // store previous tree length
        let num = this.components.length;
    
        // process file from local browser
        const input = document.createElement('input');
        input.type = 'file';
        input.click();
    
        // wrap file selection and reading in a promise
        await new Promise((resolve, reject) => {
            input.onchange = () => {
                const files = input.files;
                if (files.length > 0) {
                    const reader = new FileReader();
                    reader.readAsText(files[0], "utf-8");
                    reader.onload = () => {
                        // create components per file lines
                        const lines = reader.result.split('\n');
                        this.expand(lines);

                        // clear previous tree
                        this.delete(this.components.slice(0, num));

                        resolve(); // resolve promise
                    };
                    reader.onerror = () => {
                        reject(reader.error);  // reject the promise in case of errors
                    };
                } else {
                    reject(new Error("no file selected"));
                }
            };
        });

        // log loaded tree
        this.log();
    }
}

// define almanac class (library of components for browsing & use in trees)
class Almanac extends Collection {
    constructor(scene, numArcPts, numFillPts) {
        super(scene, numArcPts, numFillPts);

        // initialize properties
        this.type = "almanac"; // collection type
        this.leaves = []; // array of leaf components in almanac
        this.stems = []; // array of stem components in almanac
        this.branches = []; // array of branch components in almanac
        this.trunks = []; // array of trunk components in almanac

        // set up controls
        this.setupControls();
    }

    // generate leaves in almanac per input criteria
    generateLeaves([x0, y0, z0], [lenXMin, lenXIncr, lenXMax], [lenYMin, lenYIncr, lenYMax]) {
        // initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dx = 2;
        const dy = 0;
        const dz = 2;

        // generate leaves
        for (let lenX = lenXMin; lenX <= lenXMax; lenX += lenXIncr) {
            for (let lenY = lenYMin; lenY <= lenYMax; lenY += lenYIncr) {
                this.leaves.push(new Components.Leaf(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], lenX, lenY));
                z += lenY+dz;
            }
            z = z0;
            x += lenX+dx;
        }   
    }

    // generate stems in almanac per input criteria
    generateStems([x0, y0, z0], [angleBendMin, angleBendIncr, angleBendMax], [lenStemMin, lenStemIncr, lenStemMax], radStem, radFill, radConn, lenConn, thickBT) {
        // initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dx = 0;
        const dy = 2;
        const dz = 2;
        
        // generate stems
        for (let angleBend = angleBendMin; angleBend <= angleBendMax; angleBend += angleBendIncr) {
            for (let lenStem = lenStemMin; lenStem <= lenStemMax; lenStem += lenStemIncr) {
                this.stems.push(new Components.Stem(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], angleBend, lenStem, radStem, radFill, radConn, lenConn, thickBT, 0, 
                    this.numArcPts, this.numFillPts));
                z += lenStem+dz;
            }
            z = z0;
            y += lenStemMax/2+dy;
        }   
    }

    // generate branches in almanac per input criteria
    generateBranches([x0, y0, z0], [lenBranchMin, lenBranchIncr, lenBranchMax], thickBranch, radBranch, radHole, spacHole, lenSlot) {
        // initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dx = 0;
        const dy = 2;
        const dz = 0;

        // generate branches
        for (let lenBranch = lenBranchMin; lenBranch <= lenBranchMax; lenBranch += lenBranchIncr) {
            this.branches.push(new Components.Branch(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], lenBranch, thickBranch, radBranch, radHole, spacHole, lenSlot, 0, this.numArcPts));
            y += 2*radBranch+dy;
        }
    }

    // generate trunks in almanac per input criteria
    generateTrunks([x0, y0, z0], [widthTileMin, widthTileIncr, widthTileMax], [lenTrunkMin, lenTrunkIncr, lenTrunkMax], thickTile, thickRib, radRib, spacRib, edgeRib, radHole, spacHole, overhang) {
        // initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dx = 2;
        const dy = 2;
        const dz = 0;

        // generate trunks
        for (let widthTile = widthTileMin; widthTile <= widthTileMax; widthTile += widthTileIncr) {
            const numRibs = Math.floor((widthTile-edgeRib-thickRib)/(thickRib+spacRib))+1;
            for (let lenTrunk = lenTrunkMin; lenTrunk <= lenTrunkMax; lenTrunk += lenTrunkIncr) {
                this.trunks.push(new Components.Trunk(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, 
                    radHole, spacHole, overhang, 0, this.numArcPts));
                x += lenTrunk+2*(2*radRib+overhang)+dx;
            }
            x = x0;
            y += 2*radRib+thickTile+dy;
        }
    }

    // delete specified components
    delete(components) {
        for (let i = components.length-1; i >= 0; i--) {
            components[i].delete();
        }
    }

    // delete all components in almanac
    deleteAll() {
        this.delete(this.leaves);
        this.delete(this.stems);
        this.delete(this.branches);
        this.delete(this.trunks);
    }

    // updates all component visuals
    updateVisuals() {
        for (let i = 0; i < this.leaves.length; i++) {
            this.leaves[i].updateVisuals();
        }
        for (let i = 0; i < this.stems.length; i++) {
            this.stems[i].updateVisuals();
        }
        for (let i = 0; i < this.branches.length; i++) {
            this.branches[i].updateVisuals();
        }
        for (let i = 0; i < this.trunks.length; i++) {
            this.trunks[i].updateVisuals();
        }
    }

    // set up almanac controls & responses
    setupControls() {
        // keyboard controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        // t key toggles transparency for all components
                        case "t":
                        case "T":
                            this.toggleTransparency(this.leaves);
                            this.toggleTransparency(this.stems);
                            this.toggleTransparency(this.branches);
                            this.toggleTransparency(this.trunks);
                        break

                        // q key toggles structural elements visibility for all components
                        case "q":
                        case "Q":
                            this.toggleElements(this.leaves);
                            this.toggleElements(this.stems);
                            this.toggleElements(this.branches);
                            this.toggleElements(this.trunks);
                        break

                        // escape key deselects all components
                        case "Escape":
                            this.deselect(this.leaves);
                            this.deselect(this.stems);
                            this.deselect(this.branches);
                            this.deselect(this.trunks);
                        break
                    }
                break;
            }
        });
    }
}

export { Collection, Tree, Almanac };