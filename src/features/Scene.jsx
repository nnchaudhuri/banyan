import { useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import * as Collections from '../utils/collections.js';
import * as Components from '../utils/components.js';

const Scene = () => {
  useEffect(() => {
    // Create canvas
    const canvas = document.getElementById('scene');

    // Create Babylon.js engine
    const engine = new BABYLON.Engine(canvas, true);

    // Setup scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);

    // Setup orthogonal camera
    const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI/4, Math.PI/4, 100, 
      BABYLON.Vector3.Zero());
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
    });

    // Setup light
    const light = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 50, 0));
    scene.registerBeforeRender(function () {
        light.direction = camera.position;
    });

    // Default component properties
    const radHole = 0.25; // Hole radius
    const spacHole = 2; // Hole center-to-center spacing
    const radStem = radHole; // Stem tube outer radius
    const radFill = 1; // Stem bend fillet radius
    const radConn = radStem/2; // Connection radius
    const lenConn = 0.5; // Connection length
    const thickBranch = 1; // Branch thickness
    const radBranch = 1; // Branch profile outer radius
    const lenSlot = 6; // Slot hole max length
    const widthTile = 4; // Tile width
    const thickTile = 1; // Tile thickness
    const numRibs = 2; // Ribs count
    const thickRib = thickBranch; // Rib thickness
    const radRib = 1; // Rib profile outer radius
    const spacRib = thickBranch; // Ribs clear spacing
    const edgeRib = thickBranch; // Tile side edge distance before first rib (if not reflected)
    const overhang = 1; // Tile end edge distance overhanging rib end

    // General interface properties
    const snapDist = 1; // Snap distance for gizmo controls
    const snapRot = 15; // Snap rotation angle (in degrees) for gizmo controls
    const numArcPts = 64; // # of points defining circle arc resolution
    const numFillPts = 32; // # of points defining fillet arc resolution

    // Create test tree
    let tree = new Collections.Tree(scene, numArcPts, numFillPts, snapDist, snapRot);
    scene.registerBeforeRender(function() {
      tree.checkIntersections(tree.components);
      tree.checkConnections(tree.components);
      tree.updateVisuals(tree.components);
    });

    /*
    // Load example tree from file by default
    const defaultLoadFile = () => {
      try {
        const response = fetch('../assets/myTree.txt');
        const fileContent = response.text();
        
        // Create components per file lines
        const lines = fileContent.split('\n');
        tree.expand(lines);
      } catch (error) {
        console.error('Failed to load tree from file:', error);
      }
    };
    defaultLoadFile();
    */

    // Action handlers
    const actionHandlers = {
      loadFile: () => tree.load(),
      saveFile: () => tree.save(),
      undo: () => tree.undo(),
      redo: () => tree.redo(),
      selectAll: () => tree.selectAll(),
      deselectAll: () => tree.deselectAll(),
      copy: () => tree.copySelected(),
      delete: () => tree.formalDeleteSelected(),
      move: () => tree.toggleGizmosSelected(),
      reflect: () => tree.reflectSelected(),
      connections: () => tree.toggleAllConnections(),
      transparency: () => tree.toggleAllTransparency(),
      addTrunk: (values) => {
        tree.add(new Components.Trunk(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0],
          values[0], widthTile, thickTile, numRibs, thickRib, radRib, spacRib, edgeRib, 
          radHole, spacHole, overhang, 0, numArcPts));
        tree.log();
      },
      addBranch: (values) => {
        tree.add(new Components.Branch(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], 
          values[0], thickBranch, radBranch, radHole, spacHole, lenSlot, 0, numArcPts));
        tree.log();
      },
      addStem: (values) => {
        tree.add(new Components.Stem(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], 
          0, values[0], radStem, radFill, radConn, lenConn, thickBranch, 0, numArcPts, numFillPts));
        tree.log();
      },
      addLeaf: (values) => {
        tree.add(new Components.Leaf(scene, tree, snapDist, snapRot, [0, 0, 0, 0, 0, 0], 
          values[0], values[1]));
        tree.log();
      },
    };

    // Store listener references for cleanup
    const eventListeners = {};
    Object.keys(actionHandlers).forEach(action => {
      let listener;
      switch (action) {
        case 'addTrunk':
        case 'addBranch':
        case 'addStem':
        case 'addLeaf':
          listener = (event) => {
            actionHandlers[action](event.detail.values);
          };
          window.addEventListener(action, listener);
          break;
        default:
          listener = actionHandlers[action];
          window.addEventListener(action, listener);
          break;
      }
      eventListeners[action] = listener;
    });

    // Resize listener stored for removal
    const resizeListener = () => {
      engine.resize();
    };
    window.addEventListener('resize', resizeListener);

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      engine.dispose();
      // Remove action listeners
      Object.keys(eventListeners).forEach(action => {
        window.removeEventListener(action, eventListeners[action]);
      });
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  return <canvas id='scene' style={{ width: '100%', height: '100%' }} />;
};

export default Scene;