## LibreNavButtons

The LibreNavButtons provide quick, backwards-forwards navigation between pages on LibreTexts libraries for a more natural online reading experience.

### Dependencies
LibreNavButtons assume the following libraries are already available on any page they are used on:
* [jQuery](https://jquery.com)


### Development
LibreNavButtons files should always be minified before a release to production. For example:
* `terser libreNavButtons.js -c -m -o libreNavButtons.min.js`
* `minify libreNavButtons.css > libreNavButtons.min.css`