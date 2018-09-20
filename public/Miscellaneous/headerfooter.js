$("#topHeader > ol > li:not(.active)").hover(
	function () {
		const ref = $(this).children()[0];
		const img = ref.getElementsByTagName("img")[0];
		img.src = img.src.replace("/glyphs_blue/", "/glyphs/");

		const color = ref.dataset.color;
		ref.style.border = "2px solid " + color;
		ref.style.background = "white";
		ref.style.color = color;
	},
	function () {
		const ref = $(this).children()[0];
		const img = ref.getElementsByTagName("img")[0];
		img.src = img.src.replace("/glyphs/", "/glyphs_blue/");

		const color = "#127bc4";
		ref.style.border = "2px solid white";
		ref.style.background = "white";
		ref.style.color = color;
	});
/*$("#topHeader > ol > li").each(function () {
	const ref = $(this).children()[0];
	const img = ref.getElementsByTagName("img")[0];
	const color = ref.dataset.color;
	ref.style.color = color;
});*/

/*$("li.active").each(function () {
	const ref = $(this).children()[0];
	const img = ref.getElementsByTagName("img")[0];
	const color = ref.dataset.color;
	ref.style.color = color;
	img.src = img.src.replace("/glyphs_blue/", "/glyphs/");
});*/
