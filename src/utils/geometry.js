import * as BABYLON from 'babylonjs';

// Define pill shape (Vector3 array)
function pillShape(rad, len, startX, startZ, numArcPts) {
    var pill = [];

    // Left semicircle edge
    for (let i = 0; i <= numArcPts/2; i++) {
        pill.push(new BABYLON.Vector3(startX+rad*Math.cos(Math.PI/2+i*2*Math.PI/numArcPts), 
        0, startZ+rad*Math.sin(Math.PI/2+i*2*Math.PI/numArcPts)));
    }

    // Flat edge
    if (len > 0) {
        pill.push(new BABYLON.Vector3(startX+len, 0, startZ-1*rad));
    }

    // Right semicircle edge
    for (let i = 0; i <= numArcPts/2; i++) {
        pill.push(new BABYLON.Vector3(startX+len+rad*Math.cos(-Math.PI/2+i*2*Math.PI/numArcPts), 
        0, startZ+rad*Math.sin(-Math.PI/2+i*2*Math.PI/numArcPts)));
    }

    return pill;
}

export {pillShape};