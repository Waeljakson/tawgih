# V1.0.26 — Automatic distribution fields

The records settings card now shows exactly five read-only fields:
1. المجمع — `Current User's user data's Schools` via `guidance_bootstrap.schools`.
2. المرحلة — `Current User's user data's Dep list` via `guidance_bootstrap.departments`.
3. نوع المدرسة — from the assigned School Thing when available, otherwise inferred safely with boys as fallback.
4. مدير المدرسة — from the assigned School manager relation when available, otherwise a manager employee constrained to the same School.
5. الموجه الطلابي — current user's Users Data `Full Name`.

The obsolete `اسم المدرسة` textbox was removed from automatic distribution. Student scope remains constrained by the same assigned Schools/Departments/Grades.
