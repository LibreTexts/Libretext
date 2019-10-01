let RemixerFunctions = {
	generateDefault: generateDefault,
	userPermissions: userPermissions,
	statusColor: statusColor,
	articleTypeToTitle: articleTypeToTitle,
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
				"status": 'new',
				"data": {"padded": `${i.toString().padStart(2, '0')}.${j.toString().padStart(2, '0')}: New Page`}
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
		children: children,
		articleType: 'topic-category'
	}
}

function userPermissions(full) {
	
	let permission = 'Demonstration';
	const isAdmin = document.getElementById('adminHolder').innerText === 'true';
	const isPro = document.getElementById('proHolder').innerText === 'true';
	const groups = document.getElementById('groupHolder').innerText.toLowerCase();
	
	if (isAdmin)
		permission = "Admin";
	else if (isPro && groups.includes('faculty'))
		permission = 'Pro';
	else if (groups.includes('workshop'))
		permission = 'Workshop';
	
	const colors = {
		Admin: '#323232',
		Pro: '#127bc4',
		Workshop: '#098a0e',
		Demonstration: '#767676',
	};
	const descriptions = {
		Admin: 'Administrators have full access to the Remixer, including the ReRemixer',
		Pro: 'Registered Faculty can use the Remixer and Re-Remixer ',
		Workshop: 'Workshop users have access to the Remixer and can publish to the Workshop University',
		Demonstration: 'In Demonstration mode, the Remixer is functional but users cannot publish their end result to LibreTexts. Contact info@libretexts.org if you are a faculty who is interested in publishing their own Remix!',
	};
	
	if (!full)
		return permission;
	else
		return {permission: permission, color: colors[permission], description: descriptions[permission]}
}


function statusColor(status) {
	switch (status) {
		case 'unchanged':
			return 'gray';
		case 'new':
			return 'green';
		case 'modified':
			return 'orange';
		case 'deleted':
			return 'red';
		default:
			return status;
	}
}


function articleTypeToTitle(type) {
	switch (type) {
		case 'topic-category':
			return 'Unit';
		case 'topic-guide':
			return 'Chapter';
		case 'topic':
			return 'Topic';
	}
}

module.exports = RemixerFunctions;