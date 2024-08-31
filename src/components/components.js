//define pill shape
function pillShape(rad, len, startX, startZ, numArcPts) {
    pill = [];

    //left semicircle edge
    for (let i = 0; i <= numArcPts/2; i++) {
        pill.push(new BABYLON.Vector3(startX+rad*Math.cos(Math.PI/2+i*2*Math.PI/numArcPts), 0, startZ+rad*Math.sin(Math.PI/2+i*2*Math.PI/numArcPts)));
    }

    //flat edge
    if (len > 0) {
        pill.push(new BABYLON.Vector3(startX+len, 0, startZ-1*rad));
    }

    //right semicircle edge
    for (let i = 0; i <= numArcPts/2; i++) {
        pill.push(new BABYLON.Vector3(startX+len+rad*Math.cos(-Math.PI/2+i*2*Math.PI/numArcPts), 0, startZ+rad*Math.sin(-Math.PI/2+i*2*Math.PI/numArcPts)));
    }

    return pill;
}

//define component class
class Component {
    constructor(scene, snapDist, snapRot, [x, y, z, ax, ay, az]) {

        //initialize properties
        this.scene = scene; //scene hosting component
        this.ID = null; //initialize null component ID
        this.x = 0; //x position (of local origin), initialize to 0 as specific components set starting position & rotation
        this.y = 0; //y position (of local origin), initialize to 0 as specific components set starting position & rotation
        this.z = 0; //z position (of local origin), initialize to 0 as specific components set starting position & rotation
        this.ax = 0; //x rotation (in degrees, about local origin), initialize to 0 as specific components set starting position & rotation
        this.ay = 0; //y rotation (in degrees, about local origin), initialize to 0 as specific components set starting position & rotation
        this.az = 0; //z rotation (in degrees, about local origin), initialize to 0 as specific components set starting position & rotation
        this.type = null; //initialize null component type
        this.mesh = null; //initialize null mesh
        this.selected = false; //toggle for if component is selected

        //initialize gizmos
        this.dxGizmo = null;
        this.dyGizmo = null;
        this.dzGizmo = null;
        this.rxGizmo = null;
        this.ryGizmo = null;
        this.rzGizmo = null;
        this.snapDist = snapDist;
        this.snapRot = snapRot;

        //set axis colors
        this.xCol = new BABYLON.Color3(1, 0, 0);
        this.yCol = new BABYLON.Color3(0, 1, 0);
        this.zCol = new BABYLON.Color3(0, 0, 1);

        //default material
        this.defMat = new BABYLON.StandardMaterial("defMat", scene);
        this.defCol = new BABYLON.Color3(1, 1, 1);
        this.defMat.diffuseColor = this.defCol;

        //hover material
        this.hovMat = new BABYLON.StandardMaterial("hovMat", scene);
        this.hovCol = new BABYLON.Color3(1, 1, 0);
        this.hovMat.diffuseColor = this.hovCol;

        //selected material
        this.selMat = new BABYLON.StandardMaterial("selMat", scene);
        this.selCol = new BABYLON.Color3(0, 1, 0);
        this.selMat.diffuseColor = this.selCol;
    }

    //move component (globally)
    move(dx, dy, dz) {
        
        //update position properties
        this.x += dx;
        this.y += dy;
        this.z += dz;

        //move mesh
        this.mesh.translate(new BABYLON.Vector3(dx, dy, dz), 1, BABYLON.Space.WORLD);
    }

    //rotate component (in degrees, about local origin)
    rotate(rx, ry, rz) {

        //update rotation properties
        this.ax += rx;
        this.ay += ry;
        this.az += rz;

        //rotate mesh
        this.mesh.addRotation(0, 0, rz*Math.PI/180);
        this.mesh.addRotation(0, ry*Math.PI/180, 0);
        this.mesh.addRotation(rx*Math.PI/180, 0, 0);
    }

    //show component
    show() {
        this.mesh.setEnabled(true);
    }

    //hide component
    hide() {
        this.mesh.setEnabled(false);
    }

    //toggle component visibility
    toggle() {
        this.mesh.setEnabled((this.mesh.isEnabled() ? false : true));
    }

    //delete component
    delete() {
        this.mesh.dispose();
    }

    //set up component controls & responses
    setupControls() {
        //initialize mesh material
        this.mesh.material = this.defMat;

        //create gizmos
        this.dxGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(1, 0, 0), this.xCol);
        this.dyGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(0, 1, 0), this.yCol);
        this.dzGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(0, 0, 1), this.zCol);
        this.rxGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(1, 0, 0), this.xCol);
        this.ryGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 1, 0), this.yCol);
        this.rzGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 0, 1), this.zCol);

        //adjust gizmo snap distance
        this.dxGizmo.snapDistance = this.snapDist;
        this.dyGizmo.snapDistance = this.snapDist;
        this.dzGizmo.snapDistance = this.snapDist;
        this.rxGizmo.snapDistance = this.snapRot*Math.PI/180;
        this.ryGizmo.snapDistance = this.snapRot*Math.PI/180;
        this.rzGizmo.snapDistance = this.snapRot*Math.PI/180;

        //hover over component
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh, "material", this.defMat));
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh, "material", this.hovMat));

        //click (select) component
            //selection coloring
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this, "selected", true))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this, "selected", false));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.defMat, "diffuseColor", this.selCol))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.defMat, "diffuseColor", this.defCol));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.hovMat, "diffuseColor", this.selCol))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.hovMat, "diffuseColor", this.hovCol));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.mesh, "material", this.selMat))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.mesh, "material", this.hovMat));

            //gizmo visibility
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.dxGizmo, "attachedMesh", this.mesh))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.dxGizmo, "attachedMesh", null));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.dyGizmo, "attachedMesh", this.mesh))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.dyGizmo, "attachedMesh", null));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.dzGizmo, "attachedMesh", this.mesh))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.dzGizmo, "attachedMesh", null));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.rxGizmo, "attachedMesh", this.mesh))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.rxGizmo, "attachedMesh", null));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.ryGizmo, "attachedMesh", this.mesh))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.ryGizmo, "attachedMesh", null));
            this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.rzGizmo, "attachedMesh", this.mesh))
                .then(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, this.rzGizmo, "attachedMesh", null));
    }
}

//define leaf class (fabric elements)
class Leaf extends Component {
    constructor(scene, snapDist, snapRot, [x, y, z, ax, ay, az], lenX, lenY) {
        super(scene, snapDist, snapRot, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "leaf"; //component type
        this.lenX = lenX; //leaf length in x-dir
        this.lenY = lenY; //leaf length in y-dir

        //create mesh
        const plane = BABYLON.MeshBuilder.CreatePlane("leaf", {height:lenY, width:lenX, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        const planeMat = new BABYLON.StandardMaterial("planeMat", scene);
        planeMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        plane.material = planeMat;
        
        //create outline
        /*
        this.mesh.enableEdgesRendering();
        this.mesh.edgesWidth = 5.0;
        this.mesh.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
        */
        const path = [
            new BABYLON.Vector3(-lenX/2, -lenY/2, 0),
            new BABYLON.Vector3(lenX/2, -lenY/2, 0),
            new BABYLON.Vector3(lenX/2, lenY/2, 0),
            new BABYLON.Vector3(-lenX/2, lenY/2, 0),
        ];
        path.push(path[0]);
        const outline = BABYLON.MeshBuilder.CreateTube("outline", {path:path, radius:0.01, tessellation:16});
        const outlineMat = new BABYLON.StandardMaterial("outlineMat", scene);
        outlineMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        outline.material = outlineMat;

        //merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes([plane, outline], true, true, undefined, false, true);
        this.mesh.addRotation(-Math.PI/2, 0, 0); //rotate to default orientation

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //initialize controls
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define stem class (rods for connections or as frames)
class Stem extends Component {
    constructor(scene, snapDist, snapRot, [x, y, z, ax, ay, az], angleBend, lenStem, radStem, radFill, radConn, lenConn, numArcPts, numFillPts) {
        super(scene, snapDist, snapRot, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "stem"; //component type
        this.angleBend = angleBend; //stem bend angle (in degrees)
        this.lenStem = lenStem; //stem length from conn. to conn.
        this.radStem = radStem; //outer radius of stem tube
        this.radFill = radFill; //fillet radius of stem bend
        this.radConn = radConn; //radius of connection
        this.lenConn = lenConn; //length of connection
        this.numArcPts = numArcPts; //# of points defining circle arc resolution
        this.numFillPts = numFillPts; //# of points defining fillet arc resolution

        //create tube
        const tubePath = [
            new BABYLON.Vector3(0, 0, 0)
        ]
        for (let i = 0; i <= numFillPts; i++) { //fillet arc
            tubePath.push(new BABYLON.Vector3(lenStem/2-radFill*Math.tan(angleBend*Math.PI/360)+radFill*Math.sin(i*angleBend*Math.PI/180/numFillPts), 0, radFill*(1-Math.cos(i*angleBend*Math.PI/180/numFillPts))));
        }
        tubePath.push(new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)*Math.sin(angleBend*Math.PI/180)));
        var tube = BABYLON.MeshBuilder.CreateTube("tube", {path:tubePath, radius:radStem, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //create male connection
        const maleConnPath = [
            new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)*Math.sin(angleBend*Math.PI/180)),
            new BABYLON.Vector3((lenStem/2)+(lenStem/2+lenConn)*(Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2+lenConn)*Math.sin(angleBend*Math.PI/180))
        ];
        var maleConn = BABYLON.MeshBuilder.CreateTube("maleConn", {path:maleConnPath, radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //create female connection
        const femConnPath = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(lenConn, 0, 0)
        ];
        var femConn = BABYLON.MeshBuilder.CreateTube("femConn", {path:femConnPath, radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //create cap (on female end)
        const circle = pillShape(radStem, 0, 0, 0, numArcPts);
        const hole = [pillShape(radConn, 0, 0, 0, numArcPts)];
        var cap = BABYLON.MeshBuilder.ExtrudePolygon("cap", {shape:circle, holes:hole, depth:0, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        cap.addRotation(0, 0, Math.PI/2);

        //merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes([tube, maleConn, femConn, cap], true, true, undefined, false, false);
        this.mesh.addRotation(-Math.PI/2, Math.PI/2, 0); //rotate to default orientation

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //initialize controls
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define branch class (frame members with holes & slots)
class Branch extends Component {
    constructor(scene, snapDist, snapRot, [x, y, z, ax, ay, az], lenBranch, thickBranch, radBranch, radHole, spacHole, lenSlot, numArcPts) {
        super(scene, snapDist, snapRot, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "branch"; //component type
        this.lenBranch = lenBranch; //branch length from end hole to end hole
        this.thickBranch = thickBranch; //branch thickness
        this.radBranch = radBranch; //outer radius of branch profile
        this.radHole = radHole; //radius of holes
        this.spacHole = spacHole; //center-to-center spacing between holes
        this.lenSlot = lenSlot; //max length of slot hole
        this.numArcPts = numArcPts; //# of points defining circle arc resolution

        //create profile shape
        const profile = pillShape(radBranch, lenBranch, 0, 0, numArcPts);

        //create hole shapes
        const holes = [];

            //left circle hole is local origin
            const leftHole = pillShape(radHole, 0, 0, 0, numArcPts);
            holes.push(leftHole);

            //slot holes, max length
            let spacRem = lenBranch-2*spacHole;
            let startSlot = spacHole;
            while (spacRem >= lenSlot) {
                const slotHole = pillShape(radHole, lenSlot, startSlot, 0, numArcPts);
                holes.push(slotHole);
                spacRem -= (lenSlot+spacHole);
                startSlot += lenSlot+spacHole;
            }

            //slot holes, shorter
            const slotHole = pillShape(radHole, spacRem, startSlot, 0, numArcPts);
            holes.push(slotHole);

            //right circle hole
            const rightHole = pillShape(radHole, 0, lenBranch, 0, numArcPts);
            holes.push(rightHole);

        //extrude & create mesh
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon("branch", {shape:profile, holes:holes, depth:thickBranch, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        this.mesh.addRotation(-Math.PI/2, 0, 0); //rotate to default orientation

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //initialize controls
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define trunk class (plank tiles with holed ribs)
class Trunk extends Component {
    constructor(scene, snapDist, snapRot, [x, y, z, ax, ay, az], lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, radHole, spacHole, overhang, numArcPts) {
        super(scene, snapDist, snapRot, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "trunk"; //component type
        this.lenTrunk = lenTrunk; //trunk length from end hole to end hole
        this.lenTile = lenTrunk+2*(2*radRib+overhang); //tile length
        this.widthTile = widthTile; //tile width
        this.thickTile = thickTile; //tile thickness
        this.numRibs = numRibs; //# of ribs
        this.thickRib = thickRib; //rib thickness
        this.radRib = radRib; //outer radius of rib profile
        this.spacRib = spacRib; //clear spacing between ribs
        this.edgeRib = edgeRib; //tile side edge distance before first rib
        this.radHole = radHole; //radius of holes
        this.spacHole = spacHole; //center-to-center spacing between holes
        this.overhang = overhang; //tile end edge distance overhanging rib end
        this.numArcPts = numArcPts; //# of points defining circle arc resolution

        const meshes = [];

        //create tile
        const rect = [
            new BABYLON.Vector3(-2*radRib-overhang, 0, 0),
            new BABYLON.Vector3(-2*radRib-overhang+this.lenTile, 0, 0),
            new BABYLON.Vector3(-2*radRib-overhang+this.lenTile, 0, widthTile),
            new BABYLON.Vector3(-2*radRib-overhang, 0, widthTile)
        ];
        const tile = BABYLON.MeshBuilder.ExtrudePolygon("tile", {shape:rect, depth:thickTile, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        tile.addRotation(Math.PI/2, 0, 0);
        tile.translate(new BABYLON.Vector3(0, 0, 2*radRib), 1, BABYLON.Space.WORLD);
        meshes.push(tile);

        //create ribs
        for (let j = 0; j < numRibs; j++) {
            const profile = [];

            //top left quarter-circle
            for (let i = 0; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(radRib*(-2+Math.sin(i*2*Math.PI/numArcPts)), 0, radRib*Math.cos(i*2*Math.PI/numArcPts)));
            }
            
            //bottom left quarter-circle
            for (let i = 1; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(-radRib*Math.cos(i*2*Math.PI/numArcPts), 0, -radRib*Math.sin(i*2*Math.PI/numArcPts)));
            }

            //flat edge
            profile.push(new BABYLON.Vector3(lenTrunk, 0, -radRib));

            //bottom right quarter-circle
            for (let i = 1; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(lenTrunk+radRib*Math.sin(i*2*Math.PI/numArcPts), 0, -radRib*Math.cos(i*2*Math.PI/numArcPts)));
            }

            //top right quarter-circle
            for (let i = 1; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(lenTrunk+radRib*(2-Math.cos(i*2*Math.PI/numArcPts)), 0, radRib*Math.sin(i*2*Math.PI/numArcPts)));
            }

            //holes
            const holes = [];
            for (let i = 0; i <= lenTrunk; i += spacHole) {
                const hole = pillShape(radHole, 0, i, 0, numArcPts);
                holes.push(hole);
            }

            //extrude & create mesh
            const rib = BABYLON.MeshBuilder.ExtrudePolygon("rib", {shape:profile, holes:holes, depth:thickRib, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            rib.translate(new BABYLON.Vector3(0, -edgeRib-j*(thickRib+spacRib), 0), 1, BABYLON.Space.WORLD);
            meshes.push(rib);
        }

        //merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
        this.mesh.addRotation(-Math.PI/2, 0, 0); //rotate to default orientation

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //initialize controls
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define tree class (group of components --> furniture)
class Tree {
    constructor(scene, snapDist, snapRot, numArcPts, numFillPts) {

        //initialize properties
        this.scene = scene; //scene hosting tree
        this.components = []; //array of components in tree
        this.componentIDs = []; //array of component IDs in tree
        this.nextID = 1; //initialize next component ID val
        this.snapDist = snapDist; //snap distance for gizmo controls
        this.snapRot = snapRot; //snap rotation angle (in degrees) for gizmo controls
        this.numArcPts = numArcPts; //# of points defining circle arc resolution
        this.numFillPts = numFillPts; //# of points defining fillet arc resolution
    }

    //add component
    add(component) {
        this.components.push(component);
        component.ID = this.nextID;
        this.componentIDs.push(this.nextID);
        this.nextID++;
    }

    //copy component
    
    //remove component
    remove(component) {
        const index = this.componentIDs.indexOf(component.ID);
        if (index > -1) {
            this.componentIDs.splice(index, 1);
            this.components.splice(index, 1);
            component.delete();
        }
    }

    //clear all components
    clear() {
        for (let i = 0; i < this.components.length; i++) {
            this.remove(this.components[i]);
        }
    }

    //save tree file
    save() {
        const contents = [];
        for (let i = 0; i < this.components.length; i++) {
            const c = this.components[i];
            if (c.type == "leaf") {
                contents.push([c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenX, c.lenY, '\n']);
            } else if (c.type == "stem") {
                contents.push([c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.angleBend, c.lenStem, c.radStem, c.radFill, c.radConn, c.lenConn, '\n']);
            } else if (c.type == "branch") {
                contents.push([c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenBranch, c.thickBranch, c.radBranch, c.radHole, c.spacHole, c.lenSlot, '\n']);
            } else if (c.type == "trunk") {
                contents.push([c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenTrunk, c.widthTile, c.thickTile, c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, c.spacHole, c.overhang, '\n']);
            }
        }
        const file = new Blob(contents, {type: "text/plain;charset=utf-8",});
        saveAs(file, "myTree.txt");
    }

    //load tree file
    load() {

        //process file from local browser
        const input = document.createElement('input');
        input.type = 'file';
        input.click();
        input.onchange = _ => {
            const files = input.files;
            if (files.length > 0) {
                const reader = new FileReader();
                reader.readAsText(files[0], "utf-8");
                reader.onload = _ => {
                    const lines = reader.result.split('\n');

                    //create components per file lines
                    for (let j = 0; j < lines.length; j++) {
                        const line = lines[j];
                        const dataString = line.split(',');
                        const data = [dataString[0]];
                        for (let i = 1; i < dataString.length; i++) {
                            data.push(parseFloat(dataString[i]));
                        }
                        if (data[0] == "leaf") {
                            this.add(new Leaf(this.scene, this.snapDist, this.snapRot, [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8]));
                        } else if (data[0] == "stem") {
                            this.add(new Stem(this.scene, this.snapDist, this.snapRot, [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], this.numArcPts, this.numFillPts));
                        } else if (data[0] == "branch") {
                            this.add(new Branch(this.scene, this.snapDist, this.snapRot, [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], this.numArcPts));
                        } else if (data[0] == "trunk") {
                            this.add(new Trunk(this.scene, this.snapDist, this.snapRot, [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15], data[16], data[17], this.numArcPts));
                        }
                    }
                }
            }
        }
    }
}

//create scene
const createScene = async function () { //for debugging
//const createScene = function () {
	
    ///*console for debugging
    await new Promise(r => {
        var s = document.createElement("script");
        s.src = "https://console3.babylonjs.xyz/console3-playground.js";
        document.head.appendChild(s);
        s.onload = r();
    })
    //*/

    //setup scene
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);

    ///*console for debugging
    var c3 = window.console3;
    c3.create(engine, scene);
    c3.log("scene created");
    //*/

    //setup camera
	const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI/4, Math.PI/4, 100, BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);
    camera.inputs.attached.keyboard.angularSpeed = 0.005;
    camera.minZ = 0.01;
    camera.maxZ = 1000;
    camera.wheelDeltaPercentage = 0.01;
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoLeft = -36;
    camera.orthoRight = 36;
    const ratio = canvas.height/canvas.width;
    const setOrthoCameraTopBottom = (camera, ratio) => {
        camera.orthoTop = camera.orthoRight*ratio;
        camera.orthoBottom = camera.orthoLeft*ratio;
    }
    setOrthoCameraTopBottom(camera, ratio);
    let oldRadius = camera.radius;
    scene.onBeforeRenderObservable.add(() => {
        if (oldRadius !== camera.radius) {
            const radiusChangeRatio = camera.radius/oldRadius;
            camera.orthoLeft *= radiusChangeRatio;
            camera.orthoRight *= radiusChangeRatio;
            oldRadius = camera.radius;
            setOrthoCameraTopBottom(camera, ratio);
        }
    })

    //setup light
	const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 50, 0));

	//input properties
    const lenX = 6; //leaf length in x-dir
    const lenY = 4; //leaf length in y-dir

    const radHole = 0.25; //radius of holes
    const spacHole = 2; //center-to-center spacing between holes
    
    const angleBend = 90; //stem bend angle (in degrees)
    const lenStem = 4; //stem length from conn. to conn.
    const radStem = radHole; //outer radius of stem tube
    const radFill = 1; //fillet radius of stem bend
    const radConn = radStem/2; //radius of connection
    const lenConn = 0.5; //length of connection

    const lenBranch = 22; //branch length from end hole to end hole
    const thickBranch = 1; //branch thickness
    const radBranch = 1; //outer radius of branch profile
    const lenSlot = 6; //max length of slot hole

    const lenTrunk = 22; //trunk length from end hole to end hole
    const widthTile = 4; //tile width
    const thickTile = 1; //tile thickness
    const numRibs = 2; //# of ribs
    const thickRib = 1; //rib thickness
    const radRib = 1; //outer radius of rib profile
    const spacRib = thickBranch; //clear spacing between ribs
    const edgeRib = thickBranch; //tile side edge distance before first rib
    const overhang = 1; //tile end edge distance overhanging rib end

    const snapDist = 1; //snap distance for gizmo controls
    const snapRot = 15; //snap rotation angle (in degrees) for gizmo controls
    const numArcPts = 64; //# of points defining circle arc resolution
    const numFillPts = 32; //# of points defining fillet arc resolution

    //create test tree
    testTree = new Tree(scene, snapDist, snapRot, numArcPts, numFillPts);
    /*
    testTree.add(new Leaf(scene, snapDist, snapRot, [0, 0, 0, 0, 0, 0], lenX, lenY));
    testTree.add(new Stem(scene, snapDist, snapRot, [0, 0, 0, 0, 0, 0], angleBend, lenStem, radStem, radFill, radConn, lenConn, numArcPts, numFillPts));
    testTree.add(new Branch(scene, snapDist, snapRot, [0, 0, 0, 0, 0, 0], lenBranch, thickBranch, radBranch, radHole, spacHole, lenSlot, numArcPts));
    testTree.add(new Trunk(scene, snapDist, snapRot, [0, 0, 0, 0, 0, 0], lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, radHole, spacHole, overhang, numArcPts));
    */
    testTree.load();

	return scene;
}


