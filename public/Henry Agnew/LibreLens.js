(function () {
	window.addEventListener('load', () => {
		if (!LibreTexts.active.libreLens) {
			LibreTexts.active.libreLens = (activate = true, showIframes) => {
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
				
				for (let cls of classes) {
					const r = Math.floor(Math.random() * 256);
					const g = Math.floor(Math.random() * 256);
					const b = Math.floor(Math.random() * 256);
					
					const backgroundColor = activate ? `rgba(${r},${g},${b},0.2)` : 'unset';
					const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
					
					document.getElementsByClassName(cls).forEach(item => item.style.backgroundColor = backgroundColor);
					const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`
					if (activate)
						LibreTexts.active.libreLens.tippyInstances = LibreTexts.active.libreLens.tippyInstances.concat(
							tippy(`.${cls}`, {
								content: `<a href="${pageURL}" target="_blank">From ${cls}</a>`,
								interactive: true,
								allowHTML: true,
								async onShow(instance) {
									if (!loadedPages[cls])
										await LibreTexts.getAPI(pageURL, true)
											.then(data => {
												const [currentSubdomain, currentPath] = LibreTexts.parseURL();
												if (data.subdomain === currentSubdomain && data.path === currentPath)
													data.currentPage = true;
												
												console.log(data);
												loadedPages[cls] = data;
											})
									const data = loadedPages[cls];
									let content = `From ${data.currentPage ? '<b>current page</b>' : `<b>${data.title}</b><br/><i>(${data.subdomain}-${data.id})`}</i>`
									
									let license = data.tags.find(tag => tag.startsWith('license:'))
									if (license) {
										license = license.split('license:')[1];
										content += `&nbsp;[Licensed ${license}]`;
									}
									if (showIframes) {
										content += `<iframe src="${pageURL}"/>`
									}
									
									instance.setContent(`<a href="${pageURL}" target="_blank">${content}</a>`);
								}
							}));
				}
			}
			LibreTexts.active.libreLens();
			
		}
	})
})()
