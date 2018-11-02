const fs = require('fs');
var EPub = require("epub");

/*
const download = require('download');

download('https://opentextbc.ca/geology/open/download?type=epub').then(data => {
	fs.writeFileSync('foo.epub', data);
});*/

var epub = new EPub("foo.epub","/assets");

epub.on("end", function(){
	// epub is now usable
	console.log(epub.metadata.title);
	console.log(epub.toc);

	// epub.getChapter("chapter-001", function(err, text){console.log(text)});
});
epub.parse();