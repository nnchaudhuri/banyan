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
        this.defMat = new BABYLON.StandardMaterial('defMat', scene);
        this.defCol = new BABYLON.Color3(1, 1, 1);
        this.defMat.diffuseColor = this.defCol;

        // Selected material
        this.selMat = new BABYLON.StandardMaterial('selMat', scene);
        this.selCol = new BABYLON.Color3(0, 1, 0);
        this.selMat.diffuseColor = this.selCol;

        // Intersected material
        this.intMat = new BABYLON.StandardMaterial('intMat', scene);
        this.intCol = new BABYLON.Color3(1, 0, 0);
        this.intMat.diffuseColor = this.intCol;
    }

    // Show element
    show() {
        this.mesh.isVisible = true;
    }

    // Hide element
    hide() {
        this.mesh.isVisible = false;
    }

    // Toggle element visibility
    toggle() {
        this.mesh.isVisible = !this.mesh.isVisible;
    }

    // Delete element
    delete() {
        this.mesh.dispose();
    }

    // Set up element visuals
    setupVisuals() {
        // Default visibility
        this.hide();
        
        // Initialize mesh material
        this.mesh.material = this.defMat;
    }

    // Set up element controls & responses
    setupControls() {
    
    }
}

// Define node class (for structural analysis)
class Node extends Element {
    constructor(scene, component, ID, [x, y, z]) {
        super(scene, component, ID);
        
        // Initialize properties
        // TO-DO update coordinates when components moved
        this.x = x; // Node x coordinate
        this.y = y; // Node y coordinate
        this.z = z; // Node z coordinate

        // Create mesh
        this.mesh = BABYLON.MeshBuilder.CreateSphere('node', {diameter:0.75, 
            segments:component.collection.numArcPts});
        this.mesh.position.x += x;
        this.mesh.position.y += y;
        this.mesh.position.z += z;

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }
}

// Define frame element class (for structural analysis)
class Frame extends Element {
    constructor(scene, component, ID, nodeI, nodeJ, radMesh, A, E, Iy, Iz) {
        super(scene, component, ID);
        
        // Initialize properties
        this.nodeI = nodeI; // Frame node I
        this.nodeJ = nodeJ; // Frame node J
        this.L = Math.sqrt(Math.pow(nodeJ.x-nodeI.x, 2)+Math.pow(nodeJ.y-nodeI.y, 2)
            +Math.pow(nodeJ.z-nodeI.z, 2)); // Frame length
        this.A = A; // Frame sectional area
        this.E = E; // Frame young's modulus
        this.Iy = Iy; // Frame moment of inertia over local y-axis
        this.Iz = Iz; // Frame moment of inertia over local z-axis

        // Create mesh
        const path = [new BABYLON.Vector3(nodeI.x, nodeI.y, nodeI.z), 
            new BABYLON.Vector3(nodeJ.x, nodeJ.y, nodeJ.z)];
        this.mesh = BABYLON.MeshBuilder.CreateTube('frame', {path:path, radius:radMesh, 
            tessellation:component.collection.numArcPts, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE});

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }

    // TO-DO construct local & global stiffness matrices
}

// MAYBE define link element class (for structural analysis) extends frame class

// Define area element class (for structural analysis)
class Area extends Element {
    constructor(scene, component, ID, nodeI, nodeJ, nodeK, nodeL, thickMesh) {
        super(scene, component, ID);
        
        // Initialize properties
        this.nodeI = nodeI; // Area node I
        this.nodeJ = nodeJ; // Area node J
        this.nodeK = nodeK; // Area node K
        this.nodeL = nodeL; // Area node L
        // TO-DO add structural properties

        // Create mesh
        const rect = [
            new BABYLON.Vector3(nodeI.x, 0, nodeI.y),
            new BABYLON.Vector3(nodeJ.x, 0, nodeJ.y),
            new BABYLON.Vector3(nodeK.x, 0, nodeK.y),
            new BABYLON.Vector3(nodeL.x, 0, nodeL.y)
        ];
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon('area', {shape:rect, 
            depth:thickMesh, 
            sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene, earcut);
        this.mesh.addRotation(Math.PI/2, 0, 0);
        this.mesh.position.z += thickMesh/2;

        // Set up visuals & controls
        this.setupVisuals();
        this.mesh.actionManager = new BABYLON.ActionManager(scene);
        this.setupControls();
    }

    // TO-DO construct local & global stiffness matrices
}

// Define structural analysis class
class Analysis {
    constructor(tree) {
        // Initialize properties
        this.tree = tree; // Tree this analysis is for
        this.nodes = []; // Initialize empty array of nodes
        this.frames = []; // Initialize empty array of frames
        this.areas = []; // Initialize empty array of areas
    }

    // TO-DO process nodes, removing overlapping nodes
    // TO-DO check stability
    // TO-DO construct stiffness matrix
    // TO-DO solve stiffness equation
    // TO-DO display forces & deformed shape
}

export { Element, Node, Frame, Area, Analysis };