/**
 * @file Defines bots for authorized users to perform curation
 *  activities on LibreTexts libraries.
 * @author LibreTexts <info@libretexts.org>
 */
const { performance } = require('perf_hooks');
const http = require('http');
const express = require('express');
const fs = require('fs-extra');
const timestamp = require('console-timestamp');
const socketio = require('socket.io');
const cheerio = require('cheerio');
const jsdiff = require('diff');
const fetch = require('node-fetch');
const async = require('async');
const tidy = require('tidy-html5').tidy_html5;
const filenamify = require('filenamify');
const randomstring = require('randomstring');
const puppeteer = require('puppeteer');
const LibreTexts = require('./reuse');

const app = express();
const server = http.Server(app);
const io = socketio(server, {
  path: '/bot/ws',
  cors: {
    origin: /libretexts\.org$/,
    methods: ['GET'],
  },
});
const basePath = '/bot';
let port = 3006;
if (process.argv.length >= 3 && parseInt(process.argv[2], 10)) {
  port = parseInt(process.argv[2], 10);
}

const PPTR_PAGE_TIMEOUT = 60000;
const PPTR_LOAD_SETTINGS = {
  timeout: PPTR_PAGE_TIMEOUT,
  waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
};
const API_THROTTLE_TIME = 2500;

/* Setup log directories */
fs.emptyDir('BotLogs/Working');
fs.ensureDir('BotLogs/Users');
fs.ensureDir('BotLogs/Completed');

/**
 * Creates a Promise that "blocks" thread execution for the specified time when used with `await`.
 *
 * @param {number} ms - Time to pause execution, in milliseconds.
 * @returns {Promise<null>} Promise that resolves when the specified time has passed.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handler to log and dismiss Javascript dialogs encountered when using Puppeteer.
 *
 * @param {puppeteer.Dialog} dialog - The dialog that triggered the handler.
 */
async function pptrDialogHandler(dialog) {
  console.log(`[Puppeteer Dialog]: ${dialog.message()}`);
  await dialog.dismiss();
}

async function jobHandler(jobType, jobInput, socket) {
  let input = jobInput;
  function verifyParameters() {
    switch (jobType) {
      case 'findReplace':
        return input.root && input.user && input.find;
      case 'deadLinks':
      case 'headerFix':
      case 'foreignImage':
      case 'convertContainers':
      case 'licenseReport':
      case 'editorPreprocess':
        return input.root && input.user;
      case 'multipreset':
        return input.root && input.multi;
      default:
        return input.root;
    }
  }

  function getParameters() {
    switch (jobType) {
      case 'findReplace':
        return {
          root: input.root,
          user: input.user,
          find: input.find,
          replace: input.replace,
        };
      case 'deadLinks':
      case 'headerFix':
      case 'foreignImage':
      case 'convertContainers':
      case 'editorPreprocess':
        return { root: input.root, user: input.user };
      case 'licenseReport':
        return {
          root: input.root,
          user: input.user,
          createReportPage: input.createReportPage,
          generateReportPDF: input.generateReportPDF,
        };
      case 'multipreset':
        return { root: input.root, multi: input.multi };
      default:
        return { root: input.root };
    }
  }

  function parallelCount() {
    if (input.root.endsWith('.libretexts.org') || input.root.endsWith('.libretexts.org/')) {
      return 2;
    }
    switch (jobType) {
      case 'foreignImage':
      case 'editorPreprocess':
        return 2;
      case 'findReplace':
      case 'deadLinks':
      case 'headerFix':
      case 'convertContainers':
      case 'multipreset':
      case 'licenseReport':
        return 5;
      default:
        return 1;
    }
  }

  if (!verifyParameters()) {
    socket.emit('Body missing parameters');
    return;
  }
  input = {
    ...input,
    root: input.root.replace(/\/$/, ''),
    subdomain: LibreTexts.extractSubdomain(input.root),
    jobType,
  };
  const ID = await logStart(input, input.findOnly);
  socket.emit('setState', { state: 'starting', ID });
  console.log(`JOB [${ID}](${input.user}) ${jobType} ${jobType === 'findReplace' ? input.find : ''}`);

  if (jobType === 'licenseReport') {
    // redirect for new licenseReport infrastructure
    return licenseReport(input, socket, ID);
  }

  socket.emit('setState', { state: 'getSubpages', ID: input.ID });
  let pages = await LibreTexts.getSubpages(input.root, input.user, { delay: true, socket: socket, flat: true });
  // pages = LibreTexts.addLinks(await pages);
  // console.log(pages);
  let index = 0;
  let percentage = 0;
  let log = [];
  let backlog = [];
  let pageSummaryCount = 0;
  let backlogClearer = setInterval(clearBacklog, 1000);
  let browser;
  let result = {
    user: input.user,
    subdomain: input.subdomain,
    ID: ID,
    jobType: input.jobType,
    params: getParameters(),
    pages: log,
  };

  if (jobType === 'editorPreprocess') {
    browser = await initializePuppeteer(result.user, result.subdomain, result.ID);
    if (!browser) {
      socket.emit('errorMessage', { message: 'Error starting browser instance for bot.' });
      return;
    }
  }

  async function clearBacklog() {
    if (backlog.length) {
      result = {
        user: input.user,
        subdomain: input.subdomain,
        ID: ID,
        jobType: input.jobType,
        params: getParameters(),
        pages: log,
      };
      await logProgress(result, input.findOnly);
      socket.emit('pages', backlog);
      backlog = [];
    }
  }

  await async.mapLimit(pages, parallelCount(), async (page) => {
    index++;
    let currentPercentage = Math.round(index / pages.length * 100);
    if (percentage < currentPercentage) {
      percentage = currentPercentage;
      socket.volatile.emit('setState', { state: 'processing', percentage: currentPercentage });
    }
    let path = page.replace(`https://${input.subdomain}.libretexts.org/`, '');
    if (!path)
      return false;
    let content = await LibreTexts.authenticatedFetch(path, 'contents?mode=edit&dream.out.format=json', input.subdomain, input.user);
    if (!content.ok) {
      console.error('Could not get content from ' + path);
      let error = await content.text();
      console.error(error);
      socket.emit('errorMessage', {
        noAlert: true,
        message: error,
      });
      return false;
    }
    content = await content.json();
    content = content.body;
    // content = LibreTexts.decodeHTML(content);
    // console.log(content);

    let result = content, comment, jobs = [{ jobType: jobType, ...input }];

    if (jobType === 'multipreset' && input.multi) {
      jobs = input.multi.body;
      jobs = jobs.map((j) => {
        if (j.find) {
          j.regex = Boolean(j.find.match(/^\/[\s\S]*\/$/));
          j.jobType = 'findReplace';
        }
        return j;

      })
    }

    for (const job of jobs) {
      let lastResult = result;
      switch (job.jobType) {
        case 'findReplace':
          result = await findReplace(job, result);
          comment = `[BOT ${ID}] Replaced "${job.find}" with "${job.replace}"`;
          break;
        case 'deadLinks':
          [result, numLinks] = await deadLinks(job, result);
          comment = `[BOT ${ID}] Killed ${numLinks} Dead links`;
          break;
        case 'convertContainers':
          [result, numContainers] = await convertContainers(job, result);
          comment = `[BOT ${ID}] Upgraded ${numContainers} Containers`;
          break;
        case 'headerFix':
          result = await headerFix(job, result);
          comment = `[BOT ${ID}] Fixed Headers`;
          break;
        case 'foreignImage':
          [result, count] = await foreignImage(job, result, path);
          comment = `[BOT ${ID}] Imported ${count} Foreign Images`;
          // if (job.findOnly && count)
          //     result = 'findOnly';
          break;
        case 'editorPreprocess':
          result = await editorPreprocess(ID, page, browser);
          comment = `[BOT ${ID}] Performed HTML Preprocess`;
          break;
        case 'clean':
          if (result !== content)
            result = tidy(result); //{indent:'auto','indent-spaces':4}
          break;
        case 'addPageIdentifierClass':
          // if (result !== content)
          result = await addPageIdentifierClass(input.subdomain, path, result);
          break;
      }
      if (result && result !== lastResult && comment)
        console.log(comment);
      result = result || lastResult;
    }

    if (jobType === 'multipreset')
      comment = `[BOT ${ID}] Performed Multipreset ${input.multi.name}`;

    //Page summaries
    if (input.summaries) {
      let summary = await LibreTexts.authenticatedFetch(path, 'properties/mindtouch.page%2523overview', input.subdomain, input.user);
      if (summary.ok) {
        summary = await summary.text();
        summary = LibreTexts.decodeHTML(summary);
        let summaryResult = summary.replaceAll(input.find, input.replace, input);
        // summaryResult = LibreTexts.encodeHTML(summaryResult);
        if (!input.findOnly)
          await LibreTexts.authenticatedFetch(path, 'properties/mindtouch.page%2523overview?dream.out.format=json&abort=never', input.subdomain, input.user, {
            method: 'PUT',
            body: summaryResult,
          });
        pageSummaryCount++;
      }
    }

    if (!result || result === content)
      return;

    // result = LibreTexts.encodeHTML(result);

    //send update
    if (input.findOnly || jobType === 'editorPreprocess') {
      let item = { path: path, url: page };
      backlog.unshift(item);
      log.push(item);
      return;
    }
    // result = LibreTexts.encodeHTML(result);
    let response = await LibreTexts.authenticatedFetch(path, `contents?edittime=now&dream.out.format=json&comment=${encodeURIComponent(comment)}`, input.subdomain, input.user, {
      method: 'POST',
      body: result,
    });
    if (response.ok) {
      let fetchResult = await response.json();
      let revision = fetchResult.page['@revision'];
      // console.log(path, revision);
      let item = { path: path, revision: revision, url: page };
      backlog.unshift(item);
      log.push(item);
    }
    else {
      let error = await response.text();
      console.error(error);
      socket.emit('errorMessage', error);
    }
  });

  if (browser) {
    browser.close();
  }

  clearInterval(backlogClearer);
  clearBacklog();
  result = {
    user: input.user,
    subdomain: input.subdomain,
    ID: ID,
    jobType: input.jobType,
    params: getParameters(),
    pages: log.reverse(),
  };
  await logCompleted(result, input.findOnly);
  if (pageSummaryCount)
    socket.emit('errorMessage', `${input.findOnly ? 'Found' : 'Changed'} ${pageSummaryCount} Summaries`);
  socket.emit('setState', { state: 'done', ID: input.findOnly ? null : ID, log: log });
}





app.use(express.json());
app.use((req, res, next) => {
  if (!req.get('Referrer')?.endsWith('libretexts.org/')) {
    res.status(401);
    return next(`Unauthorized ${req.get('x-forwarded-for')}`);
  }
  return next();
});
app.use(`${basePath}/Logs/`, express.static('BotLogs'));
app.post(`${basePath}/revert`, (req, res) => {
  console.log(req.body);
  const responseSocket = {
    emit: (type = '', message = '') => {
      let result = { type };
      if (typeof message === 'object') {
        result = { ...result, ...message };
      } else {
        result.message = message;
      }
      res.write(JSON.stringify(result));
    },
  };
  revert(req.body, responseSocket).then(() => res.end());
});


server.listen(port, () => {
  console.log(`Restarted ${timestamp('MM/DD hh:mm', new Date())} on port ${port}`);
});

//Set up Websocket connection using Socket.io
io.on('connection', function (socket) {
    socket.emit('welcome', `Connected to LibreTexts Bot Server.`);

    //Define callback events;
    socket.on('findReplace', (data) => jobHandler('findReplace', data, socket));
    socket.on('deadLinks', (data) => jobHandler('deadLinks', data, socket));
    socket.on('editorPreprocess', (data) => jobHandler('editorPreprocess', data, socket));
    socket.on('headerFix', (data) => jobHandler('headerFix', data, socket));
    socket.on('foreignImage', (data) => jobHandler('foreignImage', data, socket));
    socket.on('convertContainers', (data) => jobHandler('convertContainers', data, socket));
    socket.on('multipreset', (data) => jobHandler('multipreset', data, socket));
    socket.on('licenseReport', (data) => jobHandler('licenseReport', data, socket));

    socket.on('revert', (data) => revert(data, socket));
});

/**
 * Creates a Puppeteer Browser and authenticates the provided user in the browser context.
 *
 * @param {string} user - Username to authenticate as. 
 * @param {string} subdomain - Library shortname/identifier. 
 * @param {string} botID - Identifier of the bot requesting the browser.
 * @returns {Promise<puppeteer.Browser>} Browser instance, or null if errored.
 */
async function initializePuppeteer(user, subdomain, botID) {
  try {
    if (typeof (user) !== 'string' || user.length < 1) {
      throw (new Error(`Invalid user "${user}" provided.`));
    }
    if (typeof (subdomain) !== 'string' || subdomain.length < 1) {
      throw (new Error(`Invalid subdomain "${subdomain}" provided.`));
    }
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    const page = await browser.newPage();
    const token = LibreTexts.authenticate(user, subdomain);
    const redirect = `https://${subdomain}.libretexts.org/?no-cache`;
    await page.goto(
      `https://${subdomain}.libretexts.org/@api/deki/users/authenticate?x-deki-token=${token}&redirect=${redirect}`,
      PPTR_PAGE_TIMEOUT,
    );
    await page.close();
    return browser;
  } catch (e) {
    console.error(`[BOT ${botID}] Error initializing browser instance:`);
    console.error(e);
  }
  return null;
}

async function revert(input, socket) {
    if (!input.ID || !input.user) {
        socket.emit('Body missing parameters');
        return false;
    }

    if (!await fs.exists(`BotLogs/Completed/${input.user}/${input.ID}.json`)) {
        socket.emit('errorMessage', `JobID ${input.ID} is not valid for user ${input.user}.`);
        console.error(`JobID ${input.ID} is not valid for user ${input.user}.`);
        return false;
    }
    let job = await fs.readJSON(`BotLogs/Completed/${input.user}/${input.ID}.json`);
    if (job.status === 'reverted' && !input.restore) {
        socket.emit('confirmRestore', input);
        return false;
    }
    if (input.restore && !job.pages?.[0]?.headRevision) {
        socket.emit('errorMessage', `Restore cannot find headRevision. Procedure cannot continue.`);
        return false;
    }
    //based on previous job.status
    console.log(`${job.status !== 'reverted' ? 'Revert' : 'Restore'} [${input.ID}] from (${input.user})`);

    await async.mapLimit(job.pages, 50, async (page) => {
        let content = await LibreTexts.authenticatedFetch(page.path, 'info?dream.out.format=json', job.subdomain, input.user);
        if (!content.ok) {
            console.error('Could not get page info from ' + page.path);
            return false;
        }
        content = await content.json();

        const targetRevision = job.status !== 'reverted' ? page.revision - 1 : page.headRevision;
        page.headRevision = job.status !== 'reverted' ? content['@revision'] : undefined;
        let response = await LibreTexts.authenticatedFetch(page.path, `revert?fromrevision=${targetRevision}&dream.out.format=json`, job.subdomain, input.user, {
            method: 'POST',
        });
        if (!response.ok) {
            let error = await response.text();
            socket.emit('errorMessage', error);
        }
        /*    }
            else { //Page Conflict
              console.error(`Page Conflict ${page.path}`);
            }*/
    });

    let timestamp = new Date();
    job.status = input.restore ? 'restored' : 'reverted';
    job.lastAction = timestamp.toUTCString();
    await fs.writeJSON(`BotLogs/Completed/${input.user}/${input.ID}.json`, job);
    socket.emit('revertDone', {ID: input.ID, status: job.status, count: job.pages.length});
}

//Operator Functions
async function findReplace(input, content) {
    // content = content.replace(/\\n/g, '\n');

    let result = content.replaceAll(input.find, input.replace, input);
    if (result !== content) {
        /*      const diff = jsdiff.diffWords(content, result);
              console.log('----------------------------');
              diff.forEach(function(part) {
                // green for additions, red for deletions
                // grey for common parts
                var color = part.added ? 'green' :
                  part.removed ? 'red' : 'grey';
                process.stderr.write(part.value[color]);
              });*/
        return result;
    }
}

async function deadLinks(input, content) {
    let links = content.match(/<a.*?>.*?<\/a>/g);
    let result = content;
    let count = 0;
    await async.mapLimit(links, 10, async (link) => {
        let url = link.match(/(?<=<a.*?href=").*?(?=")/);
        if (url) {
            url = url[0];
            if (link.includes('Content Reuse Link:') || link === 'javascript:void(0);')
                return;
            if (!url.startsWith('http')) {
                url = `https://${input.subdomain}.libretexts.org${url.startsWith('/') ? '' : '/'}${url}`;
                // console.log(`Mod: ${url}`);
            }
            let response = '', failed;
            try {
                response = await new Promise(async (resolve, reject) => {
                    let seconds = 15;
                    let timeout = setTimeout(() => reject({
                        response: 'none',
                        status: `Timed Out ${seconds}s`,
                    }), seconds * 1000);
                    let result;
                    try {
                        result = await fetch(url, {method: 'HEAD'});
                    } catch (e) {
                        reject(e);
                        // console.error(e);
                    }
                    clearTimeout(timeout);
                    resolve(result);
                });
            } catch (e) {
                failed = true;
                response = e;
                // console.error(e);
            }
            if (!failed && response.ok && response.status < 400) {
                return;
            }
            if (response.code)
                console.log(`Dead ${response.code}! ${url}`);
            else if (response.status)
                console.log(`Dead ${response.status}! ${url}`);
            else
                console.log(`Dead ${response}! ${url}`);

            let replacement = link.match(/(?<=<a(| .*?)>).*?(?=<\/a>)/)[0];
            replacement = replacement.replace(/https?:\/\//, '');
            result = result.replace(link, replacement);
            count++;
        }
    });
    return [result, count];
}

async function headerFix(input, content) {
    let result = content;
    if (content.match(/<h1(?=(| .*?)>)/)) { //Header demote
        for (let i = 7; i >= 1; i--) {
            let previous = result;
            let regex = new RegExp(`<h${i}(?=(| .*?)>)`,
                'g');
            result = result.replace(regex, `<h${i + 1}`);
            regex = new RegExp(`</h${i}>`, 'g');
            result = result.replace(regex, `</h${i + 1}>`);
            if (result !== previous) {
                console.log(`${i} => ${i + 1}`);
            }
        }
    }
    else if (!content.includes('<h2') && content.match(/<h[1-9](?=(| .*?)>)/)) { //Header promote
        let current = 2;
        for (let i = 3; i <= 7; i++) {
            let previous = result;
            let regex = new RegExp(`<h${i}(?=(| .*?)>)`,
                'g');
            result = result.replace(regex, `<h${current}`);
            regex = new RegExp(`</h${i}>`, 'g');
            result = result.replace(regex, `</h${current}>`);
            if (result !== previous) {
                console.log(`${i} => ${current}`);
                current++;
            }
        }
    }
    return result;
}

async function foreignImage(input, content, path) {
    let images = content.match(/<img.*?>/g);
    let result = content;
    let count = 0;
    const currFiles = new Set();

    /* Read current list of files */
    try {
      let filesList = await LibreTexts.authenticatedFetch(
        path,
        `files?dream.out.format=json`,
        input.subdomain,
        input.user,
      );
      if (!filesList.ok) {
        const filesErr = await filesList.text();
        throw (new Error(filesErr));
      }
      filesList = await filesList.json();
      if (Array.isArray(filesList.file)) {
        filesList.file.forEach((file) => {
          if (typeof (file.filename) === 'string') {
            currFiles.add(file.filename);
          }
        });
      } else if (typeof (filesList.file) === 'object') {
        if (typeof (filesList.file.filename) === 'string') {
          currFiles.add(filesList.file.filename);
        }
      }
    } catch (e) {
      console.warn(`[Foreign Image Importer] WARN: Error retrieving files list. Imported files may not be unique.`);
      console.warn(e);
    }

    await async.mapLimit(images, 5, async (image) => {
        let url = image.match(/(?<=src=").*?(?=")/);
        let newImage = image;
        if (url) {
            url = url[0];
            if (!url.startsWith('http') || url.includes('libretexts.org'))
                return;


            let response = '', failed;
            try {
                response = await new Promise(async (resolve, reject) => {
                    let seconds = 15;
                    let timeout = setTimeout(() => reject({
                        response: 'none',
                        status: `Timed Out ${seconds}s`,
                    }), seconds * 1000);
                    let result;
                    try {
                        result = await fetch(url); //bad google drawings are still getting through
                        resolve(result);
                    } catch (e) {
                        failed = true;
                        reject(e);
                        // console.error(e);
                    }
                    clearTimeout(timeout);
                });
            } catch (e) {
                failed = true;
                response = e;
                // console.error(e);
            }
            console.log(url, response.status)
            if (!failed && response.ok && response.status < 400) {
                if (input.findOnly) {
                    result = 'findOnly';
                    count++;
                    return;
                }
                //upload image
                let foreignImage = await response.blob();

                //if content disposition header, use this for the filename
                let contentDisposition = response?.headers?.get('content-disposition');
                contentDisposition = contentDisposition?.match(/(?<=attachment; filename=").*?(?=")/)?.[0];

                let filename = contentDisposition || url.match(/(?<=\/)[^/]*?(?=$)/)[0];
                filename = LibreTexts.cleanPath(filename);

                /* Avoid overwrites of files with same name */
                if (currFiles.has(filename)) {
                  const splitName = filename.split('.');
                  const randomID = randomstring.generate({ length: 4, capitalization: 'lowercase' });
                  let extension;
                  let origName;
                  if (splitName.length > 1) {
                    origName = splitName.slice(0, splitName.length - 1);
                    extension = splitName[splitName.length - 1];
                  }
                  filename = `${origName ? origName : filename}_${randomID}${extension ? `.${extension}` : ''}`;
                }
                currFiles.add(filename);

                response = await LibreTexts.authenticatedFetch(path, `files/${filename}?dream.out.format=json`, input.subdomain, input.user, {
                    method: 'PUT',
                    body: foreignImage,
                });
                if (!response.ok) {
                    response = await response.text();
                    console.error(response);
                    return;
                }
                response = await response.json();
                //change path to new image
                let newSRC = `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`;

                newImage = newImage.replace(/(?<=src=").*?(?=")/, newSRC);
                newImage = newImage.replace(/(?<=<img.*?)\/>/, `fileid="${response['@id']}" \/>`);
                result = result.replace(image, newImage);
                count++;
            }

            /*else if (response.code)
                console.log(`Dead ${response.code}! ${url}`);
            else if (response.status)
                console.log(`Dead ${response.status}! ${url}`);
            else
                console.log(`Dead ${response}! ${url}`);*/
        }
    });
    return [result, count];
}

async function convertContainers(input, content) {
    if (!content.includes('boxtitle') && !content.includes('note1'))
        return [false, 0];

    const $ = cheerio.load(content);

    let result = '';
    let count = 0;

    let old = ['skills', 'example', 'exercise', 'objectives', 'query', 'note1', 'procedure', 'definition', 'theorem', 'lemma', 'notation', 'proposition'];

    old.forEach(type => {
        $(`div.${type}`).each((i, elem) => {
            count++;
            let container = $(elem);
            let oldType = type;

            let title = container.find('.boxtitle'); //if title exists
            if (!title || !title.length) {
                if (oldType === 'note1')
                    oldType = 'note2'
            }
            else {
                title = title[0];
                title.name = 'legend';
                title.attribs.class = 'boxlegend';
            }

            elem.tagName = `fieldset`;
            elem.attribs.class = `box${newType(oldType)}`;

        });
    });
    result = $.html();
    // console.log(result);
    // await fs.writeFile('test.html', result);

    return [result, count];

    function newType(type) {
        switch (type) {
            case 'skills':
                return 'objectives';
            case 'note1':
                return 'notewithlegend';
            case 'note2':
                return 'notewithoutlegend';
            default:
                return type;
        }
    }
}

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
 * Generates a License Report for a LibreText.
 *
 * @param {object} inputData - The input information received from the requester.
 * @param {socketio} socket - The websocket connection to the bot dashboard.
 * @param {string} botID - The bot's unique identifier.
 */
async function licenseReport(inputData, socket, botID) {
    const startTime = performance.now();
    let progress = 0;

    const input = {
        ...inputData,
        ID: botID,
    };

    socket.emit('setState', { state: 'gettingSubpages', ID: input.ID });
    const pages = await LibreTexts.getSubpages(
      input.root,
      input.user,
      { delay: true, flat: false, socket },
    );
    socket.emit('setState', { state: 'gotSubpages', ID: input.ID });

    if (typeof (pages) === 'object' && Object.prototype.hasOwnProperty.call(pages, 'id')) {
        input.bookID = pages.id;
    }

    let uniqueLicenses = [];
    let processedPages = 0;

    // 'Most restrictive' to 'least restrictive'
    const orderedLicenses = ['arr', 'fairuse', 'ccbyncnd', 'ccbynd', 'ck12', 'ccbyncsa', 'ccbync',
        'ccbysa', 'ccby', 'gnu', 'gnufdl', 'gnudsl', 'publicdomain'];
    const ncLicenses = ['ccbyncnd', 'ccbyncsa', 'ccbync', 'ck12'];
    const ndLicenses = ['ccbyncnd', 'ccbynd'];
    const fuLicenses = ['fairuse'];

    /**
     * Retrieves information about a content license given its internal name.
     *
     * @param {string} lic - The internal license identifier/name.
     * @param {string} [version='4.0'] - The license version, only applicable to Creative
     *  Commons (defaults to 4).
     * @returns {LicenseInfo} The license information object, returning 'Unknown' name
     *  fields if not found.
     */
    function getLicenseInfo(lic, version = '4.0') {
        switch(lic) {
            case 'publicdomain':
                return {
                    label: 'Public Domain',
                    link: '#',
                    raw: 'publicdomain',
                };
            case 'ccby':
                return {
                    label: 'CC BY',
                    link: `https://creativecommons.org/licenses/by/${version}/`,
                    raw: 'ccby',
                    version,
                };
            case 'ccbysa':
                return {
                    label: 'CC BY-SA',
                    link: `https://creativecommons.org/licenses/by-sa/${version}/`,
                    raw: 'ccbysa',
                    version,
                };
            case 'ccbync':
                return {
                    label: 'CC BY-NC',
                    link: `https://creativecommons.org/licenses/by-nc/${version}/`,
                    raw: 'ccbync',
                    version,
                };
            case 'ccbyncsa':
                return {
                    label: 'CC BY-NC-SA',
                    link: `https://creativecommons.org/licenses/by-nc-sa/${version}/`,
                    raw: 'ccbyncsa',
                    version,
                };
            case 'ccbynd':
                return {
                    label: 'CC BY-ND',
                    link: `https://creativecommons.org/licenses/by-nd/${version}/`,
                    raw: 'ccbynd',
                    version,
                };
            case 'ccbyncnd':
                return {
                    label: 'CC BY-NC-ND',
                    link: `https://creativecommons.org/licenses/by-nc-nd/${version}/`,
                    raw: 'ccbyncnd',
                    version,
                };
            case 'gnu':
                return {
                    label: "GPL",
                    link: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
                    raw: 'gnu',
                };
            case 'gnudsl':
                return {
                    label: "GNU Design Science License",
                    link: 'https://www.gnu.org/licenses/dsl.html',
                    raw: 'gnudsl',
                };
            case 'ck12':
                return {
                    label: 'CK-12 License',
                    link: 'https://www.ck12info.org/curriculum-materials-license/',
                    raw: 'ck12',
                }
            case 'gnufdl':
                return {
                    label: "GNU Free Documentation License",
                    link: 'https://www.gnu.org/licenses/fdl-1.3.en.html',
                    raw: 'gnufdl',
                };
            case 'fairuse':
                return {
                    label: "Fair Use",
                    link: 'https://fairuse.stanford.edu/overview/fair-use/what-is-fair-use/',
                    raw: 'fairuse',
                };
            case 'arr':
                return {
                    label: 'Other',
                    link: '#',
                    raw: 'arr',
                };
            case 'notset':
                return {
                    label: 'Undeclared',
                    link: '#',
                    raw: 'notset',
                };
            default: {
                return {
                    label: 'Unknown License',
                    link: '#',
                    raw: 'unknown'
                };
            }
        }
    }

    socket.emit('setState', {state: 'processPages', ID: input.ID});

    /**
     * Recursively counts the number of pages in a book hierarchy.
     *
     * @param {object} pageObject - An object with basic information about the page,
     *  retrieved from the CXone Expert API.
     * @returns {number} The total number of pages found.
     */
    function recursiveCount(pageObject) {
        let count = 1;
        if (Array.isArray(pageObject?.children)) {
            for (let i = 0, n = pageObject.children.length; i < n; i += 1) {
                count += recursiveCount(pageObject.children[i]);
            }
        }
        return count;
    }

    const pageCount = recursiveCount(pages);

    /**
     * Gathers and processes more detailed information about a page from the CXone Expert API.
     *
     * @param {string} pageHref - The URL of the page to process.
     * @returns {Promise<PageInfo>} Detailed information about the page, including licensing.
     */
    async function processPage(pageHref) {
        const newEntry = {
            license: null
        };
        const pageInfo = await LibreTexts.getAPI(pageHref, false, input.user);
        if (pageInfo.hasOwnProperty('tags') && Array.isArray(pageInfo.tags)) {
            const foundLicTag = pageInfo.tags.find(item => item.includes('license:'));
            const foundLicVer = pageInfo.tags.find(item => item.includes('licenseversion:'));
            let license = null;
            let licenseVersion = null;
            if (foundLicTag) {
                license = foundLicTag.replace('license:', '');
                licenseVersion = '4.0';
                if (foundLicVer) {
                    licenseVersion = foundLicVer.replace('licenseversion:', '');
                    licenseVersion = licenseVersion.slice(0,1) + '.' + licenseVersion.slice(1);
                }
            } else {
              license = 'notset';
            }
            const existingUnique = uniqueLicenses.find((item) => {
                if (item.raw === license) {
                    if (!item.version || (item.version && item.version === licenseVersion)) {
                        return item;
                    }
                }
                return false;
            });
            const newLicenseInfo = getLicenseInfo(license, licenseVersion);
            if (!existingUnique) uniqueLicenses.push(newLicenseInfo);
            newEntry.license = newLicenseInfo;
        }
        if (pageInfo.id) newEntry.id = pageInfo.id;
        if (pageInfo.url) newEntry.url = pageInfo.url;
        if (pageInfo.title) newEntry.title = pageInfo.title;
        return newEntry;
    }

    /**
     * Recursively gathers information on a page hierarchy.
     *
     * @param {object} pageObject - A page hierarchy containing at least page URLs.
     * @returns {Promise<PageInfo>} The page hierarchy with detailed information.
     */
    async function recurseSection(pageObject) {
        const newEntry = await processPage(pageObject.url);
        newEntry.children = [];
        if (Array.isArray(pageObject.children) && pageObject.children.length > 0) {
            await async.mapLimit(pageObject.children, 5, async (subpage) => {
                const newChildEntry = await recurseSection(subpage);
                newEntry.children.push(newChildEntry);
            });
        }
        processedPages += 1;
        const currentProgress = Math.round(processedPages / pageCount * 100);
        if (progress < currentProgress) {
            progress = currentProgress;
            socket.volatile.emit('setState', { state: 'processing', percentage: currentProgress });
        }
        return newEntry;
    }

    const toc = await recurseSection(pages);
    socket.emit('setState', { state: 'processedPages', ID: input.ID });
    socket.emit('setState', { state: 'postProcessing', ID: input.ID });

    uniqueLicenses = uniqueLicenses.map((item) => {
        return {
            ...item,
            count: 0,
            percent: 0,
        }
    });

    /**
     * Recursively updates unique license counts in a page hierarchy.
     *
     * @param {PageInfo} pageObject - The page hierarchy object.
     */
    async function recurseLicense(pageObject) {
        if (pageObject.license?.raw) {
            const foundUnique = uniqueLicenses.findIndex((uniqLic) => {
                if (uniqLic.raw === pageObject.license?.raw) {
                    if (!uniqLic.version || (uniqLic.version && uniqLic.version === pageObject.license?.version)) {
                        return true;
                    }
                }
                return false;
            });
            if (foundUnique >= 0) {
                uniqueLicenses[foundUnique].count = uniqueLicenses[foundUnique].count + 1;
            }
        }
        if (Array.isArray(pageObject.children) && pageObject.children.length > 0) {
            await async.mapLimit(pageObject.children, 5, async (subpage) => {
                await recurseLicense(subpage);
            });
        }
    }

    await recurseLicense(toc);

    let mostRestrIdx = null;
    uniqueLicenses.forEach((item, idx) => {
        let licensePercent = (item.count / pageCount) * 100;
        if (!isNaN(licensePercent)) licensePercent = parseFloat(licensePercent.toFixed(1));
        uniqueLicenses[idx].percent = licensePercent;
        const findMostRestr = orderedLicenses.findIndex(lic => lic === item.raw);
        if ((findMostRestr >= 0) && (findMostRestr < mostRestrIdx || mostRestrIdx === null)) {
            mostRestrIdx = findMostRestr;
        }
    });
    const mostRestrictive = getLicenseInfo(orderedLicenses[mostRestrIdx]);
    let ncRestriction = false;
    let ndRestriction = false;
    let fuRestriction = false;
    const foundSpecialRestrictions = [];
    uniqueLicenses.forEach((item) => {
        if (item.raw) {
            if (!ncRestriction && ncLicenses.includes(item.raw)) {
                ncRestriction = true;
                foundSpecialRestrictions.push('noncommercial');
            }
            if (!ndRestriction && ndLicenses.includes(item.raw)) {
                ndRestriction = true;
                foundSpecialRestrictions.push('noderivatives');
            }
            if (!fuRestriction && fuLicenses.includes(item.raw)) {
                fuRestriction = true;
                foundSpecialRestrictions.push('fairuse');
            }
        }
    });


    uniqueLicenses.sort((a, b) => {
        if (a.percent > b.percent) {
            return -1;
        }
        if (a.percent < b.percent) {
            return 1;
        }
        return 0;
    });

    toc.totalPages = pageCount;
    socket.emit('setState', {state: 'postProcessed', ID: input.ID});

    const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base'
    });

    /**
     * Recursively sorts the pages in a hierarchy by URL.
     *
     * @param {PageInfo} pageObject - The page hierarchy to work on.
     */
    async function recurseSort(pageObject) {
        if (Array.isArray(pageObject?.children) && pageObject.children.length > 0) {
            pageObject.children.sort((a,b) => collator.compare(a.url, b.url));
            for (let idx = 0; idx < pageObject.children.length; idx++) {
                await recurseSort(pageObject.children[idx]);
            }
        }
    }

    await recurseSort(toc);

    /**
     * Recursively creates an HTML string containing a list of page hierarchy license information.
     *
     * @param {PageInfo} pageObject - The page hierarchy to build from
     * @returns {string} The HTML string of the license information list.
     */
    function recurseOutput(pageObject) {
        let newString = `<li><a href="${pageObject.url}" target="_blank">${pageObject.title}</a>`;
        if (pageObject.license) {
            newString = `
              ${newString} — <a href="${pageObject.license?.link}" target="_blank" rel="noreferrer">
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

    let reportHTML = '';
    let overviewHTML = '';
    if (input.createReportPage === true || input.generateReportPDF === true) {
        socket.emit('setState', { state: 'formattingReport', ID: input.ID });
        reportHTML = `<h2>Overview</h2>`;
        overviewHTML = `
          <p>
            <strong>Title:</strong> <a href="${toc.url}" target="_blank" rel="noreferrer">${toc.title}</a>
          </p>
          <p>
            <strong>Webpages:</strong> ${pageCount}
          </p>
        `;
        if (ncRestriction || ndRestriction || fuRestriction) { // build special restrictions list
            let restrCount = 0;
            overviewHTML = `${overviewHTML}<p><strong>Applicable Restrictions:</strong> `;
            if (ncRestriction) {
                if (restrCount > 0) {
                  overviewHTML = `${overviewHTML}, `;
                }
                overviewHTML = `${overviewHTML}Noncommercial`;
                restrCount += 1;
            }
            if (ndRestriction) {
                if (restrCount > 0) {
                  overviewHTML = `${overviewHTML}, `;
                }
                overviewHTML = `${overviewHTML}No Derivatives`;
                restrCount += 1;
            }
            if (fuRestriction) {
                if (restrCount > 0) {
                  overviewHTML = `${overviewHTML}, `;
                }
                overviewHTML = `${overviewHTML}Fair Use`;
                restrCount += 1;
            }
            overviewHTML = `${overviewHTML}</p>`
        }
        overviewHTML = `${overviewHTML}<p><strong>All licenses found:</strong></p><ul>`;
        uniqueLicenses.forEach((item) => {
            overviewHTML = `${overviewHTML}<li><a href="${item.link}" target="_blank" rel="noreferrer">${item.label}`;
            if (item.version) {
                overviewHTML = `${overviewHTML} ${item.version}`;
            }
            overviewHTML = `${overviewHTML}</a>: ${item.percent}% (${item.count} ${item.count > 1 ? 'pages': 'page'})</a></li>`;
        });
        overviewHTML = `${overviewHTML}</ul>`;
        reportHTML = `${reportHTML}${overviewHTML}`;
        let detailedLink = input.root;
        if (!detailedLink.endsWith('/')) {
          detailedLink = `${detailedLink}/`;
        }
        detailedLink = `${detailedLink}zz%3A_Back_Matter/30%3A_Detailed_Licensing`;
        overviewHTML = `
          <p>
            <em>A detailed breakdown of this resource's licensing can be found in <strong><a href="${detailedLink}" rel="noreferrer">Back Matter/Detailed Licensing</a></strong></em>.
          </p>
        `;
        reportHTML = `${reportHTML}<h2>By Page</h2><div style="column-count: 2; margin-top: 1em;"><ul style="margin: 0;">`;
        reportHTML = `${reportHTML}${recurseOutput(toc)}`;
        reportHTML = `${reportHTML}</ul></div>`;
        socket.emit('setState', { state: 'formattedReport', ID: input.ID });
    }


    if (input.createReportPage === true) {
        socket.emit('setState', {state: 'updatingReportPage', ID: input.ID});
        const rootPath = input.root.replace(`https://${input.subdomain}.libretexts.org/`, '');
        const overviewComment = `[BOT ${input.ID}] Updated Licensing Overview`;
        const detailedComment = `[BOT ${input.ID}] Updated Detailed Licensing`;
        const createOverview = await LibreTexts.authenticatedFetch(
          `${rootPath}/00:_Front_Matter/04:_Licensing`,
          `contents?dream.out.format=json&title=Licensing&edittime=now&comment=${encodeURIComponent(overviewComment)}`,
          input.subdomain,
          'LibreBot',
          { method: 'POST', body: overviewHTML },
        );
        const createDetailed = await LibreTexts.authenticatedFetch(
          `${rootPath}/zz:_Back_Matter/30:_Detailed_Licensing`,
          `contents?dream.out.format=json&title=${encodeURIComponent('Detailed Licensing')}&edittime=now&comment=${detailedComment}`,
          input.subdomain,
          'LibreBot',
          { method: 'POST', body: reportHTML },
        );
        if (!createOverview.ok) {
            console.error('Could not create licensing overview page:');
            const error = await createOverview.text();
            console.error(error);
            socket.emit('errorMessage', {
                noAlert: false,
                message: error
            });
        }
        if (!createDetailed.ok) {
            console.error('Could not create detailed licensing page:');
            const error = await createDetailed.text();
            console.error(error);
            socket.emit('errorMessage', {
                noAlert: false,
                message: error
            });
        }
        const updateOptions = {
            method: 'PUT',
            headers: {'content-type': 'application/xml; charset=utf-8'},
            body: `<tags><tag value='article:topic'/></tags>`
        };
        const updateOverviewTags = await LibreTexts.authenticatedFetch(
          `${rootPath}/00:_Front_Matter/04:_Licensing`,
          `tags`,
          input.subdomain,
          'LibreBot',
          updateOptions,
        );
        const updateDetailedTags = await LibreTexts.authenticatedFetch(
          `${rootPath}/zz:_Back_Matter/30:_Detailed_Licensing`,
          `tags`,
          input.subdomain,
          'LibreBot',
          updateOptions,
        );
        if (!updateOverviewTags.ok) {
            console.error('Could not update licensing overview tags.');
            const error = await updateOverviewTags.text();
            console.error(error);
            socket.emit('errorMessage', {
                noAlert: false,
                message: error,
            });
        }
        if (!updateDetailedTags.ok) {
            console.error('Could not update detailed licensing tags.');
            const error = await updateDetailedTags.text();
            console.error(error);
            socket.emit('errorMessage', {
                noAlert: false,
                message: error,
            });
        }
        socket.emit('setState', { state: 'updatedReportPage', ID: input.ID });
    }

    /**
     * Creates a PDF of the new License Report using Puppeteer, then attaches
     * it to the book coverpage.
     */
    async function generatePDF() {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(`
            <!DOCTYPE HTML>
            <html lang='en'>
                <head>
                    <meta charset='utf-8'>
                    <title>${toc.title} - Content Licensing Report</title>
                    <style>
                        html {
                            font-family: sans-serif;
                        }
                        body {
                            font-size: 10pt;
                            font-family: Verdana, Tahoma, Arial, serif;
                            font-weight: lighter;
                        }
                        body a {
                            text-decoration: none;
                        }
                        #libreLogo {
                            display: block;
                            margin-left: auto;
                            margin-right: auto;
                            height: 100px;
                        }
                        #pageHeader {
                            text-align: center;
                        }
                        body h1,h2,h3,h4,h5,h6 {
                            font-weight: 500;
                        }
                    </style>
                </head>
                <body>
                    <img src='https://batch.libretexts.org/logo.png' id='libreLogo' />
                    <h1 id='pageHeader'><em>Content Licensing Report</em></h1>
                    ${reportHTML}
                </body>
            </html>
        `, {
            waitUntil: ['domcontentloaded', 'networkidle0'],
        });
        const newPDF = await page.pdf({
            format: 'Letter',
            margin: {
                top: '48px',
                left: '48px',
                bottom: '48px',
                right: '48px'
            },
        });
        await browser.close();
        const rootPath = input.root.replace(`https://${input.subdomain}.libretexts.org/`, '');
        const attachReport = await LibreTexts.authenticatedFetch(
          rootPath,
          `files/content-licensing-report.pdf?dream.out.format=json`,
          input.subdomain,
          'LibreBot',
          { method: 'PUT', body: newPDF },
        );
        if (!attachReport.ok) {
            console.error('Could not attach licensing report PDF.');
            const error = await attachReport.text();
            console.error(error);
            socket.emit('errorMessage', {
                noAlert: false,
                message: error
            });
        }
    }

    if (input.generateReportPDF === true) {
        socket.emit('setState', {state: 'generatingPDF', ID: input.ID});
        await generatePDF();
        socket.emit('setState', {state: 'generatedPDF', ID: input.ID});
    }

    const endTime = performance.now();
    const licenseReportData = {
        id: input.bookID,
        library: input.subdomain,
        coverID: `${input.subdomain}-${input.bookID}`,
        timestamp: new Date(),
        runtime: `${endTime - startTime} ms`,
        meta: {
            mostRestrictiveLicense: mostRestrictive, // TODO: Deprecated?,
            specialRestrictions: foundSpecialRestrictions,
            licenses: uniqueLicenses
        },
        text: toc,
    };
    if (input.hasOwnProperty('bookID')) {
        const fileOutName = filenamify(input.subdomain + '-' + input.bookID);
        await fs.ensureDir(`./public/licensereports`);
        await fs.writeJSON(`./public/licensereports/${fileOutName}.json`, licenseReportData);
    }
    socket.emit('licenseReportData', licenseReportData);
    socket.emit('setState', {
        state: 'done',
        ID: (input.createReportPage || input.generateReportPDF) ? input.ID : null
    });
    await logCompleted(input);
}

/**
 * Performs HTML preprocessing on an existing page by using the library's CKEditor instance
 * via Puppeteer.
 *
 * @param {object} botID - Identifier of the currently running bot job.
 * @param {string} url - URL of the page to work on.
 * @param {puppeteer.Browser} browser - Browser instance to use.
 * @returns {Promise<boolean>} True if successful, false if errored.
 */
async function editorPreprocess(botID, url, browser) {
  if (typeof (url) !== 'string' || url.length < 1) {
    console.error(`[BOT ${botID}] Invalid url "${url}" provided.`) // TODO
    return false;
  }
  if (!browser) {
    console.error(`[BOT ${botID}] Invalid browser instance provided.`);
    return false;
  }
  try {
    const browserPage = await browser.newPage();
    browserPage.on('dialog', pptrDialogHandler);
    await browserPage.goto(url, PPTR_LOAD_SETTINGS);
    await browserPage.keyboard.down('Control');
    await browserPage.keyboard.press('e');
    await browserPage.keyboard.up('Control');
    await sleep(5000); // let CKEditor load
    await browserPage.keyboard.down('Control');
    await browserPage.keyboard.press('s');
    await browserPage.keyboard.up('Control');
    await browserPage.waitForNavigation(PPTR_LOAD_SETTINGS); // wait for reload-on-save
    await browserPage.close();
    await sleep(API_THROTTLE_TIME); // throttle
    return true;
  } catch (e) {
    console.error(`[BOT ${botID}] Error encountered while performing HTML preprocess:`);
    console.error(e);
  }
  return false;
}

async function addPageIdentifierClass(subdomain, path, content) {
    const $ = cheerio.load(content);

    let result = '';
    let current = await LibreTexts.getAPI(`https://${subdomain}.libretexts.org/${path}`, false, 'LibreBot');
    $('p:not(.mt-script-comment), :header, td, li').addClass(`lt-${subdomain}-${current.id}`);

    result = $.html();
    // console.log(result);
    // await fs.writeFile('test.html', result);

    return result;
}

//Helper Logging functions
async function logStart(input, isDisabled) {
    let timestamp = new Date();
    input.timestamp = timestamp.toUTCString();
    let ID = '' + Math.random().toString(36).substr(2);
    if (!isDisabled) {
        await fs.ensureDir(`BotLogs/Working/${input.user}`);
        await fs.writeJSON(`BotLogs/Working/${input.user}/${ID}.json`, input);
    }
    return ID;
}

async function logProgress(result, isDisabled) {
    if (isDisabled)
        return false;
    let timestamp = new Date();
    result.timestamp = timestamp.toUTCString();
    await fs.ensureDir(`BotLogs/Completed/${result.user}`);
    await fs.writeJSON(`BotLogs/Completed/${result.user}/${result.ID}.json`, result);
}

async function logCompleted(result, isDisabled) {
    if (isDisabled)
        return false;
    let timestamp = new Date();
    result.timestamp = timestamp.toUTCString();
    result.status = 'completed';
    await fs.ensureDir(`BotLogs/Completed/${result.user}`);
    await fs.writeJSON(`BotLogs/Completed/${result.user}/${result.ID}.json`, result);
    await fs.remove(`BotLogs/Working/${result.user}/${result.ID}.json`);
    await fs.appendFile(`BotLogs/Users/${result.user}.csv`, `${result.ID},`);
    if (result.pages)
        delete result.pages;
    await fs.appendFile(`BotLogs/Users/${result.user}.json`, JSON.stringify(result) + '\n');
}


String.prototype.replaceAll = function (search, replacement, input) {
    const target = this;
    let b4 = search, regex;

    if (input.regex)
        search = search.replace(/^\/|\/$/g, '');
    else
        search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


    regex = new RegExp(search, 'gm');
    let temp = target.replace(regex, replacement);
    // console.log(b4, search);
    if (temp === target)
        try {
            search = LibreTexts.encodeHTML(search);
            regex = new RegExp(search, 'gm');
            temp = temp.replace(regex, replacement);
        } catch (e) {

        }
    if (temp === target)
        try {
            search = LibreTexts.encodeHTML(search);
            regex = new RegExp(search, 'gm');
            temp = temp.replace(regex, replacement);
        } catch (e) {

        }
    return temp;

    /*	if (input.newlines) {
        search = search.replace(/\\\\n/g, "\n"); //add newlines
        if (input.isWildcard) {
          search = search.replace(/\\\?/g, "[\\s\\S]"); //wildcard single
          search = search.replace(/\\\*!/g, "[\\s\\S]*?"); //wildcard multi
        }
      }
      else if (input.isWildcard) {
        search = search.replace(/\\\?/g, "."); //wildcard single
        search = search.replace(/\\\*!/g, ".*?"); //wildcard multi
      }
      let temp = target.replace(new RegExp(search, 'g'), replacement);*/
};
