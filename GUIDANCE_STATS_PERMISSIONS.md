# Guidance Statistics Permissions — V1.0.57

## School scope
- مدير المدرسة: يرى إحصائيات مدرسته فقط.
- الموجه الطلابي: يرى إحصائيات مدرسته، ومع فلترة المرحلة الموزع عليها عند توفرها.

## Supervision scope / school comparison
- مشرف المجمع: يقارن المدارس الموجودة في `assignedSchoolIds / assignedSchoolNames` الخاصة به.
- مشرف التوجيه الطلابي: يقارن المدارس الموزعة عليه؛ وإذا لم توجد توزيعات مدارس صريحة في بياناته يعامل كنطاق مركزي لجميع المدارس.
- منسق التوجيه الطلابي: نفس قاعدة مشرف التوجيه الطلابي.
- المشرف العام: جميع المدارس.
- مدير المجمعات: جميع المدارس.

## New analytics
- نسبة إنجاز الخطة لكل مدرسة من عناصر `Guidance_Plan.Notes -> segments -> tasks/programs/emerging`.
- البرامج: سجلات `Guidance_Collective`, `Guidance_SubCollective`, `Guidance_Project`.
- الجلسات/المقابلات: سجلات `Guidance_Mettings`.
- مقارنة رسومية لنسبة إنجاز الخطة بين المدارس.
- مقارنة رسومية لحجم البرامج والجلسات بين المدارس.

> Supervisor preview bypass is disabled. Access is driven by `roleKey` and school assignment scope only.
