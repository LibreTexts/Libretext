const cron = require('node-cron');
const fetch = require("node-fetch");
const timestamp = require("console-timestamp");


const now1 = new Date();
const schedule = {
	'10 0 * * Saturday': 'bio',
	'10 12 * * Saturday': 'biz',
	'10 0 * * Sunday': 'chem',
	'10 12 * * Sunday': 'eng',
	'10 0 * * Monday': 'espanol',
	'10 12 * * Monday': 'geo',
	'10 0 * * Tuesday': 'human',
	// '10 12 * * Tuesday': 'law',
	'10 0 * * Wednesday': 'math',
	'10 12 * * Wednesday': 'med',
	'10 0 * * Thursday': 'phys',
	'10 12 * * Thursday': 'socialsci',
	'10 0 * * Friday': 'stats',
	'10 12 * * Friday': 'workforce',
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
