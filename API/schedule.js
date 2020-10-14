const scheduler = require('node-schedule');
const fetch = require("node-fetch");
const timestamp = require("console-timestamp");
const port = null;

const now1 = new Date();
const schedule = {
	'30 0 * * sat': 'bio',
	'30 12 * * sat': 'biz',
	'30 0 * * sun': 'chem',
	'30 12 * * sun': 'eng',
	'30 0 * * mon': 'espanol',
	'30 12 * * mon': 'geo',
	'30 0 * * tue': 'human',
	// '30 12 * * tue': 'k12',
	'30 0 * * wed': 'math',
	'30 12 * * wed': 'med',
	'30 0 * * thu': 'phys',
	'30 12 * * thu': 'socialsci',
	'30 0 * * fri': 'stats',
	'30 12 * * fri': 'workforce',
};
let times = Object.keys(schedule);
for (let i = 0; i < times.length; i++) {
	scheduler.scheduleJob(times[i], () => {
		
		const nocache = false;//beginning of month
		try {
			console.log(`Running Refresh ${nocache ? 'no-cache' : ''} for ${schedule[times[i]]}`);
			fetch(`https://batch.libretexts.org/print/Refresh`, {
				method: 'PUT',
				body: JSON.stringify({
					"libraries": {[schedule[times[i]]]: {courses: true, bookshelves: true}},
					"nocache": nocache
				}),
				headers: {origin: 'https://api.libretexts.org'}
			});
		}
		catch (e) {
			console.error(`FAILED Refresh ${nocache ? 'no-cache' : ''} for ${schedule[times[i]]}`);
			console.error(e);
		}
	});
	// console.log(`Set ${schedule[times[i]]} for ${times[i]}`);
}
console.log(`Restarted ${timestamp('MM/DD hh:mm', now1)}`);
setInterval(() => {
}, 10000);