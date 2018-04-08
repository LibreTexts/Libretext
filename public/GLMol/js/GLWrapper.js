var currentScript = document.currentScript;
var molecule = currentScript.dataset.id;
var index = Math.floor(Math.random() * 100000);

var height = currentScript.dataset.height ? currentScript.dataset.height : "400px";
var width = currentScript.dataset.width ? currentScript.dataset.width : "400px";

var target = document.createElement("div");
target.id = 'glmol' + index;
var style = "position: relative; " + (width ? (" width: " + width + "; ") : "max-width: 80%; ") + "height:" + height + "; margin: auto; border: 1px solid dodgerblue; ";
if (currentScript.dataset.multiple) {
	style += "display: inline-block;"
}

target.style.cssText = style;
document.currentScript.parentNode.insertBefore(target, document.currentScript);

var label = document.createElement("div");
label.style.cssText = "position: absolute; right:5px; bottom:5px; color: dodgerblue; font-family:Segoe UI,Arial,sans-serif; font-size: 20px";
label.appendChild(document.createTextNode("GLmol"));
label.title = "(C) Copyright 2011 biochem_fan (biochem_fan at users.sourceforge.jp). \n" +
	"This program is released under LGPL3.";
target.appendChild(label, document.currentScript);

var label2 = document.createElement("div");
label2.style.cssText = "position: absolute; top:5px; left:5px; color: dodgerblue; font-family:Segoe UI,Arial,sans-serif; font-size: 20px";
label2.id = 'glmol' + index + 'title';
target.appendChild(label2, document.currentScript);

window['GL' + index] = new GLmol('glmol' + index, true);
download(molecule, index);


function download(query, index) {
	var baseURL = '';
	
	query = query ? query : '=2POR';
	
	switch (query.substr(0, 1)) {
		case "$":
			query = query.substr(1).toUpperCase();
			uri = "https://cactus.nci.nih.gov/chemical/structure/" + query + "/file?format=sdf&get3d=true"
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
			if (!query.match(/^[1-9]+$/)) {
				alert("Wrong Compound ID");
				return;
			}
			uri = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + query +
				"/SDF?record_type=3d";
			break;
	}
	
	$.get(uri, function (ret) {
		// console.log(ret);
		window['GL' + index].loadMoleculeStr(ret);
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
