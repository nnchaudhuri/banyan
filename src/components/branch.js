//define pill shape
function pillShape(rad, len, startX, startZ, numArcPts) {
    pill = [];

    //left semicircle edge
    for (let i = 0; i <= numArcPts/2; i++) {
        const vec = new BABYLON.Vector3(startX+rad*Math.cos(Math.PI/2+i*2*Math.PI/numArcPts), 0, startZ+rad*Math.sin(Math.PI/2+i*2*Math.PI/numArcPts));
        pill.push(vec);
    }

    //flat edge
    if (len > 0) {
        pill.push(new BABYLON.Vector3(startX+len, 0, startZ-1*rad));
    }

    //right semicircle edge
    for (let i = 0; i <= numArcPts/2; i++) {
        const vec = new BABYLON.Vector3(startX+len+rad*Math.cos(-Math.PI/2+i*2*Math.PI/numArcPts), 0, startZ+rad*Math.sin(-Math.PI/2+i*2*Math.PI/numArcPts));
        pill.push(vec);
    }

    return pill;
}

//define branch class
class Branch {
    constructor(name, lenBody, thickness, radOut, radHole, spacHole, lenSlot, numArcPts) {
        
        //initialize properties
        this.name = name; //mesh name
        this.lenBody = lenBody; //branch length from end hole to end hole
        this.thickness = thickness; //branch thickness
        this.radOut = radOut; //outer radius of branch profile
        this.radHole = radHole; //radius of holes
        this.spacHole = spacHole; //spacing between holes
        this.lenSlot = lenSlot; //max length of slot hole
        this.numArcPts = numArcPts; //# of points defining circle arc resolution
        this.x = 0; //x position (of left circle hole), initialize @ origin
        this.y = 0; //y position (of left circle hole), initialize @ origin
        this.z = 0; //z position (of left circle hole), initialize @ origin
        this.ax = 0; //x rotation (about left circle hole), initialize as 0
        this.ay = 0; //y rotation (about left circle hole), initialize as 0
        this.az = 0; //z rotation (about left circle hole), initialize as 0

        //create profile shape
        const profile = pillShape(radOut, lenBody, 0, 0, numArcPts);

        //create hole shapes
        const holes = [];

            //left circle hole
            const leftHole = pillShape(radHole, 0, 0, 0, numArcPts);
            holes.push(leftHole);

            //slot holes, max length
            let spacRem = lenBody-2*spacHole;
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
            const rightHole = pillShape(radHole, 0, lenBody, 0, numArcPts);
            holes.push(rightHole);

        //extrude & create mesh
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon(name, {shape:profile, holes:holes, depth:thickness, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
    }

    //move branch (globally)
    move(dx, dy, dz) {
        
        //update position properties
        this.x += dx;
        this.y += dy;
        this.z += dz;

        //move mesh
        this.mesh.translate(new BABYLON.Vector3(dx, dy, dz), 1, BABYLON.Space.WORLD);
    }

    //rotate branch (about left circle hole)
    rotate(rx, ry, rz) {

        //update rotation properties
        this.ax += rx;
        this.ay += ry;
        this.az += rz;

        //rotate mesh
        this.mesh.addRotation(0, 0, rz);
        this.mesh.addRotation(0, ry, 0);
        this.mesh.addRotation(rx, 0, 0);
    }
}

//create scene
const createScene = function () {
	
    //setup scene
    const scene = new BABYLON.Scene(engine);
	const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 0, 50, BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);
	const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 50, 0));

	//input properties
    const lenBody = 22; //branch length from end hole to end hole
    const thickness = 1; //branch thickness
    const radOut = 1; //outer radius of branch profile
    const radHole = 0.25; //radius of holes
    const spacHole = 2; //spacing between holes
    const lenSlot = 6; //max length of slot hole
    const numArcPts = 32; //# of points defining circle arc resolution

    //create test branch
    testBranch = new Branch("testBranch", lenBody, thickness, radOut, radHole, spacHole, lenSlot, numArcPts);

	return scene;
}


