const key = "f4235c68fadeaf4f261da54ab575d82c26041c2543320b5e0874465d0f279536";
const url = "https://chem.libretexts.org/@api/deki/files/127745/HelloWorld.txt";

fetch("https://computer.miniland1333.com/getKey").then(async (response)=>{
	// let key = await response.text();
	console.log(key);
	fetch(url, {headers: {'X-Deki-Token': key}}).then(handleResponse);
});

async function handleResponse(response) {
	let data = await response.text();
	if (response.ok) {
		console.log(data);
		let temp = document.createElement("div");
		temp.textContent = url + " is CORS enabled!\n File contents: " + data;
		temp.style.color = "green";
		document.getElementById("resultsContainer").appendChild(temp);
	}
	else {
		console.log(data);
		let temp = document.createElement("div");
		temp.textContent = url + " is not CORS enabled";
		temp.style.color = "red";
		document.getElementById("resultsContainer").appendChild(temp);
	}
}