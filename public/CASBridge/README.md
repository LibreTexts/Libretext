## CAS Bridge

CAS Bridge is an overlay onto the LibreTexts libraries that acts as a gateway to direct authentication into CXone Expert.

### Dependencies
CAS Bridge relies on jQuery to manipulate DOM elements. All other necessary libraries are bundled into its distribution file.

### Development
CAS Bridge files should always be bundled with webpack before a release to production: `npm run build:prod`