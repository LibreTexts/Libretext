var currentScript = document.currentScript;
var molecule = currentScript.dataset.id;
var index = Math.floor(Math.random() * 100000);

var height = currentScript.dataset.height ? currentScript.dataset.height : "400px";
var width = currentScript.dataset.width ? currentScript.dataset.width : "400px";

var target = document.createElement("div");
target.id = 'GL' + index;
var style = "position: relative; width: " + width + "; " + (currentScript.dataset.width ? "" : " max-width: 80%; ") + "height:" + height + "; margin: auto; ";
if (!currentScript.dataset.noborder) {
	style += "border: 1px solid dodgerblue; ";
}
if (currentScript.dataset.multiple) {
	style += "display: inline-block; ";
}
if (currentScript.attributes.alt) {
	target.setAttribute("alt", currentScript.attributes.alt.textContent);
}
target.onclick = function(){
	var current = window[this.id];
	current.change = 0;
	// clearTimeout(current.timeout);
	// current.timeout = setTimeout(function(){current.change = 0.0005;
	// 	window.requestAnimationFrame((timestamp) => step(timestamp, current.id.substr(2)));},5000);
};
target.style.cssText = style;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

var label = document.createElement("div");
label.style.cssText = "position: absolute; right:5px; bottom:5px; color: " + (currentScript.dataset.showLabel ? "dodgerblue" : "white") + "; font-family:Segoe UI,Arial,sans-serif; font-size: 20px";
label.appendChild(document.createTextNode("GLmol"));
label.title = "(C) Copyright 2011 biochem_fan (biochem_fan at users.sourceforge.jp). \n" +
	"This program is released under LGPL3.";
target.appendChild(label);

var label2 = document.createElement("div");
label2.style.cssText = "position: absolute; top:5px; left:5px; color: dodgerblue; font-family:Segoe UI,Arial,sans-serif; font-size: 20px";
label2.id = 'GL' + index + 'title';
target.appendChild(label2);

window['GL' + index] = new GLmol('GL' + index, true);
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
window['GL' + index].change = 0.0005;
var step = function (timestamp, index) {
	if(window['GL' + index].change) {
		window['GL' + index].dx += window['GL' + index].change;

		window['GL' + index].rotate(window['GL' + index].dx, 0);
		window.requestAnimationFrame((timestamp) => step(timestamp, index));
	}
};

function download(query, index) {
	var uri = '';

	query = query ? query : '=2POR';

	switch (query.substr(0, 1)) {
		case "$":
			query = query.substr(1).toUpperCase();
			uri = "https://cactus.nci.nih.gov/chemical/structure/" + query + "/file?format=sdf&get3d=true";
			break;
		case "=":
			query = query.substr(1).toUpperCase();
			if (!query.match(/^[1-9][A-Za-z0-9]{3}$/)) {
				alert("Wrong PDB ID");
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

	$.get(uri, function (ret) {
		// console.log(ret);
		window['GL' + index].loadMoleculeStr(ret);
		if (currentScript.dataset.spin)
			window.requestAnimationFrame((timestamp) => step(timestamp, index));
	});
}

window['GL' + index].defineRepresentation = function () {
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
