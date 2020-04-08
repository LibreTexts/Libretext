(function () {
	processContents();
	let indexExclusions = ["source", 'lulu', "@", "-"]; // Case insensitive
	let indexRequirements = [""]; // Case sensisitve  if ends with @, that tag will be trimmed, else it will be left as it(Can be entered here or in currentScript.dataset.filter, currentScript.dataset.filter takes priority)
	
	
	//main function
	async function processContents() {
		$(document.currentScript).after(`<div id="indexDiv"><p id="indexLetterList"></p><div id="indexTable"></div></div>`);
		if (document.currentScript.dataset && document.currentScript.dataset.filter) {
			indexRequirements = ((document.currentScript.dataset.filter.startsWith("[")) ? JSON.parse(document.currentScript.dataset.filter) : [document.currentScript.dataset.filter]);
		}
		let subdomain = window.location.origin.split('/')[2].split('.')[0];
		let coverPageInfo;
		
		const dynamicURL = await getIndexingURL();
		let url = `https://${subdomain}.libretexts.org/@api/deki/pages/=Template%253AMindTouch%252FIDF3%252FViews%252FTag_directory/contents?dream.out.format=json&pageid=${dynamicURL.id}`;
		let tag;
		
		
		if (url) {
			
			let headers = {
				'X-Requested-With': 'XMLHttpRequest'
			};
			
			let contents = await LibreTexts.authenticatedFetch(url, undefined, undefined,
				{headers: headers});
			if (contents.ok) {
				contents = await contents.json();
				
				contents = contents.body;
				//insert lots of code here to transform contents so that it looks like a textbook index
				let indexedJSON = pageIndexHTMLToJSON(contents);
				indexedJSON.taggedTerms = trimTermTag(indexedJSON.taggedTerms);
				indexedJSON.taggedTerms = sortTerms(indexedJSON.taggedTerms);
				jsonToHTMLTable(indexedJSON);
				
			}
			else {
				invalidLink(`Could not find Page ${url}.`);
			}
			
		}
		else {
			invalidLink(`URL ${url} is not a valid link!`);
		}
		
	}
	
	function pageIndexHTMLToJSON(inputString) {
		let pageList = {
			"untaggedTerms": [/*pages*/], //Contains only pages
			"taggedTerms": [/*terms*/]
		};
		
		/*  terms = {
				"name" : "",
				"pages" : [
					{
						"pageName" : "",
						"pageLink" : "",
					},
				],
			} */
		
		let receivedString = inputString;
		
		//"mt-listings-simple">
		
		//Find position of untagged
		//Separate untagged string
		let untaggedStartIdentifier = "<h5>(No tags)</h5>";
		let untaggedStart = receivedString.search(untaggedStartIdentifier);
		let untaggedEndIdentifier = "</ul></li></ul><ul";
		let untaggedEnd = receivedString.search(untaggedEndIdentifier);
		let untaggedString = receivedString.substring(untaggedStart, untaggedEnd);
		let cutString = untaggedString;
		let preURLString = '<a rel="custom nofollow" href="';
		let preTitleString = '" title="';
		let postTitleString = '"><span ';
		let termEndString = "</a></li>";
		while (cutString.length > 0) {
			//extract url and title
			let urlStart = cutString.search(preURLString) + preURLString.length;
			let urlEnd = cutString.search(preTitleString);
			//cutString = cutString.substring(urlStart + preURLString.length, cutString.length);
			let currentURL = cutString.substring(urlStart, urlEnd);
			cutString = cutString.substring(urlEnd + preTitleString.length, cutString.length);
			let titleEnd = cutString.search(postTitleString);
			let currentTitle = cutString.substring(0, titleEnd);
			let newPage = {
				"pageName": currentTitle,
				"pageLink": currentURL
			};
			pageList.untaggedTerms.push(newPage);
			
			let termEnd = cutString.search(termEndString);
			cutString = cutString.slice(termEnd + termEndString.length);
		}
		
		//Find position of tagged
		//Separate tagged string
		let taggedStartIdentifier = '<ul class="mt-tag-directory-listings mt-guide-listings">';
		let taggedStart = receivedString.search(taggedStartIdentifier);
		let taggedEndIdentifier = "</ul></div>";
		let taggedEnd = receivedString.search(taggedEndIdentifier);
		let taggedString = receivedString.substring(taggedStart, taggedEnd);
		let preTermName = '><h5>';
		let postTermName = '</h5>';
		let termCutString = taggedString;
		let firstLoopCheck = 0;
		while (termCutString.length > 0) { //loop through the different terms
			//Find the title of the term
			let termName = termCutString.substring(termCutString.search(preTermName) + preTermName.length, termCutString.search(postTermName));
			let newTerm = {
				"name": termName,
				"pages": [
					/* {
						"pageName" : "",
						"pageLink" : "",
					}, */
				],
			};
			//find index to precut termcutstring front and back
			let prePagelist = '<ul class="mt-listings-simple"><li><a';
			let postPagelist = '</a></li></ul></li>';
			let prePagelistPosition = termCutString.search(prePagelist);
			let postPagelistPosition = termCutString.search(postPagelist);
			
			let cutString = termCutString.substring(prePagelistPosition, postPagelistPosition + termEndString.length);
			//cut termCutString to prep for next loop
			while (cutString.length > 0) { //This adds pages to a given term after string is trimmed
				//extract url and title
				let urlStart = cutString.search(preURLString) + preURLString.length;
				let urlEnd = cutString.search(preTitleString);
				let currentURL = cutString.substring(urlStart, urlEnd);
				cutString = cutString.substring(urlEnd + preTitleString.length, cutString.length);
				let titleEnd = cutString.search(postTitleString);
				let currentTitle = cutString.substring(0, titleEnd);
				let newPage = {
					"pageName": currentTitle,
					"pageLink": currentURL
				};
				let termEnd = cutString.search(termEndString);
				cutString = cutString.slice(termEnd + termEndString.length);
				newTerm.pages.push(newPage);
				
			}
			
			//update termcutstring
			termCutString = termCutString.slice(postPagelistPosition + postPagelist.length);
			
			let canPush = true;
			//Filter term
			
			for (let e = 0; e < indexRequirements.length; e++) { // Inclusions
				if (canPush && newTerm.name.includes(indexRequirements[e])) { // if requirement is present, trim and continue check, if term is absent,
					if (indexRequirements[e].endsWith("@")) { // Trim the term name if filter ends with @
						newTerm.name = newTerm.name.replace(indexRequirements[e], "").trim();
					}
				}
				else { // stop checking
					canPush = false;
					break;
				}
			}
			
			for (let e = 0; e < indexExclusions.length; e++) { // Exclusions
				if (canPush && newTerm.name.toLowerCase().includes(indexExclusions[e])) { //Stop check if fails
					canPush = false;
					break;
				}
			}
			//Push new term
			if (canPush) {
				pageList.taggedTerms.push(newTerm);
			}
			
		}
		return pageList;
	}
	
	function trimTermTag(termList/*Array with Terms*/) { //Trims the, a , an from the start of the tag if present
		let newList = termList.slice();
		let articleStrings = ["a ", "an ", "the "];
		for (let i = 0; i < newList.length; i++) {
			for (let u = 0; u < articleStrings.length; u++) {
				if (newList[i].name.toLowerCase().startsWith(articleStrings[u])) {
					newList[i].name = newList[i].name.replace(articleStrings[u].length, "");
				}
			}
		}
		return newList;
	}
	
	
	function sortPage(pageList/*Array with Pages*/) {
		let newList = pageList.slice();
		newList.sort(function (a, b) {
			return ((a.pageName.toLowerCase() > b.pageName.toLowerCase()) ? 1 : -1)
		});
		return newList;
	}
	
	function sortTerms(termList/*Array with Pages*/) {
		let newList = termList.slice();
		newList.sort(function (a, b) {
			return ((a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
		});
		return newList;
	}
	
	async function getIndexingURL() {
		let results;
		const coverPage = await LibreTexts.getCoverpage();
		let [subdomain] = LibreTexts.parseURL();
		results = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverPage}`);
		return results;
	}
	
	function jsonToHTMLTable(inputPageList) {
		let pageList = inputPageList;
		//{
		//    "untaggedTerms" : [/*pages*/], //Contains only pages
		//    "taggedTerms" : [/*terms*/]
		//};
		
		/*  terms = {
			"name" : "",
			"pages" : [
				{
					"pageName" : "",
					"pageLink" : "",
				},
			],
		} */
		
		//sort terms alphabetically
		let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
		let alphabetisedIndex = [];
		
		let termPos = 0;
		for (let i = 0; i < alphabet.length; i++) {
			let indexLetterTerm = {"letter": alphabet[i], "terms": []};
			for (let u = termPos; u < pageList.taggedTerms.length; u++) {
				
				if (pageList.taggedTerms[u].name.toUpperCase().startsWith(alphabet[i])) { // Check if term is in letter
					
					indexLetterTerm["terms"].push(pageList.taggedTerms[u]);
					termPos++;
				}
				else {
					break;
				}
			}
			if (indexLetterTerm.terms.length !== 0) {
				alphabetisedIndex.push(indexLetterTerm);
			}
		}
		const $indexLetterList = $("#indexLetterList");
		const $indexTable = $("#indexTable").html("");
		//Terms sorted by alphabet
		for (let i = 0; i < alphabetisedIndex.length; i++) {
			$letterEntry = $(`<div class='letterDiv' id = 'letterDiv${alphabetisedIndex[i].letter}'></div>`).appendTo($indexTable);
			$letterHeader = $(`<h2  class = 'indexRowHeadCells' id = 'indexHeadRow${alphabetisedIndex[i].letter}' >${alphabetisedIndex[i].letter}</h2>`);
			const $indexBodyRow = $(`<div class = 'indexBodyRows' id = 'indexRow${alphabetisedIndex[i].letter}'></div>`).appendTo($letterEntry);
			
			//Create Bulleted List
			$indexLetterList.append((i != 0 ? " &bull; " : "") + `<a href = "#indexHeadRow${alphabetisedIndex[i].letter}">${alphabetisedIndex[i].letter}</a>`);
			//Populates body row per letter
			for (let u = 0; u < alphabetisedIndex[i].terms.length; u++) {
				let $termDiv = $("<div class = 'termDiv'></div>").appendTo($indexBodyRow);
				if (u === 0) {
					$termDiv.append($letterHeader);
				}
				
				
				let $termText = $(`<p>${alphabetisedIndex[i].terms[u].name}</p>`);
				let $pagesText = $(`<div class = "pagesTextDiv"></div>`);
				for (let j = 0; j < alphabetisedIndex[i].terms[u].pages.length; j++) {
					let pageToAdd = $(`<a></a>`).html(alphabetisedIndex[i].terms[u].pages[j].pageName).attr({
						"title": alphabetisedIndex[i].terms[u].pages[j].pageName,
						"href": alphabetisedIndex[i].terms[u].pages[j].pageLink,
						"class": "indexPages"
					});
					
					$pagesText.append(pageToAdd, `&#10; <br/>`);
				}
				$termDiv.append($termText, $pagesText);
			}
		}
	}
	
	function invalidLink(message) {
		console.error(message);
		alert(message);
	}
})();
