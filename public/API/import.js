if (!window["importer"]) {
	window["importer"] = true;
	let request = new XMLHttpRequest();

	let input = document.createElement('input');
	input.id = 'importURL';
	input.placeholder = 'Paste source url here';
	document.currentScript.parentNode.insertBefore(input, document.currentScript);

	let button = document.createElement('button');
	button.id = 'importButton';
	button.innerText = 'Send Request';
	button.onclick = () => {
		let requestJSON = JSON.stringify({
			user: document.getElementById('usernameHolder').innerText,
			url: document.getElementById('importURL').value,
		});
		errorText = "";
		errorField.innerText = errorText;
		let isTestEnviroment = document.getElementById("userEmailHolder").textContent === 'hdagnew@ucdavis.edu';
		request.open('POST', isTestEnviroment ? 'https://computer.miniland1333.com/import' : 'https://api.libretexts.org/import', true);
		request.addEventListener("progress", receive);
		// request.addEventListener("load", receive);
		request.send(requestJSON);
	};
	document.currentScript.parentNode.insertBefore(button, document.currentScript);


	let resultField = document.createElement('div');
	resultField.id = 'resultField';
	document.currentScript.parentNode.insertBefore(resultField, document.currentScript);

	let errorField = document.createElement('div');
	errorField.id = 'errorField';
	errorField.style.color = 'red';
	let errorText = "";
	document.currentScript.parentNode.insertBefore(errorField, document.currentScript);


	const batchButton = document.getElementById("importButton");

	function receive() {
		let newText = this.responseText;
		// console.log(newText);
		newText = newText.match(/^{.+}$(?!\s*^.*}$)/m);
		if (this.responseText && newText) {
			console.log(newText[0]);
			const json = JSON.parse(newText[0]);
			if (json.message) {
				if (json.isError) {
					errorText += json.message + '\n';
					errorField.innerText = errorText;
					if (json.message === 'This source is not valid, please check your URL') {
						batchButton.innerText = 'Try Again';
					}
				}
				else if (json.message.percent) {
					batchButton.innerText = json.message.percent + "%" + "\n" + json.message.eta;
				}
				else if (json.message.messageType && json.message.messageType === 'complete') {
					batchButton.innerText = `Complete! Time taken: ${json.message.timeTaken}`;
					resultField.innerHTML = `<a target="_blank" href="/${json.message.resultURL}">${json.message.resultURL}</a>`;
				}
				else {
					batchButton.innerText = json.message;
				}
			}
		}
	}
}