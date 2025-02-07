import * as BABYLON from 'babylonjs';
import earcut from 'earcut';

// Define element class (base class for structural analysis)
class Element {
    constructor(scene, component, ID) {
        // Initialize properties
        this.scene = scene; // Scene hosting element
        this.component = component; // Component the element is a part of
        this.ID = ID; // Element ID
        this.mesh = null; // Initialize null mesh

        // Default material
        this.defMat = new BABYLON.StandardMaterial("defMat", scene);
        this.defCol = new BABYLON.Color3(1, 1, 1);
        this.defMat.diffuseColor = this.defCol;

        // Selected material
        this.selMat = new BABYLON.StandardMaterial("selMat", scene);
        this.selCol = new BABYLON.Color3(0, 1, 0);
        this.selMat.diffuseColor = this.selCol;

        // Intersected material
        this.intMat = new BABYLON.StandardMaterial("intMat", scene);
        this.intCol = new BABYLON.Color3(1, 0, 0);
        this.intMat.diffuseColor = this.intCol;
    }

    // show element
    show() {
        this.mesh.isVisible = true;
    }

    // hide element
    hide() {
        this.mesh.isVisible = false;
    }

    // toggle element visibility
    toggle() {
        this.mesh.isVisible = !this.mesh.isVisible;
    }

    // delete element
    delete() {
        this.mesh.dispose();
    }

    // set up element visuals
    setupVisuals() {
        // default visibility
        this.hide();
        
        // initialize mesh material
        this.mesh.material = this.defMat;
    }

    // set up element controls & responses
    setupControls() {
    
    }
}

// define node class (for structural analysis)
class Node extends Element {
    constructor(scene, component, ID, [x, y, z]) {
        super(scene, component, ID);
        
        // initialize properties
        // TO-DO update coordinates when components moved
        this.x = x; // node x coordinate
        this.y = y; // node y coordinate
        this.z = z; // node z coordinate

        // create mesh
        this.mesh = BABYLON.MeshBuilder.CreateSphere("node", {diameter:0.75, segments:component.collection.numArcPts});
        this.mesh.position.x += x;
        this.mesh.position.y += y;
        this.mesh.position.z += z;

        // set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

// define frame element class (for structural analysis)
class Frame extends Element {
    constructor(scene, component, ID, nodeI, nodeJ, radMesh, A, E, Iy, Iz) {
        super(scene, component, ID);
        
        // initialize properties
        this.nodeI = nodeI; // frame node I
        this.nodeJ = nodeJ; // frame node J
        this.L = Math.sqrt(Math.pow(nodeJ.x-nodeI.x, 2)+Math.pow(nodeJ.y-nodeI.y, 2)+Math.pow(nodeJ.z-nodeI.z, 2)); // frame length
        this.A = A; // frame sectional area
        this.E = E; // frame young's modulus
        this.Iy = Iy; // frame moment of inertia over local y-axis
        this.Iz = Iz; // frame moment of inertia over local z-axis

        // create mesh
        const path = [new BABYLON.Vector3(nodeI.x, nodeI.y, nodeI.z), new BABYLON.Vector3(nodeJ.x, nodeJ.y, nodeJ.z)];
        this.mesh = BABYLON.MeshBuilder.CreateTube("frame", {path:path, radius:radMesh, tessellation:component.collection.numArcPts, sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        // set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }

    // TO-DO construct local & global stiffness matrices
}

// MAYBE define link element class (for structural analysis) extends frame class

// define area element class (for structural analysis)
class Area extends Element {
    constructor(scene, component, ID, nodeI, nodeJ, nodeK, nodeL, thickMesh) {
        super(scene, component, ID);
        
        // initialize properties
        this.nodeI = nodeI; // area node I
        this.nodeJ = nodeJ; // area node J
        this.nodeK = nodeK; // area node K
        this.nodeL = nodeL; // area node L
        // TO-DO add structural properties

        // create mesh
        const rect = [
            new BABYLON.Vector3(nodeI.x, 0, nodeI.y),
            new BABYLON.Vector3(nodeJ.x, 0, nodeJ.y),
            new BABYLON.Vector3(nodeK.x, 0, nodeK.y),
            new BABYLON.Vector3(nodeL.x, 0, nodeL.y)
        ];
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon("area", {shape:rect, 
            depth:thickMesh, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
        this.mesh.addRotation(Math.PI/2, 0, 0);
        this.mesh.position.z += thickMesh/2;

        // set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }

    // TO-DO construct local & global stiffness matrices
}

// define structural analysis class
class Analysis {
    constructor(tree) {
        // initialize properties
        this.tree = tree; // tree this analysis is for
        this.nodes = []; // initialize empty array of nodes
        this.frames = []; // initialize empty array of frames
        this.areas = []; // initialize empty array of areas
    }

    // TO-DO process nodes, removing overlapping nodes
    // TO-DO check stability
    // TO-DO construct stiffness matrix
    // TO-DO solve stiffness equation
    // TO-DO display forces & deformed shape
}

export { Element, Node, Frame, Area, Analysis };