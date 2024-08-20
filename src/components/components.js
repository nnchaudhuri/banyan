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
    constructor() {

        //initialize properties
        this.x = 0; //x position (of local origin), initialize @ origin
        this.y = 0; //y position (of local origin), initialize @ origin
        this.z = 0; //z position (of local origin), initialize @ origin
        this.ax = 0; //x rotation (about local origin), initialize as 0
        this.ay = 0; //y rotation (about local origin), initialize as 0
        this.az = 0; //z rotation (about local origin), initialize as 0
        this.mesh = null; //initialize null mesh
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

    //rotate component (about local origin)
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
}

//define branch class
class Branch extends Component {
    constructor(name, lenBranch, thickness, radBranch, radHole, spacHole, lenSlot, numArcPts) {
        super();

        //initialize properties
        this.name = name; //mesh name
        this.lenBranch = lenBranch; //branch length from end hole to end hole
        this.thickness = thickness; //branch thickness
        this.radBranch = radBranch; //outer radius of branch profile
        this.radHole = radHole; //radius of holes
        this.spacHole = spacHole; //spacing between holes
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
        this.mesh = BABYLON.MeshBuilder.ExtrudePolygon(name, {shape:profile, holes:holes, depth:thickness, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
    }
}

//define stem class
class Stem extends Component {
    constructor(name, angleBend, lenStem, radStem, radFill, radConn, lenConn,  numArcPts, numFillPts) {
        super();

        //initialize properties
        this.name = name; //mesh name
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
        for (let i = 0; i <= numFillPts; i++) {
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
    const lenBranch = 22; //branch length from end hole to end hole
    const thickness = 1; //branch thickness
    const radBranch = 1; //outer radius of branch profile
    const radHole = 0.25; //radius of holes
    const spacHole = 2; //spacing between holes
    const lenSlot = 6; //max length of slot hole

    const angleBend = 90; //stem bend angle (in degrees)
    const lenStem = 4; //stem length from conn. to conn.
    const radStem = radHole; //outer radius of stem tube
    const radFill = 1; //fillet radius of stem bend
    const radConn = radStem/2; //radius of connection
    const lenConn = 0.5; //length of connection

    const numArcPts = 32; //# of points defining circle arc resolution
    const numFillPts = 32; //# of points defining fillet arc resolution

    //create test branch
    testBranch = new Branch("testBranch", lenBranch, thickness, radBranch, radHole, spacHole, lenSlot, numArcPts);

    //create test stem
    testStem = new Stem("testStem", angleBend, lenStem, radStem, radFill, radConn, lenConn, numArcPts, numFillPts);

	return scene;
}


