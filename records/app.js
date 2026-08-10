"use strict";

const SUPABASE_URL = "https://fpicgtldwfevdvpbxkjf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
const WHATSAPP_NUMBER = "966582712620";
const CURRENT_PACKAGE_CODE = "guidance_records";
const SCHOOL_EDITION=true;
const SCHOOL_SCHEMA_VERSION="1.0.38";
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
function cameFromUnifiedPortal(){ return true; }
function cameFromUnifiedPortal_legacy(){
  const params=new URLSearchParams(location.search);const fromPortal=params.get("from")==="portal";
  let remembered=false;try{remembered=Boolean(sessionStorage.getItem(unifiedLaunchKey(CURRENT_PACKAGE_CODE)));}catch(_error){}
  if(fromPortal){rememberUnifiedLaunch(CURRENT_PACKAGE_CODE);params.delete("from");const q=params.toString();history.replaceState({},"",location.pathname+(q?`?${q}`:""));return true;}
  return remembered;
}
function activeUnifiedEntitlements(){return (state.entitlements||[]).filter(e=>e.is_active!==false&&e.expires_at&&new Date(e.expires_at).getTime()>Date.now());}
function unifiedHasAccess(code){return true;}
function unifiedHasAccess_legacy(code){const active=activeUnifiedEntitlements();if(state.account?.is_system_admin)return true;if(code==='messages_library')return active.some(e=>e.billing_period==='yearly');return active.some(e=>e.product_code==='all_access'||e.product_code===code);}
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
  if(state.user?.id==="mishkat-school-local")return {label:'مدارس المشكاة الأهلية',detail:'جميع الخدمات متاحة',trial:false};
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
  box.innerHTML=Object.entries(UNIFIED_PLATFORM_ROUTES).map(([code,item])=>{
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
const DAILY_BEHAVIOR_CODES = ["التلفظ على معلم","التلفظ على زميل","ألفاظ أو إيحاءات بذيئة","تحرش","شغب داخل المدرسة","عبث بمرافق المدرسة","فرط حركة","تشتت انتباه","عدم الاستجابة للمعلم","المشاركة بمضاربة أو شجار","إيذاء زميل نفسيًا","تعطيل سير الحصة"];
const DAILY_EDUCATION_CODES = ["إهمال تأدية الواجبات","خروج من الفصل بدون إذن","إهمال إحضار الأدوات","التأخر الصباحي","التأخر عن الحصص","التكلم بدون إذن","النوم أثناء الحصص","عدم الانتباه للشرح","نسيان متكرر للكتب المدرسية","عدم المشاركة بالحصة الدراسية","إهمال أبحاث أو ملف إنجاز","امتهان الكتاب المدرسي"];
const DAILY_ACTION_CODES = ["الإرشاد العقلاني الانفعالي","الإرشاد بالواقع","الإرشاد بنظرية الذات","الإرشاد الديني","ضرب الأمثلة التوضيحية","الإرشاد إلى عاقبة السلوك","أسلوب الاقتصاد الرمزي","السحب التدريجي","إرشاد جمعي سريع","التدخل للإصلاح","التواصل مع ولي الأمر","التواصل مع الزملاء للإيضاح والاستفسار","التواصل مع المعلمين","اقتراح برنامج لتنظيم الوقت","الغمر","التعاقد السلوكي"];

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
    title: "سجل التواصل", category: "التواصل والشراكة", icon: "☎️", confidential: false,
    description: "سجل مدارس المشكاة لتوثيق الاتصال أو المقابلة مع ولي الأمر، مرتبط ببيانات الطالب المدرسية ومرتبط ببيانات الطالب المدرسية.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات المدرسة والطالب", [
        f("academic_term","الفصل الدراسي","select",{span:3,required:true,options:["","الفصل الأول","الفصل الثاني","الفصل الثالث"]}),
        f("school_year","العام الدراسي","text",{span:3,required:true,value:"1448",placeholder:"مثال: 1448"}),
        f("campus","المجمع","select",{span:3,options:[""],help:"يتم تحميل المجمعات تلقائيًا."}),
        f("stage","المرحلة","select",{span:3,options:[""],help:"يتم تحميل المراحل تلقائيًا."}),
        f("grade","الصف","select",{span:3,options:[""],help:"يتم تحميل الصفوف تلقائيًا."}),
        f("class_name","الفصل","select",{span:3,options:[""],help:"يتم تحميل الفصول تلقائيًا."}),
        f("student_search","بحث سريع عن الطالب","text",{span:6,placeholder:"ابحث بالاسم"}),
        f("student_name","اسم الطالب","select",{span:6,required:true,options:[""],help:"اكتب الاسم أو جزءًا منه ثم اختر الطالب."}),
        f("guardian_name","اسم ولي الأمر","text",{span:6,placeholder:"يظهر تلقائيًا عند اختيار الطالب"}),
        f("guardian_phone","رقم التواصل","tel",{span:6,placeholder:"يظهر تلقائيًا عند اختيار الطالب"})
      ],"اختيار الطالب سيكون من قاعدة المدرسة، وليس كتابة حرة للاسم."),
      section("بيانات التواصل", [
        f("contact_date","التاريخ","date",{span:4,required:true}),
        f("contact_method","طريقة التواصل","select",{span:4,required:true,options:["","اتصال هاتفي","مقابلة حضورية","واتساب","رسالة نصية","زيارة","أخرى"]}),
        f("contact_party","التواصل مع","select",{span:4,options:["ولي الأمر","الطالب","أخرى"],value:"ولي الأمر"}),
        f("purpose","غرض الاتصال","textarea",{span:12,rows:3,required:true}),
        f("communication_details","ملخص ما تم تداوله","textarea",{span:12,rows:4}),
        f("outcome","نتيجة التواصل","textarea",{span:12,rows:3}),
        f("notes","ملاحظات","textarea",{span:12,rows:5})
      ]),
      section("المتابعة والاعتماد", [
        f("follow_up_needed","هل يحتاج إلى متابعة؟","radio",{options:["نعم","لا"]}),
        f("follow_up_date","تاريخ المتابعة","date",{span:4}),
        f("counselor_name","الموجه الطلابي","text",{span:4}),
        f("signature","التوقيع","text",{span:4})
      ])
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
    description: "سجل مدارس المشكاة للمواقف اليومية؛ يجمع بيانات الطالب المدرسية مع دليل المواقف والإجراءات والمتابعة الأسبوعية في نموذج رقمي واحد.",
    studentKey: "student_name", classKey: "class_name", sections: [
      section("بيانات المدرسة والطالب", [
        f("academic_term","الفصل الدراسي","select",{span:3,required:true,options:["","الفصل الأول","الفصل الثاني","الفصل الثالث"]}),
        f("school_year","العام الدراسي","text",{span:3,required:true,value:"1448",placeholder:"مثال: 1448"}),
        f("campus","المجمع","select",{span:3,options:[""],help:"يتم تحميل المجمعات تلقائيًا."}),
        f("stage","المرحلة","select",{span:3,options:[""],help:"يتم تحميل المراحل تلقائيًا."}),
        f("grade","الصف","select",{span:3,options:[""],help:"يتم تحميل الصفوف تلقائيًا."}),
        f("class_name","الفصل","select",{span:3,options:[""],help:"يتم تحميل الفصول تلقائيًا."}),
        f("student_search","بحث سريع عن الطالب","text",{span:6,placeholder:"ابحث بالاسم"}),
        f("student_name","اسم الطالب","select",{span:6,required:true,options:[""],help:"اكتب الاسم أو جزءًا منه ثم اختر الطالب."}),
        f("incident_date","تاريخ الموقف","date",{span:3,required:true}),
        f("student_reference","رقم الطالب / المرجع","text",{span:3,placeholder:"يُجلب تلقائيًا"})
      ],"اختيار الطالب سيكون من قاعدة المدرسة، وليس كتابة حرة للاسم."),
      section("تفاصيل الموقف", [
        f("incident_category","نوع الموقف","radio",{options:["سلوكي","تعليمي","أخرى"]}),
        f("behavior_code","الموقف السلوكي","select",{span:6,options:["",...DAILY_BEHAVIOR_CODES]}),
        f("education_code","الموقف التعليمي","select",{span:6,options:["",...DAILY_EDUCATION_CODES]}),
        f("incident_details","الموقف","textarea",{span:12,rows:5,required:true,placeholder:"اكتب وصف الموقف كما حدث"}),
        f("action_codes","الإجراءات المتخذة","checklist",{options:DAILY_ACTION_CODES}),
        f("action_details","الإجراء","textarea",{span:12,rows:3,placeholder:"أضف تفاصيل الإجراء أو أي إجراء غير موجود بالقائمة"}),
        f("referral_source","مصدر الإحالة","select",{span:6,options:[""],help:"يتم تحميل موظفي نفس المجمع ونفس المرحلة فقط من Users Data، ويظهر اسم الموظف فقط."}),
        f("notes","ملاحظات","textarea",{span:12,rows:4})
      ]),
      section("المتابعة الأسبوعية", [
        f("repeat_count","عدد التكرار","number",{span:3}),
        f("session_number","رقم الجلسة","text",{span:3}),
        f("follow_up_date","تاريخ المتابعة","date",{span:3}),
        f("case_status","الحالة","select",{span:3,options:["قيد المتابعة","تحسنت","تم الإغلاق"]}),
        f("follow_up_notes","ملاحظات المتابعة","textarea",{span:12,rows:4}),
        f("counselor_name","الموجه الطلابي","text",{span:6}),
        f("signature","التوقيع","text",{span:6})
      ])
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


// ===== منصة المدارس V1.0.9: سياق مدرسي أساسي موحد لكل السجلات =====
const STUDENT_LINK_MAP = {
  student_reference:"reference", campus:"campus", complex:"campus", stage:"stage", grade:"grade", class_name:"className",
  guardian_name:"guardianName", guardian_phone:"guardianPhone", contact_numbers:"guardianPhone", birth_date:"birthDate", previous_school:"previousSchool"
};
let schoolBubblePrepared=false;
function allFields(def){return (def.sections||[]).flatMap(sec=>sec.fields||[]);}
function hasDirectStudent(def){return allFields(def).some(field=>field.key==="student_name");}
function prepareSchoolBubbleDefinitions(){
  if(schoolBubblePrepared)return;
  Object.values(RECORDS).forEach(def=>{
    const directStudent=hasDirectStudent(def);

    (def.sections||[]).forEach(sec=>{
      // البيانات المدرسية الأساسية موحدة أعلى كل سجل، لذلك لا نكررها داخل أقسام النموذج.
      sec.fields=(sec.fields||[]).filter(field=>
        !["academic_term","school_year","academic_year","campus","complex","stage"].includes(field.key) &&
        !(field.key==="semester" && String(field.label||"").includes("الفصل الدراسي")) &&
        field.key!=="guardian_name"
      );

      // توحيد أي حقل قديم لأرقام التواصل ليصبح رقم جوال ولي الأمر.
      (sec.fields||[]).forEach(field=>{
        if(field.key==="contact_numbers")field.key="guardian_phone";

        if(field.key==="student_search"){field._remove=true;return;}

        const labelText=String(field.label||"");
        const studentNameField=field.key==="student_name" || (/اسم الطالب|اسم الطالبة/.test(labelText) && !/توقيع/.test(labelText));
        const automaticIdentity=["counselor_name","counselor5","principal_name"].includes(field.key);
        const employeeField=["referral_source","referrer_name","meeting_with","responsible_employee","employee_name","source_employee"].includes(field.key)
          || (/اسم الموظف|المطلوب مقابلته|القائم بالتحويل|مصدر الإحالة|الموظف المسؤول|مسؤول التنفيذ|المشرف/.test(labelText) && !automaticIdentity);

        if(studentNameField){
          field.type="student-search";
          field.source="students";
          field.required=true;
          field.label=labelText||"اسم الطالب";
          field.placeholder="اكتب جزءًا من اسم الطالب للبحث";
          field.help="اكتب الاسم أو جزءًا منه ثم اختر الطالب من النتائج.";
          delete field.options;
          delete field.value;
        }

        if(field.key==="guardian_phone"){
          field.type="tel";
          field.label="رقم جوال ولي الأمر";
          field.linkedReadonly=true;
          field.span=field.span||4;
          field.help="يظهر تلقائيًا عند اختيار الطالب.";
          delete field.placeholder;
        }

        if(employeeField){
          field.type="select";
          field.source="employees";
          delete field.options;
          delete field.value;
          field.help=field.help||"يتم اختيار الموظف من بيانات الموظفين.";
        }

        if(directStudent && STUDENT_LINK_MAP[field.key]){
          field.linkedReadonly=true;
          if(["campus","complex","stage","grade","class_name","student_reference"].includes(field.key))field.type="text";
        }

        if(field.type==="repeater"){
          const cols=field.columns||[];
          cols.forEach(col=>{
            const colLabel=String(col.label||"");
            if(col.key==="student_name"||(/اسم الطالب|اسم الطالبة/.test(colLabel)&&!/توقيع/.test(colLabel)))col.type="student-select";
            if(col.key==="class_name")col.type="student-class";
            if(col.key==="guardian_phone"||col.key==="contact_numbers"){
              col.key="guardian_phone";
              col.label="رقم جوال ولي الأمر";
              col.type="student-phone";
            }
            if(["employee_name","responsible_employee","supervisor_employee"].includes(col.key)||/اسم الموظف|مسؤول التنفيذ|المشرف/.test(colLabel))col.type="employee-select";
          });

          // كل صف يحتوي اختيار طالب يحصل على رقم جوال ولي الأمر تلقائيًا.
          if(cols.some(col=>col.key==="student_name") && !cols.some(col=>col.key==="guardian_phone")){
            const studentIndex=cols.findIndex(col=>col.key==="student_name");
            const classIndex=cols.findIndex(col=>col.key==="class_name");
            const insertAt=classIndex>=0?classIndex+1:studentIndex+1;
            cols.splice(insertAt,0,{key:"guardian_phone",label:"رقم جوال ولي الأمر",type:"student-phone"});
          }
        }
      });

      sec.fields=sec.fields.filter(field=>!field._remove);
    });

    // في كل سجل مرتبط بطالب واحد: أضف رقم جوال ولي الأمر إن لم يكن موجودًا.
    if(directStudent){
      let phoneField=allFields(def).find(field=>field.key==="guardian_phone");
      if(!phoneField){
        const studentSection=(def.sections||[]).find(sec=>(sec.fields||[]).some(field=>field.key==="student_name"));
        if(studentSection){
          const studentIndex=studentSection.fields.findIndex(field=>field.key==="student_name");
          phoneField=f("guardian_phone","رقم جوال ولي الأمر","tel",{span:4,linkedReadonly:true,help:"يظهر تلقائيًا عند اختيار الطالب."});
          studentSection.fields.splice(studentIndex+1,0,phoneField);
        }
      }else{
        phoneField.type="tel";
        phoneField.label="رقم جوال ولي الأمر";
        phoneField.linkedReadonly=true;
        phoneField.help="يظهر تلقائيًا عند اختيار الطالب.";
      }
    }
  });
  schoolBubblePrepared=true;
}
function directoryItems(source){
  const items=state.directory?.[source]||[];
  const ctx=window.MishkatSchoolContext?.getContext?.()||{};
  const normScope=v=>cleanText(v).toLowerCase();
  const match=(id,name,ids,names)=>{
    if(!ids.size&&!names.size)return true;
    if(id&&ids.has(String(id)))return true;
    if(name&&names.has(normScope(name)))return true;
    return false;
  };
  const schoolIds=new Set((ctx.assignedSchoolIds||[]).map(String));
  const schoolNames=new Set((ctx.assignedSchoolNames||[]).map(normScope));
  if(source==="students"){
    const stageIds=new Set((ctx.assignedStageIds||[]).map(String)),stageNames=new Set((ctx.assignedStageNames||[]).map(normScope));
    const gradeIds=new Set((ctx.assignedGradeIds||[]).map(String)),gradeNames=new Set((ctx.assignedGradeNames||[]).map(normScope));
    return items.filter(student=>
      match(student.schoolId,student.schoolName,schoolIds,schoolNames)&&
      match(student.stageId,student.stage,stageIds,stageNames)&&
      match(student.gradeId,student.grade,gradeIds,gradeNames)
    );
  }
  if(source==="employees"){
    // مصدر الإحالة = Users Data داخل نفس المجمع ونفس المرحلة فقط.
    const stageIds=new Set((ctx.assignedStageIds||[]).map(String));
    const stageNames=new Set((ctx.assignedStageNames||[]).map(normScope));
    if((!schoolIds.size&&!schoolNames.size)||(!stageIds.size&&!stageNames.size))return [];
    return items.filter(emp=>{
      const empSchoolIds=(emp.schoolIds?.length?emp.schoolIds:[emp.schoolId]).filter(Boolean).map(String);
      const empSchoolNames=(emp.schoolNames?.length?emp.schoolNames:[emp.schoolName]).filter(Boolean).map(normScope);
      const empStageIds=(emp.stageIds?.length?emp.stageIds:[emp.stageId]).filter(Boolean).map(String);
      const empStageNames=(emp.stageNames?.length?emp.stageNames:[emp.stage]).filter(Boolean).map(normScope);
      const schoolMatch=empSchoolIds.some(id=>schoolIds.has(id))||empSchoolNames.some(name=>schoolNames.has(name));
      const stageMatch=empStageIds.some(id=>stageIds.has(id))||empStageNames.some(name=>stageNames.has(name));
      return schoolMatch&&stageMatch;
    });
  }
  if(source==="campuses"){
    // The Bubble School Data Type is the campus/complex in this school deployment.
    const scoped=items.filter(item=>match(item.id,item.name,schoolIds,schoolNames));
    return scoped.length?scoped:items;
  }
  return items;
}
function currentAcademicYearName(){return window.MishkatBubbleDirectory?.currentAcademicYear()?.name||"";}
function currentAcademicTermName(){return window.MishkatBubbleDirectory?.currentTerm()?.name||"";}
function sourceOptions(source,selected=""){
  const items=directoryItems(source);const person=source==="students"||source==="employees";const selectedText=String(selected||"");
  const label=source==="students"?`اختر الطالب — ${items.length} متاح`:source==="employees"?`اختر الموظف — ${items.length} متاح`:"اختر";
  const emptyLabel=source==="students"?"لم يتم تحميل أسماء الطلاب":source==="employees"?"لم يتم تحميل أسماء الموظفين":"لم يتم تحميل البيانات";
  return `<option value="">${items.length?label:emptyLabel}</option>`+items.map(item=>{
    const value=person?item.id:item.name;
    const chosen=String(value)===selectedText || item.name===selectedText;
    return `<option value="${escapeHtml(value)}"${chosen?" selected":""}>${escapeHtml(item.name)}</option>`;
  }).join("");
}
function studentDirectoryDatalistOptions(){
  return directoryItems("students").map(item=>`<option value="${escapeHtml(item.name)}"></option>`).join("");
}
function studentDisplayValue(value){
  const text=String(value??"").trim();
  if(!text)return "";
  return selectedStudent(text)?.name||text;
}
async function loadSchoolBubbleDirectory(){
  state.directory=await window.MishkatBubbleDirectory?.load?.()||{students:[],employees:[],academicYears:[],terms:[],campuses:[],stages:[],grades:[],classes:[]};
  const info=state.directory?.connection||{};
  console.info("Mishkat Bubble directory",{students:state.directory?.students?.length||0,studentClassesReceived:(window.MISHKAT_BUBBLE_DATA?.studentClasses||window.MISHKAT_BUBBLE_DATA?.student_classes||[]).length||0,studentsWithClass:(state.directory?.students||[]).filter(s=>s.className).length,employees:state.directory?.employees?.length||0,academicYears:state.directory?.academicYears?.length||0,terms:state.directory?.terms?.length||0,...info});
}
function refreshPersonSelectors(){
  if(!el.dynamicRecordForm)return;

  const datalist=el.dynamicRecordForm.querySelector("#studentDirectoryList");
  if(datalist)datalist.innerHTML=studentDirectoryDatalistOptions();

  el.dynamicRecordForm.querySelectorAll('select[data-source="employees"]').forEach(select=>{
    const current=select.value;
    select.innerHTML=sourceOptions("employees",current);
    if(current&&[...select.options].some(o=>o.value===current))select.value=current;
  });
  el.dynamicRecordForm.querySelectorAll('select[data-employee-select]').forEach(select=>{
    const current=select.value;
    select.innerHTML=sourceOptions("employees",current);
    if(current&&[...select.options].some(o=>o.value===current))select.value=current;
  });

  refreshAllStudentSummaries();
  el.dynamicRecordForm.querySelectorAll("input[data-student-select]").forEach(input=>{
    const wrapper=input.closest("[data-repeat-key]"),row=input.closest("tr");
    if(!wrapper||!row||!input.value)return;
    const student=selectedStudent(input.value);
    if(!student)return;
    const cls=row.querySelector('[data-col="class_name"]');
    const phone=row.querySelector('[data-col="guardian_phone"]');
    if(cls)cls.value=student.className||"";
    if(phone)phone.value=student.guardianPhone||"";
  });
}
function fillAcademicMeta(year="",term=""){
  if(el.metaAcademicYear){
    const current=year||currentAcademicYearName();
    el.metaAcademicYear.innerHTML=`<option value="">اختر العام الأكاديمي</option>`+directoryItems("academicYears").map(item=>`<option value="${escapeHtml(item.name)}"${item.name===current?" selected":""}>${escapeHtml(item.name)}</option>`).join("");
    if(current && !el.metaAcademicYear.value){el.metaAcademicYear.insertAdjacentHTML("beforeend",`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`);}
  }
  if(el.metaAcademicTerm){
    const current=term||currentAcademicTermName();
    el.metaAcademicTerm.innerHTML=`<option value="">اختر الفصل الدراسي</option>`+directoryItems("terms").map(item=>`<option value="${escapeHtml(item.name)}"${item.name===current?" selected":""}>${escapeHtml(item.name)}</option>`).join("");
    if(current && !el.metaAcademicTerm.value){el.metaAcademicTerm.insertAdjacentHTML("beforeend",`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`);}
  }
}
function fillDirectorySelect(select,source,selected,label){
  if(!select)return;
  const current=String(selected||"");
  select.innerHTML=`<option value="">${escapeHtml(label)}</option>`+directoryItems(source).map(item=>`<option value="${escapeHtml(item.name)}"${item.name===current?" selected":""}>${escapeHtml(item.name)}</option>`).join("");
  if(current && !select.value)select.insertAdjacentHTML("beforeend",`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`);
}
function fillSchoolContextMeta(campus="",stage=""){
  const ctx=window.MishkatSchoolContext?.getContext?.()||{};
  const assignedCampus=campus||ctx.campus||ctx.schoolName||"";
  const assignedStage=stage||ctx.stage||"";
  fillDirectorySelect(el.metaCampus,"campuses",assignedCampus,"المجمع حسب توزيع المستخدم");
  fillDirectorySelect(el.metaStage,"stages",assignedStage,"المرحلة حسب توزيع المستخدم");
  if(el.metaCampus){el.metaCampus.disabled=true;el.metaCampus.title="يظهر تلقائيًا حسب توزيع المستخدم";}
  if(el.metaStage){el.metaStage.disabled=true;el.metaStage.title="يظهر تلقائيًا حسب توزيع المستخدم";}
}
function setSchoolContextFromStudent(student){
  // School in Bubble is the campus/complex. When a student is chosen, show the exact School/Dep linked to that student.
  fillSchoolContextMeta(student?.campus||student?.schoolName||"",student?.stage||"");
}
function stripVisibleCode(value){
  return String(value??"").replace(/^\s*\d+\s*[—-]\s*/,"").trim();
}
function updateDailyIncidentCategoryControls({clearInactive=false}={}){
  if(state.currentType!=="daily_incident"||!el.dynamicRecordForm)return;
  const group=el.dynamicRecordForm.querySelector('[data-choice-group="incident_category"]');
  const selected=group?.querySelector('input:checked')?.value||"";
  const behavior=el.dynamicRecordForm.querySelector('[data-field="behavior_code"]');
  const education=el.dynamicRecordForm.querySelector('[data-field="education_code"]');
  const behaviorEnabled=selected==="سلوكي";
  const educationEnabled=selected==="تعليمي";

  if(behavior){
    behavior.disabled=!behaviorEnabled;
    behavior.closest("label")?.classList.toggle("incident-field-disabled",!behaviorEnabled);
    if(clearInactive&&!behaviorEnabled)behavior.value="";
  }
  if(education){
    education.disabled=!educationEnabled;
    education.closest("label")?.classList.toggle("incident-field-disabled",!educationEnabled);
    if(clearInactive&&!educationEnabled)education.value="";
  }
}
async function hydrateSelectedStudentClass(student,select,rowClassInput=null){
  if(!student)return student;
  if(student.className&&student.guardianPhone){
    if(rowClassInput)rowClassInput.value=student.className;
    else{
      setLinkedValue("class_name",student.className);
      setLinkedValue("guardian_phone",student.guardianPhone);
    }
    return student;
  }

  const classInput=!rowClassInput?el.dynamicRecordForm.querySelector('[data-field="class_name"]'):null;
  if(!student.className){
    if(rowClassInput)rowClassInput.value="جارٍ تحميل الفصل...";
    else if(classInput)classInput.value="جارٍ تحميل الفصل...";
  }

  try{
    const hydrated=await window.MishkatBubbleDirectory?.hydrateStudentClass?.(student.id||student.name);
    if(!hydrated)return student;
    if(select&&select.value&&![hydrated.id,hydrated.name].includes(select.value))return hydrated;

    if(rowClassInput){
      rowClassInput.value=hydrated.className||"";
      const row=select?.closest?.("tr");
      const phone=row?.querySelector?.('[data-col="guardian_phone"]');
      if(phone)phone.value=hydrated.guardianPhone||"";
    }else{
      Object.entries(STUDENT_LINK_MAP).forEach(([fieldKey,studentKey])=>setLinkedValue(fieldKey,hydrated[studentKey]||""));
    }
    return hydrated;
  }catch(error){
    console.warn("Mishkat: Student details hydration failed.",error);
    if(rowClassInput&&rowClassInput.value==="جارٍ تحميل الفصل...")rowClassInput.value="";
    if(classInput&&classInput.value==="جارٍ تحميل الفصل...")classInput.value="";
    return student;
  }
}
function selectedStudent(value){return window.MishkatBubbleDirectory?.findStudent?.(value)||null;}
function selectedEmployee(value){return window.MishkatBubbleDirectory?.findEmployee?.(value)||null;}
function setLinkedValue(key,value){const input=el.dynamicRecordForm.querySelector(`[data-field="${CSS.escape(key)}"]`);if(input)input.value=value??"";}
function studentSummaryMarkup(student){
  if(!student)return "";
  const candidates=[
    ["grade","الصف",student.grade],["class_name","الفصل",student.className]
  ];
  const items=candidates.filter(([key,,value])=>cleanText(value) && !el.dynamicRecordForm.querySelector(`[data-field="${CSS.escape(key)}"]`));
  return items.map(([,label,value])=>`<span><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span>`).join("");
}
function ensureStudentSummary(select){
  // بيانات الطالب تظهر في حقول النموذج نفسها؛ لا نضيف صفًا إضافيًا يغيّر أحجام الحقول.
  return null;
}
function applyStudentToForm(student,select){
  const box=ensureStudentSummary(select);
  if(!student){if(box){box.hidden=true;box.innerHTML="";}return;}
  setSchoolContextFromStudent(student);
  Object.entries(STUDENT_LINK_MAP).forEach(([fieldKey,studentKey])=>setLinkedValue(fieldKey,student[studentKey]||""));
  if(box){box.innerHTML=studentSummaryMarkup(student);box.hidden=!box.innerHTML;}
  if(!student.className||!student.guardianPhone)hydrateSelectedStudentClass(student,select);
}
function refreshAllStudentSummaries(){
  el.dynamicRecordForm.querySelectorAll('input[data-source="students"]:not([data-col])').forEach(input=>{
    const student=selectedStudent(input.value);
    if(student)applyStudentToForm(student,input);
  });
}
function refreshUniqueStudents(wrapper){
  // البحث الحر داخل القائمة لا يحتاج تعطيل options؛ منع التكرار يتم عند الاختيار.
  return wrapper;
}
function handleRepeaterStudent(input){
  const wrapper=input.closest("[data-repeat-key]");const row=input.closest("tr");if(!wrapper||!row)return;
  const normalized=normalizeStudentName(input.value);
  const duplicate=normalized && Array.from(wrapper.querySelectorAll("input[data-student-select]")).some(other=>other!==input&&normalizeStudentName(other.value)===normalized);
  if(duplicate){input.value="";showToast("هذا الطالب مضاف بالفعل. اختر طالبًا مختلفًا.",true);return;}

  const student=selectedStudent(input.value);
  const cls=row.querySelector('[data-col="class_name"]');
  const phone=row.querySelector('[data-col="guardian_phone"]');
  if(!student){
    if(cls)cls.value="";
    if(phone)phone.value="";
    return;
  }

  input.value=student.name;
  if(cls)cls.value=student.className||"";
  if(phone)phone.value=student.guardianPhone||"";
  if(student&&(!student.className||!student.guardianPhone))hydrateSelectedStudentClass(student,input,cls);

  // في الإرشاد الجمعي نملأ بيانات الجلسة من أول طالب مختار دون فرضها على باقي المشاركين.
  if(state.currentType==="group_guidance"){
    const first=wrapper.querySelector("input[data-student-select]");
    if(first===input)setSchoolContextFromStudent(student);
  }
}
function handleSchoolBubbleChange(event){
  const target=event.target;if(!(target instanceof HTMLElement))return;
  if(target.matches('input[name="choice_incident_category"]')){updateDailyIncidentCategoryControls({clearInactive:true});return;}
  if(target.matches("input[data-student-select]"))return handleRepeaterStudent(target);
  if(target.matches('input[data-source="students"]')){
    const student=selectedStudent(target.value);
    if(student){target.value=student.name;applyStudentToForm(student,target);}
    else applyStudentToForm(null,target);
    return;
  }
  if(target.matches('select[data-source="employees"]')){
    const emp=selectedEmployee(target.value);if(target.dataset.field==="referrer_name")setLinkedValue("referrer_role",emp?.role||"");
  }
}

const CATEGORY_ORDER = ["الكل","الجلسات الإرشادية","المواظبة والانضباط","التواصل والشراكة","الزيارات والبرامج","دراسة الحالة","المقابلات","المواقف والمتابعة"];

const state = {
  user: null, account: null, packageAccess: false, entitlements: [], currentView: "dashboard", currentType: null, currentRecordId: null,
  pendingSchoolLogo: null, records: [], archiveLoaded: false, catalogCategory: "الكل", directory: null,
  studentReportStudents: [], studentReportRecords: [], studentReportsReady: false, studentReportsLoading: null,
  supportThread: null, supportMessages: [], supportPoll: null, adminUsers: [], adminRequests: [], adminEntitlements: [],
  adminSupportThreads: [], adminSelectedThread: null
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
  // منصة المدارس: جميع وظائف السجلات متاحة بدون باقات أو اشتراكات.
  return true;
}
function premiumLabel(){if(state.user?.id==="mishkat-school-local")return "متاحة"; return "مدارس المشكاة الأهلية"; }
function premiumExpiryLabel(){if(state.user?.id==="mishkat-school-local")return "مدارس المشكاة الأهلية"; return "نسخة المدرسة — جميع وظائف السجلات متاحة"; }
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
  if(view==="studentReports"){
    prepareStudentReportsView(false);
  }
  if(view==="recordReport")renderCurrentRecordReport();
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
    <div class="record-card-footer"><span>${r.confidential?"سجل سري ومحمي":"نموذج رقمي قابل للأرشفة"}</span><button class="primary-button compact-button" data-open-record="${key}" type="button">عرض السجل</button></div>
  </article>`).join(""):`<div class="empty-state">لا توجد سجلات مطابقة للبحث.</div>`;
}


const RECORD_REPORT_COLUMNS = {
  group_guidance:[
    {label:"عنوان الجلسة",keys:["session_title"]},{label:"الطلاب المشاركون",keys:["participants"],kind:"students"},{label:"المرحلة",keys:["stage"]},{label:"الزمن",keys:["duration"]},{label:"موعد المتابعة",keys:["next_session_date"],kind:"date"},{label:"التقييم",keys:["evaluation"]}
  ],
  academic_weakness_guidance:[
    {label:"الطالب",keys:["student_name","student_name"]},{label:"الفصل",keys:["class_name"]},{label:"مواد الضعف",keys:["weak_subjects"]},{label:"النسبة",keys:["score_percent"],suffix:"%"},{label:"تاريخ الجلسة",keys:["session_date"],kind:"date"},{label:"الملاحظات",keys:["problem_description","session_content"]}
  ],
  educational_guidance:[
    {label:"الطالب",keys:["student_name"]},{label:"الفصل",keys:["class_name"]},{label:"المشكلة التعليمية",keys:["problems","problem_notes"]},{label:"تاريخ الجلسة",keys:["session_date"],kind:"date"},{label:"الحالة",keys:["case_status"]},{label:"المتابعة",keys:["next_session_date"],kind:"date"}
  ],
  behavioral_guidance:[
    {label:"الطالب",keys:["student_name"]},{label:"الفصل",keys:["class_name"]},{label:"المشكلة السلوكية",keys:["problems","problem_notes"]},{label:"تاريخ الجلسة",keys:["session_date"],kind:"date"},{label:"الحالة",keys:["case_status"]},{label:"المتابعة",keys:["next_session_date"],kind:"date"}
  ],
  lateness_guidance:[
    {label:"الطالب",keys:["student_name"]},{label:"الفصل",keys:["class_name"]},{label:"تاريخ الجلسة",keys:["session_date"],kind:"date"},{label:"الأسباب",keys:["causes"]},{label:"التواصل مع ولي الأمر",keys:["parent_contact"]},{label:"الالتزام",keys:["student_commitment"]}
  ],
  absence_guidance:[
    {label:"الطالب",keys:["student_name"]},{label:"الفصل",keys:["class_name"]},{label:"تاريخ الجلسة",keys:["session_date"],kind:"date"},{label:"الأسباب",keys:["causes"]},{label:"التواصل مع ولي الأمر",keys:["parent_contact"]},{label:"الالتزام",keys:["student_commitment"]}
  ],
  guardian_contact:[
    {label:"الطالب",keys:["student_name"]},{label:"رقم الجوال",keys:["guardian_phone","Phone"]},{label:"طريقة التواصل",keys:["contact_method","Way"]},{label:"غرض الاتصال",keys:["purpose"]},{label:"تاريخ التواصل",keys:["contact_date"],kind:"date"},{label:"ملاحظات",keys:["notes","communication_details"]}
  ],
  guidance_visit:[
    {label:"الفصل",keys:["class_name"]},{label:"نوع الزيارة",keys:["visit_type"]},{label:"تاريخ الزيارة",keys:["visit_date"],kind:"date"},{label:"الموضوع",keys:["topics","other_topic"]},{label:"المدة",keys:["duration"]},{label:"ملاحظات",keys:["visit_notes","improvement_notes"]}
  ],
  case_study:[
    {label:"الطالب",keys:["student_name"]},{label:"الفصل",keys:["class_name"]},{label:"التصنيف",keys:["classification"]},{label:"تاريخ الاكتشاف",keys:["discovery_date"],kind:"date"},{label:"ملخص المشكلة",keys:["problem_summary"]},{label:"التشخيص",keys:["final_diagnosis"]}
  ],
  guardian_invitation:[
    {label:"الطالب",keys:["student_name"]},{label:"رقم جوال ولي الأمر",keys:["guardian_phone","contact_numbers"]},{label:"موعد الحضور",keys:["appointment_date"],kind:"date"},{label:"الساعة",keys:["appointment_time"]},{label:"سبب الدعوة",keys:["invitation_reason"]},{label:"الاستجابة",keys:["response"]}
  ],
  observation_visit:[
    {label:"الفصل",keys:["class_name"]},{label:"تاريخ الزيارة",keys:["visit_date"],kind:"date"},{label:"التركيز",keys:["focus"]},{label:"المشاركة",keys:["participation"]},{label:"طلاب للمتابعة",keys:["follow_up_students"],kind:"students"},{label:"ملاحظات",keys:["observation_notes"]}
  ],
  new_student_interview:[
    {label:"الطالب",keys:["student_name"]},{label:"الفصل",keys:["class_name"]},{label:"تاريخ المقابلة",keys:["interview_date"],kind:"date"},{label:"المدرسة السابقة",keys:["previous_school"]},{label:"الحاجة للمتابعة",keys:["follow_up_needed"]},{label:"موعد المتابعة",keys:["follow_up_date"],kind:"date"}
  ],
  individual_interview:[
    {label:"الاسم",keys:["person_name"]},{label:"الصفة",keys:["relationship"]},{label:"الفصل",keys:["class_name"]},{label:"تاريخ المقابلة",keys:["interview_date"],kind:"date"},{label:"النتائج",keys:["outcomes"]},{label:"الموعد القادم",keys:["next_date"],kind:"date"}
  ],
  daily_incident:[
    {label:"الطالب",keys:["student_name"]},{label:"رقم الجوال",keys:["guardian_phone","Phone"]},{label:"الموقف",keys:["incident_details","behavior_code","education_code"]},{label:"الإجراء",keys:["action_details","action_codes"]},{label:"مصدر الإحالة",keys:["referral_source"]},{label:"تاريخ الموقف",keys:["incident_date"],kind:"date"},{label:"ملاحظات",keys:["notes"]}
  ],
  lateness_tracking:[
    {label:"الفصل الدراسي",keys:["semester"]},{label:"بداية المتابعة",keys:["tracking_start"],kind:"date"},{label:"نهاية المتابعة",keys:["tracking_end"],kind:"date"},{label:"ملاحظات",keys:["notes"]}
  ],
  absence_tracking:[
    {label:"الفصل الدراسي",keys:["semester"]},{label:"بداية المتابعة",keys:["tracking_start"],kind:"date"},{label:"نهاية المتابعة",keys:["tracking_end"],kind:"date"},{label:"ملاحظات",keys:["notes"]}
  ]
};

function firstReportValue(record,keys=[]){
  const data=record?.form_data||{};
  for(const key of keys){
    const direct=record?.[key]; if(direct!==undefined&&direct!==null&&String(direct)!=="")return direct;
    const value=data?.[key]; if(value!==undefined&&value!==null&&(Array.isArray(value)?value.length:String(value)!==""))return value;
  }
  return "";
}
function reportPlainValue(value,kind=""){
  if(value===null||value===undefined||value==="")return "—";
  if(kind==="date")return formatDate(value);
  if(Array.isArray(value)){
    if(kind==="students"){
      const names=value.map(item=>typeof item==="string"?item:(item?.student_name||item?.name||item?.Full_Name||item?.title||"")).filter(Boolean);
      return names.length?names.join("، "):"—";
    }
    return value.map(item=>typeof item==="object"?(item?.student_name||item?.name||item?.title||Object.values(item||{}).filter(v=>typeof v!=="object"&&cleanText(v)).join(" / ")):item).filter(v=>cleanText(v)).join("، ")||"—";
  }
  if(typeof value==="object")return Object.values(value).filter(v=>typeof v!=="object"&&cleanText(v)).join(" / ")||"—";
  return String(value);
}
function recordReportColumns(type){
  return RECORD_REPORT_COLUMNS[type]||[
    {label:"الطالب / المستفيد",keys:["student_name","person_name"]},{label:"الفصل",keys:["class_name"]},{label:"التاريخ",keys:["record_date"],kind:"date"},{label:"الملخص",keys:["details","notes","session_content","content"]},{label:"الحالة",keys:["status"]}
  ];
}
function reportFilterOptions(source,recordKey,current){
  const values=[];
  directoryItems(source).forEach(item=>values.push(item.name));
  (state.records||[]).filter(r=>r.record_type===state.currentType).forEach(r=>{if(r[recordKey])values.push(r[recordKey]);});
  if(current)values.push(current);
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}
function fillRecordReportFilters(reset=false){
  if(!el.recordReportYear||!el.recordReportTerm)return;
  const currentYear=currentAcademicYearName()||window.MishkatSchoolContext?.getContext?.()?.academicYear||"";
  const currentTerm=currentAcademicTermName()||window.MishkatSchoolContext?.getContext?.()?.term||"";
  const priorYear=reset?currentYear:el.recordReportYear.value;
  const priorTerm=reset?currentTerm:el.recordReportTerm.value;
  const years=reportFilterOptions("academicYears","academic_year",currentYear);
  const terms=reportFilterOptions("terms","academic_term",currentTerm);
  el.recordReportYear.innerHTML='<option value="">كل الأعوام</option>'+years.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  el.recordReportTerm.innerHTML='<option value="">كل الفصول</option>'+terms.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if(priorYear&&years.includes(priorYear))el.recordReportYear.value=priorYear;
  if(priorTerm&&terms.includes(priorTerm))el.recordReportTerm.value=priorTerm;
}
function currentRecordReportRows(){
  const type=state.currentType;if(!type)return[];
  const q=cleanText(el.recordReportSearch?.value).toLowerCase();
  const year=cleanText(el.recordReportYear?.value);const term=cleanText(el.recordReportTerm?.value);
  return (state.records||[]).filter(r=>{
    if(r.record_type!==type)return false;
    if(year&&cleanText(r.academic_year)!==year)return false;
    if(term&&cleanText(r.academic_term)!==term)return false;
    if(!q)return true;
    const hay=`${r.student_name||""} ${r.class_name||""} ${r.title||""} ${r.academic_year||""} ${r.academic_term||""} ${JSON.stringify(r.form_data||{})}`.toLowerCase();
    return hay.includes(q);
  }).sort((a,b)=>String(b.record_date||b.created_at||"").localeCompare(String(a.record_date||a.created_at||"")));
}
function renderCurrentRecordReport(){
  if(!state.currentType||!el.recordReportHead||!el.recordReportBody)return;
  const def=RECORDS[state.currentType];if(!def)return;
  const columns=recordReportColumns(state.currentType);const rows=currentRecordReportRows();
  el.recordReportTitle.textContent=`تقرير ${def.title}`;el.recordReportCategory.textContent=def.category;el.recordReportDescription.textContent=`عرض ${def.title} المحفوظة، البحث فيها، ثم إضافة أو تعديل سجل عند الحاجة.`;
  el.recordReportCount.textContent=String(rows.length);
  el.recordReportHead.innerHTML=`<tr>${columns.map(c=>`<th>${escapeHtml(c.label)}</th>`).join("")}<th>الإجراءات</th></tr>`;
  el.recordReportBody.innerHTML=rows.map(record=>`<tr>${columns.map((col,index)=>{let value=firstReportValue(record,col.keys);if(col.keys?.includes("record_date")&&!value)value=record.record_date;let text=reportPlainValue(value,col.kind);if(col.suffix&&text!=="—")text+=col.suffix;return `<td class="${index===0?'report-cell-main':''}">${escapeHtml(text)}</td>`;}).join("")}<td><div class="report-row-actions"><button class="secondary-button" data-report-edit="${escapeHtml(record.id)}" type="button">تعديل</button><button class="ghost-button" data-report-print="${escapeHtml(record.id)}" type="button">طباعة</button><button class="ghost-button" data-report-delete="${escapeHtml(record.id)}" type="button">حذف</button></div></td></tr>`).join("");
  el.recordReportEmpty.hidden=rows.length>0;el.recordReportTableShell&&(el.recordReportTableShell.hidden=rows.length===0);
}
async function openRecordReport(type,preserveFilters=false){
  const def=RECORDS[type];if(!def)return;
  const changing=state.currentType!==type;state.currentType=type;state.currentRecordId=null;
  if(!state.archiveLoaded)await loadArchive(true);
  if(el.recordReportSearch&&(!preserveFilters||changing))el.recordReportSearch.value="";
  fillRecordReportFilters(!preserveFilters||changing);renderCurrentRecordReport();setView("recordReport");
}
function returnToCurrentRecordReport(){if(state.currentType)openRecordReport(state.currentType,true);else setView("dashboard");}

function inputAttrs(field){
  const attrs=[`data-field="${escapeHtml(field.key)}"`];
  if(field.required)attrs.push("required");
  if(field.placeholder)attrs.push(`placeholder="${escapeHtml(field.placeholder)}"`);
  if(field.min!==undefined)attrs.push(`min="${field.min}"`);
  if(field.max!==undefined)attrs.push(`max="${field.max}"`);
  if(field.linkedReadonly)attrs.push("readonly",'aria-readonly="true"');
  if(field.source)attrs.push(`data-source="${escapeHtml(field.source)}"`);
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
  return `<tr>${columns.map(col=>`<td>${renderTableControl(col,(col.type==="student-select"||col.type==="employee-select")?(row[`${col.key}_id`]||row[col.key]||""):(row[col.key]??""))}</td>`).join("")}<td class="row-actions no-print"><button class="delete-row-button" data-delete-row type="button">×</button></td></tr>`;
}
function renderTableControl(col,value){
  const v=escapeHtml(value);
  if(col.type==="textarea")return `<textarea data-col="${escapeHtml(col.key)}" rows="2">${v}</textarea>`;
  if(col.type==="student-select")return `<input data-col="${escapeHtml(col.key)}" data-student-select type="search" list="studentDirectoryList" autocomplete="off" placeholder="ابحث عن الطالب" value="${escapeHtml(studentDisplayValue(value))}">`;
  if(col.type==="employee-select")return `<select data-col="${escapeHtml(col.key)}" data-employee-select>${sourceOptions("employees",value)}</select>`;
  if(col.type==="student-class")return `<input data-col="${escapeHtml(col.key)}" type="text" value="${v}" readonly aria-readonly="true">`;
  if(col.type==="student-phone")return `<input data-col="${escapeHtml(col.key)}" type="tel" value="${v}" readonly aria-readonly="true">`;
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
  const cls=`${spanClass(field)}${field.linkedReadonly?" linked-school-field":""}`;
  if(field.type==="textarea")return `<details class="${cls} collapsible-textarea"${cleanText(value)?" open":""}><summary><span>${escapeHtml(field.label)}</span><small>${cleanText(value)?"تم إدخال بيانات — اضغط للعرض":"اضغط للكتابة"}</small></summary><div class="collapsible-textarea-body"><textarea ${inputAttrs(field)} rows="${field.rows||4}">${escapeHtml(value)}</textarea>${field.help?`<small>${escapeHtml(field.help)}</small>`:""}</div></details>`;
  if(field.type==="student-search")return `<label class="${cls} student-search-field"><span>${escapeHtml(field.label)}</span><input type="search" list="studentDirectoryList" autocomplete="off" ${inputAttrs(field)} value="${escapeHtml(studentDisplayValue(value))}">${field.help?`<small>${escapeHtml(field.help)}</small>`:""}</label>`;
  if(field.type==="select"){const options=field.source?sourceOptions(field.source,value):(field.options||[]).map(opt=>`<option value="${escapeHtml(opt)}"${opt===value?" selected":""}>${escapeHtml(opt)}</option>`).join("");return `<label class="${cls}"><span>${escapeHtml(field.label)}</span><select ${inputAttrs(field)}>${options}</select>${field.help?`<small>${escapeHtml(field.help)}</small>`:""}</label>`;}
  return `<label class="${cls}"><span>${escapeHtml(field.label)}</span><input type="${escapeHtml(field.type||"text")}" ${inputAttrs(field)} value="${escapeHtml(value)}">${field.help?`<small>${escapeHtml(field.help)}</small>`:""}</label>`;
}

function renderRecordForm(def){
  el.dynamicRecordForm.innerHTML=`<datalist id="studentDirectoryList">${studentDirectoryDatalistOptions()}</datalist>`+def.sections.map(s=>`<section class="form-section"><header class="form-section-header"><h3>${escapeHtml(s.title)}</h3>${s.subtitle?`<small>${escapeHtml(s.subtitle)}</small>`:""}</header><div class="form-section-body">${s.fields.map(renderField).join("")}</div></section>`).join("");
  el.dynamicRecordForm.querySelectorAll("[data-repeat-key]").forEach(refreshUniqueStudents);
}

function wireSchoolStudentSearch(){/* اختيار الطالب أصبح قابلًا للبحث مباشرة داخل الحقل. */}

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
  if(key==="contact_numbers"&&!el.dynamicRecordForm.querySelector('[data-field="contact_numbers"]'))key="guardian_phone";
  if(["behavior_code","education_code"].includes(key))value=stripVisibleCode(value);
  if(key==="action_codes"&&Array.isArray(value))value=value.map(stripVisibleCode);
  const input=el.dynamicRecordForm.querySelector(`[data-field="${CSS.escape(key)}"]`);
  if(input){
    if(input.matches('input[data-source="students"]')){
      input.value=studentDisplayValue(value);
    }else if(input.matches('select[data-source="employees"]')){
      const text=String(value??"");const opt=Array.from(input.options).find(o=>o.value===text||o.textContent===text);input.value=opt?.value||"";
    }else input.value=value??"";
    return;
  }
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
    refreshUniqueStudents(repeat);
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

function populateForm(data={}){Object.entries(data).forEach(([k,v])=>setFieldValue(k,v));refreshAllStudentSummaries();el.dynamicRecordForm.querySelectorAll("[data-repeat-key]").forEach(refreshUniqueStudents);updateDailyIncidentCategoryControls();}

function collectFormData(){
  const data={};
  el.dynamicRecordForm.querySelectorAll("[data-field]").forEach(input=>{
    const key=input.dataset.field;
    if(input.matches('input[data-source="students"]')){
      const student=selectedStudent(input.value);
      data[key]=student?.name||cleanText(input.value);
      data[`${key}_id`]=student?.id||"";
    }
    else if(input.matches('select[data-source="employees"]')){data[key]=input.selectedOptions[0]?.textContent?.trim()||"";data[`${key}_id`]=input.value||"";}
    else data[key]=input.value;
  });
  el.dynamicRecordForm.querySelectorAll("[data-choice-group]").forEach(group=>{
    const checked=Array.from(group.querySelectorAll("input:checked")).map(i=>i.value);
    const first=group.querySelector("input");
    data[group.dataset.choiceGroup]=first?.type==="radio"?(checked[0]||""):checked;
  });
  el.dynamicRecordForm.querySelectorAll("[data-repeat-key]").forEach(wrapper=>{
    data[wrapper.dataset.repeatKey]=Array.from(wrapper.querySelectorAll("tbody tr")).map(tr=>{
      const row={};tr.querySelectorAll("[data-col]").forEach(i=>{const key=i.dataset.col;if(i.matches("input[data-student-select]")){const student=selectedStudent(i.value);row[key]=student?.name||cleanText(i.value);row[`${key}_id`]=student?.id||"";}else if(i.matches("select[data-employee-select]")){row[key]=i.selectedOptions[0]?.textContent?.trim()||"";row[`${key}_id`]=i.value||"";}else row[key]=i.value;});return row;
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

function showNewRecordDataLoader(message="جارٍ تجهيز بيانات السجل..."){
  let wrap=document.getElementById("newRecordDataLoader");
  if(!wrap){
    wrap=document.createElement("div");wrap.id="newRecordDataLoader";wrap.className="new-record-data-loader";
    wrap.setAttribute("role","status");wrap.setAttribute("aria-live","polite");
    wrap.innerHTML=`<div class="nrdl-card">
      <div class="nrdl-logo" aria-hidden="true"><img src="../assets/school-logo.png" alt=""><span class="nrdl-fill"><img src="../assets/school-logo.png" alt=""></span></div>
      <strong>جارٍ تحميل بيانات السجل</strong><small data-nrdl-message></small>
      <div class="nrdl-bar" aria-hidden="true"><i></i></div>
    </div>`;
    document.body.appendChild(wrap);
  }
  const msg=wrap.querySelector("[data-nrdl-message]");if(msg)msg.textContent=message;
  wrap.classList.remove("done","complete");wrap.hidden=false;
  requestAnimationFrame(()=>wrap.classList.add("visible"));
  return wrap;
}
function hideNewRecordDataLoader(){
  const wrap=document.getElementById("newRecordDataLoader");if(!wrap)return;
  wrap.classList.add("complete");
  const msg=wrap.querySelector("[data-nrdl-message]");if(msg)msg.textContent="تم تحميل الطلاب والفصول والموظفين";
  setTimeout(()=>{wrap.classList.add("done");wrap.classList.remove("visible");setTimeout(()=>{wrap.hidden=true;},260);},260);
}
async function refreshDirectoryForNewRecord(){
  const directory=window.MishkatBubbleDirectory;
  if(!directory?.load)return state.directory;
  const next=await directory.load({force:true});
  if(next&&typeof next==="object")state.directory=next;
  fillAcademicMeta(el.metaAcademicYear?.value||"",el.metaAcademicTerm?.value||"");
  fillSchoolContextMeta(el.metaCampus?.value||"",el.metaStage?.value||"");
  return state.directory;
}
async function openNewRecordWithFreshData(type){
  if(!type)return;
  showNewRecordDataLoader("يتم جلب الطلاب والفصول وموظفي المرحلة");
  try{
    await refreshDirectoryForNewRecord();
    openRecord(type,null);
  }catch(error){
    console.warn("Mishkat: fresh record directory load failed; opening with last available data.",error);
    showToast("تعذر تحديث بعض البيانات الآن؛ تم فتح السجل بآخر بيانات متاحة.",true);
    openRecord(type,null);
  }finally{hideNewRecordDataLoader();}
}

function openRecord(type,record=null){
  const def=RECORDS[type];if(!def)return;
  state.currentType=type;state.currentRecordId=record?.id||null;
  el.recordTitle.textContent=def.title;el.recordDescription.textContent=def.description;el.recordCategoryBadge.textContent=def.category;el.confidentialBadge.hidden=!def.confidential;
  el.metaTitle.value=def.title;el.metaTitle.readOnly=true;el.metaTitle.setAttribute("aria-readonly","true");
  el.metaDate.value=(record?.record_date||todayISO()).slice(0,10);
  fillAcademicMeta(record?.academic_year||"",record?.academic_term||record?.form_data?.academic_term||"");
  fillSchoolContextMeta(record?.campus||record?.form_data?.campus||record?.form_data?.complex||"",record?.stage||record?.form_data?.stage||"");
  el.metaStatus.value=record?.status||"draft";
  renderRecordForm(def);populateForm(record?.form_data||getDefaultFormData(def));
  el.recordPrintId.textContent=record?.id?record.id.slice(0,8).toUpperCase():"مسودة غير محفوظة";
  updateRecordIdentity();setView("editor");
}

function clearCurrentRecord(){if(state.currentType)openNewRecordWithFreshData(state.currentType);}

const SCHOOL_RECORDS_KEY="mishkat_school_records_local_v3";
function readLocalSchoolRecords(){try{return JSON.parse(localStorage.getItem(SCHOOL_RECORDS_KEY)||"[]")||[]}catch(_e){return[]}}
function writeLocalSchoolRecords(items){try{localStorage.setItem(SCHOOL_RECORDS_KEY,JSON.stringify(items))}catch(_e){}}

async function saveCurrentRecord(){
  if(!isPremiumAccess()){showPaymentModal();return;}
  if(!state.currentType||!state.user)return;
  const def=RECORDS[state.currentType],formData=collectFormData();
  const requiredInputs=Array.from(el.dynamicRecordForm.querySelectorAll("[required]"));
  const missing=requiredInputs.find(i=>!cleanText(i.value));if(missing){const details=missing.closest("details");if(details)details.open=true;missing.focus();showToast("أكمل الحقول المطلوبة قبل الحفظ.",true);return;}
  const invalidStudent=Array.from(el.dynamicRecordForm.querySelectorAll('input[data-source="students"],input[data-student-select]')).find(i=>cleanText(i.value)&&!selectedStudent(i.value));
  if(invalidStudent){invalidStudent.focus();showToast("اكتب اسم الطالب ثم اختره من نتائج البحث.",true);return;}
  const ctx=window.MishkatSchoolContext?.getContext?.()||{};
  const payload={user_id:state.user.id,record_type:state.currentType,title:def.title,student_name:def.studentKey?cleanText(formData[def.studentKey]):null,class_name:def.classKey?cleanText(formData[def.classKey]):null,record_date:el.metaDate.value||null,academic_year:cleanText(el.metaAcademicYear.value)||ctx.academicYear||null,academic_term:cleanText(el.metaAcademicTerm?.value)||ctx.term||null,campus:ctx.campus||null,stage:ctx.stage||null,status:el.metaStatus.value,is_confidential:!!def.confidential,form_data:formData,schema_version:SCHOOL_SCHEMA_VERSION};
  el.saveRecordButton.disabled=true;el.saveRecordButton.textContent="جارٍ الحفظ...";
  try{
    if(SCHOOL_EDITION){
      const items=readLocalSchoolRecords();const now=new Date().toISOString();const prior=state.currentRecordId?items.find(x=>x.id===state.currentRecordId):null;
      let bubbleResult={supported:false};
      try{bubbleResult=await window.MishkatRecordsBubbleAdapter?.saveRecord?.(state.currentType,formData,{recordDate:payload.record_date,title:payload.title,status:payload.status},{type:prior?.bubble_type||"",id:prior?.bubble_id||""})||bubbleResult;}catch(error){console.warn("Bubble record save failed; local mirror will still be saved.",error);}
      let row;
      const bubbleMeta=bubbleResult.supported?{bubble_type:bubbleResult.type,bubble_id:bubbleResult.id,bubble_remote:Boolean(bubbleResult.remote),bubble_synced_at:now}:{};
      if(state.currentRecordId){const idx=items.findIndex(x=>x.id===state.currentRecordId);row={...(idx>=0?items[idx]:{}),...payload,...bubbleMeta,id:state.currentRecordId,updated_at:now,created_at:(idx>=0?items[idx].created_at:now)};if(idx>=0)items[idx]=row;else items.unshift(row)}
      else{row={...payload,...bubbleMeta,id:(crypto.randomUUID?crypto.randomUUID():`local-${Date.now()}`),created_at:now,updated_at:now};items.unshift(row);state.currentRecordId=row.id}
      writeLocalSchoolRecords(items);state.records=items;state.archiveLoaded=true;el.recordPrintId.textContent=String(state.currentRecordId).slice(0,8).toUpperCase();
      if(bubbleResult.supported)showToast(bubbleResult.remote?"تم حفظ السجل بنجاح.":"تم حفظ السجل بنجاح.");
      else showToast("تم حفظ السجل محليًا.");
      const savedType=state.currentType;setTimeout(()=>openRecordReport(savedType,true),80);
      return;
    }
    let result;if(state.currentRecordId)result=await db.from("guidance_digital_records").update(payload).eq("id",state.currentRecordId).select().single();else result=await db.from("guidance_digital_records").insert(payload).select().single();if(result.error)throw result.error;state.currentRecordId=result.data.id;el.recordPrintId.textContent=result.data.id.slice(0,8).toUpperCase();state.archiveLoaded=false;showToast("تم حفظ السجل بنجاح.");const savedType=state.currentType;await loadArchive(true);setTimeout(()=>openRecordReport(savedType,true),80);
  }catch(error){showToast(error.message||"تعذر حفظ السجل.",true);}finally{el.saveRecordButton.disabled=false;el.saveRecordButton.textContent="حفظ السجل";}
}

function printCurrentRecord(){updateRecordIdentity();window.print();}
function showToast(message,isError=false){
  let toast=document.getElementById("globalToast");if(!toast){toast=document.createElement("div");toast.id="globalToast";toast.style.cssText="position:fixed;right:22px;bottom:22px;z-index:150;padding:12px 16px;border-radius:12px;color:#fff;font-weight:800;box-shadow:0 16px 40px rgba(0,0,0,.2);transition:.25s";document.body.appendChild(toast);}toast.style.background=isError?"#b6383f":"#14775b";toast.textContent=message;toast.hidden=false;clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.hidden=true,3200);
}

async function loadArchive(force=false){
  if(!state.user)return;
  if(SCHOOL_EDITION){state.records=readLocalSchoolRecords();state.archiveLoaded=true;hideBox(el.archiveStatus);renderArchive();updateStats();refreshStudentReportIndex();return;}
  if(!isPremiumAccess()){state.records=[];state.archiveLoaded=false;showBox(el.archiveStatus,"الأرشيف والحفظ متاحان فقط لمشتركي باقة السجلات الرقمية أو الباقة الشاملة.");renderArchive();updateStats();refreshStudentReportIndex();return;}
  if(state.archiveLoaded&&!force){renderArchive();refreshStudentReportIndex();return;}
  showBox(el.archiveStatus,"جارٍ تحميل السجلات...");
  try{const {data,error}=await db.from("guidance_digital_records").select("id,record_type,title,student_name,class_name,record_date,academic_year,status,is_confidential,form_data,created_at,updated_at").order("created_at",{ascending:false});if(error)throw error;state.records=data||[];state.archiveLoaded=true;hideBox(el.archiveStatus);renderArchive();updateStats();refreshStudentReportIndex();}catch(error){showBox(el.archiveStatus,error.message||"تعذر تحميل الأرشيف.",true);}
}

function renderArchive(){
  const q=cleanText(el.archiveSearch.value).toLowerCase();const type=el.archiveTypeFilter.value;const status=el.archiveStatusFilter.value;
  const filtered=state.records.filter(r=>{
    const def=RECORDS[r.record_type];const hay=`${r.title||""} ${r.student_name||""} ${r.class_name||""} ${r.academic_year||""} ${r.academic_term||""} ${r.campus||""} ${r.stage||""} ${JSON.stringify(r.form_data||{})}`.toLowerCase();
    return(!q||hay.includes(q))&&(!type||r.record_type===type)&&(!status||r.status===status);
  });
  el.archiveList.innerHTML=filtered.length?filtered.map(r=>{const def=RECORDS[r.record_type]||{title:r.record_type,icon:"▤"};return `<article class="archive-item"><div class="archive-item-head"><div><h3>${def.icon} ${escapeHtml(r.title||def.title)}</h3><p>${escapeHtml(def.title)}${r.student_name?` — ${escapeHtml(r.student_name)}`:""}</p></div><span class="status-badge ${escapeHtml(r.status)}">${r.status==="completed"?"مكتمل":r.status==="archived"?"مؤرشف":"مسودة"}</span></div><div class="archive-meta"><span>التاريخ: ${formatDate(r.record_date)}</span>${r.class_name?`<span>الفصل: ${escapeHtml(r.class_name)}</span>`:""}${r.academic_year?`<span>العام: ${escapeHtml(r.academic_year)}</span>`:""}${r.academic_term?`<span>الفصل الدراسي: ${escapeHtml(r.academic_term)}</span>`:""}${r.campus?`<span>المجمع: ${escapeHtml(r.campus)}</span>`:""}${r.stage?`<span>المرحلة: ${escapeHtml(r.stage)}</span>`:""}${r.is_confidential?"<span>سري</span>":""}</div><div class="archive-actions"><button class="primary-button compact-button" data-edit-record="${r.id}" type="button">فتح وتعديل</button><button class="secondary-button compact-button" data-print-saved="${r.id}" type="button">طباعة</button><button class="ghost-button compact-button" data-delete-record="${r.id}" type="button">حذف</button></div></article>`;}).join(""):`<div class="empty-state">لا توجد سجلات محفوظة مطابقة.</div>`;
}
function updateStats(){
  const records=state.records||[];const now=new Date();
  el.statTotalRecords.textContent=records.length;el.statCompletedRecords.textContent=records.filter(r=>r.status==="completed").length;el.statDraftRecords.textContent=records.filter(r=>r.status==="draft").length;el.statMonthRecords.textContent=records.filter(r=>{const d=new Date(r.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;
}
async function deleteRecord(id){if(!confirm("سيتم حذف السجل نهائيًا. هل تريد المتابعة؟"))return;const row=state.records.find(r=>r.id===id);if(row?.bubble_type&&row?.bubble_id){try{await window.MishkatRecordsBubbleAdapter?.deleteRecord?.(row.bubble_type,row.bubble_id);}catch(error){console.warn("Bubble delete failed; removing local mirror only.",error);}}state.records=state.records.filter(r=>r.id!==id);writeLocalSchoolRecords(state.records);renderArchive();if(state.currentView==="recordReport")renderCurrentRecordReport();updateStats();showToast("تم حذف السجل.");}

function openSavedRecord(id,printAfter=false){const record=state.records.find(r=>r.id===id);if(!record)return;openRecord(record.record_type,record);if(printAfter)setTimeout(()=>printCurrentRecord(),350);}

function normalizeStudentName(value){
  return cleanText(value).toLowerCase()
    .replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
    .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
    .replace(/[^\p{L}\p{N}]+/gu," ").trim();
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
  if(!el.studentReportName||!el.studentReportAvailableCount)return;

  // أسماء الطلاب في صفحة التقارير مصدرها قائمة الطلاب الحالية فقط.
  const map=new Map();
  (state.directory?.students||[]).forEach(student=>{
    const key=normalizeStudentName(student.name);if(!key)return;
    map.set(key,{key,name:student.name,classes:new Set(student.className?[student.className]:[]),records:new Set()});
  });

  // السجلات تضيف عدد السجلات/الفصول فقط للطلاب الموجودين حاليًا في القائمة المصرح بها.
  (state.records||[]).forEach(record=>{
    recordStudentReferences(record).forEach(ref=>{
      const key=normalizeStudentName(ref.name);
      const item=map.get(key);
      if(!item)return;
      if(ref.className)item.classes.add(ref.className);
      item.records.add(record.id);
    });
  });

  state.studentReportStudents=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  const current=el.studentReportName.value;

  if(el.studentNamesList){
    el.studentNamesList.innerHTML=state.studentReportStudents.map(item=>`<option value="${escapeHtml(item.name)}"></option>`).join("");
  }
  if(current&&!state.studentReportStudents.some(x=>x.name===current))el.studentReportName.value="";

  el.studentReportAvailableCount.textContent=state.studentReportStudents.length;
  updateStudentReportClassOptions();
}
async function prepareStudentReportsView(force=false){
  if(state.studentReportsLoading)return state.studentReportsLoading;
  if(state.studentReportsReady&&!force){refreshStudentReportIndex();return true;}

  state.studentReportsLoading=(async()=>{
    state.studentReportsReady=false;
    if(el.generateStudentReportButton)el.generateStudentReportButton.disabled=true;
    showBox(el.studentReportStatus,"جارٍ تجهيز بيانات الطلاب والسجلات...");
    try{
      await refreshDirectoryForNewRecord();
      await loadArchive(true);
      refreshStudentReportIndex();
      state.studentReportsReady=true;
      hideBox(el.studentReportStatus);
      return true;
    }catch(error){
      console.warn("Mishkat: student reports preparation failed.",error);
      showBox(el.studentReportStatus,"تعذر تجهيز التقارير الآن. حاول مرة أخرى.",true);
      return false;
    }finally{
      if(el.generateStudentReportButton)el.generateStudentReportButton.disabled=false;
      state.studentReportsLoading=null;
    }
  })();
  return state.studentReportsLoading;
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
async function generateStudentReport(){
  if(!isPremiumAccess()){showPaymentModal();return;}
  if(!state.studentReportsReady){
    const ready=await prepareStudentReportsView(false);
    if(!ready)return;
  }

  const studentName=cleanText(el.studentReportName.value);
  const studentKey=normalizeStudentName(studentName);
  if(!studentKey)return showBox(el.studentReportStatus,"اختر اسم الطالب أولًا.",true);

  let known=selectedStudentIndexEntry();
  if(!known){
    refreshStudentReportIndex();
    known=selectedStudentIndexEntry();
  }
  if(!known)return showBox(el.studentReportStatus,"اختر الطالب من نتائج البحث.",true);

  // التقرير دائمًا يشمل كل السجلات المرتبطة بالطالب المحدد.
  const records=(state.records||[]).filter(record=>
    recordMatchesReportStudent(record,studentKey,"")
  ).sort((a,b)=>reportRecordDate(b).localeCompare(reportRecordDate(a))||String(b.created_at||"").localeCompare(String(a.created_at||"")));

  state.studentReportRecords=records;
  const displayName=known.name||studentName;

  if(!records.length){
    el.studentReportDocument.hidden=true;
    el.printStudentReportButton.disabled=true;
    return showBox(el.studentReportStatus,`لا يوجد سجلات للطالب ${displayName}.`);
  }

  hideBox(el.studentReportStatus);
  const classes=new Set();
  records.forEach(record=>recordStudentReferences(record)
    .filter(ref=>normalizeStudentName(ref.name)===studentKey)
    .forEach(ref=>{if(ref.className)classes.add(ref.className)}));

  const period=reportPeriodLabel(records,"","");
  el.studentReportSchoolName.textContent=state.account?.school_name||"اسم المدرسة";
  el.studentReportStudentName.textContent=displayName;
  el.studentReportProfileName.textContent=displayName;
  el.studentReportProfileClasses.textContent=[...classes].join("، ")||known.classes?.values?.().next?.().value||"غير محدد";
  el.studentReportProfilePeriod.textContent=period;
  el.studentReportGeneratedAt.textContent=new Date().toLocaleDateString("ar-SA");
  el.studentReportScope.textContent=`${records.length} سجل — جميع السجلات المرتبطة بالطالب — ${period}`;
  el.studentReportCounselor.textContent=state.account?.full_name||state.user?.email||"—";
  el.studentReportFooterCount.textContent=records.length;
  el.studentReportReference.textContent=buildStudentReportReference(displayName);

  const logo=state.pendingSchoolLogo||state.account?.school_logo_data;
  if(logo){
    el.studentReportSchoolLogo.src=logo;el.studentReportSchoolLogo.hidden=false;el.studentReportLogoPlaceholder.hidden=true;
  }else{
    el.studentReportSchoolLogo.hidden=true;el.studentReportLogoPlaceholder.hidden=false;
  }

  el.studentReportTotal.textContent=records.length;
  el.studentReportIncidents.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.incidents.has(r.record_type)).length;
  el.studentReportGuidance.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.guidance.has(r.record_type)).length;
  el.studentReportAttendance.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.attendance.has(r.record_type)).length;
  el.studentReportCases.textContent=records.filter(r=>STUDENT_REPORT_GROUPS.cases.has(r.record_type)).length;

  const typeCounts=new Map();
  records.forEach(record=>typeCounts.set(record.record_type,(typeCounts.get(record.record_type)||0)+1));
  el.studentReportTypeBreakdown.innerHTML=[...typeCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([type,count])=>{
    const def=RECORDS[type]||{title:type,icon:"▤"};
    return `<div class="report-type-chip"><span>${def.icon}</span><div><strong>${escapeHtml(def.title)}</strong><small>${count} سجل</small></div></div>`;
  }).join("");

  el.studentReportTimeline.innerHTML=records.map((record,index)=>{
    const def=RECORDS[record.record_type]||{title:record.record_type,icon:"▤",category:"سجل"};
    return `<article class="student-report-event${record.is_confidential?" confidential":""}">
      <div class="student-report-marker"><span>${def.icon}</span><i></i></div>
      <div class="student-report-event-card">
        <header>
          <div><span>${escapeHtml(def.category||"سجل")}</span><h3>${escapeHtml(def.title)}</h3><p>${escapeHtml(reportRecordSummary(record))}</p></div>
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

  el.studentReportDocument.hidden=false;
  el.printStudentReportButton.disabled=false;
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
  const ctx=window.MishkatSchoolContext?.getContext?.()||{};
  const a=state.account||{};const displayName=ctx.counselorName||a.full_name||state.user?.email||"مستخدم";const school=ctx.schoolName||a.school_name||"مدارس المشكاة الأهلية";const logo="../assets/school-logo.png";
  el.headerSchoolName.textContent=school;el.headerUserName.textContent=displayName;if(el.currentUserName)el.currentUserName.textContent=displayName;if(el.currentUserEmail)el.currentUserEmail.textContent=state.user?.email||a.email||"";if(el.currentUserPlan)el.currentUserPlan.textContent="منصة المدارس";if(el.subscriptionExpiry)el.subscriptionExpiry.textContent="جميع الخدمات متاحة";if(el.dashboardPlan)el.dashboardPlan.textContent="منصة المدارس";if(el.dashboardPlanExpiry)el.dashboardPlanExpiry.textContent="مرتبطة بتوزيع المستخدم";
  if(el.currentUserRole)el.currentUserRole.textContent=ctx.counselorRole||"موجه طلابي";if(el.adminNavButton)el.adminNavButton.hidden=true;
  if(el.profileCampusName)el.profileCampusName.value=ctx.campus||"";if(el.profileStageName)el.profileStageName.value=ctx.stage||"";if(el.profileSchoolType)el.profileSchoolType.value=ctx.schoolTypeLabel||"";if(el.profileManagerName)el.profileManagerName.value=ctx.managerName||"";if(el.profileFullName)el.profileFullName.value=displayName;
  [[el.headerSchoolLogo,el.headerLogoPlaceholder],[el.schoolLogoPreview,el.settingsLogoPlaceholder]].forEach(([img,placeholder])=>{if(img){img.src=logo;img.hidden=false;}if(placeholder)placeholder.hidden=true;});
  if(el.requestPremiumButton)el.requestPremiumButton.hidden=true;
  updateRecordIdentity();applySecurity();
}
async function resizeImage(file,max=900,quality=.88){
  const data=await fileToDataUrl(file);return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;const scale=Math.min(1,max/Math.max(w,h));w=Math.round(w*scale);h=Math.round(h*scale);const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);resolve(canvas.toDataURL("image/webp",quality));};img.onerror=reject;img.src=data;});
}
async function handleLogoUpload(file){if(!file)return;if(file.size>1.5*1024*1024)return showBox(el.settingsStatus,"حجم الشعار أكبر من 1.5 ميجابايت.",true);try{state.pendingSchoolLogo=await resizeImage(file);applyAccountUI();showBox(el.settingsStatus,"تم تجهيز الشعار. اضغط حفظ بيانات المدرسة.");}catch{showBox(el.settingsStatus,"تعذر قراءة الشعار.",true);}}
async function saveSchoolProfile(){
  // School edition: distribution identity is read-only and comes from Bubble.
  applyAccountUI();
  if(el.settingsStatus)showBox(el.settingsStatus,"بيانات التوزيع تُحدّث تلقائيًا ولا تحتاج إلى حفظ يدوي.");
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
  el.recordsCatalog.addEventListener("click",e=>{const b=e.target.closest("[data-open-record]");if(b)openRecordReport(b.dataset.openRecord);});
  el.backToDashboardButton.addEventListener("click",returnToCurrentRecordReport);el.newRecordButton.addEventListener("click",clearCurrentRecord);el.saveRecordButton.addEventListener("click",saveCurrentRecord);el.printRecordButton.addEventListener("click",printCurrentRecord);
  if(el.recordReportBackButton)el.recordReportBackButton.addEventListener("click",()=>setView("dashboard"));
  if(el.recordReportNewButton)el.recordReportNewButton.addEventListener("click",()=>{if(state.currentType)openNewRecordWithFreshData(state.currentType);});
  if(el.recordReportSearch)el.recordReportSearch.addEventListener("input",debounce(renderCurrentRecordReport,120));
  if(el.recordReportYear)el.recordReportYear.addEventListener("change",renderCurrentRecordReport);
  if(el.recordReportTerm)el.recordReportTerm.addEventListener("change",renderCurrentRecordReport);
  if(el.recordReportBody)el.recordReportBody.addEventListener("click",e=>{const edit=e.target.closest("[data-report-edit]");if(edit)return openSavedRecord(edit.dataset.reportEdit);const print=e.target.closest("[data-report-print]");if(print)return openSavedRecord(print.dataset.reportPrint,true);const del=e.target.closest("[data-report-delete]");if(del)return deleteRecord(del.dataset.reportDelete);});
  el.dynamicRecordForm.addEventListener("click",e=>{const add=e.target.closest("[data-add-row]");if(add){const wrapper=el.dynamicRecordForm.querySelector(`[data-repeat-key="${CSS.escape(add.dataset.addRow)}"]`);const columns=JSON.parse(wrapper.dataset.repeatColumns||"[]");wrapper.querySelector("tbody").insertAdjacentHTML("beforeend",renderRepeatRow(columns,{}));refreshUniqueStudents(wrapper);return;}const del=e.target.closest("[data-delete-row]");if(del){const wrapper=del.closest("[data-repeat-key]");const tbody=del.closest("tbody");if(tbody.children.length>1)del.closest("tr").remove();else Array.from(del.closest("tr").querySelectorAll("input,textarea,select")).forEach(i=>i.value="");refreshUniqueStudents(wrapper);}});
  el.dynamicRecordForm.addEventListener("change",handleSchoolBubbleChange);
  el.archiveSearch.addEventListener("input",debounce(renderArchive));el.archiveTypeFilter.addEventListener("change",renderArchive);el.archiveStatusFilter.addEventListener("change",renderArchive);el.refreshArchiveButton.addEventListener("click",()=>loadArchive(true));
  el.archiveList.addEventListener("click",e=>{const edit=e.target.closest("[data-edit-record]");if(edit)return openSavedRecord(edit.dataset.editRecord);const print=e.target.closest("[data-print-saved]");if(print)return openSavedRecord(print.dataset.printSaved,true);const report=e.target.closest("[data-student-report]");if(report)return openStudentReportForName(report.dataset.studentReport);const del=e.target.closest("[data-delete-record]");if(del)return deleteRecord(del.dataset.deleteRecord);});
  if(el.studentReportName){el.studentReportName.addEventListener("input",debounce(updateStudentReportClassOptions,120));el.studentReportName.addEventListener("change",updateStudentReportClassOptions);}
  if(el.generateStudentReportButton)el.generateStudentReportButton.addEventListener("click",generateStudentReport);
  if(el.resetStudentReportButton)el.resetStudentReportButton.addEventListener("click",resetStudentReport);
  if(el.refreshStudentReportsButton)el.refreshStudentReportsButton.addEventListener("click",async()=>{const ok=await prepareStudentReportsView(true);if(ok)showToast("تم تحديث بيانات تقارير الطلاب.");});
  if(el.printStudentReportButton)el.printStudentReportButton.addEventListener("click",printStudentReport);
  if(el.studentReportTimeline)el.studentReportTimeline.addEventListener("click",e=>{const open=e.target.closest("[data-open-report-record]");if(open)openSavedRecord(open.dataset.openReportRecord);});
  window.addEventListener("afterprint",restoreStudentReportPrintState);
    if(el.schoolLogoInput)el.schoolLogoInput.addEventListener("change",()=>handleLogoUpload(el.schoolLogoInput.files?.[0]));if(el.saveSchoolProfileButton)el.saveSchoolProfileButton.addEventListener("click",saveSchoolProfile);if(el.requestPremiumButton)el.requestPremiumButton.addEventListener("click",showPaymentModal);
  if(el.closePaymentModalButton)el.closePaymentModalButton.addEventListener("click",closePaymentModal);if(el.paymentModal)el.paymentModal.addEventListener("click",e=>{if(e.target===el.paymentModal)closePaymentModal();});el.paymentPlanInputs.forEach(i=>i.addEventListener("change",updatePaymentModal));if(el.paymentConfirmCheckbox)el.paymentConfirmCheckbox.addEventListener("change",updatePaymentModal);if(el.confirmPremiumRequestButton)el.confirmPremiumRequestButton.addEventListener("click",requestPremium);
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
    await loadArchive(true);
    setView("dashboard");
    state.supportPoll=setInterval(checkSupportUnread,12000);
  }catch(error){showToast(error.message||"تعذر تحميل الحساب.",true);}
}

async function init(){
  // Render the 16-record catalog immediately; Bubble/API availability must never hide the digital records UI.
  if(el.loginPage)el.loginPage.hidden=true;
  if(el.appShell)el.appShell.hidden=false;
  state.user={id:"mishkat-school-local",email:"school@mishkat.local"};
  state.account={user_id:state.user.id,full_name:"مستخدم المدرسة",school_name:"مدارس المشكاة الأهلية",school_logo_data:"../assets/school-logo.png",is_system_admin:false,is_active:true};
  state.packageAccess=true;state.entitlements=[];
  prepareSchoolBubbleDefinitions();
  bindEvents();
  renderCatalog();
  setView("dashboard");
  if(el.metaDate)el.metaDate.value=todayISO();
  el.archiveTypeFilter.innerHTML=`<option value="">كل السجلات</option>${Object.entries(RECORDS).map(([k,def])=>`<option value="${k}">${escapeHtml(def.title)}</option>`).join("")}`;
  if(el.studentReportType)el.studentReportType.innerHTML=`<option value="">كل أنواع السجلات</option>${Object.entries(RECORDS).map(([k,def])=>`<option value="${k}">${escapeHtml(def.title)}</option>`).join("")}`;
  try{
    await loadSchoolBubbleDirectory();
    const ctx=window.MishkatSchoolContext?.getContext?.()||{};
    state.user={id:ctx.id||"mishkat-school-local",email:ctx.email||""};
    state.account={...state.account,user_id:state.user.id,full_name:ctx.counselorName||"مستخدم المدرسة",school_name:ctx.schoolName||ctx.campus||"مدارس المشكاة الأهلية",school_logo_data:"../assets/school-logo.png"};
    fillAcademicMeta();fillSchoolContextMeta();applyAccountUI();renderUnifiedPlatformSwitcher();renderCatalog();refreshStudentReportIndex();
  }catch(error){
    console.error("Mishkat Bubble directory init error",error);
    showToast("السجلات ظاهرة، لكن تعذر تحديث البيانات الآن.",true);
  }
  try{await loadArchive(true);}catch(error){console.warn("Mishkat archive load failed",error);}
  setView("dashboard");
}

window.addEventListener("mishkat:student-class-ready",event=>{
  const detail=event?.detail||{};
  if(!detail.studentId||!detail.className||!el.dynamicRecordForm)return;
  el.dynamicRecordForm.querySelectorAll('select[data-source="students"],select[data-student-select]').forEach(select=>{
    if(select.value!==detail.studentId)return;
    if(select.matches("select[data-student-select]")){
      const cls=select.closest("tr")?.querySelector('[data-col="class_name"]');
      if(cls)cls.value=detail.className;
    }else{
      setLinkedValue("class_name",detail.className);
      const student=selectedStudent(detail.studentId),box=ensureStudentSummary(select);
      if(box&&student){box.innerHTML=studentSummaryMarkup(student);box.hidden=!box.innerHTML;}
    }
  });
});

function handleDirectoryUpdate(event){
  const next=event?.detail;
  if(next&&typeof next==="object"&&Array.isArray(next.students)){
    state.directory=next;
    fillAcademicMeta(el.metaAcademicYear?.value||"",el.metaAcademicTerm?.value||"");
    fillSchoolContextMeta(el.metaCampus?.value||"",el.metaStage?.value||"");
    if(state.currentType&&state.currentView==="editor")refreshPersonSelectors();
    refreshStudentReportIndex();
  }
}
window.addEventListener("mishkat:directory-ready",handleDirectoryUpdate);
window.addEventListener("mishkat:directory-loaded",handleDirectoryUpdate);
init();
