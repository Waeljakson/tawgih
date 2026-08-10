# V1.0.27 — Automatic Distribution Data Fix

The distribution panel now contains exactly five values:
1. المجمع — authoritative source: `Current User's user data's Schools`
2. المرحلة — `Current User's user data's Dep list`
3. نوع المدرسة — from the assigned `School` thing; defaults safely when unavailable
4. مدير المدرسة — from the assigned `School` manager relation, otherwise `Users Data` manager constrained to the same School
5. الموجه الطلابي — current user's `Users Data -> Full Name`

Changes:
- Removed legacy `المدرسة / اسم المدرسة` field from the home distribution modal and records settings.
- Added robust Bubble Thing label detection so School names are resolved even when the display field has a non-standard name.
- Data API only hydrates the scoped Schools returned by `guidance_bootstrap`; it does not broaden user scope.
- Student lists fail closed when no School scope is available.
- Core scripts use cache-busting version `school-1.0.27`.
