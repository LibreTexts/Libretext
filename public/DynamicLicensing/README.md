## DynamicLicensing

DynamicLicensing retrieves and presents a Content Licensing Report for a given LibreTexts open-access text. Licensing Reports indicate how individual pages of the text are licensed for reuse and provide statistics on the licensing of the text as a whole.

### Dependencies
DynamicLicensing does not have any extraneous dependencies.


### Development
DynamicLicensing should always be minified before a release to production. For example:
* `terser dynamicLicensing.js -c -m -o dist/dynamicLicensing.min.js`