const maxAge = 60;
const results = {};
for (let i = 0; i <= 1000000; i++) {
	for (let j = 0; j <= maxAge; j+=7) {
		let randomCache = Math.random() * 2; //0 to 2
		randomCache = j > (randomCache + 0.2) * maxAge;
		if (randomCache) {
			if (!results[j])
				results[j] = 0;
			results[j]++;
			break;
		}
	}
}
// console.log(results);
for (key in results)
	console.log(`${key}\t${results[key]}`);