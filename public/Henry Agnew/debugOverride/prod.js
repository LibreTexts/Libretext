//Self Initialize
async function hello() {
	return 'Prod';
}

libretextGlossary = {one: 1}; // Needs to be accessible to the sidebar buttons
window.addEventListener('load', async () => {
	console.log('event-production');
	if (libretextGlossary && !LibreTexts.active.glossarizer) {
		LibreTexts.active.glossarizer = true;
		console.log(libretextGlossary);
		console.log(await hello())
	}
});