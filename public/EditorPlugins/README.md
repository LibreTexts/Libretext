## EditorPlugins

Files in this directory define custom CKEditor plugins used in the LibreTexts libraries.

### Dependencies
Plugins defined here assume the following libraries are already available on any page they are used on:
* [CKEditor4](https://ckeditor.com/ckeditor-4/)

### Development
EditorPlugins should always be minified before a release to production. For example:
* `terser libreFormatPlugin.js -c -m -o dist/libreFormatPlugin.min.js`
