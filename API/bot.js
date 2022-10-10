/**
 * @file Defines bots for authorized users to perform curation
 *  activities on LibreTexts libraries.
 * @author LibreTexts <info@libretexts.org>
 */
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
