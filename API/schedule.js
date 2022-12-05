/**
 * @file Provisions a scheduling service to run functions in various LibreVerse technologies
 * at specified intervals.
 * @author LibreTexts
 */
const scheduler = require('node-schedule');
const fetch = require('node-fetch');
const timestamp = require('console-timestamp');
const secure = require('./secure.json');

const MONTHS = { ODD: '1,3,5,7,9,11', EVEN: '2,4,6,8,10,12' };
const BATCH_START_TIME = '30 0';

const batchSchedule = {
  bio: { pattern: 'ODD', start: 1 },
  biz: { pattern: 'ODD', start: 5 },
  chem: { pattern: 'ODD', start: 9 },
  eng: { pattern: 'ODD', start: 13 },
  espanol: { pattern: 'ODD', start: 17, customTargets: ['home'] },
  geo: { pattern: 'ODD', start: 19 },
  human: { pattern: 'ODD', start: 23 },
  k12: { pattern: 'ODD', start: 27 },
  math: { pattern: 'EVEN', start: 1 },
  med: { pattern: 'EVEN', start: 5 },
  phys: { pattern: 'EVEN', start: 9 },
  socialsci: { pattern: 'EVEN', start: 13 },
  stats: { pattern: 'EVEN', start: 17 },
  workforce: { pattern: 'EVEN', start: 21 },
};

/**
 * @typedef {object} BatchScheduleConfig
 * @property {('EVEN'|'ODD')} pattern - Run in even or odd months.
 * @property {number} start - Day of month to start batch on.
 * @property {string[]} [customTargets] - Custom list of batch targets.
 */

/**
 * Adds the scheduler job for a given library and target.
 *
 * @param {string} library - The LibreTexts library shortened identifier.
 * @param {string} target - The area of the library to batch.
 * @param {BatchScheduleConfig} config - The library's schedule configuration. 
 */
function scheduleLibraryBatch(library, target, config) {
  const months = MONTHS[config.pattern];
  const date = target === 'courses' ? config.start + 2 : config.start;
  const time = `${BATCH_START_TIME} ${date} ${months} *`;
  scheduler.scheduleJob(`${library}-${target}`, time, () => {
    try {
      console.log(`Running Refresh no-cache for ${library}/${target}`);
      fetch('https://batch.libretexts.org/print/Refresh', {
        method: 'PUT',
        body: JSON.stringify({
          libraries: { [library]: { [target]: true } },
          nocache: true,
        }),
        headers: { origin: 'https://api.libretexts.org' },
      });
    } catch (e) {
      console.error(`FAILED Refresh no-cache for ${library}/${target}`);
      console.error(e);
    }
  });
}

/**
 * Adds the scheduler job to sync LibreCommons with library listings.
 */
function scheduleCommonsLibrarySync() {
  scheduler.scheduleJob('commons-libraries', '30 6 * * *', () => {
    try {
      console.log('Running LibreCommons Libraries Sync');
      fetch('https://commons.libretexts.org/api/v1/commons/syncwithlibs/automated', {
        method: 'PUT',
        headers: {
          origin: 'https://api.libretexts.org',
          'X-Requested-With': 'XMLHttpRequest',
          Authorization: `Bearer ${secure.conductor_key}`,
        },
      }).then((res) => res.json()).then((libSyncRes) => {
        if (libSyncRes.err === false) {
          console.log(`Finished LibreCommons Libraries Sync: ${libSyncRes.msg}`);
        } else {
          throw (new Error(libSyncRes.errMsg));
        }
      });
    } catch (e) {
      console.error('FAILED LibreCommons Libraries Sync');
      console.error(e);
    }
  });
}

/**
 * Adds the scheduler job to sync LibreCommons with LibreTexts homework/assessment systems.
 */
function scheduleCommonsHomeworkSync() {
  scheduler.scheduleJob('commons-homework', '30 0 * * *', () => {
    try {
      console.log('Running LibreCommons Homework Sync');
      fetch('https://commons.libretexts.org/api/v1/commons/homework/sync/automated', {
        method: 'PUT',
        headers: {
          origin: 'https://api.libretexts.org',
          'X-Requested-With': 'XMLHttpRequest',
          Authorization: `Bearer ${secure.conductor_key}`,
        },
      }).then((res) => res.json()).then((homeworkSyncRes) => {
        if (homeworkSyncRes.err === false) {
          console.log(`Finished LibreCommons Homework Sync: ${homeworkSyncRes.msg}`);
        } else {
          throw (new Error(homeworkSyncRes.errMsg));
        }
      });
    } catch (e) {
      console.error('FAILED LibreCommons Homework Sync');
      console.error(e);
    }
  });
}

/**
 * Adds the scheduler job to process daily Conductor Alerts.
 */
function scheduleConductorDailyAlerts() {
  scheduler.scheduleJob('conductor-alerts', '0 8 * * *', () => {
    try {
      console.log('Running Conductor Daily Alerts Processing');
      fetch('https://commons.libretexts.org/api/v1/alerts/processdaily', {
        method: 'PUT',
        headers: {
          origin: 'https://api.libretexts.org',
          'X-Requested-With': 'XMLHttpRequest',
          Authorization: `Bearer ${secure.conductor_key}`,
        },
      }).then((res) => res.json()).then((alertsProcessRes) => {
        if (alertsProcessRes.err === false) {
          console.log(`Finished Conductor Daily Alerts Processing: ${alertsProcessRes.msg}`);
        } else {
          throw (new Error(alertsProcessRes.errMsg));
        }
      });
    } catch (e) {
      console.error('FAILED Conductor Daily Alerts Processing');
      console.error(e);
    }
  });
}

/**
 * Adds the scheduler job to sync Conductor's local C-ID database with the official list.
 */
function scheduleConductorCIDDescriptorsSync() {
  scheduler.scheduleJob('conductor-cids', '0 1 15 * *', () => {
    try {
      console.log('Running Conductor C-ID Descriptors Sync');
      fetch('https://commons.libretexts.org/api/v1/c-ids/sync/automated', {
        method: 'PUT',
        headers: {
          origin: 'https://api.libretexts.org',
          'X-Requested-With': 'XMLHttpRequest',
          Authorization: `Bearer ${secure.conductor_key}`,
        },
      }).then((res) => res.json()).then((descriptorSyncRes) => {
        if (descriptorSyncRes.err === false) {
          console.log(`Finished Conductor C-ID Descriptors Sync: ${descriptorSyncRes.msg}`);
        } else {
          throw (new Error(descriptorSyncRes.errMsg));
        }
      });
    } catch (e) {
      console.error('FAILED Conductor C-ID Descriptors Sync');
      console.error(e);
    }
  });
}

/**
 * Initializes the Schedule service and registers all defined jobs.
 */
function initialize() {
  // Schedule Library Batch jobs
  Object.keys(batchSchedule).forEach((library) => {
    const config = batchSchedule[library];
    const targets = config.customTargets || ['bookshelves', 'courses'];
    targets.forEach((target) => scheduleLibraryBatch(library, target, config));
  });
  // Schedule LibreCommons sync jobs
  scheduleCommonsLibrarySync();
  scheduleCommonsHomeworkSync();
  // Schedule Conductor tasks
  scheduleConductorDailyAlerts();
  scheduleConductorCIDDescriptorsSync();
  console.log('All jobs scheduled.');
}

console.log(`Restarted ${timestamp('MM/DD hh:mm', new Date())}`);
initialize();
setInterval(() => {
  // keep-alive
}, 10000);
