(function () {
	window.addEventListener('load', () => {
			if (!LibreTexts.active.libreLens) {
				LibreTexts.active.libreLens = (showIframes) => {
					LibreTexts.active.libreLens.activated = !LibreTexts.active.libreLens.activated;
					const activated = LibreTexts.active.libreLens.activated;
					const classes = [];
					if (!LibreTexts.active.libreLens.tippyInstances)
						LibreTexts.active.libreLens.tippyInstances = [];
					for (const instance of LibreTexts.active.libreLens.tippyInstances) {
						instance.destroy();
						LibreTexts.active.libreLens.tippyInstances = [];
					}
					$('[class]').each(function () {
						$.each($(this).attr('class').split(' '), function (i, className) {
							if (className.length && $.inArray(className, classes) === -1 && className.startsWith('lt-')) {
								classes.push(className);
							}
						});
					});
					let loadedPages = {};
					let loadedAuthors = {};
					
					for (let cls of classes) {
						const r = Math.floor(Math.random() * 256);
						const g = Math.floor(Math.random() * 256);
						const b = Math.floor(Math.random() * 256);
						
						const backgroundColor = activated ? `rgba(${r},${g},${b},0.3)` : 'unset';
						const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
						loadedPages[cls] = {};
						loadedPages[cls].backgroundColor = backgroundColor;
						
						document.getElementsByClassName(cls).forEach(item => item.style.backgroundColor = backgroundColor);
						const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`;
						
						const button = document.getElementById('librelens-button');
						button.classList.toggle("mt-icon-eye");
						button.classList.toggle("mt-icon-eye-blocked");
						const button1 = document.getElementById('librelens-button-2');
						button1.classList.toggle("mt-icon-eye");
						button1.classList.toggle("mt-icon-eye-blocked");
						
						if (activated) {
							LibreTexts.active.libreLens.tippyInstances = LibreTexts.active.libreLens.tippyInstances.concat(tippy(`.${cls}`, {
								content: `<a href="${pageURL}" target="_blank">From ${cls}</a>`,
								interactive: true,
								allowHTML: true,
								async onShow(instance) {
									if (!loadedPages[cls] || !loadedPages[cls].id)
										await LibreTexts.getAPI(pageURL, true)
											.then(data => {
												const [currentSubdomain, currentPath] = LibreTexts.parseURL();
												if (data.subdomain === currentSubdomain && data.path === currentPath)
													data.currentPage = true;
												data.backgroundColor = loadedPages[cls].backgroundColor;
												console.log(data);
												loadedPages[cls] = data;
											})
									const data = loadedPages[cls];
									
									
									let author = data.tags.find(tag => tag.startsWith('authorname:'))
									
									if (author) {
										author = author.replace('authorname:', '');
										
										if (!loadedAuthors[data.subdomain]) {
											let authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${data.subdomain}`, {headers: {'origin': 'print.libretexts.org'}});
											loadedAuthors[data.subdomain] = await authors.json();
										}
										
										author = loadedAuthors[data.subdomain][author];
										if (author)
											author = author.name;
									}
									
									let content = `From ${data.currentPage ? '<b>current page</b>' : `<b class="mt-icon-link">${data.title}</b>`}`;
									
									let license = data.tags.find(tag => tag.startsWith('license:'));
									if (author) {
										content += ` by ${author}`;
									}
									if (license) {
										license = license.split('license:')[1];
										content += `<br/>[Licensed ${license}]`;
									}
									// content += `<iframe src="${pageURL}"/>`
									content += `<i> (${data.subdomain}-${data.id})</i>`
									
									instance.setContent(`<a href="${pageURL}" target="_blank">${content}</a>`);
								}
							}));
						}
					}
					
					const summary = document.getElementById('librelens-list');
					if (activated) {
						const summaryContents = [];
						for (let loadedPagesKey in loadedPages) {
							const length = document.getElementsByClassName(loadedPagesKey).length;
							summaryContents.push(`<li style="background-color: ${loadedPages[loadedPagesKey].backgroundColor}">${loadedPagesKey}: ${length} lines</li>`);
						}
						summary.innerHTML = `<ul>${summaryContents.join('')}</ul>`
					}
					else
					summary.innerHTML = '';
				}
				LibreTexts.active.libreLens.active = false;
			}
			LibreTexts.active.libreLens();
			
		}
	)
})()
