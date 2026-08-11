## V1.0.86 — Counselor statistics assignment scope
- Hardened counselor statistics to the assigned campus + stage intersection.
- Counselor scope now uses the authoritative assigned school/stage lists from Bubble.
- Fail-closed stage filtering prevents accidental cross-stage statistics when assignment is missing.
- Scope header explicitly shows campus and stage.

## 1.0.80
- إصلاح عرض اسم المدرسة في صفحة الإحصائيات بدل مرجع Bubble الرقمي.
- تحسين Hydration لأسماء المدارس من Directory/Current Context.
- تحديث cache لصفحة الإحصائيات.

## 1.0.79
- Centered collective report headings and connected upcoming session dates to Smart Calendar and reminders.

## V1.0.76 — SubCollective Workflow API CRUD
- ربط حفظ جلسات المتابعة بـ `guidance_save_subcollective`.
- ربط تعديل جلسات المتابعة بـ `guidance_update_subcollective` باستخدام بيانات الجلسة الأصلية، بدون أي ID يدوي.
- ربط حذف جلسات المتابعة بـ `guidance_delete_subcollective`.
- الإبقاء على قراءة التقرير من Bubble وتجميع الجلسات التابعة تحت الجلسة الرئيسية.
- بعد الحفظ أو التعديل يعود المستخدم مباشرة إلى تقرير الإرشاد الجمعي.

## V1.0.75 — Collective follow-up chain
- Added up to three linked follow-up sessions using the existing `Guidance_SubCollective` table.
- Added `+ إضافة جلسة` beside Edit on the latest session in the chain.
- Follow-up title/date inherit from the previous session; participants are not re-entered.
- Grouped main and follow-up sessions visually in the collective report.
- No Bubble schema changes.

## V1.0.72 — Compact luxury collective guidance report
- تقرير الإرشاد الجمعي يعرض فقط: اسم الجلسة، المشاركون، الزمن.
- إعادة تصميم الجدول بحجم متزن وألوان أزرق/تركواز متوافقة مع هوية المنصة.
- الانتقال إلى صفحة التقرير فور نجاح الحفظ أو حفظ التعديل.
- فصل نجاح الحفظ عن تحديث التقرير حتى لا يظهر الحفظ كفشل بسبب تأخر تحميل التقرير.
- الحفاظ على أزرار التعديل والطباعة والحذف كإجراءات مستقلة عن بيانات التقرير.

## V1.0.71 — Collective guidance save/update/report UX
- Successful save/update now moves immediately to the collective guidance report view.
- Existing records show **حفظ التعديل** instead of **حفظ السجل** while editing.
- Collective report colors and sizing were aligned with the Mishkat blue/teal design system.
- Wide report usability improved with wrapped text, compact widths, sticky action controls, and print-safe sizing.

# V1.0.71
- تحويل زمن جلسة الإرشاد الجمعي إلى قائمة منسدلة من Option Set `Guidance_Time`.
- إرسال Display الخاص بالخيار مباشرة إلى Bubble في الحفظ والتعديل.
- لا يوجد أي تعديل على قاعدة البيانات أو السجلات القديمة.

## V1.0.68
- Complete Guidance_Collective save/report synchronization and deterministic post-save report redirect.

## V1.0.67 — 2026-08-11
- ربط تقرير الإرشاد الجمعي مباشرة ببيانات Guidance_Collective في Bubble.
- دمج السجلات البعيدة والمحلية بدون ازدواجية، مع فتح/تعديل/طباعة/حذف السجل البعيد.
- إضافة تاريخ الجلسة واليوم للتقرير، وتحميل Guidance_Time لعرض المدة.

# V1.0.64 — Collective guidance automatic weekday

- Replaced the editable **اليوم** textbox in the collective guidance session with a non-editable derived display.
- The Arabic weekday is calculated automatically from **تاريخ السجل** and refreshes instantly when the date changes.
- The derived day is still stored in the form data for printing/report continuity, with no manual user entry.
- Bubble collective Save/Update/Delete workflow integration from V1.0.63 is unchanged.

## V1.0.63 — Collective guidance workflow API
- Connected `group_guidance` to `guidance_save_collective`, `guidance_update_collective`, and `guidance_delete_collective`.
- New records are created in Bubble before the local archive mirror is updated.
- Edits send the original collective date/title to Bubble so the existing row is changed instead of creating a duplicate.
- Delete removes the local archive row only after Bubble confirms the backend workflow succeeded.
- Grade (school), School (complex), Department, academic year, term, and selected Students are resolved automatically from the authenticated Bubble context; there is no user-facing manual ID entry.
- Optional collective fields are omitted from the request when blank.
- Cache-busting updated to `school-1.0.63`.

## V1.0.61 — Plan create/update workflows
- Added `guidance_update_plan` endpoint integration.
- Prevented duplicate plan creation on repeated saves.
- Added workflow identity markers for plans whose create response has no Bubble ID.
- Existing Bubble plan rows seed the update marker automatically.

# V1.0.60 — Guidance Plan Workflow API
- نقل حفظ `Guidance_Plan` من الكتابة المباشرة عبر Data API إلى Backend Workflow موثّق باسم `guidance_save_plan`.
- تمرير `Grade` (المدرسة) و`School` (المجمع) و`Department` و`academic year` و`terms` تلقائيًا كمراجع Bubble Things من سياق المستخدم.
- استخدام User Bearer Token الحالي؛ لا يوجد Admin API Token في الواجهة.
- حفظ النموذج الكامل للخطة والأسابيع والبرامج والجلسات داخل `Notes`.
- إضافة `Grade` إلى خريطة `Guidance_Plan` بعد إضافته فعليًا في Bubble.
- عدم إعلان نجاح الحفظ إلا بعد رد `success=yes/true` من الـBackend Workflow.

# V1.0.59
- حفظ رأس الخطة في Guidance_Plan أصبح مستقلًا عن مزامنة Guidance_Plan_Item.
- تحسين تشخيص أخطاء Bubble وصلاحيات Data API.
- إعادة محاولة الحفظ بالحقول الأساسية عند رفض حقل اختياري.

# V1.0.59 — Verified Bubble Plan Persistence

- خطة الموجه لا تُعتبر محفوظة إلا بعد إنشاء/تحديث سجل حقيقي في Bubble والتحقق منه بقراءة السجل مرة أخرى.
- إلغاء LocalStorage fallback نهائيًا لنوعي `Guidance_Plan` و`Guidance_Plan_Item`.
- عند فشل Bubble تظهر رسالة خطأ واضحة بدل رسالة نجاح وهمية.
- ترحيل الخطط المحلية القديمة تلقائيًا إلى Bubble عند فتح منصة الخطة إذا أمكن.
- أرشيف الخطط يعرض فقط السجلات القادمة من Bubble ويظهر عليها «محفوظ في قاعدة المدرسة ✓».
- تحسين سلامة تحديث بنود الخطة: تُحفظ البنود الجديدة أولًا، ثم تُحذف النسخة القديمة بعد نجاح الكتابة.
- تسريع كتابة بنود الخطة بتوازي محدود لا يتجاوز 5 طلبات.
- الاتصال الحالي ما زال ببيئة Bubble Development عبر `version-test`؛ لم يتم التحويل إلى Live بدون طلب صريح.

## V1.0.57 — 2026-08-11
- Automatic term-based plan naming.
- Messages top hint header-overlap fix.
- Plan completion and programs/sessions school comparison analytics with role-scoped access.
- Removed supervisor preview bypass.

## V1.0.56 — Term date labels
- استبدال «بداية الدراسة / نهاية الدراسة» داخل الخطة بـ «بداية الفصل الدراسي / نهاية الفصل الدراسي».
- تحديث رسائل التحقق وملخص الطباعة والتنبيه المرتبط بالتواريخ.
- الحفاظ على توافق البيانات القديمة عبر الإبقاء على startDate/endDate داخليًا.


## V1.0.53 — Free School Edition
- إزالة الباقات والاشتراكات والهدايا من واجهة نسخة المدرسة.
- جميع الخدمات متاحة مباشرة للمستخدم المدرسي.
- إصلاح شاشة شهادات التقدير وإزالة «هدية الباقة».
- إزالة شروط التسعير/واتساب من الطلب الداخلي للعروض.
## V1.0.52 — Direct school-manager lookup
- Fixed the root manager-resolution dependency on the general employee directory.
- Added direct `job_titels -> Users Data` lookup constrained by `Current Job` and current School.
- Added session-scoped manager cache and automatic UI refresh after async resolution.

# V1.0.22 — Bubble Records Directory Fix

- Fixed blank student dropdowns in Digital Records.
- `guidance_bootstrap.students` is treated as the authoritative Current User student scope; the UI no longer applies a second single-school filter.
- Added multi-school / multi-department / multi-grade assignment context.
- Normalized bootstrap aliases: schools, departments, grades, students, academic years, terms, current academic year.
- Added safe hydration from user-authenticated Data API when Bootstrap returns Bubble IDs instead of full Things, while preserving the original scoped student list.
- Supplemented employees and guidance lookup tables from Data API without replacing scoped students.
- Fixed `activeOf()` fallback so Terms and lookup tables that do not have an `Active` field remain visible.
- Selected student's Bubble School/Department now takes priority when saving a record for multi-school users.
- Clears previous user's directory/context cache after login/logout to prevent stale cross-user display.
- Updated shared-script cache versions to V1.0.22.

# V1.0.21 — Bubble Test Bridge

- Connected the test build to `guidance_login_test` on Bubble `version-test`.
- Connected user context to `guidance_bootstrap` with a user-scoped Bearer token.
- Added an Arabic test-login overlay when no Bubble token exists.
- Token is stored in `sessionStorage` only; email/password are never written to GitHub files.
- Configured the `version-test` Data API base so existing persistence code can authenticate as the current user.
- No Bubble admin token is embedded.

# V1.0.20 — Inner Header Refinement

- Compact creative header for all inner platforms.
- Home header unchanged.
- Fixed content overlap caused by negative margins after suppressing native hero headers.
- Important native header actions are mirrored into the compact toolbar.
- Improved sticky offsets and mobile layout.

# V1.0.19

- جعل الدخول إلى كل سجل يفتح تقرير السجل أولًا بدل نموذج الإضافة.
- إضافة زر «سجل جديد» لكل تقرير لفتح نموذج الإدخال.
- بعد الحفظ يعود المستخدم تلقائيًا إلى تقرير نفس السجل.
- إضافة فلاتر الطالب/الاسم والعام الأكاديمي والفصل الدراسي وعدّاد السجلات.
- إضافة جداول تقرير مخصصة لأنواع السجلات المختلفة مع تعديل وطباعة وحذف.

# V1.0.18.2
- Single unified header across platform pages.
- Legacy/native platform hero headers suppressed to eliminate duplicate headers.
- Important native header buttons mirrored into the unified page strip.
- Notification panel now opens below the unified header with corrected z-index and viewport sizing.

# V1.0.18 — شات التوجيه الطلابي والهيدر الموحد

- إضافة زر **الشات** داخل الهيدر الموحد على جميع صفحات المنصة.
- إضافة مركز شات جماعي لفريق التوجيه الطلابي وشات فردي باختيار مستخدم من `Users Data`.
- عدم كتابة أسماء المستخدمين يدويًا؛ الاسم والمسمى والمدرسة والمرحلة تأتي من بيانات Bubble.
- إعادة استخدام جدول `Guidance_Message` الموجود بالفعل، بدون الحاجة لإنشاء جدول شات جديد.
- `MessageType = chat_group` للمحادثات الجماعية و`MessageType = chat_direct` للمحادثات الفردية.
- المحادثات الفردية تستخدم `RecipientEmployee` كعلاقة إلى `Users Data`.
- تحديث تلقائي للمحادثات كل عدة ثوانٍ مع fallback محلي عند عدم توافر Bubble API.
- الحفاظ على زر التنبيهات وزر الدعم وبوابة المنصات في جميع الصفحات.

# V1.0.17 — Unified Navigation & Executive Home

- نقل الإحصائيات من كروت المنصات إلى لوحة متابعة تنفيذية داخل الصفحة الرئيسية حسب الصلاحية.
- إضافة هيدر موحد لكل الصفحات يتضمن بوابة المنصات، الرئيسية، التنبيهات، والدعم.
- إضافة Mega Menu مرتبة للمنصات الثمانية.
- إضافة بوابة خدمات سريعة داخل هيدر الصفحة الرئيسية.
- تثبيت عداد المنصات عند 8 وعدم احتساب صفحات الإحصائيات كمنصة.

# V1.0.15 — Full Bubble people selectors
- منع الإدخال اليدوي لاسم الطالب في جميع النماذج المساندة والسجلات: الاختيار من `Students` مع حفظ ID.
- منع الإدخال اليدوي لأسماء الموظفين في حقول الأشخاص: الاختيار من `Users Data` لأي مسمى وظيفي مع حفظ ID.
- قوائم الموظفين تعتمد المدرسة/المجمع ولا تتقيد بالمرحلة أو الوظيفة.
- تعبئة الصف والفصل وبيانات الطالب تلقائيًا عند اختيار الطالب حيث توجد الحقول.
- تحميل `Students` و`Users Data` من Bubble Data API مع Pagination لدعم آلاف السجلات.
- تفعيل الجداول السبعة الجديدة للخطة والتقويم والمراسلات والعروض والشهادات والقوالب.
- إصلاح تقرير الطالب الموحد وأحداثه في السجلات.
- مراجعة Schema وتوثيق التعديلات المقترحة في `BUBBLE_REVIEW_V1.0.15.md`.

# V1.0.14 — Exact Guidance Schema Mapping

- إضافة أسماء وحقول جداول السجلات الفعلية من Bubble.
- ربط 11 نوع سجل بالجداول المؤكدة.
- ربط جداول Action / Way / Reason / Situation والـlookup types.
- حفظ مرآة محلية مع Bubble type/id لسلامة الأرشيف.
- منع التخمين في Guidance_Behav / Guidance_Edu / Guidance_Statistics وGuidance_Log.
- حذف تحميل bubble-schema.js المكرر من صفحة السجلات.

# V1.0.13 — Unified Bubble persistence

- اعتماد Guidance_Plan وGuidance_Plan_Item للخطة وبنودها.
- اعتماد Guidance_Event للتقويم والتنبيهات.
- اعتماد Guidance_Message لتسجيل المراسلات.
- اعتماد Guidance_Presentation للعروض وطلبات العروض.
- اعتماد Guidance_Certificate لإصدارات الشهادات.
- اعتماد Guidance_Template للقوالب المركزية.
- إضافة bubble-persistence.js كطبقة CRUD موحدة مع fallback محلي.
- خطة الموجه أصبحت تحفظ وتفتح وتحذف عبر طبقة Bubble في نسخة المدارس.
- التقويم الذكي يقرأ Guidance_Event والخطة في نسخة المدارس دون الاعتماد على Supabase.
- نسخ/إرسال الرسائل يسجل الحدث في Guidance_Message.
- طباعة الشهادات تسجل الإصدار في Guidance_Certificate.
- طلبات العروض الخاصة تستخدم Guidance_Presentation في نسخة المدارس.
- لا توجد مفاتيح Admin داخل الواجهة.

# V1.0.12.1 — Bubble schema compatibility

- Registered every Guidance data type name visible in the supplied Bubble screenshots exactly as-is.
- Added the shared `bubble-schema.js` to the records page before the directory adapter.
- Kept unknown Guidance fields intentionally unmapped until their Bubble Fields pages are supplied.
- No Bubble admin token is embedded in the frontend.


## School Edition V1.0.12 — Bubble schema mapping
- اعتماد أسماء Data Types والحقول الفعلية من قاعدة Bubble المرسلة.
- Users Data: Full Name / activity schools / Schools / Dep / Dep list / Current Job / Job Title / User.
- Students: Full Name / School / Dep / grade / Class / Parent phone / code / National ID.
- academic year: title + Active لتحديد العام الحالي.
- Guidance_Situation: Student / Source / Department / grade / school / Terms / SituationDate / Detail / Phone / Action / situ.
- عدم استخدام Gender الموظف لتحديد بنين/بنات؛ المصدر هو School والافتراضي بنين.
- دعم ربط Bubble User الحالي بسجل Users Data عبر حقل User.
- فلترة الطلاب والموظفين بحسب مدرسة/مجمع/مرحلة المستخدم عند توفر العلاقات.
# V1.0.11 — Automatic user distribution

- ألغيت الحاجة إلى حفظ إعدادات المدرسة؛ المنصة تعمل مباشرة.
- اسم الموجه والمدرسة والمجمع والمرحلة تأتي تلقائيًا من المستخدم وتوزيعه في Bubble.
- مدير المدرسة يحدد تلقائيًا من علاقة المدرسة/التوزيع أو من موظف يحمل دور مدير المدرسة لنفس المدرسة.
- نوع المدرسة تلقائي من بيانات المستخدم/المدرسة: الافتراضي بنين، وإذا كانت البيانات بنات تتحول صياغات الطلاب في المنصة إلى طالبات.
- الرسائل والعروض والتقارير والشهادات تعتمد نوع المدرسة تلقائيًا ولا تسمح بتغييره يدويًا.
- المرحلة في العروض مرتبطة بتوزيع المستخدم بدل الاختيار اليدوي.

## V19.0.9 — إصلاح وميض تسجيل الدخول وطبقات التنبيهات
- منع ظهور صفحة تسجيل الدخول لثوانٍ أثناء فحص الجلسة المحفوظة.
- إضافة شاشة تحقق محايدة قصيرة بدل وميض نموذج الدخول.
- رفع طبقة جرس ولوحة وإشعارات التنبيهات فوق هيدر «بوابة خدمات الموجه الطلابي».
- تحديث كاش ملفات التنبيهات إلى 19.0.9.

# V19.0.8 — التقويم يعمل بدون خطة

- منصة التقويم تفتح للمستخدم حتى لو لم يسجل أي خطة بعد.
- يظهر تنبيه إداري واضح: «لم تقم بتسجيل خطة».
- يظهر زر مباشر «تسجيل خطة الآن» مع بقاء التقويم قابلًا للاستخدام.
- يمكن إضافة المواعيد والتذكيرات اليدوية حتى بدون وجود خطة.
- مركز التنبيهات العام يعرض تنبيه عدم وجود خطة أيضًا.
- وجود خطة محفوظة لم يعد شرطًا لتشغيل التقويم.

# V19.0.8 — Calendar Events = Alerts

- كل حدث ظاهر في التقويم أصبح تنبيهًا تلقائيًا مهما كان نوعه.
- أقرب تنبيه = أول حدث جارٍ أو قادم زمنيًا في التقويم.
- ألغيت بطاقة «أقرب تنبيه» الثابتة من الشاشة؛ يبقى الجرس والعداد فقط.
- تفاصيل أقرب تنبيه تظهر عند فتح مركز التنبيهات أو عندما يحين موعد الإشعار.
- أحداث التقويم ليست مقيدة بنافذة 7 أيام؛ جميع الأحداث القادمة تدخل مركز التنبيهات.
- تنبيهات التأخر وانخفاض الإنجاز تظل تنبيهات إدارية إضافية.

# V19.0.5 — أقرب تنبيه + أول مناسبة + التنبيهات داخل التقويم

- إضافة بطاقة ثابتة تعرض أقرب تنبيه أثناء استخدام أي منصة.
- عرض المدة المتبقية والتاريخ لأقرب تنبيه.
- عرض أول مناسبة قادمة من آخر خطة محفوظة داخل بطاقة التنبيه.
- تثبيت أقرب تنبيه وأول مناسبة في أعلى مركز التنبيهات.
- إضافة مركز التنبيهات العام إلى منصة التقويم نفسها.
- استمرار العداد والتنبيهات المنبثقة وإشعارات المتصفح والمزامنة بين التبويبات.

# V19.0.0 — التقويم الذكي والتنبيهات

- إضافة منصة التقويم الذكي والتنبيهات كميزة حصرية للباقة الشاملة.
- استخراج البرامج والمناسبات والإجازات تلقائيًا من خطة الموجه الطلابي المحفوظة.
- تنبيه قبل البرامج والمواعيد المهمة، وتنبيه عند عدم تسجيل تنفيذ برنامج بعد انتهاء أسبوعه.
- قياس الإنجاز الحالي مقابل الإنجاز الزمني المتوقع وإظهار تنبيه عند انخفاض المعدل.
- تنبيه عند توقف تحديث الخطة لفترة مع وجود عناصر متبقية.
- إضافة مواعيد وتذكيرات خاصة للمستخدم داخل التقويم.
- إضافة جرس تنبيهات موحد في جميع المنصات للمشتركين في الباقة الشاملة.
- دعم «تم الاطلاع» و«ذكرني غدًا» وحفظ الحالة سحابيًا.
- دعم إشعارات المتصفح بعد موافقة المستخدم.
- إضافة جداول Supabase مؤمنة بـRLS ولا تعمل إلا مع صلاحية all_access.

# V18.0.0 — منصة شهادات التقدير

- إضافة منصة شهادات فاخرة من التوجيه الطلابي.
- تصنيفات: تفوق، تقدير، تهنئة.
- عبارات جاهزة للبنين والبنات وسطر تهنئة لولي الأمر.
- تكريم التفوق والتميز السلوكي والانضباط والبرامج والمسابقات وغيرها.
- ستة قوالب فاخرة مع طباعة A4/PDF وإصدار جماعي.
- المنصة هدية مجانية لأي باقة سنوية أو الباقة الشاملة.
- دعم كود هدية الباقة الشاملة.
- ربط أسماء البرامج بمكتبة تقارير الإنجاز.
- دعم الشات والتنقل الموحد.

# V17.2 — Compact Unified Header

- إزالة «مراسلات ولي الأمر» من قائمة التنقل العلوية داخل المنصات لتوفير مساحة أفضل.
- منصة الرسائل لم تُحذف من النظام؛ تظل موجودة في البوابة الرئيسية ويمكن فتحها من هناك.
- الهيدر الموحد يعرض الآن: تحليل النتائج، السجلات الرقمية، العروض التقديمية، خطة الموجه، وتقارير الإنجاز.
- لا تغيير على الاشتراكات أو صلاحيات مكتبة الرسائل.

# V17.1 — Unified Platform Header Navigation

- Added the unified portal navigation header to Messages and Achievement Reports.
- Added Achievement Reports and Messages to the header switcher in Analysis, Records, Presentations, and Counselor Plan.
- Header now displays all six active platforms consistently.
- Messages remains annual-only in access-aware navigation.

# V16.1.0 — تقارير الإنجاز كباقة مستقلة

- إضافة منصة تقارير الإنجاز ضمن الباقات الفردية: 10 ريالات شهريًا أو 50 ريالًا سنويًا.
- قصر تغيير نوع الطلاب على منصة الرسائل فقط.
- تحسين تصميم زر تغيير بنين وبنات في منصة الرسائل.
- تقارير الإنجاز تتبع نوع الطلاب المحفوظ بالحساب دون إظهار زر تغيير داخل المنصة.

# V14.1 — إصلاح توقف التحقق من الاشتراك

- إصلاح تعليق شاشة «جارٍ التحقق من الاشتراك».
- قراءة جلسة الدخول المحفوظة مباشرة عند الحاجة.
- فحص الباقة السنوية عبر دالة Supabase الآمنة `premium_has_annual_access`.
- إضافة مهلة زمنية ورسالة خطأ وزر إعادة المحاولة بدل الانتظار غير المحدود.
- إصلاح تعبئة قائمة تصنيفات الرسائل.

# V13 — الخطة الإلكترونية ومعدل الإنجاز

- تعديل الإجازات ونوعها وتاريخ البداية والنهاية بعد إضافتها.
- إعادة توزيع الأسابيع بعد تعديل الإجازة مع الاحتفاظ بالتعديلات السابقة قدر الإمكان.
- فتح كل أسبوع في نافذة تحرير مستقلة وتعديل الأعمال والبرامج والتواريخ والملاحظات والأعمال المستجدة.
- إضافة أو حذف أعمال وبرامج من الأسبوع.
- حساب معدل الإنجاز الأسبوعي والكلي مباشرة من حالات نفذ ولم ينفذ.
- ملخص مطبوع لمعدل الإنجاز وتقدم كل أسبوع.
- حفظ مؤشرات الإنجاز في Supabase.

# V12 — منصة خطة الموجه الطلابي

- إضافة منصة جديدة لبناء الخطة الأسبوعية حسب المرحلة والتقويم الدراسي.
- دعم الابتدائية الدنيا والعليا والمتوسطة والثانوية.
- إدخال بداية ونهاية الدراسة والإجازات الفصلية والمطولة والمناسبات.
- توزيع الأسابيع تلقائيًا مع استبعاد أسابيع الإجازة الكاملة.
- صياغة مقدمة شخصية حسب المستخدم والمدرسة والمرحلة.
- نموذج أسبوعي مماثل للخطة المرجعية مع الأعمال والبرامج والمتابعة والطباعة.
- حفظ الخطط سحابيًا وفتحها وتعديلها.

# V11 — تقرير الطالب الموحد

- إضافة شاشة تقارير الطلاب داخل منصة السجلات.
- تجميع المواقف والإرشاد والغياب والتأخر ودراسات الحالة والتواصل والمتابعات في تقرير واحد.
- فلترة حسب الطالب والفصل والنوع والحالة والفترة الزمنية.
- عرض ملخص إحصائي وتسلسل زمني وكل تفاصيل السجلات.
- طباعة التقرير أو حفظه PDF من المتصفح.

# V10 — اختلاف نوعي ورسوم تفاعلية

- إنشاء ست عائلات تصميم مختلفة وتوزيعها تلقائيًا على البرامج.
- جعل طول العرض بين 15 و17 شريحة.
- إضافة 10+ أنواع من الرسوم والتفاعلات داخل العرض.
- تنويع الألوان والخلفيات والحركة وفق البرنامج والمرحلة ونوع الطلاب.

# V9 — إعادة تنظيم بوابة المنصات

- تحويل الصفحة الرئيسية إلى لوحة تحكم مرتبة.
- فصل المنصات المفعلة عن الخدمات غير المفعلة.
- إضافة ملخص بصري لعدد المنصات المتاحة والمقفلة.
- توحيد إجراءات الحساب والدعم والباقات في شريط أدوات واضح.
- اختصار خطط الأسعار إلى خيار منصة واحدة وخيار الباقة الشاملة.
- تحسين بطاقات المنصات والأيقونات والاستجابة للشاشات الصغيرة.

# V8 — شات الدعم في جميع المنصات

- إضافة زر محادثة الدعم إلى الصفحة الرئيسية الموحدة.
- إضافة محادثة الدعم إلى منصة العروض التقديمية.
- توحيد سجل المحادثة بين التحاليل والسجلات والعروض والبوابة الرئيسية.
- إضافة إشعارات الردود الجديدة والتحديث التلقائي.

# V7 — تثبيت نوع طلاب العروض لكل حساب

- المستخدم يختار بنين أو بنات مرة واحدة عند أول دخول لمنصة العروض.
- بعد التثبيت لا يستطيع المستخدم فتح أو اختيار النوع الآخر.
- طلبات العروض الخاصة تلتزم تلقائيًا بالنوع المثبت على الحساب.
- مدير النظام يستطيع تعيين أو تغيير نوع المستخدم من لوحة الإدارة.
- تم تطبيق التحقق داخل قاعدة البيانات، وليس في واجهة المستخدم فقط.

# V6 — عروض من 15 شريحة على الأقل

- رفع عدد شرائح كل عرض جاهز من 7 إلى 15 شريحة.
- إضافة شرائح أعمق تشمل: الأهمية، المفهوم، الرسائل التربوية، ماذا يحدث لو، النشاط الفردي، النشاط الجماعي، دور المدرسة والأسرة، وخطة المتابعة.
- ضبط طلبات البرامج الخاصة بحيث يكون الحد الأدنى 15 شريحة.

# سجل التغييرات

## V5 — إضافة منصة العروض التقديمية

- تفعيل باقة العروض التقديمية: 10 ريالات شهريًا أو 50 ريالًا سنويًا.
- إضافة منصة عروض داخلية مصنفة حسب المرحلة والجمهور.
- إضافة البرامج الوزارية والنوعية والقيمية.
- إضافة 30 عرضًا أوليًا بصياغات وأنشطة مختلفة.
- إضافة طلب تصميم برنامج خاص بسعر حسب التكلفة والتواصل عبر واتساب.
- إضافة طلبات العروض الخاصة إلى لوحة مدير النظام.
- منع فتح أي منصة غير مشمولة في باقة المستخدم.
- تحديث التنقل بين التحاليل والسجلات والعروض التقديمية.


## V14.0.0
- إضافة مكتبة مراسلات الموجه الطلابي.
- إتاحة المكتبة للباقات السنوية فقط.
- آلاف الرسائل للبنين والبنات وجميع المراحل.
- رسائل القدرات والتحصيلي للمرحلة الثانوية.
- نسخ مباشر وفتح واتساب ومفضلة وفلاتر.


## V17.0.0
- إضافة أكواد هدايا من يوم إلى 10 أيام.
- اختيار الباقة الشاملة أو منصة محددة، ومنها مكتبة الرسائل.
- تحديد عدد مرات استخدام الكود وإيقافه أو إعادة تفعيله.
- نافذة للمستخدم لتفعيل الكود مباشرة.


## V19.0.4
- جعل مركز التنبيهات متاحًا في جميع صفحات المنصة الرئيسية.
- إضافة تنبيهات منبثقة داخل المنصة للمواعيد العاجلة والقريبة.
- إضافة تحديث دوري كل دقيقتين أثناء فتح الصفحة.
- إضافة مزامنة فورية بين التبويبات عند حفظ أو فتح الخطة.
- إضافة زر اختياري لتفعيل إشعارات سطح المكتب.
- إضافة fallback لآخر خطة محفوظة محليًا عند تعذر الاتصال مؤقتًا.


## School V1.0.9 — السياق المدرسي الأساسي
- المجمع والمرحلة والعام الأكاديمي والفصل الدراسي أصبحت بيانات أساسية ظاهرة في كل سجل.
- العام والفصل الدراسي يأخذان القيمة الحالية من جداول Bubble.
- عند اختيار الطالب يتم تعبئة المجمع والمرحلة فورًا من بياناته.
- في السجلات غير المرتبطة بطالب يمكن اختيار المجمع والمرحلة يدويًا من قوائم Bubble.
- منع الحفظ إذا كانت أي من البيانات الأساسية الأربع غير مكتملة.
- الحفاظ على هوية وتصميم السجلات الأصلي دون تقليد تصميم صور Bubble.


## School V1.0.10.1.1 — هوية المستخدم والتوزيع الموحد
- اعتماد اسم المستخدم في Bubble بوصفه اسم الموجه الطلابي تلقائيًا في جميع المنصات.
- المجمع والمرحلة أصبحا من توزيع المستخدم فقط، بدون اختيار يدوي داخل السجلات أو المنصات.
- العام الأكاديمي والفصل الدراسي الحاليان يُسحبان من جداول Bubble ويظهران تلقائيًا.
- إضافة اختيار مدير المدرسة في إعدادات المنصة من قائمة الموظفين، مع حفظ مرجع الموظف وإعادة استخدامه في كل المخرجات.
- إزالة الإدخال اليدوي لاسم الموجه من الرسائل، وجعله يُضاف تلقائيًا للنص النهائي.
- شهادات التقدير تستخدم المدرسة والموجه ومدير المدرسة والعام الحالي تلقائيًا.
- خطة الموجه وتقارير الإنجاز تستخدم هوية المستخدم ومدير المدرسة تلقائيًا.
- تقارير تحليل النتائج تُظهر اسم مدير المدرسة في موضع الاعتماد عند توفره.
- تقييد قوائم طلاب السجلات على مجمع ومرحلة المستخدم عندما تكون بيانات التوزيع متاحة.


## V1.0.10.2
- فصل فتح المنصات عن حفظ إعدادات المدرسة.
- إصلاح منصة المراسلات وإزالة بوابة Supabase/الاشتراك في نسخة المدرسة.
- مدير المدرسة أصبح إعدادًا اختياريًا لا يوقف التشغيل.


## School V1.0.11.1
- Fixed available platforms showing 0.
- 8 school services are now rendered statically as a no-JS fallback.
- Platform availability no longer depends on settings, Bubble context, subscription state, or identity rendering.


## School V1.0.12
- Added exact Bubble schema adapter for `Users Data`, `Students`, `academic year`, `Department`, and `Guidance_Situation`.
- Department display name now reads exact field `Dep. Name`.
- Academic year selection handles multiple `Active = yes` rows by choosing newest `start`, then highest `title`.
- Counselor identity reads `Users Data > Full Name`; distribution reads `activity schools`/`Schools` and `Dep`/`Dep list`.
- Student mapping reads `Students > Full Name`, `Dep`, `grade`, `Class`, `Parent phone`, and `School`.
- Referral source maps to `Users Data`.
- Added Guidance_Situation Bubble payload builder with exact relationship fields.
- No Bubble admin token in browser code; live data still requires the school Bubble endpoint/session bridge.


## V1.0.16.1
- Fixed missing guidance-access.js on the main portal.
- Added explicit general-supervisor preview link for supervisory statistics.


## V1.0.18.1
- نقل شات التوجيه الطلابي من الهيدر إلى زر عائم ثابت أسفل يمين جميع الصفحات.
- الحفاظ على الشات الجماعي والفردي دون تغيير في منطق البيانات.
- إبقاء الهيدر أكثر نظافة: بوابة المنصات، الرئيسية، التنبيهات، الدعم.
- إضافة cache-busting للهيدر لتفادي ظهور التصميم القديم من المتصفح.

## V1.0.23 — School scope / records reliability
- School is treated as the campus/complex for the school deployment.
- Visible students are strictly filtered by Schools + Dep list + Grades.
- `User Student` is used by its exact Bubble field name.
- Records catalog renders before Bubble/archive network calls so all 16 digital records remain visible.
- All 16 record definitions now have a Bubble persistence mapping using confirmed existing types/fields; aggregate lateness/absence tracking is preserved in `Guidance_Log` details.

## V1.0.78 — Full-page collective report scrolling
- تقرير الإرشاد الجمعي يتمدد مع عدد السجلات بدون Scroll رأسي داخل البلوك.
- السكرول أصبح للصفحة بالكامل عند كبر التقرير.
- الأعمدة الأربعة تتكيف مع عرض الصفحة، وعلى الشاشات الضيقة تتحول الصفوف إلى بطاقات مقروءة بدون Nested Scroll.
- لا تغيير في قاعدة البيانات أو Workflows أو منطق الحفظ والتعديل والحذف.


# V1.0.81 — Statistics campus/stage terminology fix

- توحيد المصطلحات في صفحة الإحصائيات: `School` في Bubble يُعرض كمجمع، و`Department` يُعرض كمرحلة.
- جدول آخر النشاطات يعرض الآن: النوع، المجمع، المرحلة، التاريخ.
- حل أسماء المرحلة من دليل `Department` بدل إظهار أي مرجع Bubble.
- تغيير عناوين المقارنات والفلاتر من المدرسة إلى المجمع حتى لا تختلط المرحلة بالمجمع.

# V1.0.83 — النشاط حسب المجمع والمرحلة

- تطوير لوحة الإحصائيات من إجمالي النشاط حسب المجمع فقط إلى عرض هرمي حسب `School` (المجمع) ثم `Department` (المرحلة).
- كل مجمع يعرض إجمالي النشاط، عدد الطلاب المستفيدين، ونسبة إنجاز الخطة.
- تحت كل مجمع تظهر المراحل المسجل عليها نشاط، مع إنجاز الخطة والبرامج والجلسات وإجمالي النشاط والطلاب لكل مرحلة.
- ترتيب المراحل دراسيًا قدر الإمكان: ابتدائية أولية، ابتدائية عليا، متوسطة، ثانوية.
- إتاحة التفصيل في نطاق المدرسة والإشراف، مع احترام فلاتر العام والفصل والمجمع والصلاحيات الحالية.
- لا تغيير في Bubble schema أو Workflows.

# V1.0.84 — صلاحيات الإحصائيات حسب الدور

- تقييد الموجه الطلابي على المجمع والمرحلة الموزع عليهما فقط.
- فتح جميع المجمعات والمراحل للمشرف، المشرف العام، مشرف المجمع، مدير المجمعات ومدير النظام.
- إضافة دعم صريح لمسمى مدير النظام في تحديد الدور.
- توحيد بطاقة الإحصائيات الإشرافية على عبارة جميع المجمعات والمراحل.
- لا تغيير في Bubble schema أو Workflows.
