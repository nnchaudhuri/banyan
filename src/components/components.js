//define pill shape (Vector3 array)
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

//define connection class
class Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az]) {
        //initialize properties
        this.scene = scene; //scene hosting connection
        this.component = component; //component the connection is a part of
        this.ID = ID; //connection ID
        this.x = 0; //x position (of local origin), initialize to 0 as specific connections set starting position & rotation
        this.y = 0; //y position (of local origin), initialize to 0 as specific connections set starting position & rotation
        this.z = 0; //z position (of local origin), initialize to 0 as specific connections set starting position & rotation
        this.ax = 0; //x rotation (in degrees, about local origin), initialize to 0 as specific connections set starting position & rotation
        this.ay = 0; //y rotation (in degrees, about local origin), initialize to 0 as specific connections set starting position & rotation
        this.az = 0; //z rotation (in degrees, about local origin), initialize to 0 as specific connections set starting position & rotation
        this.type = null; //initialize null connection type
        this.mesh = null; //initialize null mesh
        this.selected = false; //toggle for if connection is selected
        this.used = false; //toggle for if connection is in use
        const alpha = 0.5; //transparency value

        //default material
        this.defMat = new BABYLON.StandardMaterial("defMat", scene);
        this.defCol = new BABYLON.Color3(0, 1, 1);
        this.defMat.diffuseColor = this.defCol;
        this.defMat.alpha = alpha;

        //hover material
        this.hovMat = new BABYLON.StandardMaterial("hovMat", scene);
        this.hovCol = new BABYLON.Color3(1, 1, 0);
        this.hovMat.diffuseColor = this.hovCol;
        this.hovMat.alpha = alpha;

        //selected material
        this.selMat = new BABYLON.StandardMaterial("selMat", scene);
        this.selCol = new BABYLON.Color3(1, 0, 1);
        this.selMat.diffuseColor = this.selCol;
        this.selMat.alpha = alpha;
    }

    //move connection (globally)
    move(dx, dy, dz) {
        //update position properties
        this.x += dx;
        this.y += dy;
        this.z += dz;

        //move mesh
        this.mesh.position.x += dx;
        this.mesh.position.y += dy;
        this.mesh.position.z += dz;
    }

    //rotate connection (in degrees, about local origin) FIX!
    rotate(rx, ry, rz) {
        //update rotation properties
        this.ax += rx;
        this.ay += ry;
        this.az += rz;

        //rotate mesh
        this.mesh.rotate(new BABYLON.Vector3(-1, 0, 0), rx*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, -1, 0), ry*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, 0, 1), rz*Math.PI/180, BABYLON.Space.WORLD);
    }

    //show connection
    show() {
        this.mesh.isVisible = true;
    }

    //hide connection
    hide() {
        this.mesh.isVisible = false;
    }

    //toggle connection visibility
    toggle() {
        this.mesh.isVisible = !this.mesh.isVisible;
    }

    //delete connection
    delete() {
        this.mesh.dispose();
    }

    //select connection
    select() {
        //update properties
        this.selected = true;

        //selection coloring
        this.defMat.diffuseColor = this.selCol;
        this.hovMat.diffuseColor = this.selCol;
        this.mesh.material = this.selMat;
    }

    //deselect connection
    deselect() {
        //update properties
        this.selected = false;

        //default coloring
        this.defMat.diffuseColor = this.defCol;
        this.hovMat.diffuseColor = this.hovCol;
        this.mesh.material = this.defMat;
    }

    //set up connection visuals
    setupVisuals() {
        //default visibility
        this.hide();
        
        //initialize mesh material
        this.mesh.material = this.defMat;
    }

    //set up connection controls & responses
    setupControls() {
        //hover over connection
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh, "material", this.defMat));
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh, "material", this.hovMat));

        //click (select) connection
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {this.select()}))
            .then(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {this.deselect()}));
    }
}

//define edge class (side connection of leaf component)
class Edge extends Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az], len) {
        super(scene, component, ID, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "edge"; //connection type

        //create mesh
        this.mesh = BABYLON.MeshBuilder.CreatePlane("edge", {height:len, width:0.25, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define joint class (end connection of stem component & circle hole connections in branch & trunk components)
class Joint extends Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az], rad, len, numArcPts) {
        super(scene, component, ID, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "joint"; //connection type

        //create mesh
        const path = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, len, 0)
        ];
        this.mesh = BABYLON.MeshBuilder.CreateTube("joint", {path:path, radius:rad, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_ALL, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define slot class (slotted hole connections in branch component) FIX!
class Slot extends Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az], rad, len, depth, numArcPts) {
        super(scene, component, ID, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "slot"; //connection type

        //create mesh
        const shape = pillShape(rad, len, 0, 0, numArcPts);
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon("hole", {shape:shape, depth:depth, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

//define component class
class Component {
    constructor(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az]) {
        //initialize properties
        this.scene = scene; //scene hosting component
        this.tree = tree; //tree the component is a part of
        this.ID = null; //initialize null component ID
        this.x = 0; //x position (of local origin), initialize to 0 as specific components set starting position & rotation
        this.y = 0; //y position (of local origin), initialize to 0 as specific components set starting position & rotation
        this.z = 0; //z position (of local origin), initialize to 0 as specific components set starting position & rotation
        this.ax = 0; //x rotation (in degrees, about local origin), initialize to 0 as specific components set starting position & rotation
        this.ay = 0; //y rotation (in degrees, about local origin), initialize to 0 as specific components set starting position & rotation
        this.az = 0; //z rotation (in degrees, about local origin), initialize to 0 as specific components set starting position & rotation
        this.type = null; //initialize null component type
        this.mesh = null; //initialize null mesh
        this.connections = []; //initialize empty connections array
        this.showingConnections = false; //toggle for if connections are visible
        this.BB = []; //initialize empty bounding boxes array (for mesh intersection detection)
        this.BBOffset = 0.05; //offset for bounding boxes from mesh edges
        this.hovering = false; //toggle for if component is being hovered over
        this.selected = false; //toggle for if component is selected
        this.intersecting = false; //toggle for if component is intersecting another component
        this.transparent = false; //toggle for component transparency

        //initialize gizmos
        this.inclGizmos = [true, true, true, false, false, false]; //array of which gizmos to include [dx, dy, dz, rx, ry, rz]
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

        //intersected material
        this.intMat = new BABYLON.StandardMaterial("intMat", scene);
        this.intCol = new BABYLON.Color3(1, 0, 0);
        this.intMat.diffuseColor = this.intCol;
    }

    //move component (globally)
    move(dx, dy, dz) {
        //update position properties
        this.x += dx;
        this.y += dy;
        this.z += dz;

        //move mesh
        this.mesh.position.x += dx;
        this.mesh.position.y += dy;
        this.mesh.position.z += dz;
    }

    //rotate component (in degrees, about local origin) FIX!
    rotate(rx, ry, rz) {
        //update rotation properties
        this.ax += rx;
        this.ay += ry;
        this.az += rz;

        //rotate mesh
        this.mesh.rotate(new BABYLON.Vector3(-1, 0, 0), rx*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, -1, 0), ry*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, 0, 1), rz*Math.PI/180, BABYLON.Space.WORLD);
    }

    //show component
    show() {
        this.mesh.isVisible = true;
    }

    //hide component
    hide() {
        this.mesh.isVisible = false;
    }

    //toggle component visibility
    toggle() {
        this.mesh.isVisible = !this.mesh.isVisible;
    }

    //delete component
    delete() {
        this.mesh.dispose();
    }

    //show gizmos
    showGizmos() {
        if (this.inclGizmos[0]) {this.dxGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[1]) {this.dyGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[2]) {this.dzGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[3]) {this.rxGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[4]) {this.ryGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[5]) {this.rzGizmo.attachedMesh = this.mesh};
    }

    //hide gizmos
    hideGizmos() {
        this.dxGizmo.attachedMesh = null;
        this.dyGizmo.attachedMesh = null;
        this.dzGizmo.attachedMesh = null;
        this.rxGizmo.attachedMesh = null;
        this.ryGizmo.attachedMesh = null;
        this.rzGizmo.attachedMesh = null;
    }

    //select component
    select() {
        //update properties
        this.selected = true;
        const index = this.tree.selComponentIDs.indexOf(this.ID);
        if (index < 0) {
            this.tree.selComponents.push(this);
            this.tree.selComponentIDs.push(this.ID);
        }

        //show gizmos
        if (this.tree.showingGizmos) {
            this.showGizmos();
        }
    }

    //deselect component
    deselect() {
        //update properties
        this.selected = false;
        const index = this.tree.selComponentIDs.indexOf(this.ID);
        if (index > -1) {
            this.tree.selComponentIDs.splice(index, 1);
            this.tree.selComponents.splice(index, 1);
        }

        //hide gizmos
        this.hideGizmos();
        if (this.tree.selComponents.length < 1) {this.tree.showingGizmos = false};
    }

    //show component connections
    showConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].show();
        }
        this.showingConnections = true;
    }

    //hide component connections
    hideConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].hide();
        }
        this.showingConnections = false;
    }

    //toggle component connections visibility
    toggleConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].toggle();
        }
        this.showingConnections = !this.showingConnections;
    }

    //deselect component connections
    deselectConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].deselect();
        }
    }

    //set the component mesh as the parent of the connection meshes
    parentConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].mesh.parent = this.mesh;
        }
    }

    //set the component mesh as the parent of the BB meshes
    parentBB() {
        for (let i = 0; i < this.BB.length; i++) {
            this.BB[i].parent = this.mesh;
        }
    }
        
    //check for mesh intersection between this & another component based on bounding boxes
    intersects(component) {
        for (let j = 0; j < this.BB.length; j++) {
            for (let i = 0; i < component.BB.length; i++) {
                if (this.BB[j].intersectsMesh(component.BB[i], true)) {
                    return true;
                }
            }
        }
        return false;
    }

    //sets the component materials opaque
    opaque() {
        this.defMat.alpha = 1;
        this.hovMat.alpha = 1;
        this.selMat.alpha = 1;
        this.intMat.alpha = 1;
        this.mesh.material.alpha = 1;
        this.transparent = false;
    }

    //sets the component materials transparent (xray)
    xray() {
        const alpha = 0.5;
        this.defMat.alpha = alpha;
        this.hovMat.alpha = alpha;
        this.selMat.alpha = alpha;
        this.intMat.alpha = alpha;
        this.mesh.material.alpha = alpha;
        this.transparent = true;
    }

    //toggle component transparency
    toggleTransparency() {
        if (this.transparent) {
            this.opaque();
        } else {
            this.xray();
        }
    }

    //set up component visuals
    setupVisuals() {
        //initialize mesh material
        this.mesh.material = this.defMat;
        
        //create edges
        this.mesh.enableEdgesRendering();
        this.mesh.edgesWidth = 2.0;
        this.mesh.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
        
        //create outline
        const showOutline = false;
        if (showOutline) {
            this.mesh.renderOutline = true;
            this.mesh.outlineColor = new BABYLON.Color3(0, 0, 0);
            this.mesh.outlineWidth = 0.08;
        }
    }

    //updates component visuals
    updateVisuals() {
        if (this.intersecting) {
            this.mesh.material = this.intMat;
        } else if (this.selected) {
            this.mesh.material = this.selMat;
        } else if (this.hovering) {
            this.mesh.material = this.hovMat;
        } else {
            this.mesh.material = this.defMat;
        }
    }

    //set up component controls & responses
    setupControls() {
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

        //maintain global axes for gizmo orientation
        this.dxGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.dyGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.dzGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.rxGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.ryGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.rzGizmo.updateGizmoRotationToMatchAttachedMesh = false;

        //update component position & rotation properties per gizmo events FIX!
        this.dxGizmo.onSnapObservable.add(event => {this.x += event.snapDistance});
        this.dyGizmo.onSnapObservable.add(event => {this.y += event.snapDistance});
        this.dzGizmo.onSnapObservable.add(event => {this.z += event.snapDistance});
        this.rxGizmo.onSnapObservable.add(event => {this.ax += Math.round(event.snapDistance*180/Math.PI)});
        this.ryGizmo.onSnapObservable.add(event => {this.ay += Math.round(event.snapDistance*180/Math.PI)});
        this.rzGizmo.onSnapObservable.add(event => {this.az += Math.round(event.snapDistance*180/Math.PI)});

        //hover over component
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this, "hovering", false));
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this, "hovering", true));

        //click (select) component
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {this.select()}))
            .then(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {this.deselect()}));
    }
}

//define leaf class (fabric elements)
class Leaf extends Component {
    constructor(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az], lenX, lenY) {
        super(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az]);

        //initialize properties
        this.type = "leaf"; //component type
        this.lenX = lenX; //leaf length in x-dir
        this.lenY = lenY; //leaf length in y-dir

        //create mesh
        this.mesh = BABYLON.MeshBuilder.CreatePlane("leaf", {height:lenY, width:lenX, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        this.mesh.addRotation(-Math.PI/2, 0, 0); //rotate to default orientation

        //create connections
        this.connections.push(new Edge(scene, this, "right", [lenX/2, 0, 0, 0, 0, 0], lenY));
        this.connections.push(new Edge(scene, this, "top", [0, lenY/2, 0, 0, 0, 90], lenX));
        this.connections.push(new Edge(scene, this, "left", [-lenX/2, 0, 0, 0, 0, 0], lenY));
        this.connections.push(new Edge(scene, this, "bottom", [0, -lenY/2, 0, 0, 0, 90], lenX));

        //bounding box
        const rectBB = [
            new BABYLON.Vector3(-lenX/2+this.BBOffset, 0, lenY/2-this.BBOffset),
            new BABYLON.Vector3(lenX/2-this.BBOffset, 0, lenY/2-this.BBOffset),
            new BABYLON.Vector3(lenX/2-this.BBOffset, 0, -lenY/2+this.BBOffset),
            new BABYLON.Vector3(-lenX/2+this.BBOffset, 0, -lenY/2+this.BBOffset)
        ];
        const leafBB = BABYLON.MeshBuilder.ExtrudePolygon("leafBB", {shape:rectBB, depth:this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        leafBB.addRotation(-Math.PI/2, 0, 0);
        leafBB.translate(new BABYLON.Vector3(0, 0, -this.BBOffset/2), 1, BABYLON.Space.WORLD);
        leafBB.isVisible = false;
        this.BB.push(leafBB);
        
        //set parent for connections & BB
        this.parentConnections();
        this.parentBB();

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, false, false, true]; //array of which gizmos to include [dx, dy, dz, rx, ry, rz]
    }
}

//define stem class (rods for connections or as frames)
class Stem extends Component {
    constructor(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az], angleBend, lenStem, radStem, radFill, radConn, lenConn, numArcPts, numFillPts) {
        super(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az]);

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
        const tubePath = [new BABYLON.Vector3(0, 0, 0)];
        for (let i = 0; i <= numFillPts; i++) { //fillet arc
            tubePath.push(new BABYLON.Vector3(lenStem/2-radFill*Math.tan(angleBend*Math.PI/360)+radFill*Math.sin(i*angleBend*Math.PI/180/numFillPts), 0, 
                radFill*(1-Math.cos(i*angleBend*Math.PI/180/numFillPts))));
        }
        tubePath.push(new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)*Math.sin(angleBend*Math.PI/180)));
        var tube = BABYLON.MeshBuilder.CreateTube("tube", {path:tubePath, radius:radStem, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

            //bounding boxes
            const rectBB = [
                new BABYLON.Vector3(-radStem+this.BBOffset/2, 0, -radStem+this.BBOffset/2),
                new BABYLON.Vector3(-radStem+this.BBOffset/2, 0, radStem-this.BBOffset/2),
                new BABYLON.Vector3(radStem-this.BBOffset/2, 0, radStem-this.BBOffset/2),
                new BABYLON.Vector3(radStem-this.BBOffset/2, 0, -radStem+this.BBOffset/2)
            ];

                //pre fillet bounding box
                const preBB = BABYLON.MeshBuilder.ExtrudePolygon("preBB", {shape:rectBB, depth:lenStem/2-1.1*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                preBB.addRotation(0, 0, Math.PI/2);
                preBB.translate(new BABYLON.Vector3(1.1*this.BBOffset, 0, 0), 1, BABYLON.Space.WORLD);
                preBB.isVisible = false;
                this.BB.push(preBB);

                //fillet bounding box
                if (angleBend != 0) {
                    const fillBB = BABYLON.MeshBuilder.ExtrudePolygon("fillBB", {shape:rectBB, depth:2*radFill*Math.sin(angleBend*Math.PI/360), sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                    fillBB.addRotation(0, 0, Math.PI/2);
                    fillBB.translate(new BABYLON.Vector3(lenStem/2-radFill*Math.tan(angleBend*Math.PI/360), 0, 0), 1, BABYLON.Space.WORLD);
                    fillBB.addRotation(-angleBend*Math.PI/360, 0, 0);
                    fillBB.isVisible = false;
                    this.BB.push(fillBB);
                }

                //post fillet bounding box
                const postBB = BABYLON.MeshBuilder.ExtrudePolygon("postBB", {shape:rectBB, depth:lenStem/2+this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                postBB.addRotation(0, 0, Math.PI/2);
                postBB.translate(new BABYLON.Vector3(lenStem/2, 0, 0), 1, BABYLON.Space.WORLD);
                postBB.addRotation(-angleBend*Math.PI/180, 0, 0);
                postBB.isVisible = false;
                this.BB.push(postBB);

        //create male mesh
        const maleConnPath = [
            new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)*Math.sin(angleBend*Math.PI/180)),
            new BABYLON.Vector3((lenStem/2)+(lenStem/2+lenConn)*(Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2+lenConn)*Math.sin(angleBend*Math.PI/180))
        ];
        var maleConn = BABYLON.MeshBuilder.CreateTube("maleConn", {path:maleConnPath, radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //create female mesh
        const femConnPath = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(lenConn, 0, 0)
        ];
        var femConn = BABYLON.MeshBuilder.CreateTube("femConn", {path:femConnPath, radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        //create cap (on female end)
        const circle = pillShape(radStem, 0, 0, 0, numArcPts);
        const hole = [pillShape(radConn, 0, 0, 0, numArcPts)];
        var cap = BABYLON.MeshBuilder.ExtrudePolygon("cap", {shape:circle, holes:hole, depth:0, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        cap.addRotation(0, 0, Math.PI/2);

        //merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes([tube, maleConn, femConn, cap], true, true, undefined, false, false);
        this.mesh.addRotation(-Math.PI/2, Math.PI/2, Math.PI); //rotate to default orientation
        
        //create connections
        const offset = 0.005;
        this.connections.push(new Joint(scene, this, "female", [lenConn-offset, 0, 0, 0, 0, 90], radStem+offset, lenConn+offset, numArcPts));
        this.connections.push(new Joint(scene, this, "male", [(lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)*Math.sin(angleBend*Math.PI/180), 
            -angleBend, 0, -90], radStem+offset, lenConn+offset, numArcPts));
        
        //set parent for connections & BB
        this.parentConnections();
        this.parentBB();

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.disableEdgesRendering();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, true, false, false]; //array of which gizmos to include [dx, dy, dz, rx, ry, rz]
    }
}

//define branch class (frame members with holes & slots)
class Branch extends Component {
    constructor(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az], lenBranch, thickBranch, radBranch, radHole, spacHole, lenSlot, numArcPts) {
        super(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az]);

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

            //above holes bounding box
            const above = [
                new BABYLON.Vector3(0, 0, radBranch-this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, radBranch-this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, radHole+this.BBOffset),
                new BABYLON.Vector3(0, 0, radHole+this.BBOffset)
            ];
            const aboveBB = BABYLON.MeshBuilder.ExtrudePolygon("aboveBB", {shape:above, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            aboveBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
            aboveBB.isVisible = false;
            this.BB.push(aboveBB);

            //below holes bounding box
            const below = [
                new BABYLON.Vector3(0, 0, -radBranch+this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, -radBranch+this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, -radHole-this.BBOffset),
                new BABYLON.Vector3(0, 0, -radHole-this.BBOffset)
            ];
            const belowBB = BABYLON.MeshBuilder.ExtrudePolygon("belowBB", {shape:below, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            belowBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
            belowBB.isVisible = false;
            this.BB.push(belowBB);

        //create hole shapes
        const holes = [];

            //left circle hole is local origin
            const leftHole = pillShape(radHole, 0, 0, 0, numArcPts);
            holes.push(leftHole);
                //create connection
                this.connections.push(new Joint(scene, this, "left", [0, -thickBranch, 0, 0, 0, 0], radHole, thickBranch, numArcPts));

                //left of holes bounding box
                const left = [
                    new BABYLON.Vector3(-radBranch+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(-radBranch+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const leftBB = BABYLON.MeshBuilder.ExtrudePolygon("leftBB", {shape:left, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                leftBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                leftBB.isVisible = false;
                this.BB.push(leftBB);

            //slot holes, max length
            let spacRem = lenBranch-2*spacHole;
            let startSlot = spacHole;
            let k = 0;
            while (spacRem >= lenSlot) {
                const slotHole = pillShape(radHole, lenSlot, startSlot, 0, numArcPts);
                holes.push(slotHole);

                //create connection
                this.connections.push(new Slot(scene, this, k.toString(), [startSlot, 0, 0, 0, 0, 0], radHole, lenSlot, thickBranch, numArcPts));
                k++;

                //between holes bounding box
                const btwn = [
                    new BABYLON.Vector3(startSlot-spacHole+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(startSlot-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(startSlot-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(startSlot-spacHole+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const btwnBB = BABYLON.MeshBuilder.ExtrudePolygon("btwnBB", {shape:btwn, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                btwnBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                btwnBB.isVisible = false;
                this.BB.push(btwnBB);

                spacRem -= (lenSlot+spacHole);
                startSlot += lenSlot+spacHole;
            }

            //slot holes, shorter
            const slotHole = pillShape(radHole, spacRem, startSlot, 0, numArcPts);
            holes.push(slotHole);
                //create connection
                this.connections.push(new Slot(scene, this, k.toString(), [startSlot, 0, 0, 0, 0, 0], radHole, spacRem, thickBranch, numArcPts));

                //left of final slot bounding box
                const finSlotL = [
                    new BABYLON.Vector3(startSlot-spacHole+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(startSlot-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(startSlot-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(startSlot-spacHole+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const finSlotLBB = BABYLON.MeshBuilder.ExtrudePolygon("finSlotLBB", {shape:finSlotL, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                finSlotLBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                finSlotLBB.isVisible = false;
                this.BB.push(finSlotLBB);

                //right of final slot bounding box
                const finSlotR = [
                    new BABYLON.Vector3(lenBranch-spacHole+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(lenBranch-spacHole+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const finSlotRBB = BABYLON.MeshBuilder.ExtrudePolygon("finSlotRBB", {shape:finSlotR, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                finSlotRBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                finSlotRBB.isVisible = false;
                this.BB.push(finSlotRBB);

            //right circle hole
            const rightHole = pillShape(radHole, 0, lenBranch, 0, numArcPts);
            holes.push(rightHole);
                //create connection
                this.connections.push(new Joint(scene, this, "right", [lenBranch, -thickBranch, 0, 0, 0, 0], radHole, thickBranch, numArcPts));

                //right of holes bounding box
                const right = [
                    new BABYLON.Vector3(lenBranch+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch+radBranch-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch+radBranch-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(lenBranch+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const rightBB = BABYLON.MeshBuilder.ExtrudePolygon("rightBB", {shape:right, depth:thickBranch-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                rightBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                rightBB.isVisible = false;
                this.BB.push(rightBB);

        //extrude & create mesh
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon("branch", {shape:profile, holes:holes, depth:thickBranch, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        this.mesh.addRotation(-Math.PI/2, 0, 0); //rotate to default orientation

        //set parent for connections & BB
        this.parentConnections();
        this.parentBB();

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, false, false, true]; //array of which gizmos to include [dx, dy, dz, rx, ry, rz]
    }
}

//define trunk class (plank tiles with holed ribs)
class Trunk extends Component {
    constructor(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az], lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, radHole, spacHole, overhang, reflected, numArcPts) {
        super(scene, tree, snapDist, snapRot, [x, y, z, ax, ay, az]);

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
        this.edgeRib = edgeRib; //tile side edge distance before first rib (if not reflected)
        this.radHole = radHole; //radius of holes
        this.spacHole = spacHole; //center-to-center spacing between holes
        this.overhang = overhang; //tile end edge distance overhanging rib end
        this.numArcPts = numArcPts; //# of points defining circle arc resolution
        this.reflected = reflected; //toggle for if trunk is reflected along longitudinal axis

        const edgeRibLast = widthTile-edgeRib-numRibs*thickRib-(numRibs-1)*spacRib; //tile side edge distance after last rib (if not reflected)
        var edgeRibFirst = edgeRib;
        if (reflected == 1) {
            var edgeRibFirst = edgeRibLast;
        }

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

            //tile bounding box
            const rectBB = [
                new BABYLON.Vector3(-2*radRib-overhang+this.BBOffset, 0, this.BBOffset),
                new BABYLON.Vector3(-2*radRib-overhang+this.lenTile-this.BBOffset, 0, this.BBOffset),
                new BABYLON.Vector3(-2*radRib-overhang+this.lenTile-this.BBOffset, 0, widthTile-this.BBOffset),
                new BABYLON.Vector3(-2*radRib-overhang+this.BBOffset, 0, widthTile-this.BBOffset)
            ];
            const tileBB = BABYLON.MeshBuilder.ExtrudePolygon("tileBB", {shape:rectBB, depth:thickTile-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            tileBB.addRotation(Math.PI/2, 0, 0);
            tileBB.translate(new BABYLON.Vector3(0, 0, 2*radRib-this.BBOffset), 1, BABYLON.Space.WORLD);
            tileBB.isVisible = false;
            this.BB.push(tileBB);

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
            let k = 0;
            for (let i = 0; i <= lenTrunk; i += spacHole) {
                const hole = pillShape(radHole, 0, i, 0, numArcPts);
                holes.push(hole);

                //create connection
                this.connections.push(new Joint(scene, this, j.toString+","+k.toString(), [i, -edgeRibFirst-thickRib-j*(thickRib+spacRib), 0, 0, 0, 0], 
                    radHole, thickRib, numArcPts));
                k++;
            }

            //extrude & create mesh
            const rib = BABYLON.MeshBuilder.ExtrudePolygon("rib", {shape:profile, holes:holes, depth:thickRib, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            rib.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib), 0), 1, BABYLON.Space.WORLD);
            meshes.push(rib);

                //rib bounding boxes
                    //above holes
                    const above = [
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, radRib),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, radRib),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, radHole+this.BBOffset)
                    ];
                    const aboveBB = BABYLON.MeshBuilder.ExtrudePolygon("aboveBB", {shape:above, depth:thickRib-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                    aboveBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    aboveBB.isVisible = false;
                    this.BB.push(aboveBB);

                    //below holes
                    const below = [
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, -radRib+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, -radRib+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, -radHole-this.BBOffset),
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, -radHole-this.BBOffset)
                    ];
                    const belowBB = BABYLON.MeshBuilder.ExtrudePolygon("belowBB", {shape:below, depth:thickRib-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                    belowBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    belowBB.isVisible = false;
                    this.BB.push(belowBB);

                    //left of holes
                    const left = [
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, -radHole-this.BBOffset)
                    ];
                    const leftBB = BABYLON.MeshBuilder.ExtrudePolygon("leftBB", {shape:left, depth:thickRib-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                    leftBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    leftBB.isVisible = false;
                    this.BB.push(leftBB);

                    //between holes
                    for (let i = 0; i < lenTrunk; i += spacHole) {
                        const btwn = [
                            new BABYLON.Vector3(i+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                            new BABYLON.Vector3(i+spacHole-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                            new BABYLON.Vector3(i+spacHole-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                            new BABYLON.Vector3(i+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                        ];
                        const btwnBB = BABYLON.MeshBuilder.ExtrudePolygon("btwnBB", {shape:btwn, depth:thickRib-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                        btwnBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                        btwnBB.isVisible = false;
                        this.BB.push(btwnBB);
                    }

                    //right of holes
                    const right = [
                        new BABYLON.Vector3(lenTrunk+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, -radHole-this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                    ];
                    const rightBB = BABYLON.MeshBuilder.ExtrudePolygon("rightBB", {shape:right, depth:thickRib-2*this.BBOffset, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
                    rightBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    rightBB.isVisible = false;
                    this.BB.push(rightBB);
        }

        //merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
        this.mesh.addRotation(-Math.PI/2, 0, 0); //rotate to default orientation

        //set parent for connections & BB
        this.parentConnections();
        this.parentBB();

        //set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        //set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, false, false, true]; //array of which gizmos to include [dx, dy, dz, rx, ry, rz]
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
        this.selComponents = []; //array of selected components in tree
        this.selComponentIDs = []; //array of selected component IDs in tree
        this.snapDist = snapDist; //snap distance for gizmo controls
        this.snapRot = snapRot; //snap rotation angle (in degrees) for gizmo controls
        this.numArcPts = numArcPts; //# of points defining circle arc resolution
        this.numFillPts = numFillPts; //# of points defining fillet arc resolution
        this.showingGizmos = false; //toggle for gizmo visibility

        //set up controls
        this.setupControls();
    }

    //add component
    add(component) {
        this.components.push(component);
        component.ID = this.nextID;
        this.componentIDs.push(this.nextID);
        this.nextID++;
    }

    //copy specified components
    copy(components) {
        for (let i = 0; i < components.length; i++) {
            const c = components[i];
            if (c.type == "leaf") {
                this.add(new Leaf(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenX, c.lenY));
            } else if (c.type == "stem") {
                this.add(new Stem(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.angleBend, c.lenStem, c.radStem, c.radFill, 
                    c.radConn, c.lenConn, this.numArcPts, this.numFillPts));
            } else if (c.type == "branch") {
                this.add(new Branch(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenBranch, c.thickBranch, c.radBranch, 
                    c.radHole, c.spacHole, c.lenSlot, this.numArcPts));
            } else if (c.type == "trunk") {
                this.add(new Trunk(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenTrunk, c.widthTile, c.thickTile, 
                    c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, c.spacHole, c.overhang, c.reflected, this.numArcPts));
            }
            if (c.transparent) {
                this.components[this.components.length-1].xray();
            }
            if (c.showingConnections) {
                this.components[this.components.length-1].showConnections();
            }
        }
    }
    
    //delete specified components
    delete(components) {
        const temp = [];
        for (let i = 0; i < components.length; i++) {
            temp.push(components[i]);
        }
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
    }

    //show specified components gizmos
    showGizmos(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].showGizmos();
        }
        if (components.length > 0) {this.showingGizmos = true};
    }

    //hide specified components gizmos
    hideGizmos(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].hideGizmos();
        }
        if (components.length > 0) {this.showingGizmos = false};
    }

    //toggle specified components gizmos visibility
    toggleGizmos(components) {
        if (this.showingGizmos) {
            this.hideGizmos(components);
        } else {
            this.showGizmos(components);
        }
    }

    //select specified components
    select(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].select();
        }
    }

    //deselect specified components
    deselect(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].deselect();
        }
    }

    //show specified components connections
    showConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].showConnections();
        }
    }

    //hide specified components connections
    hideConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].hideConnections();
        }
    }

    //toggle specified components connections visibility
    toggleConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleConnections();
        }
    }

    //deselect specified components connections
    deselectConnections(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].deselectConnections();
        }
    }

    //checks for intersections between specified components
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

    //reflects specified trunk components
    reflectTrunks(components) {
        const oldTrunks = [];
        for (let i = 0; i < components.length; i++) {
            const c = components[i];
            if (c.type = "trunk") {
                oldTrunks.push(c);
                var newReflected = 1;
                if (c.reflected == 1) {
                    newReflected = 0;
                }
                this.add(new Trunk(this.scene, this, this.snapDist, this.snapRot, [c.x, c.y, c.z, c.ax, c.ay, c.az], c.lenTrunk, c.widthTile, c.thickTile, 
                    c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, c.radHole, c.spacHole, c.overhang, newReflected, this.numArcPts));
                if (c.transparent) {
                    this.components[this.components.length-1].xray();
                }
                if (c.showingConnections) {
                    this.components[this.components.length-1].showConnections();
                }
            }
        }
        this.delete(oldTrunks);
    }

    //set the specified components materials opaque
    opaque(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].opaque();
        }
    }

    //set the specified components materials transparent (xray)
    xray(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].xray();
        }
    }

    //toggle specified components transparency
    toggleTransparency(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].toggleTransparency();
        }
    }

    //updates specified components visuals
    updateVisuals(components) {
        for (let i = 0; i < components.length; i++) {
            components[i].updateVisuals();
        }
    }

    //set up tree controls & responses
    setupControls() {
        //default gizmo visibility
        this.hideGizmos(this.components);

        //keyboard controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        //a key selects all components
                        case "a":
                        case "A":
                            this.select(this.components);
                        break

                        //c key copies selected components
                        case "c":
                        case "C":
                            this.copy(this.selComponents);
                        break

                        //m key toggles gizmos visibility for selected components
                        case "m":
                        case "M":
                            if (this.selComponents.length > 0) {
                                this.toggleGizmos(this.selComponents);
                            }
                        break

                        //escape key deselects all components
                        case "Escape":
                            this.deselect(this.components);
                            this.hideGizmos(this.components);
                            this.deselectConnections(this.components);
                            this.hideConnections(this.components);
                        break
                        
                        //delete key deletes selected components
                        case "Delete":
                            this.delete(this.selComponents);
                        break

                        //tab key toggles connections visibility for all components
                        case "Tab":
                            this.toggleConnections(this.components);
                            this.deselectConnections(this.components);
                        break

                        //t key toggles transparency for all components
                        case "t":
                        case "T":
                            this.toggleTransparency(this.components);
                        break

                        //r key reflects selected trunk components
                        case "r":
                        case "R":
                            this.reflectTrunks(this.selComponents);
                        break

                        //l key loads tree file
                        case "l":
                        case "L":
                            this.load();
                        break

                        //s key saves tree file
                        case "s":
                        case "S":
                            this.save();
                        break
                    }
                break;
            }
        });
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
                contents.push([c.type, c.x, c.y, c.z, c.ax, c.ay, c.az, c.lenTrunk, c.widthTile, c.thickTile, c.numRibs, c.thickRib, c.radRib, c.spacRib, c.edgeRib, 
                    c.radHole, c.spacHole, c.overhang, c.reflected, '\n']);
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
                            this.add(new Leaf(this.scene, this, this.snapDist, this.snapRot, 
                                [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8]));
                        } else if (data[0] == "stem") {
                            this.add(new Stem(this.scene, this, this.snapDist, this.snapRot, 
                                [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], this.numArcPts, this.numFillPts));
                        } else if (data[0] == "branch") {
                            this.add(new Branch(this.scene, this, this.snapDist, this.snapRot, 
                                [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], this.numArcPts));
                        } else if (data[0] == "trunk") {
                            this.add(new Trunk(this.scene, this, this.snapDist, this.snapRot, 
                                [data[1], data[2], data[3], data[4], data[5], data[6]], data[7], data[8], data[9], data[10], data[11], data[12], data[13], data[14], 
                                data[15], data[16], data[17], data[18], this.numArcPts));
                        }
                    }
                }
            }
        }
    }
}

//create scene
//const createScene = async function () { //for debugging
const createScene = function () {
	
    /*console for debugging
    await new Promise(r => {
        var s = document.createElement("script");
        s.src = "https://console3.babylonjs.xyz/console3-playground.js";
        document.head.appendChild(s);
        s.onload = r();
    })
    */

    //setup scene
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);

    /*console for debugging
    var c3 = window.console3;
    c3.create(engine, scene);
    c3.log("scene created");
    */

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
    scene.registerBeforeRender(function () {
        light.direction = camera.position;
    })

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
    const edgeRib = thickBranch; //tile side edge distance before first rib (if not reflected)
    const overhang = 1; //tile end edge distance overhanging rib end

    const snapDist = 1; //snap distance for gizmo controls
    const snapRot = 15; //snap rotation angle (in degrees) for gizmo controls
    const numArcPts = 64; //# of points defining circle arc resolution
    const numFillPts = 32; //# of points defining fillet arc resolution

    //create test tree
    const tree = new Tree(scene, snapDist, snapRot, numArcPts, numFillPts);
    /*
    tree.add(new Leaf(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], lenX, lenY));
    tree.add(new Stem(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], angleBend, lenStem, radStem, radFill, radConn, lenConn, numArcPts, numFillPts));
    tree.add(new Branch(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], lenBranch, thickBranch, radBranch, radHole, spacHole, lenSlot, numArcPts));
    tree.add(new Trunk(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, 
        radHole, spacHole, overhang, 0, numArcPts));
    */
    tree.load();

    //component render updates
    scene.registerBeforeRender(function() {
        tree.checkIntersections(tree.components);
        tree.updateVisuals(tree.components);
    });

	return scene;
}


