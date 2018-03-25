
var currentScript = document.currentScript;
var molecule = currentScript.dataset.id;

// logic is set by indicating order of USE -- default is HTML5 for this test page, though
var use = "HTML5"

jmol_isReady = function(applet) {
	Jmol._getElement(applet, "appletdiv").style.border="1px dashed blue"
}

myCallback = function(a,b,c,d) {
	console.log("Error",a,b,c,d)
}

script = 'set zoomlarge false;set antialiasDisplay;'
+'set errorCallback "myCallback";'
+'set echo top left; echo loading '+molecule.substr(1)+'...; refresh;  cartoons on;'
+'load ASYNC '+molecule+'; cartoons on;set spinY 10; set echo top center; echo '+molecule.substr(1)+';'

if(currentScript.dataset.cartoon){
	script +="cartoons on; spacefill off; wireframe off; color structure;"
}

if(currentScript.dataset.spin){
	 script +="spin ON;";
}

var Info = {
	width: 450,
	height: 450,
	debug: false,
	color: "white",
	addSelectionOptions: false,
	serverURL: "https://chemapps.stolaf.edu/jmol/jsmol/php/jsmol.php",
	use: use,
	j2sPath: "https://calcplot3.firebaseapp.com/JSMol/j2s",
	readyFunction: jmol_isReady,
	script: script,
	//jarPath: "java",
	//jarFile: (useSignedApplet ? "JmolAppletSigned.jar" : "JmolApplet.jar"),
	//isSigned: useSignedApplet,
	//disableJ2SLoadMonitor: true,
	disableInitialConsole: true
	//defaultModel: "$dopamine",
	//console: "none", // default will be jmolApplet0_infodiv
}

jmolApplet0 = Jmol.getApplet("jmolApplet"+Math.floor(Math.random()*100000), Info)
