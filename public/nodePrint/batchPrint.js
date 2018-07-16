/*
Ladda.bind('getLibretext',{callback:(instance)=>{
		const request = new XMLHttpRequest();
		request.open("PUT", "https://dynamic.libretexts.org/print/Libretext="+window["TOCName"], true); //async get
		request.addEventListener("load", receive);
		request.send(JSON.stringify(window["TOCTable"]));

		function receive(data) {
			console.log(data);
		}
	}});*/

let request = new XMLHttpRequest();
request.open("PUT", "https://dynamic.libretexts.org/print/Libretext=" + window["TOCName"], true); //async get
request.addEventListener("load", receive);
request.send(JSON.stringify({Hello: "Hello ", World: "World!"}));

function receive(data) {
	console.log(this.responseText);
}