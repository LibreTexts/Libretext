let RemixerFunctions = {
	generateDefault: generateDefault,
	checkIfDemonstration: checkIfDemonstration,
};

function generateDefault(chapters, pages) {
	let key = 1;
	let children = [];
	for (let i = 1; i <= chapters; i++) {
		let childPages = [];
		let chapterKey = key++;
		
		for (let j = 1; j <= pages; j++) {
			childPages.push({
				"expanded": true,
				"key": `_${key++}`,
				"lazy": false,
				"title": `${i}.${j}: New Page`,
				"tooltip": "Newly Created Page",
				"data": {"padded": `${i.toString().padStart(2, '0')}.${i.toString().padStart(2, '0')}: New Page`}
			})
		}
		
		children.push({
			expanded: true,
			key: `_${chapterKey}`,
			lazy: false,
			title: `${i}: Chapter ${i}`,
			tooltip: "Newly Created Page",
			status: 'new',
			data: {"padded": `${i.toString().padStart(2, '0')}: Chapter ${i}`},
			children: childPages
		})
	}
	
	return {
		title: "New LibreText. Drag onto me to get started",
		key: "ROOT",
		url: "",
		padded: "",
		unselectable: true,
		expanded: true,
		children: children
	}
}

function checkIfDemonstration() {
	const groups = document.getElementById('groupHolder').innerText;
	return groups.includes('Workshop');
}


module.exports = RemixerFunctions;