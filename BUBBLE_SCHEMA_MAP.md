# Bubble Schema Map — Mishkat School Platform V1.0.15

هذه النسخة تعتمد أسماء الـData Types والحقول الظاهرة في صور Bubble المرسلة، بدون تغيير تهجئة الأسماء.

## السجلات المرتبطة الآن مباشرة

| سجل المنصة | Bubble Data Type | حالة الربط |
|---|---|---|
| الإرشاد الجمعي | `Guidance_Collective` | مباشر |
| إرشاد ضعف دراسي | `guidance_Fail` | مباشر للحقول المؤكدة |
| متكررو التأخر | `Guidance_Late` | مباشر |
| متكررو الغياب | `Guidance_Attandance` | مباشر |
| سجل التواصل | `Guidance_Contact` | مباشر |
| دراسة حالة | `Guidance_Cases` | مباشر للحقول المؤكدة |
| دعوة ولي أمر | `Guidance_Mettings` | مباشر |
| مقابلة فردية | `Guidance_Mettings` | مباشر مع تمييز النوع داخل Details |
| زيارة الملاحظة | `Guidance_Observation` + `Guidance_observ` | مباشر |
| سجل المواقف اليومية | `Guidance_Situation` | مباشر |
| الزيارة التوجيهية | `Guidance_SubCollective` | مباشر للحقول المتوافقة |

## Lookups مؤكدة
`Guidance_Action`, `Guidance_Way`, `Guidance_Reason`, `Guidance_Situ`, `Guidance_FailType`, `Guidance_ProblemBehav`, `Guidance_ProblemEdu`, `Guidance_Skills`, `guidance_Studentnotice`.

## أنواع لم يتم توجيه سجلات إليها بعد
`Guidance_Behav`, `Guidance_Edu`, `Guidance_Statistics` لأن صور Fields الخاصة بها لم تصل. كما لم نستخدم `Guidance_Log` للكتابة لأن صورة Bubble تعرض حقلين بالاسم الظاهر `year` بنوعين مختلفين؛ نحتاج API field keys الفعلية قبل الاعتماد عليه.

## مبدأ الأمان
لا يوجد Admin API Token في الواجهة. عند عدم ضبط `dataApiBase` يستمر النظام في العمل بمرآة محلية متوافقة هيكليًا.


## مراجعة V1.0.15
- كل أسماء الطلاب في الواجهة تُختار من `Students` ولا تُكتب يدويًا.
- كل أسماء الموظفين تُختار من `Users Data` دون تقييد بالمسمى الوظيفي.
- راجع `BUBBLE_REVIEW_V1.0.15.md` للتعديلات الموصى بها على `Guidance_Log` و`Guidance_Mettings` وبيانات `School`.
