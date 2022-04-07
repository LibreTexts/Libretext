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

// express.js endpoints
app.put(`${prefix}/createSandbox`, createSandbox);
app.put(`${prefix}/cleanPath`, cleanPath);
app.put(`${prefix}/fork`, fork);
app.put(`${prefix}/manageUser/:method`, manageUser);
app.put(`${prefix}/getUsers/:group.:format`, getUsersInGroup);
app.get(`${prefix}`, (req, res) => res.send('Hello World!'));

/**
 * Creates a user sandbox and limits permissions to just that user
 * @param {Request} req 
 * @param {Response} res 
 */
async function createSandbox(req, res) {
    const body = req.body;
    // console.log(body);

    let originalPath = `Sandboxes/${body.username}`;
    let path = originalPath.replace('@', '_at_');
    let result = `${body.subdomain}/${body.username}`;

    //replace any '@' in username
    if (body.username.includes('@')) {
        let migrate = await LibreTexts.authenticatedFetch(originalPath, `move?name=${body.username.replace('@', '_at_')}&allow=deleteredirects&dream.out.format=json`, body.subdomain, botUsername, {
            method: 'POST',
        });
        console.log(`Migrate ${body.username} pages: ${(await migrate.json())["@count"]}`);
    }

    //create sandbox page
    let response = await LibreTexts.authenticatedFetch(path, `contents?title=${body.username}`, body.subdomain, botUsername, {
        method: 'POST',
        body: '<p>Welcome to LibreTexts&nbsp;{{user.displayname}}!</p><p class="mt-script-comment">Welcome Message</p><pre class="script">\ntemplate(\'CrossTransclude/Web\',{\'Library\':\'chem\',\'PageID\':207047});</pre><p>{{template.ShowOrg()}}</p><p class="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-category</a></p>'
    });
    if (!response.ok && !body.force) {
        result += ' Sandbox Already Exists.';
        res.status(200);
    }
    else {
        result += ' Sandbox Created.';

        //add thumbnail
        if (typeof createSandbox.image === 'undefined') {
            let image = 'https://cdn.libretexts.net/DefaultImages/sandbox.jpg';
            image = await fetch(image);
            image = await image.blob();
            createSandbox.image = image;
        }
        let imageExists = await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail?dream.out.format=json", body.subdomain);
        if (!imageExists.ok)
            await LibreTexts.authenticatedFetch(path, "files/=mindtouch.page%2523thumbnail", body.subdomain, botUsername, {
                method: "PUT",
                body: createSandbox.image,
            });

        //change permissions
        const groups = await getGroups(body.subdomain);
        const developerGroup = groups.find((e) => e.name === 'Developer');

        response = await LibreTexts.authenticatedFetch(path, 'security?dream.out.format=json', body.subdomain, botUsername, {
            method: 'PUT',
            headers: { 'content-type': 'application/xml; charset=utf-8' },
            body: `<security>
	    <permissions.page>
	        <restriction>Semi-Private</restriction>
	    </permissions.page>
	    <grants>
	        ${developerGroup ? `<grant><group id="${developerGroup.id}"></group><permissions><role>Manager</role></permissions></grant>` : ''}
	        <grant>
	            <user id="${body.user.id}"></user>
	            <permissions>
	                <role>Manager</role>
	            </permissions>
	        </grant>
	    </grants>
	</security>`
        });

        if (response.ok) {
            result += ' Set to Semi-Private.';
            res.status(200);
        }
        else {
            result += `\nError: ${await response.text()}`;
            res.status(500);
            console.error(result);
        }

    }


    console.log(`[createSandbox] ${result}`);
    res.send(result);
}

/**
 * Lists all of the groups for a particular subdomain
 * @param {string} subdomain 
 * @returns {array} groups for that subdomain
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
  const wikiTemplateRegex = /(<pre class="script">\s*?wiki.page\(&quot;)[\S\s]*?(&quot;\)\s*?<\/pre>)/g; // local reuse
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
   * Retrieves the highest `source[#]` tag number found in an array of tags.
   *
   * @param {string[]} tags - An array of tag values.
   * @returns {number} The highest tag number found.
   */
  function getIndex(tags) {
    let result = 0;
    tags.forEach((tag) => {
      let index = tag.match(/(?<=source\[)[0-9]+?(?=]-)/);
      if (index) {
        index = Number.parseInt(index, 10);
        if (index > result) result = index;
      }
    });
    return result;
  }

  /**
   * Generates a new `source[#]-sub-pageID` tag for a given page identifier.
   *
   * @param {string} subdomain - The internal LibreTexts library identifier.
   * @param {string|number} pageID - A library page ID.
   * @param {string[]} tags - The current set of target page tags.
   * @returns {[number,string]} A tuple containing the tag's index and the
   *  new tag to use.
   */
  function getNewSourceTag(subdomain, pageID, tags) {
    const newIndex = getIndex(tags);
    if (isNonEmptyString(subdomain) && isValidPageID(pageID) && Array.isArray(tags)) {
      const potentialTagSuffix = `${subdomain}-${pageID}`;
      const potentialTag = `source[${newIndex + 1}]-${potentialTagSuffix}`;
      const foundMatchIdx = tags.findIndex((tag) => {
        if (typeof (tag) === 'string') {
          return tag.endsWith(potentialTagSuffix);
        }
        return false;
      });
      if (foundMatchIdx !== -1) { // tag exists
        const tagNumMatch = tags[foundMatchIdx].match(/\[[0-9]+\]/m);
        if (tagNumMatch !== null && tagNumMatch.length > 0) {
          const tagNum = tagNumMatch[0].replaceAll(/(\[|\])/g, '');
          return [Number.parseInt(tagNum, 10), tags[foundMatchIdx]];
        }
      }
      return [newIndex + 1, potentialTag]; // tag does not exist
    }
    return [newIndex, null];
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
        pageContent = LibreTexts.decodeHTML(pageContent.body);
        return [true, pageContent, pageInfo];
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
      return {
        original,
        oldID: file['@id'],
        newID: fileResponse['@id'],
        final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(destination.path))}/files/${filename}`,
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
      const sectMatch = pageContent.match(/"[\S\s]*?"/, 'g');
      if (Array.isArray(sectMatch) && sectMatch.length > 2) {
        section = sectMatch[2].replace(/['"]+/g, '');
      }
    }
    if (typeof (path) === 'string' && path.length > 0) {
      const [pageSuccess, foundContent, info] = await getContentAndInfo(path, subdomain);
      if (pageSuccess) {
        let content = foundContent;
        const [newIndex, newTag] = getNewSourceTag(subdomain, info['@id'], tags);
        if (newTag !== null) {
          tags.push(newTag);
          const sourceID = `${subdomain}-${info['@id']}`;
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
          content = `
              <div class="comment">
                  <div class="mt-comment-content">
                      <p>Forker source[${newIndex}] start-${sourceID}</p>
                  </div>
              </div>
              ${content}
              <div class="comment">
                  <div class="mt-comment-content">
                      <p>Forker source[${newIndex}] end-${sourceID}</p>
                  </div>
              </div>
          `;
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
        content = await copyFiles(content, sourceInfo, target, request.username);
        const [newIndex, newTag] = getNewSourceTag(sourceInfo.subdomain, info['@id'], tags);
        if (newTag !== null) {
          tags.push(newTag);
          const sourceID = `${sourceInfo.subdomain}-${info['@id']}`;
          content = `
              <div class="comment">.
                  <div class="mt-comment-content">
                      <p>Forker source[${newIndex}] start-${sourceID}</p>
                  </div>
              </div>
              ${content}
              <div class="comment">
                  <div class="mt-comment-content">
                      <p>Forker source[${newIndex}] end-${sourceID}</p>
                  </div>
              </div>
          `;
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
      const localWikiMatches = forkedContent.match(wikiTemplateRegex);
      const localReuseMatches = forkedContent.match(reuseTemplateRegex);
      let localLibMatches = [];
      if (Array.isArray(localWikiMatches)) {
        localLibMatches = [...localLibMatches, ...localReuseMatches];
      }
      if (Array.isArray(localReuseMatches)) {
        localLibMatches = [...localLibMatches, ...localReuseMatches];
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
  const target = { path: body.path, subdomain: body.subdomain };
  const targetInfo = await LibreTexts.getAPI(`https://${target.subdomain}.libretexts.org/${target.path}`, undefined, body.username);
  let targetContent = await LibreTexts.authenticatedFetch(target.path, 'contents?mode=raw&dream.out.format=json', target.subdomain, body.username);
  if (targetContent.ok) {
    try {
      targetContent = await targetContent.json(); // text of target page to work on
      if (typeof (targetContent.body) === 'string') {
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
            res.status(200).send(msg);
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
      res.status(500).send(err);
    }
  } else {
    const err = `[fork] Can't fork https://${target.subdomain}.libretexts/org/${target.path}`;
    console.error(`${err} . More info:`);
    console.error(await targetContent.text());
    res.status(500).send(err);
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
