# V1.0.33 — Actual Users Data Students field

Correction based on the live Bubble schema:

- The Users Data student relation is `Students`.
- Student scope is `Current User's user data's Students`.
- The frontend no longer assumes any field named `User Student`.
- `guidance_bootstrap.students` remains authoritative for the logged-in user's student list.
- Full `Students` Data API rows may hydrate names/details by ID, but they never expand the authorized list.
- Referral-source employees continue to come from `Users Data -> Full Name`, scoped to the current user's `Schools`.
- Bootstrap key aliases remain tolerant of `school/schools` and `Grade/grades`.
