# V1.0.24 — Bootstrap School Scope Fix

- `schools` from `guidance_bootstrap` is authoritative for `Current User's user data's Schools`.
- Bubble `School` is the platform's **المجمع**.
- `departments` maps to `Dep list`; `grades` maps to `Grades`; `students` maps to `User Student`.
- When `currentUsersData` is not returned, context is derived directly from the scoped bootstrap lists.
- Student lists are filtered by School + Department + Grade.
- Empty School scope no longer occurs merely because the full Users Data object is absent.
- Added exact schema alias `User Student`.
