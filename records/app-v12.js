"use strict";

const SUPABASE_URL = "https://fpicgtldwfevdvpbxkjf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
const WHATSAPP_NUMBER = "966582712620";
const CURRENT_PACKAGE_CODE = "guidance_records";
const UNIFIED_PLATFORM_ROUTES = {
  results_analysis: {label:"تحليل النتائج", href:"../analysis/index.html"},
  guidance_records: {label:"السجلات الرقمية", href:"../records/index.html"},
  presentations: {label:"العروض التقديمية", href:"../presentations/index.html"},
  counselor_plan: {label:"خطة الموجه", href:"../plans/index.html"},
  achievement_reports: {label:"تقارير الإنجاز", href:"../reports/index.html"},
  messages_library: {label:"مراسلات ولي الأمر", href:"../messages/index.html"}
};
function unifiedLaunchKey(code){return `unified_platform_launch_${code}`;}
function rememberUnifiedLaunch(code){try{sessionStorage.setItem(unifiedLaunchKey(code),String(Date.now()));sessionStorage.setItem("unified_last_platform",code);}catch(_error){}}
function clearUnifiedLaunches(){try{Object.keys(sessionStorage).filter(k=>k.startsWith("unified_platform_launch_")).forEach(k=>sessionStorage.removeItem(k));sessionStorage.removeItem("unified_last_platform");}catch(_error){}}
function cameFromUnifiedPortal(){
  const params=new URLSearchParams(location.search);const fromPortal=params.get("from")==="portal";
  let remembered=false;try{remembered=Boolean(sessionStorage.getItem(unifiedLaunchKey(CURRENT_PACKAGE_CODE)));}catch(_error){}
  if(fromPortal){rememberUnifiedLaunch(CURRENT_PACKAGE_CODE);params.delete("from");const q=params.toString();history.replaceState({},"",location.pathname+(q?`?${q}`:""));return true;}
  return remembered;
}
function activeUnifiedEntitlements(){return (state.entitlements||[]).filter(e=>e.is_active!==false&&e.expires_at&&new Date(e.expires_at).getTime()>Date.now());}
function unifiedHasAccess(code){const active=activeUnifiedEntitlements();if(state.account?.is_system_admin)return true;if(code==='messages_library')return active.some(e=>e.billing_period==='yearly');return active.some(e=>e.product_code==='all_access'||e.product_code===code);}
function goToUnifiedPlatform(code){const item=UNIFIED_PLATFORM_ROUTES[code];if(!item||item.coming||!unifiedHasAccess(code))return;rememberUnifiedLaunch(code);location.href=`${item.href}?from=portal`;}
const UNIFIED_PLATFORM_ICONS={
  results_analysis:'<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
  guidance_records:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>',
  presentations:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21l4-5 4 5M8 9h3M8 12h7"/></svg>',
  counselor_plan:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m15 16 1.4 1.4L19 14.8"/></svg>',
  achievement_reports:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="m15 17 1.5 1.5L20 15"/></svg>',
  messages_library:'<svg viewBox="0 0 24 24"><path d="M4 5h16v12H7l-3 3z"/><path d="M8 9h8M8 13h5"/></svg>'
};
function unifiedPlanMeta(){
  const active=activeUnifiedEntitlements();
  if(state.account?.is_system_admin)return {label:'مدير النظام',detail:'صلاحية كاملة لجميع المنصات',trial:false};
  if(active.some(e=>e.product_code==='all_access'))return {label:'الباقة الشاملة',detail:'جميع المنصات مفعّلة',trial:false};
  if(active.length){
    const labels=active.map(e=>PACKAGE_LABELS[e.product_code]||e.product_code);
    const nearest=[...active].sort((a,b)=>new Date(a.expires_at)-new Date(b.expires_at))[0];
    const expiry=nearest?.expires_at?new Date(nearest.expires_at).toLocaleDateString('ar-SA'):'نشطة';
    return {label:labels.join(' + '),detail:`سارية حتى ${expiry}`,trial:false};
  }
  return {label:'حساب تجريبي',detail:'المعاينة فقط',trial:true};
}
function renderUnifiedPlatformSwitcher(){
  const bar=document.getElementById('unifiedPlatformBar');
  const box=document.getElementById('platformSwitcher');
  const badge=document.getElementById('platformPlanBadge');
  if(!bar||!box||!badge||!state.user){if(bar)bar.hidden=true;return;}
  const plan=unifiedPlanMeta();
  box.innerHTML=Object.entries(UNIFIED_PLATFORM_ROUTES).filter(([code])=>code!=="messages_library").map(([code,item])=>{
    const icon=UNIFIED_PLATFORM_ICONS[code]||'';
    if(item.coming)return `<span class="platform-tab coming" aria-disabled="true"><span class="platform-tab-icon">${icon}</span><span class="platform-tab-copy"><strong>${item.label}</strong><small>قريبًا</small></span></span>`;
    if(!unifiedHasAccess(code))return `<span class="platform-tab locked" aria-disabled="true"><span class="platform-tab-icon">${icon}</span><span class="platform-tab-copy"><strong>${item.label}</strong><small>غير مفعّلة</small></span></span>`;
    const current=code===CURRENT_PACKAGE_CODE;
    return `<a href="${item.href}?from=portal" data-unified-platform="${code}" class="platform-tab${current?' current':''}"${current?' aria-current="page"':''}><span class="platform-tab-icon">${icon}</span><span class="platform-tab-copy"><strong>${item.label}</strong><small>${current?'المنصة الحالية':'انتقال إلى المنصة'}</small></span></a>`;
  }).join('');
  badge.innerHTML=`<span class="platform-plan-status${plan.trial?' trial':''}"></span><span class="platform-plan-copy"><span>الباقة الحالية</span><strong>${plan.label}</strong><small>${plan.detail}</small></span>`;
  bar.hidden=false;
  box.querySelectorAll('[data-unified-platform]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goToUnifiedPlatform(a.dataset.unifiedPlatform);}));
}

const PACKAGE_LABELS = {
  results_analysis: "باقة تحليل النتائج",
  guidance_records: "باقة السجلات الرقمية",
  presentations: "باقة العروض التقديمية",
  counselor_plan: "باقة خطة الموجه الطلابي",
  program_ideas: "باقة أفكار البرامج",
  all_access: "الباقة الشاملة"
};
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const WEEK_NAMES = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر","الحادي عشر","الثاني عشر","الثالث عشر","الرابع عشر","الخامس عشر","السادس عشر","السابع عشر","الثامن عشر"];
const EDUCATIONAL_PROBLEMS = ["إهمال تأدية الواجبات","النوم أثناء الحصص","امتهان الكتاب المدرسي","الخروج من الفصل بدون إذن","عدم الانتباه للشرح","طمس ملاحظات مذكرة الواجبات","إهمال إحضار الأدوات","النسيان المتكرر للكتب المدرسية","عدم المشاركة في الحصة","التأخر الصباحي","التأخر عن الحصص","التكلم بدون إذن"];
const BEHAVIORAL_PROBLEMS = ["التلفظ على معلم","الشغب داخل المدرسة","عدم الاستجابة للمعلم","التلفظ على زميل","العبث بمرافق المدرسة","المشاركة في مضاربة أو شجار","ألفاظ أو إيحاءات بذيئة","فرط الحركة","إيذاء زميل نفسيًا","التحرش","تشتت الانتباه","تعطيل سير الحصة","عنف جسدي في حصة البدنية","التأخر عن الصلاة"];
const GUIDANCE_SKILLS = ["التعزيز","الإرشاد بنظرية الذات","التواصل مع ولي الأمر","الغمر","الإرشاد الديني","التواصل مع الزملاء للإيضاح والاستفسار","التعاقد السلوكي","ضرب الأمثلة التوضيحية","التدخل للإصلاح","الإطفاء","الإرشاد إلى عاقبة السلوك","الاقتصاد الرمزي","الإرشاد العقلاني الانفعالي","إرشاد جمعي سريع","التواصل مع المعلمين"];
const VISIT_TOPICS = ["الغياب","الصلاة","النظافة الشخصية","التأخر","الاحترام","التنابذ بالألقاب أو التلفظ على الزملاء","بر الوالدين","امتهان الكتب المدرسية","الاستذكار الجيد","تنظيم الوقت","الأمانة","إدارة المشاعر","القرارات الخطرة","تحقيق الأهداف","العلاقات الاجتماعية","الاستعداد للاختبارات","المحافظة على الممتلكات","إدارة الغضب"];
const CASE_SKILLS = ["مهارة الأسئلة","التشجيع والإعادة والتلخيص","التعبير عن مشاعر المسترشد","التعبير عن المعاني","إنهاء المقابلة","المواجهة","أسئلة المسترشد للموجه","التفسير","تقديم المعلومات"];
const DAILY_BEHAVIOR_CODES = ["101 — التلفظ على معلم","102 — التلفظ على زميل","103 — ألفاظ أو إيحاءات بذيئة","104 — تحرش","105 — شغب داخل المدرسة","106 — عبث بمرافق المدرسة","107 — فرط حركة","108 — تشتت انتباه","109 — عدم الاستجابة للمعلم","110 — المشاركة بمضاربة أو شجار","111 — إيذاء زميل نفسيًا","112 — تعطيل سير الحصة"];
const DAILY_EDUCATION_CODES = ["201 — إهمال تأدية الواجبات","202 — خروج من الفصل بدون إذن","203 — إهمال إحضار الأدوات","204 — التأخر الصباحي","205 — التأخر عن الحصص","206 — التكلم بدون إذن","207 — النوم أثناء الحصص","208 — عدم الانتباه للشرح","209 — نسيان متكرر للكتب المدرسية","210 — عدم المشاركة بالحصة الدراسية","211 — إهمال أبحاث أو ملف إنجاز","212 — امتهان الكتاب المدرسي"];
const DAILY_ACTION_CODES = ["401 — الإرشاد العقلاني الانفعالي","402 — الإرشاد بالواقع","403 — الإرشاد بنظرية الذات","404 — الإرشاد الديني","405 — ضرب الأمثلة التوضيحية","406 — الإرشاد إلى عاقبة السلوك","407 — أسلوب الاقتصاد الرمزي","408 — السحب التدريجي","409 — إرشاد جمعي سريع","410 — التدخل للإصلاح","411 — التواصل مع ولي الأمر","412 — التواصل مع الزملاء للإيضاح والاستفسار","413 — التواصل مع المعلمين","414 — اقتراح برنامج لتنظيم الوقت","415 — الغمر","416 — التعاقد السلوكي"];

function section(title, fields, subtitle = "") { return { title, subtitle, fields }; }
function f(key, label, type = "text", opts = {}) { return { key, label, type, ...opts }; }
function repetitionWeeks(kind) {
  const prefix = kind === "lateness" ? "التأخر" : "الغياب";
  return {
    key: `${kind}_weekly_tracking`, label: `المتابعة الأسبوعية لحصر ${prefix}`, type: "matrix", rows: WEEK_NAMES.map((name, i) => ({week: name, index: i + 1})),
    columns: [
      {key:"week",label:"الأسبوع",type:"static"},
      {key:"count3",label:"عدد حالات 3 أيام",type:"number"},
      {key:"supervisor3",label:"توقيع المراقب",type:"text"},
      {key:"awareness3",label:"رسالة توعية",type:"yesno"},
      {key:"individual3",label:"إرشاد فردي",type:"yesno"},
      {key:"signature3",label:"التوقيع",type:"text"},
      {key:"count5",label:"عدد حالات 5 أيام",type:"number"},
      {key:"counselor5",label:"توقيع الموجه",type:"text"},
      {key:"message5",label:"إرسال رسالة",type:"yesno"},
      {key:"warning5",label:"إنذار",type:"yesno"},
      {key:"signature5",label:"التوقيع",type:"text"}
    ]
  };
}

const RECORDS = {
  group_guidance: {
    title: "الإرشاد الجمعي", category: "الجلسات الإرشادية", icon: "👥", confidential: false,
    description: "يوثّق جلسة إرشاد جمعي من تحديد المستهدفين وعنوان الجلسة إلى الأهداف والإجراءات وسير الجلسة والمهام والتقييم والموعد القادم.",
    studentKey: "", classKey: "stage", sections: [
      section("بيانات الجلسة", [
        f("session_title","عنوان الجلسة","text",{span:8,required:true}), f("day","اليوم","text",{span:4}), f("stage","المرحلة","text",{span:4}), f("complex","المجمع / المبنى","text",{span:4}), f("session_number","رقم الجلسة","text",{span:4})
      ]),
      section("المستهدفون", [
        f("participants","أسماء الطلاب المستهدفين","repeater",{columns:[{key:"student_name",label:"اسم الطالب",type:"text"},{key:"class_name",label:"الفصل",type:"text"},{key:"signature",label:"التوقيع",type:"text"}],minRows:4})
      ],"يمكن إضافة أي عدد من الطلاب."),
      section("التخطيط والتنفيذ", [
        f("objectives","أهداف الجلسة","textarea",{span:12,rows:5}), f("procedures","الإجراءات","textarea",{span:12,rows:4}), f("tools","الأدوات","text",{span:8}), f("duration","الزمن بالدقائق","number",{span:4}), f("session_flow","سير الجلسة","textarea",{span:12,rows:7})
      ]),
      section("المتابعة والتقييم", [
        f("student_tasks","المهام المطلوب تنفيذها من الطلاب","textarea",{span:12,rows:5}), f("evaluation","تقييم الجلسة","textarea",{span:12,rows:7}), f("next_session_date","موعد الجلسة القادمة","date",{span:4}), f("counselor_name","الموجه الطلابي","text",{span:4}), f("signature","التوقيع","text",{span:4})
      ])
    ]
  },
  academic_weakness_guidance: {
    title: "إرشاد فردي لحالة ضعف دراسي", category: "الجلسات الإرشادية", icon: "📉", confidential: false,
    description: "جلسة فردية لمساندة الطالب في فهم أسباب الضعف الدراسي، رفع الدافعية، تحسين الاستذكار، والتنسيق مع ولي الأمر لمعالجة التعثر.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الطالب ووصف المشكلة", [
        f("student_name","اسم الطالب","text",{span:6,required:true}), f("class_name","الفصل","text",{span:3}), f("session_date","تاريخ الجلسة","date",{span:3}), f("weak_subjects","المواد التي يظهر فيها الضعف","text",{span:8}), f("score_percent","النسبة المحققة","number",{span:2}), f("absence_days","عدد أيام الغياب","number",{span:2}), f("problem_description","وصف المشكلة","textarea",{span:12,rows:4})
      ]),
      section("أهداف الجلسة", [
        f("goals","الأهداف المحددة","checklist",{options:["تنمية الثقة بالنفس لدى الطالب","تنمية دافع الإنجاز التعليمي","رفع مستوى التحصيل وتنمية القدرات","معرفة طرق الاستذكار الجيد","إدراك كيفية استغلال الوقت","التواصل مع ولي الأمر"]}), f("other_goal","هدف آخر","text",{span:12})
      ]),
      section("محتوى الجلسة", [
        f("session_steps","الإجراءات المنفذة","checklist",{options:["تعريف الطالب بأن الهدف هو مساعدته في حل المشكلة","مناقشة أسباب الضعف الدراسي","مساعدة الطالب على توصيف أسباب الضعف","تسليم دعوة لولي الأمر","توضيح أثر الحصول على نسبة أقل من المستوى المستهدف","الاتفاق على خطة تحسين"]}), f("session_content","تفاصيل الجلسة والملاحظات","textarea",{span:12,rows:6}), f("student_commitment","التزام الطالب","textarea",{span:12,rows:3}), f("next_session_date","موعد الجلسة القادمة","date",{span:4}), f("counselor_name","الموجه الطلابي","text",{span:4}), f("signature","التوقيع","text",{span:4})
      ])
    ]
  },
  educational_guidance: {
    title: "إرشاد فردي لمشكلة تعليمية", category: "الجلسات الإرشادية", icon: "📚", confidential: false,
    description: "يسجّل المشكلة التعليمية التي يعاني منها الطالب، والمهارات الإرشادية المستخدمة، ومحتوى الجلسة وقرار المتابعة أو إنهاء الحالة.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الطالب", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الفصل","text",{span:3}),f("session_date","التاريخ","date",{span:3}),f("period","الحصة","text",{span:4})]),
      section("المشكلة التعليمية", [f("problems","حدد المشكلات الملحوظة","checklist",{options:EDUCATIONAL_PROBLEMS}),f("problem_notes","وصف إضافي للمشكلة","textarea",{span:12,rows:3})]),
      section("المهارة المستخدمة", [f("skills","حدد المهارات والأساليب","checklist",{options:GUIDANCE_SKILLS})]),
      section("محتوى الجلسة والمتابعة", [f("session_content","محتوى الجلسة","textarea",{span:12,rows:6}),f("case_status","حالة الجلسة","radio",{options:["حالة منتهية","جلسة أخرى"]}),f("next_session_date","موعد الجلسة القادمة","date",{span:4}),f("counselor_name","الموجه الطلابي","text",{span:4}),f("signature","التوقيع","text",{span:4})])
    ]
  },
  behavioral_guidance: {
    title: "إرشاد فردي لمشكلة سلوكية", category: "الجلسات الإرشادية", icon: "🧭", confidential: false,
    description: "نموذج لتوثيق المشكلة السلوكية والمهارة الإرشادية المستخدمة وتفاصيل الجلسة واحتياج الطالب إلى جلسة أخرى.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الطالب", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الفصل","text",{span:3}),f("session_date","التاريخ","date",{span:3}),f("period","الحصة","text",{span:4})]),
      section("المشكلة السلوكية", [f("problems","حدد السلوكيات الملحوظة","checklist",{options:BEHAVIORAL_PROBLEMS}),f("problem_notes","وصف إضافي للموقف","textarea",{span:12,rows:3})]),
      section("المهارة المستخدمة", [f("skills","حدد المهارات والأساليب","checklist",{options:GUIDANCE_SKILLS})]),
      section("محتوى الجلسة والمتابعة", [f("session_content","محتوى الجلسة","textarea",{span:12,rows:6}),f("case_status","حالة الجلسة","radio",{options:["حالة منتهية","جلسة أخرى"]}),f("next_session_date","موعد الجلسة القادمة","date",{span:4}),f("counselor_name","الموجه الطلابي","text",{span:4}),f("signature","التوقيع","text",{span:4})])
    ]
  },
  lateness_guidance: {
    title: "إرشاد فردي لمتكرري التأخر", category: "المواظبة والانضباط", icon: "⏰", confidential: false,
    description: "يوثق جلسات الطلاب متكرري التأخر، وعدد أيام التأخر، وتواريخ الرسائل، وأسباب المشكلة والحلول والالتزام بعدم التكرار.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الطالب", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الفصل","text",{span:3}),f("session_date","تاريخ الجلسة","date",{span:3})]),
      section("متابعة التكرار", [f("thresholds","بيانات 3 و5 و10 أيام","repeater",{columns:[{key:"days",label:"عدد الأيام",type:"number"},{key:"session_date",label:"تاريخ الجلسة",type:"date"},{key:"message_date",label:"تاريخ الرسالة",type:"date"},{key:"student_signature",label:"توقيع الطالب",type:"text"}],defaults:[{days:3},{days:5},{days:10}]})]),
      section("أهداف الجلسة", [f("goals","الإجراءات والأهداف","checklist",{options:["تبصير الطالب بأضرار تكرار التأخر","بحث الأسباب ووضع الحلول المناسبة","تعريف الطالب بعدد أيام التأخر بدون عذر","مساعدة الطالب على التواصل مع الإدارة","توضيح أن الموجه جهة مساعدة لا جهة عقاب","تسليم إشعار لولي الأمر","الاتفاق على عدم التأخر في الفترة القادمة"]})]),
      section("المناقشة والمتابعة", [f("causes","أسباب التأخر من وجهة نظر الطالب","textarea",{span:6,rows:4}),f("solutions","الحلول المتفق عليها","textarea",{span:6,rows:4}),f("parent_contact","نتيجة التواصل مع ولي الأمر","textarea",{span:12,rows:3}),f("student_commitment","التزام الطالب","textarea",{span:12,rows:3}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  },
  absence_guidance: {
    title: "إرشاد فردي لمتكرري الغياب", category: "المواظبة والانضباط", icon: "📅", confidential: false,
    description: "يسجل جلسات الغياب المتكرر وأعداد الأيام وتواريخ التواصل والأسباب والحلول والتزام الطالب بالمواظبة.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الطالب", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الفصل","text",{span:3}),f("session_date","تاريخ الجلسة","date",{span:3})]),
      section("متابعة التكرار", [f("thresholds","بيانات 3 و5 و10 أيام","repeater",{columns:[{key:"days",label:"عدد الأيام",type:"number"},{key:"session_date",label:"تاريخ الجلسة",type:"date"},{key:"message_date",label:"تاريخ الرسالة",type:"date"},{key:"student_signature",label:"توقيع الطالب",type:"text"}],defaults:[{days:3},{days:5},{days:10}]})]),
      section("أهداف الجلسة", [f("goals","الإجراءات والأهداف","checklist",{options:["تبصير الطالب بأضرار تكرار الغياب","بحث الأسباب ووضع الحلول المناسبة","تعريف الطالب بعدد أيام الغياب بدون عذر","مساعدة الطالب على التواصل مع الإدارة","توضيح أن الموجه جهة مساعدة لا جهة عقاب","تسليم إشعار لولي الأمر","الاتفاق على عدم الغياب في الفترة القادمة"]})]),
      section("المناقشة والمتابعة", [f("causes","أسباب الغياب من وجهة نظر الطالب","textarea",{span:6,rows:4}),f("solutions","الحلول المتفق عليها","textarea",{span:6,rows:4}),f("parent_contact","نتيجة التواصل مع ولي الأمر","textarea",{span:12,rows:3}),f("student_commitment","التزام الطالب","textarea",{span:12,rows:3}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  },
  guardian_contact: {
    title: "التواصل مع ولي الأمر", category: "التواصل والشراكة", icon: "☎️", confidential: false,
    description: "يوثّق كل عملية تواصل مع ولي الأمر وطريقتها وغرضها ونتيجتها وما يلزم من متابعة لاحقة.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات التواصل", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الصف / الفصل","text",{span:3}),f("contact_date","التاريخ","date",{span:3}),f("guardian_name","اسم ولي الأمر","text",{span:6}),f("guardian_phone","رقم التواصل","tel",{span:3}),f("contact_method","طريقة التواصل","radio",{options:["واتساب","SMS","اتصال","زيارة"]})]),
      section("الغرض والنتيجة", [f("purpose","الغرض من التواصل","textarea",{span:12,rows:4}),f("communication_details","ملخص ما تم تداوله","textarea",{span:12,rows:5}),f("outcome","نتيجة التواصل","textarea",{span:12,rows:3}),f("follow_up_needed","هل يحتاج إلى متابعة؟","radio",{options:["نعم","لا"]}),f("follow_up_date","تاريخ المتابعة","date",{span:4}),f("counselor_name","الموجه الطلابي","text",{span:4}),f("signature","التوقيع","text",{span:4})])
    ]
  },
  guidance_visit: {
    title: "الزيارة التوجيهية", category: "الزيارات والبرامج", icon: "🎯", confidential: false,
    description: "نموذج لتخطيط وتنفيذ زيارة توجيهية أو درس إرشادي وتحديد موضوعه وأهدافه وفرص التحسين بعد التنفيذ.",
    studentKey: "", classKey: "class_name", sections: [
      section("بيانات الزيارة", [f("class_name","الفصل","text",{span:3}),f("period","الحصة","text",{span:3}),f("duration","مدة الزيارة بالدقائق","number",{span:3}),f("visit_date","التاريخ","date",{span:3}),f("visit_type","نوع الزيارة","radio",{options:["زيارة توجيهية","درس إرشادي"]})]),
      section("موضوع الزيارة", [f("topics","حدد الموضوعات","checklist",{options:VISIT_TOPICS}),f("other_topic","موضوع آخر","text",{span:12})]),
      section("أهداف الزيارة", [f("goals","الأهداف المنفذة","checklist",{options:["تنمية ثقة الطلاب والنظرة الإيجابية للذات","تعميق قيم التسامح واحترام الرأي المخالف","التعويد على التفكير النقدي والحكم المتبصر","ربط الموضوع بحاجات فعلية للطلاب","تنمية الاستقلالية وروح المبادرة والتعاون","تعميق التواصل مع الأقران والواقع المحيط","صبغ المهمات المدرسية بالواقعية","تمكين الطلاب من المهارات المختلفة"]}),f("visit_notes","ملخص التنفيذ والملاحظات","textarea",{span:12,rows:5})]),
      section("فرص التحسين", [f("improvements","فرص التحسين","checklist",{options:["يمكن تطوير الموضوع إلى برنامج","يحتاج وقتًا أكثر","يحتاج أوراق عمل وأدوات","يحتاج أكثر من لقاء","يحتاج تغيير المكان","يحتاج الاستعانة بأحد المعلمين"]}),f("improvement_notes","تفاصيل إضافية","textarea",{span:12,rows:3}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  },
  case_study: {
    title: "دراسة حالة", category: "دراسة الحالة", icon: "🔐", confidential: true,
    description: "سجل سري متكامل للحالة يتضمن بيانات الإحالة والتكوين الأسري وملخص المشكلة والتشخيص والخطة العلاجية والمهارات والمقابلات.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("تعريف الحالة", [f("case_code","رمز الحالة","text",{span:3}),f("case_number","رقم الحالة","text",{span:3}),f("classification","التصنيف","text",{span:3}),f("discovery_date","تاريخ اكتشاف الحالة","date",{span:3})]),
      section("البيانات الأولية", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("birth_date","تاريخ الميلاد","date",{span:3}),f("class_name","الصف / الفصل","text",{span:3}),f("guardian_name","ولي أمر الطالب","text",{span:6}),f("contact_numbers","أرقام التواصل","text",{span:6})]),
      section("معلومات عن الإحالة", [f("referral_date","تاريخ التحويل","date",{span:3}),f("referrer_name","اسم القائم بالتحويل","text",{span:5}),f("referrer_role","صفته","text",{span:4}),f("referral_reason","سبب التحويل","textarea",{span:12,rows:5})]),
      section("التكوين الأسري", [f("family_members","أفراد الأسرة","repeater",{columns:[{key:"name",label:"الاسم",type:"text"},{key:"relationship",label:"صلة القرابة",type:"text"},{key:"age",label:"العمر",type:"number"},{key:"education",label:"المستوى التعليمي",type:"text"},{key:"notes",label:"ملاحظات",type:"text"}],minRows:4})]),
      section("التشخيص", [f("problem_summary","ملخص المشكلة","textarea",{span:12,rows:6}),f("preliminary_diagnosis","التشخيص المبدئي والفرضيات","repeater",{columns:[{key:"hypothesis",label:"قد يكون",type:"textarea"},{key:"evidence",label:"المؤشرات أو الأدلة",type:"textarea"}],minRows:3}),f("final_diagnosis","التشخيص النهائي","textarea",{span:12,rows:6})]),
      section("الخطة العلاجية", [f("environmental_plan","الخطة البيئية المقترحة","textarea",{span:6,rows:8}),f("self_plan","الخطة الذاتية المقترحة","textarea",{span:6,rows:8}),f("skills","المهارات المستخدمة","checklist",{options:CASE_SKILLS})]),
      section("المقابلات والمتابعة", [f("interviews","المقابلات","repeater",{columns:[{key:"interview",label:"المقابلة",type:"text"},{key:"date",label:"التاريخ",type:"date"},{key:"duration",label:"الزمن",type:"text"},{key:"next_date",label:"الموعد القادم",type:"date"}],minRows:4}),f("counselor_name","الموجه الطلابي","text",{span:4}),f("signature","التوقيع","text",{span:4}),f("closing_date","تاريخ إغلاق الحالة","date",{span:4})])
    ]
  },
  guardian_invitation: {
    title: "دعوة ولي أمر", category: "التواصل والشراكة", icon: "✉️", confidential: false,
    description: "خطاب رسمي لدعوة ولي أمر الطالب للحضور إلى المدرسة لمناقشة أمر تحصيلي أو تربوي مع توثيق استجابته والموعد البديل.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الدعوة", [f("school_day","اليوم","text",{span:3}),f("invitation_date","تاريخ إصدار الدعوة","date",{span:3}),f("guardian_name","اسم ولي الأمر","text",{span:6}),f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الصف / الفصل","text",{span:3}),f("appointment_date","موعد الحضور","date",{span:3}),f("appointment_time","الساعة","time",{span:3}),f("meeting_with","المطلوب مقابلته","text",{span:3,value:"الموجه الطلابي"}),f("invitation_reason","سبب الدعوة","textarea",{span:12,rows:4})]),
      section("نص الدعوة", [f("invitation_text","نص الخطاب","textarea",{span:12,rows:10,value:"السلام عليكم ورحمة الله وبركاته، وبعد:\nسعيًا من قسم التوجيه الطلابي بالمدرسة لمساعدة الطالب والتعاون بين المدرسة والمنزل، نأمل منكم التكرم بالحضور في الموعد المحدد لمناقشة ما يحقق مصلحة ابنكم التعليمية والتربوية. شاكرين لكم حسن تعاونكم وتجاوبكم."})]),
      section("استجابة ولي الأمر", [f("response","الاستجابة","radio",{options:["سأحضر في الموعد المحدد","لن أستطيع الحضور وسأحدد موعدًا بديلًا"]}),f("alternative_date","الموعد البديل","date",{span:4}),f("alternative_time","الساعة البديلة","time",{span:4}),f("guardian_signature","توقيع ولي الأمر","text",{span:4})]),
      section("الاعتماد", [f("counselor_name","الموجه الطلابي","text",{span:4}),f("counselor_signature","توقيع الموجه","text",{span:4}),f("principal_name","مدير المدرسة","text",{span:4}),f("principal_signature","توقيع المدير","text",{span:6}),f("approval_date","التاريخ","date",{span:6})])
    ]
  },
  observation_visit: {
    title: "زيارة الملاحظة", category: "الزيارات والبرامج", icon: "👁️", confidential: false,
    description: "توثّق ملاحظة البيئة الصفية وسلوك الطلاب من حيث التركيز والنظافة والمشاركة والأدوات وانتظام الجلسة، وتحدد من يحتاج إلى متابعة.",
    studentKey: "", classKey: "class_name", sections: [
      section("بيانات الزيارة", [f("class_name","الفصل","text",{span:3}),f("period","الحصة","text",{span:3}),f("duration","مدة الزيارة بالدقائق","number",{span:3}),f("visit_date","التاريخ","date",{span:3})]),
      section("ملاحظات الزيارة", [f("focus","التركيز","radio",{options:["منتبه","مشتت"]}),f("hygiene","النظافة الشخصية","radio",{options:["جيد","مقبول"]}),f("participation","المشاركة","radio",{options:["مشاركون","غير مهتمين"]}),f("tools","إحضار الأدوات","radio",{options:["منضبطون","يوجد إهمال"]}),f("seating","انتظام الجلسة الصفية","radio",{options:["منتظمون","عشوائي"]}),f("needs_guidance_visit","الحاجة إلى زيارة توجيهية","radio",{options:["تحتاج","لا تحتاج"]}),f("observation_notes","ملاحظات إضافية","textarea",{span:12,rows:5})]),
      section("أهداف الزيارة", [f("goals","الأهداف المتحققة","checklist",{options:["الوقوف على حاجات الطلاب الفعلية والتخطيط لتلبيتها","ملاحظة سلوك الطلاب وحصر الظواهر","ملاحظة أثر المعلم في تقدم الطلاب","ملاحظة الموقف التعليمي بصورة طبيعية","متابعة أثر البرامج العلاجية","ملاحظة الاهتمام بالنظافة الشخصية","ملاحظة الاهتمام بالكتب والأدوات"]})]),
      section("طلاب يحتاجون إلى متابعة", [f("follow_up_students","الطلاب","repeater",{columns:[{key:"student_name",label:"اسم الطالب",type:"text"},{key:"reason",label:"سبب المتابعة",type:"text"},{key:"recommended_action",label:"الإجراء المقترح",type:"text"}],minRows:3}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  },
  new_student_interview: {
    title: "مقابلة طالب مستجد", category: "المقابلات", icon: "🌟", confidential: false,
    description: "مقابلة ترحيبية للتعرف على الطالب المستجد وتعريفه بالبيئة المدرسية والأنظمة والدعم الأكاديمي والنفسي وقنوات التواصل.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الطالب", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الفصل","text",{span:3}),f("interview_date","التاريخ","date",{span:3}),f("previous_school","المدرسة السابقة","text",{span:6}),f("interests","الاهتمامات والهوايات","text",{span:6})]),
      section("محاور المقابلة", [f("axes","المحاور التي تمت مناقشتها","checklist",{options:["الترحيب والتعارف","التعرف على البيئة المدرسية","الأنظمة والقواعد المدرسية","الدعم الأكاديمي","الجانب النفسي والاجتماعي","قنوات التواصل مع الموجه الطلابي"]}),f("student_feelings","مشاعر الطالب تجاه المدرسة الجديدة","textarea",{span:6,rows:4}),f("academic_background","مستواه السابق والصعوبات إن وجدت","textarea",{span:6,rows:4})]),
      section("ملاحظات الموجه", [f("counselor_notes","الملاحظات والتوصيات","textarea",{span:12,rows:8}),f("follow_up_needed","الحاجة إلى متابعة","radio",{options:["نعم","لا"]}),f("follow_up_date","موعد المتابعة","date",{span:4}),f("counselor_name","الموجه الطلابي","text",{span:4}),f("signature","التوقيع","text",{span:4})])
    ]
  },
  individual_interview: {
    title: "مقابلة فردية", category: "المقابلات", icon: "🗣️", confidential: false,
    description: "يوثق مقابلة فردية مع طالب أو ولي أمر أو شخص ذي صلة، متضمنة أهداف المقابلة ومحتواها والنتائج والمتابعة.",
    studentKey: "person_name", classKey: "class_name", sections: [
      section("بيانات المقابلة", [f("interview_number","رقم المقابلة","text",{span:3}),f("person_name","الاسم","text",{span:5,required:true}),f("relationship","صلة القرابة / الصفة","text",{span:4}),f("class_name","الصف / الفصل","text",{span:4}),f("interview_date","التاريخ","date",{span:4}),f("duration","المدة","text",{span:4})]),
      section("أهداف المقابلة", [f("objectives","الأهداف","textarea",{span:12,rows:6})]),
      section("محتوى المقابلة", [f("content","محتوى الجلسة","textarea",{span:12,rows:8}),f("outcomes","النتائج والتوصيات","textarea",{span:12,rows:5}),f("next_date","موعد المقابلة القادمة","date",{span:4}),f("counselor_name","الموجه الطلابي","text",{span:4}),f("signature","التوقيع","text",{span:4})])
    ]
  },
  daily_incident: {
    title: "سجل المواقف اليومية", category: "المواقف والمتابعة", icon: "⚡", confidential: false,
    description: "يسجّل المواقف السلوكية أو التعليمية اليومية باستخدام دليل المواقف والإجراءات، مع مصدر الإحالة والملاحظات والمتابعة الأسبوعية.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات الموقف", [f("student_name","اسم الطالب","text",{span:6,required:true}),f("class_name","الفصل","text",{span:3}),f("incident_date","التاريخ","date",{span:3}),f("incident_category","نوع الموقف","radio",{options:["سلوكي","تعليمي"]}),f("behavior_code","الموقف السلوكي","select",{span:6,options:["",...DAILY_BEHAVIOR_CODES]}),f("education_code","الموقف التعليمي","select",{span:6,options:["",...DAILY_EDUCATION_CODES]}),f("referral_source","مصدر الإحالة","select",{span:6,options:[""],help:"يتم تحميل أسماء الموظفين من جدول الموظفين في Bubble، ويظهر اسم الموظف فقط."}),f("action_codes","الإجراءات المتخذة","checklist",{options:DAILY_ACTION_CODES}),f("incident_details","تفاصيل الموقف","textarea",{span:12,rows:5}),f("notes","ملاحظات","textarea",{span:12,rows:3})]),
      section("المتابعة الأسبوعية", [f("repeat_count","عدد التكرار","number",{span:3}),f("session_number","رقم الجلسة","text",{span:3}),f("follow_up_date","تاريخ المتابعة","date",{span:3}),f("case_status","الحالة","select",{span:3,options:["قيد المتابعة","تحسنت","تم الإغلاق"]}),f("follow_up_notes","ملاحظات المتابعة","textarea",{span:12,rows:4}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  },
  lateness_tracking: {
    title: "حصر تحويل حالات التأخر", category: "المواظبة والانضباط", icon: "🕒", confidential: false,
    description: "متابعة أسبوعية لحالات التأخر التي بلغت 3 أو 5 أيام، وتوثيق الرسائل والإرشاد الفردي والإنذارات والتوقيعات طوال الفصل الدراسي.",
    studentKey: "", classKey: "", sections: [
      section("بيانات الحصر", [f("semester","الفصل الدراسي","text",{span:4}),f("tracking_start","بداية المتابعة","date",{span:4}),f("tracking_end","نهاية المتابعة","date",{span:4}),repetitionWeeks("lateness")]),
      section("ملاحظات واعتماد", [f("notes","ملاحظات عامة","textarea",{span:12,rows:5}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  },
  absence_tracking: {
    title: "حصر تحويل حالات الغياب", category: "المواظبة والانضباط", icon: "🗓️", confidential: false,
    description: "متابعة أسبوعية لحالات الغياب التي بلغت 3 أو 5 أيام، وتسجيل الرسائل والإرشاد والإنذارات والاعتمادات طوال الفصل الدراسي.",
    studentKey: "", classKey: "", sections: [
      section("بيانات الحصر", [f("semester","الفصل الدراسي","text",{span:4}),f("tracking_start","بداية المتابعة","date",{span:4}),f("tracking_end","نهاية المتابعة","date",{span:4}),repetitionWeeks("absence")]),
      section("ملاحظات واعتماد", [f("notes","ملاحظات عامة","textarea",{span:12,rows:5}),f("counselor_name","الموجه الطلابي","text",{span:6}),f("signature","التوقيع","text",{span:6})])
    ]
  }
};

const CATEGORY_ORDER = ["الكل","الجلسات الإرشادية","المواظبة والانضباط","التواصل والشراكة","الزيارات والبرامج","دراسة الحالة","المقابلات","المواقف والمتابعة"];

const state = {
  user: null, account: null, packageAccess: false, entitlements: [], currentView: "dashboard", currentType: null, currentRecordId: null,
  pendingSchoolLogo: null, records: [], archiveLoaded: false, catalogCategory: "الكل",
  supportThread: null, supportMessages: [], supportPoll: null, adminUsers: [], adminRequests: [], adminEntitlements: [],
  adminSupportThreads: [], adminSelectedThread: null,
  studentReportStudents: [], studentReportRecords: [], studentReportPrintState: null
};

const el = Object.fromEntries(Array.from(document.querySelectorAll("[id]")).map(node => [node.id, node]));
el.navButtons = Array.from(document.querySelectorAll(".nav-button[data-view]"));
el.paymentPlanInputs = Array.from(document.querySelectorAll('input[name="premiumBillingPeriod"]'));

function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function cleanText(value){return String(value??"").replace(/\s+/g," ").trim();}
function todayISO(){return new Date().toISOString().slice(0,10);}
function formatDate(value){if(!value)return "—";const d=new Date(`${String(value).slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString("ar-SA");}
function formatDateTime(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?String(value):d.toLocaleString("ar-SA",{dateStyle:"medium",timeStyle:"short"});}
function showBox(node,message,isError=false){if(!node)return;node.hidden=false;node.className=`status-box${isError?" error":""}`;node.textContent=message;}
function hideBox(node){if(node)node.hidden=true;}
function debounce(fn,wait=250){let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait);};}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file);});}
function activeEntitlement(){
  const now=Date.now();
  const active=(state.entitlements||[]).filter(e=>e.is_active!==false&&e.expires_at&&new Date(e.expires_at).getTime()>now);
  return active.find(e=>e.product_code==="all_access")||active.find(e=>e.product_code===CURRENT_PACKAGE_CODE)||null;
}
function isPremiumAccess(){
  if(!state.account||!state.account.is_active)return false;
  return Boolean(state.account.is_system_admin||state.packageAccess);
}
function premiumLabel(){
  if(state.account?.is_system_admin)return "مدير النظام";
  const e=activeEntitlement();
  return e?(PACKAGE_LABELS[e.product_code]||"Premium"):"تجريبي";
}
function premiumExpiryLabel(){
  if(state.account?.is_system_admin)return "جميع المنصات متاحة";
  const e=activeEntitlement();
  if(!e)return "التعبئة والمعاينة فقط — لا توجد باقة سجلات نشطة";
  return `${e.billing_period==="monthly"?"شهري":"سنوي"} — صالح حتى ${formatDate(e.expires_at)}`;
}
function selectedPlan(){
  const value=el.paymentPlanInputs.find(x=>x.checked)?.value||"guidance_records_yearly";
  const comprehensive=value.startsWith("all_access_");
  const productCode=comprehensive?"all_access":"guidance_records";
  const period=value.replace(`${productCode}_`,"");
  const monthly=period==="monthly";
  return {
    productCode,period,months:monthly?1:12,
    amount:comprehensive?(monthly?50:300):(monthly?10:50),
    label:comprehensive?"الباقة الشاملة":PACKAGE_LABELS.guidance_records
  };
}


function activePackageForSubscription(code){
  const now=Date.now();return (state.entitlements||[]).find(e=>e.product_code===code&&e.is_active!==false&&new Date(e.expires_at).getTime()>now)||null;
}
function evaluatePremiumPlan(plan){
  if(state.account?.is_system_admin)return{allowed:false,kind:'admin',message:'مدير النظام لديه صلاحية كاملة ولا يحتاج إلى اشتراك.'};
  const bundle=activePackageForSubscription('all_access');const target=activePackageForSubscription(plan.productCode);
  if(plan.productCode!=='all_access'&&bundle)return{allowed:false,kind:'covered',message:'أنت مشترك في الباقة الشاملة بالفعل، ومنصة السجلات مشمولة فيها.'};
  if(target){
    if(target.billing_period===plan.period)return{allowed:false,kind:'same',message:'أنت بالفعل مشترك في هذه الباقة بنفس الخطة.'};
    if(target.billing_period==='yearly'&&plan.period==='monthly')return{allowed:false,kind:'downgrade',message:'لا يمكن الانتقال من الخطة السنوية إلى الشهرية أثناء سريان الاشتراك.'};
    if(target.billing_period==='monthly'&&plan.period==='yearly')return{allowed:true,kind:'period_upgrade',message:`ترقية سنوية: سيُضاف العام الجديد بعد المدة الحالية، والمتبقي الآن ${formatRemainingTime(target.expires_at)}.`};
  }
  if(plan.productCode==='all_access'){
    const active=(state.entitlements||[]).filter(e=>e.product_code!=='all_access'&&e.is_active!==false&&new Date(e.expires_at).getTime()>Date.now());
    if(active.length)return{allowed:true,kind:'bundle_upgrade',message:'سيتم حفظ المدة المتبقية في باقتك الحالية، وتعود تلقائيًا بعد انتهاء الباقة الشاملة.'};
  }
  return{allowed:true,kind:'new',message:'يمكن إرسال طلب التفعيل بعد التواصل عبر واتساب.'};
}

function formatRemainingTime(expiresAt){
  const ms=Math.max(0,new Date(expiresAt).getTime()-Date.now());
  const totalHours=Math.ceil(ms/3600000);const days=Math.floor(totalHours/24);const hours=totalHours%24;
  if(days>0)return `${days} يوم${days===1?'':'ًا'}${hours?` و${hours} ساعة`:''}`;
  return hours>0?`${hours} ساعة`:'أقل من ساعة';
}
function subscriptionErrorMessage(error){
  const raw=String(error?.message||error||'');
  if(raw.includes('already_subscribed_same_plan'))return 'أنت بالفعل مشترك في هذه الباقة بنفس الخطة، ولا تحتاج إلى إرسال طلب تفعيل جديد.';
  if(raw.includes('downgrade_not_allowed_while_active'))return 'لا يمكن الانتقال من الخطة السنوية إلى الشهرية أثناء سريان الاشتراك الحالي.';
  if(raw.includes('all_access_already_covers_package'))return 'الباقة الشاملة مفعّلة بالفعل وتشمل هذه المنصة، لذلك لا يمكن طلب باقة منفصلة لها.';
  if(raw.includes('request_not_pending'))return 'هذا الطلب تمت مراجعته بالفعل.';
  if(raw.includes('request_not_found'))return 'لم يتم العثور على طلب التفعيل.';
  return raw||'تعذر تنفيذ العملية.';
}

function setView(view){
  state.currentView=view;
  document.querySelectorAll(".app-view").forEach(v=>v.classList.toggle("active-view",v.id===`${view}View`));
  el.navButtons.forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
  if(view==="archive")loadArchive();
  if(view==="studentReports")loadArchive().then(()=>refreshStudentReportIndex());
  if(view==="admin"&&state.account?.is_system_admin)loadAdminData();
}

function renderCatalog(){
  const query=cleanText(el.catalogSearch?.value).toLowerCase();
  const items=Object.entries(RECORDS).filter(([,r])=>{
    const categoryOk=state.catalogCategory==="الكل"||r.category===state.catalogCategory;
    const searchOk=!query||`${r.title} ${r.description} ${r.category}`.toLowerCase().includes(query);
    return categoryOk&&searchOk;
  });
  el.categoryTabs.innerHTML=CATEGORY_ORDER.map(c=>`<button class="category-tab${c===state.catalogCategory?" active":""}" data-category="${escapeHtml(c)}" type="button">${escapeHtml(c)}</button>`).join("");
  el.recordsCatalog.innerHTML=items.length?items.map(([key,r])=>`<article class="record-card">
    <div class="record-card-icon">${r.icon}</div><span class="record-card-category">${escapeHtml(r.category)}</span>
    <h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.description)}</p>
    <div class="record-card-footer"><span>${r.confidential?"سجل سري ومحمي":"نموذج رقمي قابل للأرشفة"}</span><button class="primary-button compact-button" data-open-record="${key}" type="button">فتح السجل</button></div>
  </article>`).join(""):`<div class="empty-state">لا توجد سجلات مطابقة للبحث.</div>`;
}

function inputAttrs(field){
  const attrs=[`data-field="${escapeHtml(field.key)}"`];
  if(field.required)attrs.push("required");
  if(field.placeholder)attrs.push(`placeholder="${escapeHtml(field.placeholder)}"`);
  if(field.min!==undefined)attrs.push(`min="${field.min}"`);
  if(field.max!==undefined)attrs.push(`max="${field.max}"`);
  return attrs.join(" ");
}
function spanClass(field){return `form-field span-${field.span||4}`;}
function renderChoice(field,radio=false){
  const type=radio?"radio":"checkbox";
  return `<div class="${radio?"radio-group":"checkbox-group"}" data-choice-group="${escapeHtml(field.key)}">${(field.options||[]).map(opt=>`<label class="choice-item"><input type="${type}" name="choice_${escapeHtml(field.key)}" value="${escapeHtml(opt)}"><span>${escapeHtml(opt)}</span></label>`).join("")}</div>`;
}
function renderRepeater(field){
  const rows=field.defaults?.length?field.defaults:Array.from({length:field.minRows||1},()=>({}));
  const heads=field.columns.map(c=>`<th>${escapeHtml(c.label)}</th>`).join("");
  return `<div class="repeatable-wrap" data-repeat-key="${escapeHtml(field.key)}" data-repeat-columns='${escapeHtml(JSON.stringify(field.columns))}'>
    <table class="repeatable-table"><thead><tr>${heads}<th class="row-actions no-print">حذف</th></tr></thead><tbody>${rows.map(row=>renderRepeatRow(field.columns,row)).join("")}</tbody></table>
    <button class="secondary-button compact-button add-row-button no-print" data-add-row="${escapeHtml(field.key)}" type="button">+ إضافة صف</button>
  </div>`;
}
function renderRepeatRow(columns,row={}){
  return `<tr>${columns.map(col=>`<td>${renderTableControl(col,row[col.key]??"")}</td>`).join("")}<td class="row-actions no-print"><button class="delete-row-button" data-delete-row type="button">×</button></td></tr>`;
}
function renderTableControl(col,value){
  const v=escapeHtml(value);
  if(col.type==="textarea")return `<textarea data-col="${escapeHtml(col.key)}" rows="2">${v}</textarea>`;
  if(col.type==="select")return `<select data-col="${escapeHtml(col.key)}">${(col.options||[]).map(o=>`<option value="${escapeHtml(o)}"${o===value?" selected":""}>${escapeHtml(o)}</option>`).join("")}</select>`;
  return `<input data-col="${escapeHtml(col.key)}" type="${escapeHtml(col.type||"text")}" value="${v}">`;
}
function renderMatrix(field){
  return `<div class="matrix-wrap" data-matrix-key="${escapeHtml(field.key)}" data-matrix-columns='${escapeHtml(JSON.stringify(field.columns))}'>
    <table class="matrix-table"><thead><tr>${field.columns.map(c=>`<th>${escapeHtml(c.label)}</th>`).join("")}</tr></thead><tbody>${field.rows.map(row=>`<tr data-matrix-row="${row.index}">${field.columns.map(col=>`<td class="${col.type==="static"?"week-cell":""}">${renderMatrixControl(col,row)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  </div>`;
}
function renderMatrixControl(col,row){
  if(col.type==="static")return escapeHtml(row[col.key]??"");
  if(col.type==="yesno")return `<div class="yes-no"><label><input type="radio" name="mx_${row.index}_${col.key}" value="نفذ" data-matrix-col="${col.key}"> نفذ</label><label><input type="radio" name="mx_${row.index}_${col.key}" value="لم ينفذ" data-matrix-col="${col.key}"> لم ينفذ</label></div>`;
  return `<input type="${escapeHtml(col.type||"text")}" data-matrix-col="${escapeHtml(col.key)}" value="">`;
}
function renderField(field){
  const ctx=window.MishkatSchoolContext?.getContext?.()||{};
  if(["counselor_name","counselor5"].includes(field.key))field={...field,value:ctx.counselorName||state.account?.full_name||field.value||"",linkedReadonly:true,help:"يظهر تلقائيًا من حساب المستخدم"};
  if(field.key==="principal_name")field={...field,value:ctx.managerName||field.value||"",linkedReadonly:true,help:"مدير المدرسة المحدد تلقائيًا من بيانات المدرسة"};
  if(field.type==="checklist")return renderChoice(field,false);
  if(field.type==="radio")return renderChoice(field,true);
  if(field.type==="repeater")return renderRepeater(field);
  if(field.type==="matrix")return renderMatrix(field);
  if(field.type==="note")return `<div class="static-note">${escapeHtml(field.text||field.label)}</div>`;
  const value=field.value??"";
  if(field.type==="textarea")return `<label class="${spanClass(field)}"><span>${escapeHtml(field.label)}</span><textarea ${inputAttrs(field)} rows="${field.rows||4}">${escapeHtml(value)}</textarea>${field.help?`<small>${escapeHtml(field.help)}</small>`:""}</label>`;
  if(field.type==="select")return `<label class="${spanClass(field)}"><span>${escapeHtml(field.label)}</span><select ${inputAttrs(field)}>${(field.options||[]).map(opt=>`<option value="${escapeHtml(opt)}"${opt===value?" selected":""}>${escapeHtml(opt)}</option>`).join("")}</select></label>`;
  return `<label class="${spanClass(field)}"><span>${escapeHtml(field.label)}</span><input type="${escapeHtml(field.type||"text")}" ${inputAttrs(field)} value="${escapeHtml(value)}">${field.help?`<small>${escapeHtml(field.help)}</small>`:""}</label>`;
}

function renderRecordForm(def){
  el.dynamicRecordForm.innerHTML=def.sections.map(s=>`<section class="form-section"><header class="form-section-header"><h3>${escapeHtml(s.title)}</h3>${s.subtitle?`<small>${escapeHtml(s.subtitle)}</small>`:""}</header><div class="form-section-body">${s.fields.map(renderField).join("")}</div></section>`).join("");
}

function getDefaultFormData(def){
  const data={};
  def.sections.forEach(s=>s.fields.forEach(field=>{
    if(field.value!==undefined)data[field.key]=field.value;
    if(field.type==="repeater"&&field.defaults)data[field.key]=structuredClone(field.defaults);
    if(field.type==="matrix")data[field.key]=field.rows.map(r=>({week:r.week,index:r.index}));
  }));
  return data;
}

function setFieldValue(key,value){
  const input=el.dynamicRecordForm.querySelector(`[data-field="${CSS.escape(key)}"]`);
  if(input){input.value=value??"";return;}
  const group=el.dynamicRecordForm.querySelector(`[data-choice-group="${CSS.escape(key)}"]`);
  if(group){
    const values=Array.isArray(value)?value:[value];
    group.querySelectorAll("input").forEach(i=>i.checked=values.includes(i.value));
    return;
  }
  const repeat=el.dynamicRecordForm.querySelector(`[data-repeat-key="${CSS.escape(key)}"]`);
  if(repeat&&Array.isArray(value)){
    const columns=JSON.parse(repeat.dataset.repeatColumns||"[]");
    repeat.querySelector("tbody").innerHTML=(value.length?value:[{}]).map(row=>renderRepeatRow(columns,row)).join("");
    return;
  }
  const matrix=el.dynamicRecordForm.querySelector(`[data-matrix-key="${CSS.escape(key)}"]`);
  if(matrix&&Array.isArray(value)){
    matrix.querySelectorAll("tbody tr").forEach((tr,idx)=>{
      const row=value[idx]||{};
      tr.querySelectorAll("[data-matrix-col]").forEach(control=>{
        const col=control.dataset.matrixCol;
        if(control.type==="radio")control.checked=row[col]===control.value;
        else control.value=row[col]??"";
      });
    });
  }
}

function populateForm(data={}){Object.entries(data).forEach(([k,v])=>setFieldValue(k,v));}

function collectFormData(){
  const data={};
  el.dynamicRecordForm.querySelectorAll("[data-field]").forEach(input=>data[input.dataset.field]=input.value);
  el.dynamicRecordForm.querySelectorAll("[data-choice-group]").forEach(group=>{
    const checked=Array.from(group.querySelectorAll("input:checked")).map(i=>i.value);
    const first=group.querySelector("input");
    data[group.dataset.choiceGroup]=first?.type==="radio"?(checked[0]||""):checked;
  });
  el.dynamicRecordForm.querySelectorAll("[data-repeat-key]").forEach(wrapper=>{
    data[wrapper.dataset.repeatKey]=Array.from(wrapper.querySelectorAll("tbody tr")).map(tr=>{
      const row={};tr.querySelectorAll("[data-col]").forEach(i=>row[i.dataset.col]=i.value);return row;
    }).filter(row=>Object.values(row).some(v=>cleanText(v)));
  });
  el.dynamicRecordForm.querySelectorAll("[data-matrix-key]").forEach(wrapper=>{
    data[wrapper.dataset.matrixKey]=Array.from(wrapper.querySelectorAll("tbody tr")).map((tr,idx)=>{
      const row={week:WEEK_NAMES[idx],index:idx+1};
      tr.querySelectorAll("[data-matrix-col]").forEach(i=>{if(i.type!=="radio"||i.checked)row[i.dataset.matrixCol]=i.value;});
      return row;
    });
  });
  return data;
}

function updateRecordIdentity(){
  const ctx=window.MishkatSchoolContext?.getContext?.()||{};
  const name=ctx.schoolName||state.account?.school_name||"اسم المدرسة";
  el.recordSchoolName.textContent=name;
  el.recordCounselorName.textContent=ctx.counselorName||state.account?.full_name||state.user?.email||"—";
  el.recordPrintDate.textContent=new Date().toLocaleDateString("ar-SA");
  const logo=state.pendingSchoolLogo||state.account?.school_logo_data;
  if(logo){el.recordSchoolLogo.src=logo;el.recordSchoolLogo.hidden=false;el.recordLogoPlaceholder.hidden=true;}else{el.recordSchoolLogo.hidden=true;el.recordLogoPlaceholder.hidden=false;}
}

function openRecord(type,record=null){
  const def=RECORDS[type];if(!def)return;
  state.currentType=type;state.currentRecordId=record?.id||null;
  el.recordTitle.textContent=def.title;el.recordDescription.textContent=def.description;el.recordCategoryBadge.textContent=def.category;el.confidentialBadge.hidden=!def.confidential;
  el.metaTitle.value=record?.title||def.title;el.metaDate.value=(record?.record_date||todayISO()).slice(0,10);el.metaAcademicYear.value=record?.academic_year||"";el.metaStatus.value=record?.status||"draft";
  renderRecordForm(def);populateForm(record?.form_data||getDefaultFormData(def));
  el.recordPrintId.textContent=record?.id?record.id.slice(0,8).toUpperCase():"مسودة غير محفوظة";
  updateRecordIdentity();setView("editor");
}

function clearCurrentRecord(){if(state.currentType)openRecord(state.currentType,null);}

async function saveCurrentRecord(){
  if(!isPremiumAccess()){showPaymentModal();return;}
  if(!state.currentType||!state.user)return;
  const def=RECORDS[state.currentType];const formData=collectFormData();
  const requiredInputs=Array.from(el.dynamicRecordForm.querySelectorAll("[required]"));
  const missing=requiredInputs.find(i=>!cleanText(i.value));if(missing){missing.focus();showToast("أكمل الحقول المطلوبة قبل الحفظ.",true);return;}
  const payload={user_id:state.user.id,record_type:state.currentType,title:cleanText(el.metaTitle.value)||def.title,student_name:def.studentKey?cleanText(formData[def.studentKey]):null,class_name:def.classKey?cleanText(formData[def.classKey]):null,record_date:el.metaDate.value||null,academic_year:cleanText(el.metaAcademicYear.value)||null,status:el.metaStatus.value,is_confidential:!!def.confidential,form_data:formData};
  el.saveRecordButton.disabled=true;el.saveRecordButton.textContent="جارٍ الحفظ...";
  try{
    let result;
    if(state.currentRecordId)result=await db.from("guidance_digital_records").update(payload).eq("id",state.currentRecordId).select().single();
    else result=await db.from("guidance_digital_records").insert(payload).select().single();
    if(result.error)throw result.error;
    state.currentRecordId=result.data.id;el.recordPrintId.textContent=result.data.id.slice(0,8).toUpperCase();
    state.archiveLoaded=false;showToast("تم حفظ السجل بنجاح.");
  }catch(error){showToast(error.message||"تعذر حفظ السجل.",true);}finally{el.saveRecordButton.disabled=false;el.saveRecordButton.textContent="حفظ السجل";}
}

function printCurrentRecord(){if(!isPremiumAccess()){showPaymentModal();return;}updateRecordIdentity();window.print();}
function showToast(message,isError=false){
  let toast=document.getElementById("globalToast");if(!toast){toast=document.createElement("div");toast.id="globalToast";toast.style.cssText="position:fixed;right:22px;bottom:22px;z-index:150;padding:12px 16px;border-radius:12px;color:#fff;font-weight:800;box-shadow:0 16px 40px rgba(0,0,0,.2);transition:.25s";document.body.appendChild(toast);}toast.style.background=isError?"#b6383f":"#14775b";toast.textContent=message;toast.hidden=false;clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.hidden=true,3200);
}

async function loadArchive(force=false){
  if(!state.user)return;
  if(!isPremiumAccess()){
    state.records=[];state.archiveLoaded=false;
    showBox(el.archiveStatus,"الأرشيف والحفظ متاحان فقط لمشتركي باقة السجلات الرقمية أو الباقة الشاملة.");
    renderArchive();updateStats();refreshStudentReportIndex();return;
  }
  if(state.archiveLoaded&&!force){renderArchive();refreshStudentReportIndex();return;}
  showBox(el.archiveStatus,"جارٍ تحميل السجلات...");
  try{
    const {data,error}=await db.from("guidance_digital_records").select("id,record_type,title,student_name,class_name,record_date,academic_year,status,is_confidential,form_data,created_at,updated_at").order("created_at",{ascending:false});
    if(error)throw error;state.records=data||[];state.archiveLoaded=true;hideBox(el.archiveStatus);renderArchive();updateStats();refreshStudentReportIndex();
  }catch(error){showBox(el.archiveStatus,error.message||"تعذر تحميل الأرشيف.",true);}
}
function renderArchive(){
  const q=cleanText(el.archiveSearch.value).toLowerCase();const type=el.archiveTypeFilter.value;const status=el.archiveStatusFilter.value;
  const filtered=state.records.filter(r=>{
    const def=RECORDS[r.record_type];const hay=`${r.title||""} ${r.student_name||""} ${r.class_name||""} ${r.academic_year||""} ${JSON.stringify(r.form_data||{})}`.toLowerCase();
    return(!q||hay.includes(q))&&(!type||r.record_type===type)&&(!status||r.status===status);
  });
  el.archiveList.innerHTML=filtered.length?filtered.map(r=>{const def=RECORDS[r.record_type]||{title:r.record_type,icon:"▤"};return `<article class="archive-item"><div class="archive-item-head"><div><h3>${def.icon} ${escapeHtml(r.title||def.title)}</h3><p>${escapeHtml(def.title)}${r.student_name?` — ${escapeHtml(r.student_name)}`:""}</p></div><span class="status-badge ${escapeHtml(r.status)}">${r.status==="completed"?"مكتمل":r.status==="archived"?"مؤرشف":"مسودة"}</span></div><div class="archive-meta"><span>التاريخ: ${formatDate(r.record_date)}</span>${r.class_name?`<span>الفصل: ${escapeHtml(r.class_name)}</span>`:""}${r.academic_year?`<span>${escapeHtml(r.academic_year)}</span>`:""}${r.is_confidential?"<span>سري</span>":""}</div><div class="archive-actions"><button class="primary-button compact-button" data-edit-record="${r.id}" type="button">فتح وتعديل</button><button class="secondary-button compact-button" data-print-saved="${r.id}" type="button">طباعة</button>${r.student_name?`<button class="secondary-button compact-button" data-student-report="${escapeHtml(r.student_name)}" type="button">تقرير الطالب</button>`:""}<button class="ghost-button compact-button" data-delete-record="${r.id}" type="button">حذف</button></div></article>`;}).join(""):`<div class="empty-state">لا توجد سجلات محفوظة مطابقة.</div>`;
}
function updateStats(){
  const records=state.records||[];const now=new Date();
  el.statTotalRecords.textContent=records.length;el.statCompletedRecords.textContent=records.filter(r=>r.status==="completed").length;el.statDraftRecords.textContent=records.filter(r=>r.status==="draft").length;el.statMonthRecords.textContent=records.filter(r=>{const d=new Date(r.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;
}
async function deleteRecord(id){
  if(!isPremiumAccess()){showPaymentModal();return;}if(!confirm("سيتم حذف السجل نهائيًا. هل تريد المتابعة؟"))return;
  const {error}=await db.from("guidance_digital_records").delete().eq("id",id);if(error)return showToast(error.message,true);state.records=state.records.filter(r=>r.id!==id);renderArchive();updateStats();refreshStudentReportIndex();showToast("تم حذف السجل.");
}
function openSavedRecord(id,printAfter=false){const record=state.records.find(r=>r.id===id);if(!record)return;openRecord(record.record_type,record);if(printAfter)setTimeout(()=>printCurrentRecord(),350);}


const STUDENT_REPORT_GROUPS = {
  incidents: new Set(["daily_incident","educational_guidance","behavioral_guidance","academic_weakness_guidance"]),
  guidance: new Set(["group_guidance","academic_weakness_guidance","educational_guidance","behavioral_guidance","lateness_guidance","absence_guidance","individual_interview","new_student_interview","guardian_contact","guardian_invitation","observation_visit"]),
  attendance: new Set(["lateness_guidance","absence_guidance","lateness_tracking","absence_tracking"]),
  cases: new Set(["case_study"])
};
const STUDENT_REPORT_SUMMARY_KEYS = [
  "incident_details","problem_description","problem_summary","referral_reason","causes","solutions",
  "final_diagnosis","preliminary_diagnosis","guidance_summary","session_summary","interview_summary",
  "purpose","communication_details","outcome","follow_up_notes","student_commitment","notes"
];

function normalizeStudentName(value){
  return cleanText(value).toLowerCase()
    .replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
    .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
    .replace(/[^\p{L}\p{N}]+/gu," ").trim();
}
function hasReportValue(value){
  if(value===null||value===undefined)return false;
  if(typeof value==="string")return cleanText(value)!=="";
  if(Array.isArray(value))return value.some(hasReportValue);
  if(typeof value==="object")return Object.values(value).some(hasReportValue);
  return true;
}
function collectStudentReferences(value,refs=[],inheritedClass=""){
  if(Array.isArray(value)){value.forEach(item=>collectStudentReferences(item,refs,inheritedClass));return refs;}
  if(!value||typeof value!=="object")return refs;
  const localClass=cleanText(value.class_name||value.class||inheritedClass);
  const student=cleanText(value.student_name);
  if(student)refs.push({name:student,className:localClass});
  Object.values(value).forEach(child=>collectStudentReferences(child,refs,localClass));
  return refs;
}
function recordStudentReferences(record){
  const refs=[];
  if(cleanText(record.student_name))refs.push({name:cleanText(record.student_name),className:cleanText(record.class_name)});
  collectStudentReferences(record.form_data||{},refs,cleanText(record.class_name));
  const seen=new Set();
  return refs.filter(ref=>{
    const key=`${normalizeStudentName(ref.name)}|${normalizeStudentName(ref.className)}`;
    if(!normalizeStudentName(ref.name)||seen.has(key))return false;
    seen.add(key);return true;
  });
}
function refreshStudentReportIndex(){
  if(!el.studentNamesList||!el.studentReportAvailableCount)return;
  const map=new Map();
  (state.records||[]).forEach(record=>{
    recordStudentReferences(record).forEach(ref=>{
      const key=normalizeStudentName(ref.name);
      if(!key)return;
      if(!map.has(key))map.set(key,{key,name:ref.name,classes:new Set(),records:new Set()});
      const item=map.get(key);if(ref.className)item.classes.add(ref.className);item.records.add(record.id);
    });
  });
  state.studentReportStudents=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  el.studentNamesList.innerHTML=state.studentReportStudents.map(item=>`<option value="${escapeHtml(item.name)}">${escapeHtml([...item.classes].join("، ")||`${item.records.size} سجل`)}</option>`).join("");
  el.studentReportAvailableCount.textContent=state.studentReportStudents.length;
  updateStudentReportClassOptions();
}
function selectedStudentIndexEntry(){
  const key=normalizeStudentName(el.studentReportName?.value);
  return state.studentReportStudents.find(item=>item.key===key)||null;
}
function updateStudentReportClassOptions(){
  if(!el.studentReportClass)return;
  const selected=selectedStudentIndexEntry();const current=el.studentReportClass.value;
  const classes=selected?[...selected.classes].sort((a,b)=>a.localeCompare(b,"ar")):[];
  el.studentReportClass.innerHTML=`<option value="">كل الفصول</option>${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}`;
  if(classes.includes(current))el.studentReportClass.value=current;
}
function reportRecordDate(record){return String(record.record_date||record.created_at||"").slice(0,10);}
function recordMatchesReportStudent(record,studentKey,classFilter=""){
  const refs=recordStudentReferences(record).filter(ref=>normalizeStudentName(ref.name)===studentKey);
  if(!refs.length)return false;
  if(!classFilter)return true;
  const classKey=normalizeStudentName(classFilter);
  return refs.some(ref=>normalizeStudentName(ref.className)===classKey)||normalizeStudentName(record.class_name)===classKey;
}
function reportStatusLabel(status){return status==="completed"?"مكتمل":status==="archived"?"مؤرشف":"مسودة";}
function plainReportValue(value){
  if(!hasReportValue(value))return "";
  if(Array.isArray(value))return value.map(plainReportValue).filter(Boolean).join("، ");
  if(typeof value==="object")return Object.values(value).map(plainReportValue).filter(Boolean).join(" — ");
  return cleanText(value);
}
function truncateReportText(value,max=220){
  const text=plainReportValue(value);return text.length>max?`${text.slice(0,max).trim()}…`:text;
}
function reportRecordSummary(record){
  const data=record.form_data||{};
  for(const key of STUDENT_REPORT_SUMMARY_KEYS){
    if(hasReportValue(data[key]))return truncateReportText(data[key]);
  }
  const def=RECORDS[record.record_type];
  return def?.description||"سجل مرتبط بالطالب.";
}
function renderReportSimpleValue(field,value){
  if(Array.isArray(value)){
    return `<ul class="report-value-list">${value.filter(hasReportValue).map(item=>`<li>${escapeHtml(plainReportValue(item))}</li>`).join("")}</ul>`;
  }
  const text=plainReportValue(value);
  return `<div class="report-value-text">${escapeHtml(text).replaceAll("\n","<br>")}</div>`;
}
function renderReportRepeater(field,value,studentKey){
  let rows=Array.isArray(value)?value.filter(row=>row&&typeof row==="object"&&hasReportValue(row)):[];
  if((field.columns||[]).some(col=>col.key==="student_name")){
    const matching=rows.filter(row=>normalizeStudentName(row.student_name)===studentKey);
    if(matching.length)rows=matching;
  }
  if(!rows.length)return "";
  const visibleColumns=(field.columns||[]).filter(col=>rows.some(row=>hasReportValue(row[col.key])));
  if(!visibleColumns.length)return "";
  return `<div class="report-table-wrap"><table class="report-data-table"><thead><tr>${visibleColumns.map(col=>`<th>${escapeHtml(col.label)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${visibleColumns.map(col=>`<td>${escapeHtml(plainReportValue(row[col.key])||"—").replaceAll("\n","<br>")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function renderReportMatrix(field,value){
  const rows=Array.isArray(value)?value.filter(row=>row&&typeof row==="object"&&hasReportValue(row)):[];
  if(!rows.length)return "";
  const columns=(field.columns||[]).filter(col=>rows.some(row=>hasReportValue(row[col.key])));
  if(!columns.length)return "";
  return `<div class="report-table-wrap"><table class="report-data-table"><thead><tr>${columns.map(col=>`<th>${escapeHtml(col.label)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(col=>`<td>${escapeHtml(plainReportValue(row[col.key])||"—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function renderReportField(field,value,studentKey){
  if(field.type==="note"||!hasReportValue(value))return "";
  let content="";
  if(field.type==="repeater")content=renderReportRepeater(field,value,studentKey);
  else if(field.type==="matrix")content=renderReportMatrix(field,value);
  else content=renderReportSimpleValue(field,value);
  if(!content)return "";
  return `<div class="report-detail-field ${field.type==="repeater"||field.type==="matrix"?"wide":""}"><span>${escapeHtml(field.label)}</span>${content}</div>`;
}
function renderReportRecordDetails(record,studentKey){
  const def=RECORDS[record.record_type];const data=record.form_data||{};const used=new Set();const sections=[];
  (def?.sections||[]).forEach(sectionDef=>{
    const fields=(sectionDef.fields||[]).map(field=>{used.add(field.key);return renderReportField(field,data[field.key],studentKey)}).filter(Boolean);
    if(fields.length)sections.push(`<section class="report-detail-section"><h4>${escapeHtml(sectionDef.title)}</h4><div class="report-detail-grid">${fields.join("")}</div></section>`);
  });
  const extras=Object.entries(data).filter(([key,value])=>!used.has(key)&&hasReportValue(value));
  if(extras.length){
    sections.push(`<section class="report-detail-section"><h4>بيانات إضافية</h4><div class="report-detail-grid">${extras.map(([key,value])=>`<div class="report-detail-field"><span>${escapeHtml(key.replaceAll("_"," "))}</span>${renderReportSimpleValue({},value)}</div>`).join("")}</div></section>`);
  }
  return sections.join("")||'<div class="empty-state">لا توجد تفاصيل إضافية في هذا السجل.</div>';
}
function buildStudentReportReference(studentName){
  const date=todayISO().replaceAll("-","");
  let hash=0;for(const char of normalizeStudentName(studentName))hash=(hash*31+char.charCodeAt(0))>>>0;
  return `SR-${date}-${String(hash%100000).padStart(5,"0")}`;
}
function reportPeriodLabel(records,from,to){
  if(from||to)return `${from?formatDate(from):"البداية"} — ${to?formatDate(to):"اليوم"}`;
  const dates=records.map(reportRecordDate).filter(Boolean).sort();
  return dates.length?`${formatDate(dates[0])} — ${formatDate(dates.at(-1))}`:"—";
}
function generateStudentReport(){
  if(!isPremiumAccess()){showPaymentModal();return;}
  const studentName=cleanText(el.studentReportName.value);const studentKey=normalizeStudentName(studentName);
  if(!studentKey)return showBox(el.studentReportStatus,"اختر اسم الطالب أولًا.",true);
  const known=selectedStudentIndexEntry();
  if(!known)return showBox(el.studentReportStatus,"لم يتم العثور على هذا الطالب في السجلات المحفوظة.",true);
  const classFilter=el.studentReportClass.value;const typeFilter=el.studentReportType.value;
  const statusFilter=el.studentReportStatusFilter.value;const from=el.studentReportFrom.value;const to=el.studentReportTo.value;
  const includeConfidential=el.studentReportIncludeConfidential.checked;
  let records=(state.records||[]).filter(record=>{
    if(!recordMatchesReportStudent(record,studentKey,classFilter))return false;
    if(typeFilter&&record.record_type!==typeFilter)return false;
    if(statusFilter&&record.status!==statusFilter)return false;
    if(!includeConfidential&&record.is_confidential)return false;
    const date=reportRecordDate(record);
    if(from&&date&&date<from)return false;if(to&&date&&date>to)return false;
    return true;
  }).sort((a,b)=>reportRecordDate(b).localeCompare(reportRecordDate(a))||String(b.created_at).localeCompare(String(a.created_at)));
  state.studentReportRecords=records;
  if(!records.length){
    el.studentReportDocument.hidden=true;el.printStudentReportButton.disabled=true;
    return showBox(el.studentReportStatus,"لا توجد سجلات مطابقة للاختيارات الحالية.",true);
  }
  hideBox(el.studentReportStatus);
  const classes=new Set();records.forEach(record=>recordStudentReferences(record).filter(ref=>normalizeStudentName(ref.name)===studentKey).forEach(ref=>{if(ref.className)classes.add(ref.className)}));
  const displayName=known.name||studentName;const period=reportPeriodLabel(records,from,to);
  el.studentReportSchoolName.textContent=state.account?.school_name||"اسم المدرسة";
  el.studentReportStudentName.textContent=displayName;el.studentReportProfileName.textContent=displayName;
  el.studentReportProfileClasses.textContent=[...classes].join("، ")||classFilter||"غير محدد";
  el.studentReportProfilePeriod.textContent=period;el.studentReportGeneratedAt.textContent=new Date().toLocaleDateString("ar-SA");
  el.studentReportScope.textContent=`${records.length} سجل — ${typeFilter?(RECORDS[typeFilter]?.title||typeFilter):"جميع أنواع السجلات"} — ${period}`;
  el.studentReportCounselor.textContent=state.account?.full_name||state.user?.email||"—";
  el.studentReportFooterCount.textContent=records.length;el.studentReportReference.textContent=buildStudentReportReference(displayName);
  const logo=state.pendingSchoolLogo||state.account?.school_logo_data;
  if(logo){el.studentReportSchoolLogo.src=logo;el.studentReportSchoolLogo.hidden=false;el.studentReportLogoPlaceholder.hidden=true}else{el.studentReportSchoolLogo.hidden=true;el.studentReportLogoPlaceholder.hidden=false}
  el.studentReportTotal.textContent=records.length;
  el.studentReportIncidents.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.incidents.has(r.record_type)).length;
  el.studentReportGuidance.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.guidance.has(r.record_type)).length;
  el.studentReportAttendance.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.attendance.has(r.record_type)).length;
  el.studentReportCases.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.cases.has(r.record_type)).length;
  const typeCounts=new Map();records.forEach(record=>typeCounts.set(record.record_type,(typeCounts.get(record.record_type)||0)+1));
  el.studentReportTypeBreakdown.innerHTML=[...typeCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([type,count])=>{const def=RECORDS[type]||{title:type,icon:"▤"};return `<div class="report-type-chip"><span>${def.icon}</span><div><strong>${escapeHtml(def.title)}</strong><small>${count} سجل</small></div></div>`}).join("");
  el.studentReportTimeline.innerHTML=records.map((record,index)=>{
    const def=RECORDS[record.record_type]||{title:record.record_type,icon:"▤",category:"سجل"};
    return `<article class="student-report-event${record.is_confidential?" confidential":""}">
      <div class="student-report-marker"><span>${def.icon}</span><i></i></div>
      <div class="student-report-event-card">
        <header>
          <div><span>${escapeHtml(def.category||"سجل")}</span><h3>${escapeHtml(record.title||def.title)}</h3><p>${escapeHtml(reportRecordSummary(record))}</p></div>
          <div class="report-event-meta"><strong>${formatDate(reportRecordDate(record))}</strong><small>${escapeHtml(record.class_name||"الفصل غير محدد")}</small><em class="status-badge ${escapeHtml(record.status)}">${reportStatusLabel(record.status)}</em>${record.is_confidential?'<b>سري</b>':""}</div>
        </header>
        <details class="report-record-details"${index===0?" open":""}>
          <summary>عرض جميع بيانات هذا السجل</summary>
          <div class="report-record-details-body">${renderReportRecordDetails(record,studentKey)}</div>
        </details>
        <div class="report-event-actions no-print"><button class="secondary-button compact-button" data-open-report-record="${record.id}" type="button">فتح السجل الأصلي</button></div>
      </div>
    </article>`;
  }).join("");
  el.studentReportDocument.hidden=false;el.printStudentReportButton.disabled=false;
  el.studentReportDocument.scrollIntoView({behavior:"smooth",block:"start"});
}
function resetStudentReport(){
  el.studentReportName.value="";el.studentReportClass.innerHTML='<option value="">كل الفصول</option>';
  el.studentReportType.value="";el.studentReportStatusFilter.value="";el.studentReportFrom.value="";el.studentReportTo.value="";
  el.studentReportIncludeConfidential.checked=true;el.studentReportDocument.hidden=true;el.printStudentReportButton.disabled=true;hideBox(el.studentReportStatus);
}
function openStudentReportForName(name){
  setView("studentReports");el.studentReportName.value=name;updateStudentReportClassOptions();setTimeout(generateStudentReport,80);
}
function printStudentReport(){
  if(el.studentReportDocument.hidden||!state.studentReportRecords.length)return showToast("أنشئ تقرير الطالب أولًا.",true);
  const details=[...el.studentReportTimeline.querySelectorAll("details")];
  state.studentReportPrintState=details.map(node=>node.open);details.forEach(node=>node.open=true);
  document.body.classList.add("printing-student-report");window.print();
}
function restoreStudentReportPrintState(){
  if(!state.studentReportPrintState)return;
  [...el.studentReportTimeline.querySelectorAll("details")].forEach((node,index)=>node.open=Boolean(state.studentReportPrintState[index]));
  state.studentReportPrintState=null;document.body.classList.remove("printing-student-report");
}

async function signIn(){
  const email=cleanText(el.authEmail.value);const password=el.authPassword.value;if(!email||!password)return showBox(el.loginStatus,"اكتب البريد الإلكتروني وكلمة المرور.",true);
  setAuthBusy(true);try{const{error}=await db.auth.signInWithPassword({email,password});if(error)throw error;hideBox(el.loginStatus);}catch(error){showBox(el.loginStatus,error.message||"تعذر تسجيل الدخول.",true);}finally{setAuthBusy(false);}
}
async function signUp(){
  const email=cleanText(el.authEmail.value);const password=el.authPassword.value;const fullName=cleanText(el.authFullName.value);if(!email||password.length<6||!fullName)return showBox(el.loginStatus,"اكتب الاسم والبريد وكلمة مرور من 6 أحرف على الأقل.",true);
  setAuthBusy(true);try{const{data,error}=await db.auth.signUp({email,password,options:{data:{full_name:fullName}}});if(error)throw error;if(data.session)hideBox(el.loginStatus);else showBox(el.loginStatus,"تم إنشاء الحساب. راجع بريدك لتأكيد الحساب ثم سجّل الدخول.");}catch(error){showBox(el.loginStatus,error.message||"تعذر إنشاء الحساب.",true);}finally{setAuthBusy(false);}
}
function setAuthBusy(busy){el.signInButton.disabled=busy;el.signUpButton.disabled=busy;el.signInButton.textContent=busy?"جارٍ التنفيذ...":"تسجيل الدخول";}
async function signOut(){clearUnifiedLaunches();await db.auth.signOut();}

async function loadAccount(user){
  let {data,error}=await db.from("premium_accounts").select("user_id,full_name,email,school_name,school_logo_data,is_system_admin,is_active").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  if(!data){
    await new Promise(resolve=>setTimeout(resolve,650));
    ({data,error}=await db.from("premium_accounts").select("user_id,full_name,email,school_name,school_logo_data,is_system_admin,is_active").eq("user_id",user.id).single());
    if(error)throw error;
  }
  state.account=data;
  const [accessRes,entitlementsRes]=await Promise.all([
    db.rpc("premium_has_package_access",{p_product_code:CURRENT_PACKAGE_CODE,p_user_id:user.id}),
    db.from("premium_entitlements").select("product_code,billing_period,started_at,expires_at,is_active").eq("user_id",user.id).order("expires_at",{ascending:false})
  ]);
  if(accessRes.error)throw accessRes.error;
  if(entitlementsRes.error)throw entitlementsRes.error;
  state.packageAccess=Boolean(accessRes.data);
  state.entitlements=entitlementsRes.data||[];
  applyAccountUI();
}
function applyAccountUI(){
  const a=state.account||{};const displayName=a.full_name||state.user?.email||"مستخدم";const school=a.school_name||"أضف اسم المدرسة تلقائيًا من بيانات المدرسة";const logo=state.pendingSchoolLogo||a.school_logo_data;
  el.headerSchoolName.textContent=school;el.headerUserName.textContent=displayName;el.currentUserName.textContent=displayName;el.currentUserEmail.textContent=state.user?.email||a.email||"";el.currentUserPlan.textContent=premiumLabel();el.subscriptionExpiry.textContent=premiumExpiryLabel();el.dashboardPlan.textContent=premiumLabel();el.dashboardPlanExpiry.textContent=premiumExpiryLabel();el.currentUserRole.textContent=a.is_system_admin?"مدير النظام":"مستخدم";el.adminNavButton.hidden=!a.is_system_admin;
  el.schoolProfileName.value=a.school_name||"";el.profileFullName.value=a.full_name||"";
  [ [el.headerSchoolLogo,el.headerLogoPlaceholder],[el.schoolLogoPreview,el.settingsLogoPlaceholder] ].forEach(([img,placeholder])=>{if(logo){img.src=logo;img.hidden=false;placeholder.hidden=true;}else{img.hidden=true;placeholder.hidden=false;}});
  if(el.requestPremiumButton){
    const entitlement=activeEntitlement();
    el.requestPremiumButton.hidden=Boolean(a.is_system_admin);
    el.requestPremiumButton.textContent=entitlement?.product_code==="all_access"?"إدارة أو ترقية الباقة الشاملة":isPremiumAccess()?"ترقية للباقة الشاملة أو السنوية":"طلب تفعيل Premium";
  }
  updateRecordIdentity();applySecurity();
}
async function resizeImage(file,max=900,quality=.88){
  const data=await fileToDataUrl(file);return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;const scale=Math.min(1,max/Math.max(w,h));w=Math.round(w*scale);h=Math.round(h*scale);const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);resolve(canvas.toDataURL("image/webp",quality));};img.onerror=reject;img.src=data;});
}
async function handleLogoUpload(file){if(!file)return;if(file.size>1.5*1024*1024)return showBox(el.settingsStatus,"حجم الشعار أكبر من 1.5 ميجابايت.",true);try{state.pendingSchoolLogo=await resizeImage(file);applyAccountUI();showBox(el.settingsStatus,"تم تجهيز الشعار. اضغط حفظ بيانات المدرسة.");}catch{showBox(el.settingsStatus,"تعذر قراءة الشعار.",true);}}
async function saveSchoolProfile(){
  if(!state.user)return;const schoolName=cleanText(el.schoolProfileName.value);const fullName=cleanText(el.profileFullName.value);if(!schoolName)return showBox(el.settingsStatus,"اكتب اسم المدرسة أولًا.",true);
  el.saveSchoolProfileButton.disabled=true;try{const logo=state.pendingSchoolLogo||state.account?.school_logo_data||null;const{data,error}=await db.rpc("premium_update_school_profile",{p_full_name:fullName||state.user.email,p_school_name:schoolName,p_school_logo_data:logo});if(error)throw error;state.account={...state.account,...data};state.pendingSchoolLogo=null;applyAccountUI();showBox(el.settingsStatus,"تم حفظ اسم المدرسة وشعارها.");}catch(error){showBox(el.settingsStatus,error.message||"تعذر حفظ بيانات المدرسة.",true);}finally{el.saveSchoolProfileButton.disabled=false;}
}

function showPaymentModal(){
  if(state.account?.is_system_admin){
    showToast("مدير النظام لديه صلاحية كاملة لجميع المنصات.");
    return;
  }
  updatePaymentModal();el.paymentModal.hidden=false;
}
function closePaymentModal(){el.paymentModal.hidden=true;}
function updatePaymentModal(){
  const plan=selectedPlan();const eligibility=evaluatePremiumPlan(plan);
  el.paymentPlanInputs.forEach(input=>input.closest("label")?.classList.toggle("selected",input.checked));
  el.paymentModalDescription.textContent=`${plan.label} — ${plan.period==="monthly"?"شهري":"سنوي"} — ${plan.amount} ريالًا. ${eligibility.message}`;
  const school=state.account?.school_name||"غير محدد";const user=state.account?.full_name||state.user?.email||"مستخدم";
  const message=["السلام عليكم، أرغب في طلب تفعيل اشتراك.",`المنصة الحالية: ${PACKAGE_LABELS.guidance_records}`,`الباقة المطلوبة: ${plan.label}`,`المدة: ${plan.period==="monthly"?"شهرية":"سنوية"} — ${plan.amount} ريالًا`,`نوع الطلب: ${eligibility.kind==='period_upgrade'?'ترقية سنوية مع إضافة المدة المتبقية':eligibility.kind==='bundle_upgrade'?'ترقية شاملة مع حفظ المدة الحالية':'اشتراك جديد'}`,`الاسم: ${user}`,`المدرسة: ${school}`,`البريد: ${state.user?.email||""}`].join("\n");
  el.whatsappContactButton.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  el.paymentConfirmText.textContent=`أؤكد أنني تواصلت عبر واتساب بخصوص ${plan.label} ${plan.period==="monthly"?"الشهرية":"السنوية"}.`;
  el.paymentSecurityNote.textContent=eligibility.message;
  el.confirmPremiumRequestButton.textContent=eligibility.kind==='period_upgrade'?'إرسال طلب الترقية السنوية':eligibility.kind==='bundle_upgrade'?'إرسال طلب الباقة الشاملة':'إرسال طلب التفعيل';
  el.confirmPremiumRequestButton.disabled=!eligibility.allowed||!el.paymentConfirmCheckbox.checked;
  return eligibility;
}
async function requestPremium(){
  const plan=selectedPlan();const eligibility=evaluatePremiumPlan(plan);
  if(!eligibility.allowed)return showToast(eligibility.message,true);
  if(!el.paymentConfirmCheckbox.checked)return showToast("يجب التواصل عبر واتساب أولًا ثم تأكيد التواصل.",true);
  el.confirmPremiumRequestButton.disabled=true;el.confirmPremiumRequestButton.textContent="جارٍ إرسال الطلب...";
  try{
    const note=[`مصدر الطلب: ${PACKAGE_LABELS.guidance_records}`,`الباقة المطلوبة: ${plan.label}`,`المدة: ${plan.period==="monthly"?"شهرية":"سنوية"} بقيمة ${plan.amount} ريالًا`,`نوع الطلب: ${eligibility.kind==='period_upgrade'?'ترقية سنوية مع إضافة المدة المتبقية':eligibility.kind==='bundle_upgrade'?'ترقية شاملة مع حفظ مدة الباقة الحالية':'اشتراك جديد'}`,`المدرسة: ${state.account?.school_name||"غير محددة"}`,"تم التواصل عبر واتساب"].join(" | ");
    const{error}=await db.rpc("premium_request_package_subscription",{p_product_code:plan.productCode,p_billing_period:plan.period,p_user_note:note});if(error)throw error;
    closePaymentModal();
    showToast(eligibility.kind==='period_upgrade'?"تم إرسال طلب الترقية السنوية، وسيتم احتساب المدة المتبقية تلقائيًا.":eligibility.kind==='bundle_upgrade'?"تم إرسال طلب الباقة الشاملة، وستعود مدة باقتك الحالية بعد انتهاء الشاملة.":`تم إرسال طلب ${plan.label}.`);
  }catch(error){showToast(subscriptionErrorMessage(error),true);}
  finally{const latest=evaluatePremiumPlan(selectedPlan());el.confirmPremiumRequestButton.textContent=latest.kind==='period_upgrade'?'إرسال طلب الترقية السنوية':latest.kind==='bundle_upgrade'?'إرسال طلب الباقة الشاملة':'إرسال طلب التفعيل';el.confirmPremiumRequestButton.disabled=!latest.allowed||!el.paymentConfirmCheckbox.checked;}
}

function applySecurity(){
  const premium=isPremiumAccess();el.trialWatermark.hidden=premium;document.body.classList.toggle("trial-account",!premium);
}
function protectTrialEvent(event){
  if(isPremiumAccess())return;
  const inInput=event.target?.matches?.("input,textarea,select");
  if(event.type==="copy"&&!inInput&&el.recordDocument?.contains(event.target)){event.preventDefault();showToast("النسخ غير متاح في الحساب التجريبي.",true);}
  if(event.type==="contextmenu"&&el.recordDocument?.contains(event.target)){event.preventDefault();}
  if(event.type==="keydown"){
    const key=event.key.toLowerCase();if((event.ctrlKey||event.metaKey)&&["p","s"].includes(key)){event.preventDefault();showPaymentModal();}
    if(event.key==="PrintScreen"){el.screenShield.hidden=false;setTimeout(()=>el.screenShield.hidden=true,1800);}
  }
}
function handleVisibilityGuard(){if(isPremiumAccess())return;if(document.hidden)el.screenShield.hidden=false;else setTimeout(()=>el.screenShield.hidden=true,220);}

async function loadUserSupportChat(){
  if(!state.user)return;
  try{
    const{data:thread,error}=await db.from("premium_support_threads").select("id,user_id,status,last_message_at,last_read_by_user_at,last_read_by_admin_at,created_at").eq("user_id",state.user.id).maybeSingle();if(error)throw error;
    state.supportThread=thread||null;if(!thread){el.supportChatMessages.innerHTML="<div class='empty-state'>ابدأ محادثة جديدة مع الدعم الفني.</div>";return;}
    const{data:messages,error:messageError}=await db.from("premium_support_messages").select("id,thread_id,sender_id,message,created_at").eq("thread_id",thread.id).order("created_at",{ascending:true}).limit(300);if(messageError)throw messageError;
    state.supportMessages=messages||[];renderUserSupportMessages();
    if(!el.supportChatPanel.hidden){await db.rpc("premium_support_mark_read",{p_thread_id:thread.id});el.supportUnreadBadge.hidden=true;}
  }catch(error){el.supportChatStatus.textContent=error.message||"تعذر تحميل الدعم.";}
}
function renderUserSupportMessages(){
  el.supportChatMessages.innerHTML=state.supportMessages.length?state.supportMessages.map(m=>`<div class="message ${m.sender_id===state.user.id?"mine":"theirs"}"><div>${escapeHtml(m.message).replaceAll("\n","<br>")}</div><small>${formatDateTime(m.created_at)}</small></div>`).join(""):`<div class="empty-state">لا توجد رسائل بعد.</div>`;el.supportChatMessages.scrollTop=el.supportChatMessages.scrollHeight;
}
async function sendUserSupportMessage(){
  const message=cleanText(el.supportChatInput.value);if(!message)return;el.supportChatSendButton.disabled=true;
  try{const{error}=await db.rpc("premium_support_send_message",{p_message:message,p_thread_id:null});if(error)throw error;el.supportChatInput.value="";await loadUserSupportChat();}catch(error){el.supportChatStatus.textContent=error.message||"تعذر إرسال الرسالة.";}finally{el.supportChatSendButton.disabled=false;}
}
async function checkSupportUnread(){
  if(!state.user||!el.supportChatPanel.hidden)return;const{data}=await db.from("premium_support_threads").select("id,last_message_at,last_read_by_user_at,last_read_by_admin_at").eq("user_id",state.user.id).maybeSingle();if(!data)return;const last=new Date(data.last_message_at||0).getTime();const read=new Date(data.last_read_by_user_at||0).getTime();const unread=last>read&&new Date(data.last_read_by_admin_at||0).getTime()===last;el.supportUnreadBadge.hidden=!unread;el.supportUnreadBadge.textContent=unread?"1":"0";
}
function openSupportChat(){el.supportChatPanel.hidden=false;loadUserSupportChat();}
function closeSupportChat(){el.supportChatPanel.hidden=true;}

async function loadAdminData(){
  if(!state.account?.is_system_admin)return;showBox(el.adminStatus,"جارٍ تحميل بيانات الإدارة...");
  try{
    const[requestsRes,usersRes,entitlementsRes]=await Promise.all([
      db.from("premium_subscription_requests").select("id,user_id,product_code,amount_sar,billing_period,duration_months,status,user_note,requested_at,request_kind,upgrade_context").eq("status","pending").order("requested_at",{ascending:true}),
      db.from("premium_accounts").select("user_id,full_name,email,school_name,is_system_admin,is_active,created_at").order("created_at",{ascending:false}),
      db.from("premium_entitlements").select("user_id,product_code,billing_period,expires_at,is_active").order("expires_at",{ascending:false})
    ]);
    if(requestsRes.error)throw requestsRes.error;if(usersRes.error)throw usersRes.error;if(entitlementsRes.error)throw entitlementsRes.error;
    state.adminRequests=requestsRes.data||[];state.adminUsers=usersRes.data||[];state.adminEntitlements=entitlementsRes.data||[];
    renderAdminLists();await loadAdminSupportThreads();hideBox(el.adminStatus);
  }catch(error){showBox(el.adminStatus,error.message||"تعذر تحميل بيانات الإدارة.",true);}
}
function adminRequestDescription(r){
  if(r.request_kind==="upgrade_period")return "ترقية من الشهرية إلى السنوية مع إضافة المدة المتبقية.";
  if(r.request_kind==="upgrade_bundle")return "ترقية إلى الباقة الشاملة مع حفظ مدة الباقة الحالية واستعادتها بعد انتهاء الشاملة.";
  return "اشتراك جديد.";
}
function renderAdminLists(){
  const userMap=new Map(state.adminUsers.map(u=>[u.user_id,u]));const now=Date.now();
  el.subscriptionRequestsList.innerHTML=state.adminRequests.length?state.adminRequests.map(r=>{
    const u=userMap.get(r.user_id)||{};const period=r.billing_period==="monthly"?"شهري":"سنوي";const packageLabel=PACKAGE_LABELS[r.product_code]||r.product_code||"باقة غير محددة";
    return `<article class="admin-item"><div class="admin-item-head"><div><h4>${escapeHtml(packageLabel)}</h4><p>${escapeHtml(u.school_name||u.full_name||"مستخدم")} — ${escapeHtml(u.email||"")}</p></div><span class="admin-role-badge">${formatDateTime(r.requested_at)}</span></div><p>${period} — ${Number(r.amount_sar).toFixed(0)} ريال</p><p><strong>${escapeHtml(adminRequestDescription(r))}</strong></p><p>${escapeHtml(r.user_note||"")}</p><div class="actions"><button class="primary-button compact-button" data-approve-request="${r.id}" type="button">تفعيل ${escapeHtml(packageLabel)}</button><button class="ghost-button compact-button" data-reject-request="${r.id}" type="button">رفض</button></div></article>`;
  }).join(""):`<div class="empty-state">لا توجد طلبات معلقة.</div>`;
  el.premiumUsersList.innerHTML=state.adminUsers.length?state.adminUsers.map(u=>{
    const self=u.user_id===state.user.id;
    const active=state.adminEntitlements.filter(e=>e.user_id===u.user_id&&e.is_active!==false&&new Date(e.expires_at).getTime()>now);
    const packages=u.is_system_admin?["مدير النظام — جميع الباقات"]:active.length?active.map(e=>`${PACKAGE_LABELS[e.product_code]||e.product_code} — ${e.billing_period==="monthly"?"شهري":"سنوي"} — حتى ${formatDate(e.expires_at)}`):["لا توجد باقة نشطة"];
    return `<article class="admin-item"><div class="admin-item-head"><div><h4>${escapeHtml(u.school_name||u.full_name||"مستخدم")}</h4><p>${escapeHtml(u.email||"")}</p></div><span class="admin-role-badge ${u.is_system_admin?"manager":""}">${u.is_system_admin?"مدير":"مستخدم"}</span></div><p>${packages.map(escapeHtml).join("<br>")}</p><div class="actions">${u.is_system_admin?`<button class="ghost-button compact-button" data-set-admin="false" data-user-id="${u.user_id}" ${self?"disabled":""} type="button">إلغاء صلاحية المدير</button>`:`<button class="secondary-button compact-button" data-set-admin="true" data-user-id="${u.user_id}" type="button">تعيين مدير</button>`}</div></article>`;
  }).join(""):`<div class="empty-state">لا توجد حسابات.</div>`;
}
async function approveRequest(id){
  const{error}=await db.rpc("premium_admin_activate_package_request",{p_request_id:id,p_admin_note:"تم التفعيل من لوحة إدارة منصة السجلات الرقمية"});
  if(error)return showBox(el.adminStatus,subscriptionErrorMessage(error),true);
  showBox(el.adminStatus,"تم التفعيل مع تطبيق قواعد الترقية وحفظ المدة المتبقية.");
  await loadAdminData();
}
async function rejectRequest(id){
  const{error}=await db.rpc("premium_admin_reject_request",{p_request_id:id,p_admin_note:"تم رفض الطلب من لوحة الإدارة"});
  if(error)return showBox(el.adminStatus,error.message,true);
  showBox(el.adminStatus,"تم رفض الطلب.");
  await loadAdminData();
}
async function setAdminRole(userId,makeAdmin){if(!confirm(makeAdmin?"تعيين هذا الحساب مديرًا للنظام؟":"إلغاء صلاحية المدير لهذا الحساب؟"))return;const{error}=await db.rpc("premium_admin_set_role",{p_user_id:userId,p_is_admin:makeAdmin});if(error)return showBox(el.adminStatus,error.message,true);showBox(el.adminStatus,makeAdmin?"تم تعيين مدير جديد.":"تم إلغاء صلاحية المدير.");await loadAdminData();}

async function loadAdminSupportThreads(){
  const{data,error}=await db.from("premium_support_threads").select("id,user_id,status,last_message_at,last_read_by_user_at,last_read_by_admin_at,created_at").order("last_message_at",{ascending:false});if(error)return showBox(el.adminStatus,error.message,true);state.adminSupportThreads=data||[];renderAdminSupportThreads();
}
function renderAdminSupportThreads(){
  const users=new Map(state.adminUsers.map(u=>[u.user_id,u]));el.adminSupportThreadsList.innerHTML=state.adminSupportThreads.length?state.adminSupportThreads.map(t=>{const u=users.get(t.user_id)||{};const active=state.adminSelectedThread?.id===t.id;return `<button class="thread-card${active?" active":""}" data-admin-thread="${t.id}" type="button"><strong>${escapeHtml(u.school_name||u.full_name||u.email||"مستخدم")}</strong><small>${t.status==="closed"?"مغلقة":"مفتوحة"} — ${formatDateTime(t.last_message_at)}</small></button>`;}).join(""):`<div class="empty-state">لا توجد محادثات دعم.</div>`;
}
async function openAdminThread(id){
  const thread=state.adminSupportThreads.find(t=>t.id===id);if(!thread)return;state.adminSelectedThread=thread;renderAdminSupportThreads();const user=state.adminUsers.find(u=>u.user_id===thread.user_id)||{};el.adminSupportThreadTitle.textContent=user.school_name||user.full_name||user.email||"مستخدم";el.adminSupportThreadMeta.textContent=`${user.email||""} — ${thread.status==="closed"?"مغلقة":"مفتوحة"}`;el.adminSupportStatusButton.disabled=false;el.adminSupportStatusButton.textContent=thread.status==="closed"?"إعادة فتح المحادثة":"إغلاق المحادثة";el.adminSupportReplyButton.disabled=false;
  const{data,error}=await db.from("premium_support_messages").select("id,thread_id,sender_id,message,created_at").eq("thread_id",id).order("created_at",{ascending:true}).limit(500);if(error)return showBox(el.adminStatus,error.message,true);el.adminSupportMessages.innerHTML=(data||[]).map(m=>`<div class="message ${m.sender_id===state.user.id?"mine":"theirs"}"><div>${escapeHtml(m.message).replaceAll("\n","<br>")}</div><small>${formatDateTime(m.created_at)}</small></div>`).join("");el.adminSupportMessages.scrollTop=el.adminSupportMessages.scrollHeight;await db.rpc("premium_support_mark_read",{p_thread_id:id});
}
async function sendAdminSupportReply(){const t=state.adminSelectedThread;const message=cleanText(el.adminSupportReplyInput.value);if(!t||!message)return;const{error}=await db.rpc("premium_support_send_message",{p_message:message,p_thread_id:t.id});if(error)return showBox(el.adminStatus,error.message,true);el.adminSupportReplyInput.value="";await openAdminThread(t.id);await loadAdminSupportThreads();}
async function toggleAdminThreadStatus(){const t=state.adminSelectedThread;if(!t)return;const next=t.status==="closed"?"open":"closed";const{error}=await db.rpc("premium_support_set_status",{p_thread_id:t.id,p_status:next});if(error)return showBox(el.adminStatus,error.message,true);t.status=next;await openAdminThread(t.id);}

function bindEvents(){
  el.signInButton.addEventListener("click",signIn);el.signUpButton.addEventListener("click",signUp);el.signOutButton.addEventListener("click",signOut);
  el.authPassword.addEventListener("keydown",e=>{if(e.key==="Enter")signIn();});
  el.navButtons.forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  el.catalogSearch.addEventListener("input",debounce(renderCatalog));
  el.categoryTabs.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;state.catalogCategory=b.dataset.category;renderCatalog();});
  el.recordsCatalog.addEventListener("click",e=>{const b=e.target.closest("[data-open-record]");if(b)openRecord(b.dataset.openRecord);});
  el.backToDashboardButton.addEventListener("click",()=>setView("dashboard"));el.newRecordButton.addEventListener("click",clearCurrentRecord);el.saveRecordButton.addEventListener("click",saveCurrentRecord);el.printRecordButton.addEventListener("click",printCurrentRecord);
  el.dynamicRecordForm.addEventListener("click",e=>{const add=e.target.closest("[data-add-row]");if(add){const wrapper=el.dynamicRecordForm.querySelector(`[data-repeat-key="${CSS.escape(add.dataset.addRow)}"]`);const columns=JSON.parse(wrapper.dataset.repeatColumns||"[]");wrapper.querySelector("tbody").insertAdjacentHTML("beforeend",renderRepeatRow(columns,{}));return;}const del=e.target.closest("[data-delete-row]");if(del){const tbody=del.closest("tbody");if(tbody.children.length>1)del.closest("tr").remove();else Array.from(del.closest("tr").querySelectorAll("input,textarea,select")).forEach(i=>i.value="");}});
  el.archiveSearch.addEventListener("input",debounce(renderArchive));el.archiveTypeFilter.addEventListener("change",renderArchive);el.archiveStatusFilter.addEventListener("change",renderArchive);el.refreshArchiveButton.addEventListener("click",()=>loadArchive(true));
  el.archiveList.addEventListener("click",e=>{const edit=e.target.closest("[data-edit-record]");if(edit)return openSavedRecord(edit.dataset.editRecord);const print=e.target.closest("[data-print-saved]");if(print)return openSavedRecord(print.dataset.printSaved,true);const report=e.target.closest("[data-student-report]");if(report)return openStudentReportForName(report.dataset.studentReport);const del=e.target.closest("[data-delete-record]");if(del)return deleteRecord(del.dataset.deleteRecord);});

  el.studentReportName.addEventListener("input",debounce(updateStudentReportClassOptions,120));
  el.studentReportName.addEventListener("change",updateStudentReportClassOptions);
  el.generateStudentReportButton.addEventListener("click",generateStudentReport);
  el.resetStudentReportButton.addEventListener("click",resetStudentReport);
  el.refreshStudentReportsButton.addEventListener("click",()=>loadArchive(true).then(()=>{refreshStudentReportIndex();showToast("تم تحديث بيانات تقارير الطلاب.");}));
  el.printStudentReportButton.addEventListener("click",printStudentReport);
  el.studentReportTimeline.addEventListener("click",e=>{const open=e.target.closest("[data-open-report-record]");if(open)openSavedRecord(open.dataset.openReportRecord);});
  window.addEventListener("afterprint",restoreStudentReportPrintState);
    el.schoolLogoInput.addEventListener("change",()=>handleLogoUpload(el.schoolLogoInput.files?.[0]));el.saveSchoolProfileButton.addEventListener("click",saveSchoolProfile);el.requestPremiumButton.addEventListener("click",showPaymentModal);
  el.closePaymentModalButton.addEventListener("click",closePaymentModal);el.paymentModal.addEventListener("click",e=>{if(e.target===el.paymentModal)closePaymentModal();});el.paymentPlanInputs.forEach(i=>i.addEventListener("change",updatePaymentModal));el.paymentConfirmCheckbox.addEventListener("change",updatePaymentModal);el.confirmPremiumRequestButton.addEventListener("click",requestPremium);
  el.supportChatToggle.addEventListener("click",openSupportChat);el.openSupportButton.addEventListener("click",openSupportChat);el.closeSupportChatButton.addEventListener("click",closeSupportChat);el.refreshSupportChatButton.addEventListener("click",loadUserSupportChat);el.supportChatSendButton.addEventListener("click",sendUserSupportMessage);el.supportChatInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendUserSupportMessage();}});
  el.refreshAdminButton.addEventListener("click",loadAdminData);el.subscriptionRequestsList.addEventListener("click",e=>{const a=e.target.closest("[data-approve-request]");if(a)return approveRequest(a.dataset.approveRequest);const reject=e.target.closest("[data-reject-request]");if(reject)return rejectRequest(reject.dataset.rejectRequest);});el.premiumUsersList.addEventListener("click",e=>{const b=e.target.closest("[data-set-admin]");if(b)setAdminRole(b.dataset.userId,b.dataset.setAdmin==="true");});
  el.adminSupportThreadsList.addEventListener("click",e=>{const b=e.target.closest("[data-admin-thread]");if(b)openAdminThread(b.dataset.adminThread);});el.adminSupportReplyButton.addEventListener("click",sendAdminSupportReply);el.adminSupportStatusButton.addEventListener("click",toggleAdminThreadStatus);
  document.addEventListener("copy",protectTrialEvent);document.addEventListener("contextmenu",protectTrialEvent);document.addEventListener("keydown",protectTrialEvent);document.addEventListener("visibilitychange",handleVisibilityGuard);window.addEventListener("blur",()=>{if(!isPremiumAccess())el.screenShield.hidden=false;});window.addEventListener("focus",()=>{setTimeout(()=>el.screenShield.hidden=true,180);});
}

async function handleSession(session){
  state.user=session?.user||null;
  if(!state.user){
    state.account=null;state.packageAccess=false;state.entitlements=[];state.records=[];state.archiveLoaded=false;
    if(state.supportPoll)clearInterval(state.supportPoll);window.location.replace("../index.html");return;
  }
  el.loginPage.hidden=true;el.appShell.hidden=false;
  try{
    await loadAccount(state.user);
    // يجب اختيار المنصة من لوحة المنصات أولًا، حتى لحساب مدير النظام.
    if(!cameFromUnifiedPortal()){window.location.replace("../index.html?notice=choose_platform");return;}
    if(!state.packageAccess&&!state.account?.is_system_admin){window.location.replace("../index.html?notice=package_locked");return;}
    renderUnifiedPlatformSwitcher();
    renderCatalog();
    el.archiveTypeFilter.innerHTML=`<option value="">كل السجلات</option>${Object.entries(RECORDS).map(([k,def])=>`<option value="${k}">${escapeHtml(def.title)}</option>`).join("")}`;
    el.studentReportType.innerHTML=`<option value="">كل أنواع السجلات</option>${Object.entries(RECORDS).map(([k,def])=>`<option value="${k}">${escapeHtml(def.title)}</option>`).join("")}`;
    await loadArchive(true);
    setView("dashboard");
    state.supportPoll=setInterval(checkSupportUnread,12000);
  }catch(error){showToast(error.message||"تعذر تحميل الحساب.",true);}
}

async function init(){
  bindEvents();renderCatalog();el.metaDate.value=todayISO();
  if(!db){showBox(el.loginStatus,"تعذر تحميل مكتبة الاتصال بقاعدة البيانات.",true);return;}
  const{data}=await db.auth.getSession();await handleSession(data.session);db.auth.onAuthStateChange((_event,session)=>handleSession(session));
}

init();
