/**
 * @file Defines methods to dynamically generate a Table of Contents page by reading a
 *  book's page hierarchy in real-time.
 * @author LibreTexts <info@libretexts.org>
 */

import './dynamicTOC.css';

const matterPages = [];

/**
 * Creates a list of pages to include in an indvidual level of the TOC by filtering certain Matter
 * pages or raising pages up a level.
 *
 * @param {object} page - The page to examine, including subpages if applicable.
 * @returns {object[]} A list of pages to include.
 */
function generateContentsList(page) {
  const FRONT_MATTER_TITLES = ['TitlePage', 'InfoPage', 'Table of Contents'];

  let pages = [];

  const processFrontMatterPage = (subpage) => {
    matterPages.push(subpage.id);
    if (!FRONT_MATTER_TITLES.includes(subpage.title)) {
      pages.push(subpage);
    }
  };

  if (Array.isArray(page.subpages) && page.subpages.length > 0) {
    for (let i = 0, n = page.subpages.length; i < n; i += 1) {
      const child = page.subpages[i];
      const isMatter = (child.title === 'Front Matter' || child.title === 'Back Matter');
      const hasChildren = Array.isArray(child.subpages) && child.subpages.length > 0;
      if (!isMatter) {
        pages.push(child);
      }
      if (isMatter && hasChildren) {
        if (child.title === 'Front Matter') {
          child.subpages.forEach(processFrontMatterPage);
        }
        if (child.title === 'Back Matter') {
          child.subpages.forEach((subpage) => matterPages.push(subpage.id));
          pages = pages.concat(child.subpages);
        }
      }
    }
  }
  return pages;
}

/**
 * Reads the list of revisions for a Glossary page and tries to determine if it has been edited
 * by an author (i.e., not automated updates only).
 *
 * @param {object} glossary - Glossary page information object.
 * @param {string} subdomain - Current library identifier.
 * @returns {Promise<boolean>} True if Glossary page should be included, false otherwise.
 *  Falls back to true in case of error.
 * @todo Implement check for anonymous users.
 */
// eslint-disable-next-line no-unused-vars
async function checkIncludeGlossary(glossary, subdomain) {
  try {
    if (typeof (glossary.id) !== 'number') {
      throw (new Error('Glossary page identifier invalid.'));
    }
    const glossaryRevisionsReq = await LibreTexts.authenticatedFetch(
      glossary.id,
      'revisions?dream.out.format=json',
      subdomain,
    );
    const glossaryRevisions = await glossaryRevisionsReq.json();

    const allModifiers = new Set();

    const addModifierToSet = (revision) => {
      const modifier = revision['user.author'];
      if (modifier) {
        allModifiers.add(modifier.username);
      }
    };

    if (Array.isArray(glossaryRevisions.page)) {
      glossaryRevisions.page.forEach((revision) => addModifierToSet(revision));
    } else if (typeof (glossaryRevisions.page) === 'object') { // single revision
      addModifierToSet(glossaryRevisions.page);
    }

    // only LibreBot has modified the page
    if (allModifiers.size === 1 && allModifiers.has('LibreBot')) {
      return false;
    }
  } catch (e) {
    console.warn('[DynamicTOC]: Error determining if Glossary should be included:');
    console.warn(e);
  }
  return true;
}

/**
 * Builds the Table of Contents given a page hierarchy by generating an HTML string and
 * attaching it to a pre-existing container element.
 *
 * @param {object} hierarchy - The book's page hierarchy (with nested subpages).
 * @param {string} subdomain - The current LibreTexts library identifier.
 * @param {HTMLElement} containerRef - The DOM element to insert the TOC into.
 * @returns {boolean} True if render succeeded, false otherwise.
 */
async function buildTable(hierarchy, subdomain, containerRef) {
  const container = containerRef;

  const getLevel = async (page, level = 1) => {
    const pages = generateContentsList(page);
    if (Array.isArray(pages)) {
      const renderChild = async (item) => {
        const subpageDir = await getLevel(item, level + 1);
        const prefix = level === 1 ? 'h2' : 'span';
        let fontClass = 'content_entry';
        if (level === 1) {
          fontClass = 'chapter_entry';
        }
        if (matterPages.includes(item.id)) {
          fontClass = 'matter_entry';
        }
        if (!item.path || !item.title) {
          return null;
        }
        if (['semi-private', 'private'].includes(item.restriction) && !item.path.includes('Sandboxes/')) {
          return null;
        }
        /*
        if (item.title === 'Glossary') {
          const shouldInclude = await checkIncludeGlossary(item);
          if (!shouldInclude) {
            return null;
          }
        }
        */
        return `
          <li>
            <${prefix} class="${fontClass}">
              <a href="https://${subdomain}.libretexts.org/${item.path}">${item.title}</a>
            </${prefix}>
            ${subpageDir}
          </li>
        `;
      };
      const children = await Promise.all(pages.map((item) => renderChild(item)));
      if (children.length > 0) {
        return `
          <ul class="${level === 1 ? 'toc chapter_level' : 'section_level'}">
            ${children.join('')}
          </ul>
        `;
      }
    }
    return '';
  };

  const listing = await getLevel(hierarchy);

  // Make stylized header block
  const titleContainer = document.createElement('div');
  titleContainer.id = 'dynamicTOC_title_container';
  const titleHeading = document.createElement('h1');
  titleHeading.appendChild(document.createTextNode('Table of Contents'));
  titleHeading.id = 'dynamicTOC_title_heading';
  titleContainer.appendChild(titleHeading);

  container.innerHTML = `${titleContainer.outerHTML}${listing}`;
  container.ariaBusy = false;
  return true;
}

/**
 * Driver function to gather information from global functions and start the TOC rendering process.
 *
 * @returns {Promise<boolean>} True if rendering appears to have succeeded, false otherwise.
 */
async function buildTOC() {
  const coverpage = await LibreTexts.getCoverpage();
  if (!coverpage) {
    return false;
  }
  try {
    const [subdomain] = LibreTexts.parseURL();

    const container = document.getElementById('dynamicTOC');
    if (!container) {
      console.error('[DynamicTOC]: No container element found!');
      return false;
    }

    // Show a loading indicator
    container.innerHTML = '<p style="text-align: center;">Loading...</p>';
    container.ariaLive = 'polite';
    container.ariaBusy = true;

    const { structured } = await LibreTexts.getTOC();
    if (!structured) {
      return false;
    }

    return buildTable(structured, subdomain, container);
  } catch (e) {
    console.error(`[DynamicTOC]: ${e.toString()}`);
    return false;
  }
}

// Attach the functions and start the driver if not yet initiated
if (!LibreTexts?.active?.dynamicTOC) {
  LibreTexts.active.dynamicTOC = true;
  LibreTexts.buildDynamicTOC = buildTOC;

  buildTOC();
}
