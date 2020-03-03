const fs = require('fs-extra');
const async = require('async');
const fetch = require('node-fetch');
const LibreTexts = require('./reuse.js');
const sleep = require('sleep-promise');

main();

async function main() {
	
	/*//path, keyword > problems
	let problems = await fs.readJSON('./JSON/webwork_OPL_pgfile.json');
	problems = arrayToObject(problems, 'pgfile_id');
	
	await reconcileLink(problems, 'path', undefined, 'path');
	await reconcileLink(problems, 'author');
	await reconcileLink(problems, 'morelt');
	// await reconcileLink(problems, 'problem');
	
	//put keywords into problems
	let keywords = await fs.readJSON('./JSON/webwork_OPL_keyword.json');
	keywords = arrayToObject(keywords, 'keyword_id');
	let keywords_problems = await fs.readJSON('./JSON/webwork_OPL_pgfile_keyword.json');
	
	keywords_problems.forEach(word => {
		let target = problems[word.pgfile_id];
		let keyword = keywords[word.keyword_id].keyword;
		
		if (target.keywords && target.keywords.length)
			target.keywords.push(keyword);
		else
			target.keywords = [keyword];
		
	});
	
	
	//problem > section
	let structure = await reconcileStructure('section', problems);
	structure = await reconcileStructure('chapter', structure);
	structure = await reconcileStructure('subject', structure);*/
	
	let structure =
		await fs.readJSON('./webwork/3-20.json');
	console.log(structure[1]);
	
	/*	let root = 'Assessment_Gallery/Mathematics/WeBWorK_Import';
		for (let [, subject] of Object.entries(structure)) {
			let subjectRoot = `${root}/${subject.name}`;
			await createStructure(subjectRoot);
			
			for (let chapter of subject.children) {
				let chapterRoot = `${subjectRoot}/${chapter.name}`;
				await createStructure(chapterRoot);
				
				
				for (let section of chapter.children) {
					let sectionRoot = `${chapterRoot}/${section.name}`;
					await createStructure(sectionRoot, 'guide');
					
					for (let problem of section.children) {
						let problemRoot = `${sectionRoot}/${problem.filename}`;
						await createStructure(problemRoot, 'topic', problem);
						await sleep(800);
					}
				}
			}
		}*/
	
	async function createStructure(path, type = 'category', problem) {
		let content;
		if (type === 'topic') {
			let tags = problem.keywords || [];
			if (problem.author_id)
				tags.push(`author-${problem.author_id.firstname} ${problem.author_id.lastname}`);
			tags = tags.map(tag => `<a href=\"#\">${tag}</a>`).join('');
			content = `<p class="mt-script-comment">WebWorK Activity</p>

<pre class="script">
template('WebWork/Activity',{'Problem':'Library/${problem.path_id}/${problem.filename}'});</pre>
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
				return false;
			}
		} catch (e) {
			console.error(e);
			return false;
		}
		
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
			// let imageExists = await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail?dream.out.format=json", 'query');
			// if (!imageExists.ok)
			await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail", 'query', 'LibreBot', {
				method: "PUT",
				body: createStructure.image,
			});
		}
		
		console.log(`Created: ${path}`);
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
	
	async function reconcileLink(target, filename, key = `${filename}_id`, optionalSubkey) {
		let working = await fs.readJSON(`./JSON/webwork_OPL_${filename}.json`);
		working = arrayToObject(working, key);
		for (let [, value] of Object.entries(target)) {
			value[key] = working[value[key]];
			if (optionalSubkey)
				value[key] = value[key][optionalSubkey];
		}
	}
	
	function arrayToObject(array, key) {
		const result = {};
		array.forEach((item) => {
			result[item[key]] = item;
		});
		return result
	}
	
	async function reconcileStructure(parent, children) {
		let working = await fs.readJSON(`./JSON/webwork_OPL_DB${parent}.json`);
		working = arrayToObject(working, `DB${parent}_id`);
		for (let [, prob] of Object.entries(children)) {
			let target = working[prob[`DB${parent}_id`]];
			if (!target)
				continue;
			
			if (target.children && target.children.length)
				target.children.push(prob);
			else
				target.children = [prob];
			
		}
		return working;
	}
	
}