const createScene = function () {
	//Setup Scene
    const scene = new BABYLON.Scene(engine);
	const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, 0, 50, BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);
	const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 50, 0));

	//Input Variables
    const lenBody = 22; //branch length from end hole to end hole
    const thickness = 1; //branch thickness
    const radOut = 1; //outer radius of branch profile
    const radHole = 0.25; //radius of holes
    const spacHole = 2; //spacing between holes
    const lenSlot = 6; //max length of slot hole
    const numArcPts = 32; //# of points defining circle arc resolution

    //Define Branch
    function branch(name, lenBody, thickness, radOut, radHole, spacHole, lenSlot, numArcPts) {
        //Define Pill Shape
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

        //Create Profile Shape
        const profile = pillShape(radOut, lenBody, 0, 0, numArcPts);

        //Create Hole Shapes
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
                spacRem = spacRem-(lenSlot+spacHole);
                startSlot = startSlot+lenSlot+spacHole;
            }

            //slot holes, shorter
            const slotHole = pillShape(radHole, spacRem, startSlot, 0, numArcPts);
            holes.push(slotHole);

            //right circle hole
            const rightHole = pillShape(radHole, 0, lenBody, 0, numArcPts);
            holes.push(rightHole);

        //Extrude
        const branch = BABYLON.MeshBuilder.ExtrudePolygon(name, {shape:profile, holes:holes, depth:thickness, sideOrientation:BABYLON.Mesh.DOUBLESIDE});
    }

    branch("branch", lenBody, thickness, radOut, radHole, spacHole, lenSlot, numArcPts);

	return scene;
}