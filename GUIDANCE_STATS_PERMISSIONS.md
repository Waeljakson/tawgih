# صلاحيات إحصائيات التوجيه الطلابي — V1.0.16

لا تتطلب هذه النسخة أي تعديل في الجداول الأساسية. تعتمد الصلاحيات على `Users Data` وحقل `Current Job` والتوزيع الحالي.

## إحصائيات المدرسة
تظهر فقط للمسميات المصنفة كالتالي:
- مدير المدرسة / مديرة المدرسة
- الموجه الطلابي / الموجهة الطلابية / مرشد طلابي

الموجه يُقيد بمرحلة توزيعه، بينما مدير المدرسة يرى المدرسة كاملة.

## الإحصائيات الإشرافية
تظهر فقط للمسميات:
- المشرف العام / المشرفة العامة
- مشرف المجمع / مشرفة المجمع
- منسق المجمع / منسقة المجمع (كمرادف لصلاحية مشرف المجمع)
- مدير المجمعات / مديرة المجمعات

المشرف/المنسق على المجمع يرى المدارس الموجودة في `activity schools` / `Schools` للمستخدم. إذا لم توجد مدارس موزعة فلا يتم توسيع الصلاحية تلقائيًا. المشرف العام ومدير المجمعات لهما نطاق كل المدارس.

## مصدر الإحصائيات
الإحصائيات تُحسب مباشرة من السجلات: `Guidance_Attandance`, `Guidance_Cases`, `Guidance_Collective`, `Guidance_Contact`, `guidance_Fail`, `Guidance_Late`, `Guidance_Log`, `Guidance_Mettings`, `Guidance_Observation`, `Guidance_Periodic`, `Guidance_Project`, `Guidance_Project_Progress`, `Guidance_Situation`, `Guidance_SubCollective` إضافة إلى الجداول الجديدة `Guidance_Plan`, `Guidance_Event`, `Guidance_Message`, `Guidance_Presentation`, `Guidance_Certificate`.
