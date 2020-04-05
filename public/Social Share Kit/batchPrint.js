if (!window["batchPrint.js"]) {
	window["batchPrint.js"] = true;
	const isAdmin = document.getElementById("adminHolder").innerText === 'true';
	const isPro = document.getElementById("proHolder").innerText === 'true';
	const groups = document.getElementById("groupHolder").innerText;
	const tags = JSON.parse(document.getElementById("tagsHolder").innerText.replace(/\\'/g, '\''));
	let batchAccess = isAdmin || (isPro && groups.includes('BatchAccess'));
	const targetComputer = 'batch.libretexts.org';
	let request;
	let requestJSON;
	let bookstore = tags.find(elem => elem.startsWith('store:'));
	
	let fn = () => {
		request = new XMLHttpRequest();
		requestJSON = {
			root: window.location.href,
			batchName: window["BatchName"],
			isNoCache: false
		};
		
		const batchPrint = document.getElementById("batchPrint");
		
		if (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === undefined)
			localStorage.setItem('darkMode', true);
		if (localStorage.getItem('darkMode') === 'true')
			$('.elm-skin-container').addClass('darkMode');
		
		handleInner().then();
		
		async function handleInner() {
			//Download widget handling
			let tags = document.getElementById('pageTagsHolder').innerText;
			let downloads = [];
			let downloadEntry = false;
			let url = window.location.href.replace(/#$/, '');
			if (tags.includes('coverpage:yes')) {
				
				let subdomain = window.location.origin.split("/")[2].split(".")[0];
				let part = subdomain === 'espanol' ? 'home' : window.location.href.includes('/Courses') ? 'Courses' : 'Bookshelves';
				
				downloads = await fetch(`https://api.libretexts.org/DownloadsCenter/${subdomain}/${part}.json`);
				downloads = await downloads.json();
				if(downloads.items)
					downloads = downloads.items;
				
				let id = document.getElementById('pageIDHolder').innerText;
				downloadEntry = downloads.find((entry) => entry.id === id || entry.altID === id);
				if (!isPro && downloadEntry.tags.includes('luluPro'))
					downloadEntry = false;
			}
			let innerHTML = `<div id="PrintDropdown" class="LTdropdown" style="float:right; background-color: #c53030"><a id="printme" class="dropbtn material-icons notSS" href="https://batch.libretexts.org/print/${localStorage.getItem('PDFSize') === 'A4' ? 'A4' : 'Letter'}/url=${window.location}.pdf" target="_blank" title="Get a PDF of this page" type="application/pdf">picture_as_pdf</a>`;
			innerHTML += `<div class="LTdropdown-content">
					<a onclick = "localStorage.setItem('PDFSize','Letter')" href="https://batch.libretexts.org/print/Letter/url=${window.location}.pdf"  target="_blank" title="Get a Letter PDF of this page" type="application/pdf">Letter</a>
					<a onclick = "localStorage.setItem('PDFSize','A4')" href="https://batch.libretexts.org/print/A4/url=${window.location}.pdf" target="_blank" title="Get an A4 PDF of this page" type="application/pdf">A4</a>
				</div></div>`;
			
			if (batchAccess && !document.getElementById('tagsHolder').innerText.includes('"article:topic"')) {
				// $('#pageNumberHolder').append(`<div>Hello ${email}!</div>`);
				innerHTML += '<button id="batchButton" onclick="batch()" style="margin-right: 2px"><span>Compile</span></button>';
			}
			if (downloadEntry) {
				if (bookstore)
					bookstore = bookstore.split('store:')[1];
				
				
				let root = `https://batch.libretexts.org/print/Letter/Finished/`;
				if (downloadEntry.zipFilename)
					root += downloadEntry.zipFilename.replace('/Full.pdf', '');
				innerHTML += '<div id="DownloadsDropdown" class="LTdropdown"  style="float:right; background-color: #0c85d0"><div class="dropbtn" title="Downloads Center"><span>Downloads</span></div>';
				innerHTML += `<div class="LTdropdown-content">
					<a href='${root}/Full.pdf' class='mt-icon-file-pdf'
					   target='_blank'>Full PDF</a>
					<a href='${root}/LibreText.imscc' class='mt-icon-graduation'
					   target='_blank'>Import into LMS</a>
					${batchAccess ? `<a onclick = "event.preventDefault(); if (confirm('This will refresh all of the pages and will take quite a while. Are you sure?'))batch(window.location.href)" href='#' class='mt-icon-spinner6'>Compile Full</a>` : ''}
					<a href='${root}/Individual.zip' class='mt-icon-file-zip'
					   target='_blank'>Individual ZIP</a>
					${bookstore ? `<a href='${bookstore}' class='mt-icon-cart2' target='_blank'>Buy Paper Copy</a>` : ''}
					<a href='${root}/Publication.zip' class='mt-icon-book3'
					   target='_blank'>Print Book Files</a>
				</div></div>`;
			}
			
			//Beeline
			if (window.beelineEnabled) {
				innerHTML += `<div class="LTdropdown beeline-toggles" style="float:left; background-color: #d4d4d4; color:black"><div id="doBeeLine" class="dropbtn mt-icon-binoculars" title="Customization Menu"><span style="margin-left: 5px">Readability</span></div><div class="LTdropdown-content" style="right: 0">`;
				innerHTML += `<a class="btn btn-large" style="display: flex" href="http://www.beelinereader.com/education/?utm_source=libretexts" target="_blank"
title="BeeLine helps you read on screen more easily by using a color gradient that pulls your eyes through the text. Try out the color schemes to find your favorite to use on LibreTexts. Be sure to check out BeeLine's apps and plugins, so you can read PDFs, Kindle books, and websites more easily!">
<img style="margin-right: 5px; width:25px; height: 25px" src="https://awesomefiles.libretexts.org/Students/Henry Agnew/BeeLine/beeline-logo.png">About BeeLine</a>`;
				innerHTML += `<a class="btn btn-large" data-color="bright">Bright</a>`;
				innerHTML += `<a class="btn btn-large" data-color="dark">Dark</a>`;
				innerHTML += `<a class="btn btn-large" data-color="blues">Blues</a>`;
				innerHTML += `<a class="btn btn-large" data-color="gray">Gray</a>`;
				innerHTML += `<a class="btn btn-large" data-color="night_blues">Inverted</a>`;
				innerHTML += `<a class="btn btn-large active" data-color="off">Off</a>`;
				innerHTML += `<a class="btn btn-large" onclick="$('.elm-skin-container').toggleClass('darkMode'); localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true')">Dark Mode Toggle</a>`;
				innerHTML += `</div></div>`;
			}
			
			if (isPro) {
				innerHTML += `<div class="LTdropdown"  style="float:left; background-color: darkorange"><div class="dropbtn" title="Developers Menu"><span>Developers</span></div><div class="LTdropdown-content" style="right: 0">`;
				innerHTML += `<a onclick = "event.preventDefault(); cover(window.location.href)" href='#' class='mt-icon-book'>Get Cover</a>`;
				innerHTML += `<a href="/Under_Construction/Sandboxes/Henry/Get_Contents?${document.getElementById('IDHolder').innerText}" class="notSS mt-icon-edit-page" target="_blank">Get Contents</a>`;
				innerHTML += `<a onclick = "event.preventDefault(); buildcite()" href='#' class='mt-icon-quote'>Get Citation</a>`;
				innerHTML += `<a onclick = "event.preventDefault(); $('dd').show();" href='#' class='mt-icon-eye3'>Reveal Answers</a>`;
				innerHTML += `<a onclick = "event.preventDefault(); LibreTexts.authenticatedFetch(null,'unorder',null,{method:'PUT'}); window.location.reload()" href='#' class='mt-icon-shuffle'>Unorder Page</a>`;
				innerHTML += `</div></div>`;
			}
			else {
				
			}
			
			batchPrint.innerHTML = innerHTML;
			let getTOCLink = document.getElementById("getTOCLink");
			if (getTOCLink) {
				getTOCLink.rel = "nofollow";
				getTOCLink.href = `https://batch.libretexts.org/print/Letter/toc=${url}`;
			}
		}
	};
	
	function getChildren(HTML) {
		let JSON = {};
		if (HTML.children[1]) {
			HTML = HTML.children[1].children;
			
			for (let i = 0; i < HTML.length; i++) {
				let link = HTML[i].children[0];
				JSON[link.textContent] = {link: link.href, children: getChildren(HTML[i])};
			}
		}
		return JSON;
	}
	
	function cover(target) {
		let number = prompt('Number of content pages:');
		if (number && !isNaN(number)) {
			window.open(`https://batch.libretexts.org/print/Letter/cover=${target}&options={"numPages":"${number}", "hasExtraPadding":true}`);
		}
		else {
			alert(`${number} is not recognized as a number. Please try again.`);
		}
	}
	
	// noinspection ES6ConvertVarToLetConst
	var batch = (target) => {
		if (!batchAccess) {
			alert('Authorization Error');
			return false;
		}
		if (window["batchComplete"]) {
			window.location = window["batchComplete"];
		}
		else {
			request.open("GET", `https://${targetComputer}/print/Letter/Libretext=${target ? `${target}?no-cache` : window.location.href}`, true); //async get
			request.addEventListener("progress", receive);
			request.addEventListener("load", download);
			request.send();
			const batchButton = document.getElementById("batchButton");
			batchButton.innerText = 'Request sent...';
			
			
			function receive() {
				let newText = this.responseText;
				// console.log(newText);
				newText = newText.match(/^{.+}$(?!\s*^.*}$)/m);
				if (newText) {
					console.log(newText[0]);
					const json = JSON.parse(newText[0]);
					batchButton.innerText = json.percent + "%" + "\n" + json.eta;
				}
			}
			
			function download() {
				let newText = this.responseText.match(/^{.+}$(?!\s*^.*}$)/m)[0];
				const out = JSON.parse(newText);
				if (out.filename === 'refreshOnly') {
					batchButton.innerText = "Refresh complete";
					return;
				}
				if (out.message === 'error') {
					alert(out.text);
					return;
				}
				batchButton.innerText = "Redownload";
				window.location = `https://${targetComputer}/print/Letter/Finished/${out.filename}/Full.pdf`;
				window["batchComplete"] = `https://${targetComputer}/print/Letter/Finished/${out.filename}/Full.pdf`;
				setTimeout(()=>window.location.reload(), 5000);
				
			}
		}
		
	};
	
	document.addEventListener('DOMContentLoaded', fn);
}