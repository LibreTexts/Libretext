if (window.matchMedia("screen").matches) {
	setKernel();
	deleteServiceWorker();
	setInterval(deleteServiceWorker, 100);
	activateThebelab();
}

function deleteServiceWorker() {
	try {
		var serviceScript = document.querySelector('script[src*=\"serviceworker\"]');
		if (serviceScript) {
			// console.log(serviceScript);
			serviceScript.remove();
		}
	}
	catch (e) {
	}
	navigator.serviceWorker.getRegistrations().then(function (registrations) {
		if (!registrations.length) {
			return
		}
		for (let registration of registrations) {
			registration.unregister().then(function (boolean) {
				/*				console.log(
								 (boolean ? 'Successfully unregistered' : 'Failed to unregister'), 'ServiceWorkerRegistration' +
								 (registration.installing ? '  .installing.scriptURL = ' + registration.installing.scriptURL  : '') +
								 (registration.waiting ? '  .waiting.scriptURL = ' + registration.waiting.scriptURL  : '') +
								 (registration.active ? '  .active.scriptURL = ' + registration.active.scriptURL  : '') +
							 '  .scope: ' + registration.scope)*/
			})
		}
	})
}

function setKernel() {
	let kernel = document.currentScript.dataset["kernel"];
	let config = document.createElement("script");
	config.type = "text/x-thebe-config";
	config.id = "thebeConfig";

	switch (kernel) {
		case "python":
			kernel = "python3";
			break;
		case "r":
			kernel = "r";
			break;
		case "octave":
			kernel = "octave";
			break;
	}


	config.textContent = '{requestKernel: true, ' +
		'binderOptions: {repo: \"binder-examples/requirements\"},' +
		`kernelOptions: {name: "${kernel}"},` +
		'selector: "[data-jupyter]",}';

	if (kernel) {
		document.currentScript.appendChild(config);
	}
}

function activateThebelab() {
	const top = document.currentScript;

	const unpkg = document.createElement("script");
	unpkg.type = "text/javascript";
	unpkg.src = "https://unpkg.com/thebelab@^0.3.0";
	top.appendChild(unpkg);
	unpkg.onload = activateLoader;

	let str = '<span class="thebe_status_field"><span class="thebe-status-field" title="ThebeLab status.\n' +
		'Click `run` to execute code cells.\n' +
		'Computations courtesy of mybinder.org.">"Jupyter"</span></span>';

	str = $.parseHTML(str)[0];
	top.insertAdjacentElement('afterend',str);


	function activateLoader() {
		const status = document.createElement("script");
		status.type = "text/javascript";
		status.innerText = 'thebelab.on("status", function(evt, data) {\n' +
			'    $(".thebe-status-field")\n' +
			'        .attr("class", "thebe-status-field thebe-status-" + data.status)\n' +
			'        .text("Jupyter: "+data.status);\n' +
			'    if(data.status === "ready")\n' +
			'        setTimeout(()=>$(".thebe-status-field").fadeOut(3000),2000);\n' +
			'    if(data.status === "failed")\n' +
			'        $(".thebe-status-field").html("Jupyter: "+data.status+"</br>Please Reload Page");\n' +
			'    });\n' +
			'thebelab.bootstrap();';
		top.appendChild(status);
	}


}


function sendToJupyter() {
	const targetComputer = email === "hdagnew@ucdavis.edu" ? "home.miniland1333.com" : "jupyter.libretexts.org";
	const item = document.getElementById("pageText");
	console.log(item);
	request.open("PUT", "https://" + targetComputer + "/url=" + window["BatchName"], true); //async get
	request.addEventListener("load", download);
	request.send(JSON.stringify(requestJSON));

	function download() {
		if (this.status === 200)
			window.location = "https://" + targetComputer + "/" + this.responseText;
		else
			console.error(this.responseText);
	}
}