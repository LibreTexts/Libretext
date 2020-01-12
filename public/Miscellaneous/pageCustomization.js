var upperDiv = document.getElementById("ffs");
upperDiv.innerHTML=`
<p><button id="myBtn">Customize Page</button></p>

<div class="modal" id="myModal">
<div class="modal-content">
<h6>Customize Page Here</h6>

<p><select id="fs"><option value="Arial">Arial</option><option value="Verdana ">Verdana</option><option value="Impact ">Impact</option><option value="Comic Sans MS">Comic Sans MS</option> </select> <select id="size"><option value="7">7</option><option value="10">10</option><option value="20">20</option><option value="30">30</option> </select></p>
</div>
</div>

<p class="changeMe">Sparlich zunachst schonste ihr abraumen mehrmals der. Gang meer noch mi gern tust ja. Ei du sorglich ku feinheit behutsam. Achtzehn trillern den heiraten oha tadellos man. Hochmut so du gebogen an ja gerufen. Umwolkt barbara bereits du ahnlich da langsam mi schurze. Ans name tust mut lang etwa. Feierabend fluchtigen er leuchtturm nachmittag um hereintrat mi marktplatz. Einfand zweimal kindern wachter jungfer zu zuhorte es. Gestorben la vermodert leuchtete schwemmen schnupfen la plaudernd. Fiel weit hier frau es ware ja ging. Mag ihr oha schnellen gegenuber ausblasen. Flu recht extra wette moget was durch uhr den. Lauschte brannten halblaut da im. Getrennt launisch im vollends prachtig du. Die verlie spital gewann war begann dunner herauf. Schranken verweilen ein und duftenden ruh der zufrieden flanierte spazieren. Zu beim da es berg wies kaum. In ernst zu dahin em sahen recht ihrer. Gro sudwesten viehmarkt weg sah stadtchen schnupfen. Sauber mit morgen weg frauen ihm. Ein klimperte vermodert polemisch unendlich schnupfen schleiche des ihm sie. Spiel sahen das fur viele sonst leben leuen. Pa vermodert schwemmen gegenteil wo zerfasert. Wunderbar in schwemmen grundlich belustigt turnhalle im behaglich. Ihre hell paar froh kerl weg man buch. Dienstmagd regungslos sonderling gib ungerechte ein besonderes auf der. Anrufen em instand nachdem kindern meister mu niemand am da. Gewandert schwachen man schlupfte wie geschickt ich sog. Lampchen ziemlich bat als bei feinheit eberhard abraumen. Eia spruche tadelte ruh flecken der drunten. Gerechte madchens fraulein kam schlafet heiraten ich. Vorbeugte bedeckten gewandert pa es um barbieren ernstlich verlassen. Fu la gewachsen abstellte spurenden liebhaben schwarzes schnellen. Zuliebe abwarts am he schaute beinahe gewogen. Kleide wir weg starke beiden. Plotzlich so mu am naturlich gepfiffen. Ein lie gewi ein denk ware. Pa saubere es gedeckt niemand endlich lockere stimmts. Gern hand von ehe flie. Keinen wie sitzen regnen trauen weg allein besuch vor. Wo am bereits da glatter instand einfach taghell offnung. Schlafet kam ehe schmalen ansprach brauchte frohlich mit gru angenehm. Reist es holen es schlo mager knopf danke la. Neugierig em la ausblasen flanierte bi mu. Zu deine finde kuche so geben bi. Bis hielt jetzt sitzt trost kinde tut lie das. Lattenzaun verstehsts grasgarten ige gut drechslers. Gewohnt kleines schlich gro sondern fremder den eia eck kindern. Es kannst erfuhr mi neckte. Bedeckt in zuhorte am bi en starkem. Gib verlie drehte wer himmel kugeln. Mag nie fur las mudigkeit beneidest zufrieden vergesset. Gebracht gelernte sa um doppelte heimelig vornamen da du. Verlohnt gerberei er in hinabsah te. Dunkeln ja kleines so mundart stickig wu ja sammelt. Um unterwegs mitkommen mi he geburstet ausblasen wichszeug verstehen zu. Zwischen em im jahrlich am ob lampchen vorliebe. Leute mut spiel sie wie enden deren kunde und sechs. Nur achthausen stockwerke dienstmagd lag und vorpfeifen gerbersteg sonderling was. Uberall eck wandern hei melodie flo bildnis des klopfen. Des fur gott tur zwei etwa ans. Ab er nachtessen am he arbeitsame dienstmagd hereintrat. Blatt denkt von auf ihr keins genie sehet loben. In warmer daheim hinaus wochen hinein kinder es. Was eigentum schaffte jahrlich tal uberging ers. Ku kind em dann tage sa pa. Nun wies fur geht des uber man. Hausfrau uberlegt es an schreibt in. Schuppen doppelte mit zusammen lie tat ans. Stille la gerade je erzahl zu. Fischen du barbara ob fremder breiten. Neu dann zehn dort nur. Ansehen lie gesehen lustige wachsam sag dritten lebhaft mit. Am hellroten ertastete du er so vorbeugte abstellte. Sie aus hell dich leer aber. Worden fremde stille gewann ans aus sohlen dem gesagt. Die ten achthausen uberwunden die gab leuchtturm wohlgefuhl. Her unruhig sonntag wachter dem madchen. Enden sogar was denen wir danke empor. Er stickig um gelernt fingern wu reichen bestand la. Zueinander grashalden hereintrat sog mancherlei hof frohlicher vielleicht. Ob getrennt leichter verlohnt ja fu entgegen am lachelte. Sollte hubsch mussen kaffee bi er zu. Alten zarte dabei es sa an ku. Munter kommst gesagt im da. Leute hatte und gehts sehet faden weg. He spiegel so zu getafel solchen am abwarts.</p>`
// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
/*span.onclick = function() {
  modal.style.display = "none";
}*/

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

$("#fs").change(function() {
    //alert($(this).val());
    $('.changeMe').css("font-family", $(this).val());

});

$("#size").change(function() {
    $('.changeMe').css("font-size", $(this).val() + "px");
});