(function () {
  if (navigator.webdriver || window.matchMedia('print').matches) {
    return; // exit if not client-facing
  }
  window.addEventListener('load', () => {
    if (!LibreTexts.active.libreLens) {
      LibreTexts.active.libreLens = async (forceState) => {
        const shouldActivate = forceState ?? !LibreTexts.active.libreLens.activated;
        LibreTexts.active.libreLens.activated = shouldActivate;
        const { activated } = LibreTexts.active.libreLens;
        const classes = [];
        if (!LibreTexts.active.libreLens.tippyInstances) {
          LibreTexts.active.libreLens.tippyInstances = [];
        }
        if (Array.isArray(LibreTexts.active?.libreLens?.tippyInstances)) {
          for (let i = 0, n = LibreTexts.active.libreLens.tippyInstances.length; i < n; i += 1) {
            const instance = LibreTexts.active.libreLens.tippyInstances[i];
            if (typeof (instance.destroy) === 'function') instance.destroy();
          }
          LibreTexts.active.libreLens.tippyInstances = [];
        }
        $('[class]').each((_idx, elem) => {
          $.each($(elem).attr('class').split(' '), (_i, className) => {
            if (className.length && $.inArray(className, classes) === -1 && className.startsWith('lt-')) {
              classes.push(className);
            }
          });
        });
        const loadedPages = LibreTexts.active.libreLens.loadedPages || {};
        const loadedAuthors = LibreTexts.active.libreLens.loadedAuthors || {};
        let outsidePages = 0;

        /**
         * Retrieves page information from the LibreTexts API given a source identifier.
         *
         * @param {string} cls - The class name identifying the page to work on.
         * @returns {object} An object containing page information.
         */
        async function getPage(cls) {
          if (!loadedPages[cls] || (!loadedPages[cls].error && !loadedPages[cls].id)) {
            const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
            const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`;
            const data = await LibreTexts.getAPI(pageURL, true);
            if (data.error) { // page not found
              loadedPages[cls] = data;
              return data;
            }

            const [currentSubdomain] = LibreTexts.parseURL();
            if (data.subdomain === currentSubdomain && pageID === document.getElementById('IDHolder').innerText) {
              data.currentPage = true;
            } else {
              outsidePages += 1;
            }
            data.backgroundColor = loadedPages[cls].backgroundColor;

            let author = data.tags.find((tag) => tag.startsWith('authorname:'));
            const sourceAuthors = data.tags.filter((tag) => tag.startsWith('author@'));
            if (author) {
              author = author.replace('authorname:', '');

              if (!loadedAuthors[data.subdomain]) {
                const authors = await fetch(`https://api.libretexts.org/endpoint/getAuthors/${data.subdomain}`, { headers: { origin: 'print.libretexts.org' } });
                loadedAuthors[data.subdomain] = await authors.json();
              }

              author = loadedAuthors[data.subdomain][author];
              data.author = author;
            }
            if (sourceAuthors.length > 0) {
              const authorOverrides = [];
              sourceAuthors.forEach((authorTag) => {
                const authorOvrdParts = authorTag.split('@');
                if (authorOvrdParts.length > 1) {
                  authorOverrides.push(authorOvrdParts[1]);
                }
              });
              if (authorOverrides.length > 0) {
                data.author = { name: authorOverrides.join(', ') };
              }
            }

            let license = data.tags.find((tag) => tag.startsWith('license:'));
            let licenseVersion = data.tags.find((tag) => tag.startsWith('licenseversion:'));
            if (licenseVersion && licenseVersion.split(':').length > 1) {
              [, licenseVersion] = licenseVersion.split(':'); // extract version
            }
            if (license) {
              let licenseIdentifier = license;
              if (typeof (licenseVersion) === 'string' && licenseVersion.length === 2) {
                licenseIdentifier = `${license}@${licenseVersion}`;
              }
              license = getCC(licenseIdentifier);
              data.license = license;
            }

            const sourceTag = data.tags.find((tag) => tag.startsWith('source@'));
            if (sourceTag) {
              const sourceParts = sourceTag.split('@');
              if (sourceParts.length > 1) {
                data.sourceURL = sourceParts.slice(1).join(''); // handle potential '@' in URL by combining leftovers
              }
            }

            let content = `<a href="${pageURL}" target="_blank" rel="noopener">${data.currentPage ? '<b>Current page</b>' : `<b>${data.title}</b>`}</a>`;

            if (data.author) {
              if (data.author.nameurl) {
                content += ` by <a id="attr-author-link" href="${data.author.nameurl}" rel="noopener">${data.author.name}</a>`;
              } else {
                content += ` by ${data.author.name}`;
              }
            } else {
              data.author = ' by <a href="https://libretexts.org/" rel="noopener">LibreTexts</a>';
            }

            if (data.license) {
              content += ` is licensed <a href="${data.license.link}" target="_blank" rel="noopener">${data.license.title}${data.license.version ? ` ${data.license.version}` : ''}</a>.`;
            } else {
              content += ' has no license indicated.';
            }

            if (data.sourceURL) {
              content += ` Original source: <a href="${data.sourceURL}" target="_blank" rel="noopener">${data.sourceURL}</a>.`;
            }

            // content += `<i> (${data.subdomain}-${data.id})</i>`
            data.content = content;

            // console.log(data);
            loadedPages[cls] = data;
          }
          return loadedPages[cls];
        }

        for (let i = 0, n = classes.length; i < n; i += 1) {
          const cls = classes[i];
          const r = Math.floor(Math.random() * 256);
          const g = Math.floor(Math.random() * 256);
          const b = Math.floor(Math.random() * 256);

          const backgroundColor = activated ? `rgba(${r},${g},${b},0.3)` : 'unset';
          const [, subdomain, pageID] = cls.match(/(?<=^lt-)(\w*?)-(\d*?)$/);
          if (!loadedPages[cls]) loadedPages[cls] = {};
          loadedPages[cls].backgroundColor = backgroundColor;

          document.getElementsByClassName(cls).forEach((item) => {
            // eslint-disable-next-line no-param-reassign
            item.style.backgroundColor = backgroundColor;
          });
          const pageURL = `https://${subdomain}.libretexts.org/@go/page/${pageID}`;

          if (activated) {
            LibreTexts.active.libreLens.tippyInstances = LibreTexts.active.libreLens.tippyInstances.concat(tippy(`.${cls}`, {
              content: `<a href="${pageURL}" target="_blank">From ${cls}</a>`,
              interactive: true,
              allowHTML: true,
              async onShow(instance) {
                const data = await getPage(cls);
                instance.setContent(data.error ? `From ${cls} [deleted]` : data.content);
              },
            }));
          }
        }

        const summary = document.getElementById('librelens-list');
        let attribution = document.getElementById('librelens-attribution-list');
        if (!attribution) {
          $('.mt-content-footer').append('<div id="librelens-attribution-list"/>');
          attribution = document.getElementById('librelens-attribution-list');
        }

        const summaryContents = [];
        const attributionContents = [];
        const ldPageKeys = Object.keys(loadedPages);
        for (let i = 0, n = ldPageKeys.length; i < n; i += 1) {
          const loadedPageKey = ldPageKeys[i];
          const { length } = document.getElementsByClassName(loadedPageKey);
          // eslint-disable-next-line no-await-in-loop
          loadedPages[loadedPageKey] = await getPage(loadedPageKey);
          // eslint-disable-next-line no-continue
          if (loadedPages[loadedPageKey].error) continue;

          summaryContents.push(`<li style="background-color: ${loadedPages[loadedPageKey].backgroundColor}">${loadedPageKey}: ${length} lines</li>`);
          attributionContents.push(`<li style="background-color: ${loadedPages[loadedPageKey].backgroundColor}">${loadedPages[loadedPageKey].content.replaceAll('<br/>', '  ')}</li>`);
        }

        if (outsidePages) {
          attribution.innerHTML += `<ul>${attributionContents.join('')}</ul>`;
          attribution.innerHTML += '<button onclick="LibreTexts.active.libreLens()" style="display:block;margin: 0 auto;"><span class="mt-icon-eye" style="vertical-align:middle;margin-right:5px;" aria-hidden="true"></span>Toggle block-level attributions</button>';
        } else {
          attribution.innerHTML = '';
          document.getElementsByClassName('librelens-toggle').forEach((el) => el.remove());
        }

        if (activated) summary.innerHTML = `<ul>${summaryContents.join('')}</ul>`;
        else if (summary) summary.innerHTML = '';
        LibreTexts.active.libreLens.loadedPages = loadedPages;
        LibreTexts.active.libreLens.loadedAuthors = loadedAuthors;
      };
      LibreTexts.active.libreLens(false);
    }
  });
}());
