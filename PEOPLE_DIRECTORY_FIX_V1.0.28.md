# V1.0.28 — Students & Employees Directory Fix

- Student selectors use the exact logged-in Users Data `User Student` relation whenever available.
- The app no longer falls back to the full Students Data API list when a user-scoped student relation is absent.
- Bubble response aliases now accept `school` / `schools`, `Grade` / `grades`, and `User Student` variants.
- Employee selectors (including referral source) load from `Users Data` and support employees assigned to multiple Schools.
- Directory refresh events now repaint both student and employee selectors without reopening the record.
- Cache version bumped to `school-1.0.28`.
