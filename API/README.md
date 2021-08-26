api.libretexts.org
=============================

| Function               | Port | Description                                                                |
| -----------            | ---- | ---                                                                        |
| Schedule               | None | Fires scheduled refresh events to the print server                         |
| Timetrack              | 3001 | Receives Timetrack events from custom timetrack.js                         |
| Propagator             | 3002 | Copies pages between libraries                                             |
| Import                 | 3003 | Imports EPUB, Common Cartridges, PDFs, and PreTexts into LibreTexts        |
| Analytics              | 3004 | Receives Analytics events from custom analytics.js                         |
| Endpoint               | 3005 | Provides miscellaneous API services                                        |
| Bot                    | 3006 | Background library traversal services                                      |
| Elevate                | 3007 | Greatly limits permissions of basic users                                  |
| checkAuthorization     | N/A | Middleware for checking user authorization for api functions                |
| reuse.js               | N/A | Helper functions, such as for for interacting with the Mindtouch API        |


Schedule
---
Sends REST requests to batch.libretexts.org to regenerate the PDFs for each book and update the `Courses.json` and `Bookshelves.json`

Timetrack
---
[Deprecated] Collects time-on-page data for editors.

Propagator
---
Synchronizes pages across libraries using Mindtouch API. Requires user to have an account on multiple libraries.

Import
---
Extracts content from EPUB, Common Cartridges, PDFs, and PreTexts and then uploads them into the platform.

Analytics
---
Stores learning analytics data

Endpoint
---
Simple endpoints for accessing limited parts of the read-only Mindtouch API.

Bot
---
Integrates with the API Dashboard to allow for site-wide semi-automated content maintenance.

Elevate
---
Elevated privilege endpoints for logged-in Developer group users.

Non-committed files
===================
There are multiple JSON files containing secrets that are not committed to the repository. They are `authen.json`, `authenBrowser.json`, `bookstoreConfig.json`, and `secure.json`.
