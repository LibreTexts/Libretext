/**
 * @file Defines methods to retrieve and present a Content Licensing Report for a book.
 * @author LibreTexts <info@libretexts.org>
 */

/**
 * @typedef {object} LicenseInfo
 * @property {string} label - The UI-ready license name.
 * @property {string} link - A link to information about the license, or '#'.
 * @property {string} raw - The internal license identifier/name.
 * @property {string} [version] - The license version, if a Creative Commons license.
 */

/**
 * @typedef {object} PageInfo
 * @property {string} id - The page's (library-scoped) unique identifier.
 * @property {string} url - The page's live URL.
 * @property {string} title - The UI-ready page title.
 * @property {LicenseInfo} [license=null] - The page's license information.
 * @property {PageInfo[]} [children] - The page's hierarchical children.
 */

/**
 * Builds the presentable Licensing Report given data from the server and attaches it to
 * a pre-existing container element.
 *
 * @param {object} report - The licensing data gathered by the server.
 * @param {HTMLElement} - The DOM element to insert the report into.
 * @returns {boolean} True if render succeeded, false otherwise.
 */
function buildHTML(report, containerRef) {
  const container = containerRef;

  /**
   * Recursively creates an HTML string containing a list of page hierarchy license information.
   *
   * @param {PageInfo} pageObject - The page hierarchy to build from.
   * @returns {string} An HTML string of the license information list.
   */
  function recurseOutput(pageObject) {
    let newString = `<li><a href="${pageObject.url}" target="_blank">${pageObject.title}</a>`;
    if (pageObject.license) {
      newString = `
        ${newString} - <a href="${pageObject.license?.link}" target="_blank" rel="noreferrer">
          <em>${pageObject.license?.label} ${pageObject.license?.version || ''}</em>
        </a>
      `;
    }
    if (Array.isArray(pageObject.children) && pageObject.children.length > 0) {
      newString = `${newString}<ul>`;
      for (let i = 0, n = pageObject.children.length; i < n; i += 1) {
        newString = `${newString}${recurseOutput(pageObject.children[i])}`;
      }
      newString = `${newString}</ul>`;
    }
    newString = `${newString}</li>`;
    return newString;
  }

  let reportHTML = `
    <h2>Overview</h2>
    <p><strong>Title:</strong> <a href="${report.text.url}" target="_blank" rel="noreferrer">${report.text.title}</a></p>
    <p><strong>Webpages:</strong> ${report.text.totalPages}</p>
  `;

  const specialRestrictions = report.meta.specialRestrictions.map((item) => {
    if (item === 'noncommercial') {
      return 'Noncommercial';
    }
    if (item === 'noderivatives') {
      return 'No Derivatives';
    }
    if (item === 'fairuse') {
      return 'Fair Use';
    }
    return null;
  }).filter((item) => item !== null);
  if (specialRestrictions.length > 0) {
    reportHTML = `
      ${reportHTML}
      <p><strong>Applicable Restrictions:</strong> ${specialRestrictions.join(', ')}</p>
    `;
  }

  reportHTML = `${reportHTML}<p><strong>All licenses found:</strong></p>`;

  let licensesList = '<ul>';
  report.meta.licenses.forEach((item) => {
    licensesList = `${licensesList}<li><a href="${item.link}" target="_blank" rel="noreferrer">${item.label}`;
    if (item.version) {
      licensesList = `${licensesList} ${item.version}`;
    }
    const pagesModifier = item.count > 1 ? 'pages' : 'page';
    licensesList = `${licensesList}</a>: ${item.percent}% (${item.count} ${pagesModifier})</a></li>`;
  });
  reportHTML = `${reportHTML}${licensesList}</ul>`;

  reportHTML = `
    ${reportHTML}
    <h2>By Page</h2>
    <div style="column-count: 2; margin-top: 1em;">
      <ul style="margin: 0;">
        ${recurseOutput(report.text)}
      </ul>
    </div>
  `;

  container.innerHTML = reportHTML;
  container.ariaBusy = false;
  return true;
}

/**
 * Driver function to gather information from global functions and the LibreTexts API and start
 * the Licensing Report rendering process.
 *
 * @returns {Promise<boolean>} True if rendering appears to have succeeded, false otherwise.
 */
async function buildLicensingReport() {
  const coverpage = await LibreTexts.getCoverpage();
  const [subdomain] = LibreTexts.parseURL();
  if (!coverpage || !subdomain) {
    return false;
  }
  try {
    const container = document.getElementById('dynamicLicensing');
    if (!container) {
      throw (new Error('No container element found!'));
    }
  
    // Show a loading indicator
    container.innerHTML = '<p style="text-align: center;">Loading...</p>';
    container.ariaLive = 'polite';
    container.ariaBusy = true;

    // Handle cache control
    const coverURL = encodeURIComponent(`https://${subdomain}.libretexts.org/${coverpage}`);
    let endpoint = `https://api.libretexts.org/endpoint/licensereport/${coverURL}`;
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.toString());
    if (urlParams.get('no-cache') !== null || urlParams.get('nocache') !== null) {
      endpoint = `${endpoint}?no-cache`;
    }

    const licenseReportRes = await fetch(endpoint);
    if (!licenseReportRes.ok) {
      throw (new Error('Unknown error occurred retrieving licensing report.'));
    }

    const licenseReport = await licenseReportRes.json();
    return buildHTML(licenseReport, container);
  } catch (e) {
    console.error(`[DynamicLicensing]: ${e.toString()}`);
    return false;
  }
}

// Attach the functions and start the driver if not yet initialized
if (!LibreTexts?.active?.dynamicLicensing) {
  LibreTexts.active.dynamicLicensing = true;
  LibreTexts.buildLicensingReport = buildLicensingReport;

  buildLicensingReport();
}
