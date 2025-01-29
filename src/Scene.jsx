import React, { useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import * as Components from './components.js';

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
    });

    // Setup light
    const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 50, 0));
    scene.registerBeforeRender(function () {
        light.direction = camera.position;
    });

    /*
    // Default component properties (if not loading from file)
    const lenX = 6; // Leaf length in x-dir
    const lenY = 4; // Leaf length in y-dir

    const radHole = 0.25; // Hole radius
    const spacHole = 2; // Hole center-to-center spacing
    
    const angleBend = 90; // Stem bend angle (in degrees)
    const lenStem = 4; // Stem length from conn. to conn.
    const radStem = radHole; // Stem tube outer radius
    const radFill = 1; // Stem bend fillet radius
    const radConn = radStem/2; // Connection radius
    const lenConn = 0.5; // Connection length

    const lenBranch = 22; // Branch length from end hole to end hole
    const thickBranch = 1; // Branch thickness
    const radBranch = 1; // Branch profile outer radius
    const lenSlot = 6; // Slot hole max length

    const lenTrunk = 22; // Trunk length from end hole to end hole
    const widthTile = 4; // Tile width
    const thickTile = 1; // Tile thickness
    const numRibs = 2; // Ribs count
    const thickRib = thickBranch; // Rib thickness
    const radRib = 1; // Rib profile outer radius
    const spacRib = thickBranch; // Ribs clear spacing
    const edgeRib = thickBranch; // Tile side edge distance before first rib (if not reflected)
    const overhang = 1; // Tile end edge distance overhanging rib end
    */

    // General interface properties
    const snapDist = 1; // snap distance for gizmo controls
    const snapRot = 15; // snap rotation angle (in degrees) for gizmo controls
    const numArcPts = 64; // # of points defining circle arc resolution
    const numFillPts = 32; // # of points defining fillet arc resolution

    // Create test tree (press 'l' key to load tree from file)
    let tree = new Components.Tree(scene, numArcPts, numFillPts, snapDist, snapRot);
    scene.registerBeforeRender(function() {
        tree.checkIntersections(tree.components);
        tree.checkConnections(tree.components);
        tree.updateVisuals(tree.components);
    });

    /*
    // Create test almanac
    let almanac = new Components.Almanac(scene, numArcPts, numFillPts);
    //almanac.generateLeaves([0, 0, 0], [2, 2, 12], [2, 2, 12]);
    //almanac.generateStems([0, 0, 0], [0, 45, 90], [2, 2, 8], radStem, radFill, radConn, lenConn, thickBranch);
    //almanac.generateBranches([0, 0, 0], [2, 2, 30], thickBranch, radBranch, radHole, spacHole, lenSlot);
    //almanac.generateTrunks([0, 0, 0], [3, 1, 6], [6, 2, 18], thickTile, thickRib, radRib, spacRib, edgeRib, radHole, spacHole, overhang);
    scene.registerBeforeRender(function() {
      almanac.updateVisuals();
    });
    */

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize engine when the window is resized
    window.addEventListener('resize', () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
    };
  }, []);

  return <canvas id="scene" style={{ width: '100%', height: '100%' }} />;
};

export default Scene;
