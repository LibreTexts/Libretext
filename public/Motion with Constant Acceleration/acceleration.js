// Bewegung mit konstanter Beschleunigung
// Java-Applet (02.11.2000) umgewandelt
// 04.10.2014 - 08.09.2015

// ****************************************************************************
// * Autor: Walter Fendt (www.walter-fendt.de)                                *
// * Dieses Programm darf - auch in ver�nderter Form - f�r nicht-kommerzielle *
// * Zwecke verwendet und weitergegeben werden, solange dieser Hinweis nicht  *
// * entfernt wird.                                                           *
// **************************************************************************** 

// Sprachabh�ngige Texte sind einer eigenen Datei (zum Beispiel acceleration_de.js) abgespeichert.

// Farben:

var colorBackground = "#ffff00";                           // Hintergrundfarbe
var colorCar = "#c0c0c0";                                  // Farbe der Autokarosserie
var colorWindow = "#00ffff";                               // Farbe des Autofensters
var colorLightBarrier1 = "#00ff00";                        // Farbe der ersten Lichtschranke
var colorLightBarrier2 = "#ff0000";                        // Farbe der zweiten Lichtschranke
var colorClock1 = "#808080";                               // Farbe der ersten Uhr
var colorPosition = "#ff0000";                             // Farbe f�r Position
var colorVelocity = "#ff00ff";                             // Farbe f�r Geschwindigkeit
var colorAcceleration = "#0000ff";                         // Farbe f�r Beschleunigung

// Sonstige Konstanten:

var XS = 50, YS = 60;                                      // Koordinaten f�r die Stra�e (Pixel)
var PIX = 8;                                               // Pixel pro m (Stra�e)
var PIXT = 8;                                              // Pixel pro s (Diagramm)
var PIXX = 2;                                              // Pixel pro m (Diagramm)
var PIXV = 3;                                              // Pixel pro m/s (Diagramm)
var PIXA = 30;                                             // Pixel pro m/s^2 (Diagramm)
var FONT = "normal normal bold 12px sans-serif";           // Zeichensatz

// Attribute:

var canvas, ctx;                                           // Zeichenfl�che, Grafikkontext
var width, height;                                         // Abmessungen der Zeichenfl�che (Pixel)
var bu1, bu2;                                              // Schaltkn�pfe (Reset, Start/Pause/Weiter)
var cbSlow;                                                // Optionsfeld (Zeitlupe) mit Text
var ipX0;                                                  // Eingabefeld (Anfangsposition)
var ipV0;                                                  // Eingabefeld (Anfangsgeschwindigkeit)
var ipA;                                                   // Eingabefeld (Beschleunigung)
var rbV, rbA;                                              // Radiobuttons (Geschwindigkeits-, Beschleunigungsvektor) 

var a;                                                     // Beschleunigung (m/s�)
var v0;                                                    // Anfangsgeschwindigkeit (m/s)
var x0;                                                    // Anfangsposition (m)
var nrLB;                                                  // Nummer der Lichtschranke
var xLB1, xLB2;                                            // x-Koordinaten der Lichtschranken (Pixel)
var tLB1, tLB2;                                            // Gestoppte Zeiten (s)
var on;                                                    // Flag f�r Bewegung
var timer;                                                 // Timer f�r Animation
var t0;                                                    // Anfangszeitpunkt
var t;                                                     // Aktuelle Zeit (s)
var x;                                                     // Momentane Position (m)
var polygonCar0, polygonWindow0;                           // Muster-Polygone f�r das Auto
var polygonCar, polygonWindow;                             // Variable Polygone f�r das Auto

// Element der Schaltfl�che (aus HTML-Datei):
// id ..... ID im HTML-Befehl
// text ... Text (optional)

function getElement (id, text) {
  var e = document.getElementById(id);                     // Element
  if (text) e.innerHTML = text;                            // Text festlegen, falls definiert
  return e;                                                // R�ckgabewert
  } 

// Start:

function start () {
  canvas = getElement("cv");                               // Zeichenfl�che
  width = canvas.width; height = canvas.height;            // Abmessungen der Zeichenfl�che (Pixel)
  ctx = canvas.getContext("2d");                           // Grafikkontext
  bu1 = getElement("bu1",text01);                          // Schaltknopf (Reset)
  bu2 = getElement("bu2",text02[0]);                       // Schaltknopf (Start/Pause/Weiter)
  bu2.state = 0;                                           // Anfangszustand des Schaltknopfs
  cbSlow = getElement("cbSlow");                           // Optionsfeld (Zeitlupe)
  cbSlow.checked = false;                                  // Option Zeitlupe abgeschaltet
  getElement("lbSlow",text03);                             // Erkl�render Text (Zeitlupe)
  getElement("ipX0a",text04);                              // Erkl�render Text (Anfangsposition)
  ipX0 = getElement("ipX0b");                              // Eingabefeld (Anfangsposition)
  getElement("ipX0c",meter);                               // Einheit (Anfangsposition)
  getElement("ipV0a",text05);                              // Erkl�render Text (Anfangsgeschwindigkeit)
  ipV0 = getElement("ipV0b");                              // Eingabefeld (Anfangsgeschwindigkeit)
  getElement("ipV0c",meterPerSecond);                      // Einheit (Anfangsgeschwindigkeit)
  getElement("ipAa",text06);                               // Erkl�render Text (Beschleunigung)  
  ipA = getElement("ipAb");                                // Eingabefeld (Beschleunigung)
  getElement("ipAc",meterPerSecond2);                      // Einheit (Beschleunigung)
  rbV = getElement("rbV");                                 // Radiobutton (Geschwindigkeitsvektor)
  rbV.checked = true;                                      // Radiobutton ausgew�hlt
  getElement("lbV",text07);                                // Erkl�render Text (Geschwindigkeitsvektor)
  rbA = getElement("rbA");                                 // Radiobutton (Beschleunigungsvektor)
  getElement("lbA",text08);                                // Erkl�render Text (Beschleunigungsvektor)
  getElement("author",author);                             // Autor
  getElement("translator",translator);                     // �bersetzer
  initPolygons();                                          // Polygone f�r das Auto initialisieren
  a = 1;                                                   // Defaultwert f�r Beschleunigung (m/s�)
  v0 = 0;                                                  // Defaultwert f�r Anfangsgeschwindigkeit (m/s)
  x0 = 0;                                                  // Defaultwert f�r Anfangsposition (m)
  xLB1 = 25; xLB2 = 50;                                    // Anfangswerte f�r Lichtschrankenpositionen (Pixel) 
  tLB1 = tLB2 = 0;                                         // Anfangswerte f�r gestoppte Zeiten (s)                       
  nrLB = 0;                                                // Keine Lichtschranke ausgew�hlt
  updateInput();                                           // Eingabefelder aktualisieren
  on = false;                                              // Animation abgeschaltet
  slow = false;                                            // Zeitlupe abgeschaltet
  t = 0;                                                   // Anfangswert f�r Zeitvariable (s)
  paint();                                                 // Zeichnen
   
  bu1.onclick = reactionReset;                             // Reaktion auf Schaltknopf Reset
  bu2.onclick = reactionStart;                             // Reaktion auf Schaltknopf Start/Pause/Weiter
  cbSlow.onclick = reactionSlow;                           // Reaktion auf Optionsfeld Zeitlupe
  ipX0.onkeydown = reactionEnter;                          // Reaktion auf Enter-Taste (Eingabe Anfangsposition)
  ipV0.onkeydown = reactionEnter;                          // Reaktion auf Enter-Taste (Eingabe Anfangsgeschwindigkeit)    
  ipA.onkeydown = reactionEnter;                           // Reaktion auf Enter-Taste (Eingabe Beschleunigung)
  
  canvas.onmousedown = function (e) {                      // Reaktion auf Dr�cken der Maustaste
    reactionDown(e.clientX,e.clientY);                     // Eventuell Zugmodus aktivieren                     
    }
    
  canvas.ontouchstart = function (e) {                     // Reaktion auf Ber�hrung
    var obj = e.changedTouches[0];
    reactionDown(obj.clientX,obj.clientY);                 // Eventuell Zugmodus aktivieren
    if (nrLB != 0) e.preventDefault();                     // In diesem Fall Standardverhalten verhindern
    }
      
  canvas.onmouseup = function (e) {                        // Reaktion auf Loslassen der Maustaste        
    nrLB = 0;                                              // Keine Lichtschranke ausgew�hlt
    setButton2State(0);                                    // Startknopf im Anfangszustand
    }
    
  canvas.ontouchend = function (e) {                       // Reaktion auf Ende der Ber�hrung
    nrLB = 0;                                              // Keine Lichtschranke ausgew�hlt
    setButton2State(0);                                    // Startknopf im Anfangszustand
    }
    
  canvas.onmousemove = function (e) {                      // Reaktion auf Bewegen der Maus
    if (nrLB == 0) return;                                 // Abbrechen, falls keine Lichtschranke ausgew�hlt
    reactionMove(e.clientX,e.clientY);                     // Position ermitteln und neu zeichnen
    }
    
  canvas.ontouchmove = function (e) {                      // Reaktion auf Bewegung mit Finger
    if (nrLB == 0) return;                                 // Abbrechen, falls keine Lichtschranke ausgew�hlt
    var obj = e.changedTouches[0];
    reactionMove(obj.clientX,obj.clientY);                 // Position ermitteln und neu zeichnen
    e.preventDefault();                                    // Standardverhalten verhindern                          
    }  
    
  } // Ende der Methode start
  
// Zustandsfestlegung f�r Schaltknopf Start/Pause/Weiter:
// st ... Gew�nschter Zustand (0, 1 oder 2)
// Seiteneffekt bu2.state, Schaltknopftext
  
function setButton2State (st) {
  bu2.state = st;                                          // Zustand speichern
  bu2.innerHTML = text02[st];                              // Text aktualisieren
  }
  
// Umschalten des Schaltknopfs Start/Pause/Weiter:
// Seiteneffekt bu2.state, Schaltknopftext
  
function switchButton2 () {
  var st = bu2.state;                                      // Momentaner Zustand
  if (st == 0) st = 1;                                     // Falls Ausgangszustand, starten
  else st = 3-st;                                          // Wechsel zwischen Animation und Unterbrechung
  setButton2State(st);                                     // Neuen Zustand speichern, Text �ndern
  }
  
// Aktivierung bzw. Deaktivierung der Eingabefelder:
// p ... Flag f�r m�gliche Eingabe

function enableInput (p) {
  ipX0.readOnly = !p;                                      // Eingabefeld f�r Anfangsposition
  ipV0.readOnly = !p;                                      // Eingabefeld f�r Anfangsgeschwindigkeit
  ipA.readOnly = !p;                                       // Eingabefeld f�r Beschleunigung
  }
  
// Reaktion auf Resetknopf:
// Seiteneffekt bu2.state, t, on, timer, slow, x0, v0, a, tLB1, tLB2, Wirkung auf Eingabefelder
   
function reactionReset () {
  setButton2State(0);                                      // Zustand des Schaltknopfs Start/Pause/Weiter
  enableInput(true);                                       // Eingabefelder aktivieren
  stopAnimation();                                         // Animation stoppen
  t = 0;                                                   // Zeitvariable zur�cksetzen
  slow = cbSlow.checked;                                   // Flag f�r Zeitlupe
  reaction();                                              // Eingegebene Werte �bernehmen und rechnen
  paint();                                                 // Neu zeichnen
  }
  
// Reaktion auf den Schaltknopf Start/Pause/Weiter:
// Seiteneffekt bu2.state, on, timer, t0, slow, x0, v0, a, tLB1, tLB2, Wirkung auf Eingabefelder

function reactionStart () {
  switchButton2();                                         // Zustand des Schaltknopfs �ndern
  enableInput(false);                                      // Eingabefelder deaktivieren
  if (bu2.state == 1) startAnimation();                    // Entweder Animation starten bzw. fortsetzen ...
  else stopAnimation();                                    // ... oder stoppen
  slow = cbSlow.checked;                                   // Flag f�r Zeitlupe
  reaction();                                              // Eingegebene Werte �bernehmen und rechnen
  updateInput();                                           // Eingabefelder aktualisieren
  }
  
// Reaktion auf Optionsfeld Zeitlupe:
// Seiteneffekt slow

function reactionSlow () {
  slow = cbSlow.checked;                                   // Flag f�r Zeitlupe setzen
  }
  
// Hilfsroutine: Eingabe �bernehmen und rechnen
// Seiteneffekt x0, v0, a, tLB1, tLB2, Wirkung auf Eingabefelder

function reaction () {
  input();                                                 // Eingegebene Werte �bernehmen (eventuell korrigiert)
  calculation();                                           // Berechnungen
  }
  
// Reaktion auf Tastendruck (nur auf Enter-Taste):
// Seiteneffekt x0, v0, a, tLB1, tLB2, Wirkung auf Eingabefelder
  
function reactionEnter (e) {
  if (e.key && String(e.key) == "Enter"                    // Falls Entertaste (Firefox/Internet Explorer) ...
  || e.keyCode == 13)                                      // Falls Entertaste (Chrome) ...
    reaction();                                            // ... Daten �bernehmen und rechnen                          
  paint();                                                 // Neu zeichnen
  }
  
// Reaktion auf Mausklick oder Ber�hren mit dem Finger (Auswahl):
// u, v ... Bildschirmkoordinaten bez�glich Viewport
// Seiteneffekt nrLB

function reactionDown (u, v) {
  var re = canvas.getBoundingClientRect();                 // Lage der Zeichenfl�che bez�glich Viewport
  u -= re.left; v -= re.top;                               // Koordinaten bez�glich Zeichenfl�che
  if (v > YS || v < YS-20) {nrLB = 0; return;}             // Falls y-Koordinate unpassend, keine Lichtschranke ausgew�hlt
  var min = Math.abs(u-(XS+xLB1*PIX));                     // Abstand (waagrecht) von der ersten Lichtschranke 
  nrLB = 1;                                                // Vorl�ufig erste Lichtschranke ausgew�hlt
  var d = Math.abs(u-(XS+xLB2*PIX));                       // Abstand (waagrecht) von der zweiten Lichtschranke                     
  if (d < min) {min = d; nrLB = 2;}                        // Falls Abstand kleiner, zweite Lichtschranke ausgew�hlt
  if (min > 10) nrLB = 0;                                  // Falls Abstand zu gro�, keine Lichtschranke ausgew�hlt
  }
  
// Reaktion auf Bewegung von Maus oder Finger (�nderung):
// u, v ... Bildschirmkoordinaten bez�glich Viewport
// Seiteneffekt on, t, xLB1, xLB2

function reactionMove (u, v) {
  if (nrLB == 0) return;                                   // Abbrechen, falls keine Lichtschranke ausgew�hlt
  var re = canvas.getBoundingClientRect();                 // Lage der Zeichenfl�che bez�glich Viewport
  u -= re.left; v -= re.top;                               // Koordinaten bez�glich Zeichenfl�che  
  var xMin = XS, xMax = XS+50*PIX;                         // Koordinaten der Extrempositionen (vorl�ufig)
  if (nrLB == 1) xMax = Math.round(XS+(xLB2-1)*PIX);       // Erste Lichtschranke muss links von der zweiten sein
  if (nrLB == 2) xMin = Math.round(XS+(xLB1+1)*PIX);       // Zweite Lichtschranke muss rechts von der ersten sein
  on = false;                                              // Animation abschalten
  t = 0;                                                   // Zeitvariable zur�cksetzen
  enableInput(true);                                       // Eingabefelder aktivieren
  if (u < xMin) u = xMin;                                  // Falls Position zu weit links, korrigieren
  if (u > xMax) u = xMax;                                  // Falls Position zu weit rechts, korrigieren
  var xLB = (u-XS)/PIX;                                    // Neue Position (waagrecht) der Lichtschranke
  if (nrLB == 1) xLB1 = xLB; else xLB2 = xLB;              // Neue Position speichern    
  paint();                                                 // Neu zeichnen
  }
  
// Animation starten oder fortsetzen:
// Seiteneffekt on, timer, t0

function startAnimation () {
  on = true;                                               // Animation angeschaltet
  timer = setInterval(paint,40);                           // Timer mit Intervall 0,040 s aktivieren
  t0 = new Date();                                         // Neuer Anfangszeitpunkt 
  }
  
// Animation stoppen:
// Seiteneffekt on, timer

function stopAnimation () {
  on = false;                                              // Animation abgeschaltet
  clearInterval(timer);                                    // Timer deaktivieren
  }
  
//-------------------------------------------------------------------------------------------------

// Berechnungen:
// Seiteneffekt tLB1, tLB2

function calculation () {
  tLB1 = timeLB(xLB1);                                     // Gestoppte Zeit der ersten Lichtschranke (s)
  tLB2 = timeLB(xLB2);                                     // Gestoppte Zeit der zweiten Lichtschranke (s)
  }

// Polygone f�r das Auto:
// Seiteneffekt auf Musterpolygone polygonCar0, polygonWindow0
// Seiteneffekt auf polygonCar, polygonWindow; die x-Koordinaten der Ecken dieser variablen Polygone werden sp�ter angepasst.
// Wichtig: XS und YS m�ssen schon festgelegt sein.

function initPolygons () {
  polygonCar0 = [[0,-3], [-1,-9], [-8,-9], [-12,-15], [-24,-15], [-30,-10], [-30,-3]];   // Musterpolygon f�r Karosserie
  polygonWindow0 = [[-11,-9], [-14,-12], [-22,-12], [-22,-9]];       // Musterpolygon f�r Fenster
  var n = polygonCar0.length;                              // Zahl der Ecken (Karosserie)
  polygonCar = new Array(n);                               // Neues Array
  for (var i=0; i<n; i++) {                                // F�r alle Ecken (Karosserie) ...
    polygonCar0[i][0] += XS; polygonCar0[i][1] += YS;      // Ecke f�r Musterpolygon (Karosserie) festlegen
    polygonCar[i] = [0,polygonCar0[i][1]];                 // Ecke f�r variables Polygon (Karosserie) vorl�ufig festlegen
    }
  n = polygonWindow0.length;                               // Zahl der Ecken (Fenster)
  polygonWindow = new Array(n);                            // Neues Array
  for (i=0; i<n; i++) {                                    // F�r alle Ecken (Fenster) ...
    polygonWindow0[i][0] += XS;                            // x-Koordinate f�r Ecke des Musterpolygons (Fenster) festlegen 
    polygonWindow0[i][1] += YS;                            // y-Koordinate f�r Ecke des Musterpolygons (Fenster) festlegen
    polygonWindow[i] = [0,polygonWindow0[i][1]];           // Ecke f�r variables Polygon (Fenster) vorl�ufig festlegen
    }
  }

// Gestoppte Zeit f�r Lichtschranke:
// xLB ... Position der Lichtschranke (m)
// R�ckgabewert: L�sung der Gleichung (a/2)*t^2 + v0*t + x0 = xLB
// Falls keine L�sung, R�ckgabewert -1

function timeLB (xLB) {
  if (a == 0) return (xLB-x0)/v0;                          // Falls Gleichung linear, L�sung zur�ckgeben
  var discr = v0*v0+2*a*(xLB-x0);                          // Diskriminante
  if (discr < 0) return -1;                                // Falls Diskriminante negativ, keine L�sung
  var sqrt = Math.sqrt(discr);                             // Wurzel aus der Diskriminante
  var t1 = (-v0+sqrt)/a, t2 = (-v0-sqrt)/a;                // L�sungen der quadratischen Gleichung
  if (a < 0) {var h = t1; t1 = t2; t2 = h;}                // Eventuell vertauschen, sodass t1 > t2 gilt
  if (t1 > 0) return t1;                                   // Gr��ere L�sung zur�ckgeben, falls positiv
  if (t2 > 0) return t2;                                   // Kleinere L�sung zur�ckgeben, falls positiv
  return -1;                                               // Keine sinnvolle L�sung
  }
  
// Zahlenangabe:
// beg ... Zeichenkette am Anfang
// v ..... Zahl
// n ..... Anzahl der Nachkommastellen
// end ... Zeichenkette am Ende, zum Beispiel Einheit

function valueToString (beg, v, n, end) {
  var s = beg+v.toFixed(n)+end;                            // Zeichenkette zusammensetzen
  return s.replace(".",decimalSeparator);                  // Eventuell Punkt durch Komma ersetzen
  }
  
// Umwandlung einer Zahl in eine Zeichenkette:
// n ..... Gegebene Zahl
// d ..... Zahl der Stellen
// fix ... Flag f�r Nachkommastellen (im Gegensatz zu g�ltigen Ziffern)

function ToString (n, d, fix) {
  var s = (fix ? n.toFixed(d) : n.toPrecision(d));         // Zeichenkette mit Dezimalpunkt
  return s.replace(".",decimalSeparator);                  // Eventuell Punkt durch Komma ersetzen
  }
  
// Eingabe einer Zahl
// ef .... Eingabefeld
// d ..... Zahl der Stellen
// fix ... Flag f�r Nachkommastellen (im Gegensatz zu g�ltigen Ziffern)
// min ... Minimum des erlaubten Bereichs
// max ... Maximum des erlaubten Bereichs
// R�ckgabewert: Zahl oder NaN
// Wirkung auf Eingabefeld
  
function inputNumber (ef, d, fix, min, max) {
  var s = ef.value;                                        // Zeichenkette im Eingabefeld
  s = s.replace(",",".");                                  // Eventuell Komma in Punkt umwandeln
  var n = Number(s);                                       // Umwandlung in Zahl, falls m�glich
  if (isNaN(n)) n = 0;                                     // Sinnlose Eingaben als 0 interpretieren 
  if (n < min) n = min;                                    // Falls Zahl zu klein, korrigieren
  if (n > max) n = max;                                    // Falls Zahl zu gro�, korrigieren
  ef.value = ToString(n,d,fix);                            // Eingabefeld eventuell korrigieren
  return n;                                                // R�ckgabewert
  }
   
// Gesamte Eingabe:
// Seiteneffekt x0, v0, a, Wirkung auf Eingabefelder

function input () {
  x0 = inputNumber(ipX0,2,true,0,50);                     // Anfangsposition (m)
  v0 = inputNumber(ipV0,2,true,-10,10);                   // Anfangsgeschwindigkeit (m/s)
  a = inputNumber(ipA,2,true,-2,2);                       // Beschleunigung (m/s�)
  }
  
// Aktualisierung der Eingabefelder:

function updateInput () {
  ipX0.value = ToString(x0,2,true);                       // Eingabefeld f�r Anfangsposition (m)
  ipV0.value = ToString(v0,2,true);                       // Eingabefeld f�r Anfangsgeschwindigkeit (m/s)
  ipA.value = ToString(a,2,true);                         // Eingabefeld f�r Beschleunigung (m/s�)
  }

//-------------------------------------------------------------------------------------------------

// Neuer Grafikpfad (Standardwerte):

function newPath () {
  ctx.beginPath();                                         // Neuer Pfad
  ctx.strokeStyle = "#000000";                             // Linienfarbe schwarz
  ctx.lineWidth = 1;                                       // Liniendicke 1
  }
  
// Linie zeichnen:
// x1, y1 ... Anfangspunkt
// x2, y2 ... Endpunkt
// c ........ Farbe (optional, Defaultwert schwarz)

function line (x1, y1, x2, y2, c) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  if (c) ctx.strokeStyle = c;                              // Linienfarbe festlegen, falls angegeben
  ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);                    // Linie vorbereiten
  ctx.stroke();                                            // Linie zeichnen
  }
  
// Pfeil zeichnen:
// x1, y1 ... Anfangspunkt
// x2, y2 ... Endpunkt
// w ........ Liniendicke (optional)
// Zu beachten: Die Farbe wird durch ctx.strokeStyle bestimmt.

function arrow (x1, y1, x2, y2, w) {
  if (!w) w = 1;                                           // Falls Liniendicke nicht definiert, Defaultwert                          
  var dx = x2-x1, dy = y2-y1;                              // Vektorkoordinaten
  var length = Math.sqrt(dx*dx+dy*dy);                     // L�nge
  if (length == 0) return;                                 // Abbruch, falls L�nge 0
  dx /= length; dy /= length;                              // Einheitsvektor
  var s = 2.5*w+7.5;                                       // L�nge der Pfeilspitze 
  var xSp = x2-s*dx, ySp = y2-s*dy;                        // Hilfspunkt f�r Pfeilspitze         
  var h = 0.5*w+3.5;                                       // Halbe Breite der Pfeilspitze
  var xSp1 = xSp-h*dy, ySp1 = ySp+h*dx;                    // Ecke der Pfeilspitze
  var xSp2 = xSp+h*dy, ySp2 = ySp-h*dx;                    // Ecke der Pfeilspitze
  xSp = x2-0.6*s*dx; ySp = y2-0.6*s*dy;                    // Einspringende Ecke der Pfeilspitze
  ctx.beginPath();                                         // Neuer Pfad
  ctx.lineWidth = w;                                       // Liniendicke
  ctx.moveTo(x1,y1);                                       // Anfangspunkt
  if (length < 5) ctx.lineTo(x2,y2);                       // Falls kurzer Pfeil, weiter zum Endpunkt, ...
  else ctx.lineTo(xSp,ySp);                                // ... sonst weiter zur einspringenden Ecke
  ctx.stroke();                                            // Linie zeichnen
  if (length < 5) return;                                  // Falls kurzer Pfeil, keine Spitze
  ctx.beginPath();                                         // Neuer Pfad f�r Pfeilspitze
  ctx.lineWidth = 1;                                       // Liniendicke zur�cksetzen
  ctx.fillStyle = ctx.strokeStyle;                         // F�llfarbe wie Linienfarbe
  ctx.moveTo(xSp,ySp);                                     // Anfangspunkt (einspringende Ecke)
  ctx.lineTo(xSp1,ySp1);                                   // Weiter zum Punkt auf einer Seite
  ctx.lineTo(x2,y2);                                       // Weiter zur Spitze
  ctx.lineTo(xSp2,ySp2);                                   // Weiter zum Punkt auf der anderen Seite
  ctx.closePath();                                         // Zur�ck zum Anfangspunkt
  ctx.fill();                                              // Pfeilspitze zeichnen 
  }
  
// Rechteck mit schwarzem Rand zeichnen:
// (x,y) ... Koordinaten der Ecke links oben (Pixel)
// w ....... Breite (Pixel)
// h ....... H�he (Pixel)
// c ....... F�llfarbe (optional)

function rectangle (x, y, w, h, c) {
  if (c) ctx.fillStyle = c;                                // F�llfarbe festlegen, falls angegeben
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.fillRect(x,y,w,h);                                   // Rechteck ausf�llen
  ctx.strokeRect(x,y,w,h);                                 // Rand zeichnen
  }
  
// Kreisscheibe mit schwarzem Rand zeichnen:
// (x,y) ... Mittelpunktskoordinaten (Pixel)
// r ....... Radius (Pixel)
// c ....... F�llfarbe (optional)

function circle (x, y, r, c) {
  if (c) ctx.fillStyle = c;                                // F�llfarbe
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.arc(x,y,r,0,2*Math.PI,true);                         // Kreis vorbereiten
  ctx.fill();                                              // Kreis ausf�llen
  ctx.stroke();                                            // Rand zeichnen
  }
  
// Polygon zeichnen:
// p ... Zweifach indiziertes Array mit Koordinaten der Ecken
// c ... F�llfarbe

function drawPolygon (p, c) {
  newPath();                                               // Neuer Pfad (Standardwerte)
  ctx.fillStyle = c;                                       // F�llfarbe
  ctx.moveTo(p[0][0],p[0][1]);                             // Zur ersten Ecke
  for (var i=1; i<p.length; i++)                           // F�r alle weiteren Ecken ... 
    ctx.lineTo(p[i][0],p[i][1]);                           // Linie zum Pfad hinzuf�gen
  ctx.closePath();                                         // Zur�ck zum Ausgangspunkt
  ctx.fill(); ctx.stroke();                                // Polygon ausf�llen und Rand zeichnen   
  }
  
// Ausgerichteter Text:
// s ....... Zeichenkette
// (x,y) ... Position (Pixel)
// t ....... Ausrichtung (0 f�r linksb�ndig, 1 f�r zentriert, 2 f�r rechtsb�ndig)

function alignText (s, x, y, t) {
  if (t == 0) ctx.textAlign = "left";                      // Ausrichtung entweder linksb�ndig ...
  else if (t == 1) ctx.textAlign = "center";               // ... oder zentriert ...
  else ctx.textAlign = "right";                            // ... oder rechtsb�ndig
  ctx.fillText(s,x,y);                                     // Text ausgeben
  }

// Stra�e mit L�ngenskala zeichnen:

function street () {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  line(0,YS,width,YS);                                     // Stra�e
  var xx = XS+50*PIX+50, yy = YS+15;                       // Koordinaten f�r L�ngenskala (Pixel)
  arrow(XS-10,yy,xx,yy);                                   // Pfeil f�r L�ngenskala
  alignText("x",xx,yy+15,1);                               // Beschriftung der Achse
  alignText(text10,xx,yy+25,1);                            // Angabe der Einheit (m)
  var pix5 = 5*PIX;                                        // Abstand der Ticks (Pixel)
  for (var i=0; i<=10; i++) {                              // F�r alle Ticks ...
    xx = XS+i*pix5;                                        // Waagrechte Bildschirmkoordinate (Pixel) berechnen 
    line(xx,yy-3,xx,yy+3);                                 // Tick zeichnen
    alignText(""+(i*5),xx,yy+15,1);                        // Tick beschriften
    }
  }
  
// Auto zeichnen:

function drawCar () {
  var dx = x*PIX;                                          // Verschiebung (Pixel)
  for (var i=0; i<polygonCar.length; i++)                  // F�r alle Ecken der Karosserie ... 
    polygonCar[i][0] = polygonCar0[i][0]+dx;               // x-Koordinate berechnen
  drawPolygon(polygonCar,colorCar);                        // Polygon f�r Karosserie zeichnen
  for (i=0; i<polygonWindow.length; i++)                   // F�r alle Ecken des Fensters ...
    polygonWindow[i][0] = polygonWindow0[i][0]+dx;         // x-Koordinate berechnen
  drawPolygon(polygonWindow,colorWindow);                  // Polygon f�r Fenster zeichnen 
  var xx = XS+dx, yy = YS-4;                               // Hilfsgr��en
  line(xx-18,yy,xx-18,YS-13);                              // Trennlinie (T�r)      
  circle(xx-23,yy,3,"#000000");                            // Hinterrad
  circle(xx-7,yy,3,"#000000");                             // Vorderrad
  circle(xx-16,YS-10,1,"#000000");                         // Kopf des Fahrers
  yy = YS-6;                                               // Hilfsgr��e �ndern
  if (rbV.checked) {                                       // Falls oberer Radiobutton gew�hlt ...
    ctx.strokeStyle = colorVelocity;                       // ... Farbe f�r Geschwindigkeit                  
    var vv = v*PIXV;                                       // ... Pfeill�nge (Pixel, mit Vorzeichen)
    var x0 = (v>0 ? xx : xx-30);                           // ... x-Koordinate des Anfangspunktes
    if (v != 0) arrow(x0,yy,x0+vv,yy,3);                   // ... Pfeil f�r Geschwindigkeitsvektor zeichnen
    }
  else {                                                   // Falls unterer Radiobutton gew�hlt ...
    ctx.strokeStyle = colorAcceleration;                   // ... Farbe f�r Beschleunigung                 
    vv = a*PIXA;                                           // ... Pfeill�nge (Pixel, mit Vorzeichen)
    x0 = (a>0 ? xx : xx-30);                               // ... x-Koordinate des Anfangspunktes
    if (a != 0) arrow(x0,yy,x0+vv,yy,3);                   // ... Pfeil f�r Beschleunigungsvektor zeichnen
    }
  }
  
// Lichtschranke zeichnen:
// x ... Position (in m)
// c ... Farbe

function lightBarrier (x, c) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.fillStyle = c;                                       // F�llfarbe
  ctx.fillRect(XS+x*PIX-2.5,YS-20,5,20);                   // Rechteck ausf�llen
  ctx.strokeRect(XS+x*PIX-2.5,YS-20,5,20);                 // Rechtecksrand zeichnen
  }
  
// Digitaluhr zeichnen:
// (x,y) ... Koordinaten des Mittelpunkts
// t ....... Angezeigte Zeit (s)
// c ....... Farbe des Geh�uses

function clock (x, y, t, c) {
  rectangle(x-60,y-16,120,32,c);                           // Geh�use
  rectangle(x-50,y-10,100,20,"#000000");                   // Hintergrund der Anzeige
  ctx.fillStyle = "#ff0000";                               // Farbe f�r Ziffern
  ctx.font = "normal normal bold 16px monospace";          // Zeichensatz
  ctx.textAlign = "center";                                // Zentrierte Ausgabe
  var n = Math.floor(t/1000);                              // Zahl der Zeitabschnitte zu je 1000 s
  var s = (t-n*1000).toFixed(3)+" "+second;                // Zeitangabe (Einheit s, alle 1000 s Neuanfang)
  s = s.replace(".",decimalSeparator);                     // Eventuell Punkt durch Komma ersetzen
  while (s.length < 9) s = " "+s;                          // Eventuell Leerzeichen am Anfang erg�nzen
  ctx.fillText(s,x,y+5);                                   // Ausgabe der Zeit
  }
  
// Koordinatensystem mit beschrifteter Zeit-Achse zeichnen:
// (x,y) .... Ursprung (Pixel)
// yMinus ... Anfang der senkrechten Achse (relativ zum Ursprung, Pixel)
// yPlus .... Ende (Pfeilspitze) der senkrechten Achse (relativ zum Ursprung, Pixel)

function cosy (x, y, yMinus, yPlus) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.font = FONT;                                         // Zeichensatz
  arrow(x-10,y,x+110,y);                                   // Waagrechte Achse (Zeit)
  arrow(x,y-yMinus,x,y-yPlus);                             // Senkrechte Achse
  for (var i=1; i<=5; i++) {                               // F�r alle Ticks der t-Achse ...
    var xx = x+i*2*PIXT;                                   // x-Koordinate berechnen
    line(xx,y-3,xx,y+3);                                   // Tick zeichnen
    alignText(""+(2*i),xx,y+15,1);                         // Tick beschriften
    }      
  alignText(symbolTime,x+105,y+15,1);                      // Beschriftung der t-Achse
  alignText(text09,x+105,y+25,1);                          // Beschriftung (Einheit s)
  }
  
// Ticks f�r senkrechte Achse zeichnen:
// (x,y) ... Ursprung (Pixel)
// iMin .... kleinster Index
// iMax .... gr��ter Index
// dPix .... Abstand benachbarter Ticks (Pixel)
// dNr ..... Abstand benachbarter Zahlen

function ticksVerticalAxis (x, y, iMin, iMax, dPix, dNr) {
  for (var i=iMin; i<=iMax; i++) {                         // F�r alle Indizes ...
    if (i == 0) continue;                                  // 0 auslassen
    var yy = y-i*dPix;                                     // Senkrechte Bildschirmkoordinate berechnen (Pixel)
    line(x-3,yy,x+3,yy);                                   // Tick zeichnen
    alignText(""+(i*dNr),x-10,yy+4,2);                     // Tick beschriften
    }
  }
  
// Zeit-Weg-Diagramm zeichnen:

function diagramTimePosition () {
  var xU = XS, yU = 330;                                   // Koordinaten des Ursprungs (Pixel)
  cosy(xU,yU,-10,150);                                     // Koordinatensystem mit beschrifteter t-Achse
  ticksVerticalAxis(xU,yU,1,6,10*PIXX,10);                 // Ticks der x-Achse mit Beschriftung
  ctx.fillStyle = colorPosition;                           // Farbe f�r Position
  alignText(symbolPosition,xU-20,yU-145,1);                // Beschriftung der x-Achse
  alignText(text10,xU-20,yU-135,1);                        // Angabe der Einheit (m)
  var s = valueToString("x = ",x,2," "+meter);             // Zeichenkette f�r aktuellen Wert von x (Position)
  alignText(s,xU+60,380,1);                                // Zeichenkette ausgeben
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.strokeStyle = colorPosition;                         // Farbe f�r Position
  ctx.moveTo(xU,yU-x0*PIXX);                               // Anfangspunkt des Parabelbogens (N�herung durch Polygonzug)
  for (var xx=xU+1; xx<=xU+100; xx++) {                    // F�r alle Teilstrecken ...
    var tt = (xx-xU)/PIXT;                                 // Zeit (s)
    var xD = a*tt*tt/2+v0*tt+x0;                           // Position (m)
    yy = yU-xD*PIXX;                                       // Senkrechte Bildschirmkoordinate (Pixel)
    if (yy <= yU+30 && yy >= yU-140 && tt < t)             // Falls Endpunkt im gezeichneten Bereich ... 
      ctx.lineTo(xx,yy);                                   // ... Linie vorbereiten
    }
  ctx.stroke();                                            // Parabel zeichnen
  xx = xU+t*PIXT; yy = yU-x*PIXX;                          // Koordinaten zur Markierung der momentanen Position
  if (xx <= xU+100 && yy <= yU && yy >= yU-140)            // Falls Markierung im gezeichneten Bereich ...
    circle(xx,yy,2,colorPosition);                         // ... Kreis zeichnen    
  }
  
// Zeit-Geschwindigkeit-Diagramm:
  
function diagramTimeVelocity () {
  var xU = XS+170, yU = 270;                               // Koordinaten des Ursprungs (Pixel)
  cosy(xU,yU,-70,90);                                      // Koordinatensystem mit beschrifteter t-Achse
  ticksVerticalAxis(xU,yU,-4,4,5*PIXV,5);                  // Ticks der v-Achse mit Beschriftung
  ctx.fillStyle = colorVelocity;                           // Farbe f�r Geschwindigkeit
  alignText("v",xU-25,yU-85,1);                            // Beschriftung der v-Achse
  alignText(text11,xU-25,yU-75,1);                         // Angabe der Einheit (m/s)
  var s = valueToString("v = ",v,2," "+meterPerSecond);    // Zeichenkette f�r aktuellen Wert von v (Geschwindigkeit)
  alignText(s,xU+60,380,1);                                // Zeichenkette ausgeben
  var xx = xU+t*PIXT, yy = yU-v*PIXV;                      // Koordinaten zur Markierung der momentanen Geschwindigkeit
  var yy0 = yU-v0*PIXV;                                    // Senkrechte Koordinate f�r Anfangspunkt des Graphen 
  if (xx <= xU+100) {                                      // Falls Endpunkt im gezeichneten Bereich ...
    line(xU,yy0,xx,yy,colorVelocity);                      // ... Linie zeichnen
    circle(xx,yy,2,colorVelocity);                         // ... Kreis zeichnen
    }
  else {                                                   // Falls Endpunkt au�erhalb des gezeichneten Bereichs ...
    yy = yU-(a*100/PIXT+v0)*PIXV;                          // ... Senkrechte Koordinate des Endpunktes neu berechnen
    line(xU,yy0,xU+100,yy,colorVelocity);                  // ... Linie zeichnen
    }
  }
  
// Zeit-Beschleunigung-Diagramm:

function diagramTimeAcceleration () {
  var xU = XS+340, yU = 270;                               // Koordinaten des Ursprungs (Pixel)
  cosy(xU,yU,-70,90);                                      // Koordinatensystem mit beschrifteter t-Achse
  ticksVerticalAxis(xU,yU,-2,2,PIXA,1);                    // Ticks der a-Achse mit Beschriftung
  ctx.fillStyle = colorAcceleration;                       // Farbe f�r Beschleunigung
  alignText("a",xU-27,yU-85,1);                            // Beschriftung der a-Achse 
  alignText(text12,xU-27,yU-75,1);                         // Angabe der Einheit (m/s�)
  var s = valueToString("a = ",a,2," "+meterPerSecond2);   // Zeichenkette f�r Wert von a (Beschleunigung)
  alignText(s,xU+60,380,1);                                // Zeichenkette ausgeben     
  var xx = xU+t*PIXT; yy = yU-a*PIXA;                      // Koordinaten zur Markierung der momentanen Beschleunigung
  if (xx <= xU+100) {                                      // Falls Endpunkt im gezeichneten Bereich ...
    line(xU,yy,xx,yy,colorAcceleration);                   // ... Linie zeichnen
    circle(xx,yy,2,colorAcceleration);                     // ... Kreis zeichnen
    }
  else line(xU,yy,xU+100,yy);                              // Andernfalls nur Linie zeichnen
  }

// Grafikausgabe:
  
function paint () {
  ctx.fillStyle = colorBackground;                         // Hintergrundfarbe
  ctx.fillRect(0,0,width,height);                          // Hintergrund ausf�llen
  ctx.font = FONT;                                         // Zeichensatz
  street();                                                // Stra�e mit L�ngenskala
  if (on) {                                                // Falls Animation angeschaltet ...
    var t1 = new Date();                                   // ... Aktuelle Zeit
    var dt = (t1-t0)/1000;                                 // ... L�nge des Zeitintervalls (s)
    if (slow) dt /= 10;                                    // ... Falls Zeitlupe, Zeitintervall durch 10 dividieren
    t += dt;                                               // ... Zeitvariable aktualisieren
    t0 = t1;                                               // ... Neuer Anfangszeitpunkt
    }
  x = a*t*t/2+v0*t+x0;                                     // Position (vorne, m)
  v = a*t+v0;                                              // Geschwindigkeit (m/s)
  drawCar();                                               // Auto zeichnen
  lightBarrier(xLB1,colorLightBarrier1);                   // Erste Lichtschranke 
  lightBarrier(xLB2,colorLightBarrier2);                   // Zweite Lichtschranke
  clock(80,150,t,colorClock1);                             // Normale Uhr (links) 
  var tt = t;                                              // Zeit der Stoppuhr 1 (Mitte) von t �bernehmen
  if (tLB1 > 0) tt = Math.min(t,tLB1);                     // Falls Auto schon vorbei, gestoppte Zeit
  clock(250,150,tt,colorLightBarrier1);                    // Stoppuhr 1 (Mitte) zeichnen      
  tt = t;                                                  // Zeit der Stoppuhr 2 (rechts) von t �bernehmen
  if (tLB2 > 0) tt = Math.min(t,tLB2);                     // Falls Auto schon vorbei, gestoppte Zeit
  clock(420,150,tt,colorLightBarrier2);                    // Stoppuhr 2 (rechts) zeichnen
  diagramTimePosition();                                   // Zeit-Weg-Diagramm 
  diagramTimeVelocity();                                   // Zeit-Geschwindigkeit-Diagramm
  diagramTimeAcceleration();                               // Zeit-Beschleunigung-Diagramm
  ctx.fillStyle = "#000000";                               // Farbe schwarz
  var s = valueToString("x = ",xLB1,3," "+meter);          // Zeichenkette f�r die Position der linken Lichtschranke
  alignText(s,250,125,1);                                  // Zeichenkette ausgeben
  s = valueToString("x = ",xLB2,3," "+meter);              // Zeichenkette f�r die Position der rechten Lichtschranke
  alignText(s,420,125,1);                                  // Zeichenkette ausgeben
  }
  
document.addEventListener("DOMContentLoaded",start,false);

