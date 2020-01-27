/**
 *  --- molsym.js ---
 *
 * Copyright (c) 2008, Dean Johnston, Otterbein College, unless otherwise noted
 * Contact: djohnston@otterbein.edu
 *
 * The purpose of these routines is to extract data from the specified JSON document and
 * convert it into the necessary XYZ molecule animation string and other commands needed
 * to display symmetry elements.  A table of controls is also created for each element / 
 * operation pair.
 */
 

/* ---------------
 *     Point
 * --------------- */

function Point(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}


/* ---------------
 *    MolInfo
 * --------------- */

function molNode(name, file)
{
	this.name = name;
	this.file = file;
}

function pgNode(id)
{
	this.id = id;
	this.moleculeArray = [ ];
}

function pcNode(id)
{
	this.id = id;
	this.pointGroupArray = [ ];
}

function MolDataTree()
{
	this.pointClassArray = [ ];
}


 /* ---------------
 *     Global
 * --------------- */

var controlEL = null;			// event listener for clicks in control area
var p_axesEL = null;			// event listener for clicks on show_proper_axes 
var i_axesEL = null;			// event listener for clicks on show_improper_axes 
var planesEL = null;			// event listener for clicks on show_planes

var trailsEL = null;			// event listener for clicks on anim_trails	
var animTrailsOn = false;
var aaEL = null;				// event listener for clicks on antialias display
var gradEL = null;				// event listener for clicks on gradient background

var molData = new MolDataTree();
var s = null; 				// slider
var currPE = null;			// Periodical Executer for animations
var animGenerationComplete = false;

var jmolApplet0;	// set up in HTML table, below

jmol_isReady = function(applet) {

	if ($('molList') != null) {
		Jmol.script(jmolApplet0, "color background white; set echo bottom left; font echo 15 sansserif; color echo [90, 90, 90]; color fluorine [69,255,199]; echo Select a molecule...; delay 0.05;");
	}
	else {
		Jmol.script(jmolApplet0, "color background white ; set echo bottom left; font echo 15 sansserif; color echo [90, 90, 90]; color fluorine [69,255,199]; delay 0.05;");
		displayMolecule($('jmol').title + ".js", false, null);
				// Note - IE7 does not properly load molecule without the delay 0.01 command - don't know why...
			}

	$('jmolLoading').innerHTML = '';
}		

var Info = {
	width: "100%",
	height: "100%",
	script: "color background white; set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; color fluorine [69,255,199]; echo Select a molecule...; delay 0.05;",
	use: "HTML5",
	jarPath: "../common/jsmol/java",
	j2sPath: "../common/jsmol/j2s",
	jarFile: "JmolApplet.jar",
	isSigned: false,
	addSelectionOptions: false,
	serverURL: "http://chemapps.stolaf.edu/jmol/jsmol/php/jsmol.php",
	frank: "false",
	readyFunction: jmol_isReady,
	disableInitialConsole: true,
	disableJ2SLoadMonitor: true,
	defaultModel: null,
	debug: false,
};


/** - - - - - - - - - - - - - - -
 *       Utility Functions 
 * - - - - - - - - - - - - - - - */
 
function isString()			// Return a boolean value telling whether
							// the first argument is a string.
{
	if (typeof arguments[0] == 'string') {
		return true;
	}
	if (typeof arguments[0] == 'object')
	{  
		var criterion = arguments[0].constructor.toString().match(/string/i); 
 		return (criterion !== null);  
	}
	return false;
}

function format(expr, decplaces, field)	// if it's a number, formats to the given number of decimal places, if a string, just adds padding
{
	var neg = 0;
	var newstring = expr;
	var padding = 0;
	
	if (isString(expr))
	{
		padding = field - newstring.length;
		for (var i = 0; i < padding; i++) {
			newstring = " " + newstring;
		}
		return newstring;
	}

	if (expr < 0)
	{
		neg = 1;
		expr = -expr;
	}
	else
	{
		neg = 0;
	}

    // raise incoming value by power of 10 times the
    // number of decimal places; round to an integer; convert to string
    var str = "" + Math.round((expr) * Math.pow(10,decplaces));
    
	// pad small value strings with zeros to the left of rounded number

	while (str.length <= decplaces)
	{
        str = "0" + str;
	}

	// establish location of decimal point
    var decpoint = str.length - decplaces;

	// assemble final result from: (a) the string up to the position of
    // the decimal point; (b) the decimal point; and (c) the balance
    // of the string. Return finished product.
	newstring = str.substring(0,decpoint) + "." + str.substring(decpoint,str.length);
	if (neg == 1)
	{
		newstring =  "-" + newstring;
	}
	if (field < newstring.length) {
		return newstring;
	}
	else {
		padding = field - newstring.length;
		for (var j = 0; j < padding; j++) {
			newstring = " " + newstring;
		}
	}
	return newstring;
}


// from http://www.softwaresecretweapons.com/jspwiki/Wiki.jsp?page=JavascriptStringConcatenation
function StringBuffer() { 
   this.buffer = []; 
 } 

StringBuffer.prototype.append = function append(string) { 
   this.buffer.push(string); 
   return this; 
 }; 

StringBuffer.prototype.toString = function toString() { 
   return this.buffer.join(""); 
 }; 



function normalizeVector(vector) {                      // convert to unit length
	var ln = Math.sqrt( vector.x*vector.x + vector.y*vector.y + vector.z*vector.z );
	if (ln === 0) { return vector;  }                    // do nothing for nothing
	vector.x = vector.x/ln;
	vector.y = vector.y/ln;
	vector.z = vector.z/ln;
	return vector;
}

/*
   Rotate a point p by angle theta around an arbitrary axis vector
   Return the rotated point.
   Positive angles are anticlockwise looking down the axis
   towards the origin.
   Assume right hand coordinate system.
*/

function arbitraryRotate(p, theta, vector)
{
   var q = new Point(0.0,0.0,0.0);

   var r = normalizeVector(vector);
   var costheta = Math.cos(theta);
   var sintheta = Math.sin(theta);

   q.x += (costheta + (1 - costheta) * r.x * r.x) * p.x;
   q.x += ((1 - costheta) * r.x * r.y - r.z * sintheta) * p.y;
   q.x += ((1 - costheta) * r.x * r.z + r.y * sintheta) * p.z;

   q.y += ((1 - costheta) * r.x * r.y + r.z * sintheta) * p.x;
   q.y += (costheta + (1 - costheta) * r.y * r.y) * p.y;
   q.y += ((1 - costheta) * r.y * r.z - r.x * sintheta) * p.z;

   q.z += ((1 - costheta) * r.x * r.z - r.y * sintheta) * p.x;
   q.z += ((1 - costheta) * r.y * r.z + r.x * sintheta) * p.y;
   q.z += (costheta + (1 - costheta) * r.z * r.z) * p.z;

   return q;
}


function fillWindow()
{
	var iH = document.viewport.getHeight(); 
	var iW = document.viewport.getWidth(); 
	var appH = iH - 200;
	var appW = iW - 600;

	var size = Math.min(appW,appH);
	size = Math.max(size, 400);

	if ($("jmol") != null) {
		$("jmol").style.width = size + "px";
		$("jmol").style.height = size + "px"; }
		
	if ($("content") != null)
		$("content").style.width = (size + 300) + "px";
	
	if ($("control") != null) {
		$("control").style.left = (size + 240) + "px";
		$("control").style.height = (size - 10) + "px"; }

	if ($("flow") != null) {
		$("flow").style.left = (size - 400) + "px";
		$("feedback").style.left = (size + 240) + "px"; }

	if ($("slider-1") != null) {
		$("slider-1").style.width = (size + 2) + "px";
		s.setValue(2); 	s.setValue(1); }
	
	if ($("citation") != null) {
		$("citation").style.top = (size - 20) + "px";
		$("citation").style.width = size + "px"; }

	if ($("prefButton") != null)
		$("prefButton").style.top = (size + 60) + "px";
	
	if ($("molList") != null) {
		var molListSize = size-145;
		$("molList").style.height = molListSize + "px"; }
}



/** - - - - - - - - - - - - - - - - - - - - - - -
 *      Drop-Down Select Menu Replacement 
 * adapted from  http://www.easy-designs.net/
 * (creative commons) 1999-2007 Easy Designs, LLC
 * - - - - - - - - - - - - - - - - - - - - - - - */

function setVal(objID, selIndex)
{
	var obj = $(objID);
	obj.selectedIndex = selIndex;
}

function selectMe(obj)
{
	var lis = obj.parentNode.getElementsByTagName('li');
	for (var i=0; i<lis.length; i++)
	{
		if (lis[i] != obj)
		{
			lis[i].className='';
			lis[i].onclick = function() { selectMe(this); };
		} 
		else
		{
			setVal(obj.selectID, obj.selIndex);
			obj.className='selected';
			obj.parentNode.className = obj.parentNode.className.replace(new RegExp(" selectOpen\\b"), '');
			obj.onclick = function() {
				obj.parentNode.className += ' selectOpen';
				this.onclick = function() { selectMe(this); };
			};
		}
	}
	updateMolList(obj.getAttribute("id"));
}


function makeSelect(ulist)
{
	for (var i=0; i<ulist.length; i++)
	{
		var child = ulist[i];
		child.onclick = function() { selectMe(this); };
		child.selIndex = i;
		child.selectID = child.parentNode.id;
		if (child.className == 'selected')
		{
			child.onclick = function() {
				this.parentNode.className += ' selectOpen';
				this.onclick = function() { selectMe(this); };
			};
		}
		else
		{
			child.className = '';
		}
		if (window.attachEvent)
		{
			child.onmouseover = function() { this.className += ' hover'; };
			child.onmouseout = function() { this.className = this.className.replace(new RegExp(" hover\\b"), ''); };
		}
	}
}

function setList()
{
	var s = $('pcSelect');
	makeSelect(s.getElementsByTagName('li'), false);
	updateMolList("all");
}

/** - - - - - - - - - - - - - - - -
 *   Menu/table creation functions 
 * - - - - - - - - - - - - - - - - */

function remove_all_children( node ) 		// from http://dbaron.org/
{
	while ( node.hasChildNodes() ) 
	{
		node.removeChild ( node.firstChild );
	}
}

function sortMol(a, b)		// sort molecules (note  - toLowerCase() appears to mess with IE...)
{
	if (a > b) { return 1; }
	if (a < b) { return -1; }
	return 0;
}

function updateMolList(pid)
{
	var moldiv = $('molList');
	var ul = new Element('ul');
	var molCounter = 0;
	var innerArray = [ ];
	
	if (moldiv.hasChildNodes())
	{
		remove_all_children(moldiv);
	}

	if (pid == "pgall")		// have to figure out what point group class is selected
	{
		var li = $A($("pcSelect").childNodes);
		li.each(function(i) {
			if (i.nodeType == 1) {
				if (i.className == "selected") {
					pid = i.id;
				}
			}
		});
	}

	for (var c = 0, c_len = molData.pointclass.length; c < c_len; ++c)
	{
		for (var g = 0, g_len = molData.pointclass[c].pointgroup.length; g < g_len; ++g)
		{
			for (var m = 0, m_len = molData.pointclass[c].pointgroup[g].molecule.length; m < m_len; ++m)
			{
				if ((pid == molData.pointclass[c].id) || (pid == molData.pointclass[c].pointgroup[g].id) || (pid == "all"))
				{
					var file = molData.pointclass[c].pointgroup[g].molecule[m].file;
					var name = molData.pointclass[c].pointgroup[g].molecule[m].name;
					if (pid != "all")
					{
						var pgid = molData.pointclass[c].pointgroup[g].id;
						var formatted_pgid;
						if (pgid.length > 1) {
							formatted_pgid = pgid.substring(0, 1) + "<sub>" + pgid.substring(1, pgid.length) + "</sub>";
						}
						else {
							formatted_pgid = pgid;
						}
						name = formatted_pgid + " - " + name;
					}
					if (name.indexOf('<sup>') > -1) {
						var liClass = "super"; }
					else
						var liClass = "normal";
					innerArray[molCounter] = "<li name='" + name + "' id='" + file + "' class='" + liClass + "'>" + name + "</li>\n";
					molCounter++;
				}
			}
		}
	}

	innerArray.sort();
	for (var j = 0; j < molCounter; j++) {
		ul.innerHTML += innerArray[j];
	}
	moldiv.appendChild(ul);
}



/* ---------------
 *    Molecule
 * --------------- */

var Molecule = Class.create({
	initialize: function(filename, type, showCtl, appletSuffix, path) {
		this.filename = filename;
		this.suffix = (appletSuffix == null) ? '0' : appletSuffix;
		this.type = type;
		if (path != null)
			this.path = path;
		else if (this.type == 'js')
			this.path = "../common/molecules/json/";
		else if (this.type == 'xml')
			this.path = "../common/molecules/xml/";
		else if (this.type == 'mol')
			this.path = "../common/molecules/mol/";

		this.size = 1;
		this.ea = [ ];				// array of elements
		
		if (showCtl == null)
			showCtl = false;
		this.showCtl = showCtl;
		this.showPG = showCtl;
		
		if ($('slider-1') != null)
			$('slider-1').style.visibility="hidden";	// hide slider

		switch (this.type)
		{
			case 'js':
				var gjd = this._getJSONdata.bind(this);
				gjd(this);
				break;
			case 'xml':
				break;
			case 'mol':
				// jmolScript("load " + this.path + this.filename); 
				Jmol.script(jmolApplet0, "load " + this.path + this.filename); 
				break;
		}
	},

	_getJSONdata: function(molecule) {
		var jsonData = new Ajax.Request(molecule.path + molecule.filename, {
			method: 'get',
			onSuccess: function(transport) {
				var data = (transport.responseText).evalJSON();			// load molecule coords, bonds, etc.
				molecule.name = data.name;							// copy data into molecule
				molecule.atomArray = data.atomArray;
				molecule.bondArray = data.bondArray;
				molecule.faceArray = data.faceArray;
				molecule.inversionCenter = data.inversionCenter;
				molecule.properArray = data.properArray;
				molecule.improperArray = data.improperArray;
				molecule.reflectionArray = data.reflectionArray;
				molecule.pointGroup = data.pointGroup;
				molecule.citation = data.citation;
				molecule.nom = data.nom;
				molecule.calcSize();								// calculate size of molecule
				molecule.indexSymElements();						// find all the symmetry elements and assign them to ea[...]
				molecule.makeXYZString();							// make string to display molecule
				molecule.makeConnectString();						// make string to connect atoms properly
				molecule.showCitation();
				molecule._showMolAfterLoad();
				molecule._showCtlAfterLoad();
				molecule._parseTables();
			},
			onFailure: function(transport) {
				alert("Error - molecule did not load.  Try pressing the reload button on your browser.");
			}
		}); 		
	},
		 
	showProperAxes: function() {
		var i = 0;
		var checked = arguments[0].target.checked;
		var cbArray = $('control').getElementsByClassName('proper');
		for (i = 0; i < cbArray.length; i++) {
			if (checked && !cbArray[i].checked) {
				// jmolScript(this.ea['proper' + i].showElementString, this.suffix);
				Jmol.script(jmolApplet0, this.ea['proper' + i].showElementString);	}
			if (!checked && cbArray[i].checked) {
				// jmolScript(this.ea['proper' + i].hideElementString, this.suffix);
				Jmol.script(jmolApplet0, this.ea['proper' + i].hideElementString);	}
			cbArray[i].checked = checked;
		}
	},

	showImproperAxes: function() {
		var i = 0;
		var checked = arguments[0].target.checked;
		cbArray = $('control').getElementsByClassName('improper');
		for (i = 0; i < cbArray.length; i++) {
			if (checked && !cbArray[i].checked) {
				// jmolScript(this.ea['improper' + i].showElementString, this.suffix); 
				Jmol.script(jmolApplet0, this.ea['improper' + i].showElementString); }
			if (!checked && cbArray[i].checked) {
				// jmolScript(this.ea['improper' + i].hideElementString, this.suffix);  
				Jmol.script(jmolApplet0, this.ea['improper' + i].hideElementString); }
			cbArray[i].checked = checked;
		}
	},

	showPlanes: function() {
		var checked = arguments[0].target.checked;
		var cbArray = $('control').getElementsByClassName('reflection');
		for (var i = 0; i < cbArray.length; i++) {
			if (checked && !cbArray[i].checked) {
				// jmolScript(this.ea['reflection' + i].showElementString, this.suffix); 
				Jmol.script(jmolApplet0, this.ea['reflection' + i].showElementString); }
			if (!checked && cbArray[i].checked) {
				// jmolScript(this.ea['reflection' + i].hideElementString, this.suffix); 
				Jmol.script(jmolApplet0, this.ea['reflection' + i].hideElementString); }
			cbArray[i].checked = checked;
		}
	},
	
	showCitation: function() {
		if ($('citation') != null) {
			var c = this.citation;
			var nom = this.nom;
			if (c.author != "") {
				$("citation").innerHTML = "<b>Reference:</b> " + c.author + " <i>" + c.journal + "</i> <b>" + c.year + "</b>, ";
				if (c.volume != "")
					$("citation").innerHTML += "<i>" + c.volume + "</i>, ";
				var details = "<b>Author: </b> " + c.author + "<br/>";
				details += "<b>Title:  </b> " + c.title + "<br/>";
				details += "<b>Journal:</b> " + c.journal + "<br/>";
				details += "<b>Year: </b> " + c.year + "<br/>";
				details += "<b>Volume: </b> " + c.volume + "<br/>";
				details += "<b>Pages: </b> " + c.page + "<br/>";
				details += "<b>CSD Code: </b> " + (c.csd).toUpperCase() + "<br/>";
				details += "<b>Name: </b> " + nom + "<br/>";

				$("citation").innerHTML += c.page + "."
	
				if (c.doi != "")
					$("citation").innerHTML += " DOI:&nbsp;<a href=http://dx.doi.org/" + c.doi + " target=\"_blank\">" + c.doi + "</a>";
				if (c.csd != "")
				    $("citation").innerHTML += ", WebCSD:&nbsp;<a href=http://webcsd.ccdc.cam.ac.uk/display_csd_entry.php?identifier=" + (c.csd).toUpperCase() + " target=\"_blank\">" + (c.csd).toUpperCase() + "</a>.";
				//$("citation").innerHTML += "&nbsp;&nbsp;&nbsp;&lt;<a href=\"#\" onClick='return detailsPopup(\"" + details + "\")'>Details</a>&gt;";
			}
			else {
				$("citation").innerHTML = "<p></p>";
			}
		}
	},
	
	calcSize: function() {
		var mx = new Point(0, 0, 0);	// not really using as a "point", more as an index to furthest point
		var maxDistance = 0.0;
	
		var distance = Math.sqrt(Math.pow(this.atomArray[0].x,2)+Math.pow(this.atomArray[0].y,2)+Math.pow(this.atomArray[0].z,2));
		maxDistance = Math.max(maxDistance, distance);
		for (var j = 1; j < this.atomArray.length; j++)
		{
			mx.x = (this.atomArray[j].x > this.atomArray[mx.x].x) ? (j) : (mx.x);
			mx.y = (this.atomArray[j].y > this.atomArray[mx.y].y) ? (j) : (mx.y);
			mx.z = (this.atomArray[j].z > this.atomArray[mx.z].z) ? (j) : (mx.z);
			distance = Math.sqrt(Math.pow(this.atomArray[j].x,2)+Math.pow(this.atomArray[j].y,2)+Math.pow(this.atomArray[j].z,2));
			maxDistance = Math.max(maxDistance, distance);
		}
		
		this.size = maxDistance; 
	},

	makeXYZString: function() {
		var xyzString = new StringBuffer();		// string to contain the XYZ information
		var numAtoms = this.atomArray.length;
		xyzString.append("set autobond false; data \"model molecule\"|");
		xyzString.append(numAtoms + "|" + this.name + "|" );	// header with number of atoms and molecule name
	
		for (var r = 0; r < numAtoms; ++r) {
			xyzString.append(this.atomArray[r].element + format(this.atomArray[r].x,4,10) + format(this.atomArray[r].y,4,10) + format(this.atomArray[r].z,4,10) + "|");	}
		xyzString.append("end \"model molecule\";show data;");
		this.xyzString = xyzString.toString(); 
	},

	makeConnectString: function() {
		var connectString = "";		// autobond set to false
		var numBonds = this.bondArray.length;
	
		for (var r = 0; r < numBonds; ++r)  {
			connectString += "connect (atomno=" + this.bondArray[r].a1 + ") ";
			connectString += "(atomno=" + this.bondArray[r].a2 + " ) " + this.bondArray[r].type + " create;"; }
		this.connectString = connectString; 
	},

	indexSymElements: function() {
		var i = 0;
		if (this.inversionCenter !== null) {
			this.ea.inversion0 = new SymElement("inversion", 0, this.inversionCenter, this.atomArray); }
		for (i = 0; i < this.properArray.length; i++) {
			this.ea["proper" + i] = new SymElement("proper", i, this.properArray[i], this.atomArray, this.size); }
		for (i = 0; i < this.improperArray.length; i++) {
			this.ea["improper" + i] = new SymElement("improper", i, this.improperArray[i], this.atomArray, this.size); }
		for (i = 0; i < this.reflectionArray.length; i++) {
			this.ea["reflection" + i] = new SymElement("reflection", i, this.reflectionArray[i], this.atomArray, this.size); } 
	},

	_showMolAfterLoad: function() {
		// jmolScript(this.xyzString + this.connectString + "set perspectiveDepth off; center all;", this.suffix);
		Jmol.script(jmolApplet0, this.xyzString + this.connectString + "set perspectiveDepth off; center all;");
		if (this.showPG) {
			// jmolScript("set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; echo Point Group = " + this.pointGroup, this.suffix);
			Jmol.script(jmolApplet0, "set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; echo Point Group = " + this.pointGroup); }
	},
	
	_eventListenersOn: function() {
		if (controlEL !== null) { try { Event.stopObserving('control', 'click', controlEL);  } catch(err) {}}
		if (p_axesEL !== null)    { try { Event.stopObserving('show_proper_axes', 'click', p_axesEL);  } catch(err) {}}
		if (i_axesEL !== null)    { try { Event.stopObserving('show_improper_axes', 'click', i_axesEL);  } catch(err) {}}
		if (planesEL !== null)  { try { Event.stopObserving('show_planes', 'click', planesEL);  } catch(err) {}}

		controlEL = this.play.bindAsEventListener(this);
		p_axesEL = this.showProperAxes.bindAsEventListener(this);
		i_axesEL = this.showImproperAxes.bindAsEventListener(this);
		planesEL = this.showPlanes.bindAsEventListener(this);

		try { Event.observe('control', 'click', controlEL); } catch(err) {}
		try { Event.observe('show_proper_axes', 'click', p_axesEL);  } catch(err) {}
		try { Event.observe('show_improper_axes', 'click', i_axesEL);  } catch(err) {}
		try { Event.observe('show_planes', 'click', planesEL); } catch(err) {}
	},	

	_showCtlAfterLoad: function() {
		this._eventListenersOn();
		if (this.showCtl == false)  return 0;
		var i = 0;
		var container1 = $('cTable1');
		var container2 = $('cTable2');

		var table1 = new Element('table', {'border':1});		
		var table2 = new Element('table', {'border':1});

		var tbody1 = new Element('tbody', {'border':1});
		var tbody2 = new Element('tbody', {'border':1});

		if (container1.hasChildNodes() || container2.hasChildNodes()) {
			remove_all_children(container1);
			remove_all_children(container2);
		}
	
		var trow1 = new Element('tr');
		trow1.appendChild(new Element('th').update('Element'));
		trow1.appendChild(new Element('th').update('Operation'));
		if ((this.properArray.length > 0) || (this.improperArray.length > 0))
			tbody1.appendChild(trow1); 

		if (this.properArray.length > 3)
		{
			var trow3 = new Element('tr');
			var td1 = new Element('td', {'colspan':2}).update("<label for=\"show_proper_axes\"><input type=\"checkbox\" id=\"show_proper_axes\" name=\"show_proper_axes\" /><i>Show All Proper</i></label>");
			trow3.appendChild(td1); 
			tbody1.appendChild(trow3); }

		if (this.improperArray.length > 3)
		{
			var trow3 = new Element('tr');
			var td1 = new Element('td', {'colspan':2}).update("<label for=\"show_improper_axes\"><input type=\"checkbox\" id=\"show_improper_axes\" name=\"show_improper_axes\" /><i>Show All Improper</i></label>");
			trow3.appendChild(td1); 
			tbody1.appendChild(trow3); }

		var trow2 = new Element('tr');
		trow2.appendChild(new Element('th').update('Element'));
		trow2.appendChild(new Element('th').update('Operation'));
		if ((this.ea.inversion0 != null) || (this.reflectionArray.length > 0))
			tbody2.appendChild(trow2); 

		if (this.reflectionArray.length > 3) {
			var trow4 = new Element('tr');
			var td2 = new Element('td', {'colspan':2}).update("<label for=\"show_planes\"><input type=\"checkbox\" id=\"show_planes\" name=\"show_planes\" /><i>Show All Planes</i></label>");
			trow4.appendChild(td2);		
			tbody2.appendChild(trow4); }
		
		if (this.showCtl == false) { return 1; }
		
		var len = this.properArray.length;
		if (len > 0) {
			for (i = 0; i < len; ++i) {
				var tr = new Element('tr');
				tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'checkbox_proper'+i}));  
				tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'button_proper'+i}));
				tbody1.appendChild(tr);	
			}
		}

		len = this.improperArray.length;
		if (len > 0) {
			for (i = 0; i < len; ++i) {
				var tr = new Element('tr');
				tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'checkbox_improper'+i}));  
				tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'button_improper'+i}));
				tbody1.appendChild(tr);	
			}
		}

		if (this.ea.inversion0) {
			var tr = new Element('tr');
			tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'checkbox_inversion0'}));  
			tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'button_inversion0'}));
			tbody2.appendChild(tr);	
		}

		len = this.reflectionArray.length;
		if (len > 0) {
			for (i = 0; i < len; ++i) {
				var tr = new Element('tr');
				tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'checkbox_reflection'+i}));  
				tr.appendChild(new Element('td', {'class':'jmolCtl', 'id':'button_reflection'+i}));
				tbody2.appendChild(tr);	
			}
		}

		table1.appendChild(tbody1);
		table2.appendChild(tbody2);
		container1.appendChild(table1);
		container2.appendChild(table2); 
		this._eventListenersOn();
	},
	
	_parseTables: function() {
		if ($$('tbody.jmolCtl').length == 0)		// dynamically-constructed table
		{
			var t = $$('td.jmolCtl');
			for (var i=0; i < t.length; i++)
			{
				var id = (t[i].getAttribute('id')).split('_');
				if (id[0] == 'checkbox') {
					t[i].parentNode.replaceChild(this.ea[id[1]].createCheckbox(), t[i]); }
				else if (id[0] == 'button') {
					t[i].parentNode.replaceChild(this.ea[id[1]].createButton(), t[i]); }
			}
		}
		else
		{
			var t = $$('tbody.jmolCtl');			// table pre-coded in HTML - have to use tbody for IE compatability
			for (var i=0; i < t.length; i++)
			{
				var id = (t[i].getAttribute('id')).split('_');
				if (id[0] == 'all') {
					remove_all_children(t[i]);
					var len = 0;
					var p = $$('p.jmolCtl');
					switch (id[1])
					{	
						case 'reflection':
							len = this.reflectionArray.length;
							if (p.length > 0) p[0].innerHTML = "Reflection planes for " + this.filename.split('.')[0] + ":";
							break;
						case 'inversion':
							var len = 1;
							if (p.length > 0) p[0].innerHTML = "Inversion center for " + this.filename.split('.')[0] + ":";
							break;
						case 'proper':
							var len = this.properArray.length;
							if (p.length > 0) p[0].innerHTML = "Proper rotation axes for " + this.filename.split('.')[0] + ":";
							break;
						case 'improper':
							var len = this.improperArray.length;
							if (p.length > 0) p[0].innerHTML = "Improper rotation axes for " + this.filename.split('.')[0] + ":";
							break;
						default:
							break;
					}
					for (j = 0; j < Math.floor(len/2); ++j) 
					{
						var tr = new Element('tr');
						tr.appendChild(this.ea[id[1]+(j*2)].createCheckbox());
						tr.appendChild(this.ea[id[1]+(j*2)].createButton());
						tr.appendChild(this.ea[id[1]+(j*2+1)].createCheckbox());
						tr.appendChild(this.ea[id[1]+(j*2+1)].createButton());
						t[i].appendChild(tr);
					}
					if ((len % 2) == 1) 
					{
						var tr = new Element('tr');
						tr.appendChild(this.ea[id[1]+(len-1)].createCheckbox());
						tr.appendChild(this.ea[id[1]+(len-1)].createButton());
						t[i].appendChild(tr);
					}
 
				}
			}
		}
	},	

	setWireframe: function() {
		// jmolScript("anim fps 15; select not (*/1); color yellow; spacefill -17; wireframe 0.10; set backgroundModel 1.1; set perspectiveDepth off;", this.suffix);
		Jmol.script(jmolApplet0, "anim fps 15; select not (*/1); color yellow; spacefill -17; wireframe 0.10; set backgroundModel 1.1; set perspectiveDepth off;");
	},
	
	play: function() {
		var animID = arguments[0].target.id.toString();
		if (currPE !== null) {
			currPE.stop();
			animGenerationComplete = false;
		}
		if (animID.search(/inversion|proper\d+|improper\d+|reflection\d+/) === 0)
		{
			var anim = this.ea[animID].anim;
			if (!anim.string) {
				// jmolScript(anim.toString() + this.connectString, this.suffix); 
				Jmol.script(jmolApplet0, anim.toString() + this.connectString)}

			if (this.showPG) {
				// jmolScript("set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; echo Point Group = " + this.pointGroup, this.suffix);
				Jmol.script(jmolApplet0, "set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; echo Point Group = " + this.pointGroup); }
			
			this.setWireframe();
						
			if (animTrailsOn) {
				// jmolScript("model " + anim.index + ";", this.suffix);
				Jmol.script(jmolApplet0, "model " + anim.index + ";");
				for (var modnum = 1; modnum < anim.numFrames; modnum++) {
					// jmolScript("display (1.1 or (model>=" + anim.index + ".1 and model<=" + anim.index + "." + modnum + ")); delay 0.05;", this.suffix);
					Jmol.script(jmolApplet0, "display (1.1 or (model>=" + anim.index + ".1 and model<=" + anim.index + "." + modnum + ")); delay 0.05;"); }
			}
			else {
				$("slider-1").style.visibility="visible";	s.onchange = function () { };		// disable slider while animating...
				// jmolScript("select */" + anim.index + "." + anim.numFrames + "; spacefill 0;", this.suffix);	// hide last frame (single atom frame)
				Jmol.script(jmolApplet0, "select */" + anim.index + "." + anim.numFrames + "; spacefill 0;");	// hide last frame (single atom frame)
				// jmolScript("frame range " + anim.index + ".1 " + anim.index + "." + anim.numFrames + "; frame play;", this.suffix);
				Jmol.script(jmolApplet0, "frame range " + anim.index + ".1 " + anim.index + "." + anim.numFrames + "; frame play;");
				s.setMaximum(anim.numFrames); s.setValue(1);
				// jmolScript('javascript "animGenerationComplete = true";', this.suffix);	// have to call this from Jmol to prevent slider moving before models are generated
				Jmol.script(jmolApplet0, 'javascript "animGenerationComplete = true";');	// have to call this from Jmol to prevent slider moving before models are generated
				currPE = new PeriodicalExecuter(anim.step.bind(anim), 0.067);	}				
		}
	}	
});


var Polyhedron = Class.create(Molecule, {
	_showMolAfterLoad: function() {
		// jmolScript(this.xyzString + this.connectString + "set perspectiveDepth off; center all;", this.suffix);
		Jmol.script(jmolApplet0, this.xyzString + this.connectString + "set perspectiveDepth off; center all;");
		// jmolScript("select all; spacefill -3; wireframe 5; color red;", this.suffix);
		Jmol.script(jmolApplet0, "select all; spacefill -3; wireframe 5; color red;");
		if (this.showPG) {
			// jmolScript("set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; echo Point Group = " + this.pointGroup, this.suffix);
			Jmol.script(jmolApplet0, "set echo bottom left; font echo 15 sansserif bold; color echo [90, 90, 90]; echo Point Group = " + this.pointGroup); }
		var fString = "";
		var poly = this;
		for (var x=0, len=this.faceArray.length; x < len; x++)
		{
			fString += "draw face" + x + "";
			switch (poly.faceArray[x].order)
			{
				case 3:
				case 4:
					for (var y = 0; y < poly.faceArray[x].order; y++) {
						fString += " (atomno=" + poly.faceArray[x].vertices[y] + ") "; }
					break;
				case 5:
					fString += " (atomno=" + poly.faceArray[x].vertices[0] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[1] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[2] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[3] + ") ";
					fString += "translucent 3 " + " steelblue;";
					fString += "draw face" + x + "b";
					fString += " (atomno=" + poly.faceArray[x].vertices[0] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[3] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[4] + ") ";
					break;
				case 6:
					fString += " (atomno=" + poly.faceArray[x].vertices[0] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[1] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[2] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[3] + ") ";
					fString += "translucent 3 " + " steelblue;";
					fString += "draw face" + x + "b";
					fString += " (atomno=" + poly.faceArray[x].vertices[0] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[3] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[4] + ") ";
					fString += " (atomno=" + poly.faceArray[x].vertices[5] + ") ";
					break;
				default:
					fString += "";
					break;
			}
			fString += "translucent 3 " + " steelblue;";
		}
//		jmolScript(fString, this.suffix);
		Jmol.script(jmolApplet0, fString);
		this.size *= 0.85;
	},
		
	setWireframe: function() {
		// jmolScript("anim fps 15; select 1.1; wireframe 5; select not (*/1); color yellow; spacefill -3; wireframe 5; set backgroundModel 1.1; set perspectiveDepth off;", this.suffix);
		Jmol.script(jmolApplet0, "anim fps 15; select 1.1; wireframe 5; select not (*/1); color yellow; spacefill -3; wireframe 5; set backgroundModel 1.1; set perspectiveDepth off;");
	}
});




/* ---------------
 *   SymElement
 * --------------- */

var SymElement = Class.create({
	initialize: function(type, index, elementData, atomArray, size) {
		this.type = type;
		this.index = index;
		this.elementData = elementData;
		this.atomArray = atomArray;
		this.size = size;
		this.visible = false;
		this.createStrings();
		this.anim = new Animation(this);
		var label = "";
		switch (this.type) {
			case 'inversion':
				this.cbLabel = 'inv ctr' ;
				this.cbID = 'inv_center';
				this.title = 'Inversion Center';
				this.buttonID = 'inversion' + this.index;;
				this.image = 'invert';
				break;
			case 'proper':
				if (this.elementData.label == null)  label = "";  else label = this.elementData.label;
				this.cbLabel = 'C<sub>' + this.elementData.order + '</sub>' + label + ' axis' ;
				this.cbID = 'proper_axis' + this.index;
				this.title = 'Proper Axis';
				this.buttonID = 'proper' + this.index;
				this.image = 'rotate';
				break;
			case 'improper':
				this.cbLabel = 'S<sub>' + this.elementData.order + '</sub> axis' ;
				this.cbID = 'improper_axis' + this.index;
				this.title = 'Improper Axis';
				this.buttonID = 'improper' + this.index;
				this.image = 'rotate';
				break;
			case 'reflection':
				this.cbLabel = 'plane (&sigma;<sub>' + this.elementData.label + '</sub>)' ;
				this.cbID = 'reflection_plane' + this.index;
				this.title = 'Reflection Plane';
				this.buttonID = 'reflection' + this.index;
				this.image = 'reflect';
				break;
			
			default:
				break;
		}
	},
		
	createStrings: function() {
		var name = "";
		var size = 0;
		var j = 0;
		if (this.type == "proper") {
			name = "p_axis";
		}
		else if (this.type == "improper") {
			name = "i_axis";
		}

		switch (this.type)
		{
			case "inversion" :
				var iCenter = this.elementData;
				if (iCenter.atomNum !== null)
				{
					this.showElementString = "select (atomno=" + iCenter.atomNum + ") && (model=1.1); color yellow; ";
					for (size = 22; size < 29; size++) {
						this.showElementString += "spacefill -" + size + "; delay 0.01; "; }
					for (size = 27; size > 21; size--) {
						this.showElementString += "spacefill -" + size + "; delay 0.01; "; }
					this.hideElementString = "select (atomno=" + iCenter.atomNum + ") && (model=1.1); color cpk";
				}
				else
				{
					this.showElementString =  "frame 0; frame 1; isosurface icenter resolution 50 sphere 0.20 fixed translucent 9 green; ";
					this.showElementString += "for (var tr=2; tr>=2; tr=tr-1); color $icenter translucent @tr green; delay 0.03; end for; ";
					this.showElementString += "set backgroundModel 1.1";
	
					this.hideElementString =  "frame 0; frame 1; ";
					this.hideElementString += "for (var tr=9; tr<=9; tr=tr+1); color $icenter translucent @tr green; delay 0.03; end for; ";
					this.hideElementString += "isosurface delete icenter; set backgroundModel 1.1";
				}
				break;
				
			case "proper":
				var axis = this.elementData;
				var label_offset = 0;
				switch (axis.order)
				{
					case 2:
						label_offset = 0;
						break;
					case 3:
					case 5:
					case 7:
						label_offset = 1;
						break;
					case 4:
					case 6:
					case 10:
						label_offset = 2;
						break;
					case 8:
					case 9:
					case 12:
						label_offset = 3;
						break;
					default:
						label_offset = 0;
				}
				if (name == "i_axis")
					label_offset -= 2;
					
				var scale = this.size*130 + label_offset*20;
				var label = "";
				var axisLabelsOff = false;
				if ($('axis_labels_off') != null)
					axisLabelsOff = $('axis_labels_off').checked;
				if (!axisLabelsOff)
					if (name == "p_axis") { label = "C<sub>" + axis.order + "</sub>" }
						else { label = "\>S<sub>" + axis.order + "</sub>" }
				var d = axis.direction;
				j = this.index;
				this.showElementString =  "draw " + name + j + " fixed {" + (d.x) + " " + (d.y) + " " + (d.z) + "} ";
				this.showElementString += "{" + (-d.x) + " " + (-d.y) + " " + (-d.z) +"} \"" + label + "\"; draw " + name + j + " " + Math.round(scale) + "; ";
				this.hideElementString = "hide $" + name + j + "; hide $arrow" + j + ";";
				break;

			case "improper":
				var axis = this.elementData;
				var label_offset = 0;
				switch (axis.order)
				{
					case 2:
						label_offset = 0;
						break;
					case 3:
					case 5:
					case 7:
						label_offset = 1;
						break;
					case 4:
					case 6:
					case 10:
						label_offset = 2;
						break;
					case 8:
					case 9:
					case 12:
						label_offset = 3;
						break;
					default:
						label_offset = 0;
				}
				if (name == "i_axis")
					label_offset -= 2;
					
				var scale = this.size*130 + label_offset*20;
				var label = "";
				var axisLabelsOff = false;
				if ($('axis_labels_off') != null)
					axisLabelsOff = $('axis_labels_off').checked;
				if (!axisLabelsOff)
					if (name == "p_axis") { label = "C<sub>" + axis.order + "</sub>" }
						else { label = "\>S<sub>" + axis.order + "</sub>" }
				var d = axis.direction;
				j = this.index;
				this.showElementString =  "draw " + name + j + " fixed {" + (d.x) + " " + (d.y) + " " + (d.z) + "} ";
				this.showElementString += "{" + (-d.x) + " " + (-d.y) + " " + (-d.z) +"} \"" + label + "\" color green; draw " + name + j + " " + Math.round(scale) + "; ";
				this.hideElementString = "hide $" + name + j + "; hide $arrow" + j + ";";
				
				
				var plane = this.elementData;
				var color = 'green';
				var p2 = new Point(0.0, 0.0, 0.0);
				var j = this.index;
				var t = 0.03		// thickness

				p2.x = plane.direction.x;	p2.y = plane.direction.y;	p2.z = plane.direction.z;		// vector perpendicular to plane

				this.showElementString +=  "draw i_plane" + j + "_disk width " + format(this.size*2.4,4) + " cylinder "; 
				this.showElementString += "{" + format(( p2.x*t),4) + " " + format(( p2.y*t),4) + " " + format(( p2.z*t),4) + "} ";
				this.showElementString += "{" + format((-p2.x*t),4) + " " + format((-p2.y*t),4) + " " + format((-p2.z*t),4) + "} ";
				this.showElementString += " color translucent green fixed; ";
				
				this.showElementString +=  "draw i_plane" + j + "_ring width 0.035 scale " + format(this.size*2.4,4) + " arc "; 
				this.showElementString += "{" + format(( p2.x),4) + " " + format(( p2.y),4) + " " + format(( p2.z),4) + "} ";
				this.showElementString += "{" + format((-p2.x),4) + " " + format((-p2.y),4) + " " + format((-p2.z),4) + "} ";
				this.showElementString += "{" + format((-p2.x+t),4) + " " + format((-p2.y+t),4) + " " + format((-p2.z+t),4) + "} ";
				this.showElementString += "{0 360 0.5} color " + color + "; ";
				
				this.hideElementString += "hide $i_plane" + j + "*;";

				break;

			case "reflection":
				var plane = this.elementData;
				var color = 'orange';
				if (plane.label == 'h')
					color = 'red';
				else if (plane.label == 'd')
					color = 'yellow';
				var p2 = new Point(0.0, 0.0, 0.0);
				var j = this.index;
				var t = 0.03		// thickness

				p2.x = plane.direction.x;	p2.y = plane.direction.y;	p2.z = plane.direction.z;		// vector perpendicular to plane

				this.showElementString =  "draw plane" + j + "_disk width " + format(this.size*2.4,4) + " cylinder "; 
				this.showElementString += "{" + format(( p2.x*t),4) + " " + format(( p2.y*t),4) + " " + format(( p2.z*t),4) + "} ";
				this.showElementString += "{" + format((-p2.x*t),4) + " " + format((-p2.y*t),4) + " " + format((-p2.z*t),4) + "} ";
				this.showElementString += " color translucent orange fixed; ";
				
				this.showElementString +=  "draw plane" + j + "_ring width 0.035 scale " + format(this.size*2.4,4) + " arc "; 
				this.showElementString += "{" + format(( p2.x),4) + " " + format(( p2.y),4) + " " + format(( p2.z),4) + "} ";
				this.showElementString += "{" + format((-p2.x),4) + " " + format((-p2.y),4) + " " + format((-p2.z),4) + "} ";
				this.showElementString += "{" + format((-p2.x+t),4) + " " + format((-p2.y+t),4) + " " + format((-p2.z+t),4) + "} ";
				this.showElementString += "{0 360 0.5} color " + color + "; ";
				
				this.hideElementString = "hide $plane" + j + "*;";

				break;

			default: 
				break;
		} 
	},
		
	createControl: function() {
		// jmolSetCheckboxCssClass(this.type);
		Jmol.setCheckboxCss(this.type);
		var trow =  new Element('tr');
		var td1 = new Element('td'); var td2 = new Element('td'); 
	
		td1.innerHTML = Jmol.jmolCheckbox(jmolApplet0, this.showElementString, this.hideElementString, this.cbLabel, 0, this.cbID, this.title);
		td2.innerHTML = "<div><img id=\"" + this.buttonID + "\" src=\"../common/images/" + this.image + ".gif\" width=\"47\" height=\"19\" alt=\"" + this.title + "\" onmouseover=\"this.src='../common/images/" + this.image + "_over.gif'\" onmouseout=\"this.src='../common/images/" + this.image + ".gif'\" onmousedown=\"this.src='../common/images/" + this.image + "_down.gif'\" onmouseup=\"this.src='../common/images/" + this.image + "_over.gif'\" /></div>\n";
		trow.appendChild(td1); trow.appendChild(td2);		
		return trow; 
	},

	createCheckbox: function() {
		// jmolSetCheckboxCssClass(this.type);
		Jmol.setCheckboxCss(this.type);
		var td = new Element('td',  {'class':'jmolCtl', 'id':'checkbox_' + this.type + this.index});
		td.innerHTML = Jmol.jmolCheckbox(jmolApplet0, this.showElementString, this.hideElementString, this.cbLabel, 0, this.cbID, this.title);
		return td; 
	},

	createButton: function() {
		var td = new Element('td',  {'class':'jmolCtl', 'id':'button_' + this.type + this.index});
		td.innerHTML = "<div><img id=\"" + this.buttonID + "\" src=\"../common/images/" + this.image + ".gif\" width=\"47\" height=\"19\" alt=\"" + this.title + "\" onmouseover=\"this.src='../common/images/" + this.image + "_over.gif'\" onmouseout=\"this.src='../common/images/" + this.image + ".gif'\" onmousedown=\"this.src='../common/images/" + this.image + "_down.gif'\" onmouseup=\"this.src='../common/images/" + this.image + "_over.gif'\" /></div>\n";
		return td; 
	}

});



/* ---------------
 *    Animation
 * --------------- */

var Animation = Class.create({
	initialize: function(symElement) {
		this.frameNum = 1;
		this.symElement = symElement;
		this.index = 0;
		this.animDone = false; 
		STEPS = 19;
		this.numFrames = STEPS+1;	// default value -- for everything but improper
		animIndex = 2; },		// first animation is second model
	
	step: function(pe) {
		if (animGenerationComplete) {
			s.setValue(this.frameNum);
			this.frameNum++;
			if (this.frameNum > this.numFrames)
			{
				pe.stop(); this.frameNum = 1; animGenerationComplete = false;
				// s.onchange = (function () { jmolScript('frame ' + this.index + '.' + s.getValue() + ';', this.suffix); }).bind(this);  // re-enable slider
				s.onchange = (function () { Jmol.script(jmolApplet0, 'frame ' + this.index + '.' + s.getValue() + ';'); }).bind(this);  // re-enable slider
			} 
		}
	},
	
	toString: function() {
		if (!this.string)
		{
			var animBuffer = new StringBuffer();
			var newPoint = new Point(0.0, 0.0, 0.0);
			var name = "molecule";
			var stepSize = 0.0;
			var i = 0;
			var j = 0;
			var angle = 0;
			var numAtoms = this.symElement.atomArray.length;
			animBuffer.append("set autobond false; data \"append molecule\"|");

			switch (this.symElement.type)
			{
				case "inversion":
					for (i = 0; i <= STEPS-1; i++)
					{
						animBuffer.append(numAtoms + "|" + name + " - " + this.symElement.type + " - step " + (i+1)+ "|");  // header with # of atoms and name
						stepSize = i/STEPS;
						for (j = 0; j < numAtoms; j++)
						{
							newPoint.x = this.symElement.atomArray[j].x - this.symElement.atomArray[j].x*stepSize*2.0;
							newPoint.y = this.symElement.atomArray[j].y - this.symElement.atomArray[j].y*stepSize*2.0;
							newPoint.z = this.symElement.atomArray[j].z - this.symElement.atomArray[j].z*stepSize*2.0;
							animBuffer.append(this.symElement.atomArray[j].element + format(newPoint.x,4,10) + format(newPoint.y,4,10) + format(newPoint.z,4,10) + "|");
						}
					}
					break;
				case "proper":
				case "improper":
					angle = (2 * Math.PI / this.symElement.elementData.order);
					for (i = 0; i <= STEPS - 1; i++) {
						animBuffer.append(numAtoms + "|" + name + " - " + this.symElement.type + " - step " + (i + 1) + "|"); // header with # of atoms and  name
						stepSize = i / STEPS;
						for (j = 0; j < numAtoms; j++) {
							newPoint = arbitraryRotate(this.symElement.atomArray[j], angle * stepSize, this.symElement.elementData.direction);
							animBuffer.append(this.symElement.atomArray[j].element + format(newPoint.x, 4, 10) + format(newPoint.y, 4, 10) + format(newPoint.z, 4, 10) + "|");
						}
					}
					if (this.symElement.type == "proper") {
						break;
					}
					else {
						this.numFrames += STEPS;		// just for improper (and continue with reflection)
					}	
				case "reflection":
					angle = (2*Math.PI/this.symElement.elementData.order);
					var dirx = this.symElement.elementData.direction.x;														
					var diry = this.symElement.elementData.direction.y;														
					var dirz = this.symElement.elementData.direction.z;														
										
					for (i = 0; i <= STEPS-1; i++)	
					{
						animBuffer.append(numAtoms + "|" + name + " - " + this.symElement.type + " - step " + (i+1) + "|");  // header with number of atoms and molecule name
						stepSize = i/STEPS;
						for (j = 0; j < numAtoms; j++)
						{
							var distance = dirx*this.symElement.atomArray[j].x	+ diry*this.symElement.atomArray[j].y + dirz*this.symElement.atomArray[j].z;
							if (this.symElement.type == "improper") {
								newPoint = arbitraryRotate(this.symElement.atomArray[j], angle, this.symElement.elementData.direction);
							}
							else {
								newPoint.x = this.symElement.atomArray[j].x;
								newPoint.y = this.symElement.atomArray[j].y;
								newPoint.z = this.symElement.atomArray[j].z;
							}
							newPoint.x = newPoint.x - (2.00 * distance * dirx * stepSize);
							newPoint.y = newPoint.y - (2.00 * distance * diry * stepSize);
							newPoint.z = newPoint.z - (2.00 * distance * dirz * stepSize);
							animBuffer.append(this.symElement.atomArray[j].element + format(newPoint.x,4,10) + format(newPoint.y,4,10) + format(newPoint.z,4,10) + "|");
						}
					}
					break;

				default:
					break;
			}
			animBuffer.append(1 + "|" + name + " - animation - last step |");  // simgle atom frame
			animBuffer.append(this.symElement.atomArray[0].element + format(this.symElement.atomArray[0].x,4,10) + format(this.symElement.atomArray[0].y,4,10) + format(this.symElement.atomArray[0].z,4,10) + "|");
			animBuffer.append("end \"append molecule\";show data;");
			this.string = animBuffer.toString();

			this.index = animIndex;
			animIndex += 1;
		}
		return this.string; 
	}
});




/** - - - - - - - - - - - - - - -
 *       Setup functions 
 * - - - - - - - - - - - - - - - */

function loadMolData() {
	var molInfo = new Ajax.Request("../common/molecules/molinfo.js", {
		method: 'get',
		onSuccess: function(transport) {
			try {
				molData = (transport.responseText).evalJSON(true);
			}
			catch(err) {
			}
			setList();
		}
	});
}

function detailsPopup(citation)
{
	newWindow=window.open('','details','height=260,width=580');
	var tmp = newWindow.document;
	tmp.write('<html><head><title>Citation Details</title>');
	tmp.write('<link rel="stylesheet" href="../common/css/sym.css">');
	tmp.write('</head><body><div id="details">');
	tmp.write(citation);
	tmp.write('<p><a href="javascript:self.close()">Close</a> this window.</p>');
	tmp.write('</div></body></html>');
	tmp.close();
}

function showPref()
{
	Effect.Fade('nav', { duration: 0.5 });
	Effect.Fade('showPref', { duration: 0.2 });
	Effect.Appear('pref', { duration: 1.0 });
}

function hidePref()
{
	Effect.Fade('pref', { duration: 0.5 });
	Effect.Appear('nav', { duration: 1.0 });
	Effect.Appear('showPref', { duration: 0.5 });

}

function setupGlobalListeners()
{
	trailsEL = function() {
		animTrailsOn = arguments[0].target.checked;
		$("slider-1").style.visibility="hidden";	s.onchange = function () { };		// disable slider
		if (arguments[0].target.checked) {
			$("slider-1").style.visibility = "hidden";
			s.onchange = function(){
			}; // disable slider
		}
		else {
			// jmolScript("model 1.1; display all; set backgroundModel 1.1;"); }
			Jmol.script(jmolAppet0, "model 1.1; display all; set backgroundModel 1.1;"); }
	}

	aaEL = function() {
		if ($('aa').checked == true) {
			// jmolScript("set antialiasDisplay true;");
			Jmol.script(jmolApplet0, "set antialiasDisplay true;"); }
		else {
			// jmolScript("set antialiasDisplay false;");
			Jmol.script(jmolApplet0, "set antialiasDisplay false;"); }
	}
		
	gradEL = function() {
		if ($('grad').checked == true) {
			// jmolScript("background image \"../common/images/grad1.png\";");
			Jmol.script(jmolApplet0, "background image \"../common/images/grad1.png\";");		 }	
		else {
			// jmolScript("background white;");
			Jmol.script(jmolApplet0, "background white;"); }
	}

	if ($('anim_trails') != null) { Event.observe('anim_trails', 'click', trailsEL); }
	if ($('aa') != null) { Event.observe('aa', 'click', aaEL); } 
	if ($('grad') != null) { Event.observe('grad', 'click', gradEL); }
}

function displayMolecule(filename, showCtl, path)
{
	var type = '';
	var mol = null;
	if (filename.endsWith('xml')) { type = 'xml'; }
		else if (filename.endsWith('js')) { type = 'js'; }
			else if (filename.endsWith('mol')) { type = 'mol'; }
	
	if (filename.startsWith('p_')) { mol = new Polyhedron(filename, type, showCtl, '0', path); }
	else { mol = new Molecule(filename, type, showCtl, '0', path); }
	
	if ($('flow') != null)
		setupQuiz(mol);
		
	if ($('jmol') != null)
		$('jmol').title = filename;

    var uri = window.location.toString();
    if (uri.indexOf("?") > 0) {
	var clean_uri = uri.substring(0, uri.indexOf("?"));
	window.history.replaceState({}, document.title, clean_uri);
    }
}

function GetQueryStringParams(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
	else {
	    return null;
	}
    }
}

// The main event...

Event.observe(window, 'load', function() {
	if ($('jmol') != null)
	{
		// jmolInitialize("../common/Jmol");
		$('jmolLoading').innerHTML = "<p>Jmol is loading...</p>";
		// jmolSetDocument(false);		// we don't want Jmol.js to write to the document
		Jmol.setDocument(0);
		jmolApplet0 = Jmol.getApplet("jmolApplet0", Info)
		
		$j("#jmol").html(Jmol.getAppletHtml(jmolApplet0));

		setupGlobalListeners();

	    urlParam = GetQueryStringParams('filename');
	    if ($('flowchart') == null)
		if (urlParam != null)
		    displayMolecule(urlParam + '.js', true);
	}
	
	if ($('slider-1') != null)
	{			
		$('slider-1').style.visibility="hidden";	// hide slider
		s = new Slider($('slider-1'), $('slider-input-1'));
		s.setMinimum(1);  s.setMaximum(20);
	}
		
	if ($('molList') != null)		// load the molecule data file and set up the molecule list
	{
		loadMolData();
		Event.observe('molList', 'click', function(event) 
		{
			var element = Event.element(event);
			var molList = element.parentNode.childNodes;
			var showCtl = true;
			if (element.className == 'selected') { return 1; }  // clicked same button
			for (var x = 0; x < molList.length; x++)
				if (molList[x].className == 'selected')
					molList[x].className = '';
			element.className='selected';
			var filename = element.getAttribute("id");
			if ($('flowchart') == null)
				showCtl = true;
			else
				showCtl = false;

			if ((filename !== null) && (filename !== "")) 
			{
				displayMolecule(filename, showCtl);
				return 0;
			}
			else 
			{
				return 1;
			}		
		});
	}
	
	if ($('flowchart') != null)
	{
		new Effect.MoveBy('flowchart', 115, 20, {duration:0});
		$('yesButton').hide();
		$('noButton').hide();
	}
	
	fillWindow();
	window.onresize = function() { fillWindow(); }
});

