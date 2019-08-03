const cron = require('node-cron');
const fetch = require("node-fetch");
const timestamp = require("console-timestamp");


const now1 = new Date();
const schedule = {
	'30 0 * * Saturday': 'bio',
	'30 12 * * Saturday': 'biz',
	'30 0 * * Sunday': 'chem',
	'30 12 * * Sunday': 'eng',
	'30 0 * * Monday': 'espanol',
	'30 12 * * Monday': 'geo',
	'30 0 * * Tuesday': 'human',
	// '30 12 * * Tuesday': 'law',
	'30 0 * * Wednesday': 'math',
	'30 12 * * Wednesday': 'med',
	'30 0 * * Thursday': 'phys',
	'30 12 * * Thursday': 'socialsci',
	'30 0 * * Friday': 'stats',
	'30 12 * * Friday': 'workforce',
};
let times = Object.keys(schedule);
for (let i = 0; i < times.length; i++) {
	cron.schedule(times[i], () => {
		
		if (now1.getDate() <= 7) { //beginning of month
			console.log(`Running Refresh no-cache for ${schedule[times[i]]}`);
			fetch(`https://batch.libretexts.org/print/Refresh=${schedule[times[i]]}/all?no-cache`, {
				headers: {origin: 'https://api.libretexts.org'}
			});
		}
		else {
			console.log(`Running Refresh for ${schedule[times[i]]}`);
			fetch(`https://batch.libretexts.org/print/Refresh=${schedule[times[i]]}/all`, {
				headers: {origin: 'https://api.libretexts.org'}
			});
		}
	});
	// console.log(`Set ${schedule[times[i]]} for ${times[i]}`);
}
console.log("Restarted " + timestamp('MM/DD hh:mm', now1));
