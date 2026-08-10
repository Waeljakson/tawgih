# V1.0.23 School Scope Fix

Bubble mapping used by the frontend:

- `Current User's user data's Schools` -> allowed **School / complex** list.
- `Current User's user data's Dep list` -> allowed departments/stages.
- `Current User's user data's Grades` -> allowed grades.
- `Current User's user data's User Student` -> candidate student list.
- Final visible student list = `User Student ∩ Schools ∩ Dep list ∩ Grades`.
- Student `School` is required to match one of the current user's `Schools`.

This is intentionally fail-closed to prevent students from another complex from appearing when School cannot be verified.
