Clazz.declarePackage ("JS");
Clazz.load (["JU.BS"], "JS.CIPData", null, function () {
c$ = Clazz.decorateAsClass (function () {
this.vwr = null;
this.setAuxiliary = false;
this.bsAtropisomeric = null;
this.bsAtoms = null;
this.bsHelixM = null;
this.bsHelixP = null;
this.bsAromatic = null;
this.atoms = null;
this.bsXAromatic = null;
this.bsCMinus = null;
this.bsMolecule = null;
this.lstSmallRings = null;
this.bsKekuleAmbiguous = null;
Clazz.instantialize (this, arguments);
}, JS, "CIPData");
Clazz.prepareFields (c$, function () {
this.bsAtropisomeric =  new JU.BS ();
this.bsXAromatic =  new JU.BS ();
this.bsCMinus =  new JU.BS ();
this.bsKekuleAmbiguous =  new JU.BS ();
});
Clazz.makeConstructor (c$, 
function () {
});
Clazz.defineMethod (c$, "set", 
function (vwr, bsAtoms) {
this.vwr = vwr;
this.atoms = vwr.ms.at;
this.bsAtoms = bsAtoms;
this.bsMolecule = vwr.ms.getMoleculeBitSet (bsAtoms);
this.setAuxiliary = vwr.getBoolean (603979960);
try {
var lstRing = this.match ("[r]");
if (lstRing.isEmpty ()) {
this.lstSmallRings =  new Array (0);
} else {
this.lstSmallRings = this.getList ("*1**1||*1***1||*1****1||*1*****1||*1******1");
}this.bsAromatic = this.match ("a");
if (!this.bsAromatic.isEmpty ()) {
this.bsAtropisomeric = this.match ("[!H](.t1:-20,20)a{a(.t2:-20,20)-a}a[!H]");
this.bsHelixM = this.match ("A{a}(.t:-10,-40)a(.t:-10,-40)aaa");
this.bsHelixP = this.match ("A{a}(.t:10,40)a(.t:10,40)aaa");
this.bsXAromatic = this.match ("[r5v3n+0,r5v2o+0]");
this.bsCMinus = this.match ("[a-]");
if (!this.match ("[n+1,o+1]").isEmpty () && !this.bsXAromatic.isEmpty ()) {
this.bsKekuleAmbiguous.or (this.match ("a1[n+,o+]a[n,o]a1"));
this.bsKekuleAmbiguous.or (this.match ("a1[n+,o+][n,o]aa1"));
}if (!this.bsCMinus.isEmpty ()) this.bsKekuleAmbiguous.or (this.match ("a1=a[a-]a=a1"));
var lstR6a = this.getList ("a1aaaaa1");
for (var i = lstR6a.length; --i >= 0; ) {
this.bsKekuleAmbiguous.or (lstR6a[i]);
}
}} catch (e) {
if (Clazz.exceptionOf (e, Exception)) {
} else {
throw e;
}
}
return this;
}, "JV.Viewer,JU.BS");
Clazz.defineMethod (c$, "getList", 
 function (smarts) {
return this.vwr.getSubstructureSetArray (smarts, this.bsMolecule, 2);
}, "~S");
Clazz.defineMethod (c$, "match", 
 function (smarts) {
return this.vwr.getSmartsMatch (smarts, this.bsMolecule);
}, "~S");
});
