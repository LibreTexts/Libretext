const fs = require('fs-extra');
const download = require('download');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

main().then(() => console.log('Done!'));

async function main() {
	hash.update('some data to hash');
	const hashOut = hash.digest('hex');
	const directory = `./JupyterGit/${hashOut}`;
	await fs.ensureDir(directory);
	const simpleGit = require('simple-git')(directory);
	await simpleGit.checkIsRepo();
}