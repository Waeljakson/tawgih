# V1.0.49 — Stable Bubble directory loading

Fixes intermittent student/employee dropdown loading.

- One shared `guidance_bootstrap` request per concurrent load.
- Automatic retry for transient Bubble/network failures.
- Keeps the last good user-scoped bootstrap snapshot in sessionStorage.
- Never lets a late empty response erase an already loaded student list.
- Publishes current-user Students immediately, before supplementary Data API tables finish.
- Loads supplementary Bubble tables in parallel instead of sequentially.
- `records/app.js` listens to both directory events and refreshes student/employee selectors in-place.
- Source of students remains exactly: `Current User's user data's Students`.
- Source of campus remains exactly: `Current User's user data's Schools`.
