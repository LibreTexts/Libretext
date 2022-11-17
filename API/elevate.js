/**
 * @file Defines several LibreTexts API functions for managing users,
 *  permissions, and transcluding content.
 * @author LibreTexts
 */
const express = require('express');
const timestamp = require('console-timestamp');
const filenamify = require('filenamify');
const fs = require('fs-extra');
const md5 = require('md5');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const check = require('./checkAuthorization');
const LibreTexts = require('./reuse');

const app = express();
app.use(express.json());
app.use(check);
let port = 3007;
if (process.argv.length >= 3 && Number.parseInt(process.argv[2], 10)) {
  port = Number.parseInt(process.argv[2], 10);
}
const now1 = new Date();
app.listen(port, () => console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)} ${port}`));
const prefix = '/elevate';
const botUsername = 'LibreBot';
const defaultImagesURL = 'https://cdn.libretexts.net/DefaultImages';

let defaultSandboxImage = null;
let defaultBookImage = null;

// express.js endpoints
app.put(`${prefix}/createSandbox`, createSandbox);
app.post(`${prefix}/createBook`, createBook);
app.put(`${prefix}/cleanPath`, cleanPath);
app.put(`${prefix}/fork`, fork);
app.put(`${prefix}/manageUser/:method`, manageUser);
app.put(`${prefix}/getUsers/:group.:format`, getUsersInGroup);
app.get(`${prefix}`, (req, res) => res.send('Hello World!'));

/**
 * Documents results from creating or finding a user's library Sandbox area.
 * @typedef {object} SandboxResult
 * @property {string} path - URL/path of the Sandbox, relative to the library domain.
 * @property {boolean} exists - Indicates the Sandbox already existed.
 * @property {boolean} created - Indicates the Sandbox was just created.
 * @property {boolean} permsUpdated - Indicates the newly created Sandbox's page
 *  permissions were updated.
 * @property {null|string} error - An error message, if one was encountered.
 */

/**
 * Checks for the existence of a user's Sandbox, and creates it if not found.
 *
 * @param {string} subdomain - LibreTexts library identifier.
 * @param {object} user - Current user.
 * @param {string|number} user.userID - Internal CXone user identifier.
 * @param {string} user.username - User's display username. 
 * @returns {Promise<SandboxResult>} Results from creating or finding Sandbox.
 */
async function ensureSandbox(subdomain, { userID, username }) {
  const originalPath = `Sandboxes/${username}`;
  const path = originalPath.replace('@', '_at_');
  const result = { path, exists: false, created: false, permsUpdated: false, error: null };
  try {
    // Migrate legacy Sandboxes with '@' in path
    if (username.includes('@')) {
      const migrate = await LibreTexts.authenticatedFetch(
        originalPath,
        `move?name=${username.replace('@', '_at_')}&allow=deleteredirects&dream.out.format=json`,
        subdomain,
        botUsername,
        { method: 'POST' },
      );
      console.log(`Migrated legacy Sandbox "${username}": ${(await migrate.json())["@count"]} pages`);
    }

    // Create Sandbox page
    const createRes = await LibreTexts.authenticatedFetch(
      path,
      `contents?title=${username}`,
      subdomain,
      botUsername,
      {
        method: 'POST',
        body: `
          <p>Welcome to Libretexts&nbsp;{{user.displayname}}!</p>
          <p class="mt-script-comment">Welcome Message</p>
          <pre class="script">template('CrossTransclude/Web', { 'Library': 'chem', 'PageID': 207047 });</pre>
          <p>{{template.ShowOrg()}}</p>
          <p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-category</a></p>
        `,
      },
    );
    if (createRes.ok) {
      result.created = true;

      // Add thumbnail
      if (defaultSandboxImage === null) {
        const imageRes = await fetch(`${defaultImagesURL}/sandbox.jpg`);
        defaultSandboxImage = await imageRes.blob();
      }
      const existingImage = await LibreTexts.authenticatedFetch(
        path,
        'files/=mindtouch.page%2523thumbnail?dream.out.format=json',
        subdomain,
      );
      if (!existingImage.ok) {
        await LibreTexts.authenticatedFetch(
          path,
          "files/=mindtouch.page%2523thumbnail",
          subdomain,
          botUsername,
          { method: 'PUT', body: defaultSandboxImage },
        );
      }

      // Change permissions
      const groups = await getGroups(subdomain);
      const developerGroup = groups.find((g) => g.name === 'Developer');
      const permsRes = await LibreTexts.authenticatedFetch(
        path,
        'security?dream.out.format=json',
        subdomain,
        botUsername,
        { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
          body: `
            <security>
              <permissions.page>
                <restriction>Semi-Private</restriction>
              </permissions.page>
              <grants>
                ${developerGroup
                  ? `<grant>
                      <group id="${developerGroup.id}"></group>
                      <permissions><role>Manager</role></permissions>
                    </grant>`
                  : ''}
                <grant>
                  <user id="${userID}"></user>
                  <permissions><role>Manager</role></permissions>
                </grant>
              </grants>
            </security>
          `,
        },
      );
      if (permsRes.ok) {
        result.permsUpdated = true;
      } else {
        result.error = await permsRes.text();
        console.error(`Error updating permissions for Sandbox "${username}":`);
        console.error(result.error);
      }
    } else {
      result.exists = true;
    }
  } catch (e) {
    result.error = e.toString();
    console.error(`Error creating Sandbox for ${username}:`);
    console.error(e);
  }
  return result;
}

/**
 * Creates a user Sandbox and limits permissions to just that user.
 *
 * @param {express.Request} req - Incoming request.
 * @param {express.Response} res - Outgoing response. 
 */
async function createSandbox(req, res) {
  const { subdomain, user, username } = req.body;
  const sandbox = await ensureSandbox(subdomain, { username, userID: user.id });
  const resultMsg = `${subdomain}/${username}`;
  console.log(`[createSandbox] (${subdomain} - ${username}): ${JSON.stringify(sandbox)}`);
  if (sandbox.error) {
    return res.status(500).send(`${resultMsg}: Error encountered: ${sandbox.error}`);
  }
  if (sandbox.created) {
    return res.send(`${resultMsg}: Sandbox created and permissions updated.`);
  }
  return res.send(`${resultMsg}: Sandbox already exists.`);
}

/**
 * Creates a new book with default features in a user's sandbox.
 *
 * @param {express.Request} req - Incoming request.
 * @param {express.Response} res - Outgoing response.
 */
 async function createBook(req, res) {
  const { subdomain, user, username, title } = req.body;
  const sandbox = await ensureSandbox(subdomain, { username, userID: user.id });
  if (sandbox.error && !(sandbox.created || sandbox.exists)) {
    return res.status(500).send({
      errors: [{
        status: 500,
        code: 'ensure_sandbox',
        title: 'Unable to Ensure Sandbox',
        detail: sandbox.error,
      }],
    });
  }

  // Create book coverpage
  const bookPath = `${sandbox.path}/${encodeURIComponent(title)}`;
  const bookURL = `https://${subdomain}.libretexts.org/${bookPath}`;
  const createBookRes = await LibreTexts.authenticatedFetch(
    bookPath,
    `contents?title=${encodeURIComponent(title)}&dream.out.format=json`,
    subdomain,
    botUsername,
    {
      method: 'POST',
      body: `
        <p>{{template.ShowOrg()}}</p>
        <p class="template:tag-insert">
          <a href="#">article:topic-category</a><a href="#">coverpage:yes</a>
        </p>
      `,
    },
  );
  const createBook = await createBookRes.json();
  if (!createBookRes.ok) {
    console.error(createBook);
    return res.status(500).send({
      errors: [{
        status: 500,
        code: 'create_book_coverpage',
        title: 'Unable to Create New Coverpage',
      }],
    });
  }
  await Promise.all([
    LibreTexts.addProperty(subdomain, bookPath, 'mindtouch.page#welcomeHidden', true),
    LibreTexts.addProperty(subdomain, bookPath, 'mindtouch.idf#subpageListing', 'simple'),
  ]);

  if (defaultBookImage === null) {
    const imageRes = await fetch(`${defaultImagesURL}/default.png`);
    defaultBookImage = await imageRes.blob();
  }
  await LibreTexts.authenticatedFetch(
    bookPath,
    "files/=mindtouch.page%2523thumbnail",
    subdomain,
    botUsername,
    { method: 'PUT', body: defaultBookImage },
  ).catch((e) => {
    console.warn('[createBook] Error setting coverpage thumbnail:');
    console.warn(e);
  });

  // Create first chapter
  const chapterContents = `
    <p>{{template.ShowOrg()}}</p>
    <p class="template:tag-insert"><a href="#">article:topic-guide</a></p>
  `;
  const guideTabs = `[{
    "templateKey": "Topic_heirarchy",
    "templateTitle": "Topic hierarchy",
    "templatePath": "MindTouch/IDF3/Views/Topic_hierarchy",
    "guid": "fc488b5c-f7e1-1cad-1a9a-343d5c8641f5"
  }]`;

  const chapterOnePath = `${bookPath}/01:_First_Chapter`;
  const chapterOneRes = await LibreTexts.authenticatedFetch(
    chapterOnePath,
    `contents?title=${encodeURIComponent('1: First Chapter')}&dream.out.format=json`,
    subdomain,
    botUsername,
    { method: 'POST', body: chapterContents },
  );
  if (chapterOneRes.ok) {
    await Promise.all([
      LibreTexts.addProperty(subdomain, chapterOnePath, 'mindtouch.page#welcomeHidden', true),
      LibreTexts.addProperty(subdomain, chapterOnePath, 'mindtouch.idf#guideDisplay', 'single'),
      LibreTexts.addProperty(subdomain, chapterOnePath, 'mindtouch#idf.guideTabs', guideTabs),
    ]);
    await LibreTexts.authenticatedFetch(
      chapterOnePath,
      "files/=mindtouch.page%2523thumbnail",
      subdomain,
      botUsername,
      { method: 'PUT', body: defaultBookImage },
    ).catch((e) => {
      console.warn('[createBook] Error setting Chapter 1 thumbnail:');
      console.warn(e);
    });
  }

  // Create Front & Back Matter
  const matterRes = await fetch(`https://batch.libretexts.org/print/Libretext=${bookURL}?createMatterOnly=true`, {
    headers: { origin: 'api.libretexts.org' },
  });
  if (matterRes.status !== 200) {
    console.warn('[createBook] Error creating matter.');
  }

  await LibreTexts.sleep(2500); // let CXone catch up with page creations
  
  console.log(`[createBook] Created ${bookPath}.`);
  return res.send({
    data: {
      path: bookPath,
      url: `https://${subdomain}.libretexts.org/${bookPath}`,
    },
  });
}

/**
 * Lists all of the groups for a particular subdomain
 * @param {string} subdomain 
 * @returns {Promise<object[]>} groups for that subdomain
 */
async function getGroups(subdomain) {
    let groups;
    if (typeof getGroups.groups === "undefined") { //reuse old data
        getGroups.groups = {};
    }
    if (typeof getGroups.groups[subdomain] !== "undefined" && getGroups.groups[subdomain].length) { //reuse old data
        return getGroups.groups[subdomain];
    }

    groups = await LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/groups?dream.out.format=json`, null, null, 'LibreBot');

    groups = await groups.json();

    if (groups['@count'] !== '0' && groups.group) {
        groups = groups.group.length ? groups.group : [groups.group];
        groups = groups.map((prop) => {
            return { name: prop['groupname'], id: prop['@id'], role: prop['permissions.group'].role['#text'] };
        });
    }
    else {
        groups = [];
    }
    getGroups.groups[subdomain] = groups;
    return groups;
}

/**
 * Removes any problematic characters from a page's path by moving it
 * @param {Request} req 
 * @param {Response} res 
 */
async function cleanPath(req, res) {
    const body = req.body;
    body.subdomain = body.pageSubdomain || body.subdomain;
    let page = await LibreTexts.authenticatedFetch(body.pageID, '?dream.out.format=json', body.subdomain, 'LibreBot');
    page = await page.json();
    let path = page.path["#text"];
    let originalPath = path;
    path = LibreTexts.cleanPath(path);
    if (path && (originalPath !== path || body.force)) {
        try {
            let makeChange = await LibreTexts.authenticatedFetch(body.pageID, `move?title=${encodeURIComponent(page.title)}&to=${encodeURIComponent(path)}&allow=deleteredirects&dream.out.format=json`,
                body.subdomain, 'LibreBot', {
                method: 'POST'
            });
            if (makeChange.ok) {
                // console.log(await makeChange.text());
            }
            else
                throw Error(await makeChange.text());
        } catch (e) {
            console.error(`[cleanPath] ${path}`);
            console.error(e);
            res.send(originalPath);
            res.status(500);
            return;
        }
        console.log(`[cleanPath] ${path}`);
        res.status(200);
        res.send(path);
    }
    else
        res.send('okay');
}

/**
 * Converts any content-reuse section in the page contents into the transcluded html content.
 *
 * @param {express.Request} req - Incoming fork request from client.
 * @param {express.Response} res - Request response object.
 */
async function fork(req, res) {
  const crossLibRegex = /(<p class="mt-script-comment">Cross Library Transclusion<\/p>\s+<pre class="script">\s+template\('CrossTransclude\/Web',)[\S\s]*?(\);<\/pre>)/g;
  const wikiTemplateRegex = /<pre class="script">\s?wiki.page\(.*\)<\/pre>/g; // local reuse
  const reuseTemplateRegex = /(<div class="mt-contentreuse-widget")[\S\s]*?(<\/div>)/g; // local reuse

  /**
   * Validates that a passed object is a non-empty string.
   *
   * @param {object} str - A string to validate.
   * @returns {boolean} True if valid string, false otherwise.
   */
  function isNonEmptyString(str) {
    return (typeof (str) === 'string' && str.length > 0);
  }

  /**
   * Verifies that a provided pageID is valid (non-empty string or valid number).
   *
   * @param {object} pageID - A pageID to validate.
   * @returns {boolean} True if valid pageID, false otherwise.
   */
  function isValidPageID(pageID) {
    return (
      isNonEmptyString(pageID)
      || (typeof (path) === 'number' && !Number.isNaN(pageID))
    );
  }

  /**
   * Replaces relative references to the CXone Expert file API with absolute paths to the
   * current library's file storage.
   * 
   * @param {string} contents - The page contents to absolutify.
   * @param {string} library - The internal LibreTexts library identifier.
   * @returns {string} The absolutified contents.
   */
  function absolutifyFileURLs(contents, library) {
    if (typeof (contents) !== 'string' || typeof (library) !== 'string') {
      console.warn('[fork] WARN: Invalid parameters passed to file URL absolutifier.');
      return contents;
    }
    return contents.replace(
      /"\/@api\/deki\/files\//g,
      `"https://${library}.libretexts.org/@api/deki/files/`,
    );
  }

  /**
   * Retrieves a page's content and metadata from the library API.
   *
   * @param {string} path - The page path.
   * @param {string} subdomain - The internal LibreTexts library identifier.
   * @returns {Promise<[boolean, string, object]>} A tuple containing: operation
   *  succeeded flag, the page's content as HTML string, page metadata.
   */
  async function getContentAndInfo(path, subdomain) {
    if (
      ((typeof (path) === 'string' && path.length > 0)
          || typeof (path) === 'number')
        && (typeof (subdomain) === 'string' && subdomain.length > 0)
    ) {
      let pageContent = await LibreTexts.authenticatedFetch(
        path,
        'contents?mode=raw&dream.out.format=json',
        subdomain,
        'LibreBot',
      );
      let pageInfo = await LibreTexts.authenticatedFetch(
        path,
        'info?dream.out.format=json',
        subdomain,
        'LibreBot',
      );
      pageContent = await pageContent.json();
      pageInfo = await pageInfo.json();
      if (typeof (pageContent.body) === 'string') {
        return [true, pageContent.body, pageInfo];
      }
    }
    return [false, null, null];
  }

  /**
   * Copies files and attachments from one library page to another.
   *
   * @param {string} content - Target page's HTML that will be modified .
   * @param {object} source - Source page object.
   * @param {object} destination - Destination page object.
   * @param {string} user - Current user that is performing this operation.
   * @returns {Promise<string>} - Modified target page content (with new file URLs).
   */
  async function copyFiles(content, source, destination, user) {
    /**
     * Performs internal calls to copy a file from the source and create it in the destination.
     *
     * @param {object} file - File metadata object.
     * @returns {Promise<object>|boolean} A Promise resolving to operation metadata,
     *  or false if file does not need to be copied.
     */
    async function processFile(file) {
      // only files with extensions
      let { filename } = file;

      if (file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail')) {
        const hasThumbnail = await LibreTexts.authenticatedFetch(destination.path, 'files/=mindtouch.page%2523thumbnail', destination.subdomain, user);
        if (hasThumbnail.ok) {
          return false;
        }
        filename = '=mindtouch.page%23thumbnail';
      }
      let image = await LibreTexts.authenticatedFetch(source.path, `files/${filename}`, source.subdomain);

      image = await image.blob();
      let fileResponse = await LibreTexts.authenticatedFetch(destination.path, `files/${filename}?dream.out.format=json`, destination.subdomain, user, {
        method: 'PUT',
        body: image,
      });
      fileResponse = await fileResponse.json();
      const original = file.contents['@href'].replace(`https://${source.subdomain}.libretexts.org`, '');
      let final = `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(destination.path))}/files/${filename}`;
      if (fileResponse['@id']) final = `/@api/deki/files/${fileResponse['@id']}/${filename}`; // prefer link via ID
      return {
        original,
        oldID: file['@id'],
        newID: fileResponse['@id'],
        final,
        filename,
      };
    }

    let updatedContent = content;
    const response = await LibreTexts.authenticatedFetch(source.path, 'files?dream.out.format=json', source.subdomain, 'LibreBot');
    if (response.ok) {
      let files = await response.json();
      if (files['@count'] !== '0') {
        if (files.file) {
          if (!files.file.length) {
            files = [files.file];
          } else {
            files = files.file;
          }
        }
      }
      let promiseArray = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (file['@res-is-deleted'] === 'false') promiseArray.push(processFile(file));
      }
      promiseArray = await Promise.all(promiseArray);
      /* Replace HTML references to file URLs with the updated URLs */
      for (let i = 0; i < promiseArray.length; i += 1) {
        if (promiseArray[i]) {
          updatedContent = updatedContent.replace(promiseArray[i].original, promiseArray[i].final);
          updatedContent = updatedContent.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
        }
      }
    }
    return updatedContent;
  }

  /**
   * Retrieves content from the current library.
   *
   * @param {string} reuseCall - HTML string containing a content reuse template.
   * @param {string} subdomain - The internal LibreTexts library identifier.
   * @param {object} target - Information about the target forking page.
   * @param {object} request - The original client request body.
   * @param {string[]} tags - The current set of target page tags.
   * @returns {Promise<[boolean, string]>} A tuple contaning: operation succeeded
   *  flag, the content as an HTML string, found lib-pageID identifiers.
   */
  async function getLocalContent(reuseCall, subdomain, target, request, tags) {
    const quotesRegex = /&quot;|"/g;
    const pageContent = reuseCall;
    let path;
    let section;
    if (pageContent.startsWith('<div class="mt-contentreuse-widget')) {
      path = pageContent.match(/(?<=data-page=")[^"]+/);
      if (Array.isArray(path) && path.length > 0) {
        [path] = path;
      }
      const sectMatch = pageContent.match(/(?<=data-section=")[^"]+/);
      if (Array.isArray(sectMatch) && sectMatch.length > 0) {
        [section] = sectMatch;
      }
    } else if (pageContent.startsWith('<pre class="script">')) {
      const wikiReuseCalls = pageContent.match(/(wiki.page\(.*\))/g);
      if (Array.isArray(wikiReuseCalls)) {
        const urls = wikiReuseCalls[0]?.match(/(&quot;[^,]*&quot;)|("[^,]*")/g);
        if (Array.isArray(urls)) {
          path = urls[0].replace(quotesRegex, '');
          if (urls[1]) {
            section = urls[1].replace(quotesRegex, '');
          }
        }
      }
    }
    if (typeof (path) === 'string' && path.length > 0) {
      const [pageSuccess, foundContent, info] = await getContentAndInfo(path, subdomain);
      if (pageSuccess) {
        let content = foundContent;
        /* Grab specific section from HTML, if necessary */
        if (section) {
          const $ = cheerio.load(content);
          const sections = $('.mt-section');
          for (let i = 0, n = sections.length; i < n; i += 1) {
            const sec = $(sections[i]);
            const secTitle = sec.text();
            if (secTitle && secTitle.includes(section)) {
              content = sec.html();
              break;
            }
          }
        }
        /* recursively check for more transclusions */
        // eslint-disable-next-line no-use-before-define
        const [rSuccess, rContent] = await processPageFork(
          content,
          subdomain,
          target,
          request,
          tags,
        );
        return [rSuccess, rContent];
      }
    }
    return [false, reuseCall, null];
  }

  /**
   * Retrieves content from another library and copies files to the target library.
   *
   * @param {string} reuseCall - HTML string containing a cross-library transclusion template.
   * @param {object} target - Information about the target forking page.
   * @param {object} request - The original client request body.
   * @param {string[]} tags - The current set of target page tags.
   * @returns {Promise<[boolean, string]>} A tuple contaning: operation succeeded
   *  flag, the content as an HTML string, found lib-pageID identifiers.
   */
  async function getExternalContent(reuseCall, target, request, tags) {
    let templateMatch = reuseCall.match(/{.*?}/);
    if (Array.isArray(templateMatch) && templateMatch.length > 0) {
      templateMatch = templateMatch[0].replace(/'/g, '"');
      templateMatch = JSON.parse(templateMatch);
      const sourceInfo = {
        subdomain: templateMatch.Library,
        path: templateMatch.PageID,
      };
      const [success, foundContent, info] = await getContentAndInfo(
        sourceInfo.path,
        sourceInfo.subdomain,
      );
      if (success) {
        let content = foundContent;
        if (!target.readOnly) {
          content = await copyFiles(content, sourceInfo, target, request.username);
        } else {
          content = absolutifyFileURLs(content, sourceInfo.subdomain);
        }
        /* recursively check for more transclusions */
        // eslint-disable-next-line no-use-before-define
        const [rSuccess, rContent] = await processPageFork(
          content,
          sourceInfo.subdomain,
          target,
          request,
          tags,
        );
        return [rSuccess, rContent];
      }
    }
    return [false, reuseCall, null];
  }

  /**
   * Recursively processes a page and gathers transcluded content.
   *
   * @param {string} pageContent - The content of the page or section to work on.
   * @param {string} [subdomain] - The subdomain to use for local transclusions,
   *  if not the current context.
   * @param {object} target - Information about the target forking page.
   * @param {object} request - The original client request body.
   * @param {string[]} tags - The current set of target page tags.
   * @returns {Promise<[boolean, string]>} A tuple contaning: operation succeeded flag,
   *  the content as an HTML string.
   */
  async function processPageFork(pageContent, subdomain, target, request, tags) {
    if (typeof (pageContent) === 'string') {
      let forkedContent = pageContent;
      /* Get cross-lib transclusions */
      const crossLibMatches = forkedContent.match(crossLibRegex);
      const crossForks = [];
      if (Array.isArray(crossLibMatches)) {
        for (let i = 0, n = crossLibMatches.length; i < n; i += 1) {
          crossForks.push(getExternalContent(
            crossLibMatches[i],
            target,
            request,
            tags,
          ));
        }
        const crossRes = await Promise.all(crossForks);
        for (let i = 0, n = crossRes.length; i < n; i += 1) {
          const [success, temp] = crossRes[i];
          if (success) {
            forkedContent = forkedContent.replace(crossLibMatches[i], temp);
          } else {
            console.error(`[fork] Failed at cross-lib transclusion (${i})`);
            return [false, pageContent, []];
          }
        }
      }
      /* Get local-lib transclusions */
      const localReuseMatches = forkedContent.match(reuseTemplateRegex);
      const localWikiMatches = forkedContent.match(wikiTemplateRegex);
      let localLibMatches = [];
      if (Array.isArray(localReuseMatches)) {
        localLibMatches = [...localLibMatches, ...localReuseMatches];
      } else if (Array.isArray(localWikiMatches)) {
        localLibMatches = [...localLibMatches, ...localWikiMatches];
      }
      const localForks = [];
      for (let i = 0, n = localLibMatches.length; i < n; i += 1) {
        const subdomainUse = subdomain || target.subdomain;
        localForks.push(getLocalContent(
          localLibMatches[i],
          subdomainUse,
          target,
          request,
          tags,
        ));
      }
      const localRes = await Promise.all(localForks);
      for (let i = 0, n = localRes.length; i < n; i += 1) {
        const [success, temp] = localRes[i];
        if (success) {
          forkedContent = forkedContent.replace(localLibMatches[i], temp);
        } else {
          console.error(`[fork] Failed at local-lib transclusion (${i})`);
          return [false, pageContent];
        }
      }
      return [true, forkedContent];
    }
    return [false, pageContent];
  }

  const { body } = req;
  const readOnly = body.readOnly || false;
  const target = { path: body.path, subdomain: body.subdomain, readOnly };
  const targetInfo = await LibreTexts.getAPI(`https://${target.subdomain}.libretexts.org/${target.path}`, undefined, body.username);
  const user = body.username || 'LibreBot';
  let targetContent = await LibreTexts.authenticatedFetch(target.path, 'contents?mode=raw&dream.out.format=json', target.subdomain, user);
  if (targetContent.ok) {
    try {
      targetContent = await targetContent.json(); // text of target page to work on
      if (typeof (targetContent.body) === 'string') {
        if (readOnly) {
          console.log(`[fork] Performing read-only fork on ${target.subdomain}/${target.path}`);
        }
        targetContent = LibreTexts.decodeHTML(targetContent.body);
        const sourceTags = targetInfo.tags;

        /* Start forking recursion */
        const [success, newContent] = await processPageFork(
          targetContent,
          null,
          target,
          body,
          sourceTags,
        );

        /* Process tags and update the target page */
        const finalTags = new Set(sourceTags); // remove duplicates
        finalTags.delete('transcluded:yes'); // remove transclusion tag
        let tagString = ''; // prepare for addition via HTML inclusion
        finalTags.forEach((tag) => {
          tagString += `<a href="#">${tag}</a>`;
        });
        const successMsg = `Successfully forked https://${target.subdomain}.libretexts.org/${target.path}`;
        const comment = `[BOT Forker] ${successMsg}`;
        const msg = `[fork] ${successMsg}`;
        if (success) {
          if (target.readOnly) {
            const tagArr = Array.from(finalTags);
            return res.status(200).send({
              contents: newContent,
              tags: tagArr,
              msg,
            });
          }
          const api = `contents?edittime=now&comment=${encodeURIComponent(comment)}&dream.out.format=json`;
          const postContent = await LibreTexts.authenticatedFetch(
            target.path,
            api,
            target.subdomain,
            body.username,
            {
              method: 'POST',
              body: `
                ${newContent}
                <p class="template:tag-insert">
                    <em>Tags recommended by the template: </em>
                    ${tagString}
                </p>`,
            },
          );
          const postRes = await postContent.json();
          if (postRes['@status'] === 'success') {
            console.log(msg);
            return res.status(200).send(msg);
          } else {
            throw (new Error('Error updating content!'));
          }
        } else {
          throw (new Error('Error forking page!'));
        }
      } else {
        throw (new Error('Error loading target page content.'));
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  } else {
    const err = `[fork] Can't fork https://${target.subdomain}.libretexts.org/${target.path}`;
    console.error(`${err} . More info:`);
    console.error(await targetContent.text());
    return res.status(500).send(err);
  }
}

/**
 * Modifies a user's information and permissions
 *
 * @param {Request} req 
 * @param {Response} res 
 */
async function manageUser(req, res) {
    const body = req.body;
    const payload = body.payload;

    const libraryGroups = await getGroups(payload.subdomain);
    const libraryGroupsMap = {};
    for (const group of libraryGroups)
        libraryGroupsMap[group.name] = group.id;

    let user = await LibreTexts.getUser(payload.username, payload.subdomain, body.user.username);
    if (req.params.method === 'get') {

        res.status(user ? 200 : 404);
        res.send(JSON.stringify(user));
        return;
    }

    //update user properties
    const role = payload.groups.includes('Admin') ? 'Admin' : 'Viewer';
    // if (req.params.method === 'modify') {

    //TODO: license.seat is not currently working
    let response = await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/users?dream.out.format=json`, null, null, body.user.username, {
        method: 'POST',
        headers: { 'content-type': 'application/xml; charset=utf-8' },
        body: `<user ${user ? `id="${user.id}"` : ''}>
    <username>${payload.username}</username>
    <email>${payload.email}</email>
    <fullname>${payload.name}</fullname>
    <license.seat>true</license.seat>
    <status>${payload.status}</status>
    <service.authentication id="${payload.sso ? 3 : 1}" />
    <permissions.user>
        <role>${role}</role>
    </permissions.user>
    </user>`
    });
    res.status(response.status);
    response = await response.text();
    await LibreTexts.sleep(100);

    // console.log(user.groups, payload.groups);
    if (payload.status === 'active') {
        await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/users/${user.id}/seat?dream.out.format=json`,
            null,
            null,
            body.user.username,
            { method: 'PUT' });
    }

    //get updated user status
    user = await LibreTexts.getUser(payload.username, payload.subdomain, body.user.username);
    user.groups = user.groups.map(g => g.name);

    // console.log(user.groups, payload.groups);

    //check for differences in groups
    const addGroups = payload.groups.filter(g => !user.groups.includes(g));
    const removeGroups = user.groups.filter(g => !payload.groups.includes(g));

    // console.log(addGroups, removeGroups);
    // console.log(libraryGroupsMap);

    //add user to groups
    for (const group of addGroups) {
        if (libraryGroupsMap[group])
            await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/groups/${libraryGroupsMap[group]}/users`,
                null, null, body.user.username, {
                method: 'POST',
                headers: { 'content-type': 'application/xml; charset=utf-8' },
                body: `<users><user id="${user.id}"/></users>`
            })
    }

    //remove user from groups
    for (const group of removeGroups) {
        if (libraryGroupsMap[group])
            await LibreTexts.authenticatedFetch(`https://${payload.subdomain}.libretexts.org/@api/deki/groups/${libraryGroupsMap[group]}/users/${user.id}`,
                null, null, body.user.username, {
                method: 'DELETE',
            })
        //.then(async data =>console.log(await data.text()))
    }

    res.send(response);
}

/**
 * Sends back CSV file of all users in a particular group
 * @param {Request} req 
 * @param {Response} res 
 */
async function getUsersInGroup(req, res) {
    let result = [];
    let subdomains = Object.values(LibreTexts.libraries);
    let libraries = {};
    const inputGroup = req?.params?.group;
    // res.setHeader('Content-Disposition', 'attachment');

    for (const subdomain of subdomains) {
        let groups = await getGroups(subdomain);
        let targetGroup = groups.find((e) => e.name === inputGroup);
        if (targetGroup) {
            libraries[subdomain] = LibreTexts.authenticatedFetch(`https://${subdomain}.libretexts.org/@api/deki/groups/${targetGroup.id}/users?dream.out.format=json`, null, null, 'admin');
        }
        else {
            libraries[subdomain] = false;
        }
    }

    const usersObject = {};
    for (const subdomain in libraries) {
        // console.log(subdomain, groups)
        if (!libraries[subdomain])
            continue;

        let targetGroup = await libraries[subdomain];
        targetGroup = (await targetGroup.json()).user;


        if (targetGroup) {
            if (!targetGroup.length)
                targetGroup = [targetGroup];
            targetGroup = targetGroup.map(item => {
                return {
                    group: inputGroup,
                    subdomain,
                    status: item.status,
                    // id: item['@id'],
                    username: item.username,
                    email: item.email,
                    fullname: item.fullname,
                }
            });

            targetGroup = targetGroup.filter(item => item.status === 'active');

            targetGroup.forEach(item => {
                if (usersObject[item.username]) {
                    usersObject[item.username].subdomain += `; ${item.subdomain}`;
                }
                else {
                    usersObject[item.username] = item;
                }
            });

            result = result.concat(targetGroup);
        }
    }
    result = Object.values(usersObject);

    // console.log(req?.params.format);
    if (req?.params.format === 'json') {
        // await fs.writeJSON('allUsers.json', result);
        res.type('json');
        res.send(JSON.stringify(result));
        return;
    }
    else if (req?.params.format === 'csv') {
        //convert to CSV
        let keys = Object.keys(result[0]);
        let CSV = keys.join(',') + '\n';
        const columnDelimiter = ',';
        result.forEach(item => {
            let ctr = 0
            keys.forEach(key => {
                if (ctr > 0) {
                    CSV += columnDelimiter;
                }

                CSV += typeof item[key] === "string" && item[key].includes(columnDelimiter) ? `"${item[key]}"` : item[key];
                ctr++;
            })
            CSV += '\n';
        })

        // await fs.writeFile('allUsers.csv', CSV)
        res.type('text/csv');
        res.send(CSV);
    }
    console.log('done');
}
