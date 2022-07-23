## EditorPlugins

Files in this directory define custom CKEditor plugins used in the LibreTexts libraries.

### Dependencies
Plugins defined here assume the following libraries are already available on any page they are used on:
* [CKEditor4](https://ckeditor.com/ckeditor-4/)

### Development
EditorPlugins should always be minified before a release to production. For example:
* `terser libre[PLUGIN_NAME]Plugin.js -c -m -o dist/libre[PLUGIN_NAME]Plugin.min.js`
