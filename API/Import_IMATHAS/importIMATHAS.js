const fs = require('fs-extra');
const csv = require('neat-csv');
const {promisify} = require('util')
const sleep = promisify(setTimeout);
const fetch = require('node-fetch');
const LibreTexts = require('../reuse.js');

async function main() {
	/*let questions = await fs.readFile('./imathas_imas_questionset.csv', 'utf8');
	questions = await csv(questions);
	questions.forEach(item => {
		delete item.control;
		delete item.answer;
		delete item.solution;
	});
	let questionsObject = {}
	questions.forEach(item => {
		questionsObject[item['id']] = item;
	})
	
	let libraries = await fs.readFile('./imas_libraries.csv', 'utf8');
	libraries = await csv(libraries);
	let librariesObject = {}
	libraries.forEach(item => {
		librariesObject[item['id']] = {...item, questions: [], sublibraries: []};
	})
	
	//put questions into libraries
	let libraryItems = await fs.readFile('./imas_library_items.csv', 'utf8');
	libraryItems = await csv(libraryItems);
	for (const item of libraryItems) {
		let question = questionsObject[item.qsetid];
		if (question)
			librariesObject[item.libid].questions.push(question);
	}
	
	//create sublibrary hierarchy
	let libraryKeys = Object.keys(librariesObject).reverse();
	for (let i = 0; i < libraryKeys.length; i++) {
		let lib = librariesObject[libraryKeys[i]];
		if (lib.parent !== '0') {
			librariesObject[lib.parent].sublibraries.push(lib);
			// delete librariesObject[libraryKeys[i]];
		}
	}
	for (let i = 0; i < libraryKeys.length; i++) {
		let lib = librariesObject[libraryKeys[i]];
		if (lib.parent !== '0') {
			delete librariesObject[libraryKeys[i]];
		}
	}
	libraries = Object.values(librariesObject)
	
	await fs.writeJSON('./QUESTIONS.json', questionsObject, {spaces: '\t'});
	await fs.writeJSON('./LIBRARIES.json', libraries, {spaces: '\t'});*/
	let libraries = await fs.readJSON('./LIBRARIES.json');
	
	let root = 'Assessment_Gallery/Mathematics/IMathAS_Test';
	processHiearchy(libraries, root);
	
	async function processHiearchy(libraries, path) {
		for (let lib of libraries) {
			lib.path = `${path}/${lib.name}`;
			
			await createStructure(lib.path, lib.sublibraries.length ? 'category' : 'guide', lib)
			
			if (lib.questions.length)
				for (const q of lib.questions) {
					q.id = `${q.id}`.padStart(8, '0');
					await createStructure(`${lib.path}/${q.id}`, 'topic', q)
				}
			console.log(lib.path, lib.questions.length);
			if (lib.sublibraries.length)
				await processHiearchy(lib.sublibraries, lib.path);
		}
	}
	
	async function createStructure(path, type = 'category', problem) {
		let content;
		if (type === 'topic') {
			let tags = problem.keywords || [];
			tags.push('showtoc:no');
			tags.push('tech:imathas');
			tags.push(`problem-${problem.id}`);
			
			if (problem.author)
				tags.push(`author-${problem.author}`);
			tags = tags.map(tag => `<a href=\"#\">${tag}</a>`).join('');
			content = `<p class="mt-script-comment">IMathAS Activity</p>

<pre class="script">
template('IMathAS/Activity',{'Problem':'${problem.id}'});</pre>

<div class="comment">
<div class="mt-comment-meta">
<div class="mt-comment-author">Importer BOT</div>
<time class="mt-comment-datetime" datetime="2020-07-15T05:51:22.943Z">Jul 15, 2020, 12:00 AM</time></div>

<div class="mt-comment-content">
<p>${JSON.stringify(problem)}</p>
</div>
</div>

<p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic</a>${tags}</p>
`
		}
		else
			content = `<p>{{template.ShowOrg()}}</p><p class=\"template:tag-insert\"><em>Tags recommended by the template: </em><a href=\"#\">article:topic-${type}</a></p>`;
		try {
			let response = await LibreTexts.authenticatedFetch(path, 'contents?abort=exists', 'query', 'LibreBot', {
				method: "POST",
				body: content,
			});
			if (!response.ok) {
				let error = await response.text();
				console.error(error);
				await sleep(600);
				return false;
			}
		} catch (e) {
			console.error(e);
			return false;
		}
		
		try {
			await putProperty('mindtouch.page#welcomeHidden', true, path);
			if (type === 'guide') {
				await putProperty("mindtouch.idf#guideDisplay", "single", path);
				await putProperty("mindtouch#idf.guideTabs", "[{\"templateKey\":\"Topic_hierarchy\",\"templateTitle\":\"Topic hierarchy\",\"templatePath\":\"MindTouch/IDF3/Views/Topic_hierarchy\",\"guid\":\"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5\"}]", path);
			}
			
			if (type !== 'topic') {
				if (typeof createStructure.image === 'undefined') {
					let image = 'https://files.libretexts.org/DefaultImages/default.png';
					image = await fetch(image);
					image = await image.blob();
					createStructure.image = image;
				}
				await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail", 'query', 'LibreBot', {
					method: "PUT",
					body: createStructure.image,
				});
			}
		}catch (e) {
			console.error(e);
		}
		
		console.log(`Created: ${path}`);
		await sleep(1100);
	}
}

async function putProperty(name, value, path) {
	await LibreTexts.authenticatedFetch(path, "properties", 'query', 'LibreBot', {
		method: "POST",
		body: value,
		headers: {
			"Slug": name
		}
	})
}

main();