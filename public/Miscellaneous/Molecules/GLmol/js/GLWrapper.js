var currentScript = document.currentScript;
var molecule = currentScript.dataset.id;
var index = Math.floor(Math.random() * 100000);

var height = currentScript.dataset.height || "400px";
var width = currentScript.dataset.width || "400px";
var enabled = !currentScript.dataset.disabled;

var target = document.createElement("div");
target.id = 'GL' + index;
target.classList.add('glmol');

if (!window["GLloaded"]) {
	alert('Make sure to set the "Embed GLmol" tag to "yes"  under \'Page settings\' at top of page for this to work');
}

var style = "position: relative; width: " + width + "; " + (currentScript.dataset.width ? "" : " max-width: 80%; ") + "height:" + height + "; margin: auto; ";
if (currentScript.dataset.border) {
	style += "border: 1px solid dodgerblue; ";
}
if (currentScript.dataset.multiple) {
	style += "display: inline-block; ";
}
if (currentScript.attributes.alt) {
	target.setAttribute("alt", currentScript.attributes.alt.textContent);
}

function stopSpin() {
	var current = window[this.id];
	current.change = 0;
	// clearTimeout(current.timeout);
	// current.timeout = setTimeout(function(){current.change = current.speed;
	// 	window.requestAnimationFrame((timestamp) => step(timestamp, current.id.substr(2)));},5000);
};
if (enabled) {
	target.onclick = stopSpin;
	target.ontouchstart = stopSpin;
}
target.style.cssText = style;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

var label = document.createElement("div");
label.style.cssText = "position: absolute; right:5px; bottom:5px; color: " + (currentScript.dataset.label ? "dodgerblue" : "white") + "; font-family:Segoe UI,Arial,sans-serif; font-size: 20px; z-index:1";
label.appendChild(document.createTextNode("GLmol"));
label.title = "(C) Copyright 2011 biochem_fan (biochem_fan at users.sourceforge.jp). \n" +
	"This program is released under LGPL3.";
target.appendChild(label);

var label2 = document.createElement("div");
label2.style.cssText = "position: absolute; top:5px; left:5px; color: dodgerblue; font-family:Segoe UI,Arial,sans-serif; font-size: 20px";
label2.id = 'GL' + index + 'title';
target.appendChild(label2);

window['GL' + index] = new GLmol('GL' + index, true, enabled);
download(molecule, index);

window['GL' + index].rotate = function (dx, dy) {
	var r = Math.sqrt(dx * dx + dy * dy);
	var rs = Math.sin(r * Math.PI) / r;
	this.dq.x = Math.cos(r * Math.PI);
	this.dq.y = 0;
	this.dq.z = rs * dx;
	this.dq.w = rs * dy;
	this.rotationGroup.quaternion = new THREE.Quaternion(1, 0, 0, 0);
	this.rotationGroup.quaternion.multiplySelf(this.dq);
	this.rotationGroup.quaternion.multiplySelf(this.cq);
	this.show();
};

window['GL' + index].dx = 0;
window['GL' + index].speed = (currentScript.dataset.speed ? currentScript.dataset.speed : 5) / 10000;
window['GL' + index].change = window['GL' + index].speed;
var step = function (timestamp, index) {
	if (window['GL' + index].change) {
		window['GL' + index].dx += window['GL' + index].change;

		window['GL' + index].rotate(window['GL' + index].dx, 0);
		window.requestAnimationFrame((timestamp) => step(timestamp, index));
	}
};

function download(query, index) {
	var uri = '';

	query = query ? query : '=2POR';

	if (query.startsWith("http")) {
		uri = query;
	}
	else {
		switch (query.substr(0, 1)) {
			case "$":
				query = query.substr(1).toUpperCase();
				uri = "https://cactus.nci.nih.gov/chemical/structure/" + query + "/file?format=sdf&get3d=true";
				break;
			case "=":
				query = query.substr(1).toUpperCase();
				if (!query.match(/^[1-9][A-Za-z0-9]{3}$/)) {
					// alert("Wrong PDB ID");
					return;
				}
				uri = "https://files.rcsb.org/view/" + query + ".pdb";
				break;
			case ":":
				query = query.substr(1);
				if (query.match(/^[0-9]+$/)) {
					uri = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + query +
						"/record/SDF/";
					break;
				}
				else {
					uri = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/" + query +
						"/record/SDF/";
					break;
				}
			default:
				uri = query;
				break;
		}
	}

	$.get(uri, function (ret) {
		// console.log(ret);
		window['GL' + index].loadMoleculeStr(ret, -parseFloat(currentScript.dataset.defaultZoom));
		if (currentScript.dataset.spin)
			window.requestAnimationFrame((timestamp) => step(timestamp, index));
	});
}

window['GL' + index].defineRepresentation = defineRepFromController;

function oldRepresentation() {
	var all = this.getAllAtoms();
	var hetatm = this.removeSolvents(this.getHetatms(all));
	this.colorByAtom(all, {});
	this.colorChainbow(all);
	var asu = new THREE.Object3D();

	this.drawBondsAsStick(asu, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, true, 0.3);
	this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['A'])), [58, 87]), this.cylinderRadius, this.cylinderRadius);
	this.drawBondsAsStick(asu, this.getResiduesById(this.getSidechains(this.getChain(all, ['B'])), [63, 92]), this.cylinderRadius, this.cylinderRadius);
	this.drawCartoon(asu, all, this.curveWidth, this.thickness);

	this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
	this.modelGroup.add(asu);
};

function defineRepFromController() {
	//options
	const colorMode = currentScript.dataset.colormode;
	const mainchainMode = currentScript.dataset.mainchain;
	const doNotSmoothen = currentScript.dataset.roughBeta;
	const sidechains = currentScript.dataset.sidechains;
	const hetatmMode = currentScript.dataset.hetatmMode;
	const showNonBonded = currentScript.dataset.nonbonded;
	const baseHetatmMode = currentScript.dataset.baseHetatmMode;
	const projectionMode = currentScript.dataset.projectionmode;

	const unitCell = currentScript.dataset.unitcell;
	const bioAssembly = currentScript.dataset.bioassembly;
	const crystalPacking = currentScript.dataset.crystalpacking;
	const symmetry = currentScript.dataset.symmetry;
	const defaultZoom = currentScript.dataset.defaultZoom;
	var all = this.getAllAtoms();
	if (bioAssembly && this.protein.biomtChains != "") all = this.getChain(all, this.protein.biomtChains);
	var allHet = this.getHetatms(all);
	var hetatm = this.removeSolvents(allHet);

	var asu = new THREE.Object3D();

	this.colorByAtom(all, {});

	switch (colorMode) {
		case "chain":
			this.colorByChain(all);
			break;
		case "b":
			this.colorByBFactor(all);
			break;
		case "polarity":
			this.colorByPolarity(all, 0xcc0000, 0xcccccc);
			break;
		case "ss":
			this.colorByStructure(all, 0xcc00cc, 0x00cccc);
			break;
		default: //chainbow
			this.colorChainbow(all);
			break;
	}


	switch (mainchainMode) {
		case "ribbon":
			this.drawCartoon(asu, all, doNotSmoothen);
			this.drawCartoonNucleicAcid(asu, all);
			break;
		case "strand":
			this.drawStrand(asu, all, null, null, null, null, null, doNotSmoothen);
			this.drawStrandNucleicAcid(asu, all);
			break;
		case "chain":
			this.drawMainchainCurve(asu, all, this.curveWidth, 'CA', 1);
			this.drawMainchainCurve(asu, all, this.curveWidth, 'O3\'', 1);
			break;
		case "cylinderHelix":
			this.drawHelixAsCylinder(asu, all, 1.6);
			this.drawCartoonNucleicAcid(asu, all);
			break;
		case "tube":
			this.drawMainchainTube(asu, all, 'CA');
			this.drawMainchainTube(asu, all, 'O3\''); // FIXME: 5' end problem!
			break;
		case "bonds":
			this.drawBondsAsLine(asu, all, this.lineWidth);
			break;
		case "none":
			break;
		default: //thickRibbon
			this.drawCartoon(asu, all, doNotSmoothen, this.thickness);
			this.drawCartoonNucleicAcid(asu, all, null, this.thickness);
			break;
	}

	if (sidechains) {
		this.drawBondsAsLine(this.modelGroup, this.getSidechains(all), this.lineWidth);
	}

	switch (baseHetatmMode) {
		case "stick":
			this.drawNucleicAcidStick(this.modelGroup, all);
			break;
		case "polygon":
			this.drawNucleicAcidLadder(this.modelGroup, all);
			break;
		case "none":
			break;
		default : //line
			this.drawNucleicAcidLine(this.modelGroup, all);
			break;
	}

	var nonBonded = this.getNonbonded(allHet);
	switch (showNonBonded) {
		case "sphere":
			this.drawAtomsAsIcosahedron(target, nonBonded, 0.3, true);
			break;
		case "cross":
			this.drawAsCross(target, nonBonded, 0.3, true);
			break;
		default: //none
			break;
	}

	const target = symmetry ? asu : this.modelGroup;
	switch (hetatmMode) {
		case "sphere":
			this.drawAtomsAsSphere(target, hetatm, this.sphereRadius);
			break;
		case "line":
			this.drawBondsAsLine(target, hetatm, this.curveWidth);
			break;
		case "icosahedron":
			this.drawAtomsAsIcosahedron(target, hetatm, this.sphereRadius);
			break;
		case"stick":
			this.drawBondsAsStick(target, hetatm, this.cylinderRadius, this.cylinderRadius, true);
			break;
		case "ballAndStick":
			this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, false, 0.3);
			break;
		default:
			this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, true, 0.3);
			break;
	}

	if (projectionMode === 'perspective') this.camera = this.perspectiveCamera;
	else if (projectionMode === 'orthoscopic') this.camera = this.orthoscopicCamera;

	if (unitCell) {
		this.drawUnitcell(this.modelGroup);
	}

	if (bioAssembly) {
		this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
	}
	if (crystalPacking) {
		this.drawSymmetryMatesWithTranslation2(this.modelGroup, asu, this.protein.symMat);
	}

	this.modelGroup.add(asu);
}
