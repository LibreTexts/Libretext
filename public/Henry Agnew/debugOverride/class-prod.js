//Self Initialize
glossarizer = class {
	static hello() {
		return 'Prod';
	}
}

libretextGlossary = {one: 1}; // Needs to be accessible to the sidebar buttons
window.addEventListener('load', () => {
	if (!LibreTexts.active.glossarizer) {
		LibreTexts.active.glossarizer = true;
		console.log(libretextGlossary);
		console.log(glossarizer.hello());
	}
});