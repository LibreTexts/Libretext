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
                    let outsidePages = 0;
                    
                    async function getPage(cls) {
                        
                        if (!loadedPages[cls] || (!loadedPages[cls].error && !loadedPages[cls].id)) {
                            const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
                            const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`;
                            let data = await LibreTexts.getAPI(pageURL, true);
                            if (data.error) { //page not found
                                loadedPages[cls] = data;
                                return data;
                            }
                            
                            const [currentSubdomain, currentPath] = LibreTexts.parseURL();
                            if (data.subdomain === currentSubdomain && pageID === document.getElementById('IDHolder').innerText)
                                data.currentPage = true;
                            else
                                outsidePages++;
                            data.backgroundColor = loadedPages[cls].backgroundColor;
                            
                            let author = data.tags.find(tag => tag.startsWith('authorname:'))
                            if (author) {
                                author = author.replace('authorname:', '');
                                
                                if (!loadedAuthors[data.subdomain]) {
                                    let authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${data.subdomain}`, {headers: {'origin': 'print.libretexts.org'}});
                                    loadedAuthors[data.subdomain] = await authors.json();
                                }
                                
                                author = loadedAuthors[data.subdomain][author];
                                data.author = author;
                            }
                            
                            
                            let license = data.tags.find(tag => tag.startsWith('license:'));
                            if (license) {
                                license = getCC(license);
                                data.license = license;
                            }
                            
                            let content = `<a href="${pageURL}" target="_blank">${data.currentPage ? '<b>Current page</b>' : `<b>${data.title}</b>`}</a>`;
                            
                            
                            if (data.author) {
                                content += ` by <a id="attr-author-link" href="${data.author.nameurl}">${data.author.name}</a>`;
                            }
                            else {
                                data.author = ` by <a href="https://libretexts.org/">LibreTexts</a>`
                            }
                            
                            
                            if (data.license) {
                                content += `,<br/>is licensed <a href="${data.license.link}" target="_blank">${data.license.title}</a>`;
                            }
                            else {
                                content += ' has no license indicated.';
                            }
                            // content += `<i> (${data.subdomain}-${data.id})</i>`
                            data.content = content;
                            
                            // console.log(data);
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
                        
                        const button = document.getElementsByClassName('librelens-toggle');
                        if (button && button.length) {
                            for (const b of button) {
                                b.classList.toggle("mt-icon-eye", activated);
                                b.classList.toggle("mt-icon-eye-blocked", !activated);
                            }
                        }
                        
                        if (activated) {
                            LibreTexts.active.libreLens.tippyInstances = LibreTexts.active.libreLens.tippyInstances.concat(tippy(`.${cls}`, {
                                content: `<a href="${pageURL}" target="_blank">From ${cls}</a>`,
                                interactive: true,
                                allowHTML: true,
                                async onShow(instance) {
                                    const data = await getPage(cls);
                                    instance.setContent(data.error ? `From ${cls} [deleted]` : data.content);
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
                        if (loadedPages[loadedPagesKey].error)
                            continue;
                        
                        summaryContents.push(`<li style="background-color: ${loadedPages[loadedPagesKey].backgroundColor}">${loadedPagesKey}: ${length} lines</li>`);
                        attributionContents.push(`<li style="background-color: ${loadedPages[loadedPagesKey].backgroundColor}">${loadedPages[loadedPagesKey].content.replaceAll('<br/>', '  ')}</li>`);
                    }
                    
                    let toggleButton = '';
                    attribution.innerHTML = `<h2>AutoAttribution</h2>`;
                    if (outsidePages) {
                        attribution.innerHTML += `<ul>${attributionContents.join('')}</ul>`;
                        toggleButton = `<button onclick="event.preventDefault(); LibreTexts.active.libreLens()" target="_blank" class="mt-icon-eye-blocked librelens-toggle">&nbsp;Toggle AutoAttribution</button>`;
                    }
                    /*else {
                        document.getElementsByClassName('librelens-toggle').forEach(el => el.remove());
                    }*/
                    attribution.innerHTML += `<div id="librelens-buttons" style="display: flex; justify-content: space-evenly"><button onclick = "event.preventDefault(); buildcite()" target="_blank"  class=\'mt-icon-quote\'>&nbsp;Get Page Citation</button><button onclick = "event.preventDefault(); attribution()" target="_blank" class=\'mt-icon-quote\'>&nbsp;Get Page Attribution</button>${toggleButton}</div>`;
                    
                    if (activated) {
                        summary.innerHTML = `<ul>${summaryContents.join('')}</ul>`
                    }
                    else if (summary)
                        summary.innerHTML = '';
                    
                    LibreTexts.active.libreLens.loadedPages = loadedPages;
                    LibreTexts.active.libreLens.loadedAuthors = loadedAuthors;
                }
                LibreTexts.active.libreLens(false);
            }
        }
    )
})()
