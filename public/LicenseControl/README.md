## LicenseControl

LicenseControl labels LibreTexts library pages with information about and indicators of their respective content licensing. It also exposes functions used in other public projects, such as Citation and LibreLens.

### Dependencies
LicenseControl assumes the following libraries are already available on any page it is used on:
* [jQuery](https://jquery.com)


## Development
LicenseControl files should always be minified before a release to production. For example:
* `terser licensecontrol.js -c -m -o licensecontrol.min.js`
* `minify licensecontrol.css > licensecontrol.min.css`