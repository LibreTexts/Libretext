/**
 * @file Provisions a scheduling service to run functions in various LibreVerse technologies
 * at specified intervals.
 * @author LibreTexts
 */
const scheduler = require('node-schedule');
const fetch = require('node-fetch');
const timestamp = require('console-timestamp');
const secure = require('./secure.json');

const batchSchedule = {
  bio: { day: 'sat', hour: 0 },
  biz: { day: 'sat', hour: 12 },
  chem: { day: 'sun', hour: 0 },
  eng: { day: 'sun', hour: 12 },
  espanol: { day: 'mon', hour: 0 },
  geo: { day: 'mon', hour: 12 },
  human: { day: 'tue', hour: 0 },
  k12: { day: 'tue', hour: 12 },
  math: { day: 'wed', hour: 0 },
  med: { day: 'wed', hour: 12 },
  phys: { day: 'thu', hour: 0 },
  socialsci: { day: 'thu', hour: 12 },
  stats: { day: 'fri', hour: 0 },
  workforce: { day: 'fri', hour: 12 },
};

/**
 * Adds the scheduler job for a given library and target.
 *
 * @param {string} library - The LibreTexts library shortened identifier.
 * @param {string} target - The area of the library to batch.
 * @param {object} timeSpec - An object describing the day and time to run the batch job.
 * @param {number} timeOffset - An offset to apply to the batch job's schedule.
 */
function scheduleLibraryBatch(library, target, timeSpec, timeOffset) {
  const time = `30 ${timeSpec.hour + timeOffset} * * ${timeSpec.day}`;
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
 * Initializes the Schedule service and registers all defined jobs.
 */
function initialize() {
  // Schedule Library Batch jobs
  Object.keys(batchSchedule).forEach((library) => {
    const timeSpec = batchSchedule[library];
    if (library !== 'espanol') {
      scheduleLibraryBatch(library, 'bookshelves', timeSpec, 0);
      scheduleLibraryBatch(library, 'courses', timeSpec, 6);
    } else {
      scheduleLibraryBatch(library, 'home', timeSpec, 0);
    }
  });
  // Schedule LibreCommons sync jobs
  scheduleCommonsLibrarySync();
  scheduleCommonsHomeworkSync();
  // Schedule Conductor tasks
  scheduleConductorDailyAlerts();
  console.log('All jobs scheduled.');
}

console.log(`Restarted ${timestamp('MM/DD hh:mm', new Date())}`);
initialize();
setInterval(() => {
  // keep-alive
}, 10000);
