import * as BABYLON from 'babylonjs';
import earcut from 'earcut';
import * as Geometry from './geometry.js';

// Define connection class
class Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az]) {
        // initialize properties
        this.scene = scene; // scene hosting connection
        this.component = component; // component the connection is a part of
        this.ID = ID; // connection ID
        this.type = null; // initialize null connection type
        this.mesh = null; // initialize null mesh
        this.hovering = false; // toggle for if connection is being hovered over
        this.selected = false; // toggle for if connection is selected
        this.connectedTo = null; // what this connection is connected to (null if unused)
        this.monitors = []; // meshes that assist in checking for aligned connections
        const alpha = 0.5; // transparency value

        // default material
        this.defMat = new BABYLON.StandardMaterial("defMat", scene);
        this.defCol = new BABYLON.Color3(0, 1, 1);
        this.defMat.diffuseColor = this.defCol;
        this.defMat.alpha = alpha;

        // hover material
        this.hovMat = new BABYLON.StandardMaterial("hovMat", scene);
        this.hovCol = new BABYLON.Color3(1, 1, 0);
        this.hovMat.diffuseColor = this.hovCol;
        this.hovMat.alpha = alpha;

        // selected material
        this.selMat = new BABYLON.StandardMaterial("selMat", scene);
        this.selCol = new BABYLON.Color3(0, 1, 0);
        this.selMat.diffuseColor = this.selCol;
        this.selMat.alpha = alpha;

        // connected material
        this.conMat = new BABYLON.StandardMaterial("conMat", scene);
        this.conCol = new BABYLON.Color3(1, 0, 1);
        this.conMat.diffuseColor = this.conCol;
        this.conMat.alpha = alpha;
    }

    // move connection (globally)
    move(dx, dy, dz) {
        this.mesh.position.x += dx;
        this.mesh.position.y += dy;
        this.mesh.position.z += dz;
    }

    // rotate connection (in degrees, about local origin) FIX!
    rotate(rx, ry, rz) {
        this.mesh.rotate(new BABYLON.Vector3(-1, 0, 0), rx*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, -1, 0), ry*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, 0, 1), rz*Math.PI/180, BABYLON.Space.WORLD);
    }

    // show connection
    show() {
        this.mesh.isVisible = true;
    }

    // hide connection
    hide() {
        this.mesh.isVisible = false;
    }

    // toggle connection visibility
    toggle() {
        this.mesh.isVisible = !this.mesh.isVisible;
    }

    // delete connection
    delete() {
        this.mesh.dispose();
    }

    // select connection
    select() {
        // deselect all other connections for this component
        for (let i = 0; i < this.component.connections.length; i++) {
            const c = this.component.connections[i];
            if (this != c) {
                c.deselect();
            }
        }
        
        // update properties
        this.selected = true;

        // selection coloring
        this.defMat.diffuseColor = this.selCol;
        this.hovMat.diffuseColor = this.selCol;
        this.mesh.material = this.selMat;
    }

    // deselect connection
    deselect() {
        // update properties
        this.selected = false;

        // default coloring
        this.defMat.diffuseColor = this.defCol;
        this.hovMat.diffuseColor = this.hovCol;
        this.mesh.material = this.defMat;
    }

    // manage connection selection
    manageSelection() {
        if (this.selected) {
            this.deselect();
        } else {
            this.select();
        }
    }

    // check if this connection is aligned (connectable) to another connection
    connectable(conn) {
        if (this.monitors.length > 1 && conn.monitors.length > 1 && (!this.component.intersecting || !conn.component.intersecting)) {
            if (this.monitors[0].intersectsMesh(conn.monitors[0], false) && this.monitors[1].intersectsMesh(conn.monitors[1], false)) {
                return true;
            } else if (this.monitors[0].intersectsMesh(conn.monitors[1], false) && this.monitors[1].intersectsMesh(conn.monitors[0], false)) {
                return true;
            }
        }
        return false;
    }

    // set up connection visuals
    setupVisuals() {
        // default visibility
        this.hide();
        
        // initialize mesh material
        this.mesh.material = this.defMat;
    }

    // updates connection visuals
    updateVisuals() {
        if (this.selected) {
            this.mesh.material = this.selMat;
        } else if (this.hovering) {
            this.mesh.material = this.hovMat;
        } else if (this.connectedTo != null) {
            this.mesh.material = this.conMat;
        }  else {
            this.mesh.material = this.defMat;
        }
    }

    // set up connection controls & responses
    setupControls() {
        // hover over connection
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this, "hovering", false));
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this, "hovering", true));

        // click (select) connection
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {this.manageSelection()}));
    }
}

// define edge class (side connection of leaf component)
class Edge extends Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az], len) {
        super(scene, component, ID, [x, y, z, ax, ay, az]);

        // initialize properties
        this.type = "edge"; // connection type

        // create mesh
        this.mesh = BABYLON.MeshBuilder.CreateBox("edge", {height:len, width:0.25, depth:0.05, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        // set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

// define joint class (end connection of stem component & circle hole connections in branch & trunk components)
class Joint extends Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az], rad, len, numArcPts) {
        super(scene, component, ID, [x, y, z, ax, ay, az]);

        // initialize properties
        this.type = "joint"; // connection type

        // create mesh
        const path = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, len, 0)
        ];
        this.mesh = BABYLON.MeshBuilder.CreateTube("joint", {path:path, radius:rad, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_ALL, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        // set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

// define slot class (slotted hole connections in branch component) FIX!
class Slot extends Connection {
    constructor(scene, component, ID, [x, y, z, ax, ay, az], rad, len, depth, numArcPts) {
        super(scene, component, ID, [x, y, z, ax, ay, az]);

        // initialize properties
        this.type = "slot"; // connection type

        // create mesh
        const shape = Geometry.pillShape(rad, len, 0, 0, numArcPts);
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon("hole", {shape:shape, 
            depth:depth, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);

        // set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

export { Connection, Edge, Joint, Slot };