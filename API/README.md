api.libretexts.org
=============================

| Function      | Port | Description |
| ----------- | ----------- | ---  |
| Schedule    | None | Fires scheduled refresh events to the print server |
| Timetrack   | 3001 | Receives Timetrack events from custom timetrack.js |
| Propagator  | 3002 | Copies pages between libraries |
| Import      | 3003 | Imports Epubs and PreTexts into LibreTexts |
| Analytics   | 3004 | Receives Analytics events from custom analytics.js |
| Endpoint    | 3005 | Provides miscellaneous API services |
| Bot         | 3006 | Background library traversal services |


Schedule
---

Timetrack
---

Propagator
---

Impport
---

Analytics
---

Endpoint
---

Bot
---


Non-committed files
===================
There are three JSON files that are not committed to the repository. They are secure.json, authen.json, and authenBrowser.json. These contain API keys are usually rotated twice a year for security purposes.