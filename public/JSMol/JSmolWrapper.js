var currentScript = document.currentScript;
var molecule = currentScript.dataset.id;
var orbital = currentScript.dataset.orbital;


var identificationNumber = Math.floor(Math.random() * 100000);

jmol_isReady = function (applet) {
	if (currentScript.dataset.border) {
		Jmol._getElement(applet, "appletdiv").style.border = "1px solid orange";
	}
	Jmol._getElement(applet, "appletinfotablediv").style.breakInside = "avoid";
	if (currentScript.dataset.multiple) {
		Jmol._getElement(applet, "appletinfotablediv").style.display = "inline-block";
	}
	else {
		Jmol._getElement(applet, "appletinfotablediv").style.margin = "auto";
	}
};
var tempHeight = cutEnd(currentScript.dataset.height);
var tempWidth = cutEnd(currentScript.dataset.width);

function cutEnd(input) {
	if (input && input.endsWith("px"))
		input.replace("px", "");
	return input;
}

var height = tempHeight ? tempHeight : "400";
var width = tempWidth ? tempWidth : "400";

myCallback = function (a, b, c, d) {
	console.log("Error", a, b, c, d)
};

var script = "";
if (molecule) {
	script = 'set zoomlarge false; set antialiasDisplay;'
		+ 'set errorCallback "myCallback";'
		+ 'load ASYNC ' + molecule + '; set spinY 10;';

	if (currentScript.dataset.symmetry) {

	}
	else if (currentScript.dataset.cartoon) {
		script += "cartoons on; spacefill off; wireframe off; color structure;"
	}
}
else if (orbital) {
	script = 'set zoomlarge false; set antialiasDisplay;'
		+ 'set errorCallback "myCallback";'
		+ 'isosurface phase atomicOrbital ' + orbital + ' translucent;' +
		'set axesMolecular; set axesScale 0.5; axes on; zoom 200; set spinY 10;';
}

if (currentScript.dataset.spin) {
	script += "spin ON;";
}

var Info = {
	width: width,
	height: height,
	debug: false,
	color: "white",
	addSelectionOptions: false,
	use: currentScript.dataset.webgl ? "WEBGL" : "HTML5",
	j2sPath: "https://libretexts.org/awesomefiles/JSmol/j2s",
	readyFunction: jmol_isReady,
	script: script,
	// disableJ2SLoadMonitor: false,
};

Jmol.getApplet("jmolApplet" + identificationNumber, Info);
console.log(window["jmolApplet" + identificationNumber]);
