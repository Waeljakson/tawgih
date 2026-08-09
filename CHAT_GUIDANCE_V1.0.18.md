# شات التوجيه الطلابي — V1.0.18

لا يحتاج Data Type جديد في Bubble. يعتمد على `Guidance_Message` الموجود بالفعل.

## المحادثة الجماعية
- `MessageType`: `chat_group`
- `RecipientType`: `guidance_group`
- `Channel`: `internal_chat`
- `Guide`: المستخدم الحالي من `Users Data`
- `MessageText`: نص الرسالة
- `CreatedDateCustom` / `SentDate`: وقت الرسالة

## المحادثة الفردية
- `MessageType`: `chat_direct`
- `RecipientType`: `internal_employee`
- `RecipientEmployee`: المستخدم المختار من `Users Data`
- `Guide`: المرسل الحالي
- `Channel`: `internal_chat`

## قواعد الواجهة
- لا يمكن كتابة اسم المرسل أو المستلم يدويًا.
- قائمة الأشخاص مأخوذة من `Users Data` وتعرض مستخدمي التوجيه/الإشراف.
- زر الشات موجود في الهيدر الموحد في كل صفحات المنصة.
- في عدم توفر Bubble API، تعمل الواجهة بـ fallback محلي للتجربة فقط.

## الخصوصية عند التشغيل الحي
اضبط Privacy Rules في Bubble بحيث رسائل `chat_direct` يقرأها المرسل والمستلم فقط، ورسائل `chat_group` يقرأها مستخدمو التوجيه المصرح لهم. لا تضع Admin API Token في ملفات الواجهة.
