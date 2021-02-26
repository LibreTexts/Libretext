(function () {
    window.addEventListener('load', () => {
            if (!LibreTexts.active.libreLens) {
                LibreTexts.active.libreLens = async (forceState) => {
                    LibreTexts.active.libreLens.activated = forceState ?? !LibreTexts.active.libreLens.activated;
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
                    let loadedPages = LibreTexts.active.libreLens.loadedPages || {};
                    let loadedAuthors = LibreTexts.active.libreLens.loadedAuthors || {};
                    
                    async function getPage(cls) {
                        if (!loadedPages[cls] || !loadedPages[cls].id) {
                            const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
                            const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`;
                            let data = await LibreTexts.getAPI(pageURL, true); //TODO add page does not exist handling
                            const [currentSubdomain, currentPath] = LibreTexts.parseURL();
                            if (data.subdomain === currentSubdomain && data.path === currentPath)
                                data.currentPage = true;
                            data.backgroundColor = loadedPages[cls].backgroundColor;
                            
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
                                data.author = author;
                            }
                            
                            
                            let license = data.tags.find(tag => tag.startsWith('license:'));
                            if (license) {
                                license = getCC(license);
                                data.license = license;
                            }
                            
                            console.log(data);
                            loadedPages[cls] = data;
                        }
                        return loadedPages[cls];
                    }
                    
                    for (let cls of classes) {
                        const r = Math.floor(Math.random() * 256);
                        const g = Math.floor(Math.random() * 256);
                        const b = Math.floor(Math.random() * 256);
                        
                        const backgroundColor = activated ? `rgba(${r},${g},${b},0.3)` : 'unset';
                        const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
                        if (!loadedPages[cls])
                            loadedPages[cls] = {};
                        loadedPages[cls].backgroundColor = backgroundColor;
                        
                        document.getElementsByClassName(cls).forEach(item => item.style.backgroundColor = backgroundColor);
                        const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`;
                        
                        const button = document.getElementById('librelens-button');
                        if (button) {
                            button.classList.toggle("mt-icon-eye", activated);
                            button.classList.toggle("mt-icon-eye-blocked", !activated);
                        }
                        
                        if (activated) {
                            LibreTexts.active.libreLens.tippyInstances = LibreTexts.active.libreLens.tippyInstances.concat(tippy(`.${cls}`, {
                                content: `<a href="${pageURL}" target="_blank">From ${cls}</a>`,
                                interactive: true,
                                allowHTML: true,
                                async onShow(instance) {
                                    const data = await getPage(cls);
                                    
                                    let content = `From ${data.currentPage ? '<b>current page</b>' : `<b class="mt-icon-link">${data.title}</b>`}`;
                                    
                                    let license = data.tags.find(tag => tag.startsWith('license:'));
                                    if (data.author) {
                                        content += ` by ${data.author}`;
                                    }
                                    if (data.license) {
                                        content += `<br/>[Licensed <a href="${data.license.link}" target="_blank">${data.license.title}</a>]`;
                                    }
                                    // content += `<iframe src="${pageURL}"/>`
                                    content += `<i> (${data.subdomain}-${data.id})</i>`
                                    
                                    instance.setContent(`<a href="${pageURL}" target="_blank">${content}</a>`);
                                }
                            }));
                        }
                    }
                    
                    const summary = document.getElementById('librelens-list');
                    let attribution = document.getElementById('librelens-attribution-list');
                    if (!attribution) {
                        $('.mt-content-container').append('<div id="librelens-attribution-list"/>');
                        attribution = document.getElementById('librelens-attribution-list');
                    }
                    
                    
                    const summaryContents = [];
                    const attributionContents = [];
                    for (let loadedPagesKey in loadedPages) {
                        const length = document.getElementsByClassName(loadedPagesKey).length;
                        loadedPages[loadedPagesKey] = await getPage(loadedPagesKey);
                        summaryContents.push(`<li style="background-color: ${loadedPages[loadedPagesKey].backgroundColor}">${loadedPagesKey}: ${length} lines</li>`);
                        attributionContents.push(`<li style="background-color: ${loadedPages[loadedPagesKey].backgroundColor}">${loadedPagesKey}: ${length} lines</li>`);
                    }
                    attribution.innerHTML = `<ul>${attributionContents.join('')}</ul>`
                    if (activated) {
                        summary.innerHTML = `<ul>${summaryContents.join('')}</ul>`
                    }
                    else if (summary)
                        summary.innerHTML = '';
                    
                    LibreTexts.active.libreLens.loadedPages = loadedPages;
                    LibreTexts.active.libreLens.loadedAuthors = loadedAuthors;
                }
            }
            LibreTexts.active.libreLens(false);
            $('.mt-content-container').append('<a onClick="event.preventDefault(); LibreTexts.active.libreLens()" target="_blank" className="mt-icon-eye">&nbsp;Toggle LibreLens</a>');
            
        }
    )
})()
