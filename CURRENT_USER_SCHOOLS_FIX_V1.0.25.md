# V1.0.25 — Current User Schools scope

المجمع مصدره الوحيد في الواجهة هو `guidance_bootstrap.schools`، والذي يجب أن تكون قيمته في Bubble: `Current User's user data's Schools`.

- لا يتم اشتقاق المجمع من `Student's School`.
- `Student's School` يستخدم فقط للتحقق أن الطالب ينتمي إلى أحد `Current User's user data's Schools`.
- إذا لم يصل نطاق Schools، قائمة الطلاب تكون فارغة (fail closed).
- Dep list وGrades تستخدم كقيود إضافية بعد School.
