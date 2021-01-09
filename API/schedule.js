const scheduler = require('node-schedule');
const fetch = require("node-fetch");
const timestamp = require("console-timestamp");
const port = null;

const now1 = new Date();
const schedule = {
    'bio': {day: 'sat', hour: 0},
    'biz': {day: 'sat', hour: 12},
    'chem': {day: 'sun', hour: 0},
    'eng': {day: 'sun', hour: 12},
    'espanol': {day: 'mon', hour: 0},
    'geo': {day: 'mon', hour: 12},
    'human': {day: 'tue', hour: 0},
    'k12': {day: 'tue', hour: 12},
    'math': {day: 'wed', hour: 0},
    'med': {day: 'wed', hour: 12},
    'phys': {day: 'thu', hour: 0},
    'socialsci': {day: 'thu', hour: 12},
    'stats': {day: 'fri', hour: 0},
    'workforce': {day: 'fri', hour: 12},
};
for (const library in schedule) {
    let timeSpec = schedule[library];
    if (library === 'espanol')
        doSchedule('home', 0);
    else {
        doSchedule('bookshelves', 0);
        doSchedule('courses', 6);
    }
    
    function doSchedule(target, timeOffset) {
        const time = `30 ${timeSpec.hour + timeOffset} * * ${timeSpec.day}`
        scheduler.scheduleJob(time, () => {
            const nocache = false;//beginning of month
            try {
                console.log(`Running Refresh ${nocache ? 'no-cache' : ''} for ${library}/${target}`);
                fetch(`https://batch.libretexts.org/print/Refresh`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        "libraries": {[library]: {[target]: true}},
                        "nocache": nocache
                    }),
                    headers: {origin: 'https://api.libretexts.org'}
                });
            } catch (e) {
                console.error(`FAILED Refresh ${nocache ? 'no-cache' : ''} for ${library}/${target}`);
                console.error(e);
            }
        });
        //console.log(`Set ${time} for ${library}/${target}`);
    }
}
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)}`);
setInterval(() => {
}, 10000);
