if (!window["batchPrint.js"]) {
	window["batchPrint.js"] = true;
	const isAdmin = document.getElementById("adminHolder").innerText === 'true';
	const isPro = document.getElementById("proHolder").innerText === 'true';
	const groups = document.getElementById("groupHolder").innerText;
	const tags = JSON.parse(document.getElementById("tagsHolder").innerText.replace(/\\'/g, '\''));
	let batchAccess = isAdmin || (isPro && groups.includes('BatchAccess'));
	let request;
	let requestJSON;
	let bookstore = tags.find(elem => elem.startsWith('bookstore:'));
	
	let fn = () => {
		const [subdomain, path] = LibreTexts.parseURL();
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
		localStorage.removeItem('PDFSize');
		
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
				if (downloads.items)
					downloads = downloads.items;
				
				let id = document.getElementById('pageIDHolder').innerText;
				downloadEntry = downloads.find((entry) => entry.id === id || entry.altID === id);
				if (!isPro && downloadEntry.tags.includes('luluPro'))
					downloadEntry = false;
			}
			let innerHTML = `<div id="PrintDropdown" class="LTdropdown" style="float:right; background-color: #c53030"><a id="printme" class="dropbtn material-icons notSS" href="https://batch.libretexts.org/print/url=${window.location}.pdf" target="_blank" title="Get a PDF of this page" type="application/pdf">picture_as_pdf</a>`;
			const isChapter = !downloadEntry && tags.includes('"article:topic-guide"');
			innerHTML += `<div class="LTdropdown-content">
					<a href="${await getBook()}"  target="_blank" title="Get a PDF of this Book" type="application/pdf" rel="nofollow">Full Book</a>
					${isChapter ? `<a onclick="event.preventDefault(); batch()" href='#' target="_blank" title="Get a PDF of this Chapter" type="application/pdf" rel="nofollow">Chapter</a>` : ``}
					${tags.includes('"article:topic"') ? `<a href="https://batch.libretexts.org/print/url=${window.location}.pdf"  target="_blank" title="Get a PDF of this page" type="application/pdf">Page</a>` : ``}
					${batchAccess ? `<a onclick = "event.preventDefault(); batch()" href='#' class='mt-icon-spinner6' rel="nofollow">Compile</a>` : ''}
					${batchAccess && downloadEntry ? `<a onclick = "event.preventDefault(); if (confirm('This will refresh all of the pages and will take quite a while. Are you sure?'))batch(window.location.href)" href='#' class='mt-icon-spinner6'>Compile Full</a>` : ''}

				</div></div>`;
			
			innerHTML += `<div class="LTdropdown" style="float:left; background-color: #d4d4d4; color:black" onclick="setTimeout(()=>$('#openControl').click(),100)"><div id="doBeeLine" class="dropbtn mt-icon-binoculars" title="Customization Menu"><span style="margin-left: 5px">Readability</span></div>`;
			
			if (downloadEntry) {
				let root = `https://batch.libretexts.org/print/Finished/`;
				if (downloadEntry.zipFilename)
					root += downloadEntry.zipFilename.replace('/Full.pdf', '');
				innerHTML += '<div id="DownloadsDropdown" class="LTdropdown"  style="float:right; background-color: #0c85d0"><div class="dropbtn" title="Downloads Center"><span>Downloads</span></div></div>';
				innerHTML += `<div class="LTdropdown-content">
					<a href='${root}/Full.pdf' class='mt-icon-file-pdf'
					   target='_blank'>Full PDF</a>
					<a href='${root}/LibreText.imscc' class='mt-icon-graduation'
					   target='_blank'>Import into LMS</a>
					<a href='${root}/Individual.zip' class='mt-icon-file-zip'
					   target='_blank'>Individual ZIP</a>
					<a href='https://libretexts.org/bookstore/single.html?${downloadEntry.zipFilename}' class='mt-icon-cart2' target='_blank'>Buy Paper Copy</a>
					<a href='${root}/Publication.zip' class='mt-icon-book3'
					   target='_blank'>Print Book Files</a>
				</div></div>`;
			}
			
			if (batchPrint)
				batchPrint.innerHTML = innerHTML;
			let getTOCLink = document.getElementById("getTOCLink");
			if (getTOCLink) {
				getTOCLink.rel = "nofollow";
				getTOCLink.href = `https://batch.libretexts.org/print/toc=${url}`;
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
			window.open(`https://batch.libretexts.org/print/cover=${target}&options={"numPages":"${number}", "hasExtraPadding":true}`);
		}
		else {
			alert(`${number} is not recognized as a number. Please try again.`);
		}
	}
	
	// noinspection ES6ConvertVarToLetConst
	var batch = (target, additionalParameters = '') => {
		if (window["batchComplete"]) {
			window.location = window["batchComplete"];
		}
		else {
			request.open("GET", `https://batch.libretexts.org/print/Libretext=${target ? `${target}?no-cache${additionalParameters}` : window.location.href}`, true); //async get
			request.addEventListener("progress", receive);
			request.addEventListener("load", download);
			request.send();
			const batchButton = document.getElementById("printme");
			batchButton.classList.remove('material-icons')
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
				if(out.filename) {
					batchButton.innerText = "Redownload";
					window.location = `https://batch.libretexts.org/print/Finished/${out.filename}/Full.pdf`;
					window["batchComplete"] = `https://batch.libretexts.org/print/Finished/${out.filename}/Full.pdf`;
					
					let tags = document.getElementById('pageTagsHolder').innerText;
					if (tags.includes('coverpage:yes'))
						setTimeout(() => window.location.reload(), 5000);
				}
			}
		}
		
	};
	
	async function getBook() {
		let coverpage = await LibreTexts.getCoverpage();
		if (coverpage) {
			let [subdomain] = LibreTexts.parseURL();
			coverpage = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${coverpage}`);
			return `https://batch.libretexts.org/print/Finished/${subdomain}-${coverpage.id}/Full.pdf`;
		}
		return '#'
	}
	
	window.addEventListener('load', fn);
}