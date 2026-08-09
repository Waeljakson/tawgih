# V1.0.22 — Bubble Records / Student Directory Fix

## What was wrong
The Digital Records page applied a second filter to the Bubble student directory using one `schoolName/campus/stage` value from the UI context. A user assigned to more than one school/stage could therefore receive valid `User Student` rows from Bubble and still end up with an empty dropdown.

The directory normalizer also had two technical issues:
- empty fallback arrays could win before later aliases such as `Users Data`;
- Things without an `Active` field (notably terms and lookup tables) could be treated as inactive.

## New source of truth
`guidance_bootstrap -> students` is authoritative for the visible student list. It represents the Bubble expression `Current User -> user data -> User Student` configured in the backend workflow.

The frontend does not broaden that list. If Bubble returns only IDs, it may hydrate those exact IDs from the authenticated Data API, but it keeps only the IDs originally returned by `guidance_bootstrap`.

## Supplemental data
Using the same user Bearer token, the app attempts to supplement:
- School / Department / Grades / Class
- academic year / terms
- Users Data / Job Title
- Guidance_Action / Guidance_Way / Guidance_Reason / Guidance_Situ
- Guidance_FailType / Guidance_ProblemBehav / Guidance_ProblemEdu / Guidance_Skills
- guidance_Studentnotice / Guidance_observ

Bubble Privacy Rules remain authoritative. No admin token is embedded.

## Multi-school save behavior
When a student is selected, that student's Bubble `School`, `Dep`, and `grade` IDs take priority for the saved guidance record. This prevents the first assigned school from being incorrectly written for a student belonging to another assigned school.
