import * as BABYLON from 'babylonjs';
import earcut from 'earcut';
import * as Geometry from './geometry.js';
import * as Elements from './elements.js';
import * as Connections from './connections.js';

// Define component class
class Component {
    constructor(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az]) {
        // Initialize properties
        this.scene = scene; // Scene hosting component
        this.collection = collection; // Collection the component is a part of
        this.ID = null; // Initialize null component ID
        this.x = 0; // X position (of local origin), initialize to 0 (set later)
        this.y = 0; // Y position (of local origin), initialize to 0 (set later)
        this.z = 0; // Z position (of local origin), initialize to 0 (set later)
        this.ax = 0; // X rotation (in degrees, about local origin), initialize to 0 (set later)
        this.ay = 0; // Y rotation (in degrees, about local origin), initialize to 0 (set later)
        this.az = 0; // Z rotation (in degrees, about local origin), initialize to 0 (set later)
        this.type = null; // Initialize null component type
        this.mesh = null; // Initialize null mesh
        this.structureMode = false; // Toggle for structural analysis mode
        this.elements = []; // Initialize empty structural elements array
        this.connections = []; // Initialize empty connections array
        this.showingConnections = false; // Toggle for connection visibility
        this.monitorSize = 0.05; // Connections monitor mesh size
        this.BB = []; // Initialize empty bounding boxes array (for mesh intersection detection)
        this.BBOffset = 0.05; // Offset for bounding boxes from mesh edges
        this.hovering = false; // Toggle for if component is being hovered over
        this.selected = false; // Toggle for if component is selected
        this.intersecting = false; // Toggle for if component is intersecting another component
        this.transparent = false; // Toggle for component transparency

        // Initialize gizmos
        this.inclGizmos = [true, true, true, false, false, false]; // [dx, dy, dz, rx, ry, rz]
        this.dxGizmo = null;
        this.dyGizmo = null;
        this.dzGizmo = null;
        this.rxGizmo = null;
        this.ryGizmo = null;
        this.rzGizmo = null;
        this.snapDist = snapDist;
        this.snapRot = snapRot;

        // Set axis colors
        this.xCol = new BABYLON.Color3(1, 0, 0);
        this.yCol = new BABYLON.Color3(0, 1, 0);
        this.zCol = new BABYLON.Color3(0, 0, 1);

        // Default material
        this.defMat = new BABYLON.StandardMaterial('defMat', scene);
        this.defCol = new BABYLON.Color3(1, 1, 1);
        this.defMat.diffuseColor = this.defCol;

        // Hover material
        this.hovMat = new BABYLON.StandardMaterial('hovMat', scene);
        this.hovCol = new BABYLON.Color3(1, 1, 0);
        this.hovMat.diffuseColor = this.hovCol;

        // Selected material
        this.selMat = new BABYLON.StandardMaterial('selMat', scene);
        this.selCol = new BABYLON.Color3(0, 1, 0);
        this.selMat.diffuseColor = this.selCol;

        // Intersected material
        this.intMat = new BABYLON.StandardMaterial('intMat', scene);
        this.intCol = new BABYLON.Color3(1, 0, 0);
        this.intMat.diffuseColor = this.intCol;
    }

    // Move component (globally)
    move(dx, dy, dz) {
        // Update position properties
        this.x += dx;
        this.y += dy;
        this.z += dz;

        // Move mesh
        this.mesh.position.x += dx;
        this.mesh.position.y += dy;
        this.mesh.position.z += dz;
    }

    // Rotate component (in degrees, about local origin) FIX!
    rotate(rx, ry, rz) {
        // Update rotation properties
        this.ax += rx;
        this.ay += ry;
        this.az += rz;

        // Rotate mesh
        this.mesh.rotate(new BABYLON.Vector3(-1, 0, 0), rx*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, -1, 0), ry*Math.PI/180, BABYLON.Space.WORLD);
        this.mesh.rotate(new BABYLON.Vector3(0, 0, 1), rz*Math.PI/180, BABYLON.Space.WORLD);
    }

    // Show component
    show() {
        this.mesh.isVisible = true;
    }

    // Hide component
    hide() {
        this.mesh.isVisible = false;
    }

    // Toggle component visibility
    toggle() {
        this.mesh.isVisible = !this.mesh.isVisible;
    }

    // Delete component
    delete() {
        this.mesh.dispose();
    }

    // Show gizmos
    showGizmos() {
        if (this.inclGizmos[0]) {this.dxGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[1]) {this.dyGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[2]) {this.dzGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[3]) {this.rxGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[4]) {this.ryGizmo.attachedMesh = this.mesh};
        if (this.inclGizmos[5]) {this.rzGizmo.attachedMesh = this.mesh};
    }

    // Hide gizmos
    hideGizmos() {
        this.dxGizmo.attachedMesh = null;
        this.dyGizmo.attachedMesh = null;
        this.dzGizmo.attachedMesh = null;
        this.rxGizmo.attachedMesh = null;
        this.ryGizmo.attachedMesh = null;
        this.rzGizmo.attachedMesh = null;
    }

    // Select component
    select() {
        // Update properties
        this.selected = true;
        if (this.collection.type == 'tree') {
            const index = this.collection.selComponentIDs.indexOf(this.ID);
            if (index < 0) {
                this.collection.selComponents.push(this);
                this.collection.selComponentIDs.push(this.ID);
            }

            // Show gizmos
            if (this.collection.showingGizmos) {this.showGizmos()};
        }
    }

    // Deselect component
    deselect() {
        // Update properties
        this.selected = false;
        if (this.collection.type == 'tree') {
            const index = this.collection.selComponentIDs.indexOf(this.ID);
            if (index > -1) {
                this.collection.selComponentIDs.splice(index, 1);
                this.collection.selComponents.splice(index, 1);
            }

            // Hide gizmos
            this.hideGizmos();
            if (this.collection.selComponents.length < 1) {this.collection.showingGizmos = false};
        }
    }

    // Manage component selection
    manageSelection() {
        if (this.selected) {
            this.deselect();
        } else {
            this.select();
        }
    }

    // Show component connections
    showConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].show();
        }
        this.showingConnections = true;
    }

    // Hide component connections
    hideConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].hide();
        }
        this.showingConnections = false;
    }

    // Toggle component connections visibility
    toggleConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].toggle();
        }
        this.showingConnections = !this.showingConnections;
    }

    // Deselect component connections
    deselectConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].deselect();
        }
    }
    
    // Checks for valid connections from this component to other components
    checkConnections(components) {
        for (let j = 0; j < this.connections.length; j++) {
            const conn = this.connections[j];
            conn.connectedTo = null;
            let found = false;
            for (let i = 0; i < components.length && !found; i++) {
                const comp = components[i];
                if (this.ID != comp.ID) {
                    if ((comp.type == 'leaf' && this.type == 'leaf') || (comp.type != 'leaf' 
                        && this.type == 'stem') || (comp.type == 'stem' && this.type != 'leaf')) {
                        for (let c = 0; c < comp.connections.length && !found; c++) {
                            if (conn.connectable(comp.connections[c])) {
                                conn.connectedTo = comp.connections[c];
                                found = true;
                            }
                        }
                    }
                }
            }
        }
    }

    // Show structural elements
    showElements() {
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].show();
        }
        this.hide();
        this.structureMode = true;
    }

    // Hide structural elements
    hideElements() {
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].hide();
        }
        this.show();
        this.structureMode = false;
    }

    // Toggle component structural elements visibility
    toggleElements() {
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].toggle();
        }
        this.toggle();
        this.structureMode = !this.structureMode;
    }

    // Set the component mesh as the parent of the connection meshes
    parentConnections() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].mesh.parent = this.mesh;
            for (let j = 0; j < this.connections[i].monitors.length; j++) {
                this.connections[i].monitors[j].parent = this.mesh;
            }
        }
    }

    // Set the component mesh as the parent of the BB meshes
    parentBB() {
        for (let i = 0; i < this.BB.length; i++) {
            this.BB[i].parent = this.mesh;
        }
    }

    // Set the component mesh as the parent of the structural element meshes
    parentElements() {
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].mesh.parent = this.mesh;
        }
    }
        
    // Check for mesh intersection between this & another component based on bounding boxes
    intersects(component) {
        if (this.mesh.intersectsMesh(component.mesh, true)) {
            for (let j = 0; j < this.BB.length; j++) {
                for (let i = 0; i < component.BB.length; i++) {
                    if (this.BB[j].intersectsMesh(component.BB[i], true)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Sets the component materials opaque
    opaque() {
        this.defMat.alpha = 1;
        this.hovMat.alpha = 1;
        this.selMat.alpha = 1;
        this.intMat.alpha = 1;
        this.mesh.material.alpha = 1;
        if (this.type == 'stem') {
            this.femNut.material.alpha = 1;
            this.maleNut.material.alpha = 1;
        }
        this.transparent = false;
    }

    // Sets the component materials transparent (xray)
    xray() {
        const alpha = 0.5;
        this.defMat.alpha = alpha;
        this.hovMat.alpha = alpha;
        this.selMat.alpha = alpha;
        this.intMat.alpha = alpha;
        this.mesh.material.alpha = alpha;
        if (this.type == 'stem') {
            this.femNut.material.alpha = alpha;
            this.maleNut.material.alpha = alpha;
        }
        this.transparent = true;
    }

    // Toggle component transparency
    toggleTransparency() {
        if (this.transparent) {
            this.opaque();
        } else {
            this.xray();
        }
    }

    // Set up component visuals
    setupVisuals() {
        // Initialize mesh material
        this.mesh.material = this.defMat;
        if (this.type == 'stem') {
            this.femNut.material = this.defMat;
            this.maleNut.material = this.defMat;
        }
        
        // Create edges
        this.mesh.enableEdgesRendering();
        this.mesh.edgesWidth = 2.0;
        this.mesh.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
        
        // Create outline
        const showOutline = false;
        if (showOutline) {
            this.mesh.renderOutline = true;
            this.mesh.outlineColor = new BABYLON.Color3(0, 0, 0);
            this.mesh.outlineWidth = 0.08;
        }
    }

    // Updates component visuals
    updateVisuals() {
        // Materials
        if (this.selected) {
            this.mesh.material = this.selMat;
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].mesh.material = this.selMat;
            }
            if (this.type == 'stem') {
                this.femNut.material = this.selMat;
                this.maleNut.material = this.selMat;
            }
        } else if (this.hovering) {
            this.mesh.material = this.hovMat;
            if (this.type == 'stem') {
                this.femNut.material = this.hovMat;
                this.maleNut.material = this.hovMat;
            }
        } else if (this.intersecting) {
            this.mesh.material = this.intMat;
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].mesh.material = this.intMat;
            }
            if (this.type == 'stem') {
                this.femNut.material = this.intMat;
                this.maleNut.material = this.intMat;
            }
        } else {
            this.mesh.material = this.defMat;
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].mesh.material = this.defMat;
            }
            if (this.type == 'stem') {
                this.femNut.material = this.defMat;
                this.maleNut.material = this.defMat;
            }
        }

        // Connections
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].updateVisuals();
        }

        // Nuts (for stems)
        if (this.type == 'stem') {
            this.femNut.isVisible = true;
            this.maleNut.isVisible = true;
            if (this.collection.type == 'almanac' || this.showingConnections || this.structureMode) {
                this.femNut.isVisible = false;
                this.maleNut.isVisible = false;
            } else {
                if (this.connections[0].connectedTo != null) {this.femNut.isVisible = false};
                if (this.connections[1].connectedTo != null) {this.maleNut.isVisible = false};
            }
        }
    }

    // Set up component controls & responses
    setupControls() {
        // Create gizmos
        this.dxGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(1, 0, 0), this.xCol);
        this.dyGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(0, 1, 0), this.yCol);
        this.dzGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(0, 0, 1), this.zCol);
        this.rxGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(1, 0, 0), this.xCol);
        this.ryGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 1, 0), this.yCol);
        this.rzGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 0, 1), this.zCol);

        // Adjust gizmo snap distance
        this.dxGizmo.snapDistance = this.snapDist;
        this.dyGizmo.snapDistance = this.snapDist;
        this.dzGizmo.snapDistance = this.snapDist;
        this.rxGizmo.snapDistance = this.snapRot*Math.PI/180;
        this.ryGizmo.snapDistance = this.snapRot*Math.PI/180;
        this.rzGizmo.snapDistance = this.snapRot*Math.PI/180;

        // Maintain global axes for gizmo orientation
        this.dxGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.dyGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.dzGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.rxGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.ryGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.rzGizmo.updateGizmoRotationToMatchAttachedMesh = false;

        // Update component position & rotation properties per gizmo events FIX!
        this.dxGizmo.onSnapObservable.add(event => {
            this.x += event.snapDistance;
            if (this.collection.type == 'tree') {this.collection.log()};
        });
        this.dyGizmo.onSnapObservable.add(event => {
            this.y += event.snapDistance;
            if (this.collection.type == 'tree') {this.collection.log()};
        });
        this.dzGizmo.onSnapObservable.add(event => {
            this.z += event.snapDistance;
            if (this.collection.type == 'tree') {this.collection.log()};
        });
        this.rxGizmo.onSnapObservable.add(event => {
            this.ax += Math.round(event.snapDistance*180/Math.PI);
            if (this.collection.type == 'tree') {this.collection.log()};
        });
        this.ryGizmo.onSnapObservable.add(event => {
            this.ay += Math.round(event.snapDistance*180/Math.PI);
            if (this.collection.type == 'tree') {this.collection.log()};
        });
        this.rzGizmo.onSnapObservable.add(event => {
            this.az += Math.round(event.snapDistance*180/Math.PI);
            if (this.collection.type == 'tree') {this.collection.log()};
        });

        // Hover over component
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(
            BABYLON.ActionManager.OnPointerOutTrigger, this, 'hovering', false));
        this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(
            BABYLON.ActionManager.OnPointerOverTrigger, this, 'hovering', true));

        // Click (select) component
        this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger, event => {this.manageSelection()}));
    }
}

// Define leaf class (fabric elements)
class Leaf extends Component {
    constructor(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az], lenX, lenY) {
        super(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az]);

        // Initialize properties
        this.type = 'leaf'; // Component type
        this.lenX = lenX; // Leaf length in x-dir
        this.lenY = lenY; // Leaf length in y-dir

        // Create mesh
        this.mesh = BABYLON.MeshBuilder.CreatePlane('leaf', {height:lenY, width:lenX, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});
        this.mesh.addRotation(-Math.PI/2, 0, 0); // Rotate to default orientation
        
            // Create nodes
            const nodeI = new Elements.Node(scene, this, 'i', [-lenX/2, lenY/2, 0]);
            this.elements.push(nodeI);
            const nodeJ = new Elements.Node(scene, this, 'j', [lenX/2, lenY/2, 0]);
            this.elements.push(nodeJ);
            const nodeK = new Elements.Node(scene, this, 'k', [lenX/2, -lenY/2, 0]);
            this.elements.push(nodeK);
            const nodeL = new Elements.Node(scene, this, 'l', [-lenX/2, -lenY/2, 0]);
            this.elements.push(nodeL);
            
            // Create area
            this.elements.push(new Elements.Area(scene, this, 'ijkl', nodeI, nodeJ, nodeK, nodeL, 
                0.05));
            
        // Create connections
        const right = new Connections.Edge(scene, this, 'right', [lenX/2, 0, 0, 0, 0, 0], lenY);
        const top = new Connections.Edge(scene, this, 'top', [0, lenY/2, 0, 0, 0, 90], lenX);
        const left = new Connections.Edge(scene, this, 'left', [-lenX/2, 0, 0, 0, 0, 0], lenY);
        const bottom = new Connections.Edge(scene, this, 'bottom', [0, -lenY/2, 0, 0, 0, 90], lenX);
        
            // Create monitors
            const ne = BABYLON.MeshBuilder.CreateBox('ne', {size:this.monitorSize});
            ne.translate(new BABYLON.Vector3(lenX/2, lenY/2, 0), 1, BABYLON.Space.WORLD);
            ne.isVisible = false;
            const nw = BABYLON.MeshBuilder.CreateBox('nw', {size:this.monitorSize});
            nw.translate(new BABYLON.Vector3(-lenX/2, lenY/2, 0), 1, BABYLON.Space.WORLD);
            nw.isVisible = false;
            const se = BABYLON.MeshBuilder.CreateBox('se', {size:this.monitorSize});
            se.translate(new BABYLON.Vector3(lenX/2, -lenY/2, 0), 1, BABYLON.Space.WORLD);
            se.isVisible = false;
            const sw = BABYLON.MeshBuilder.CreateBox('sw', {size:this.monitorSize});
            sw.translate(new BABYLON.Vector3(-lenX/2, -lenY/2, 0), 1, BABYLON.Space.WORLD);
            sw.isVisible = false;

            // Assign monitors to connections
            right.monitors = [se, ne];
            top.monitors = [ne, nw];
            left.monitors = [nw, sw];
            bottom.monitors = [sw, se];

        this.connections = [right, top, left, bottom];

        // Bounding box
        const rectBB = [
            new BABYLON.Vector3(-lenX/2+this.BBOffset, 0, lenY/2-this.BBOffset),
            new BABYLON.Vector3(lenX/2-this.BBOffset, 0, lenY/2-this.BBOffset),
            new BABYLON.Vector3(lenX/2-this.BBOffset, 0, -lenY/2+this.BBOffset),
            new BABYLON.Vector3(-lenX/2+this.BBOffset, 0, -lenY/2+this.BBOffset)
        ];
        const leafBB = BABYLON.MeshBuilder.ExtrudePolygon('leafBB', {shape:rectBB, 
            depth:this.BBOffset, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
        leafBB.addRotation(-Math.PI/2, 0, 0);
        leafBB.translate(new BABYLON.Vector3(0, 0, -this.BBOffset/2), 1, BABYLON.Space.WORLD);
        leafBB.isVisible = false;
        this.BB.push(leafBB);
        
        // Set parents
        this.parentConnections();
        this.parentBB();
        this.parentElements();

        // Set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, false, false, true]; // [dx, dy, dz, rx, ry, rz]
    }
}

// Define stem class (rods for connections or as frames)
class Stem extends Component {
    constructor(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az], angleBend, lenStem, 
        radStem, radFill, radConn, lenConn, thickBT, reflected, numArcPts, numFillPts) {
        super(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az]);
        
        // Initialize properties
        this.type = 'stem'; // Component type
        this.angleBend = angleBend; // Stem bend angle (in degrees)
        this.lenStem = lenStem; // Stem length from conn. to conn.
        this.radStem = radStem; // Outer radius of stem tube
        this.radFill = radFill; // Fillet radius of stem bend
        this.radConn = radConn; // Radius of connection
        this.lenConn = lenConn; // Length of connection
        this.thickBT = thickBT; // Thickness of branches & trunk ribs in the collection
        this.reflected = reflected; // Toggle for if stem is reflected along longitudinal axis
        this.numArcPts = numArcPts; // # of points defining circle arc resolution
        this.numFillPts = numFillPts; // # of points defining fillet arc resolution

        // Create tube
        const tubePath = [new BABYLON.Vector3(0, 0, 0)];
        for (let i = 0; i <= numFillPts; i++) { // Fillet arc
            tubePath.push(new BABYLON.Vector3(lenStem/2-radFill*Math.tan(angleBend*Math.PI/360)
                +radFill*Math.sin(i*angleBend*Math.PI/180/numFillPts), 0, 
                radFill*(1-Math.cos(i*angleBend*Math.PI/180/numFillPts))));
        }
        tubePath.push(new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, 
            (lenStem/2)*Math.sin(angleBend*Math.PI/180)));
        let tubeCap = BABYLON.Mesh.CAP_END;
        if (reflected == 1) {
            tubeCap = BABYLON.Mesh.CAP_START;
        }
        var tube = BABYLON.MeshBuilder.CreateTube('tube', {path:tubePath, radius:radStem, 
            tessellation:numArcPts, cap:tubeCap, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            
            // Create nodes
            const nodeI = new Elements.Node(scene, this, 'i', [0, 0, 0]);
            this.elements.push(nodeI);
            const nodeJ = new Elements.Node(scene, this, 'j', [lenStem/2, 0, 0]);
            this.elements.push(nodeJ);
            const nodeK = new Elements.Node(scene, this, 'k', [(lenStem/2)*(1
                +Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)*Math.sin(angleBend*Math.PI/180)]);
            this.elements.push(nodeK);

            // Bounding boxes
            const rectBB = [
                new BABYLON.Vector3(-radStem+this.BBOffset/2, 0, -radStem+this.BBOffset/2),
                new BABYLON.Vector3(-radStem+this.BBOffset/2, 0, radStem-this.BBOffset/2),
                new BABYLON.Vector3(radStem-this.BBOffset/2, 0, radStem-this.BBOffset/2),
                new BABYLON.Vector3(radStem-this.BBOffset/2, 0, -radStem+this.BBOffset/2)
            ];
            let preOffset = -1.5*this.BBOffset;
            let postOffset = this.BBOffset;
            if (reflected == 1) {
                preOffset = this.BBOffset;
                postOffset = -1.5*this.BBOffset;
            }

                // Pre fillet bounding box
                const preBB = BABYLON.MeshBuilder.ExtrudePolygon('preBB', {shape:rectBB, 
                    depth:lenStem/2+preOffset, 
                    sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                preBB.addRotation(0, 0, Math.PI/2);
                preBB.translate(new BABYLON.Vector3(-preOffset, 0, 0), 1, BABYLON.Space.WORLD);
                preBB.isVisible = false;
                this.BB.push(preBB);

                // Fillet bounding box
                if (angleBend != 0) {
                    const fillBB = BABYLON.MeshBuilder.ExtrudePolygon('fillBB', {shape:rectBB, 
                        depth:2*radFill*Math.sin(angleBend*Math.PI/360), 
                        sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                    fillBB.addRotation(0, 0, Math.PI/2);
                    fillBB.translate(new BABYLON.Vector3(lenStem/2-radFill*Math.tan(angleBend
                        *Math.PI/360), 0, 0), 1, BABYLON.Space.WORLD);
                    fillBB.addRotation(-angleBend*Math.PI/360, 0, 0);
                    fillBB.isVisible = false;
                    this.BB.push(fillBB);
                }

                // Post fillet bounding box
                const postBB = BABYLON.MeshBuilder.ExtrudePolygon('postBB', {shape:rectBB, 
                    depth:lenStem/2+postOffset, 
                    sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                postBB.addRotation(0, 0, Math.PI/2);
                postBB.translate(new BABYLON.Vector3(lenStem/2, 0, 0), 1, BABYLON.Space.WORLD);
                postBB.addRotation(-angleBend*Math.PI/180, 0, 0);
                postBB.isVisible = false;
                this.BB.push(postBB);

        // Create male mesh
        let maleConnPath = [
            new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)
                *Math.sin(angleBend*Math.PI/180)),
            new BABYLON.Vector3((lenStem/2)+(lenStem/2+lenConn)*(Math.cos(angleBend*Math.PI/180)), 
                0, (lenStem/2+lenConn)*Math.sin(angleBend*Math.PI/180))
        ];
        if (reflected == 1) {
            maleConnPath = [
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(-lenConn, 0, 0)
            ];
        }
        var maleConn = BABYLON.MeshBuilder.CreateTube('maleConn', {path:maleConnPath, 
            radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        // Create female mesh
        let femConnPath = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(lenConn, 0, 0)
        ];
        if (reflected == 1) {
            femConnPath = [
                new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, 
                    (lenStem/2)*Math.sin(angleBend*Math.PI/180)),
                new BABYLON.Vector3((lenStem/2)+(lenStem/2-lenConn)*(Math.cos(angleBend
                    *Math.PI/180)), 0, (lenStem/2-lenConn)*Math.sin(angleBend*Math.PI/180))
            ];
        }
        var femConn = BABYLON.MeshBuilder.CreateTube('femConn', {path:femConnPath, 
            radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_END, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        // Create cap (on female end)
        const circle = Geometry.pillShape(radStem, 0, 0, 0, numArcPts);
        const hole = [Geometry.pillShape(radConn, 0, 0, 0, numArcPts)];
        var cap = BABYLON.MeshBuilder.ExtrudePolygon('cap', {shape:circle, holes:hole, 
            depth:0, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
        cap.addRotation(0, 0, Math.PI/2);
        if (reflected == 1) {
            cap.translate(new BABYLON.Vector3((lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 
                0, (lenStem/2)*Math.sin(angleBend*Math.PI/180)), 1, BABYLON.Space.WORLD);
            cap.addRotation(-angleBend*Math.PI/180, 0, 0);
        }

        // Merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes([tube, maleConn, femConn, cap], true, true, 
            undefined, false, false);
        this.mesh.addRotation(-Math.PI/2, Math.PI/2, Math.PI); // Rotate to default orientation
        
        // Create stem connections
        const offset = 0.005;
        let femPosi = [0, 0, 0, 0, 0, -90];
        let femPoso = [lenConn, 0, 0];
        let femPosn = [-lenConn, 0, 0];
        let malePosi = [(lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)
            *Math.sin(angleBend*Math.PI/180), -angleBend, 0, -90];
        let malePoso = [(lenStem/2)+(lenStem/2+lenConn)*Math.cos(angleBend*Math.PI/180), 0, 
            (lenStem/2+lenConn)*Math.sin(angleBend*Math.PI/180)];
        if (reflected == 1) {
            femPosi = [(lenStem/2)*(1+Math.cos(angleBend*Math.PI/180)), 0, (lenStem/2)
                *Math.sin(angleBend*Math.PI/180), angleBend, 0, 90];
            femPoso = [(lenStem/2)+(lenStem/2-lenConn)*Math.cos(angleBend*Math.PI/180), 0, 
                (lenStem/2-lenConn)*Math.sin(angleBend*Math.PI/180)];
            femPosn = [(lenStem/2)+(lenStem/2+lenConn)*Math.cos(angleBend*Math.PI/180), 0, 
                (lenStem/2+lenConn)*Math.sin(angleBend*Math.PI/180)];
            malePosi = [0, 0, 0, 0, 0, 90];
            malePoso = [-lenConn, 0, 0];
        }
        const femStem = new Connections.Joint(scene, this, 'femStem', femPosi, radStem+offset, 
            lenConn, numArcPts);
        const maleStem = new Connections.Joint(scene, this, 'maleStem', malePosi, radStem+offset, 
            lenConn, numArcPts);

            // Create monitors
            let fi = BABYLON.MeshBuilder.CreateBox('fi', {size:this.monitorSize});
            fi.translate(new BABYLON.Vector3(femPosi[0], femPosi[1], femPosi[2]), 1, 
                BABYLON.Space.WORLD);
            fi.isVisible = false;
            const fo = BABYLON.MeshBuilder.CreateBox('fo', {size:this.monitorSize});
            fo.translate(new BABYLON.Vector3(femPoso[0], femPoso[1], femPoso[2]), 1, 
                BABYLON.Space.WORLD);
            fo.isVisible = false;
            let mi = BABYLON.MeshBuilder.CreateBox('mi', {size:this.monitorSize});
            mi.translate(new BABYLON.Vector3(malePosi[0], malePosi[1], malePosi[2]), 1, 
                BABYLON.Space.WORLD);
            mi.isVisible = false;
            const mo = BABYLON.MeshBuilder.CreateBox('mo', {size:this.monitorSize});
            mo.translate(new BABYLON.Vector3(malePoso[0], malePoso[1], malePoso[2]), 1, 
                BABYLON.Space.WORLD);
            mo.isVisible = false;

            // Assign monitors to connections
            femStem.monitors = [fi, fo];
            maleStem.monitors = [mi, mo];
        
        this.connections = [femStem, maleStem];

            // Create nuts
            const radNut = 0.375;
            const femNutCapPath = [
                new BABYLON.Vector3(femPosi[0], femPosi[1], femPosi[2]),
                new BABYLON.Vector3(femPosn[0], femPosn[1], femPosn[2])
            ];
            const femNutCap = BABYLON.MeshBuilder.CreateTube('femNutCap', {path:femNutCapPath, 
                radius:radNut, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_ALL, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            const femNutConnPath = [
                new BABYLON.Vector3(femPosi[0], femPosi[1], femPosi[2]),
                new BABYLON.Vector3(femPoso[0], femPoso[1], femPoso[2])
            ];
            const femNutConn = BABYLON.MeshBuilder.CreateTube('femNutConn', {path:femNutConnPath, 
                radius:radConn, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_ALL, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            this.femNut = BABYLON.Mesh.MergeMeshes([femNutCap, femNutConn], true, true, 
                undefined, false, false);
            const maleNutPath = [
                new BABYLON.Vector3(malePosi[0], malePosi[1], malePosi[2]),
                new BABYLON.Vector3(malePoso[0], malePoso[1], malePoso[2])
            ];
            this.maleNut = BABYLON.MeshBuilder.CreateTube('maleNut', {path:maleNutPath, 
                radius:radNut, tessellation:numArcPts, cap:BABYLON.Mesh.CAP_ALL, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE});
            
        // Create branch/trunk connections

            // Initialize variables
            let spaceRem = lenStem/2-radFill*Math.tan(angleBend*Math.PI/360);
            let i = 1;
            let radFrame = 0.125;
            let nodeIJ = null;
            let nodeJK = null;
            let prevIJ = nodeI;
            let prevJK = nodeK;
            
            // Add connections
            while (spaceRem >= thickBT) {
                femPosi = [(i-1)*thickBT, 0, 0, 0, 0, -90];
                let femPosii = [i*thickBT, 0, 0];
                malePosi = [(lenStem/2)+(lenStem/2-i*thickBT)*Math.cos(angleBend*Math.PI/180), 
                    0, (lenStem/2-i*thickBT)*Math.sin(angleBend*Math.PI/180), -angleBend, 0, -90];
                let malePosii = [(lenStem/2)+(lenStem/2-i*thickBT)*Math.cos(angleBend*Math.PI/180), 
                    0, (lenStem/2-i*thickBT)*Math.sin(angleBend*Math.PI/180)];
                if (reflected == 1) {
                    femPosi = [(lenStem/2)+(lenStem/2-(i-1)*thickBT)*Math.cos(angleBend*Math.PI/180), 
                        0, (lenStem/2-(i-1)*thickBT)*Math.sin(angleBend*Math.PI/180), angleBend, 0, 90];
                    femPosii = [(lenStem/2)+(lenStem/2-i*thickBT)*Math.cos(angleBend*Math.PI/180), 
                        0, (lenStem/2-i*thickBT)*Math.sin(angleBend*Math.PI/180)];
                    malePosi = [i*thickBT, 0, 0, 0, 0, 90];
                    malePosii = [i*thickBT, 0, 0];
                }
                const femBT = new Connections.Joint(scene, this, 'femBT', femPosi, 
                    radStem+offset/2, thickBT, numArcPts);
                const maleBT = new Connections.Joint(scene, this, 'maleBT', malePosi, 
                    radStem+offset/2, thickBT, numArcPts);
                
                    // Create monitors
                    const fii = BABYLON.MeshBuilder.CreateBox('fii', {size:this.monitorSize});
                    fii.translate(new BABYLON.Vector3(femPosii[0], femPosii[1], femPosii[2]), 
                        1, BABYLON.Space.WORLD);
                    fii.isVisible = false;
                    const mii = BABYLON.MeshBuilder.CreateBox('mii', {size:this.monitorSize});
                    mii.translate(new BABYLON.Vector3(malePosii[0], malePosii[1], malePosii[2]), 
                        1, BABYLON.Space.WORLD);
                    mii.isVisible = false;

                    // Assign monitors to connections
                    femBT.monitors = [fi, fii];
                    maleBT.monitors = [mi, mii];

                    // Create nodes
                    nodeIJ = new Elements.Node(scene, this, 'ij', [(i-1)*thickBT+thickBT/2, 0, 0]);
                    this.elements.push(nodeIJ);
                    nodeJK = new Elements.Node(scene, this, 'jk', [(lenStem/2)+(lenStem/2
                        -i*thickBT+thickBT/2)*Math.cos(angleBend*Math.PI/180), 0, 
                        (lenStem/2-i*thickBT+thickBT/2)*Math.sin(angleBend*Math.PI/180)]);
                    this.elements.push(nodeJK);

                    // Create frames
                    this.elements.push(new Elements.Frame(scene, this, 'ij', prevIJ, nodeIJ, 
                        radFrame, 1, 1, 1, 1)); // TO-DO update properties
                    this.elements.push(new Elements.Frame(scene, this, 'jk', prevJK, nodeJK, 
                        radFrame, 1, 1, 1, 1)); // TO-DO update properties
                
                // Update variables
                this.connections.push(femBT);
                this.connections.push(maleBT);
                mi = mii;
                fi = fii;
                prevIJ = nodeIJ;
                prevJK = nodeJK;
                spaceRem -= thickBT;
                i++;
            }

                    // Create remaining frames
                    this.elements.push(new Elements.Frame(scene, this, 'ij', prevIJ, nodeJ, 
                        radFrame, 1, 1, 1, 1)); // TO-DO update properties
                    this.elements.push(new Elements.Frame(scene, this, 'jk', prevJK, nodeJ, 
                        radFrame, 1, 1, 1, 1)); // TO-DO update properties

        // Set parents
        this.parentConnections();
            this.femNut.parent = this.mesh;
            this.maleNut.parent = this.mesh;
        this.parentBB();
        this.parentElements();

        // Set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.disableEdgesRendering();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, true, false, false]; // [dx, dy, dz, rx, ry, rz]
    }
}

// Define branch class (frame members with holes & slots)
class Branch extends Component {
    constructor(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az], lenBranch, 
        thickBranch, radBranch, radHole, spacHole, lenSlot, reflected, numArcPts) {
        super(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az]);

        // Initialize properties
        this.type = 'branch'; // Component type
        this.lenBranch = lenBranch; // Branch length from end hole to end hole
        this.thickBranch = thickBranch; // Branch thickness
        this.radBranch = radBranch; // Outer radius of branch profile
        this.radHole = radHole; // Radius of holes
        this.spacHole = spacHole; // Center-to-center spacing between holes
        this.lenSlot = lenSlot; // Max length of slot hole
        this.reflected = reflected; // Toggle for if branch is reflected (ends flipped)
        this.numArcPts = numArcPts; // # of points defining circle arc resolution

        // Create profile shape
        const profile = Geometry.pillShape(radBranch, lenBranch, 0, 0, numArcPts);

            // Above holes bounding box
            const above = [
                new BABYLON.Vector3(0, 0, radBranch-this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, radBranch-this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, radHole+this.BBOffset),
                new BABYLON.Vector3(0, 0, radHole+this.BBOffset)
            ];
            const aboveBB = BABYLON.MeshBuilder.ExtrudePolygon('aboveBB', {shape:above, 
                depth:thickBranch-2*this.BBOffset, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
            aboveBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
            aboveBB.isVisible = false;
            this.BB.push(aboveBB);

            // Below holes bounding box
            const below = [
                new BABYLON.Vector3(0, 0, -radBranch+this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, -radBranch+this.BBOffset),
                new BABYLON.Vector3(lenBranch, 0, -radHole-this.BBOffset),
                new BABYLON.Vector3(0, 0, -radHole-this.BBOffset)
            ];
            const belowBB = BABYLON.MeshBuilder.ExtrudePolygon('belowBB', {shape:below, 
                depth:thickBranch-2*this.BBOffset, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
            belowBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
            belowBB.isVisible = false;
            this.BB.push(belowBB);

        // Create hole shapes
        const holes = [];

            // Left circle hole is local origin
            const leftHole = Geometry.pillShape(radHole, 0, 0, 0, numArcPts);
            holes.push(leftHole);
                // Create node
                const nodeI = new Elements.Node(scene, this, 'i', [0, -thickBranch/2, 0]);
                this.elements.push(nodeI);

                // Create connection
                const leftConn = new Connections.Joint(scene, this, 'left', [0, -thickBranch, 0, 
                    0, 0, 0], radHole, thickBranch, numArcPts);

                    // Create monitors
                    const mL0 = BABYLON.MeshBuilder.CreateBox('mL0', {size:this.monitorSize});
                    mL0.translate(new BABYLON.Vector3(0, 0, 0), 1, BABYLON.Space.WORLD);
                    mL0.isVisible = false;
                    const mL1 = BABYLON.MeshBuilder.CreateBox('mL1', {size:this.monitorSize});
                    mL1.translate(new BABYLON.Vector3(0, -thickBranch, 0), 1, BABYLON.Space.WORLD);
                    mL1.isVisible = false;
                    leftConn.monitors = [mL0, mL1];
                
                this.connections.push(leftConn);

                // Left of holes bounding box
                const left = [
                    new BABYLON.Vector3(-radBranch+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(-radBranch+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const leftBB = BABYLON.MeshBuilder.ExtrudePolygon('leftBB', {shape:left, 
                    depth:thickBranch-2*this.BBOffset, 
                    sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                leftBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                leftBB.isVisible = false;
                this.BB.push(leftBB);

            // Process slot lengths
            let spacRem = lenBranch-2*spacHole;
            const tempLengths = [];
            while (spacRem > lenSlot) {
                tempLengths.push(lenSlot);
                spacRem -= (lenSlot+spacHole);
            }
            if (spacRem >= 0) {tempLengths.push(spacRem)};
            let lengths = tempLengths;
            if (reflected == 1) {
                lengths = tempLengths.reverse();
            }

            // Slot holes
            let startSlot = spacHole;
            for (let i = 0; i < lengths.length; i++) {
                const slotHole = Geometry.pillShape(radHole, lengths[i], startSlot, 0, numArcPts);
                holes.push(slotHole);

                // Create connection
                this.connections.push(new Connections.Slot(scene, this, i.toString(), [startSlot, 0, 0, 0, 0, 0], radHole, lengths[i], thickBranch, numArcPts));
                
                // Between holes bounding box
                const btwn = [
                    new BABYLON.Vector3(startSlot-spacHole+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(startSlot-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(startSlot-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(startSlot-spacHole+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const btwnBB = BABYLON.MeshBuilder.ExtrudePolygon('btwnBB', {shape:btwn, 
                    depth:thickBranch-2*this.BBOffset, 
                    sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                btwnBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                btwnBB.isVisible = false;
                this.BB.push(btwnBB);

                startSlot += lengths[i]+spacHole;
            }

                // Right of final slot bounding box
                const finSlotR = [
                    new BABYLON.Vector3(lenBranch-spacHole+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(lenBranch-spacHole+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const finSlotRBB = BABYLON.MeshBuilder.ExtrudePolygon('finSlotRBB', {shape:finSlotR, 
                    depth:thickBranch-2*this.BBOffset, 
                    sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                finSlotRBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                finSlotRBB.isVisible = false;
                this.BB.push(finSlotRBB);

            // Right circle hole
            const rightHole = Geometry.pillShape(radHole, 0, lenBranch, 0, numArcPts);
            holes.push(rightHole);
                // Create node
                const nodeJ = new Elements.Node(scene, this, 'j', [lenBranch, -thickBranch/2, 0]);
                this.elements.push(nodeJ);

                // Create connection
                const rightConn = new Connections.Joint(scene, this, 'right', [lenBranch, -thickBranch, 0, 0, 0, 0], radHole, thickBranch, numArcPts);
                
                    // Create monitors
                    const mR0 = BABYLON.MeshBuilder.CreateBox('mR0', {size:this.monitorSize});
                    mR0.translate(new BABYLON.Vector3(lenBranch, 0, 0), 1, BABYLON.Space.WORLD);
                    mR0.isVisible = false;
                    const mR1 = BABYLON.MeshBuilder.CreateBox('mR1', {size:this.monitorSize});
                    mR1.translate(new BABYLON.Vector3(lenBranch, -thickBranch, 0), 1, BABYLON.Space.WORLD);
                    mR1.isVisible = false;
                    rightConn.monitors = [mR0, mR1];
                
                this.connections.push(rightConn);

                // Right of holes bounding box
                const right = [
                    new BABYLON.Vector3(lenBranch+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch+radBranch-this.BBOffset, 0, radHole+this.BBOffset),
                    new BABYLON.Vector3(lenBranch+radBranch-this.BBOffset, 0, -radHole-this.BBOffset),
                    new BABYLON.Vector3(lenBranch+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                ];
                const rightBB = BABYLON.MeshBuilder.ExtrudePolygon('rightBB', {shape:right, 
                    depth:thickBranch-2*this.BBOffset, 
                    sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                rightBB.translate(new BABYLON.Vector3(0, -this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                rightBB.isVisible = false;
                this.BB.push(rightBB);

        // Extrude & create mesh
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon('branch', {shape:profile, holes:holes, 
            depth:thickBranch,
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
        this.mesh.addRotation(-Math.PI/2, 0, 0); // Rotate to default orientation
                // Create frame
                this.elements.push(new Elements.Frame(scene, this, 'ij', nodeI, nodeJ, 0.25, 1, 1, 1, 1)); // TO-DO update properties

        // Set parents
        this.parentConnections();
        this.parentBB();
        this.parentElements();

        // Set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, false, false, true]; // Array of which gizmos to include [dx, dy, dz, rx, ry, rz]
    }
}

// Define trunk class (plank tiles with holed ribs)
class Trunk extends Component {
    constructor(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az], lenTrunk, widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, radHole, spacHole, overhang, reflected, numArcPts) {
        super(scene, collection, snapDist, snapRot, [x, y, z, ax, ay, az]);

        // Initialize properties
        this.type = 'trunk'; // Component type
        this.lenTrunk = lenTrunk; // Trunk length from end hole to end hole
        this.lenTile = lenTrunk+2*(2*radRib+overhang); // Tile length
        this.widthTile = widthTile; // Tile width
        this.thickTile = thickTile; // Tile thickness
        this.numRibs = numRibs; // # of ribs
        this.thickRib = thickRib; // Rib thickness
        this.radRib = radRib; // Outer radius of rib profile
        this.spacRib = spacRib; // Clear spacing between ribs
        this.edgeRib = edgeRib; // Tile side edge distance before first rib (if not reflected)
        this.radHole = radHole; // Radius of holes
        this.spacHole = spacHole; // Center-to-center spacing between holes
        this.reflected = reflected; // Toggle for if trunk is reflected along longitudinal axis
        this.overhang = overhang; // Tile end edge distance overhanging rib end
        this.numArcPts = numArcPts; // # of points defining circle arc resolution

        const edgeRibLast = widthTile-edgeRib-numRibs*thickRib-(numRibs-1)*spacRib; // Tile side edge distance after last rib (if not reflected)
        let edgeRibFirst = edgeRib;
        if (reflected == 1) {
            edgeRibFirst = edgeRibLast;
        }

        const meshes = [];

        // Create tile
        const rect = [
            new BABYLON.Vector3(-2*radRib-overhang, 0, 0),
            new BABYLON.Vector3(-2*radRib-overhang+this.lenTile, 0, 0),
            new BABYLON.Vector3(-2*radRib-overhang+this.lenTile, 0, widthTile),
            new BABYLON.Vector3(-2*radRib-overhang, 0, widthTile)
        ];
        const tile = BABYLON.MeshBuilder.ExtrudePolygon('tile', {shape:rect, 
            depth:thickTile, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
        tile.addRotation(Math.PI/2, 0, 0);
        tile.translate(new BABYLON.Vector3(0, 0, 2*radRib), 1, BABYLON.Space.WORLD);
        meshes.push(tile);

            // Tile bounding box
            const rectBB = [
                new BABYLON.Vector3(-2*radRib-overhang+this.BBOffset, 0, this.BBOffset),
                new BABYLON.Vector3(-2*radRib-overhang+this.lenTile-this.BBOffset, 0, this.BBOffset),
                new BABYLON.Vector3(-2*radRib-overhang+this.lenTile-this.BBOffset, 0, widthTile-this.BBOffset),
                new BABYLON.Vector3(-2*radRib-overhang+this.BBOffset, 0, widthTile-this.BBOffset)
            ];
            const tileBB = BABYLON.MeshBuilder.ExtrudePolygon('tileBB', {shape:rectBB, 
                depth:thickTile-2*this.BBOffset, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
            tileBB.addRotation(Math.PI/2, 0, 0);
            tileBB.translate(new BABYLON.Vector3(0, 0, 2*radRib-this.BBOffset), 1, BABYLON.Space.WORLD);
            tileBB.isVisible = false;
            this.BB.push(tileBB);

        // Create ribs
        for (let j = 0; j < numRibs; j++) {
            const profile = [];

            // Top left quarter-circle
            for (let i = 0; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(radRib*(-2+Math.sin(i*2*Math.PI/numArcPts)), 0, radRib*Math.cos(i*2*Math.PI/numArcPts)));
            }
            
            // Bottom left quarter-circle
            for (let i = 1; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(-radRib*Math.cos(i*2*Math.PI/numArcPts), 0, -radRib*Math.sin(i*2*Math.PI/numArcPts)));
            }

            // Flat edge
            profile.push(new BABYLON.Vector3(lenTrunk, 0, -radRib));

            // Bottom right quarter-circle
            for (let i = 1; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(lenTrunk+radRib*Math.sin(i*2*Math.PI/numArcPts), 0, -radRib*Math.cos(i*2*Math.PI/numArcPts)));
            }

            // Top right quarter-circle
            for (let i = 1; i <= numArcPts/4; i++) {
                profile.push(new BABYLON.Vector3(lenTrunk+radRib*(2-Math.cos(i*2*Math.PI/numArcPts)), 0, radRib*Math.sin(i*2*Math.PI/numArcPts)));
            }

            // Holes
            const holes = [];
            let k = 0;
            for (let i = 0; i <= lenTrunk; i += spacHole) {
                const hole = Geometry.pillShape(radHole, 0, i, 0, numArcPts);
                holes.push(hole);

                // Create connection
                const holeConn = new Connections.Joint(scene, this, j.toString+','+k.toString(), [i, -edgeRibFirst-thickRib-j*(thickRib+spacRib), 0, 0, 0, 0], radHole, thickRib, numArcPts);

                    // Create monitors
                    const m0 = BABYLON.MeshBuilder.CreateBox('m0', {size:this.monitorSize});
                    m0.translate(new BABYLON.Vector3(i, -edgeRibFirst-j*(thickRib+spacRib), 0), 1, BABYLON.Space.WORLD);
                    m0.isVisible = false;
                    const m1 = BABYLON.MeshBuilder.CreateBox('m1', {size:this.monitorSize});
                    m1.translate(new BABYLON.Vector3(i, -edgeRibFirst-thickRib-j*(thickRib+spacRib), 0), 1, BABYLON.Space.WORLD);
                    m1.isVisible = false;
                    holeConn.monitors = [m0, m1];
                
                this.connections.push(holeConn);
                k++;
            }

            // Extrude & create mesh
            const rib = BABYLON.MeshBuilder.ExtrudePolygon('rib', {shape:profile, holes:holes, 
                depth:thickRib, 
                sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
            rib.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib), 0), 1, BABYLON.Space.WORLD);
            meshes.push(rib);

                // Rib bounding boxes
                    // Above holes
                    const above = [
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, radRib),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, radRib),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, radHole+this.BBOffset)
                    ];
                    const aboveBB = BABYLON.MeshBuilder.ExtrudePolygon('aboveBB', {shape:above, 
                        depth:thickRib-2*this.BBOffset, 
                        sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                    aboveBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    aboveBB.isVisible = false;
                    this.BB.push(aboveBB);

                    // Below holes
                    const below = [
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, -radRib+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, -radRib+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, -radHole-this.BBOffset),
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, -radHole-this.BBOffset)
                    ];
                    const belowBB = BABYLON.MeshBuilder.ExtrudePolygon('belowBB', {shape:below, 
                        depth:thickRib-2*this.BBOffset, 
                        sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                    belowBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    belowBB.isVisible = false;
                    this.BB.push(belowBB);

                    // Left of holes
                    const left = [
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                        new BABYLON.Vector3(-radRib+this.BBOffset, 0, -radHole-this.BBOffset)
                    ];
                    const leftBB = BABYLON.MeshBuilder.ExtrudePolygon('leftBB', {shape:left, 
                        depth:thickRib-2*this.BBOffset, 
                        sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                    leftBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    leftBB.isVisible = false;
                    this.BB.push(leftBB);

                    // Between holes
                    for (let i = 0; i < lenTrunk; i += spacHole) {
                        const btwn = [
                            new BABYLON.Vector3(i+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                            new BABYLON.Vector3(i+spacHole-radHole-this.BBOffset, 0, radHole+this.BBOffset),
                            new BABYLON.Vector3(i+spacHole-radHole-this.BBOffset, 0, -radHole-this.BBOffset),
                            new BABYLON.Vector3(i+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                        ];
                        const btwnBB = BABYLON.MeshBuilder.ExtrudePolygon('btwnBB', {shape:btwn, 
                            depth:thickRib-2*this.BBOffset, 
                            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                        btwnBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                        btwnBB.isVisible = false;
                        this.BB.push(btwnBB);
                    }

                    // Right of holes
                    const right = [
                        new BABYLON.Vector3(lenTrunk+radHole+this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, radHole+this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radRib-this.BBOffset, 0, -radHole-this.BBOffset),
                        new BABYLON.Vector3(lenTrunk+radHole+this.BBOffset, 0, -radHole-this.BBOffset)
                    ];
                    const rightBB = BABYLON.MeshBuilder.ExtrudePolygon('rightBB', {shape:right, 
                        depth:thickRib-2*this.BBOffset, 
                        sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
                    rightBB.translate(new BABYLON.Vector3(0, -edgeRibFirst-j*(thickRib+spacRib)-this.BBOffset, 0), 1, BABYLON.Space.WORLD);
                    rightBB.isVisible = false;
                    this.BB.push(rightBB);
        }

        // Merge meshes
        this.mesh = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
        this.mesh.addRotation(-Math.PI/2, 0, 0); // Rotate to default orientation

        // Set parents
        this.parentConnections();
        this.parentBB();
        this.parentElements();

        // Set starting position & rotation
        this.move(x, y, z);
        this.rotate(ax, ay, az);

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
        this.inclGizmos = [true, true, true, false, false, true]; // Array of which gizmos to include [dx, dy, dz, rx, ry, rz]
    }
}

export { Component, Leaf, Stem, Branch, Trunk };
