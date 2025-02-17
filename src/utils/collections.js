import * as BABYLON from 'babylonjs';
import { saveAs } from 'file-saver';
import * as Components from 'utils/components.js';

// Define collection class (group of components)
class Collection {
    constructor(scene, numArcPts, numFillPts) {

        // Initialize properties
        this.scene = scene; // Scene hosting collection
        this.numArcPts = numArcPts; // # of points defining circle arc resolution
        this.numFillPts = numFillPts; // # of points defining fillet arc resolution
        this.structureMode = false; // Toggle for structural analysis mode
        this.showingConnections = false; // Toggle for connection visibility
        this.transparent = false; // Toggle for components transparency
    }

    // Select specified components
    select(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].select();
        }
    }

    // Deselect specified components
    deselect(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].deselect();
        }
    }

    // Show specified components connections
    showConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].showConnections();
        }
        this.showingConnections = true;
    }

    // Hide specified components connections
    hideConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].hideConnections();
        }
        this.showingConnections = false;
    }

    // Toggle specified components connections visibility
    toggleConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleConnections();
        }
        this.showingConnections = !this.showingConnections;
    }

    // Toggle specified components structural elements visibility
    toggleElements(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleElements();
        }
        this.structureMode = !this.structureMode;
    }

    // Set the specified components materials opaque
    opaque(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].opaque();
        }
        this.transparent = false;
    }

    // Set the specified components materials transparent (xray)
    xray(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].xray();
        }
        this.transparent = true;
    }

    // Toggle specified components transparency
    toggleTransparency(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleTransparency();
        }
        this.transparent = !this.transparent;
    }
}

// Define tree class (arrangement of components for furniture design)
class Tree extends Collection {
    constructor(scene, numArcPts, numFillPts, snapDist, snapRot) {
        super(scene, numArcPts, numFillPts);

        // Initialize properties
        this.type = 'tree'; // Collection type
        this.components = []; // Array of components in tree
        this.componentIDs = []; // Array of component IDs in tree
        this.nextID = 1; // Initialize next component ID val
        this.selComponents = []; // Array of selected components in tree
        this.selComponentIDs = []; // Array of selected component IDs in tree
        this.snapDist = snapDist; // Snap distance for gizmo controls
        this.snapRot = snapRot; // Snap rotation angle (in degrees) for gizmo controls
        this.showingGizmos = false; // Toggle for gizmo visibility
        this.history = []; // Array of tree versions for undo
        this.future = []; // Array of tree versions for redo

        // Set up controls
        this.setupControls();
    }

    // Select all components
    selectAll() {
        this.select(this.components);
    }

    // Deselect all components
    deselectAll() {
        this.deselect(this.components);
        this.hideGizmos(this.components);
        this.deselectConnections(this.components);
    }

    // Add component
    add(component) {
        this.components.push(component);
        component.ID = this.nextID;
        this.componentIDs.push(this.nextID);
        this.nextID++;
    }

    // Copy specified components
    async copy(components) {
        await new Promise((resolve) => {
            for (let i = 0; i < components.length; i++) {
                // Create duplicate component
                const c = components[i];
                if (c.type == 'leaf') {
                    this.add(new Components.Leaf(this.scene, this, this.snapDist, this.snapRot,
                         [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenX, c.lenY));
                } else if (c.type == 'stem') {
                    this.add(new Components.Stem(this.scene, this, this.snapDist, this.snapRot, 
                        [c.x, c.y, c.z, c.ax, c.ay, c.az], c.angleBend, c.lenStem, c.radStem, 
                        c.radFill, c.radConn, c.lenConn, c.thickBT, c.reflected, 
                        this.numArcPts, this.numFillPts));
                } else if (c.type == 'branch') {
                    this.add(new Components.Branch(this.scene, this, this.snapDist, this.snapRot, 
                        [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenBranch, c.thickBranch, 
                        c.radBranch, c.radHole, c.spacHole, c.lenSlot, c.reflected, 
                        this.numArcPts));
                } else if (c.type == 'trunk') {
                    this.add(new Components.Trunk(this.scene, this, this.snapDist, this.snapRot, 
                        [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenTrunk, c.widthTile, c.thickTile, 
                        c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, 
                        c.spacHole, c.overhang, c.reflected, this.numArcPts));
                }

                // Maintain visuals
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

            resolve();
        });

        // Log updated tree
        this.log();
    }

    // Copy selected components
    copySelected() {
        this.copy(this.selComponents);
    }
    
    // Delete specified components
    async delete(components) {
        return new Promise((resolve) => {
            // Temporarily copy components array so deletion does not affect iteration
            var temp = [];
            for (let i = 0; i < components.length; i++) {
                temp.push(components[i]);
            }

            // Delete components
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

            resolve();
        });
    }

    // Delete specified components & log updated tree
    async formalDelete(components) {
        await new Promise((resolve) => {
            this.delete(components);

            resolve();
        });
        
        // Log updated tree
        this.log();
    }

    // Delete selected components
    formalDeleteSelected() {
        this.formalDelete(this.selComponents);
    }

    // Show specified components gizmos
    showGizmos(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].showGizmos();
        }
        if (components.length > 0) {this.showingGizmos = true};
    }

    // Hide specified components gizmos
    hideGizmos(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].hideGizmos();
        }
        if (components.length > 0) {this.showingGizmos = false};
    }

    // Toggle specified components gizmos visibility
    toggleGizmos(components) {
        if (this.showingGizmos) {
            this.hideGizmos(components);
        } else {
            this.showGizmos(components);
        }
    }

    // Toggle selected components gizmos visibility
    toggleGizmosSelected() {
        if (this.selComponents.length > 0) {
            this.toggleGizmos(this.selComponents);
        }
    }

    // Toggle all components connections visibility
    toggleAllConnections() {
        this.toggleConnections(this.components);
        this.deselectConnections(this.components);
    }

    // Deselect specified components connections
    deselectConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].deselectConnections();
        }
    }

    // Checks for intersections between specified components
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

    // Checks for connections between specified components
    checkConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].checkConnections(components);
        }
    }

    // Reflects specified components
    async reflect(components) {
        await new Promise((resolve) => {
            const old = [];
            const num = components.length;
            for (let i = 0; i < num; i++) {
                const c = components[i];
                if (c.type == 'stem' || c.type == 'branch' || c.type == 'trunk') {
                    old.push(c);

                    // Update reflected toggle
                    let newReflected = 1;
                    if (c.reflected == 1) {
                        newReflected = 0;
                    }
                    
                    // Create reflected version of component
                    if (c.type == 'stem') {
                        this.add(new Components.Stem(this.scene, this, this.snapDist, this.snapRot, 
                            [c.x, c.y, c.z, c.ax, c.ay, c.az], c.angleBend, c.lenStem, c.radStem, 
                            c.radFill, c.radConn, c.lenConn, c.thickBT, newReflected, 
                            this.numArcPts, this.numFillPts));
                    } else if (c.type == 'branch') {
                        this.add(new Components.Branch(this.scene, this, this.snapDist, this.snapRot, 
                            [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenBranch, c.thickBranch, 
                            c.radBranch, c.radHole, c.spacHole, c.lenSlot, newReflected, 
                            this.numArcPts));
                    } else if (c.type == 'trunk') {
                        this.add(new Components.Trunk(this.scene, this, this.snapDist, this.snapRot, 
                            [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenTrunk, c.widthTile, c.thickTile, 
                            c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, 
                            c.spacHole, c.overhang, newReflected, this.numArcPts));
                    }

                    // Maintain selections & visuals
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

            // Delete non-reflected (old) components
            this.delete(old);

            resolve();
        });

        // Log updated tree
        this.log();
    }

    // Reflect selected components
    reflectSelected() {
        this.reflect(this.selComponents);
    }

    // Toggle all components transparency
    toggleAllTransparency() {
        this.toggleTransparency(this.components);
    }

    // Updates specified components visuals
    updateVisuals(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].updateVisuals();
        }
    }

    // Set up tree controls & responses
    setupControls() {
        // Default gizmo visibility
        this.hideGizmos(this.components);

        // Keyboard controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        // L key loads tree file
                        case 'l':
                        case 'L':
                            this.load();
                        break

                        // S key saves tree file
                        case 's':
                        case 'S':
                            this.save();
                        break

                        // [ key is undo action
                        case '[':
                            this.undo();
                        break

                        // ] key is redo action
                        case ']':
                            this.redo();
                        break

                        // A key selects all components
                        case 'a':
                        case 'A':
                            this.selectAll();
                        break
                        
                        // Escape key deselects all components
                        case 'Escape':
                            this.deselectAll();
                        break

                        // C key copies selected components
                        case 'c':
                        case 'C':
                            this.copySelected();
                        break

                        // Delete key deletes selected components
                        case 'Delete':
                            this.formalDeleteSelected();
                        break

                        // M key toggles gizmos visibility for selected components
                        case 'm':
                        case 'M':
                            this.toggleGizmosSelected();
                        break
                        
                        // R key reflects selected components
                        case 'r':
                        case 'R':
                            this.reflectSelected();
                        break

                        // N key toggles connections visibility for all components
                        case 'n':
                        case 'N':
                            this.toggleAllConnections();
                        break

                        // T key toggles transparency for all components
                        case 't':
                        case 'T':
                            this.toggleAllTransparency();
                        break

                        // Q key toggles structural elements visibility for all components
                        case 'q':
                        case 'Q':
                            //this.toggleElements(this.components);
                        break
                    }
                break;
            }
        });
    }

    // Compress tree to string lines
    compress() {
        const lines = [];
        for (let i = 0; i < this.components.length; i++) {
            const c = this.components[i];
            let line = [];
            if (c.type == 'leaf') {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenX, c.lenY, '\n'];
            } else if (c.type == 'stem') {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.angleBend, c.lenStem, 
                    c.radStem, c.radFill, c.radConn, c.lenConn, c.thickBT, c.reflected, '\n'];
            } else if (c.type == 'branch') {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenBranch, c.thickBranch, 
                    c.radBranch, c.radHole, c.spacHole, c.lenSlot, c.reflected, '\n'];
            } else if (c.type == 'trunk') {
                line = [c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenTrunk, c.widthTile, 
                    c.thickTile, c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, 
                    c.radHole, c.spacHole, c.overhang, c.reflected, '\n'];
            }
            lines.push(line.toString());
        }
        return lines;
    }

    // Expand string lines to tree
    expand(lines) {
        for (let j = 0; j < lines.length; j++) {
            // Process component from string
            let line = lines[j];
            let dataString = line.split(',');
            let data = [dataString[0]];
            for (let i = 1; i < dataString.length; i++) {
                data.push(parseFloat(dataString[i]));
            }
            
            // Add component
            if (data[0] == 'leaf') {
                this.add(new Components.Leaf(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8]));
            } else if (data[0] == 'stem') {
                this.add(new Components.Stem(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], 
                    data[9], data[10], data[11], data[12], data[13], data[14],
                    this.numArcPts, this.numFillPts));
            } else if (data[0] == 'branch') {
                this.add(new Components.Branch(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], 
                    data[9], data[10], data[11], data[12], data[13], this.numArcPts));
            } else if (data[0] == 'trunk') {
                this.add(new Components.Trunk(this.scene, this, this.snapDist, this.snapRot, 
                    [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], 
                    data[9], data[10], data[11], data[12], data[13], data[14], data[15], 
                    data[16], data[17], data[18], this.numArcPts));
            }
            
            // Maintain visuals
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

    // Log tree version (in history)
    log() {
        const maxVersions = 20;

        // Add version to history
        this.history.push(this.compress());

        // Remove oldest version if exceeding max versions
        while (this.history.length > maxVersions) {
            this.history.shift();
        }
    }

    // Undo action (go back to previous tree version in history)
    undo() {
        if (this.history.length > 1) {
            // Store current tree length
            let num = this.components.length;
            
            // Move current tree to future
            this.future.push(this.history.pop());

            // Expand previous tree version
            this.expand(this.history[this.history.length-1]);

            // Clear current tree
            this.delete(this.components.slice(0, num));
        }
    }

    // Redo action (go back to undone tree version in future)
    redo() {
        if (this.future.length > 0) {
            // Store current tree length
            let num = this.components.length;
        
            // Move undone tree from future to history
            this.history.push(this.future.pop());

            // Expand undone tree version
            this.expand(this.history[this.history.length-1]);

            // Clear current tree
            this.delete(this.components.slice(0, num));
        }
    }

    // Save tree file
    save() {
        const file = new Blob(this.compress(), {type: 'text/plain;charset=utf-8',});
        saveAs(file, 'myTree.txt');
    }

    // Load tree file
    async load() {
        // Store previous tree length
        let num = this.components.length;
    
        // Process file from local browser
        const input = document.createElement('input');
        input.type = 'file';
        input.click();
    
        // Wrap file selection and reading in a promise
        await new Promise((resolve, reject) => {
            input.onchange = () => {
                const files = input.files;
                if (files.length > 0) {
                    const reader = new FileReader();
                    reader.readAsText(files[0], 'utf-8');
                    reader.onload = () => {
                        // Create components per file lines
                        const lines = reader.result.split('\n');
                        this.expand(lines);

                        // Clear previous tree
                        this.delete(this.components.slice(0, num));

                        resolve();
                    };
                    reader.onerror = () => {
                        reject(reader.error);
                    };
                } else {
                    reject(new Error('No file selected'));
                }
            };
        });

        // Log loaded tree
        this.log();
    }
}

// Define almanac class (library of components for browsing & use in trees)
class Almanac extends Collection {
    constructor(scene, numArcPts, numFillPts) {
        super(scene, numArcPts, numFillPts);

        // Initialize properties
        this.type = 'almanac'; // Collection type
        this.leaves = []; // Array of leaf components in almanac
        this.stems = []; // Array of stem components in almanac
        this.branches = []; // Array of branch components in almanac
        this.trunks = []; // Array of trunk components in almanac

        // Set up controls
        this.setupControls();
    }

    // Generate leaves in almanac per input criteria
    generateLeaves([x0, y0, z0], [lenXMin, lenXIncr, lenXMax], [lenYMin, lenYIncr, lenYMax]) {
        // Initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dx = 2;
        const dz = 2;

        // Generate leaves
        for (let lenX = lenXMin; lenX <= lenXMax; lenX += lenXIncr) {
            for (let lenY = lenYMin; lenY <= lenYMax; lenY += lenYIncr) {
                this.leaves.push(new Components.Leaf(this.scene, this, 0, 0, 
                    [x, y, z, 0, 0, 0], lenX, lenY));
                z += lenY+dz;
            }
            z = z0;
            x += lenX+dx;
        }   
    }

    // Generate stems in almanac per input criteria
    generateStems([x0, y0, z0], [angleBendMin, angleBendIncr, angleBendMax], 
        [lenStemMin, lenStemIncr, lenStemMax], radStem, radFill, radConn, lenConn, thickBT) {
        // Initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dy = 2;
        const dz = 2;
        
        // Generate stems
        for (let angleBend = angleBendMin; angleBend <= angleBendMax; angleBend += angleBendIncr) {
            for (let lenStem = lenStemMin; lenStem <= lenStemMax; lenStem += lenStemIncr) {
                this.stems.push(new Components.Stem(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], 
                    angleBend, lenStem, radStem, radFill, radConn, lenConn, thickBT, 0, 
                    this.numArcPts, this.numFillPts));
                z += lenStem+dz;
            }
            z = z0;
            y += lenStemMax/2+dy;
        }   
    }

    // Generate branches in almanac per input criteria
    generateBranches([x0, y0, z0], [lenBranchMin, lenBranchIncr, lenBranchMax], thickBranch, 
        radBranch, radHole, spacHole, lenSlot) {
        // Initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dy = 2;

        // Generate branches
        for (let lenBranch = lenBranchMin; lenBranch <= lenBranchMax; lenBranch += lenBranchIncr) {
            this.branches.push(new Components.Branch(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], 
                lenBranch, thickBranch, radBranch, radHole, spacHole, lenSlot, 0, this.numArcPts));
            y += 2*radBranch+dy;
        }
    }

    // Generate trunks in almanac per input criteria
    generateTrunks([x0, y0, z0], [widthTileMin, widthTileIncr, widthTileMax], 
        [lenTrunkMin, lenTrunkIncr, lenTrunkMax], thickTile, thickRib, radRib, spacRib, edgeRib, 
        radHole, spacHole, overhang) {
        // Initialize position variables
        let x = x0;
        let y = y0;
        let z = z0;
        const dx = 2;
        const dy = 2;

        // Generate trunks
        for (let widthTile = widthTileMin; widthTile <= widthTileMax; widthTile += widthTileIncr) {
            const numRibs = Math.floor((widthTile-edgeRib-thickRib)/(thickRib+spacRib))+1;
            for (let lenTrunk = lenTrunkMin; lenTrunk <= lenTrunkMax; lenTrunk += lenTrunkIncr) {
                this.trunks.push(new Components.Trunk(this.scene, this, 0, 0, [x, y, z, 0, 0, 0], 
                    lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, 
                    radHole, spacHole, overhang, 0, this.numArcPts));
                x += lenTrunk+2*(2*radRib+overhang)+dx;
            }
            x = x0;
            y += 2*radRib+thickTile+dy;
        }
    }

    // Delete specified components
    delete(components) {
        for (let i = components.length-1; i >= 0; i--) {
            components[i].delete();
        }
    }

    // Delete all components in almanac
    deleteAll() {
        this.delete(this.leaves);
        this.delete(this.stems);
        this.delete(this.branches);
        this.delete(this.trunks);
    }

    // Updates all component visuals
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

    // Set up almanac controls & responses
    setupControls() {
        // Keyboard controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        // T key toggles transparency for all components
                        case 't':
                        case 'T':
                            this.toggleTransparency(this.leaves);
                            this.toggleTransparency(this.stems);
                            this.toggleTransparency(this.branches);
                            this.toggleTransparency(this.trunks);
                        break

                        // Q key toggles structural elements visibility for all components
                        case 'q':
                        case 'Q':
                            this.toggleElements(this.leaves);
                            this.toggleElements(this.stems);
                            this.toggleElements(this.branches);
                            this.toggleElements(this.trunks);
                        break

                        // Escape key deselects all components
                        case 'Escape':
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