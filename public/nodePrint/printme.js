const root = "https://dynamic.libretexts.org/";
window.addEventListener("load", () => {
	let printme = document.getElementById("printme");
	printme.addEventListener("click", printPage);
});

function printPage() {
	const call = root + "print/url=" + window.location;
	const xhttp = new XMLHttpRequest();
	xhttp.addEventListener("load", receive);
	xhttp.open("GET", call, true);
	xhttp.send();


	function receive() {
		if (this.status === 200) {
			window.open(root + "print/PDF/" + this.responseText+".pdf");
		}
		else {
			alert("Error! " + this.responseText);
		}
	}
}