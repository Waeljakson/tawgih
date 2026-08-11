"use strict";

const GRADE_NAMES = {
  1: "الأول الابتدائي",
  2: "الثاني الابتدائي",
  3: "الثالث الابتدائي",
  4: "الرابع الابتدائي",
  5: "الخامس الابتدائي",
  6: "السادس الابتدائي",
  7: "الأول المتوسط",
  8: "الثاني المتوسط",
  9: "الثالث المتوسط",
  10: "الأول الثانوي",
  11: "الثاني الثانوي",
  12: "الثالث الثانوي"
};
const GRADE_IDS = Object.keys(GRADE_NAMES).map(Number);
const GRADE_STAGE_GROUPS = [
  {label: "المرحلة الابتدائية", ids: [1, 2, 3, 4, 5, 6]},
  {label: "المرحلة المتوسطة", ids: [7, 8, 9]},
  {label: "المرحلة الثانوية", ids: [10, 11, 12]}
];
const ORDINAL_WORDS = {
  1: ["اول", "الاول"],
  2: ["ثاني", "الثاني"],
  3: ["ثالث", "الثالث"],
  4: ["رابع", "الرابع"],
  5: ["خامس", "الخامس"],
  6: ["سادس", "السادس"]
};
const MODES = {
  semester: {
    id: "semester",
    name: "نتيجة الفصل الدراسي",
    reportTitle: "تحليل نتائج الفصل الدراسي",
    period: "الفصل الدراسي",
    requiresClasses: true,
    supportsClassAnalysis: true,
    supportsShortTests: false,
    supportsFinalExams: true,
    categories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    reportCategories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    filesHelp: "اختر ملفًا تفصيليًا لكل صف. يجب أن تحتوي أوراق الطلاب على رقم الفصل، ولإظهار ضعاف المواد يجب أن يظهر عمود «اختبار نهاية الفصل» داخل كشف كل طالب.",
    usageHelp: "اختر ملفات نتيجة الفصل الدراسي وحدد الصف الصحيح لكل ملف. سيستخرج التطبيق الفصول ويقارن بينها، ويحسب نسبة كل طالب في اختبار نهاية الفصل ويرصد من هم أقل من النسبة المحددة.",
    notesPlaceholder: "مثال: الفصل 1/1 فصل موهوبين، أو ملاحظات المتابعة للحالات المتعثرة."
  },
  past: {
    id: "past",
    name: "تحليل نتيجة العام الماضي",
    reportTitle: "تحليل نتيجة العام الماضي",
    period: "العام الماضي",
    requiresClasses: false,
    supportsClassAnalysis: false,
    supportsShortTests: false,
    supportsFinalExams: true,
    categories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول"],
    reportCategories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول"],
    filesHelp: "اختر ملفًا تفصيليًا لكل صف. لا يشترط وجود رقم فصل، ولإظهار ضعاف المواد يجب أن تتضمن أوراق الطلاب عمود «اختبار نهاية الفصل»؛ ملفات المعدلات المختصرة وحدها لا تكفي.",
    usageHelp: "اختر ملفات النتائج النهائية للعام الماضي وحدد الصف الصحيح لكل ملف. سيُنشأ التحليل على مستوى الصفوف، مع رصد ضعاف اختبار نهاية الفصل عند توافر الدرجات التفصيلية.",
    notesPlaceholder: "أضف أي ملاحظات تفسيرية عن نتائج العام الماضي أو برامج دعم الطلاب."
  },
  period: {
    id: "period",
    name: "تحليل الفترة",
    reportTitle: "تحليل نتائج الفترة",
    period: "الفترة الأولى",
    requiresClasses: false,
    supportsClassAnalysis: true,
    supportsShortTests: true,
    supportsFinalExams: false,
    categories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    reportCategories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    filesHelp: "ارفع ملفات نتائج الفترة لكل فصل. إذا لم يوجد حقل «المعدل» سيحسبه التطبيق تلقائيًا من مجموع درجات المواد ودرجاتها القصوى، ويمكن رفع أكثر من ملف للصف نفسه.",
    usageHelp: "حدد الصف الصحيح لكل ملف. يستخرج التطبيق رقم الفصل من الملف أو من اسم الملف مثل 1-1، ويحسب المعدل تلقائيًا، ويعرض تحليل الفصول وأفضل خمسة طلاب بكل فصل، ويحوّل الاختبارات القصيرة إلى نسب مئوية.",
    notesPlaceholder: "أضف ملاحظات الفترة، وأسباب الضعف في مواد محددة، وخطط المعالجة المقترحة."
  }
};

const decoder = new TextDecoder("utf-8");
const state = {mode: null, files: [], result: null, user: null, account: null, profile: null, packageAccess: false, entitlements: [], archive: [], pendingSchoolLogo: null, adminRequests: [], adminUsers: [], adminEntitlements: [], securityTimer: null, supportThread: null, supportMessages: [], supportPollTimer: null, adminSupportThreads: [], adminSelectedThread: null, adminSupportMessages: []};
const CURRENT_PACKAGE_CODE = "results_analysis";
const SCHOOL_EDITION=true;
const UNIFIED_PLATFORM_ROUTES = {
  results_analysis: {label:"تحليل النتائج", href:"../analysis/index.html"},
  guidance_records: {label:"السجلات الرقمية", href:"../records/index.html"},
  presentations: {label:"العروض التقديمية", href:"../presentations/index.html"},
  counselor_plan: {label:"خطة الموجه", href:"../plans/index.html"},
  achievement_reports: {label:"تقارير الإنجاز", href:"../reports/index.html"},
  messages_library: {label:"مراسلات ولي الأمر", href:"../messages/index.html"}
};
function unifiedLaunchKey(code){return `unified_platform_launch_${code}`}
function rememberUnifiedLaunch(code){try{sessionStorage.setItem(unifiedLaunchKey(code),String(Date.now()));sessionStorage.setItem('unified_last_platform',code)}catch(_error){}}
function clearUnifiedLaunches(){try{Object.keys(sessionStorage).filter(k=>k.startsWith('unified_platform_launch_')).forEach(k=>sessionStorage.removeItem(k));sessionStorage.removeItem('unified_last_platform')}catch(_error){}}
function cameFromUnifiedPortal(){
  const params=new URLSearchParams(location.search);const fromPortal=params.get('from')==='portal';
  let remembered=false;try{remembered=Boolean(sessionStorage.getItem(unifiedLaunchKey(CURRENT_PACKAGE_CODE)))}catch(_error){}
  if(fromPortal){rememberUnifiedLaunch(CURRENT_PACKAGE_CODE);params.delete('from');const q=params.toString();history.replaceState({},'',location.pathname+(q?`?${q}`:''));return true}
  return remembered;
}
function activeUnifiedEntitlements(){return (state.entitlements||[]).filter(e=>e.is_active!==false&&e.expires_at&&new Date(e.expires_at).getTime()>Date.now())}
function unifiedHasAccess(code){if(SCHOOL_EDITION)return true;const active=activeUnifiedEntitlements();if(state.account?.is_system_admin)return true;if(code==='messages_library')return active.some(e=>e.billing_period==='yearly');return active.some(e=>e.product_code==='all_access'||e.product_code===code)}
function goToUnifiedPlatform(code){const item=UNIFIED_PLATFORM_ROUTES[code];if(!item||item.coming||!unifiedHasAccess(code))return;rememberUnifiedLaunch(code);location.href=`${item.href}?from=portal`}
const UNIFIED_PLATFORM_ICONS={
  results_analysis:'<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
  guidance_records:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>',
  presentations:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21l4-5 4 5M8 9h3M8 12h7"/></svg>',
  counselor_plan:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m15 16 1.4 1.4L19 14.8"/></svg>',
  achievement_reports:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="m15 17 1.5 1.5L20 15"/></svg>',
  messages_library:'<svg viewBox="0 0 24 24"><path d="M4 5h16v12H7l-3 3z"/><path d="M8 9h8M8 13h5"/></svg>'
};
function unifiedPlanMeta(){
  if(SCHOOL_EDITION)return {label:'منصة المدرسة',detail:'جميع الخدمات متاحة',trial:false};
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
  badge.innerHTML=`<span class="platform-plan-status${plan.trial?' trial':''}"></span><span class="platform-plan-copy"><span>الإتاحة</span><strong>${plan.label}</strong><small>${plan.detail}</small></span>`;
  bar.hidden=false;
  box.querySelectorAll('[data-unified-platform]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goToUnifiedPlatform(a.dataset.unifiedPlatform)}));
}

const PACKAGE_LABELS = {
  results_analysis: "باقة تحليل النتائج",
  guidance_records: "باقة السجلات الرقمية",
  presentations: "باقة العروض التقديمية",
  counselor_plan: "باقة خطة الموجه الطلابي",
  program_ideas: "باقة أفكار البرامج",
  all_access: "الباقة الشاملة"
};
const SUPABASE_URL = "https://fpicgtldwfevdvpbxkjf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}
});
const BRAND_ASSETS = {
  school: "assets/expressive-education-logo.png",
  guidance: "assets/expressive-insight-logo.png"
};
// نسخ مضمّنة داخل التطبيق لضمان عمل تصدير Word حتى عند تعذر fetch
// أو عند فتح النسخة محليًا من الجهاز.
const BRAND_DATA_FALLBACK = {
  school: "data:image/png;base64,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",
  guidance: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAD+RElEQVR4nOydeZwU5Z3/P8/zVFVfcw8DDLeIgCggS4KKKB5c4oFo0GQ1iSYmmsNkk/ySzV4xySa7Sdxssskm0cRNdmNMIiqIJyIeKKJiiMIgiiJyX8MMzNFXVT3P8/ujuoaenu6e7pk+amae9+s1r+muru6u7q56vp/n+3wPQKFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBQKhUKhUCgUCoVCoVAoFAqFQqFQKBSKgQop9wEoFIqCU8zrWhbxtRUKRQlRAkCh8DaD4RpVokGh8CCDYXBRKAYq6vpzUAJBoSgDagBSKIqPus76jhIHCkWRUAOTQlE41PVUOpQwUCj6iRqwFIq+4eVrZ6gGAXr52BQKz+HlQUyh8ArlvE4GwzVaLsOsBIFCkYXBMLgoFIWmlNfFUL8GS2mklSBQKJIY6oOPQgGU5joo9Ht47dothnEttsFWgkAxpPHaIKJQlIJinvf9fe3Bfk321+gW02grQaAYUgz2wUahcCnGud7X1yyHxyHVuKU7hmz7lMo49vV9Cn18SgwoBj1KACgGM+V2uxfq/QlOGaSBcM1KnDrOQhnSfF9HCQKFohcGwmCiUORDIY1uKd6zEEsGuRinvrxPb6+b63tneu3+PN99jWLsW8rXUijKhhIAisFAqY1+X97PNXZeXjYoJOmWE0oxi8/1OeXyTCgUnmGgDSoKhUshzt1iGPx8XlOm3M+XQrxGX0lekijFun1fPQalFARKDCgGFEoAKAYSpYqwL+R+fVm/z9dbkG2/TEYplyDA3l6/WC74fIx2PqJAiQGFIgklABRepxRGv1CGOV9j39s+6aLwCxWImM5AFcLQJ++faxZBMQxzLvsWap9iPl+hKBpKACi8SrED6/KZvedjqPN5PDVSPtvrpIuqL/R3VChXfm8ZAKmft7f98nnvvu6nxIBiyKEEgMJLlNvoZzP4/REDyYaut8czvUaP4xgzZgwAgHPeY/8PX345q4zH+319+3w+GY/HyYEDB8S7774rkh9jjHUZtAMHDiQ/1F/Dn+21SmXIC/E+xXiuQlEwlABQeIFiRsYXe/aebntvIiLT8wkApBr2ZGPeAqAewP33328DsDMcgwRgZXisP/iQwXgtWbLEX19f7+yURjQwxmRCJPR1tp+ttkBflxdyjSFQYkAxKFECQFEuijXb788sP9/X7kssQJeRdw385MmT6ZgxYygAtLS0YO3atbGk/TMZc99///d/17bZttQ1kwBAEEHQKipC/pD/8kXLbmGMGbbIpBFyRgSpRpvbWl978+0tLx/c2+qLxlodT0AECAaDaI5GxXe+/vVjGZ6fLBq0G2+8Uevw+SQAvP7UUxzoVRxkyzbIZsCzCY1sRr9cYkAJAUXJUQJAUWqKNdvvryjIZXsm8ZB11t/Y2OjM5D/8YVZZWUmSjLwEQAHEk59w5113DW8IBCilVISGdTfmDJT6gv44t+x5fsOYYwshAELdoyAgUkrBQroR6uUz50UcEoKLNiE4A4gEAAkJRimEkGYkFvkdYywmbEEFRDfR0Ly72bAsS37xi188kfJZ9aTvTLvxxhs1n88n33//ffnuu++KJGEAdDeQvaUg5isIMqHEgGJQowSAolT0Nc+9r4/35bFcDHtexj7FVW+6O955113Dx9bWanV1dfFz5sy+oKF22LkmhM05Dwb9wVsoJYaQUkLKjMY8nuEgJCRs27ZRCEMiJQEhkhCia0xL816OgtHTHp8Et3m7hJQaITRmmpuZrm20TdtnWVbsqXVrfneyw45WRaPslp7iwAdAuksL7nJCL6IgV0FQajGghIDCkygBoCgmxZjtF9Po52rwCQDkaOz9v//976tsXfddsWTJp/1+P7Nsy+f3+T9FKPEB4Iyxal/Sy1sARNcbZzTmNPGX/kMRUvBrW0qZ2SBJyUEcz0A60SDhWPRkwpYZJoRYjBAWM83NVGMvEosHjpw4/sqet999eefOnfoXv/jFI0lPySYKclkeyCQS8vEY9PZ4MbwCSggoioISAIpiUErDXwijn/pYVoM/89JLNXR347tr9F3G/qqlS2+tqKiQphW/wK8bcywhENL0KvcFHSMvQUBgcxtSSgtSOu9JCOt2QEUw5qUiRTSIxB8AEE3TNALSQxzEISGFaOec25Fo9N5Kw2ceOHbsL3vefXdjGlFgILF8UCBBkK8YKMZjhXyOQpGRATuwKDxLvudUsd346bb3tk82gw8kZvf/cc89wxpqa4NLFy/+dDZj77rqLdtyZ/IEQJeRH8gGvj+kigMCCAmAEKIzpoHAse6AIwoA2WZbNu8SBS3HXt/z9rsvL1y4MAogktjVB4D1QRAUUwwoIaDwJENy4FEUnEKv7xcrQj/TPl2z/sbGRjJ58mQaCARoOoM/rrE2uODSpZ8EkVU+w3czCAkEmda1Rp/G2He56oeqoe8LSeKAA5DpREFUcGiUtIXj8c1Vum/T7oMH39yzc+dL6QTBkiVLtK1bt9qHDx+W6N3491cMFFok5PtaCkVOqAFJ0V8KNeMvlIs/00w/1bXfzejPnDlTMwxDPvrooxaAGADcc889w2qzGHwTPdbolbEvIplEgbt8kE4QtO7c+dK5CxdGAESRZrkgSRD0eLss9wshBgrpFVBCQNEn1CCl6CvlMvz5GP3UbT2M/ta1W+3DOGwjMctfuXJl3bkXXnhBXVXFRdTwfwIEoXQGX0oJklirV8a+PCQJAgFApBUEIG0x2/4LpHzu5aee+uPly5cfwqkATd/VV19ttLW1yRzFQC6egXwNuxICirKhBi5FvuRzzhRrDT/1fl5G/421b/CjOGrBMQT6o4+ubJx78ZJPUkqr/X7fJzSmNehQBn+gkV4QMLgZFibnnTHb3FSh+1754ODBrX999dUN119/fWviOf6rr75azyIGejP+/fUKKCGgKDlqIFPkSjlm/L0Z9myPZTP6xlOrV4+64PLL/5ZScolO2XkGYxVIPGjZFqSUtjL4A5sUQSA1TdNcMWABsDk/yuPx+1rb21987aWXXs5TDPR4uyyPF2p5QAkBRUFRA5uiN4pp+Ps7209e18/L6GuUnudjWgXgRJgnz/KVwR+cJASBm4qo65oOA64YsI/asfgfTnR0bMgkBjZs2MCTXy7lPzI8VoxgQiUEFAVBDXSKTHjZ8Cff79o+f/58lhS9bwLQn1q9enQ2o594PlVGf+ghHTghREsVAzxu9vAMjBgxIjRr1iyWJZsAOd5Odz/Ttr5sz4QSAopuqEFPkUqpDX8+s/0et7tm+2+8wY8ePRoGgD/84Q/jr7n++hsh5SUaU0Zf0TvZxUDsvrb2zhfHNDY+CScDwbdkyRJfNBoVSV6Bvhr+UgsBJQIUXagBUJFMIQL8CmH4U+/3uJ0024/DSb9nBw4fXlpdVXEhMXy3hDR9GKCMviJ/0okBDiBuWc9IYMMjK1f+4aabbtoLpPUKdL1ML7eVEFCUHTUYKgDvGP4eQXzJt7PM9m8iwHyfri9kcAP5TBsgyugr+kUiboADYCFNJwAQtq3j0oz/rq2986U+egWS7xdaCCgRoMgZNTAObQrh7i+04e/x+IgRI+isWbNYb7P9sG11DdbK6CsKjZSSA1LqmqH15hWoOb2G7ty0k8MxssmxAtk8A8nxBLkad+UNUPQZNUgOXfo76+9LIF/y/d4C/MjcuXNZVVUVcYP6/m/l/4277pqPfTzTbJ+kNNFRKIpBVq9ApPOlMQ2OV6ChoaFi9uzZNIflgUJUHVRCQJE3SgAMPUrl7u9rcB+ZMncKO/n+SeG6+VeuXDn6ksWLPx8MBj8X1LRaQM32Fd4g1StgQ0Jwe104HP1ZXXX1OjixhL4lS5b4EktXbjfEdEbfC0JAiYAhhBo4hxa5/t7FMPxZ1/eRMPyt77XK5ubmTgDsQPPhpdXBiguJbnwqpBv1JgDTMm1C1Gxf4S1cr4AEWIWmEw4gZlnPANjw8CN/uu+T139yHwBjyZIl/oQQcA1+LrEBhRICyhug6IYSAEODUhj+1G3ZXP3dtqUYfr21rW1RMOD/MtP1hRoI4gBsp7uemu0rPI8QQhBCiLs8ELHtE5FI5FdPPL36lzdff/NBFEYI9OV+b9v7up9igKIG08FPoY1/Xwx/uu3pDX8o8CVKtUU6Iei0LUmUm18xQJFScimlNHRneaCAQiCX7b1ty7a9r/spBhhqUB28FHvWn88af+8z/hTDDyklpZTm+BkUCs/iLg/omp6LEMgWI5Duf+rjme7nsy3tx8hxP8UAQgmAwUl/jH8hqvXl7upXhl8xRMhBCPgWLFjgb2pqsnvxCPQnPkB5AxRdKAEwuCi2uz+XAL8e+06ZMkVrbVWGX6EAchMCWbIG8qk2mOl+PtvSfoQc91N4HCUABg+lnvX36hUYMWIEPe+88/Q1a9achDL8CkU3MguBp3958/XXHwQQnDNnjrZ582bbfQryCw5UQYKKrCgBMPAp5ay/tyI+BAAZMWIEmT59urZ+/fo4gNihlpbL66srv0KotlAZfoWiO+mEQCwW+dXcxXN+sHPTzo4pU6ZUoh5IVBYEsscDFCJ7INO2tIef434KD6IEwMCmkLP+XCr2pd4nqftNmTKX7dy5KQ7AvO+++8Ysveaa2/1+/z8ENY2GbUtIKaEMv0LRE1cIMKZpfkIQMePPxWLxH9dXVz8DwGpoaKiglMo8ign1VwRk257vPgoPogTAwCWX364Ys/60wmDK3Lla63vvyebm5s5f33ffmOXXXP25oN+p3BflHEIKror3KBS9kxACdkjTdRsSnNvr2sOdPxteXfcMALJixQr/iy++aOcRH5Bpn1zuZ9qW9tBz3E/hEZQAGHiUc9bf4/Gkdf42ANh7+MBHRjaMvNtgrM6p068K+CgUfUEIIUAIqdB0IgF0muYTL7/63Gcun3/5YaSPD3D/9+YFUCJAAUAJgIFGqY1/9rQ+x91vA4geamm5vK6y8qtUYwsECGxuWwA0Zfizkzpaqi9LkYrTbwA0pOkkYlsnYpHor+Ze7sQH1NfXV2qaJpLSBrueht49A8USAkoEDBDUeDNwKJTLv785/WTEiBEEAI4ePRr+9X33jbkuaZ2/0zIlIQTK8GeHSwlKCHRKIaXsaooQFxyM0KJemBKAkBJCOuM0JQSUEDUYeBwhhNA0nfoJQdSMPxeNhX9cX12/HgCZM2eOL+ENyDcwUHkDhjDqmh8Y9NX493XWn1EUJNyOJgBz94G9140eOfpug7E6tc6fGzxh7Cs0HaYUaI3FQCmBlI4hbvD5YUqBGLeLIgSElNAohZ92/5ligsMWArTIuk1I2c0qKOGRH8nxAQDQEYs9+cwLL9x63eWXH21oaAgmggTTLQf0xxugAgQHKera8zaemfVPmTuXJYL8Io8///zwi+ae9z8Vhn+pKQVszpW7Pwe4lKjUdHAp8cyhA/jpjm34a0szDE2DLSR0SnHrGVNx2+QzMTIQRJTbECjcRSqkRIBp6LQtvHT0CF5tPgIAOK9hJC4cMRIVmo4ot4siAiQkKAgMysCSXj8uOHhCFKiTJ3eSGw7FbfvEkeYjn50wauwqAMaKFSt8KUGCQOblgeTH1JLAEENdc96l2MY/11k/XbZs2akgvwMHPjJ8xPB7/JpeG+a2hJTK3Z8DthCo0g2sP3wQP97+Jp49fBA2HIMsIEFAIKVEzLIwurISnzljKv7fWTOhUQqrADNz9/0f3b8Xt7+yASctC9F4DAAQ8PlRo+u4+/z5uHrseLRbJrQCZWq6I79BKUzOsbPjJHZ1tEGjFBohOHfYSFTrBghQkM851JBSco0xZhCKzljsyS2vvvrpSy655AiA0Jw5c9jmzZut5N1T/ve2Ld19tSQwiFBXmzcphss/l4I+3e43NDTQhoYG7Nixo9Mp5lP9FULJwkSQn3L354g783/8wD585PmnERcCVYZj9Nx1eBdGKEzBEYlFsWziGfjzRZdBAP2aISe///UvPA0OwM+0rpk4l9JZcgCw8uLFuHLMOHTYVreZel+QQGLWT/GX1mP44953EbFthG0LhBAwQhBgGs6qrsMnT5uKoKbBFEINSnkipZQgBCGmnQoSnDPnBzt37uyYPXtB9ZYt6y1kN/r5lhdWSwKDBHWteY9CGP8CrPUv0TZvXhtZsmRJ8P4HH/iG3x9UQX59gEuJAGN46egRLH3mCTDGoFMKW4iMzyEAdMbQGgnj2oln4IGLLkOcc/TlK+dSIsQ0vHj0MC5/5glQRqETCt5DeBBYUkBwgacWXoGLRjQizO0+iwD31YWU+N3ut7GltRl6YtbvzvIlAC4EbCkQ0HTcctqZmFlbjzjnyhPQB7oHCZrPn4x2/mhUTf3aSZPmVLW1fSCam5uT6wb0xRuglgQGGaoim3dINci57pPVkKOn8c/0GoAz62cNDQ108+a1netfWV//wKpVK+sqqv5JQiJsW5xSSpTxzx33Avv37W/CFLxX4w84o6PJOaoDQTyy5328cOQQ/EzrYbR7QwJgAGKc43tNf4UpBAzK0r4OlxIGZTCFwPea/ooY52Do+0gtEsLjmSP7sbH5MEKaBo0Qx+hLCZ7IQiCEwM80RG0bv/tgByK27WRG9PF9hzKUUsq5LTttywoYxiW1oaon9h89dN2uXZvDzc3N9pw5c7TEriTNH9L8T3c720Qj07a+7KMoAUoAeINCzfp7u3DTiYCu/3PmzNGam5vt5ubmyJ5D+6+d96H5b1cGAos7nWI+VLn884NLiZCm44Ujh/HCof2o8Pl7Nf7dSKQK3vXWNhD07WLVKUW7ZeKN1hb4dB08y/tzIeDTdbzR2oJ2y4TexzgAkfB6vHnyONYd3oc6w9cj+r/b+0oJP2OI2Bz/98E7yFPn5IRM+RusEEIIJUTvtEwuIDF6eOND7fHoo48//3zN5s2bOxsaGiicUynTxCDTGNHbciJ62daXfRRFRgmA8lNsl382j4D7R+fPX2Zs3ry58/Hnn69pj0cfG9c45kEwWhuxLU4J0dSkPz/c2XfYtvHD7W86a/h5WjYuJQK6gecPH8CTB/ch0EcvACUEvkS9gV73lxI+SkETs/W+IAFohOKttla0WSZYDq8lpIROCHa0O8/R+vH+ybgZBu7yg04INEJgSzGohQCllEmARrgtKw3/0gXz5u3YfWDvdc3NzZFp06Yh4Q3IZuxz8Qaku51tW1/2URQRJQDKS6GNfy4u/26uv4aGBjplyhS6YcOak+/u37N8wbx5b1ca/qURbkubczkUZv2uW9oSAnbirxDGQacUHZbprH9reo+Av1zQCIFl23j52FHHKPfhNQgARmlOFztN7NvXkdk1tifMON440YyKRNpjLs/TKEXYtvFay1EYlPXp+3JxlxgqNR06pWiNxdBmmThhmmi3LFRphrMcM4iFAHFqLJCwbXEwWjt+9LiVHfHoY4GJAbF58+b22bMX6MjsDUj3P93t3pYW+7KsqSgRWu+7KIpEX4x/tvvpbqe7gLvuz549W9+yZUt49uzTgq/+peN7vkDg7zXGtE7L5JRShiEw63cL44RY90vBkgKWEJCJFL2+4M6+A0xD1I6jL9+nG/0f1PK/VAmAOOcY5g/gU6dPwXf/8grqKqtgcp52f50xdHS04/+dNRPD/AF0WiZYH5cBJJy0vnwRUsKW/csESK63sPbg/pLXW/AahBBmcy4tcFlh+Je++NDLT7SFwz8cVV+/ds6kOVWbd21OPSFSk06S76feRuJ+utvIsq3HYeawj6LAKAFQHnJRxdm25Xo70306f/4ybcOGNe0rH398+OIFl/5vlS+wOGLbImqZklI6JGb9rmFttyysP3QQrx47AoMx6IzhptMmYUQgCEKcILr+pMTl67ZPd6x5xQ4kQSlFjNv46lkz8OaJFjy6533UB0OwhehWClijFC2RMK4+fTK+etYMxLiN/nRtlnA8Kvl+a+7z+kq2egsd3IZbb+Hbf92M37z3dsHrLXiVROQu6bRMXuHzXcwYu2jPof03TBg1dvW0adMCgUBA27Jli4VT44QbLpFOCPRm+JUIGCAoAVB6imH8c4kHAADU19ezYcOGIeHyv27cyNH3GppW02lbNgG0/gz6AwU3P93PKFbv/QB3vPYyTlimUxiHEIBQ/GjbX3HJqDG45/yLMMznQ4TzPs0QCQh00v/v1Mf6pskIAAHAzxgeuGgBPgpgzfvvgvp88CV0XpzbEPE4lp0+GX++aAEIAexEyeK+wKVEkOmYVFmNppMt8BOW06guEkGTZ1RW9+n9uZSo0o2M9RaY+4qEwO8P4EQ8jm//5VW80dqCP190WVfcw+CUAA6UUtZpmZwSQsY2jnmwIx598uLr5q3Y8viWzkTNgOR+Aq5BTveVKBEwCBj8o723KNbM372fbd2fzpkzR2tpaYmedlo1aWlr+/6YxjF/1jStJuwMCEMi0E8CQKLwzUdeeAbXb3gGrWYcGqWoDYZQEwiixueDKSXW7N+Lsx95AI/t3wcjTe58Nk6533249YypiPfBnU7geB9GV1bh5tMnwxS8Ty55ArfKHvD7eZfgh+ddiMtHj0OIMYQYw+Wjx+GH512I38+7BJSgTzP35PdyswCmVNYiwm3QHAQQgSM6gkzDlMpaWFLkVffArbfw/JFDWPH809AYQ43PyT5wAwGT/2wpwAhBXUUl1ux5HzdufB4GpShKCoLHcAMEo9zm7pLAoZaWJVu2rG+bM2kOQ0qcUIaXSRdvlG57b8uYmV5bUQLUF106iu32z+byJ4myoJ2pLn8hBaGUDpnzwHURf3fbFty5eRNqKiodA5Ey8BM4xXE6bBs1ho73ln8MFZqGuJQ5q2YJQCcELfE4PvzEKpwwzbxy6zVK0R6L4luz5uDOmbP7XaK3a9mDaYgLjhNmHABQazjegAi3CzIDTi4C9Iv3mvB22wlUaBrsDMaVwFmGiHAbn5t0NmbVNsCUIq/ZiZQSPsaw9Nm1ePbgPlTlkXLJKEVHPIanF12JS0aORqQfBZAGGkIIXqEbLG7b4kjzkRsmjBq7esaMGf54PE537tyZHBuQXEQIKbf7Wj2wt0th8KuxMqM8AKUhX+Ofzpinbs9FgQPOzJ9t3ry5/d39e5ZfvXjx25U+J7dfQtKhZPydvHwNaw/ux0+2b0VVqAJciLSR9c4sUaJC09Bhmrh10wZYeRh/4NQMvjEQxK1nTEUkEoaeoyufEYKobaM2EMRtk8/s8+w/9XgAoM0ywaVEneFHneEHlxJtltltn/6+j0x811eNPg2UAJ22DY3Qrlm9+z6uoT0ej2F2bQM+VDccVp7G3wv1FgYq7pIAh8TYxjEPtkejj86YMQI7d+6MZ0gVzGcJMpvHMtO2fB5X9JOhdK6Xi74Y/+Tb2S6yrCKgvr6ezZgxQ27evDm898DeFeMbx/yZDjGXfzJSSlBCse7wAZyMRXPOT2dMwzOHD6AlFoOeZ346oxQRbuMr02Zg2emT0RoJgxGacYZJ4KTRxTgHBfDbuRdjmN9f0Br5boEfSwpYUnTbVigoIYjYNqZW1uD/TZ2FM6tq0WJGEec2JE5VAjyZ8EJ8bPwZuGXimTBlfgGAXqm3MJDpWhKwLV7p9y/9+a8fWbVm/frazZs3d86ZM8dVrKnLAqnjTm9jVertbNvyeVzRD5QAKC79Nf7ZbqdT5l1/CxYs0CdMmMBHzBiB9mj00TGjx620paSmbYmhEOWfioQTCHc8FsXqfR/An+MsUQLwUYpo3MQfdr8HnbKs1fRScSOaAozhTxddhmtPm4R2M452ywQlxClQk/RnCYETsRiqdR0PXLwQV48dj2iRauNnW+AtBK5bf1p1Hb44eTo+PmEKptfUQyMUQU1DtW7gitETcPsZZ2P5mIkghDjlgfN8H6/UWxjIJPp7sLBt8epAcNHi+fPfeXvPnuWbN29u//SnP+1Hd1tRKK9Atm35PK7oIyoLoHgUy/j3uv4/e/Zsbf369W1jzhsTWP/rF1dX+v2LwrbFAbChNutPRcJxy+eLLQXMPqanEQBmIsXsz/MX4NlDB/CzHU1Yf/ggLG7jlEwgiVbAZ+K2KWdipD9YkK585YQRgrBtgRKCK0ZNwGWCO90AQUAIUKv7wKXs1+csd72FwQQhhIUtk/t0o2bimDEPvLt/zw2Tx054eMqUKZWtra000VAo11oAyfuke7zbW6fZls/jij4wtM/24lFo459NNXfbf9myZfqaNWtOHj15cnGF3//NoM93cZjbFiFE7/2wBzcEjks/lmdnPQIkMgfyFw4uboqZyTmWjB6HRaPH4YkDe7G5+Sh8zAmQMxjFzadPxqhACKYUA974u7jeC/fzVGh610jeYVtdAZf9pZz1FgYTlFIWt0yhazobPXL0Ay1tbT9cdN11P9q5c2d80qRJxq5du+zErq5hJ0C3WkqZDH7q40B3o65EQIlRAqCw9MWVlY/xz7beRufMmUPXrFlzcteh/ddWh0IP+TSNJKr6DXnjDzjpbZW6jguGj8QzB/dB1/ScXL22lKjw+TFv+EjwRAe7vkAAgBB02BYoAa4aMx5XjRnfbR9TCLTbZtY4gYGK+3ncbIBCGX7ntcpbb2GwQSmlNrclASF1VVX/+Nyja2bfeP0N1z7++OOx2bNnB5KKBgGZZ/uZZv3ZvAFKBJQQFQNQOopl/El9fT2bNm0aNm/eHN5zaP9HxjSMXCkplWHbsofien86CAArES1+yYhRMM3c8vIpnFl7yDAwf2QjbNn/9XhGCAgcIdBmmWhP+rOkcKLl+/UO3qaQsQcE3qm3MNgghBAJScO2Ha8KBBfft/KB1WvWr6/dsmVLZ0qGANBzzMoWH5Dtdrr7PQ4tx4+g6AV1lheObCdlrsY/3cw+eVuPxh1TpkyhEyZM4KP/5m9kezT66NjGMQ9ygNjcJoQQ5eFJQqMUEdvCLZOm4NKxE9Aei8HIoo8InFK6tuD45bnzYFAKS/S9Ql4qLE0QoBrZ8ocmgic/O/lMjKqozDtjglEK0zLxmTPOxKhgyFkiKtrRDiyc4ED4ugcHvn/N5s2b25ctW6YjQxBy6sug57iW7Xa6+z0OLa8PokiLEgCFoVDGP9dtBACZNGmS5vP5RGNjI1bec8+qSr9/adS2+GDI73cruLl/hfD5EQAcQJ3Ph2/NnA1GCVrNGIxE+9vk0UunTs76yc4OLBs/EcvHnQZbDt5a8QMZdwbvlXoLbiyBLZyGUoMhpdANDqSaVjNx7IQHdh3af+2aNWtOXnHFFQbSz/rzHddSb6e73+Owcv8EinSoL7D/FNv4p/UITJo0iQWDQa6PGyfXP/DA6ppgcFHYtgZ8sJ87VPoZO1W7HUBMcNgFatbiFgR6/sgh/HDbG3hm/x5Qw4CPsq6Fy2g8hopAEF+fNgNfnTYDjJJB3TFuoOP+bpYQ+OTG57Fmz/uo9geBRM2BVAhcj5ANCuDP8xdi6ZixTv2FfjZ+8lHaw7MU5nbX+w5khBBCYxqohNx/7ND1k0aNXXXFFVfUPvHEE2ZiF7facrrbSLmda9VAVTGwSAz087HclNL4d92ePXu2tmXLltiVV85m9z3w4qAy/hohYIRg68kWvN/RBp06wXAXNDSixvAh3o9I/GTclrEdtoVfvvMWXjp2BK8dOwKdMfgYw4pxp+GyUWOweNTYQTN4D3bc0stcStz00nNYvfcDgACVutGj6FPMthGzbQwPBHDvBRfjqjHj+511QQAEmIbD0Qh+t2tnwgPAcW7DCFw+ehy4FLD60WTJK0gpBaMMVEq59/CBGyaPnfDw7Nmzq7ds2cLRvWRwqqFXIsBjDPRzsZz01fjnGviXVgQkjH94zfr19RfNPf/3NYHBY/wBwBIc932wE39pPdY1cyMAqg0fPnHaVMyoqS+oJ4ARcqo2fjzuLAUQggafH4BTNrfQVfIUxUMkyvrqlJa03gKXEhohePrgftz+yos4Go10NRailGH5+In4xXnzUKFpQGK5aSAjpRQaZYAQ8kjzkY+6bYWPHDlCW1tbk9MEXedMcn5lLsIg9Xa6+z0OK4+PoIASAH2lFDP/5McpAFxxxRXGE088ceLtPe9fd9rocfcamlYTsS1OCBnQkf4SzlpsjHP86/bXcTweQ5Cxbul2thDo5DY+Om4Srh59GtptC1qB1uMtIbqC8ZCIN4gnagUMtlS8oYDb8TGk6RBAr/UW4pz363d2G0x9v+kN/PPrmxD0+eFjp5aTuJBot01MqKjEliuuRYWuw8yzr4QXEUJISqj0axoNx2JPXveZz1x/dNs2RCIRtmvXLo7uXgBAiQDPoUa3/Cm1258Ap4z/rkP7rx07YtRK4hTr4IMhzc8pt8vwq13b8ZeWYwhpPWuxUzijhwTwpckzcGZVLaLcLmhQXmoysmJgw6UEJUCI9XSOmUIgJmywfqZccikRYho2HD2M5c89BQ4CmihpnIxGKdrjcSyfMBEPXLQAcW6jLxULvUaijgYPaTo7GYms+/gNNyzft28fSYgAO3lXdBcEajnAAwx0EVpqimn8UyNnu/ZLNv5jGhofFACJW+agqOkvpISPMmw9eRx/aTmKAGNpg7YEXC+BjScO7XF61ufZmKc3Un8ExcCm2PUW3EZEMc7x/aa/ot2yoFGatheBLQRChoHVe97HUwf3wT9IGg4l9RCwaoLBRfc98MBqfdw4GQwG+aRJk9LVCnDv90hpTrNvutvp7iv6iBIAuZPvSZev8U++3XW/m/Ef3vigpARccFA6OBam3cC/XR1tsBPrt5kQUsJPNeyLdKBzkJTJVRSfYtZb0ClFu2XijdYW+HUja6MojRAIIQZlwyFCiO6KgPXdRQBDz/TAXDyh2W6nu5/rY4okBoURKQG9nVDZTs5cjX+Px3oYf+IYf0IKUPPUY+QaaCchoRGq8vEVnsBtROSjtFeDnpziOhjJQQR07Zp0O1OXwXT7KhFQYAadISkCpTL+NGnbkDL+wCl3be77KhTegMCpJpjLOelmKAxWcvQEAEoEeILBeyaWhkIZ/277DiXjTwlBTHBcMKwRNYbhpPhl2FejFJ22hbnDnJoAVp4lXxWKQkLg9iEI4FOnT0E0HoORYXZPCYHJOeoCwUHfbyAHEeB+cCUCyszgPAMLRz4nVn+Mf9po/8Fu/AHnQ9tSoiaR5x/mdlfAX/I+OqVoiccwo6YeSxvHFzwDQKHoC5RSRLmNr501AxePHoeWcCd8jHW7yLVEcaKIGcevz5+PkYFg3v0KBhq9iAAgvQhI5yHIZvhRgMeGNIPSqBSIYhn/1Od1nfSzZ8/WkqP9B7vxd6EATMExs6YeN4ybBAmg07YgcaonQEs8huk19VgxbhIM5kRaq6taUW4InFTAoKbhB7PPxYKECLClhC0lhJQ4GY8DAL7/ofNx5ZhxiIv+d5QcCKSKgHHjxsldu3ZZ9fX17niWKgJ6+59pW+pjaQ8nn2MfKqgvJT3FNP6pngACADNnztQbGxujv/jtb64cM7zxAUEIGQrGPxkhJSo0HdvbWvHEoT3YF+6A5pYCHtaIy0eNh0EZYmr2r/AYbmnpKLfxg6Y38bv3nVLANheYVV+Pr589CwsaR/e74uBAREpphTRdPxHpXPfUI49+9Mknn+Tr1q0Tzc3NblxkuvLBQG7FglSNgH4wtM7E3Ci28e9xe+LEidru3btjt/zDHVU//85/7DN0w5/I8/es8U+9igp1IrmNeiwh0GlbICAgBKjVfYhwu6vUq0LhNdxywAGmoTkeg0x4AOr8fhiEDumy0lLKeEjTfQdPtPxgTN2wf/j4xz9ef99998WSdskmAvIpGpTufq6PDTnUSNqdks/83a5+I0aMwMpHHnm4IhhcGLct6dXyvjyp1rpMuOElgLjg/a6q5uIa+eQGLoWq/69QFBMJgEsBH030siQElhAQib4TQxUppWSU2hTE3L1/z81nTjj9oZQugoASASVn6J6R6emLAMjV6Lv/exh/fdw4+cyf//xIbSi0MOzR2v48YewrNB2mFGiNxUApgZROhHODzw9TCsR4/8ururhXqTpJFQONYpaVdmNjkuNgck1DLCdCCqkzjRABvvfw/hsmj53wcI4ioC/lg9Pdz/WxIYPXz5lSUmjjD3QPsuwW8FJXV8fGjBnDx40bJ39/yvh7squfu77JpcQzhw7gpzu24a8tzTA0DbaQ0CnFrWdMxW2Tz8TIQBDRRCS/OrkUisIipIRGKfwpVcAtKWAJAQkJL1fJcFsJEymx7/CB69OIgFTDn0kEFKJvwJAXAd49U0pLqWb+AEDq6+vpBRdcgGhVVDxw98Ora0OVnjX+bqez9YcP4sfb38Szhw/ChkSAaRCJwUZKiZhlJVqsTsX/O2smNEphKbe9QlEQ3M6CfsbQblnYePQIXj12BAZj0BnDTadNwohAEIQ4vQm8vNyQTgTMnDmzZuvWrVbybujZPVCJgALj3bOkdBR63T+bCKAAsGzZMm3NmjUdzR3tTwyrqFzsVePvzvwfP7APH3n+acSFQJVhgAA9Gp4wQmEKjkgsimUTz8CfL7qsq3ufOskUir4jAVAQ+BnF6r0f4I7XXsYJy0Q0HgMIAQhFjWHgklFjcM/5F2GYz4cI556+7hwRQEEl5I7d7y6dNXnas/PmzavauHFjsifA/Z+vJ0AJgBzx8jlSCopl/JPvd/MCXHHFFfoTTzxxomnXzo+edfrkP8UEt6SUnjT+Acbw0tEjWPrME2CMQacUdpZmJwSAzhhaI2FcO/EMPHDRZYhzDuLh2YhC4WUkAEgJUwjcumkD1uz7ADp1Zv2aGySbeDwmBIYZBn4z92JcPnosYsLbngAhpR3UdK0jFn31M5/45KU7d+6kBw4cYK2tre7cobcWwkoE9JOhmZPSO32N+E++3+Nv5syZ2hNPPHHi7T3vf2TyhNP/EBfcFoJrhTzwQuGeGP++/U2Ygvdq/AHnKjI5R3UgiEf2vI8XjhwaNG1PFYpywIVASNPx83e2Y9Wunag0fNAZg5QSlhBOrYFEhkGVpqHFNPGpTc+j07bgpxTZr9jyQgnRIrbFq/2B8+753f+sGTFjBObNmyfr6+vTpUunTrCA7GNxtjE8Fe+qpCIzlAVAX370dM/J5UTFvHnz9K1bt3a88e6ORRPHjP+zICA254wQ6rmTz8nF1/HCkcN44dB+VPj8vRr/biTS+O56a9updQ+FQpEXbk2MtQf34yfbt6IqVAEuRNqugxJOSe0KTUOHaeLWTRtgSen5a48SwsLctmpDlQv/+KuHH3700Ucj8+bNcyMc042nuYiA3vZNh+fG4VLg9fOjWBQj6C+TFwB1dXWsvb3dXLFihXHa2Anf0RhjthCCUu8ZfwmAAQjbNn64/U1nDT/PGTyXEgHdwPOHD+DJg/sQUF4AhSJvpJSghGLd4QM4GYt2q4uRCSElGNPwzOEDaInFoOfwnHJDAD0quFVfUbm4adfOFWvWrDl5xRVX6Mhs/NNOspB9rM50f0gzFAVAX9f9U7dlUp7d2vrW19fTefPmyREzRuCe3/3Pmmp/4LyIbXFKiCdd/4DTeKfDMrGltRm6pvcI+MsFjRBYto2Xjx0FJaTXXukKheIUEk7E//FYFKv3fQB/jl44CcBHKaJxE3/Y/R50ysDz8d6VCSG4Fhfcnjzh9D+8vef9jzzxxBMnZs6c6Y6Rmbyr+cz+c2HIiYOhKAAykc+6fyYPQI8Tct68eezRRx+N/PFXDz9cG6pcGOa2RT1Y6CcZCae4T4BpfTbcbvR/UPOszlEoPI+Ek9aXL7YUMAeA4XchhBKbcyYIyMQx4//8xrs7Fm3durVj3rx5boB0PtlWyLIt3f1cHxt0DDUBkOuPm68LKe1JN3PmTG3NmjUnm3btXFFfUbk4KrhFAM9F/Geiv257CeQXO6BQKLpw021jeWbSEABIPG8gQSklthBCY4ydNmbCd1asWGG8v3FjvK6uLjUmIN3tdP8zbUt3P9fHBhVDSQD05QfPJ/ik2wk5c+ZMraamJvbu/j0fmXzapPviQng24j8dBAR6ARoR+pinnR0KhWexhEClruOC4SPBuZ2zCLClRIXPj3nDRzolvD2cCphKV2ZAIHDe3b/7nzXf/c1v/JdddhlJtBDOZxmgv0GBQ4KhJAAy0degP/d/D9fUxIkT2datW6Mz5s6oHDW88T5CqcYFp16M+E+FAIhzjmF+H249YyrilgmWZwczAsdtObqyCjefPhmm4Hm/hkIxlCEArEQ2ziUjRsE0c7sOKZxU3JBhYP7IRtiSD7hqnJQQ1mlbZl2ocuHi5cu+8eCDD7bNnj072XOacck1w+1sE7lMDKwvrY8MlVE5lxl+pv2yCYQef3V1dXT27Nn4zW9+E/ruP//bfT7DMEynwc+A+a5poozvZyefiVEVlTCFyOtqYJTCtEx85owzMSoYclyYRTtahWJwolGKiG3hlklTcOnYCWiPxWDQzB41AufatQXHL8+dB4NSWEIOyGuPAHpMcGtETd0X39m7e8Vuujs8ffp0NzMgabd+BwUO6aWAAWOU+kF/1v17C/Lr8ZwPfehD2oMPPti2ePmyb9QEKxbHLFN4sbtfNtwZfGMgiFvPmIpIJAw9R1c+IwRR20ZtIIjbJp+pZv8KRR8hADiAOp8P35o5G4wStJoxGJSCEtJtUNIpBSEEJzs7sGz8RCwfdxpsOXB7cRBCCBeCMcZCYxvH/N+CsxZUNzU1RSZOnMiQPhagWPEAg5rBPjL3d90/3faMJ9b06dP13XR3+J29u1eMqKn7Ykxwa6AZfxdGKSLcxlemzcCy0yejNRIGIzRjaVF3EIpxDgrgt3MvxjC/P2/vgUKhOAUjBB22hQtHjMSTC6/AwpGj0RruRKdtwZYSlpSwpcSJSBgCwHc+PBf/N/dixLiNgTn3PwUhhMZsixu67vv37971+9/85jeh2bNnI6lSYC5GP939XPfJtn1QMKg/HPJ3/eez7u/epwAwceJEtnv37tjtX7u9+sf//rM9Pl0PxGxLDCTXfyoSgE4IuJS46aXnsHrvBwABKnWjR1GSmG0jZtsYHgjg3gsuxlVjxqPDtjxdi3woI6WEEBKUEqd4jPLSeBq3MVeHbeGX77yFl44dwWvHjkBnDD7GsGLcabhs1BgsHjUWYW4DGDyDuxDCrtANbX9L8w/HDRv+zUWLFtWtW7fORM+6/yLlfn9bCSPHxwYsg+UcSUeus/9cjX7q/66/+vp6cumll9JFixaxj/ztR/9YEaxYGLctOVBn/8mIRFlfnVI8e+gAfrajCesPH4TFbTgf38n4d1oBn4nbppyJkf6gMv4eRUoJLgQChgEdBBacvNRO24JUQsDT8ETN/yDTEBccJ+JxZymAEDT4/ACANsuEPsh+QymlZJTaVMLcte+DTy37/OVrQodDga1bt9qJXZINf2oXQaT5n2lbuvu9bR/QDNYRuhDG373d61rTokWLjHXr1rXuO37sB2PrG/6+0zJtSumASfnrDbfjWEjTIQA8cWAvNjcfhY9psKWEwShuPn0yRgVCMKVA3OP9yIciruH3GzoMUBxt68BP7n8ab729B1/420VYcP4MaFBCYCBgCQGdUmiUAlJCAl1dNwfrdSelFH5Np3HLin7tH7404e4f3902ceJE/+7du91iB24HQSC39sHZZv5DRgQMzrOl767/TIIgowiYOXOmFg6Ho2vWPbVs0rjTfsshfUJKRgZS8m2OcClBCRBiPWsZOe1IbTBCB+1JNRCREuCcw+9zDP/htnbc/eBzuPvB53Hs8HGAElDGsOi8s/ClG5dg4dzp0ECUEBgAJFujoXDNSSm5T9NJZ6TzmT/89n9vXLNmjf3GG2+IlpaW1LbBydXHchED2W73OIw+Hr4nGYznTbFc/z2EwMSJE1ltba314Ys/XOGu+0ctU3qxyU8h4VJCyO4hRowqw+81OBdgjCLItO6G/2AzWEUAfkNzRkcJRDsjoJQmhMBiLJo7AwwEbfE4NEYHVDEZRf/wsrBIjQe47LLL6p999tk40hv3VGHQ2xJALiJACQCPk8vsP1fXf/I2mvrY7Nmz6ZYtW8Kt4Y5HK4MVS2K2Jbxe518x+OGJzIsK3UCE2/jB/zyGe1a9gGMHXMOv92gryyiFxCkhsPDcs/DVm6/AojlnIS454pbtiDwlBAYljhCUzrJCAoJTYt8r6YRSSklAuE5IfMd7b193zpnTn5k+fXp1U1OThewxAGopIA3e+FULR6Gi/nu9PX36dJ1zHl756Orrpp0++Y9RzgUgPeUvlUBXJzC3wY+bP6wYfHAhQAhBhabDhsT6V5rw498/ifXP/xVabRV8upaxn7xLlxBo64SvMohv3nIlbvvIJWisqYIJgZhpKSEwyOBSwqAUPspw0opDSGegE5Co0HQYlCHCLUgJTwgBIQSv0A3WFou98sSzq65Y+ZuV8qWXXhKtra1uHEA6LwBStiHN/2y3UxkUIqD8v2bhKKnrf/fu3bFPf+nTNT//8d27mab5TcskXnH9S0gQOJH7qfX8Y4LDFgO3QIiiJ6mG/5lNTfjZ/Wvx9KvbISVQURWCbfO8OjsyRsG5QLwtjOGjG3D7iktw+4pL0VithMBgoatjJ9PQYsaw4dghvNR8CFw4M35LcIwLVWFJ41icVV0PAiDKbU+MHVwIuzJ9aiCQXQQUKh5ACQCP0V/Xf07Gv66ujv7N3/wNWbZsmXbTp26+P+QPLopzW1LqjWgpLiX8jEFK4Gg0gj98sAsW5zA5x3nDR2LeiJGo0nXEOO8aABQDk0yGf92rb0EIgUBF0HHj9rEjIyEAowwx0wLvjCohMIiQcIoMcSmx9vBevHTsMI7Ho/Az7dSARwhMzgECTKuqw9JR43FWdR06PZDiK6WUlFDOgPiufR98atmiy9eEQt1SAzPFAKjUwCQGy1VbKNe/+z9j5P9ll13me/bZZ1u8mPInAQQZw/F4HLe98iKeP3QAJ00TkAKQEgGfH7W6gZ+fewGWjz8NMS4gBny9sKFHsQ1/KoQQMEqVEBgkuMKfguBXu7bj1eNHUK0b0CiFSKQVEpxaNgSAiG2BEYovTp6BWbXDPCEChBAyoBskblnRL/2/z5325stvdpw4cULfvXu3uxSQb32AIecFGCxXayFn/xmFwPTp0/WpU6eG/+m737rkzDPOfNiW0ifhjZQ/LiX8lOGpg/vxmU0v4Lhpwk8pDEqBxLq/LSUszmEJjmXjTsO9c+d3e1zhbUpt+FNRQmBwIAEYhOJXu7bjtZajqNV9sKXIas0YIbClgC0lvjblHEypqnHKfpdbBEjJ/ZpO2yKda4eFKq+dOXOmf+vWrRy9z/6VCMDgEAAlcf3jVNR/Z2u488XaYGhup2VySrO05yoRAoCPEHTaNs5Y/SecNC1Uahp4Qs0n4xYLOdnZge/MmYtvzZiNdsvsFv2r8BblNvyp5CQE4hYYY1A6wFsIKRFgGra3teLH77yBCk0HzzE2hBGnPsT0mnp8ZcpMxITwSjMZEWQafa3pzSvPmzHryXnz5tVs3LjRRm7LAEM6K8Ajv1+fydX1n+v21NS/rvszZ85kbW1tsa3vvn1DRSA4N2zbwgvGH3B+REtK3LppAzpMExWaU6Ev3VnpVoSrClXgJ9u3Yu3B/QglxILCW0gpYdkclbqBgKbhqU1bcdUX7sKVd/wYazc1wRf0I1gRhBCiZMbfPS6bc+gaQ6iuCi1tnfjuT1finOv/BXfe+wha2jpR5fOBEKcWgcI7uJ6ZdUf2gYDkZbl4ohroW22t2NF2AkHGIDwwbgghJAfEtMlT//E3K39TW19fL+vq6tKN5dluZ1seHrQMdAGQC+l+xN5+7G5egIkTJzIppbV06fyaSadN+o0gUkopPHFySDgNe1piMTxz+AAY03q9KN0AoJOxKNYdPgBKaF4R4ori4hpYjVFU+3xYt/ktXPH5u3DlHf9ZVsOf6Th7CIEb/gXf+vVqAEClYZT9OBUOQkr4KMMbJ45jR1tr3w24BNYe3guTO56pco8clFIWtUxR6fPPXXTxVX+/Zs2ak7NmzXLLlWZK5QYyG/9chANy2O55BrIA6K/rP9M+PU6S2tpabNu2Lf7tf//p7wxNC9g2F15J+eNCQKcMf9j9HqJxE75EHndv2ELA7/Nj9b4PcDwWdTIHin60imwkG9Qqw4fWtjC+fe8aXP2Vn+LpjVs9Y/hTSRUCrW1h/Ot//gnLvvgfWPvKNvh1HZW6AZHwPinKgwSgEYL3O9ucNt19WJ+RiZoBeyMdnggEdCGEsCi37ca6YV948+2mxc8+++yJ6dOna8gwpiOzPRhSDGQBkA/ZvADu7bQqcObMmWzLli2R7bt2rqgJVlxucu7JLn+mELBl/oOrmw6oKB+phr+lrRN33vsIzrnhX/Cdnz4AAAjWVHjO8KeS7LmoGFmP9a/twNIv/geu+sJdeGrTNvg1TQkBD2D0c+XS8TqysgcAJkMIIVwIojMWmjBh0p33339/dSAQ4ClLAbksCwwpL4An0tf6QL6z/9RtOXkD6urqSCwW4z+956eNp42feK/lFKEiHkn570aMc0Dml9JHCEGM8x51/RWlIblDXwh62nr9oboqcMEH1Fq6lBKWZSMYCkACWLupCetefUs1HPII2eP9S/cahYZSyjos0672+8+fv3jhN999991/2LhxY+2zzz5r4lRmY+p/pNxOplDbPctAFACFjvpPrfHv3pazZs0ynn322ZZrr/vbfwxqWiAR9e+p74wkinnMGz4SFT4/7BzX9Agh4LaFC0aOQ6WuwxICKmS7NORu+AVsznt/QY/izvKDFUElBDyE1s/r3I0h8uJoQQlhcSFEbVXNZ5qb9/xkx44d7RMnTnRrAwA9RYC7DUgvDpDy2KBiqF5x2dZ/CBI5/3V1dR1vvt20eGRN3R0RbnvS9U8JgS055o9sRMgwYHKe04/KKIVpmrhkxCiENB2W8gIUnYyu/uv/Bd/96Uq0tHUiVFcFXWOweX6le70MFwJCCAQrgvAF/Vi7qQlX3vFjtTRQYighiAmOC4Y1osEXgJVoGpX3a3AbFzaMQo1h9Ok1igkhhFjchl/Xa79713//9vDhw6KysrI3z2+6x4bEUsCAOlj0ffbv3k5dC8p0n86cOZNu3bq1w2s5/+kQicCcxw/sw/UvrEOl4XOavmTY36AMbfEY5jeOxoPzF8LPKKRHFf1gQEqAcw6/T4cBmqE1b88OfYOV1M6DyiNQOriUqNR0rDqwG6sP7EZlHnUACJyxJqjr+JdpH0JId57r0XGjW22A8847r/bVV19N7RiYb6XAbLeRw3bPMZivsHyUW7fHE8Y/7MWc/3TQRJWu5eNOw7LxE3GyswOEOM2AkpUNJQQGpWg1Y2CU4FszZ6PO5wPHwFOCAwXOBQgBqnxDZ8bfG9k9AlsRSHgErDwbGCl6x/UCzB8+GlW6gXge1fw0QtFmmbiwYRTqfX7Pzf6TcWsDTD1j8j/df//9NZZlpQYEIofbg94LMGAOFIVd+0838ydwUv6oYRj2P3z3H+o/86kvvK1pWsC0THgl7S8TEo6a40LiP3dsw107tqEzGkHA5+9a1IoLDmGaWDh2Av5+xixcMnIUwrbtmVSewQRPDI4VuoEIt/GD/3kM96x6AccODL0Zf2+kegQWnnsWvnrzFVg05yzEJUfcslV54QIiAPgoxbYTLfjlriYAgI+yrj4AqbgtxNssEx+uG45bT58Gmsj/9/IvIoSwK3RDO9B89K6xw0d+I9Ex0PUCAD09AOm8AEDuHgHksN1TePn3SyWXVL7U27ksAXQLBly0aJG+bt26EweOH/v3xvqGb0Q8GPiXCfeMCzENTx/aj2cPHcCD+z5AnHNYnOPc4SNx4fCR+PzUs1Cp6ejwUB7vYCG1bO/6V5rw498/ifXP/xVabRV8uqYMfwa6hEBbJ3yVQXzzlitx20cuQWON6jNQaISUqNB0bDnRjN/ufhvtpgk/Y9BTll2EBGLchoDEh+qG47OnnwUQeNn134WUUmqaLrlltf3y1/816z/+9T+Om6apnThxwm0WlM7wA92FQbr/2W4jh+2eweu/oUshZv+9egBqa2vp8OHDxc2331x/x+e/+oau6zWWE/w3UL4nAIAlBKp1AwDQHI9BSgkhJWp9PvgoQ4Tb4FIq419AMtXrf/rV7ZASqKgKwVYu7ZxgjIJzgXhbWDUcKiJCSviZhnbLxAvHDuLFY4dwPB7tFgZvUIpp1XVYNHIsplXXwUrEFg2Ub15KaYc0XTvY0vzD3/z8F/+YlBaYbsZf6GZBnr/YB8rv2JfZv3u7t7S/rn3mz5/v27Bhw/F9x4/9+9j6hm92WpZNKRkQs/9UuJSQUsLHmPPhCIEtBCwheqh8Rd/xWqOewQIhAKNMdR4sMkJKaJTCTxmOx2PYdPwwbClB4RQXm1hZjVk1wwCSqDWCgWM0gC4vALhlnfzKF285a82a9e1+v1/fu3dvcsdAYIgGBA6E37JYs/9uQmD69Oka5zx838o/Xjp96tkPWZABKSUZaLP/VJLPvgH9QTyGMvylQbUgLj4SToqqKwSS4ZBOtVApPVX5Lx+EECKoG7S1s2NtQ2XV8kTL4HTLALkuAQwaL8BA+EX7s/afU+AfHAHAmpqaIq3hzue8nvanKB/K8JcHJQSKjwR6NAdys4cGASLANPr61i1Xff7Ttz0djUYrd+zYkZwWmM9yAHrZlopnRYDXf9l8Zv+ZtqUz/ECSB2DatGn6jh0N7Zu23HX5h8+Z/agpBQegjL+iC3ftPqQMf1nJRQi4WQMKhYsQggd0g3bEIptqA6HLpk+fHmxqauJI7/rPtByQ7n+229m2eYKBKAD6M/tPu/7vzv5PRMPPVvmDcyOW6em8f0XpcKr3CQQMHQTA+le2K8PvATIKgesvQ2NVJcK2BaGKCSmSkBLCRyl9/c0tV8+d/bm106Z18wIAucUBDCovgJcFQH9m/zm7/qdNm6bt2BHo2LTlV0s+fM7sR+NCCEIGdYEkRQ4k1+s3QHH0ZAdu//7/4pFnNgOEIFARUIbfA3QTAuEYGhpqcPedn8K182cDgKoqqOhCCMGDukHbe3oBssUBJN8edF6AgSYA8p390zTbU4P/1Oxf0UWq4XfK9j6Pux98DseaT8Af9INSMqC68w0FCCHQGEUsZkLaHAvOPQtfvkmVF1Z0J9ULMH26WdHU1GQjfQzAoPcCeFUAFGv2DzgCgACAs/avZv+KTIa/e71+t4iPwrsQQpyUtc6o6jOg6EEvXgDg1Gw/ddY/KL0AA0kA9DXtz/3fY/3f67N/lcJXfHIx/Kps78BDNRwqHxKnlsYknCwCLxUdy+AFcEVAtjiAQecF8M6vcopCzf6B9EF/QCLvv6nJ6PTi7J8ncm51SoFEfe644GCEevIHG4gowz80UEKgtHAp4aMURso8KsxtAN4wOHnEAvS2BDDgvQBe+D1SKeTsv4fhh8dn/24ZX1MKtMZiTiMOQtDg8yPKbdiqhG+/UIZ/aKKEQPEhAAJMw+FoBL/btTNReZTj3IYRuHz0OHApYHmkh0CWWAAguwgYVF4AL/wWqeQqAAZd5L/bq3v94YO4a/sbeKOlBRqj0CjFLadPwTenn4MA01QTnz7ChYBP15ThH8L0JgTCtgUAqphQnnApoRGCpw/ux+2vvIij0QiQuI4oZVg+fiJ+cd48VGgakOguWE7yzAjIpTjQgPQClPt3SKUYs//U+wkBsCPspdk/gdNv+663tuLfmt5A2DQR1PWuMyUaj2HB6HH43uxzMbt+GKKcKxGQI1wIUEIQ0nQcbu/A3SufVYZ/iJNJCCw4/2xnu2lBY6qqYC7YQqBKN/D9pjfwz69vQtDnh48xSCCRKivRbpuYUFGJLVdciwpdh5noN1BO8vQCFDIjwDMDjdfO7iE5+xdSIsg0rNm/F9c++yRCPj90QmAnucsMxtAS7sTFo8dhzaWLoSUGMK/9gF4iuWwvAKzasAW3f+e3aG4+CRbyK8OvSBICUUBKXLNwDu7+p5sxoqZSlRfOAS4lQkzDhqOHsfy5p8BBQAnpUVJYoxTt8TiWT5iIBy5agDi3gTJ/pzl4AYCeQYGDygtQbhGWTD6z/94eTxcQCABgjElgC86cdtbfU0qllKKsP4SE03LzSDSCz76yAUHDB5Yw/u7jEkCcc9SHKvDCwX348VvbEGAahEpJSwsXAkJKVOoG/JqGpzZtw5LP/wjXf/VnOBGOoqKuErrGYHPVnneow4WAEALBygD8FQE88uzrmHHDP+POe9egpa0TVYZPnSsZkHDqpcc4x/eb/op2y4JGaQ/jDzhegpBhYPWe9/HUwX3wMw28zN8npZRFbVtW+AIXbNqyeVFTU1P7tGnT3O6vae1Hmvu5PuZJvCQAcqW3HyCTx4BMmzZNa2pq6nx9+1+XVfgCF8S4Lcvt+udCwKAM//v+u2iNRmAwlvYCAgCTcwR8fvz2/Z04Hot2udkUDukM/1VfuAtX3vFjPP1KE/SgD5quwbLVYK7oDueOJygYCqClrRPf/ekDOOf6f8Gd9z6ihEAWdErRbpl4o7UFft3IWidDIwRCCLx87CgoIZ74HqUUkhAiz5x21jc/f+fnA84EsddlZ/d2JpGQ7XnZtpUcr/S6788XmGr0M75uQ0MDBWCNGT3hUo0QGRNcUMo8IYKshPHqDTfHtvyXjndwXf2VugEbEk9t2qbq9Sv6BBcCusbgr6tKCIGVuPvB51XnwQy4ef4+ShGxs7v13THLz8qebNUFpZTaAAzN+FBdsK6xqanpUHV1td7W1sbh2I9kQZDLsOs+Z0DgCeOXB7m6X3qos+rqarphw4bYv971r6dVhipWxAEQUv60P5cY5wB6l4WEEMQTYmFoDz3ZZ/xrNzXBF/QjWBGEEEIZf0XOOA2gOHSNIZQkBJRHID0ETixFLuNRV30T70Bs2+JBTWO3f/rvPgUgcs4552hI7/rvLfC8x2v39t59OeBC4qlfIgO9zf6z/e/aP/Gjhm+55bbbQro+zLYtTjwg30kiYOaC4SNAKe1a+08HoxQxy8SsunpU6QasIWrUlOFXlIK8hIDNMdR0AIETmzTMH8CnTp+CaDwGI8PsnhICk3PUBYK4+fTJMAX3Us0FZgKspqrq9jt/8u/jN2zYEK2urk4tIoek+0Duk9Fs28qOFw6qr5H/7v9s6X8UAKmtrSWapvFv3vnNkbd99o7XdU2rsbgtvSAAAABSwsc03PDieqzesxtVPh/sFMPlRtYySKy+9HLMH9GIMLeHVCqg25q32ucDh8S6Tdvws/ufVq5+RUnI2II4sTQQ4TY4F2DeWFUsCa5/3BYCy557Gi8c3If6UAXMhEdTwln7t6REOB7DqsuWYtnY8YhwG9RDY5eU0g5punawpflH7zW99U/f+973qp999lm3VXC2rIB0t5P/Z9qW+lhZ8MIvkMsMP922TOl/Pcr/zp8/33jxxReP7zl84B/HjRj1/U7LtCmlXol/gABgEIJOy8LsJ1ZhT2cHqjQDjJKuCyzOOSLxGL734bn4p+mz0G6Z0LyjoIuKW73Pp2vwEYZ1m9/Cf/7vE3jmNWX4FaWnhxAY04Dbrr0Y3/z0VQgyDZ2W6UTID5Hrk0uJAGPY0nIc/7zlNaw/uA8Bnx+AM3ZFLAshw8A/Tp+Fr581E7b0XgyTlFIamk7iptm66MqLz9y5ZWdMSklOnDiRrh5Ab0WCkHLbsymB5RYA+ab2pf7vNe8fAJk+fTptamqKtIbDT1YHg5dGHfe/Z9b/gcQZICU6bRtfeHUjVu/dDSEcFQ1CMCIQxN3nX4TFo8cOmXLAPcr2nmzHPQ89jx/87nHEOyIIVFcow68oG64QiFs27BPtWHDJ3+Brn1iKBecPvfLCbhXTKLfxg6Y38bv3nVLANheYVV+Pr589CwsaR3u9iqnQQPgbTW8uP2/Wh56eOnVq9TvvvJOLF2DAFgYq9y/RV/d/JqOfuo1OmzaN7dixo/P17X+9etZZsx6Mc1vAo7EPEoBOCBiheOrgPrzWfBQ6ZU4p4ElT0BgIIsptz6nnQtNbvX5fdQiMUXCuDL+i/BBCoGkMne1hEAIsPu/sIdlnwC0HHGAamuMxSCkhpESd3w+DULRZptcCALshhOAh3WDtscimr37rjiWvr31da2pqEnCG5nRGvzcvgOcLA3nGDZ4g17X/bI+nS/0zx4yecCkDpPBQ6l8qBIAlJSzJceWY8bhyzPiux0zBva6e+02y4Q9BT1uvP1RXBS64Mv4KzyClhGXZCIYCkADWbmrCulffGnINhxghEADabRNVuu4MxITAEgJxyT1t/AEnJdAEpK4ZHxpVOWpkIiXQSEkJRNLt1JS/3u57jnJak0IE/wGnZvM91v6rq6tpW1sb//F//3jEbZ+94xVN04bZXgr+ywJPqGf3QHNNsxmIqA59isGE6jzY0woOFKSUdkDTyeGW5v944uHV/3LvvfdWvf766zZOeQBS/xeqPHBZBjavCoB8g//SCoL58+frL7744vHdB/f/04TG0d/zWvDfUEcZfsVgRgmBgUdyMODlyy6b+tZrb5kAkCUYEFm2IeW255YBvCQA+pr612Pm7/656/+t4fBTXg3+G4pICXDO4fcpw68Y/CghMODoLRgQyO4BGDApgeUSAPnO/t3bOaX9YYAF/w0l3DzpINOU4VcMKdILgcVYNHcGGAja4nHVgtgD9BIM2JeUQM8uA3jFHd7bGZ9NCKTdNpCC/4YCXAgQAJWGgQi38a1fr8Y9q17AsQPJwX0CdqKAiEIx2HDTVYMVwW7BggvPPQtfvfkKLJpzFuKSI27Zqs9AGckQDKi3tbWlGuhMQX59DQYsedBgOc6wQqX+Jd/u9jeQg/8GG26jngpNhw2J9a804ce/fxLrn/8rtNoq+HRNzfgVQ5Iuj0BbJ3yVQXzzlitx20cuQWONajhUbpKDAd9reuufv/GNb1QnggEL6QUo+zKA1wRAf4P/CADMnz/f2LBhw/EPjhz8xwkerPw3FEg1/M9sasLP7l+Lp1/dDimBiqpQon66MvyKoY1b0yLeFu5RXlgJgfKQHAx48dy5U7Zs2WJVV1eThBcgeTkASfeBzAIAvWzLdL+oeEEA9DX4L+3sHwCdPn06+fCHP2zf9bOfPVodCl0cU8F/JSOT4Vf1+hWKzBACMMoy9hlQQqAsCA2Eb393+0dnTzvn8WnTplXs2LGDo6cAyOYJQJr/mbalPlZ0Sr0mnu+Zm272n7q9G9XV1WhqarImT588xu/zzbOdzWrtv8ioDn0KRd+REqoFsccQgguDMX3UyHELpZR2Iq4M6DkZRdL2fCmrmiv1mxfD/d/tb/78+XqS+/+7nZYpy+3+F1L2kHSUkAFVICMTasavUBSe3joPKo9A8XGXAWKWeeyiOeee/eabb5pplgGA3MoEI+k+MmzLdL9olFsAFDr3n06fPp3MmDGD/+yee9aU2/0vpAQhBH7GwFI+ekxw2AnjORAvX2X4FYrik5MQiFtgjGGg6wCPVg8UGgjf+vbWj82ZPvuxqVOnVr7zzjuDJhiwlN9zvtH/uQb/ESQCABPqzP7BT34w9o4vfm0b0zTNtq2SR/+7v5yfMUACb5w8jt0dbTAohYDTH3vusEYM8/m7hICXemNnQ0oJmwtU+3zgkFi3aRt+dv/TyvArFEWkNyEQ4XZXjY2BhiUEdEqd9uYJb2mcc+czl3lcFILbFbpPO3LixN0ja2u/ePHFF9du2LAhtUPggK0JUE4BkM74J9/ON/iPzJs3z9i4cWNzOd3/MnEwOqXY0daKdUf2Y0dbK8xEHrz7+DBfABcNH4WLh49GlW4gxm1PiwC3bK9P1+AjDOs2v4X//N8n8MxryvArFKWihxAY04Dbrr0Y3/z0VQgyDZ2WCQkMiKqCPNHWPMg0xAXHiXjcWRolBA0+PwCUvYNgjssA6bIB3PtI2QfoXQyku18UvCYAUrflKgIoAEyfPp2W0/0v4XTEggR+/f5b+EvrMVAQ+JkGmvLpLSEQ4xxVhoFPTTwTs2sb0GlbnhMBPer1n2zHPQ89jx/87nHEOyIIVFcow69QlBhXCMQtG/aJdiy45G/wtU8sxYLzB0Z5YS4lKjUdHbaFX77zFl46dgSvHTsCnTH4GMOKcafhslFjsHjUWIS5E8pdxpFx0C4DeEEAFGT2nyj+Y//gJz8YUw73vzuzF1Li3vd34PXWY6jWDcjEtlQInEDAuHAq331+0nTMqK1HXAjPpCxwLuAztLT1+n3Voa78ZYVCUR4IATRNQ2dHJwwKLD7vbNxx4xIsPG86AIq4MDOLcwmAUOevhHApEdI0PH/kEH647Q08s38PqGHAR1nXOBqNx1ARCOLr02bgq9NmgFGn1XA5REDqMsCFF15Yt3HjRhPpjf6AqglQqu+zUO7/jI1/yu3+dxXtwwd2Y+Xe99DgC8CSvRtHSghMzuHXNHx3+rkIaRp4UhvgckEIEKAamjvD+MUD6/Grlc+l1OvnUJlICoUXkIgLHTApEI4ChOBD552NL924GAvnTkNlMPMzCQAkZtilwB0nNxw9jEXrHoMpJeoMH2wpu6U2apSCS4n2cCeuPWMqHpq/EFFuoRwSoJdlAHcpAEjv8vf0MoCXquNlEwm9PY+0tbXZN954Y1VVRfVCDjBCSMmKyks4a/4t8Rheaj6Eat2AnYPxBxzvgI8xtFsmNhw7iGvHTESHbZU1+IUQwLIFfv7gWvzzfz8E60QHfPVVqKivgs1VvX6FwitQImGZDAsnnsBFE08CXAMF0BH+AO8+8hjOOPk3OPes02EK3n15kVDAjoAPvwC8YQ6IsIvuCZAAGIDWeBzf3boFXEjU+fwwRc/xxErETNVUVGLN3t1Yve8DXDlmHMwyBEwTQojFbeGjrPbX9/3PRXOmz36ssbGxsq2tzVVOyeFdqUY7eVtvj/d46yyPFYRyC4BcMgOyeQUIAFRXV5Ompibr2k9emyj+I4ESFv8RUiLIGJ5sPoTjsSiqdAM8j+mxkBJ+yvDisUO4qGEUKnS9rF4AKQFGCZbOm4G2zgj+d81LOLT/KOyQ6tanUHgJRoCoSbFk4kl8deluoMMAmASoE4uE8GqgyYIv9YlEB2JHgXO+Az7iPEAUv1mqLQSqdQO/2rkNz+3fg9qKSphZJhMSgBACGmX4/GsbsWjUR6FTAluW3g8gBBeG7tPHjh6/QEq56sILL3RLz6cbCHMx3PmKgaJQCiPZ15l9b6/TxfTp0zUA4U99/PaPBTWN2JZll3LtX6cUJ00TLzUfgp9padf8c3mN5ngULx8/DD9leb9GoSGEYNr4Ufj+bdfiL3/6Dr715RtQX12BcGs7LJt7NrhIoRhqEEoQsTVYHQaiYR1Wpw6rXYPdoUGgGvA1pPkbBgSGA1qW9YECIgHohCBsW3j+6CEYhpFT4LAAYDCGsGliw5HD0Eh5xkZCKDMBVFZUXfeZL31m9MaNG+PV1dXpJqhIuZ/pvyfwyijeL/c/Y0xKKamuadVw9G/JkUBBZu22h2bWUdtCuxlHfXUFvnPrMry58l/xrb9zhEAkHHUikQdg3rFCMRgghEDTGKRpIRqLQdcAjUroiT+NSlBwQNrp/4QN5LhUWQh0StFhWXj52BEwpuXsRdQIQWc8ho3HjoARUlbvIyEkeNr40ypSNyf9782rnfZl+31gfcRro3ef3P8bNmywZ82aVVdZUXWjBaBclf9oAX7HQrxGoSCEQGMMls27CYFtD3wP11z2YcQ6o4h0REEpVR4BhaJEJF+XJ5tPYtjoBsyfPRWImZ5LI05Gwgl69jOWlxGXAJB4XrkghBDTMu2gpgU/+refvA5Ae8Lz3LVLod6ql/sFpdijdq7R/32msbGRAoj8+r7/uchgrNritih15T/AWce3JO/3h0oXEFNukgectngctdUhrPzRF/DkL7+OJXPPRjwSQ6QzooSAQlFEkq/DcGs76qsr8K0vrcDWVd/BogtnApGo568/AvTJkGuEwijzZyNOZDmpqapZcOONN1a1trZyJLWhR/qJaur2dP/LhhfOllwVTzrvABk2bBiVUlpjR49fYDCmC1H6xHQuJSo0HeODlU7Fvz7oDyklDEpxekU1bA+kAaaDEAJdY7A4h8k5Lp87A4/94ut4/Odfw5K505UQUCiKQFrD/3fX482V/4rvfPYjqA/piEfi8HIzAAIgxjmG+QNYPu40xOIxp/RvDs+LC4GAz8BNE8+AJcoaf0RtSPh9vnmTZk0atWPHDqu6ujp1n1zsV18eLwpeGqWzuf/TrrFUV1eTjRs3mp/50mdGV1ZUXWfCCdYoydEmHZCUEgajWNI4vk8/IyUEEc4xrboOs2qHIZ6asuMxSKJcZ4dlImbbSggoFEUgq+G/9RrUV1egPR6GJQGaWmrUgxBCIKTAosYxqPEHcoqZooSAcxsLG8eg3u+HVcbJESGE2JZlBzWNfOrjt38MQEfSMkAhXfclWwYo5uhcKPd/b0EVYvT4iUFCSLBcoSGnDHgtzqquQzjPPH4n90Ni0chxADBgUuwYpaBKCCgUBSUnw2/GYdkc2gDqAsgIQdi2sWT0WHzl7JloD3dmbGdMkAj+s21UGgbunTsfOiEod93RxMjMdE2rvvPOO5ML07n/SdKu6YICS7rG3xvlHpX7EjHZRUJ9ddx84ydv8mta0LLMkqX/9SBhtJc2jodGKWwpehUBBIBOKNosEx+qG45pVbWIeXz2nw4lBBSK/pO/4R9Y4wTgjBVh28IdU8/GtZOmoMOMw0p0/nM7AmqEOFUAbRv1hoHfzr0EFZqOmAfKpBNC3HTAmw62Hhy1ceNGM5EO2G035FbjJtvjJaHchYBccgmWSBtYceedd1Jd06ppuZUUIYgm3PhfPGMG/vvdbYhLC0FNB+AECbpVHkhif1sINJtRnDdsJD57+lk5lQ72Mq5x77BMEEJw+dwZWDh3Op7Z1ISf3b+2q2WwvyIAyIHj6VAoio3b2CfW2em0+r31qq5WvyYE2s04GKXQyhgJXwgIAEmcBmkPXbwQq/d+gDteexknLBMd8ZgTx0AoagwDi8eOxz3nX4RhPh8inJe9NbCLBEAp9Y8cMy4EoA2nAgH7WhQoHanP6+vr9PomxSCbukmngrJFT6b9SzT/EbfecWvlT/7jF28ahlFvlbD5TybcgMC32lrx5KG92NHeCkinmIVr8CSAGLcxzBfAhcMbsaRxPFhC9XrjFC8MPBEQWaHpsCHxzKYm/Ncf1mL9a2+BaAx+vwGbq6qCiqELYxRCSMQiMQxvqMXtKy7F7Ssu6TL8MdPK6CYHAEgbUvPD2PEL6Nt/6BT5kTnU9icaEG+Gdfbfw5z2BRA75mwrEe5EyM8Y2i0LG48ewavHjsBgDDpjuOm0SRgRCIIQJ3jQK8YfAIQQdlA32L4jh753WuPob82bN69h48aNFk7V+0/XJhgp2zzRG6BUv3h/3B1pnyulJADEyDHjQpRSv1dMCEtUuzqzqhZTq2rxVlsL1h7ej33hduiJKoGMEiwdNR7zh49CveFHhNuDzvgD6T0Cl8+dgVUbtuD27/wWzc0nwUJ+VV5YMeRglEICiHREASlxzcI5uPufbsaImspBNePPhDvWRWwbfsZw5ZhxuHLMuK7HLSlgJcYELxl/FwoQNw5g3bp12db1k3sEJMcHAEWa1eeDV5YAgJ7rJu795GCKrn3OOuss7ZVXXmn99Cc+faNf04IRy7RL2f0vG85ygA1CgBk1wzC1qhadtgUKkiiGAdToPsQF72r8471TvHAkCwFKCK6dPxvnPzIZd698tqu98Kkug0oIKAYvXYY/EROzZO7Z+NKNS7Dg/LMhAbTF49DY4DX8qdCE57PDtrqWSQHne3IGe++NjG4cQHVVzY17j+39j1deeaU94ZHuralPLgNbNlFQcMFQDIOZ7y+WS5Rk2tf0yvp/OtxAvrBtgSbc4Mm/XKdtOaV0Pahui0WyEKivCuE7t16D21dcirsffE4JAcWgpqfhn44v3bgEC+dOhwbHawgAujY0DH8yBI7ndCCNhW4cwPjTJwcAnJRSMvSc4aeSr3Evuoeg1EGVufzCya6StM+trq4mr7zySnzvsb2jq6tqbnTy/8tT/rc3XCFgSwme+BNSgg7yWX82GKUp5YWvSfQZuL5bw6GBGumsKC1Z18jLDKMUlFJEOiOIR2JYMnc6Hv/51/DYL76Oy+fOQMy2u5bIvPoZFN0hhBDLMm2/pgVvvvGTNwHoOOuss1LLAqcNWk95vOyUoxtgum3Zvqgez02s/8vxY8cHvLT+n43Us2Gok77PgBICivxgjCISjoJz4aliOLkafkqISo0doCTHAeT4lFxj4bKdyAU9yQfCmddDHCTUVuctn7rtZr+mBW27dO1/FYVFCQFFX6GUInKiA4sumIHqygCi4Ri0MnenVIZ/aODGAdRU1954MnZy3CuvvBKrqqpK/kHTTXI9N1ctdAxAvsol13TBbgghCAAhJefU8QgowzDASRYCMWF1CYF0MQI+Xcupl7hi8MIYhRmJ4aqFc/Dof/4d1r22HTf+/S9wvDOCYNAPXuKWIIQQgGRe4++0LSeinVIMmNJ9iqwQAFJK3zPPPRPDqcl0JkOfGvmfLl6g5HEAXpSg6WIAuq3/Hzx40Pryl79cU11VOzfRO8+Ln0PRB7J7BG5AfXUFIuGoE0BZ5tmeojwwRhGLmQhVBrHy378ACWDRuWfjvcd/jGUXz0akpQ26XpqEILdBlm3ZsCJxLD5fzfiHCjbnwmBM//3/3H8hgNjIkSMzlQZOV+/GE5S6HXC6bZnW/9O+npSSHDhwwG4Jt9T6DN+FHE5QRn8PVOEt0guBZdj2wPdwzWUfRqwzikhHVJUXHmJQSmFbNnQAf/r+52DoGgQX4FygpiKIh3/0RSxbcj46m0+AFXHJKPn87GztQG0ogJX/+SWs/eU3lOEfAhBCiM1tYTDmGz6icR6AWH19fbYfOrU2QKbHsm3L5bG88MqZmTzr7+0/AGDyGZM1KWW0BMemKCPJA21bPI7a6hBW/ugLePKXX8eSuWerPgNDCEIIJBcgXOCR//oqLp87AxISjNFERT2n8uRDP7oDyy+fi0hHGJCyoMGBaev1f3kFtj7yA1w7fzbCtqUM/xCBEKeuC6HETtMYKPV2uvtlp5BnaH/z/7O6/l0SAYAdN9/8mZtDul5pqQDAIYHrarU4h8m5ajg0BKGUIhaJYtVPv4Il50+HZXfvDU8TxWMoIVj1H1/C4//1NcC2wW3e7+WiXhv1VIW60vnU+Vd4ZMqfFyCEMAtAbVXNzYlAwHhVVVW2ZK/kOAD3fy4ioWj2rZylgDM9nu0LIYkAQMmFLaACAIcc7m/dW8OhQEUQBFDBgoMEXdfQeewErr1qHpbOnQHL5mmL5jj59M7vfsVF52D1T7+KZV/+T8S4iUCi90Q+uAY9Zlq9NupRhr/wSABcCvgoOxU9RwgsIZyy6mUe+xPHZCQCAVPtWGoZ4NT/ZR+cyn3GpvvCMu5bVVVF9u/fb3/5y1+uqaqsvsArAYASgC0EbOHUr+ZSekalDlZUC+KhA2MMnc0nsOzy87Hy3z4Pm4te0/3cYlNLzp+ONf/1NdSF/AhHYjl7AoZCa14vIwHYUkCnFFWagXbLwgnTRJtlojUWg04pKjUdIlFcrVxkCQRMJpcYt/560PtEMT0AfSl6kKlaUtf2Q4cO2c3tzfV+X2BeuQMAJSQICAxKobPuX2VMcNhCdFUCVBSHXFsQK4/AwMRJ94vimiXn46G7vgRCEr1Xc7iudI2BC4El55+N9x77MW7+9r1Y89QmVDTUwrLSd8wjBGCU5TTjHyr1+kuNhPMbhzQDR6IR3PPu27j3vXdgCQGNEpi2jb+pb8DfTZuBhaPGgBHS1VOllCQCAXnA8PlGNo66AMCD9fX1Veg+mU2d2Lr3ZZrHSk6hBEB/1Us+wRLyjDPOcAMA9Tzft2BwKeFnDFICRyIR/OGDXV3r0+cNH4l5I0aiStcR4zxjbWNF/hBCYHMBSrobgd6EwNOvboeUQEVVCLbNVZ+BAYCb7ldZGcQf/+3zYJQ4gX55eHQYpd0yBK6TEmvWvoJgfQ1ESr8Jxpx9w63teRt+nijvTeGdNeqBiJASOqWwhcB3tv4Fv3nvHRzs6IBf1xNBdxIUBOsOH8Bzhw/issbR+NrZ52BB42i0Wya0Env73EBAIYRIdAbsegi9eLSRWSTk+hr9xhPd83BK9GWDJDoAnvj0LZ/9RkjXKzvL1AFQAqjQNByPx3HbKy/i+UMHcNI0ASkAKRHw+VGrG/j5uRdg+fjTEOMCAoOv3W+pIQAszlGlG7CkQNS2wQjtVlclkxBY/0oTfvz7J7H++b9Cq63qKiakhIA3SU338xkaOBd9CuZLzRC4nhCsXv86NJ8OXde6BvHIyU74KoO48+9uwG0fuQSNNbkZfgKgUtO7zkk90fhHkR9Op1QCKSVufOk5rNn9HoL+AGr8AXDpeu6ci71KNyABrD10AM8fOYSHLlmMK8eMK7knwA0ErKut/0RzZ/N/vfLKKyerqqpYe3t7unX/rqchu/EvWUGgcvQCyBYhmW45oGspwA0AlIQYWV6nqHApYRCKx/bvw9mPPIA1+/fClBI1Ph9qAkHUBkPQKEWrGcf1G57BR154BjFuAyouoF/YQsDPNPx663Z8+fkNaIvHUaUb0JkzW0i1491iBCwLS86fgTX//f/wL1/9GOqqQ6q8sIehlMCyLCA53U/KfkXy98gQ+PnX0FhXCSElIuEo4pEYFs+biUd/8nf49q3LUFcdyrrG7zb1qtR0BJiGpz7Yg+sffQrtpqkEQF+REgaluHHj81iz533UVVSCEQJbih5ZAO73X+PzQWMMK55/Gs8fOYQAY+WKCfCFO1t6W+PP1fOd6wfo98BVLAGQba0/WfnkXRnpzjvvpISxsrj+BQA/pei0LXxq0/NoMU1UaVriJJVdQYBSSuiModLwYdWunfj5O9sR0nS1/txPCIB208TPXtyED933Z3znldfQGo31LgQoRYdpAgC++9nlePMB1WfAqxBCAAkENYY1//XVtOl+/XptAkgpccWF52B84zDET7Tj8gtm4PGffxVP/PLrWDTnLLTF44lAw9wM/9WrHsWVD6/B+n374Gda+UO7ByDOkqqGF44cwiN73kd1IAgzsXyaDVs4gYKm4Pj37W8CKFNUuJSYMH6qAUAmmtX1h5INRIX4rgp1sOlyI7teu6qqirz22mux/c37x9ZV1368HC2AKQBLSty6aQM6TBMVmgY7w8xeSgkuBKpCFfjJ9q1Ye3A/QppW1ojVwYBGCLRgEC3RGL794ibMvu9PuQkBRiEl0B5XDYe8jKFriB5pwTc+dTWWnD8dcdNOm+7XF6SUgJSImzYWffE/wEwbT//2X/Doz7+Gy+fORDRRvU/XcjP8Vz28BstWPYanPtgLv66j2jAg1PXdJyicwf6ut7Y5gdN5fI+2EKjw+fHCof144chhZ7JVot+BEEJMy7RDhhG65ZbPfgJAx9lnn83Qe8R/ri79og5G5YgB6E91JBkKhjQA/gIeT25vDMAgBEeiUTxz+AAY03q92CUcg3UiGsG6wwewePRYSGlDNQPpO27Kpc4oakJBtCaEwK+3bcdnZ5yN22ZOx8hgEKYUiKXECBACaFpuDYf8hq5iBEqMpmloP9aKZddchL/72CJYNoehF1bjU0oRjkdx2/WX4tqL/gYEyNqoJ3mNn0uJpz7Yg59veRPr9+6HJSWqfAYogBjnStz3ES4lQkzDkwf34fnDBxDQjby/S5KYiP1w+5s4v2EEGNJXlisihFIaBCATS9VAd693qsFP3VaWjIBy9AJIJZffiSTcKuzZDc+GRdI3XCq4ENApwx92v4do3IQvx3U+Wwj4fX6s3vcBjseiTuZA0Y928CNleiGQi0dAtSD2HkxjCJ9ox7Il5+HhH30JoYAPGqMF/e4JIY6xqQzguov+BpEsZXuzzvj37EPA0FHtM8qehz4YkIkMipePHYVl29D68JsLKaFrOra0NjtenDLU/uC23QF0xaolk6lAULrHC7EtZ7xSISVbGWACACNGjKAAor/7n/svNBjzWdwuy1KbKQRsmf9bx3JYz1LkTz5CIHWgzl8IlOlDDnJ0jSHaFsYl55+Nh+/6slMiTRS+wieXEnHBwYVAZ4ayvRKOQVKGv/QENa1f02ApJQJMczIJCnlgvUAIIRxAVXX1hX/7ub+tPXjwoJVp15T/qbdLTrkEQK5fQNdjiU5LsVGNoy/yaZrBORflKAIU4xyQ+aX0EUIQ4xwiz+cpcqdXIRCLoVLTuyKIk8lVCEgJ1YK4wFBKYZo2dJ3ie19Y4eT6S1HQBj6AY1RM4dQOJYn37fa4hFNohhAYjGGtMvwlxxai34a7TL8NtQH4DP+FAX+g/tChQ1ZlZWVfB4qSmoj+jmaFcl2kBgBm+hII546bpdS233Ufzhs+EhU+P+wcTzRCCDi3ccHwkajUdVgqE6CopBUCL72Cc353P1a/9z5CTMtYQjSjEHjgX3Hn390AwMkVV+WFC8OpdD8ba372dcydMQk8EX1faEyR3gOXfL5U6wba4iY+9thTWPrQGqxVhr+k+Arwu+uEgpRhmuXkp8tItC1q4ZRdzXUJPJeXLwqlHsX6GgBIAGDFihWUEhIs7CHlBiUEtuSYP7IRIcOAyXlOXx6jFKZp4pIRoxDSdFjKC1ASkgf22mAAbaaJjz72JJY+9Aie+mAPAnkIgbrqEL596zI8+pO/w+J5M1WfgQLQPd3va1hy/tlOul8RPCxxwXsI9uTzo0o30BqN4buvbsas3/8Rq957HxV+H6qU4S8JLJHGd/PpkzG6sgoxzvMeIxmliFsmbj1jKob5fYj34TX6CyGETpww0Y+eRX+y3R6SSwB5UVlZSV577bVYZUPlmNqaurKkABIAlnAKVfzy3HmwBe8qLpIJgzK0x2K4dOwE3DJpCiK2VfJSlUMd17WrMwa/rmPtnn1YtuoxXPXwmpyFgM0F2uJxLJpzFp745dfx+M+/qhoO9ZNipvu5SJwy/l3h2GkM/3deeQ2z7/sT7tzwshMzYhhOGq8y/CWBwFlaHRUM4TNnnAnTMvO6ngic2KxRFZX47OQzYQnRY4mnmHSlAup66FO33v4JAO3Tpk1LzrBLTvvLacm7VBTzW8roxs/zeV1KyWf4GMqQAuhCE1Wplo87DcvGT8TJzg6nT31CCLh/lDgNglrNGBgl+NbM2ajz+cBRZrk3hJGJqO4qn4GAoeOpPIWArjF0WCaito3L585UnQf7QSnS/YBEh86E8c9m+L/94ia0RmOoCQXTBosqio/rBbht8pmoDQQTZb5zGy11xhCJhHHrGVPRGAj2yYNQIAhjzJft8aT/Er17AYqeCVCOOgDZIv5Tt3Xb3nqiVQDgRTqunJAgiHEb/zf3YsysqcNdO7ahPRJGwOfv+mBxbkOYJhaOnYC/nzELF44YWZZuVYqeuIN7tc+pJf7Unn1Yv3c/Fowfiztmn4NFE8aDEeLkhgPdfjPVebD/pKb7MerUfi9GxL8lBSCdtrJ+TUOIaDgSieCerU349bbtOHSyHX6fgZpQEFw67bwV5cGdxQ/z+/HbuRfjoxueQYxzBDUtY3Cgc20StEbCWHb6ZHxl2gxEuF1eES5lcpvJbEkNZcn7T6VczYDS5UXSlNupyDNOP8NXzva/gHOAAgBJzOzPbRiOZw8dwIP7PkCcc1ic49LG0bhw+Eh8fupZqNR0Zfw9iBICpUfXGMJp0v0KHfHPpUSM2055WWX4BwyUEEQ5x9Vjx+OBixfi1pdfwLFoFH5Ng187ZaoInN+43TIBCVx72iT84cJLwQgpe4wVIcS/YsUKum/fvuTD7a0roEjZr2TioD8CoK/uiXyXADBt2jTttddeO3HrZz739ZCuh8rVBdDFPcA2y8TiUWOxeNRYfH36rC43c63PBx9liHBbGX+PUwoh4K8IABJDuqpgunQ/m/OCR/zbUiJiWwnDT5XhH2AwQtBhW7hqzHhsXbYC9+x8G795720c7OhAcvE8nWlY0jgGX5o2HZeNGgNLCJhCOGWEywAhhJkAamvqPl7ZUPmT1x58rb2yspJ2dHRk6gKY91v047kZKZcRTZ3l5xIYIQml/l72LSk6pehIlBGt0nXnwAiBLQTaEtWolPEfGBRLCPzXH9Zi/WtvgWgMfr8Bmw+98sJuuh8VomjpfhIJTwshqNINZfgHMK4IqPP5cefM2fjM5Kn43/ffhcmdOg1xbmNOwwhcMWY8KICwbQGElM34J0MI8Ukp3UrEXZuR3niXdfYPlHcJIP9SzbIPJfiKDCPEMfruoJ5wQZWjFKWi/xRaCFw+dwZWbdiC27/zWzQ3nwQL+YdUn4HkdL8H7vpKV7pfISP+RaKUrEYpDkfC+M227bhnqzL8AxlGCCwhEJM2hvkC+MezZ/XYJ8wtCAlPTbISRQHTPoTejbwrCEpGsQRAoaIXCdBVW5mAEM9aVe+cgopCUCghQAnBtfNn4/xHJuPulc8OuYZDhq6hff9R/NM/3tyV7uczCjfscCnBCEFzNIZfvLkV927bjoPK8A8KCACNUFhSIGadiq2TcOIFGCFgHht4hRC0IlTRm0dbIP3sHzncz2dbr5RtHT1BuoC/HqkRCQEgTNOMlurAFAqgcEKgvio05DoP6npx0/2sRC/4tXv24hNPrEVzOAq/oSvDP8ggwICon5KwwHLds+ui6H1ZO53xLznlrASYySPQo1PSoUOHrBWfXlFXV1t7AYdTeKGYB6lQpOJ2h6vuQx0BRumQ6zzIGENn84lEut8dBe/u5xr/dXv24drVj6HdtFAbDKTt/qhQlAKL28Kg1Pe7394/D0CsoaGBIfcc/7KIgUI2LOjvlZ02LqCyshKHDx+2qnxVdX5fYF5igcX7clAxKMlVCMhEf3KXodSCmDEKMxLFNUvOd9L9CClodz8upWP89+7DNasfBSEEfk2DpQy/okwQQgjnXPg0zRg3Ztw8ANGGhoZCX8QFHxSKbUh7EwrJRj9bUCAhlHAhhFoCUHiCbEJg7Qd7YDAGLRHIlGyUBrsQYIwiFjMRqgzij//2eTBKAFm4XH87seb/yqHDWPbwGlBKoTGmqvcpyo57rVqWGQVAE0vXQG4V/3p4votxjKl4aSad9gNLKQkAcM4JvHW8CkUPIbB2zz4sfWgNPvbYU2iLm6jWjbRu6XyEwEApL0wphW3Z0AH86fufg8/QwHnh6rILKUHhfOffevlVWELAYAxCGX+Fl0gfrF5y454LpRpZkj9wPkrHM1+UQpENVwhU+QxU+H1Y9d77mPX7P+K7r252Gsz0SQjcgPrqCkTCURBCitIpr1AQQiC5AOECj/zXV3H53BmQUhbsmN3Ibwng+kefxPo9e1Hp96v22grPQQnJR5H2LSW+QHh3RPGoYlIossGldApDGU7DmTs3vIzZ9/0J33nltT4IgWXY9sD3cM1lH0asM4pIR9SzDYcopYhFolj1069gyfnTC+q5kHAa+YQtC9c/9iRWvbMTtYGAivJXDETKavBTKcZIkktuf95fQCQSUVe7YsDApYTOKGpCQbRGY/j2i5vyFgJt8Thqq0NY+aMv4Mlffh1L5p7tuc6DhBD4DB2R4ydx7eLzsHTujIIX+jE5h04pfvbGVqxq2oH6igo181d4FiFEah5/OpJj35IhaZ5TqLo6PSj/CNKdTMEScuKEiZ4qA6xQ9EZyC9q+CAFdY7A4h8k5Lp87w1MtiF2hwoVA+4FjWHb5+Xjg3z4PmwtoBVyqsISAjzE8vWcf7nrtdVRVVsDkZW0IqlBkhVLqnz9/fraLIN/+OEWjXAIgZy/AmWeeqQHo+MxtX/h4hWEETcu0VR0AxUCiv0KAEIIOy0TMtssuBJI9FOHWdtRWhvDtb9yEh390BzRGwSgpeLrf03v2YfnqRxHjTq1/FfKn8CJuQ6C62vqbJkydMOb111+PVVZWZtwd6ePhcvEeFIxyVwJMxv3waVsBM8Z8UB4AxQBGJnrT64zCnyQEfr1tOz4742zcNnM6RgaDMKVAzLbBCIVrS8vdgpgQAkYpYqaFWGcnho9uwO23XoXbV1yGxurKxOcrbK4/AbB2z15cu/qxLuGhIv4VAwA/dVJfSCKLLVvt/7Ke0F4RANmMv4MHGwG5kd/ukMcoVQpF0SsDSQhkMvy3rbgUo6qrAAA252AFrFkgErn+UdvGTU88DQHAr3L9FQlESpEtSojXxl3P2apM9EUA5BuQkGsRhKy5kyJRD8ALuCdfpaZ3224KjrgQnupOpfAupRAC/oqAU6C8D8aTUYq4ZafM+C9FY3UVTAjELRuGphW8rS/giOubnnwanfE4/LqujL+i69wIaBpYkjmJCQ5bCE+0A86Ce3C9nci9eQUK6jUotQcgUxXAAYMEoBMCRigeP7AXrzUfhU4ZNEpxy6QpaAwEEeW2WqdU5EyxhMB//WEt1r/2FojG4PcbsHluDYcYoxBCIhKOYnhDLW6/9WrcvuKShOGXaIvHEdJ1aHphhw8JgAsJQOKGx57Cqnd2ojoYVMZfAQlAS3QAfPPEcbzf0QadUjBCcEFDI2oMH+IDOzjUbRBUUryyBDAgkAAgJU5YFr7w6kas3rsbQiROOkLwsx3bcPf5F2Hx6LFdbUoVilwptBC4fO4MrNqwBbd/57dobj4JFvJn7TzIKIUEEOmIAlLimoVzcPc/3YwRNZUwIdBuxkEphV/XitKdzU40+Lnh8bVY9fZO1FaEVLqfomsyFeU27vtgJ/7SeqxLFBIA647sxydOm4oZNfUDwRPgKUqdBdBb1KNnEXBm/nHOcd6Tq/Hwvt2o0A3UBoKoCQRR6w+gw7axfP2T+M8dTajUdFWoRNEn+pM1wCgFTWQNhG0L186fja2P/ADf+vKKjH0GGKWglCLSGUE8EsOSuWfjyV9+HSt/9AXUVofQFo87hX0Yg04pfLRwLn+X5Na+D73zLqpDQWX8FV0tti0h8K/b/4K/tDYjyDRU6QaqdAOVugGTc/x051asO7wPFZoOe+B5jMrmDS9HO+BM0ZC5bCsbVEowQvHZV1/Cvo4O1Bg+CEhYwuk7bgkBjVJU+AO4q+mveP7IIVRoau1S0XfyEQLpWhC76YP1VaGMfQYIJUmGfzoe//nX8Ngvvo7L586AyTks7hT1IYRAI6Qoxv9Uup8T8R/UdRXtr+hCIxT37dmJ4/EYQpoGAeeccf8YIajUdDx+aC+2t7UixDQvnz+52LWS2b5y1gFId7sHiY5KZRUDXEr4mYanDu7D6j3vI2QYaWf3QkpolKLdsvD9pr8ixjkYBoiLQ+FZehUCsZjTghhIKwQy9Rmoq64Aj8SxZO6MboY/ZttdSwmul4AAMIpk/N10v+WJdD+aWIpQDG2ElPBRhq0nj+MvLUcRyJAJIuB4CWLcxhOH9sASwulNUfpD7iLRvA7IHvzu/i9bLJyKAcgBKSUoIXj52FEIIZw2rxkUJhcCft3AG60taLdM1Pt8ML2rRhUDiLQxAi+9gl+9sQ2/Wngplp9xOgCg07a6XKdA9+I9MWF19Rn4xFXzsGvPYSw892xQ93lSOvEEKeuoBmUFH6FUup8iG27g366ONtiJMTjTuSGkhJ9q2BfpQKdtoUJljuREoQVAocYIT7n/XfyJdKfeTispJXyJtVh1CioKTbIQCAQDaDNNfPSxJ3HZuLG4Y/Y5WDRhPBghvQqBcSPqcPqIeoRtyzHGaQw/APgoK3hAq0r3U+SKnmPAqYSERpjXggAzLXkLZI+BS/YMZOsbkMu2jJTDA9B70R+PoieMem8QqKJAiuIjJWBJAZ0xEMawds8+rN+7HwvG5yYETNtGXEqnjHDSeS0ThVZoYs2/GMZfpfspcoURglxL/TDvFQXqjXQGvGTRr6U0wrn+Lp77/RilMAXHzadPRl0gCJPzjELAYAzReAyfOn0KhvkDiHPuvQ+kGFTIREXKKp+BgKHjqT37sGzVY7jq4TV46oM9CDANlZoTWJdsZN319lOv48Qa+DUNfk2DTmhRUlltIaBRghuffNpJ9wuFlPFX9IASgpjguGBYI2oScVeZDJZGKTptC3OHOTUBLCG8MO6SpL90j8mk2y4ljQfwfDMgL0AAmEJgZCCIX58/HxEzDi4ltKQAKQLAxxhawp24ePQ4fO2sGYhyu9sAq1AUE7c0dXWeQkBK2RVkWKUbeLulFX85chQ6pQWPplbpfopcIQBsKVFj+PCJ06YizO2ugL/kfXRK0RKPYUZNPZY2jnfGXW8tA2Qj54D4YuAl6+TpX4wSgrjguHLMOHz/Q+cDAE7G4xBSwk78tYQ7sWD0OPxg9rkIalpXhLNCUUryEQKWcJYQqnQDbXETX33hJfz49b/i9Kpqp89FAQdSle6nyBcKp8T6zJp63DBuEiROBbm6QrYlHsP0mnqsGDcJBqPd+rMosqOyAPJAwqk7/Y/TZ2HOsOG4a/sbeKOlBRqjTings2bim9PPQYBp6LAtVQlQUVbcWX61z4AE8FRSjMCXZp+DBRPGQyMEhyMR/G77W/jJq1swtqYar954PQzGCuqiS9fdjxbBw6AYnFhC4OrRp2FiRTWeOLQH+8Id0JgTn7KkcRwuHzUeBmWIDbzZv+oGiAEUGMgIQZtlYkHjaFw0shGtsZjTjYoQNPj8iHJbGf9BDkmcrYSQAWHA0gmBdXv24qozTsfskSPw661N2N96Epqm4clFl8JgDHbSEld/Uel+iv5CCUGHbWFadS3OqKxGp22BgIAQoFb3IcJtrxv/shv7dHhFAAwodErRYVughKDO7wcSUdPttglWpMAphTeghMAWosvNHtA8XXWsG8lCQAB4ZNduPLLzPeiahsqAHw9fcyU+PHJEt/iW/uJ+NyrdT9FfGCGI2I6Rr0gUvgKcJQFKiJeNv2fx/Iy7Cyk9FSnkpptYQsBKxABoRKX+DWYoIbA5hxASq5ddiY9OnYz2cDjnPGWvwKWElBLVhoG6YBCVuo4Hl12JhePHwSpgO2s3lVACuP7RJ7Hq7Z3K+Cv6hWvk7cT6v0gUCPIYgjE2IE7ygeIBkJqmBYG+9TUvJp479RRFwTX+Uko8svwqLJ4wHpeNG4OwaWHVO04q20CLZtcoRcvJNvzbwkuweMI4xDmHjxWm3K+Ek+5nco5PPLVuwH5HCm/i5XGXEBK0LVuDB13+qXh+6tLa2ioA+Pfu37cxbtsmY4xKr6kAxaCmu/G/GosnjIeZiJ5fefVSLJ86BScGmCdApxQtnZ24dvo0fGnWTFhCwCiQ8QcAk3PolOJnb2zFqqYdqK+oUMZfMdgRDEAsFt3YEe9oGTFihN7Z2elpW+X5Eau5uVkACNx889++bAoR15nm+WNWDB5Sjf+iCY6b3KAUMhHZ/uAAEwEapTgRjeLaqVOw8qqlCOk6tAJWrrSEgI8xPL1nH+567XVUVVbA5LxAr65QeBMppWQAWk+eePmR+x5pHTlypF7uY+oN749WDvLiiy4OEoB4Wk4pBhWZjL9r5N21x4EkAnRK0RGLYcGE8Vh59VKn7mgB86bdXP91e/dh+epHEeMCUD0xFEMIjWlBABql1POnvXdHqhRisZjyHypKRm/GP3k/YGCIAEpIl2v+uxecB0YIBFCwICo7ke73yqHDWPbwGlBKoTM2YLIkFIrCIAUGwPo/MIAEgEJRKnI1/sn7A94WAZQQWJxDCIE11y3D+aMaC57uR+F4AL718qtdMQXK+CsU3sUrI1SmdoeQUno54FMxyMjX+Cc/D/CmCCAAICX8jGL18quxqMjpfuv37EWl36+C/hSKU3hSCZd/dDpFLl+Ql45XMcjoq/FPfj7gPRFgMIb2jk58/dwPd6X7FeqY3HS/sGXh+seedNL9AgHYyvgrhiwk14ur7KKgnCNTXqURhRBCShkv4vEohjD9Nf7JrwN4RwSodD+FoqRIIUUMuZcqkBlul4RSjkp9+qDhcFjOmjXL/+Zrbx44cbL1PgOAlFLlFCkKRqGMf/LrAeUXAYwQnAiHVbqfQlFkpJTS0A2t0zQjv/rFf/0BQOW7775r9+GlStozoBzTkozr/UmP97i/Y8cOLoSIFfPA+gpPtFW1k/7K7ttR5ASB48KWUmL18qv6bfxdyi0CGCGIWRauPXOKSvdTKEqH/GDvB6kegHSXhWsHy9okqNCjUaE+SLrXISA5r62UBC4lJCQqNR3VuoGqpD+dUNhSCYEBgRB49Lplpyr8FchIl0sEMEIQs21U+Hz4w9LFXcF+Kt1PMZCRSX9eJhgI9naBZ/sIqRPk1P+9vU5eX89A6QXg4JGGQBIApGP4BYDHDuzF5uaj8DENtpQwGMXNp0/GqEAIphSIc646BHoUAkAA+P32HZg/ZjR0QgvaYIQmWga7ImAFgNVFrIvvpvtRAH+4YjF8iba7hTr/0qX7BQxDrfsriobrkdMp7eq8GucchBAvjquCspwKALlDT1kplwBwVU7q7azPoZSGgPI2BHKNg84Y1h7ch5/taML6wwdhcRunhBvBL995C58540zcNuVMjPQH0WFbXjxZhzwCgKFpuG/bdoQtu5u7fKCJAAJAJC1nLJ4wvqDG303341J2pfvVBALK+CuKgnvuVusG4oKjNRYDJQSEEDT4/ACANssse5ZNMoSQILd5Lo2Akmf2ZVsGKLUAkMh92aFLGHQ1BNq3d+OI+obPMMY0KaUkpLQWVQIwKAWXEh/dsB6r934AEKBSN1BhGN1+wZZYDN9+43X88p3tuPeCi3HVmPFKBHgUISVqKyqw6p2dWAHHSA9EEUAJQYdp4omPXIPFE8YXJJbBRXX3U5QSnvCwdtgWfrj9Tbx07AheO3YEOmPwMYYV407DZaPGYPGosQhzJ9auzCOrYADriEU3tkXbWkaMGKEdPXo03YpFLrFvgzoIMJmc1M/x48cFgMCnP/OJl8rVEMg90Cjn+NiLz2LVB7tQZfhQpRsQaYIAdUpR6/ejzbJwwwvP4NH9exFQ66SexRICtaEQVr+zEysefbLrhCzk71XMmACdUrSFI/jI1MlYUmDjD6h0P0Xp4FIipGl49shBXPfc0/jmaxvx1MF9CHOOE6aJo9Eo7tr2V3xkw3p8d+sWSOEsS5VzZE1uBPT4nx7PtxHQoAkC7I3+uDrkpfMvDRKgLCaUC4Eg0/CTHduw5v13URcMgUsBnuFoJByj4mcMAsCnNr2A47GY00WupEeuyJWBKgK60v3OnIL7ly6GLSS0Ahp/le6nKBXuzP+lo0ew9Jkn8MyRg6gLVaBC06ERAp0QaISgNhgCBXDn65vwyU0vwM80lDsHRQLQGPOjb42AyrIMUGoBkOrmyMdrIzs7OykhJFjgY+r9jQH4GcPhaAT3vvcOgsEQrBwHQC4lApqGE9EI7nn3bRiUgauZk2cZaCIgNd2PEgJGScHT/Z7eo9L9FMVFAmAAWuNxfHfrFnAhUWf4YQoBkQj+c/+sRKxLTUUl1uzdjdX7PoCWCOAty7EnlveYIwD6MsDnaw8LQrkKAaVuz6R+JOAUAxo+fLjeFm1ricWiGxN1zEpmRUXCnfrrd9/Goc6OvGfxXAgYuoHfvPc2DkXC8DOmBtA+QksQ+TtQRECmdL9CGn8CYO2evVi++lGQRPCrWsbqCQEK6nXJncRv0ecMaZJoXld+bCEQ1HT8btdOPLd/D6r8fpgi80RLwhmbNcrw+dc2JlJ4Sy9OpZSSMUbjtm3u3bd3IwB/Im6tL4dS0sPvy1mTbz5iPh8o474jRozQH//T4ydOnGjdyOB86Xm8bp+RAHyM4Xgsjnvfewc+3ch7Bu96EA52tON/339XeQH6QadpgseLH/nrdRGQKd2vUEGLIhGBHeccNz3xNASgjH8GGKUQAI5FIqVdn5TylOG3I+iT9JO28xplFgESgE4IwraF548egmHkNs4KOL0uwqaJDUcOQyPlOUd1plGT8/gtt9z0MgB/Im4tmUKVMCjohyt3EKBLNveHBABN0wQAqul6ZcmOqttBSFgFuEjiau20T1BCEBccSyeehoVTJqG5rR0EBKyIQsCrIiA13W/JhPGO+7SA6X6A4wG46cmn0RmPw69pGeNdhioEgMEoTkaj0CjBv5w3B369VAZIApQBoPBv+jz0Xb8DjFrHoOf0dA4YtdB2/Q7a4Q2QerDsIkCnFB2WhZePHQFjWs7p3hoh6IzHsPHYETBCypImLgEQQtj8C+cHkbuRLvsFVS4BkM7tn0tGAOFCRHrZp2j0d4Atn5tw4EMJgSUE5o8ZjUeuuxrfvngeJCTaotGu3OBi4EURQAlBxLKwKpHrX+jWvlxIiESu/6q3d8Kv68r4p8AIgS0lWts7sWD8ODxyzVX45/PmQKe0oCWX05OYTPIofK99GezA4wDJJfU89TUICDfhe+Vz0A69AFCtrCLArTPhZywvIy4BIPG8MhOLxWNWmu29Vf5Lvl3SOACvWaOMywbvvvsuB1D53z/7z/s7TTNi6IZWqmUANyc8yu0+GxpX2UTsvvSHUACJPHfbgpQSd55/LlYtuwKLJ4xHzLJgFbHaopdEQLHT/WwhoFGCG598GqvednL9lfE/BSFOgGW7aaLW78OdF8/DmuuWYcG4sWizzNIchOSQzID+3v+B7X0Y8I9An5ebmQ8AYPzl6yB2xBEBZSxQR4A+GXKNUBhlmlxJKbkB4HhL8/2bX9p8cObMmf5wOJxLIaDeBqyiX3jlEgD5pjy46ydkz949MQAl9aNbQqBSNzC7rgGWbfVpndWWErqm4YLhI5wZgioI1CdYYrbfZplYOH4c1q5Yjj9fvRTVho4Oy3K6axThu/WCCChFup9OKdbu2YuH3nkX1aGgyvVPgiW6RoZNE8vPOB1vfOJv8e3zzwUg0WFbpalIJzkk80E79jq0d+8BAqMAkW7SmfvrgflBrDYYf/2nhEkq/dhEAMQ4xzB/AMvHnYZYPJbTuU0AxIVAwGfgpolnwBK8qMuC2RBCRHbt2pVu7T+VZG93Ok94ySjGN5WL8unr64hAdUAnhARL9S0ROGojpGn4+7PPcX6tPA0MIwRRy8QljWOwdPQ4RLmtKgL2E51SdNgWwtzG8kmnY9stH8c1kyYibJqwE0VrCv0Nl0MEXJsQAX5NQ7Qk6X57ce3qxxDUdRXwl8AVnR2WhSpDx0PXXImHrr4C1T4DbZZZ0PiLXiEUhBBoO38FYrUDpADp45IDLAS2/zGw5tchme5sKzGEEAgpsKhxDGr8ga4slGxQQsC5jYWNY1Dv98Mq+vJLT1xHNNP0ShTG/qXuk2/gfc6USir1eyQJh8MYPny4fuLEiZZYLLoxUcO4JNMTlohOvXhkIy4eNRadOarTLhJlYL9+1gwndaVoRzq0YAl3bIdtodpn4KGrr8BD11yJKsPAiUjUGZgLPBsotQhYefVSXDd1Co6fbEOt31+CdL/HQAgBVQWrAAA6o+gwTXTG4rhm0kRsu+XjWD7pdES47Xj1iiA0MyMAqoMdegHs2MuAUVM4Q00IQBi0d34FYkcT2QWlPQOccdbGktFj8ZWzZ6I93AlGaVqPHkEi+M+2UWkYuHfufOiElHxsTU4B3Ldvz0sAAidOnHAPI9MXWNYWwMmUw1eSyeXRm6KRI0aM0Nc+uLa15UTrS6VMBQROGe1/OPscGJTBEqJXEeBECTO0RSO4ZsLpuHjkKMTU7L/guAFZkYQ34M1bbsR3LpoLAGiLRmGwwg7SpRQBFMCDy67A8mlT8cuFl8Kv0v1KAqMUBAQn2juxYNxYPLXiGvz5qstR7TPQYVtdjdxLiuSQBKAn3wLsMJyyOYV6bQEwP2jb2yASAMmnkm3hYJQibFu4Y+rZuHbSFHSYcViJzn86pdAohZZoSNVu26g3DPx27iWo0HTEhCiLQdOZRk3Bo5/69Mc3AvC3tLSk0yGZ3Py5BL8XjXIHAebl6kiUVyQBn38YgJKmezBCEOUcl4wchQcvWQybc5yMx7sK07gDgvunEadpUGtnB5ZNOB33z7sEphAJl52i0Ljfe4dtodbnw7fOm4PV11yJBePHobW9s6uHfaEotSdg1TVX4tozTi9oC1SV7tcTQggoIWiLRiEh8e2L52H1tU62RZzzgp9HuSMBooPYMdCT2wEtWHg3PaEAj4K2/AWSyLIUXXdCEAj8TMNDFy/EyvkLUWf4YAuBE5EwTkYjOBmPwyAEy8aOx/ZrbsBVY8fBlIXLhMkXAYCAVsyfN78SzopxoXL+i05fuwGmi2Ds6zZX/dAszwEAJFwrgT379rw4vH7YpzXGNFHCroCMELRbJq4cMw6PL1iKH29/E88ePggbEgGmQUCCwMlD7bDiGF1ZiW+cPRP/76yZzvqWEAWbuSnS43oDYpaJBePGYu7oUfjR5r/gN9u243BnGBW67pSyLcDg1k0EoDhdBElS2V1ZwNd10/0AiRseewqr3tmJ6mBwSBt/1xMihMDiCePxtTmzsXD8OIRtyxudPIkGYnWCNm8GqA+FtTEJgRE74rz+yAvhmLbSzxEJAAGJKOe4ZvxpuHTUGGw8egSvHjsCgzHojOGm0yZhRCAIQoBOu3xeVSml1ADSGY++tO/Ivpbhw4frx44dyzSxzfSDuTZPpGxLt19B6c+3lu65JM1jqdtIym2a5XbypJqGQiEaDofF6Wed7n9jy1tv+32+kGlbJW8L7Das4FLimUMH8NMd2/DXlmYYmgZbOOuCt54xFbdNPhMjA0FEuZ1QiYpS4vYTDzINx6JRfO6Z5/DIu7vg0zT4NQ22EAW5onRKcSIcxvKpU7pEAABPiz034v+Gx5/Cyu1vo7Zi6Lb2ZYm147BlocHvw68WXYblk04H4KV+8zIhANrhX38FiHmyD7n/vUA0IH4c1vRvwjzzcyB2LPEe5UNIJ9PFT7svd1hSOP0AEpOuciGEsCt0Q3v/4N5/mzRmwremT5/e2NTUZMIx5q4nIPl28jak2Q709CCkExAFEQjl/XW7p0IA3T0BmZAXzrvQTwBTAqGiHl0GWCIfnQBYMnosLh01Gq2xGCglkNIZ+Bt8fphSoN02wUgpA4UULiwxe26zzK4gwUd2vY/PrXsORzvDqPD7wCjtd1nmUngCColK9zuFzijaYnFIIbF8yiT8auGlGB4IIMxtiESQn+fIUh+//8giv35+0MR6f4dtdSuwxBLBl+U0/kBXyrGUkmjOYdFMxhtptqU+VvJYAA+e3Rm/HBkOh+XMmTN9z699fv/x1uO/1+EUYSjx8QFwjItbmMYSAnV+P6p1A7WGgSpdR7ttOoGCyviXFQJnhl7sIMFSxAQUApXu55BLkF/ZXf5pIQAzUDQ7QWji9b2D+1t0BQGWNPMiM1JKqWu61mmanXf/8mf/B6By165dyZXeshn/TB9hUAiAXiP6kZvaSfv43r17bQCMoLSBgOlwAwAtIWBLCUtK2FIqw+8xShEk6HURoNL9vBzk1xsEEHEIXyXscdcAVidACln6lgDChPSPgD3+WhAhC/z6gxdCSOD93e/byH2VN58iQEWrAQB4xwOQ7eD/f3vnHSZHceb/b1WHmZ1N0kqrTdKuEkkSIIFABJEFmGTAd8Y5Az77zr7z75zOPhvw2Wf7HPCd7+wjGIN9PmNjAzY+sIkSIIkkRJaEwkraoLDaMBsmdKj6/THTq9neThN2p3e3Ps8zT3dXVfek7nrfet+33hrzA1mBgB37921KG4YmSzKdzOmAbthnAQjCiRUkGM8GCf7hr67GTeevxexoBIOaVnQmwbAqAWK6X+a/100TKV3HpQvbcP/VV+CmM9dkgnazGT7D/+wSQK7CxAwUWSa4MJseWOAN55xLAJLJxEaikYH6+vpcl7rXDLdcK7f9lpvUWzCMqYA97+zsHMvoRz/+oY2aaeqyJIVFiRFMESy3wJChA+C4+cw12Prh9+PaY5aMZhIsZhQYNiXAet+ZOt3Pyt8/pOuoVRXc+87L8ed3X4uL21oR17WSTq2cUIgEwjiMtmvBK1sBpqFk8oJIgJGAseg9YEpVaa89fWESgP5436YHHnigt7GxUc6uAVDILACn/QmnGOFZqGnC6djPFDLu+Nxzzo1kAwEFgoJwChLMZBLMritQhGAIixLAkQmk4sCMW91vNP4jm78/N5PfiGlMXv7+kpF1A1TMhbHovYDWm128p1gowFLgkXoYi9+XTQQ0lX6X8mAFAEpUpgDkbACgnULc3JMyBRAIRybAXFxzAFjnjIyM8BNPPDH61J+f6jh85PAvyxkIKJj6OAUJWusKDKfSGNI0KAUamcqtBHBkVvcb0XVc99DDuH/7zFndT8rGNvQnkqhR1TH5+8Md5OcDkUBMHfoxH4PZuA4YnQ5YzDUJYKahnfpt8EgdwHWI0b83uQGAP/6PH/4SQFU2ADDoaD63bkZlAgwSIGhtXS0B+/btMyilNAyBgIKpT26QYG1Exb1XXYZH3n0N1rUuQP/gMAhIQesKlFMJ0LKLIv3H1ldx/+tvYU5V1bSf7pdJv00RTyYBALecexZe+dgHxuTvn5KCfxQCcAauVEJf9tmM8GdagUoAAagKpHtgtlwGs+Wi7MqCYvQfFEJIxd59e500pnym/5VNgE3kP12qLzXuOvF43AQQywYCpsISCCiY+lhBgmnTxKUL2/DAu67CzeevBQdHPJnMBIrlKUDKoQTojCEiSfjL3v343vMvoqa6Cpo5vQ1l1n/XNziMdW2teOCaK/H1M07H7EikfPn7JwIigRhpmPWrkT7r9ozQ1uMAVRD4GxIp03akA+b8K5E+/YeAWcSywjMMKwAwkUw84xAAGIRCZ8GV1D1Q7PPglQ0wd99eZs8GGOQ1mhnQygh43MnHVb704utvq4qi6GXICCiY3picgwKolBU8tm8/fvDCFjzV0QlKKSLZRXnyYbIyBloZEB/dtx/X3P9HgJBpHfFPCAE4x7Cuo6mqEjectAJfPH01YpKEuK6FZt54yeEmuByBdPg5KNt/Aqn7CSBSlxnVZ+vHQEjGt88ZoMUBpQb6sddDP/aTAJUAbqBco3+njDhhhjGmVymqsruz44dLF7R+YfXq1S0vvfRSGs6Z/6xjeOxzjLcQuFnG7RT8YJc7E6CFPRDQ6f8fEx9QX18vnbHyjFQymXw2qigX8ElcE0AwM7BMxXFdw8Vtrbi4rRUP7NqNTz36BHpSaVQqCigQWBGYjIyBmRwUBJu7D+Dq3/8BkiRBonRaCn8CQKYUKcNA2jBw7bFHM/klpmSQX55YloB5Z4DNWQ1lx08ht/8WZGR/pl6pwphxlpEGzCQgx2A2ngv92BthNpwFYupZZWHyfysOwOQMESodnRxPCHTGRqeuhg3OOZeoJKUNI9XV3fkygKpDhw5Z2laQ6X9O7cpCKX5dLyuAmzXAaZ/aymhO+ThLwOrVqyMvvfRS156ujn9b1Dz/H4d1TaeUlmcNSx84xpp7CcKdJ14wHmsJ3sqcdQUe2LELhBLURiPQzeC+9YmyBFj3GAfwjt89iKf27UdNNDot/f5WCufhVBoNVZX46SUX4pqlS6AxEynTnL6jfie4CRAJXJJBU72Q990P6MOQ9z+YjQ/ITPFj9WvAao8Dm30yjOYLAABET5VoJkGeHxkZwR+VZKiEoiedyqT6JQBjHHXRKFRCMWzo4AhXwGY2AJBouq6vPu3EY3e8umPEskrDeeTv9YLLsdPWvu9VFohyWQByR/McGaHuNgPAsTyrcVV1dHZsbZ7XmJKopDLOQmUFsD64TAgi0tGf2uQcGjNHVw8UhB+rA8oNEnzypA788MWX8eiuPaiurASlJNC6AhNhCbCm+5mc47o/PozH9+7DrIqKaSf8CTL5+/sSSVRFIrjl3LNw48kr0FgRw4iZycI6rUf9ThAJAAcxUuBqHbTjbgAA6Md8AsTqhbgJrs4Cp9mly00dmYVLyiP8M641FQeTCdz29jbcuXN7JnU6JdAMA6fMqcc/LDsJFzfPH117JSxKAOecU4Akk8lnV69Yne7r7pMSiUQ+gX35THmfUCbaApC777TNJx4g1xJAY7EYTSQS7LiTj4uFMQ7AWkjEmmf+/JGDMDiHwRiWVtfiuOpZUCUJWraDDsWHFgSCIzPzpEpWkDANfO+FLfj+iy9jOJ1GTTQ6Wu9HqSwB1nQ/zTTx4Ucexf3bMtP9ppvwlwiBxhiSiSTWLVmEL51xGta1LkCamdBY+daDDxf8qO+f5mb0IxkfPzMycQBlmudv9YsGY/j+m6/ijp3b0TU0hKiiZJe+5qAgSJoGZBBc1NSCf1yxEuuaWjCYjecoN5b/v7278weLWxZ80eb/d4sBgEM5bFv7zLcgFoCiFIawxQAEbcMJIby+vp6uXrE6HbY4AA4gIklIGAbuad+ON+N9SJoGTM7BOUelrCAmy3h/27FYXTcPGmNZa4BgKkCQ8VMOGToogJvOXIOzmpvyDhIslSUgZZiokCV8/6WXM9P9ZtUiPY0i/q0gv0FNQ1NVJb54+qnjgvyE8LcgR6cEcmN8XRlG/BaWlYpzjg888yT+sGcnYtEKzIpWwOSWjMz8jzWKCg7gz92deOpgN353waW4cn5r2S0Buf7/js6OrRjr/weCCWQr3CHQlPc8r50X5bAAWPtuI3/r2O77H2cJyMYBdO/p6vhuWOIAGOeISBJe7e/Fz9u3IWnokAkdXb7SamNwDp0xnFpXj48tPmG0wxfd2NRDZwy1SibyekyQoCwD2Q7PC8sS8K7jj8Nv33l5Jmc9Y75+bGtxH0oI/rx3H97/0CMZJRMhiTAqARIh0EwTacPANbYgPzOkQWICZ3i2b3zP00/g/j07URerhG6anveqTCl0xmCaJh6++Aqc09CIZJGpuovBwf+fsKzRcI/+d/P9W1pPWWYAAKUJ+8x3rmKu77+Q4IbRsqzmVdl1oPvltGGkJCpJ5cwHwJHpzBOGgZ+3v4WkYSAqySCEgHEOM/viyMQFVMoynu05gMcOdqBSkqdlpPZMwFpXYMSWSdBaV0DxEeSWJeD+7Ttw3UMPYyCdHj3HYGxcz8E4HxMh/a3nXsB7HnoECcPIKBwT/o0nHimbb2FI11GjKmMy+cV1LXSBYQJvTM4RlWSsP9iNB/fuRm1FDJqP8Acy979CKTRm4ttvvAKgvGmKsv5/WP7/+vp66+Pka5r3snpP2myB8jtUMjj9GL7mEWthoOs/8eFNOmOSFIKFgTgH7mnfjoRhIuphBrY68jo1gkcP7McrA0dQMY3nak93rGWhrSDBo+sKqOhPJDMCy8N/qTOG2lgMD+zcjRV3/wr/+vyL6E+lR60AY0xg2SVtH9u7D1f+/kH881NPg3MOVZ4eSqQiUQxpGoZT6TH5+61Mfn4KlSB8WGbb7735Wsbamcd9ajCGqkgU67s7sP7gAVTKZV3LwpQBDA8PvvyrX/3qcFtbm5Id/ecS9MOVNQAQmJwYALtwdxL2fjkA3K6D1tZW6YyVZ6RSqdRzFap6jp4xq0z6QtbWqH5A0/DWYB+U7Kg/yDl9WhpvxvuwctZccEwf3+1MxMpGZ2StAWe2NOH2V9/A917YgngyibpYBXSTOT7pJueoUVX0JpP46vpn8ZNXXsffrjwRN550IlTp6Fz+Fw8ewq0vvYzH9u6HAWB2TQ1008yrUw0jEqVgjKN/cBiXLF2M/3faKbiwbQFYdrleMeKfmpico1KS8XDXfjx1oBMVipq3ACdZy+l333gFZ9Y3IDPvYfJdpjTj/zc69+97BUClg//fzWrtZOZ3gzi0mZCYgFL9fqWYCWA/DjQb4MQTT1Ref/31Q2/tefsrJyw65mvDusYpnfxIFzMbFf5Q117c17EL1QG1VJI9t1ZV8dVlq1GRXaZVdHVTH5NzqJQiQiU8vr8D333uRTy+ux0VsQqolLreH9YqhEnDQFrT0VBdlV3RLzNtdCCdRlLTURONjN4/Uxlrud7BVApVkQg+f9op+MLppyImyRg29NF6wdTEYAw1iop/evkFfOfVlzC7Ipb3DBUCwAAQlSjeeud1mBOJQJvkfpJzzlVZIYl06sjyFUtXde3q0mOxGMlaAOw+f6eMf/ZjwFkxmBT/P1A6F0C+H8RNu/GaEuF0Lt+9e7cBoPbO2/77jyO6DkVR5XLFARAABmcFmWF15jwqFExdLGtAXNewrnUB/vBXV+Om89didjSCQU0bnU1gh2eni6qShFmxCgxqGvpTKQyk0uhPpSARgtqKyGhcyVRGIgS6aSKl67h0YRvuv/oK3HTmGvDsqJ8K4T9tiMmy49A2KJxzVEjy6PLWkw3jzFQAxPsHHjxr1Vm9J554opIz/9/Nb1+MmX/Cv+ZkLwbk9GME+ZKuP2IikeBz585VXtj4QmcimXhaRkZTy++jlo6MIM/TvFXgeYLwQ3A0SBDguPnMNdj64ffj2mOW+AYJWoqATAgUSkdfAGCyqX2v5Ab51aoK7n3n5fjzu6/FxW2tiOvaqBVEMH0wSjDIKZfCyznnMpWoZhipPXt2PnHfffcp/f39fsLfi2J0oZIxWUFzQYW8l+/DddZAW1ub8uyzz/YPDg5uzTr/J92Rnhn9cxxTXYtKWQlsBSAAdJ5JDhSTyhrcIphApOyoJa5reQcJ2mcBTHXcgvxGZkL+/hlMRCo+NEshtGzZUyVJphpj0mf/5hMvAIj29fWZCCb83RSFcTFteVCSriAsT5qb8HdrO2b/8OHDBoDK7s79W9OGYVBagjstTwgh0DnDcdWzEZNkGAH9U5RQJEwDx1XPHp0FIMY90xPLGmBwjkQ2SPCVj30At5x7FgAgnkxClaZvhHsmFwZB/+Aw1rUuwCPvvgb3XnUZaiPq6HK9YtQ//ZCy0/g+uuRYtFTXIGWaed/jEqVI6xquP+Z4zI1GkC7gGkXCJACpVOq5U045K9Ha2mqXMUHc2nYZV6gFvGSUUgEoRoNxG/n7aVQAwK3pgO/94HUbUqYxoEgSnWw3gBWMpVCK97cdC4MzX/+lTAiGDR2rZtfj3HnNGDENsUjQDMCKYB0ydMyORPD1M07HA9dciXVtregbHIYxzRLckOy0xXgyCQ6Om89fiwfedRUuXdiGtGlOu+8rGAsBkDJNNMcqccMxJ0DTNc8psU7na4yhuaoaNx57AnTGQCfZSsQ55xJg9vQeeuKee+7praqq8vL/+0X7e8mmSZVbE/0rBtVuggRNeMYBLF++XD37lLOPxPsHHlQAcM4m3Q1AkTHnr66bh1Nn1+NIOgXg6KhmdKoDIZAJxbBhgBLgqpZFqJRlcDH6n1EUGiQ4lRBBfgLgqBXgk8eegNkVMSQNI7DSp0gSEokRXH/M8WiqiBVkQSgGzjlXFFUe0XXcedt//xHArL179+pWdW5Tv0tlt0E+/qQoAqX+Hb2mA/pNC7T27csC+04FBEDmz58vd3Z2Dj2x8akrzj597S9MAooyuDg4squyMYbHDnbgLwf2Y1DXUClnMhQTkgn4S5oGVs6qx1UtC3F8zWwkxeh/RmOltY3lLDf84Nu7EJFlqAHWFQgbVv7+EcNAfTSCn15yEa5dugRAJg5C+PlnHoxzRCUJD3d24L0bHgNDZmaAW3BgRkEgiKcSuHrhEtyz9oLRBdYmWQEwo7Ii9Q8OPv3Od7zj3V1dXdL+/fuDpv3NXQgIGG8hcBsAl2omgSeTqQDk7nspAEFyAYxTArLzMfnixYsjL7/15pZYJDpXK9PqgNa/UynJeGXgCN6M92FrXw90zqDnrAZ43rwWVMoKhkWSEwEy943BGKKSBJVKeDB3XQFFAUX45/wTZPK3pwxjXP7+EdMYk8JYMPMwOUe1rOChzn24fuN6HE4mEZVlROWjqVssd+qQrgEcuLZtEf7nnAsz1qQyWEkZY0aVopJt7bv/Zdnipd9evnx5w5tvvqnBXfg7rf4HjFUCnI5z96ekAuB0TS8FwNp3UgCAoyN434WBAJDly5erixYt6v2vO+7499bGxuuH9bRBqVS25a9MzhGTZEiEoF9Pg3OAI7MaYJRKSGQ7RDHyF+SSq0Ba1oAHduwCoQS10Qh0M5zL/EqUwmQMw6k0Gqoq8dNLLsQ1S5dAE8v1CnKwlICDqQRu27ENd+zchq6hIeTGySmSjHVNLfjsshNxUfN86IyVpa/knHNZVoih6+bXv/bl03743R92xmIxuYDFf5yEvlOgIDzK7HVFExYFwNp6uQG8lIFQuQFyYdkUlpbJ09JuxUpmAj+sTIKUEDy5rwM/fPFlPLprD6orK0Fpxs0UBggyU/v6EklURSL4wumn4saTV6CxIoYR0xhtIxBYmNmVAVVC0Z0cwd2734ZmZnJepE0Dp9c34Ir5baAARgwdKFOsiN3839nZKXd0dHBkpprnI/ztioCXAjApo39gchSA3LKJigOw3AA06wZQy+0GcCKfCBCBAMj2Etk00wnTwPde2ILvv/gyhtNp1ESjo/XlQiIEGmNIJpJYt2QRvnTGaVjXugBpMeoX+MABmJwhSmWoDjEhI6YOxss7NbQA879TGTDe3F92/z8wMYsBecVoBInfIAHb2eUpz84GUBYtWnQk3j/wYG1j4/VpzkxCyucGyEV0hYJ8sWYCDBk6KICbzlyDs5qb8IMXtuCpjk5QShEpQ5CgFeQ3qGloqqrEF08/FV88fTVikoS4rkGmVAh/gScEgEwodM6Q0o3RciuQWiIEUhlvoZzof/PO237yRwC17e3tRm4T+yl+l8zZTqhgD0oYQnH9pv05mUrczufxeJz96U9/knft2f5kNilQGL6jQFAUVurcuK7h4rZW/Pnd1+Led16OWlXBkK5PWupcgmwyI9PEiKbh2mOWYOuH34+bz1wDgI9m8hOiXxAUK3DUeinhUR6ZDGAkkdi0+enNXQsWLFASiYRVZx+lT4TPfsKVgnKmAnYS/F5akZ+fhANAX18fAxC74UOf2JhJCiRPelIggWCisNYVGMlmEnztYx/CNUsXYziVxpCmQZlAfVfKTsHqTyRRo6r43TVX4nfvvAK1ERVxXQOHyOQnmD5YyX96+448sXnz5oGamhoJY1fyA/IT+ASFn+tXVxAT1VtM9Jdw07ZG3QDLli07Eu/vf1ABeDmSAgkEE4WUDYgaMnTURlTce9VleOTd12Bd6wL0Dw6DgOSVac0PAkCVKOLJJADglnPPwisf+wCuXboECdOAkc2AKUS/YBrBFVmRR3Sd3f7T/3wIzuZ/vwFrkCA/p+NJIyzmcb8fxClgwl43emy5Ad5+e/t6EyDCDSCYjliZBNOmiUsXtuGBd12Fm89fCw6OeDKZybJX5Ijceo++wWGsa2vFA9dcia+fcTpmRyKj+fuF4BdMNxhjTCUE6XTq5Zc2v9ThYf63jr1cAF7lbkyKUjCRz26Q6YC5+04zAOzHflMCR49bWlrkrq6uoUMDA3+cW1t7btLQTULIpC8SJBBMBibnoAAqZQWP7dtfdJCgFeQ3rOtoqqrEDSetGBfkJwS/YBrDZBDz8acef98VF7/j0ZaWltqurq7Mmt7+U//sc/1DN/3PYiKj4+2R/EEi+4OeZ5WNmwlgHdfW1lJZltNHeg6tn1dbey7nnIdkNqBAUHIs37sVJHhxWyseyM0kKMsAIYGmDEqEQDNNpA0D1+Zk8kuI5XoFMwDOOVdlhabS6fjnv/i5l2KxWFV/f79hb+Z0KsYLejehHoq4tHI9yUGnS+RTPubH3bt3r75v377a2277r98Pa1qvIiuyCAYUTHfcggRHNA2GaXr66q2ZBkO6jhpVEUF+gpmKKQHm4Z7DP59XM6+3qalJtpn/3Xz9QQiN/x+YePddoW4At/TAgRICWfvLli1T33rrrUP7Dh34ceu8xuuH9bRZztTAAsFkYmUSPLquwJM4NDyCqmhkNG2vhSJRxFNpcMZx7XFj8/cDws8vmDFwiUrEMAz9M5/55Gk/v+3n3RUVFUoymbSn/i00819ozP/A5C8HPBFfxNXMEo/HGYDo9h1vPj0VgwG9Ih8FAj+sAL5E1hrwysc+gFvOPQsAEE8mM/OtKQUBQf/gMNa1LsAj774G9151GWojqgjyExTMVO27coP/tu/ZfmD+/PlqVvgHEdBussjLFVBWJuPZLmRtgHxSAntZBGhLS4vU1dU1fGhg4A9TJRjQzC56oVAKZNcSSDMTEhGBV4LCsKwBESrh8f0d+O5zL+Lx9r0ApaiKRPD5007BF04/FTFJxrCRSSwk7jVBvnBk0vtGqJS5fwgZXchniriPxgT/NTc3z+ru7raC/7wW/4FDfdDRv9e+03HJCIs53C3wz2lrxy1AEAB4Nhgw1dfb89RUCAbUGUOtokLjDH2p1OhUrvpIFMnsnOsp8iAJQoRlDUjpGta1LsDa+c24ZdNzePPwEXx29SlY17oAI4aOIbE0taBATM4hE4JKWUVPOgXOORjnqItGoRKKuK6FOoA0N/jv/33+77fEYrGqgYEBK/jPz+9fjJAui/AHyqMABJ0NEPS83B9o3GyA9vZ2I5lM1v70pz++/1vf+t7fKYoyxzCN0CwQlIvJOWoVFY8f6ML33tiKrb29kKVMesyPLTkOXz5xJaplRXTSgoKw0vgOGTpkQvDttWfDAIcMMto5h9o0Jggt1hK/SdPATa+8hJ/v3gGDMRgmw6o5c/CFFauwrqkl7H2XKQHkcM/hn8+pnNNrNBmzdu/ebY3+AXevht8Uv1Ca/4HJc+/l4wbwygtgf1n1noGBVjBg+4Hu/1zY2PSJMAYDWgtjfO/NV/Gvr2/FiKYhpiijd0syncK6llZ889Q1OHXOXCRNM8wPkiDkcGSWqqbI2C3FvSQoFJNzVEgStvQewT9veR6Pd+1HRSQKINOvJXQdlaqKr5y4Cl9YfjIMzsIlBTN4Bf/5mf+dzP5OuQDgsPXadzouKWG0x3gFWFhbv6kYY46tYMC3d761weA8dMGAjHNEqIQ/de7HV1/aDACYFYmAEgI5+5pTWYXHu/bjy1ueR8IwIBESxodIMEUgODrtTwh/QaFYU0MThoEvZ4X/nMqq0X6LEoJZkQgA4KsvbcafOvcjQiWwkM3IZowxmRCeHBv8F0TWOFHol5v0HyVMeQCCaD5+ZY7mlq6uLrOlpaX60nPXPTQwMvxcVJIJY+FYH4ADUCnFwWQCN27egJgaGfXXWvUcQNo0MaeyCuu79uMHb76GCkkGy5nGJRAIBJMNYwwVkowfvPka1meFf9o0x3TEVtxSTI3gxs0bcDCZgJpdWCosEEIJ55w8v3njDzY/tjnJGKMINsj0sgIEMf97/QwT/hOVczVAr7ogPhMn7cxeN2Z/9uzZ2PTs07dygFBKQzHsMRmDSiXcvftt9CUTUCV37VgzTVREorhr9w4cSSURkaRQPUQCgWDmwAFEJAlHUknctXsHKiJRaKbzuIpxDlWS0JdM4O7db0Ol0pg8FOWEMWbGZJn2Dw8+f+Ullz2ejfzPDf7L1wJgZ1LN+vkQKlO4A0HM/3ApG1Pe1dVlVlRU1Fx92ZWP98bjT0czywSHwgoAYHSqjB8cGaUhNHeQQCCY0eTTJzHOoYdE8FtQSolumvrzmzd9v7a2lhNCgpr+nfz5hVKWLr2cCkC+5pAg13Eyw4y2mTVrFpk/f37ySM+h9RRAmFIDp7Kas59ZghCCdFZZCIUJQyAQzFgIMkI9zZjvypNWbcrFSlAOOOdckWSaNozhz3/xcy/pul7R39+f+wHdzPh+g9PQm/+ByVUAinUDuP3g9n37NUbbtLe3G319fdb6AHE1BOsDEELAOMfZ8xpAKR31/TshUYqUrmFV3RzUKGroNGmBQDCz0BlDjaJiVd0cpHQNksc8f4NzUEpx9ryGzAAmHMGnpgLg0OGD98ypnNO7cOFCa9lfLwtAPjIjtOZ/IPwuACD/H9vVApBMJvnChQvV//j+f+w6eOjAXWrmBiyrOioRgpRp4LKWVly7cAlGtMxSq3YoITAYQ42i4KsnnoKoJMGESNMqEAjKA0Gm84xKEr564imoURQYjIE6CHaZUoxoGq5duASXtbQiZRpln32SHf3Lw5oW/5fvfPPOTZs2xdrb2w0E9/mXygVQNqWg3ApAoWaRIKN/p3Zob283Kysrq7/7nW/+bFhLxxVJLrsVgBECkzPcfsY5aK2uxoCWBkUmFbBMKRRKYTCG4VQSXzjxFFzQ2IzhcCfUEAgEMwCJEAwbOi5obMYXTjwFw6kkDMbG9F0UBANaGq3V1bj9jHNgcgYWjr7LVAnBwUMH7vrFT+5sP+GEE6LZqX+Ad9Q/fLZubXMpu/kfKM8Aspi1AZySANnLSU6540qBJ5xwgrpt27YjO/fv/ZelC9o+N2LoBiGkrImBOABwjmHDwN8+9ywe2LcHozMVCUFDRQz/fea5uLRlgUgHLBAIQoWVBvgvXR34m81P41AyAWTHVZRKuLZtMf7rjLWokmUgBOtMZEf/RNO1+Oc+93dn/+/d/9vLOZeSyaSJsQLcKeGPU5IfS2jb6+CwdSuz1004YVAAcsvcFABrG3SJYM/MgBUVFRKl1HjfR94399Zb/3Ojqqi1egjSA3MACiGQCMUjXfvxfM8hKFTKpAJeehyaKmJImka4nEgCgUCATOdaIck4kEzg57syqYB1ZmJNfQMua2mFyRn0kAQvc86NSlmRd3Xsu/WY1oVfO+GEE+Zu27ZNg7fwt4S70yJAwHhlwC+A0L7vVTYhhFUBcNq3C37gqGC3yt1G/uMUgTBaAYCj/3ylLVOxxkykGRMjf4FAEFpMzhGhFCodu6rEiJmZVh+G3ss++v/1Pb8+whiTXdL+eqX8dTP3Bx392/edjieUcsQAFOr78Ivyz23jFAg45hp79+41Kisrq8IUCwAc1VSGDB1xXcNg9qULs79AIAg5EiHQOR/tt+K6hiFDHzNqCwFZ3//Bu+78yZ17W1tboznC3y2QHC51xciMssubcgcBWhQbJBHkTxtznEwmWWtra/TOn9y59+Chg6GYEZCLRI4GAcqUhunhEQgEAlcIMNpvKZSGauByNPI/Hf/ud775s1gsVr13716vrH9O5eMua2sXCv9+EMKiAOTi96P5+U+scjezzGj53r17jVgsFqoZAQKBQCCYMMaM/tva2iI5o38LLxN+EPljJ6giMOmyJ0yLAQVpV0gUpWtARjKZZG1tbZGwWgEEAoFAUBp8Rv+jzZxOddgGsTS7XSc0hMkCkI9m5aYY5B11KawAAoFAMCNwGv17me+DmP79BH8xVoIJJ0wKgB+FRlO6nceBTHZAYQUQCASC6YvH6N8rkh8O9dMi+M9iKiwGlI81wO0PhK18zCvXCjCiaQOyrNDpYAUwsytvGTmvKf+lBAKBIE8456ZMCO8+0P1zl9H/mOYu5V71Uyr4zyLMFgA/X0yQH9/Pd2O3ArR3dnf+IgKEaqngfDE5BwdHtaygVlFRk/NSCIXBhSIgEAic8bN7TzUYY1xVVCmp66kf/uC7d3iM/r18+0Etz/Zzg1C2nzsM8zOCpAbO3XdKCOSUHjg3TbBXgiCKTHZAWldXRy677DJ899Yf/r6mqvq0lK4xSm0ZLUIMBwDOUSkrYAD+r3MfXug5hIgkw+AcqkTx0SXHormiEhpnSJtmqKboCASC8mFmc41IhIxKJJ2xTCc5tfsJplCJPr3pmRvWrT3v901NTdUHDhywFACnpD+AewIgqw4O5XnHoHmUTQph+Fe9MgPm7vulB/ZbH4BgvFIwRglYuHChsnfv3r77H/nTZVddevlv0qbJCAm1lWQUxjloNnfAE92d+I+3XsfjB7qgmwYyX5EDIGiprsYNx5yATx53AhqjMQyJRYUEghmN1XfEJBkpZmLE0EFAQAgwW4nA5ByJEKzeVwiMMTOmqLQ3Hn9h3qxZlzY3N9d0d3fn5vt3Su9rL4OtDHAX/PnGqrmVTQph+EeDKgC5+17rAwDuVgBfZaCxsVE5ePDg0OGBgYframtPT04BKwBHZg0Bk3N88Jkn8cC+doAA1Yo6RpsHgJRhIGUYmFdRgTvPPh9XzW8TSoBAMEMxOUeVrGDE0LHhcBd2DA1g11AcCqVQCMWqunosr63DyllzQ5XONw9MlVDpT3/+v/d+9P0f+svs2bNr9+7dq8N59A94p/7NrQfclQDAXxHwKps0wvJfFmoFcHMHeFkBvFwCtKmpSU4kEoO/uPdXl1z1jit+kzQNhhDHSmTG9RlT3UeefQp/2LsbtdEYAA7TIY7RytKVMAxQAPeedzEun78AKdOc6mY+gUCQB4xzVEgytg/246GuvXhloAcVkgyFUmshP4wYOmoUFZc2teLixgWQKAULyYI+fjDGzCpFlQ4PDrzQUDv7sqampqoc07+f0HcS9G4m/yk5+gdCLNhccIvWDNLOLzgQAPiBAweMWCxWc/VlVz55sL/v8agkU8YYQ0gxGUNMknHrW6/hD7vfRl2sEiZnjsIfyHxRnTFEJQkMwMc3rceRVAoqpdMq8EcgELjDOEdMlrF9aADf374V2wb7MUetQESSQZCJA6CEYJYaAQD8et9O/HzPNqhkaogMzjmnlBLNMBIvPv/cd2tra72Cxr0CAb2EfD7CPXTCHwiPAlDsj+P1p3mVO5pw0uk0q6yslD707qv/NqlpA4okI4zTAjmAqCThQDKBO3duRyxWCd0MNnnB5BwVsoz+ZAK3vb0NKpVghlfPEQgEJYIDIIRgxDDwUFc7GAeqZDkzOyjbzVmdnTWQmBuJYkt/D17qOwyFUIS9p+CcmzFJJnu6Om678pLL/q+hoWFWzugfDlt7mZvscDvH7TjUhEUB8CPI6N2+b29j/0Ndr9fX18fmz59f8cor2w50dnf+IkJpKKcFMsagUIrb396G7uGhvEfxJmNQFRV37NyG7sQIopI0te5egUCQN4xzVEoynj7cja39PaiSFRge4xuePUcmFP+7723o2WXJw9pXWNP+RnQ99b3vfPOuOXPmzOno6NCz1V4mfCf85IZ93+0aQcomnbArAPn8sF6Kgf0cX5/O/v37jWg0WvudW/7l+33DQy9UKCpljIVGCeAAIpKEI6k07ty5HRFFzXsEb1kQuoYGcffut4UVQCCY5nBkpvQlTRM7hvoRk2Qw7v/McwAyIUiYBnYM9UMhFCE0igIACKGccE6ee2HzZ+/677u6VVWVbQv+OAl+p3gAO36j/XyUglAQJgWgEGEf5NjRzO/QfkxdMplkiqJId999d3zDs0//QAIopTR0sS8cHHqAB9iPdEDXgUAgmNpIhCBh6plofxLcakgJwYihY+dQHHJILQCMMbNSlunA8ODz69ae97ts4F/utL98LchergCnc+yE8WcaJUwKgBv5KgZB/TZeNwQHMgsFNTU1zXrXZVc+daC/73FVkkkYXQHFTuGzZgYIBIKZAUEmZ0i+0sk6L4xwzrlEKU8bRuKF5zb/2/z5860P6icT3Ob2j7l8HsdTRikI2z85UVYAe5mbVWCcayCVSvH6+nrpw9dd++m0rqcUWSGMsVD8gQQZ31zSNEAKVAKsFEEJw74qpkAgmK4QoCBBTgmBnIfVYDJhnJsVkizv6dx/x5WXXPanWCxWmw38A/x9/17u5NzyKWfm9yJsCkCheFkB7GVuf7Tjn9vf32/Ksqw+99zL/c+9sPmzCkAplULxx+uMoVpRcWpdPXRDL2gev8E5FFnG2fMaMvN7RS4AgWDaYuUMma1GsGp2PYYDJgEjAAzGUCnLWDOnARoLV94QxphZrahy79DQi//2b//yg2XLljU6BP55yQY34e6nLNiP/RSEUMgOizAqAH4/Wj5/hJ8Pxy8egAHAgQMHzOrq6ti6tef9/lB/3+NRSSp7bgCCzJrFlbKML61YmRnJ5/lASoQgqWu4oGk+Lm9pRXKKpvsUCATBIQAMzrC8tg61igozQGIfSgh0zrGsJnOOEaJkQLlz/jc+t/E7d//07sG+vj6SE/jnJszzGSzaj6eMmd+LMCoAhRJESQii4Tlqe6lUis+dOzf6wRDlBpCyQTnnNzbh/OYFGE6n8vPlEwLGOb6w/KSj2o5AIJjWWLMAVs6ai0uaWtGnpUEJcRXoEiFImSZisoSPLDoeYRsjWHP+d3Xsv/3qSy77v2OOOWbOwYMHnUb/Y06Dc5/vJvSnpVIQVgWgVFYAe7mrrz9bzhzacwCsv7+f1dXVRXNzA7AQBARaH/ifVqyESiXojPkqAQSAKkmIJxO4ZuESnN/YjJQY/QsEMwZKCEZMAxc3LsDa+iaMGMboqN5aEZASAs45UqaBClnGxxYtQ0yWR1cIDAPZOf90RNdTt37/23fW1dXN7ezs1LLVXhZhJ8HuNSjMJXSCvFDC8j864fbZvFYHtPa9lgx2W0HQd72AiooKOnv2bHLJJZfg3/793++fU1OzOqFrZrkXCzI5R7Ws4E+d+/HXT/0FacZQo6qjQYK5SIRCYyYSqSSuXnwM7j33otGJr2G+GQQCQWnhACgIVErxUt9h/O++t5EwjMxqgFkloEKSsby2Dh9ZdDxisgwtRMI/AzEqJEl+cuPTN6xbe979jY2N1QcPHsxd6hc4Orc/yHK/TgpB7iwBp63XvldZ2QnXfzmeYlcKtLZ2QZ9b7ib0c9uP1mVXCxz406OPXHTJRZf8xgSHyUyJkPLmCDAYQ42i4vEDXfjBG6/giQNdMJBZ7IOBgyCrzet6dkng4/H55SdDphQ6Y6EK6BEIBJODJZVUSqGZ5uhqgDKlkAnBmrmNqFXU0eDBMPUTjHOzSlakrt6ep+bPnfdXTU1N1Q5z/r0EvX36n58iIBSAScZPAcg9DqIAeCkD1KHOUSFoaGhQDx061PvIhqeue8e559+RCMmKgZYlwOQcj3V34kdvvYaXe3ugyjIMxqFQiuuPOR6fPPYENFbEkDQNMIT/JhAIBBMLB89aA6QxrsA0M2FyHjoLIWPMrFRUqX9o6MXzzjr5qmSSql1dXUilUpZb1m2pX3udl9AvlfD3Ki8rYfpPnfBzA7jt+wn/IEsG2y0DY/YXLlwo7d27d6i7r/c39bPrLkobOiOElNUVAGA0ordKVqBxhr5UCpQScJ7x+9VHotA4y/r8aehvAIFAMHmwrLC38AoOLBecc04JMSUO7eEnHv3wte+44sm2trbaffv26XA2/TuV2ff9FAHklCFAGRzqQ0fY/lsn8lECgloD7DEAvv5/e/ns2bMlSZL0lSuXVT348OOvKooS0XSNhCVdsMk5KMlm+8oqBRwZjV4IfoFAMFUxGTOqFVV+c8+u/1ix5JgvLl26dP6uXbtScDbvBxn1+5n9p+XoHwiB2brEBDHXWMd2zc7vOmN8Ri4Jgso+K8BCymruOmMwOIfOOYzsil5C+AsEUxeOTMyP9dIZG122d7qTNf3LvUNDL3735m/8YNmyZQ3ZqH8vge000oetjdf59n2nsikn/IGpYQEACrMCWPv2curQPt+AwFFXQFNTEz1w4MBQV++R3zXXzblw2NBNGgJXwESTe1dPlZtIIJjKcAAmZ4hSGarDVN8RUwfjxa8NElY4Z1yikimB4NEnHn3PlZdc9mRDQ8OsQ4cOeZn+vVwAQcz+03b0D0ydvrsUsQDW1knwA+ODAHPL7ErB6HE0GqUtLS2IRAz96c2vPTQ7JFMDJwqTc3DOEZGkzI9FyOgoJKyLhAgEUx0z+8yphKI7OYK7d78NzWSQCUHaNHB6fQOumN8GCmDE0IEQ+u6LJzPl7/Gn199wyXkX/LahoWHOoUOHrNG/0yto0J/TND8/S8CUF/7A1FEAgOKsANbWbTZA7tbLGuAUFEja2tqUffv2xf/w6CMXXBaiqYGlRmcMtYoKAOhJp8A5B+McsyMRRKiEhGnA5HzajkAEgnJgze45mErgth3bcMfObegaGkJGvmSiexRJxrqmFnx22Ym4qHk+dMbAsnFA0wFryl93X++TLXPmvrutra1m3759BtyFvNuIn7nsB/H55zP6D73wB6aWAgD4Twss1grgNjuA2urHuQisqYGPbnjqunXnnn9H0jQNgMt5fLfQYt3JlZKMv3R34InuTty3vx1p04RumlgzrxHnzGvEp49fjmpZwVDABUYEAoE3lvB/qHMfrt+4HoeTSURlGVH5aNdCsu2GdA3gwLVti/A/51wIKZu/f6o/iYwxM6aoUv/g4EvnnnnSVem0rGSn/LmZ+r0sAYB3bMCMMP1bTLV7o9SuAL84AL/XGFdBW1ubvG/fvsGu3iP3TZd4AI7MlzMZxw/feg3fe+s1DCcTqIhER8cfaWaCaRouXrAQXzppFS5obMaIIVILCwTFwDhHVJLwcGcH3rvhMTAAMVmGwZijdMk8bwTxVAJXL1yCe9ZekJkFhKnX0Vvk+v0feeLR91x9yWXrs6N/y+/vJOi9zP/A+JG/2+jfz/TvdOxWFkqm4n0xka6AogIDo9EobW5uJrEYT6/f+Mqfpkc8AEeFpOCvNzyG+3duR01lFaSs39+CEAKZEPRpaaiE4NFLrsJ5DU3CEiAQFAgHoBCCvnQaK/54H4Z1HVFJChTtr0oS+oYGcdNpZ+Lmk1djUNfyWyQsVIz1+8+bN2/u4cOH0xgvzHPT/eYeewn9iTD9e5WHjql6VwTF7w+y/5lBokMBFw0ylUox0zTpG2+06xuf3/RtkzFDliTOOZsyN0QuLDtt8IH97fjDvj2YVVUNzjn07AhkVO3mHBpjqFOjMBnHN17dgr50GhKm0JMgEIQIkzGoVMJtb29DfzKBClkOPNVPN03EYpW4c+d2HEgmEJWkKfkcMs7NmCTJB/p6n7zkvAvub21tnXP48GEtp4mTKR8Y3+14CXm3fb+R/ZQX/sDUVACC/PBef6jfzeF0fa9gkTFKwb59+4x58+bNuvqSyx5f/+zTn4pQSSaEhiY/QFA4AIUSaIzh088/C5lKYC6mRwuNmaiJRvFkx178fNcOxGRljKVAIBD4wwFEJQndiRHcsXMbVEWFmcdzxJHJ7d89PITb394GhVKwKfYcmoyZMVmRegcHX7r0vNPev3jx4qrDhw/b8/w79cF+gzinrX0fAcqnBVNRASgFXr6e3DIvge9qETh8+LDW2to655LzLrj/QF/vkzFJlnkIlg7Oh8zoX8KGgwcwomlQJQlBuhCTMaiqiqcOdWPE0KEQMr2fIIGgxFij/7t3v42uocGCRvAmY4goKu7cuR1HUmlEppAVgHHGVUmWDNM0Nz6/6dtvvNGum6ZJc/L8+wl3twGbvcyrDRzaOe0jQHlomaoKQLFWALc2Xj6h3LbMdt648w8fPmwuWbKk8sKzVn3oUF/vUxFZIVNJCeDZ6XzPHj6I4XQKckBfPucckiRj4+GDGNJ1kRtAICiQtFl8d6FzBj6F5BLnnEuEmoTzxDPPbbz+6ksue2LevHmzslP+APc+26+P9urfZyzTvXf2+oP9/EJO7fymjYzup1IpduTIEWnHjg5+3Xve9cm0rmmqrEhsitniopIE5DmK59noZSpG/wJBwci0+LTdUy0Il3OuV0iyvLtj3x3r1p73q2XLVtXn+P1z+9wgblmvUb99f8aN/oGprQDk+0d4CXl7vZuJKPfYfjPmugMYAB6Px42Ghobojtd3xF/c8uKnuGmaiixTNoWCAlVKIZP8b5OolSlQIBAURMIwwFH4VC1CSGbJ7ymSC4AxxqoUVT3Q17v+li9/5UcnnHBC85492yzh7zSdz2nEX4ggD3rOtGMqKwBeFKvt+WmSbjfhuOtk81RXXnDm2t8989zG68F4QiLU5Dzcq3dIlEJnJj64+BhURFSkGQvUiciUIpVO4drWRZgbrUDKNKdE5yMQhAVCCBjnOHteAxRZhlFAV0EJgW7oOLWuHtWKCj3khkfOuRlVVBzu739yzcpVH/jNb36jtbe35yb7AZwHX7nWAKeEP14Dunx/2Gk1+gemvgIQ9If3M+07lXkpAXBo55SBCgBw6NAhY9WqVY3r1p73q1372u+syAQF6gE/e1kgAHTOMScaxcVN82Gahm9aUSsj2axoBS5pmg/GGcgUM0EKBOVGyo7cL29pxQVN85HUtbxN+Ty7FsCXVqxEpSzDRHiTvjDGmCorUlrXtHded83fdHR08NraWjUb9Ofleg3aP9vLndrPKNO/xVRXAIDCXQH2siDWgNw2lqk/yDl827Zt2gknnNB8y5e/8qMDfb3rqxRVDXs8AEMmGcmdZ52HalXFsGFAdllkhBACiVIMjgzjcytOxjtaFohsgAJBgVgS7wvLTwLjHMjjOZIpxXA6hfObF+D8xiaMhDghF+OMK7JMuWmaL2558VPtr20fbGhoiMbjcQPj+1wvIe4lyIOcbz9nRrgBpoMCAAQT9l6ugCDt/ersVgDklqVSKdbe3o777rsvvWblqg8c7u9/MqqoCPPMAAogxRiqZAV3nXUB5qgqBo3Mgj8yIZAphUIpCCHQTRNDWhrvWnocPnP8ikynI2YACAQFIRGClGng/MZmXLNwCeLJBNQAcTUypdCz0wj/acVKAAg0fbccWBH/YJmI/wvOXPs7Qkjs0KFDucLf6wWMtw7ApQ1c6or6CiW4RlkJp1pYGEFSBOce55Mm2J4S2CpzSg1sbR0XE6qtrZXj8Xj6tIvWVj/1yBOvqooaTesaozS80pIDiEkSjqTT+OTmp/FUdycGNA3gDOAcFZEoZisqfrzmbFzbtggpk4FhagQeCQRhheNo5/Hep5/AH/bsRCxaAZVKMPlYsW7NuBnUNEQoxe8uuBRXzm8NdTpuxphWpajqm3t2/ceKJcd8ftWqVW1bt25NWdXZrZt7lcPZ128X+n6ughlp+rcI551ROKVcLMjaBlk0CBgv9F1fDQ0NCuc88Zs/3H/ZmavX/IwRQhhnnJACwu0nCTM7tY9z4FAygf9p3wXdNKGZJs6Y14i1DY2oURSkTHO04xIIBMXBOIdCKQzG8P03X8UdO7eja2gIUUUBIQQcHBSZmAEZBBc1teAfV6zEuqaWUK8BwBgzqhRVPtDXu/7v/+ZTH3/jjTdYe3s791jhD3BXBPIV/F5C38sqHKR8SjHd+ul8rQC5+0GEv708qBIwzkLQ0NAgHzp06MiTm55511mnnXkXIwi9EsDBQUCgUArF9jFTzITB2LRZf1wgCAscmY6jQpJxMJnAbW9vw507t0NnDDIl0AwDp8ypxz8sOwkXN8+HREjYR/5GlaLKh/r61p+2cuUHOjo6EI1GlZygP6cRvlukfyEBgn4uXad9BCifcoTzDimOUrkCrG2ucHeqC/oapxwsWbIksnv37kO5SoDJTFBKQ/2/cGA0NzlHxvxIXYIDS/FewPS8UQXTl1wJUYp7lwMwOUNUkqESip50KjO/nwCMcdRFo1AJxbChgyO8CYAY50aVrMiH+vrWL1+58gNseFjinNOBgQGnPP9uQj6o0Hc6Rs4xXMrs+3aEAhBivL5Tvq4Aaz/o6D+3jT0eAA5lo0rA489u+Ktzzjj7ThMcjDNKSLiVgImGcT5qviTIuCAY58LCIAg1lqCO0GzAHiHQGQPLptYu9fU5MjNwSvkeEwXj3KySFelgb++GFauOez8f4dQ0TTkej9un+3n5+r2W9XUz8+fr93c69iufkoT3bimOUrsCrG0QZcBJKfCMD8gqAQf//NQT77vk/AtvT5qGAUAO8D2nHZaQj0ky+vU0OM+4HqpkBQqlYmqhILRYs2MqJBk96RR4Vmm1RudxXSvZ2hh2KRT2J8JkzKxUVKl/aPClU1ac+M6hoSGZMSblCP9cYe/l5/fz+eeWwaH9jPf75xL2+6YYJsoVEEQRsMoDKQAAyDHHHKPs3Lkz3nnk8H0tc+ovGNY1g1I6o5QAxjmikgyNmXikex82HjkAk3MYjKG1shpXNC/Eito6DBu6sAQIQoXJOaplBUnTwHdefwU/370DBmMwTIZVc+bgCytWYV1TS6h98xMF55xJlIIwjkeeePS6a99xxfrW1tba/fv356b5BfIL+nM6L59R/4w2/VtM5zsxqCsg99hNCQgaG1DIiwIg0WiUNjc3c13RjRc3bf1VQ92c82eSEsCyswz2jgzht/t34fWBXlTJCoCMiTNlGohKMq5sbsOlTa0ww51JWTCDMDlHhSRhS+8R/POW5/F4135URKIAMg94QtdRqar4yomr8IXlJ8PgbPpJEhc454wSSijAN72w+eMXnnXOH+vr6+t6eno0uPv7ra2XoA/q9/fa2vedjv3KpzShjTgvAYVocn7lTvVuJqW8XqlUyuzq6qIjPSP0tJWrPnCor299laLKjDED0xyOTCChZjLclxX+cyJRSDnBhVWyAgLgN/t34dWBXqhUCm2CE8HMgSMTcJcwDHw5K/znVFZlEmVl799ZkQgA4KsvbcafOvcjQqVMdr9pjoPwv3/p0qVOwt/N5w8EtwYEFf5jPqLPsV/5lGc6KwBA8D/Oyy/kdJPk3qRBzFJ+Ny4DwNPptGGapjwyMkKXr1w5Y5QAxjkqJBkPH9iH17LCX2djR0km56AAKiUZv2jfjgEtDVksNywoM4wxVEgyfvDma1ifFf7pbC4M6940ssF5MTWCGzdvwMFkAiql0/redRL+S5Ysadi1a5eb8AfG94lBFveBQ1k+Qt+vfFoz3RUAIPgf7nWz5GtaCmp9GBX+VkE8HjdN01T4DFECOACFUgxoaWw6cgBVsgLDZYkEhkyq0wFNw8YjBxCdISMpQTjhACKShCOpJO7avQMVkSg00zmzN+McqiShL5nA3bvfzmTzC/dSIAXjJvx3796dRvCB0ejlbFs4tPUz7Qetd/w6HnVTnpmgAHgR9GZzamuV5Y78nUxZ9v3ctvZzGAAej8cN0zRlNjwszQQlAMh8+aB+fQ4uYgAEoYEjkxcjyB3JOA/90rzF4CD8H8gKfy23Wc42H4XAKe+/fUG2fPp0368TsN2UZaYoAIX8kX6WA/tNnLvvZOIHjpq1csucrsvj8bjJGJNmihLAOIfBGYKmE5rOnahg6kCQuXfTzH/pa6s25WIlmOq4CP95LiP/oNP9AGfBD4eyIJbYIJbfGcNMUQCAwlwBhZr63RQB+9bNEjCjlACTZ+b5t8aqkWKG5xQ/lp1rvbS6FgYvzYJDHMhM2cq+dMaEhUEQCJ0x1CgqVtXNQUrXPFfANDgHpRRnz2vIZvGbPpOwfIQ/MHbwA/gLfa++1t5f+rUP2vcHrZs2zCQFwIsgWqHXjeZmsnKqt1/f84FwVwK4xqeBkCIAeHbBkyuaFyIqyaMBf3YkQpA0Taye04CTZ81FmplF5QPgAAzOoBCKGkUdfdUqKqplRbgaphFuD2cxEAAmgKgk4asnnoIaRXFdD0OmFCOahmsXLsFlLa1ImdMnoRVjzJQohYfwt/dxdrN9bp1Te78+FAHLgroBZsxDPz3uwPwoZX4A+9YtSRBQZL6A2tpaiVJqVlZWsi2vvfbLebNnX5AwDMbBCZkGQwmDc9TICv7Y1Y579+9ClSSPWcmMc46EaWJuJIqvrTgNUUmCWYQFwOQcEUmCSii6kyO4e/fb0EwGmRCkTQOn1zfgivltoABGDB2YoLUOBBOLyTl49r+2UvNaVp5SZeUzslaAb72+Ff/84ibEIlFEJAkcWSWBcQwaGhZWVWPLFe9ClaJAc1FypxqMMbNKUaW0aeCZzZs+evE55zkJ/9wRO+AcD5V7DI/2duXAXua0te87HfuVT0tmap8WVAkIIvitfb+sgX7lgZSAeDyuz2ttjTz37LN/19DU9FlJkiTDNFiYVxEMipX//7WBXvyifTviWnr0aZQIweq6efjQouOgUAlA4TevlbXtYCqB23Zswx07t6FraAgY7bI5FEnGuqYWfHbZibioef5ornWRgXDqoDOGWkUFgDGpeWdHIohQCQnTgFmi/PlWGuC/dHXgbzY/jUPJBJC1HlEq4dq2xfivM9aiSpanjTJpLezTH49v2rZz561nn3baEwuWLq3ryEz1Azzcm9YlMF6Qu432nRSEIFv7vtNx0Lppx3S4DwvF7bu7WQFy94NmDHQb9XvVeb4ikYgUjUZJPB7vfvzZDe9bu+asnzFCQr+UcD5EJAkDWhobezKpgHXGsKS6FifPmpNJDVzkyL9aVvBQ5z5cv3E9DieTiMoyovLRhIsk225I1wAOXNu2CP9zzoWQCIFeorgDwcRh9eCVkoy/dHfgie5O3Le/HWnThG6aWDOvEefMa8Snj1+OalkpWXpegsySvQeSCfx8146spcHEmvoGXNbSCpOzaXP/HF3St3fDomMXvD/Zm9Tq6+trs0l+AHfhn1sHh3ova0AQlwE8ypyOg9ZNS6bDvVgohbgCcveDbJ0Efu5+wW6Bk046Kfraa68dfPzZDe9ae8bZP2PAtFECLEtANDvSBwATfDR6utCb1ko3/HBnB9674TEwADFZhuEyhSsjFAjiqQSuXrgE96y9AEo2gctMfnDCDEfmoTIZxw/feg3fe+s1DCcTqIhER/+3NDPBNA0XL1iIL520Chc0NpdskSmTc0QohZpz7wLAiJmJ250O981R4d+3ftnJx3yQj3CpqqpK6ejo8BL+yNn3SvDjZg2Aw77T1q3M6Tho3bRlOtyPxTAZ8QAWdmFvlRXsFli8eHFkz549hywlgBPAME1Oqa33mYJwYEySHwIUHfCnEIK+dBor/ngfhnV9NI7AD1WS0Dc0iJtOOxM3n7wag7o2Jj5BECY4KiQFf73hMdy/cztqKqsgZf3+FiSbprdPS0MlBI9echXOa2gqmSWAA6NJfjgy9+10CPjjnINzaFWKomaE/8kf5CMjlDEmx+Nxa2aS26g/iLnfqc7pGC7HcClzO/Yrn/bM9F4sH40wiKbppuk61Tnt55b5vvbs2ZNevHhxw7q15z3wzOaNHyeckypFlRhjU36iMUFmBG69ivW9m4xBpRJue3sb+pMJVMhy4Ah/3TQRi1Xizp3bcSCZQDQb4CUIF5kpohQP7G/HH/btwayqavCsCyn3wWGcQ2MMdWoUJuP4xqtb0JdOQ0JpJAFBJupfphQKpdNF+HMCwqoURT3c3//U6vyF/5jLubSz1zkdw+UYLmVuxwIIBQCYOCXAIkjCC6fAlkAKwZ49e9Lzlyypv/ic8/64Zesr1/XH45uqFFVinE+rXAHFwJGZqtWdGMEdO7dBVdS80rByACql6B4ewu1vb4NCKZhIRJQ3HBkTee6rVKmcOQCFEmiM4dPPPwuZSmA+2fk0ZqImGsWTHXvx8107EPNIQz2TYYwxWZIJAN7e0XHripNPvqGzs5MEEP72vi3IiN9L0DuVFSv8Z7RiIBSAwvG74fKxFOTu5x4HypbVuXu3Vl9fX3f2aaetb1nS9O5D/X3rq2RF5pyb0yFXQLFYo/+7d7+NrqHBgkbwJmOIKCru3LkdR1Lp0WlexeLU6003rFG3RAiqZWXMq0KWR+uLITP6l7Dh4AGMaBpUKdhqkSZjUFUVTx3qxoihQxELTI2BMWZGFJUSxszNz2+6fnFr61e0wUEWiUSCjPz9BjH2Nk5tcwki2IXwzwOhAGQoxArgVucl0J2u46QxBxr95756enr0BQsW1EZZVD719JM+dGRw8LEKWZEICGOMzfgbHQDSJUjBqnMGXoJ+w+QcBsvkHVAIGZ2TPt1SHFuCv0pWMKzr+GNXO+7v3IMHO/fgt/t3YWv/EUSpNKoIFPrL8uz7PHv4IIbTKcgBze6cc0iSjI2HD2JI10uWG2A6wBhjlYoqGZo2+NQzz9ywbu1595900kmt8XicpdNp62HyM/vnM/J3Gxi55QGAR5nTcdC6GYPs32TGwOEeFGivyz229r3K7DcrzSmz11tt7O38IB0dHXokEpE456S+tvYD6zc+c9UZp59xO5VkGKbBpkNwYDHIlBYd9VoKf67X/PSYopZ0fno5ycy6kDGoa3j48D48fbgbR9LJMQ+FSimW1dbhksYFWFZbN+qvL/SbRyUJyHMUz7OzQ6gY/QNATrCfqh7q71v/9a/f9Knb//M/B+bNmzf3tddeS1nNfF5AcVH+gHO/aC93E/6CAAgFYCwToQTktke2jMFdCbArDm6KhB0GgKTTaSOdTkv19fU15599zu8ff3YDW7vmrLuqFJUO65o5k5WAhGEUJVwIIUiaRiaPewHnW39eraJO6vz0csCy6zts6e/BXXu2YVDTEJUk1GQVn6PtgDcH+vD6QC9W183DjUuWAwQFZ3lUKYVcwEzYqJUpcIaTDfbjlYqsHu7ve2r1SSd/qLOzk8+bNy92+PBhA85C2slk79bG7Rw3i6mXgC90hC+UhSzC3jWefG6cIDel04MAOKe8zH0IchfP4AgYD2Bdu6enx1iyZEn9urXn/XHLKznBgYzpMy0ugBACxjnOntcARZZhFPD9KSHQDR2n1tWjWlHzNtWPmnOyUed/veFxfO+1l3EomUS/pmHENPFI1358+fln8VdP/gVPHOxCZR4zFcIEQyaZ05a+Hvxk5+tImQaqFQUSIeOCADk4KmQZVbKC53sP4b93vQGDMV9t145EKXRm4oOLj0FFRM2szhfgPJlSpNIpXNu6CHOjFUiZ5oxVBBhjpixJOcF+K2/o7OwktbW1UZvw9+qP7AucuaUBDjLyDzriD9IvB6mbcQgFoHiC3KSFKAFO+7ll9rrcB44B4LtzgwMXL77ucLz/qSpFVWZaXICUHblf3tKKC5rmI6lreY+seTZ965dWrMwIZuRnSSDImMM/smk9bnpxEyiA2bHK0RgAOesnr6uswmMHu3D5Y/+HZw4dRLWsTIgSYGVYtFZALNU7cAAyIRjUddzVvg3ggEqlrLB3hmWVgdlKBJuPHMRfDnYgJsl5BQYSADrnmBON4uKm+TBN71UlrXNMzjErWoFLmuaDcf8lfacrVk5/mIznBPvxSCSiZIP9vIR2kNE/XNq7DWKE8J8EhALgTL43Ub5KQO6xnxLgZwVw06gZAPT09GgLFiyoTfb1kRUnHndDe0fHrQB4haKS6ZAvICjWj/SF5SdlBEseHb1MKYbTKZzfvADnNzZhJE/TfFjmpyPnvaplBbU5KyAq2dF5sTDOEaUSNhzuwqCuISJJgQW5wTOxEc/0dKM3nRrNuhj4vZFJ9nTnWeehWlUxbBiQXfLuE0IgUYrBkWF8bsXJeEfLgpJlA5xKZONPWJWiSv3x+KYtr7xy3bq15/3x+OOPb43H42Y22M+rz8ntv9xG/3C4hr1szMeybf3K3I6D1s1YhALgTqE3U6mVgKBl1n6ubZoB4NngQFkb1Pji1tavPLPx6Rs1TRuszOYLmAkuAYkQpEwD5zc245qFSxBPJqAG8PvKlELPTiP8pxUrAYzPauIFR3jmp3NkBGSUSvhT5z58besL+MarW/Cvr29FbzqNalkpyvyd+a4UR9IpPH24G1EaXPhb58uU4kgqiQ093YhQmtf5FECKMVTJCu466wLMUVUMGsboQj1WYh5CCHTTxJCWxruWHofPHL8io9TNsBkAjDGTACwmK7RvaPCxpcsXv+fs007bUF9fX7d9+/YUnEfn9sGJtXUb5XuN8J0sB0L4TyIzS90tjGLXDMjdd0oNbJUTWzv7OUHSBude12mdATp//hK5s3P3yCc+9alZ3/rWN3/SMLvu/IRhMMYZoZRO6/uBI/sjAHjv00/gD3t2IhatyJqoxwpYKyJ8UNMQoRS/u+BSXDm/Ne/APJNzxCQZf+7KrD9AKEUQhYsSgpSh4+KWVvzm3IsyPvEiVpHjAMA5hg0Df/vcs3hg3x6MGoAIQUNFDP995rm4tGUBjAJnIFgLLf2hqx2/3b8LtYqat1WBILM0dLWi4OvLTxvN2JjPp+EAYpKEI+k0Prn5aTzV3YkBTQM4AzhHRSSK2YqKH685G9e2LULKZGCYHov0BMUy+ad0nT//4vPXn3/2OX+qra2Nqaoq9fT0GPDP1++mDLjVEZc2sJXBodytzO3YjlAAXJhJ93wxTJYSYG3dlAEnJSD3OgTuCwyNltfX18s9PT2J+fPrK5/etOXTDU1Nn43IspScAbMEGOdQKIXBGL7/5qu4Y+d2dA0NIaooIISAg4MiEzMgg+Ciphb844qVWNfUUtAaANZa8f/08gv4zisvYnasMlAAIQFgAIhQim1XX4c5kQi0AiPjGQCVEAzrOk79v/uxd3gINbIKiZJRpShtmkikU/jmaWfhqyeuKui7WgrA7zv34P6O3QUrACbPBAbevOJ0xApQAKzPEpUkcA4cSibwP+27oJsmNNPEGfMasbahETWKgpRpjv4GMwGeicVgVbJC++PxTW/u2PGjc9aseaK+pn52z2CPifEmfad9NyFv/ZRupn+nYzjUw7YvhP8EIaYBBsOrj7DX5R477eeWWdMB7fUWTlML4VDvdE37dUzrvXp6eoxIJBIdGtLY4tbWr/x5/RNvnHvm2lsrVbVmxNANAsjTNRiKEgKDc1BCcNPJq/HJY5fhtre34c6d26EzBpkSaIaBc+Y14h+WnYSLm+dDIgRDhl7UAkDlnJ9OOYdEJdz43DPYPzSEWZEIDMaQGwcqU4qqaAW+9/rLOKu+Aec1NGHELMwnXny2heKvIRECjZkgIGiMxUbdNxYpZiJhZAIFp+edPh7GmEkJIRWyQo8Mxh8/bvnij/V19aXr6+fX9fR06nAWzvb1TNxcj0HbOAlwIfzLhFAAgjOZSoC1DxzVqK3zcqWQ/UGjtnLrfEv4j5an02kznU6TlpbFC95x/kWPfOJTn9r8rW9+8ycNdXXnjxg645xzQsi0tAZYP+igoaEuGsVNJ5+KTx+/PDO/nwCMcdRFo1AJxbChg6P4BEDlmp9uco5KScbDXfvxwN7dqFQjjvEE1hLM8XQK33r9ZayZ+47R4MN8318rMrY0E9FvFp0e2BLtGmNIskzWWo6MEmi9ZgqMc71KUZWkrvNnNj37CcvkX19fH+np6dRymtpN+rn7biZ8JwuBWzsx8g8RMyvqZWLxukH9bu4gc/ydzneaa2s/dnpoR+u7uvZo9fX1sZ/99KcDq08++YbdHftuBQeplBWJca7n8f2nFASATDIBfoOGhhpFwWxVRa2ioi4ahc4Yhgy96KVcyz0/nWetHRsPHwLLph52w2QMUUXF1r5eDOpa3mlxLf/9kqpaqAFjHcZdg2QCJtti1agq0RRIgvGr880U0c85N5Ex+SsDg4Mbt7y29T3nn33Og/U19dXxeBxZfz/g3J8EDe7zm8nkVleo8PdDCP+ACAUgP/LVOvNRArweHMBdSYDtPCfN3E05AJBZRyASiVQMDQ2ZS1sXfu2117a+Z2AwvrFKVhTOOZ/OOQMsRcDgHDrnmW1WSJdiSlhY5qdHpYwxx/cG5hwRSgtyO1BCkGYmVs2ei2W1dUiYZmGjbAK8o6kNqpRRImaKsC41jDGzUlYkzjhp7+i4tW3pgo+cs3rNk/X18+t6BkcD/Zz6CKf+wp6YzE0hAMb3P7k4tXGrs+97lQWpE9gQCkD+TKQS4FTn9IA5zb31shz4WQqQTqfNeDzOFi1a1HLW6jVPti1t/ciejn0/IiBsJuQMcJpOUSrCMD9dyQp1PwgyVouCZxtkR+yXNLaCIz/hLRGCEUPH8to6LKudXbgCMcPhnPOjc/sHNm3duvU9i1tbv040wuvr62dl/f2AT5+A8f2I077bUuZOsQNBhD8KKAtSJ3BAKACFMVFKgJPQto/03R442NrnauxO17M//AwAb29vT9fX188iGuFLWhd+ZcMzGz6padpglaJKWWvA9FqubhIo5/x0iVJozMRHlxyLuooYNA+hqkoSkukUPr7kOMyNViBdgNuBEoIUM7GsZjZW181DXNegEH+FQiIEBmeQKcXlTW2ZwhmQn6KUZJ9PQ5YkEssG+i1Ztvi956xZs37RokXN8Xic9fT0WMF+fgv1eCUg80o+5jcY8Rv5BxkYOX59jzqBC0IBKJyJtAS4lfkKcIdzvXJ2w3YugIxLIB6P85aWxfMvv3Ddw5/7/OfPPDI4+FilrJAqRaWMMctvKAiIRAg0znDVgla8cc17cPWCNqiEYCCdxkAygf7ECAzGUKdG8NvzLsbvzr8YUUkGivRXE2SC4BorYrj9zPOQ0NKjiodVT5DJ3d87MozzW1rxj8tPQtI0QItQPHTOcOOS5VhdNw896eTossDjkltkg/FGDB0G4/i7Y07Csto6JMXoPy845yYllFQpqswNc+Dpp9ffUF876wNshEn19fW17e3taYx/5p36D/vAwc8KADiP9hFg61cGn7IgdQIPxBNWPH6/YTF5AuxlTlZq+7x/+z617cOlzvGcbM6ANAD2wpYXzlm69Ni/m11TuzZhGtN6psBEUa756Vasw/fefBX/+vpWjGgaYooy2nMm0ymsa2nFN09dg1PnzEXSNItyO3BgdPGfPx/Yh2cOH8CRdBJRST56wxECzTQBAiyrqcPlzW1YXluH4Sm8CmI5YJzrVbKijBg6P3jg4I/++atf/eW9v/xldyQSqUyn0xwYXbrCySIIjBfk47KJ2srdrI7wKUMeZfApC1In8EE8ZaVhspSAfAW//fzcIZ1bwqBx14tEIhQATafTAzX19bNf2bLl0/MaG/+hUlHIsKHr2bwB4l4KSMY3TqBQCsU2NTDFTBiMTcjo10rU8/iBLnzvja3Y2tsLWcpEx39syXH48okrUSHJJVuG2FJgYpKMXi2FDYe78UxPN0yWmZmgMxOtlTV4R9MCLK+dAwJkLA/iVgoE59wkhJCYJNOBwfjGbTt3/PtZq9c8AqCupqZeGcwk9rELYy+BbjfnA+MFvdN59v3cNvZrBCmDT1mQOkEAxJNWOibbEmBt3awDToqAkzLgJfyt3AEUAOrr6xVN01g8Hj+86aXnLzvhmOP+flZN7dkpzmEYOqPF2IxnIByZqXfWvmUOn8iHUmeZBXc0ztCXSmXejxDUR6JImkbBaYC9MDmHSikiVMKAngbj1nCUo0pWoFIJCVMH5xDCPwA8A6oUlSQMgx06cODfV5664r8GewYHFi5cOPfAgQPp7Mg/iNB2G+27+e/9XAOWpQE55blbvzL4lAWpEwREPG2lpdRKQO6+2zbImgJBj+3rCOTuj7ZduHBhZO/evUdq6mtmbXnh1c80Njd9tEqN1I4YOuecc6EIhBszmxtAoRTILtObZiakAMF6hcIB8GyyIQuS/Sws+3kE3mQFv6nIikzBkUwkN7z25ps/OWfNmodra2vnqapKs0F+wNj8+06+er/Uvl6KQ6ER/m4CP1/hH6ReEADx1JWeyVACrH0vS4DXfiBB73DuaFl9fb3S09NjAhj89D98uvHmW759a31NzcUAMKxrBiFEEm6BcJPbg07mH1Wu953KZIP8pApJQlLXBjY/t+mLF517wR8AkEWLFtW2t7dr8BbiXiN7v6x/9vPs5U7tcsuC7nuVBakT5Il4/iaGfJWA3LJi4gO8YgScLAhecQROCsOY+kgkQlpaWpQ9e/akAJgvbHnhnGOWHvt3s2pq16Y4h2kaBgChCAgEBcIYY4QQVMoKHdF1fqC7+9+/9o2v/eLeuzJBfpGaGjI4Npufk78/1yzvNtp3W7Evn/3crV+Zfd/p2I4Q/iVGdMwTRzFKgNu+l/B3ahfEBQC4LyFslVlxAE5liEQiEgCSCRKsmfXSC1s/29yy4MOVijJLA6DpmogPEAjyIOPlB6pkheicI5VMrH/1jTd/es6aNQ8DmFNTUy+7BPkFMd37RfO7jeqDjP5zt0H3nY7tCOE/AQgFYGKZCCUgd98+6vdTCpxG9V4KgZs1gDu1yU4ZNAEMvPdDH1p4yze+8ZHm5uaPVqmqiA8QCAIw3s8/sn7Hjp23nX7qqRsAsEWLFtV2d3fr6XTabqL3mrvvJvCd6nLb5NY7nV/oaF8I/5AgFICJZyItAUHqvFwAbmb/IAqBdTxmumEkEqH19fVSZ2enBmDk05/+dOPN3/72rXNrai4mAIYNnUMoAgLBGLIDflORFVkFkNL1gU3PbbT8/IhEItWRSASDg4NuU/tyzfdOAYBeVoDcY6vMz8wfVOD7CXsh/MuIUAAmh8mwBFhbgqN+PycLgZtbwOk6TsI+d/RvHRNbPYlEIlJLS4tkxQds3vLCuSccd/wnY7Gq8xVChCIgEGC84B/WtHhXd+c9N3/95rvv/eUvD0QikcqamhqSXbXPz1yf7zGQf3IfOGz9yuz7XmX51AuKRCgAk8dkKQHWvpvgdytz23cb/bspA3aLgBUfMARAeu7FF88//oTjbhSKgGAm4yj4Ozvvufnmr9597y/v3Qug2pbMB/AW/Pb9oMF8fmZ9P6FfiMnfrSyfekEJEArA5BLk9y7GJWDt56MM+LkE7HV+sQOO16upr5HSg2mk0+lhAFQoAoKZiI/g3wegqqWlJXLkyBHDlszH7pf3G+n71QX17Xsl9RHCf4ojFIDJZ6KUAGvfr84vVsCtbb6xAUEUAem5F188TygCgulOkBF/VvCb2QC/fMz9QDBTvl8CH7/Rfb4CXwj/kCMUgPJQaiUg99jNQpBbbvfdB1EGrPOcyuym/6CKQK5rwFERIFnsP4RAMBXIc8TvlXyHwHnkDwSfw++lADidF6Tcad/p2K0sn3pBiREda/mYaEtA7r7bsVd5IEHucj2nhYjyUgQqK6vOl0GQ4gyGYZiEECoUAcFUIZvAh6iyQhQENvUDwU34+fjzg55vVyJg25+oUX/QNoISIzrU8uP3HxRqCbD2gygGfoIa8BbqbnVBFQjYFYHNW1449/ilx34qWhE7JaooVToAzdBFZkFBaOHWKj2EkCpZIToAwzSP7N+379c33/zVn/sIfsBZiAPeq/bloxzY6+BTPhkm/6BtBBOA6EjDwWRYA/xcA9Z+ENdAEMEetP2Yc2rqa+RsjEAcQOzGGz9e//++9NUPzp8//6OVqlqbVQQ4F+4BQUjIyn0my7IUJRQGOBIjifVvbNt2+49+9KOX7/vVr/oARFtaWqIePv58971G+l4Bfl5l8Ghnb+N2jlu9G0L4lxHReYaHcroE7FsnpcFpPQB7eWDTv99+fX29PDg4yNLptAFg+L0fem/bzTd/62OtbW3vkyVprgII94CgbFij/Vwzf0rXh1PJxMvbd7390zNPPf1pACaAivnz58s9PT3M5uP3EsxBlIB82xci6CfS3x+0jWACEZ1muCiFEmA/zkf429sEUQ78Rvn5thmzH4lE6Ny5c6Wurq40gOS7P/CBus985jOnLD/++E/FYrFVOe4BYRUQTDj20b4OwDTNI+372v/3x9/+7i9+euedRwAkIpFIbaQmgvRg2sya+gF/wW9hX50vHx8+h/vUPTfBXqiPXwj+KY7oKMPHRCoBbm28FIF86goe8buUjVoXchQBHUACQMWnrr9+7t99+YsfWbxw8fskYRUQTBBuo/1EIrH1ze3bf/rjH//45ft+9at+AJFIJKJUV1dLR44c0XMvAX/hDYcyNzN9IdeCQzkc6oTJfwYhOshwEvR/yccl4FYXdGvtOwlqwN1FEERZsJ/rdB4A0EgkgpqaGinrHtABpHysAiYhRAQOCvIiR+gzSZblKMjoaH/P3j2//s/v/Ns92dF+EkBlS0uLnPXvT5SwD3IN4tPe7frwqPdq41dWSBvBJCI6xXBTLmtAUEWhVGVOwt7XYpC1CtCuri4DwAiAihs//vH6v//Klz+8eNHi90k0YxXQAOiGDs65IZQBgRu5Ql+WZTmSvdUcRvt9AKLWaH9oaMhwMPPDduxVlq+C4KUsFLO17/vV+ZXn20YwyYiOMPxMpBJgPy7F1skq4BcTUEjZ6L7NKmAASF5zzTWzb/zbvz1z2XHHnTG3seGvVEWtF8qAwI6r0Df0keFE4uWR4ZGn/+1btzz0k5/cfhDBRvv2bZAyYKyvP7ed18je3s5+zSACP0i5U51bWSFtBGVCdH5Tg0KVAKfyfK0BXucEcQ/k0y63LKiSYVcGSE6sQBIAC6oMAIBQCKY3mcR88Bf6t9zy0E9uv/0ggDiA2ggiUk19DR0cHDTT6TSQv4+eYHySHS/rQD7t3N7brx0cyv3qvMoKaSMoI6Kzm1pMhDXAfuwm9L2UBS+B7XS+vY1XDIB936vN6DYSiZCamhqqqioNqgxwcBiGYXDOqZhNML3IDvRNSqksSRICCn15TvMcqbe3174wDwJug7oC3NoEfT8/U779fZyuY993OvYrz7eNoMyIDm7qUQ5rgJeFIB/B7Gbet0ZIXoGEQd933DYSidCsMkCy8QJJAOZRZeCYM+rmNb6bUlpRqSgxAEiDQ9d1EwAX1oGpRe4oHwAjhMiKrEAFkGQmZJD4wNDQ64mRkQ0BhT58tsUoA07mfXsbt/dx2/d6X6f9IMduZU4I4T9FEB3a1CTo/1Yqa0DuflCFwMsSUGibvKwATlsrXsCmDOjr1q1rXrx4ceyfb7nlqopYxbnVscpTIrJcCYyzDkAoBOHCLvAzo3wZkWy9DkDT9Z4jBw/+/s0dOzb/9q7/eeGeX9+jAehD4UI/d2vtFzNy93MDuLXzaw+HYzHqFwAQCsBUppRKgFOZm3B2q/erCzKaD7L1syj4fb5xyoCiKLS7uzsj57MjwRtu+Oi8z33xq+9WIkp1Y0PjdYTSaKWcsQ4IhaC88ByJDweBn2QmJGCwbzD+imLy517YunXH7f/1X88++OCD/QAkAFEAtLm5WQ4g9J3KgrT3KvcboeerSLid77Uf5NitzAkh/KcgosOa+kyGNcCvPIgSYC8LIsC9LAR+nyOoYgJklAECAHPmzJF7u3vNNNI6gGEA9LyLL25sa22Kffmfvv5uRZWrnBUCwDQNMMaMrB4glIISYBf2hBAosiJzwFXgb37ppR33/vKXG3/1q1/pAHoBxJDJxS9rmsYHBwdNAMiZugfkP+rP19zv1Sa3LN+Rv9/nt+87HedT5oQQ/lMU0TlND4pRApzKg7gFvCwDXoqBXxsnJYHncU4+W9eySCRC5syZIwNAjnVgCA4KQcO8xvcoiiwRSmus4DIvpQAQioETQYQ9AAxp6WGFUgwMDr6scDy3+aWXdvzvPfds+vWvf63hqMCPAKCLFi2Sh4eHmS16P3frVDYRWz/TfZDzgryXWzt7uduxX3mh7QQhRHRC04d8/stCrAH2MjeTu/3YzWTv18bv/AlXAqztqHWguVlGOm1XCMjll1++oLa2NvW+j3zkzJOOP/7kJDOUluaW9yuKQnOVAh3WPLCj7oMsY9IWT2flgOd8aXBuApkfklIqy5IMDj4aoQ8cFfbx4aGtpm4+NxCPy7fcfPOvk4OD6YceemgIGT9+DBmzPlm4cKEyMjJiDg4OMgDIWYDHeqvcbdCyYgS+n+DPR6DnY+IXgl/gy7TtaGYwk2kNyD0OMuq3tkGsCG7biRD4eVk4HBSCNDIzGFLZF73iiivm19TUpMcqBfPfJ0lUMRmj1WoklnNNpGGZOsYqBwQAsjEGuYRNSRgj2MeWMUIIOOdjhDwFgZLTNg0O0zAGKKDEh4de9hD2EoDq7GnywoULZZvAL8Rc7lRW6NZeVsh5btfw+8z2fbeyYsz9+bYVhJhQdSKCklFqa4BTmZ/wtvaDjvqDmvm96ko++ncoG7dvKQQ1NTW0qqqKpo8qBQQZ2Z4CIF144YXNlZWVqJlTE/nKV256TyQSiSgRJamq6pmzqmtWGowxAHKVTTmwLAe5b2pYrgWM743dlIZisIS5Ux0hBLIsyyTnE9rN9kBGyBuGMQhAYibTuru7fsPBkyqR5Dd3vLX19tt/tjnGeey3DzzQj7HCngCQFi5cKOu6zo4cOWL34RciIAsR/vm0tZ8T5JjY6rysAG71+Rz7lRfaTjBFEArA9KZc1gCnfae2hVgA8tkW2savzHffRymw3AdAZs34uqsvv7x2iDHW1Dgn8pWv3PQeRVFUBsbAEWlubnlP1nIAAhBKJVOSpZrIuJ/0KE5KQ6E4CXM7w1o6ARDGwQkBTJlSOjA0+IqmaZuHh4ejUSLhzZ3bt959+882c85jPfG48eyTT3bhqFBRAVRkP7a8cOFCWdM03tvbawLgLsLeflwK4e9UVmqrQG6ZXxu/63m1L6TMDSH8pyFCAZj+FGsNcCr3sxAEcQO4lRUrvCfcBZDn/uixpRQAIHOamyUAUDkne/fuNQAYGK8ccAB07YUXttREo1TXdUSqqqgaJYmPfuQTZy4/5vhVSWYwQgjNvAkFCOeUUHWs0lDMY85ZrjBPDCdiDIwBACGEU1Bimqb2r/96y296eno0alKaZoxVyDJ5+OGH4zg6kgfGCnnS3NysqqpKCCE8G6iXa8Yf/QAB9oO0K1boF1oX5LrWcRDB7/a+Tu3cyrzKC20nmIIIBWDmUGprQJCyIILWXm93BcDh2F6W72h+Qkf/DvtOx2PK7MpBBADnnGiaxnOCDi2seIO0wzU5AGnthRc2W0rDGGd7nhgG4TnCvB9jszXmYpnqrc8A5IzkI5EIcoU84Cno/Y7DYAUI0iaoIlPsiN+prFjBn29bwRREKAAzj8lQBPJxDdj3g5RNtMCfSMGfrzUlVzmw6rjlWrCf6KE0FPKs556fEeaE8PG+faC3u9u0tbcLePv18imbDCtAvnXWftD38Wqfz/l2xKhfUDBCAZiZTIRbwKksHxdA7nEQgZqPcuD33qUe/edTl29ZkDq70lA0tjn0ThRSl8+o3348mVYAa79UioDf+X7n5lPmVV5oO8E0QSgAM5tiFYFCy/JRBJxcAk7n5qso5FNWyH4hx/mU5VM/UfgJjHwEUqHCP0i7UikH1r5f+yDnE4y/ltd5+ZZ5lRfbVjBNEAqAYLKsAU5lfgI4SJtS1ZdK8E+UEhCkLp82hVDsSLJYwW8/LoUVwK/e7/3cznES8IUoMV5l+bYNer5ghiAUAIFF2BQBt7pcq4C9jVfbUigWQff96vzaByn3q/PD6dxChUEhloBSWgG86ooV6l5lQd+jkDZeZfm2dUMI/xmOUAAEueR7P0yWIlCoC8GtTSGCu9yj/3KO/J2YSPO/U1kxLoAg+27XydeSkDvyJy5tSy34vcqLbSuYxggFQODEZCsCTuVuwjp3RB/EEuB0DbeyoPuFtnM6zqcsSF0xbd0o1vTvVVeMC8B+XMx+7nEhQjuodcHr2K2skPJi2wpmAEIBEHgRJkXA6dhPSXBr73WtoPuFtsunjVd50PqJZiItAaV2AXgd5yvo7ee4jfaDXNOtrJByN4TwF4yj3J2HYGoQNkXA7zq5wj+IMlDItYv9jEHb+JUX2q4YggiTiXQB2I+LHZ3nc76bib9QIS8Ev6BsCAVAkA8TqQi4lecrkL3cAm7KgNd1g16/0ON8yoLUFdPWiVKZmMttCfCq92rnJ+jz+Tx+5YX8fqVqL5iBCAVAUAjlUAScyv1M/0GFtZ9yUOzIfiJH/uV+hifSBeBUlo+wttcFvfZECf2gnyNoXSnaC2Yw5e48BFObcikCTnWlDMTLR8gX6ssv5W9RSLtiKMYF4FZXrCXAqcxPSNuFvNex3/Xcygop96srRXuBQCgAgqIp5B4qxLxdqNvAzzLgJJjzNfP7tXG6Zj7Xyre+0LZOlFIQBRWEbsLVLpDtbfM1vwdRAoJ8Ljcm2r9f6DkCAQChAAhKS6ksAl51+Z6TrzLgJPwL8fsHvY6bYuB03XzrJ4tiLAKFuggKsSIU62LwK/MqL/ScfK8lEAQmLB2IYHpRSqtAocFw+SoDQdsEOS/I+we5Hs/Z96Jcz3EpXAFuZnY/H7xbuf1aTtfP15LgV17qc7wQgl9QMoQCIJgoCr23SinwveqC+PwLFf75lvu187IS5PO+pSBXADkJUre2TnVu5wcdqQcR7vmUuX1ONyairpTnCASeCAVAMBmUOk7Aq76Q84ox4cOjPN/P5/WdgigBTgK1FM+40zX9BFLu5w0ivN3ey6t9PiN8t8/hRFiEfjHnCQS+CAVAMJlMtlXArT5f37uXQmBv72W69wsG9PtMQZWAXIK6EZxwOzeo8C+ldSAfJcDtPQr1wRcj2IXgF4QWoQAIysFEKAITWR9UkPu5CLyEv1e93/W9cBuFT8S5Tv77IO3tZflYBybiHK/zgtQLoS+YEggFQFBOirn/JlLYBxHEQc/zswjAo96t7US4VJzIVyDZv4dfwJ2XiyCf9wtybrEj9UIVmiAIwS8oC0IBEISFMCoDVl2hCgE8zvVSDJyuG9SUbxe4bu2dhE6QtkH9/7lt/Ubn+VzTryxoXaHvWUibiThXICgaoQAIwkax92SxyoBfm6CCuxhzv9PIOKgCYr+um5Bxul6Qtl7BfV7X8zO3+33myRLWQugLZgxCARCEmYlWBvJpU0gAXr5t8nEJOLUv9DP54acYBBWaQdrnI4AncxRfrOAWgl8QOoQCIJgqhEUZyKddPu8b1LdfiFtgoihmlkAh7zHZwlwIfcG0RigAgqlGKe7ZUgv6fKP487l2oZ+pkOuUSmAF9bEX+96lvn4pvr8Q+oIpg1AABFOZiRSGpXi/QqbtFfpefteZjGmAfuQbTOh2binbC6EvmLEIBUAwXZhsZaCY9yzlfP5yP8Nuswkmc0rcRFsaJvI6AkHZKHfnIRBMBKW8rwsZ9U/m+xV63SDTAEsp5ApxC7hdZyLbT9a1BIKyIxQAwXRnIu7xcpr07dcr1MVQCvKZEljo9SfjnMm8nkAQGoQCIJhphEUhKMW504EwzqkXQl8wI5jpnY9gZjPR93854hLCxlTwuQuBL5iRTOWORSAoNZP1PEzG+5T6PSZLSE7G+wiBLxBAKAACgRfleD5mwjM52QJYCHyBwIGZ0NkIBKUiLM9LWD6HnbAI2rB8DoEg1IS1IxEIpgriGSovQtgLBAUiOi+BYGIQz1bpEcJeICghopMSCCYX8cz5IwS9QDAJiM5IIAgXM+GZFAJeIAgBM6GzEQimMtPhGRUCXyAQCAQCgUAgEAgEAoFAICgL/x+n85W+blSFGAAAAABJRU5ErkJggg=="
};
let brandDataCache = null;

async function fileToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`تعذر تحميل أصل الهوية: ${url}`);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("تعذر تحويل الشعار."));
    reader.readAsDataURL(blob);
  });
}

async function getBrandData() {
  if (brandDataCache) return brandDataCache;
  try {
    const [school, guidance] = await Promise.all([
      fileToDataUrl(BRAND_ASSETS.school),
      fileToDataUrl(BRAND_ASSETS.guidance)
    ]);
    brandDataCache = {school: state.account?.school_logo_data || school, guidance};
  } catch (error) {
    console.warn("تعذر تحميل الشعارات من الملفات؛ سيتم استخدام النسخ المضمّنة داخل التطبيق.", error);
    brandDataCache = {school: state.account?.school_logo_data || BRAND_DATA_FALLBACK.school, guidance: BRAND_DATA_FALLBACK.guidance};
  }
  return brandDataCache;
}

const el = {
  setupPanel: document.getElementById("setupPanel"),
  modeHint: document.getElementById("modeHint"),
  selectedModeName: document.getElementById("selectedModeName"),
  filesHelp: document.getElementById("filesHelp"),
  usageHelp: document.getElementById("usageHelp"),
  fileInput: document.getElementById("fileInput"),
  dropZone: document.getElementById("dropZone"),
  fileList: document.getElementById("fileList"),
  reportTitle: document.getElementById("reportTitle"),
  period: document.getElementById("period"),
  schoolName: document.getElementById("schoolName"),
  academicYear: document.getElementById("academicYear"),
  threshold: document.getElementById("threshold"),
  shortTestThresholdRow: document.getElementById("shortTestThresholdRow"),
  shortTestThreshold: document.getElementById("shortTestThreshold"),
  finalExamThresholdRow: document.getElementById("finalExamThresholdRow"),
  finalExamThreshold: document.getElementById("finalExamThreshold"),
  includeNames: document.getElementById("includeNames"),
  notes: document.getElementById("notes"),
  analyzeButton: document.getElementById("analyzeButton"),
  resetButton: document.getElementById("resetButton"),
  exportButton: document.getElementById("exportButton"),
  printButton: document.getElementById("printButton"),
  statusBox: document.getElementById("statusBox"),
  resultsPanel: document.getElementById("resultsPanel"),
  resultModeBadge: document.getElementById("resultModeBadge"),
  resultsSubtitle: document.getElementById("resultsSubtitle"),
  kpiGrid: document.getElementById("kpiGrid"),
  classesTabButton: document.getElementById("classesTabButton"),
  overviewTab: document.getElementById("overviewTab"),
  classesTab: document.getElementById("classesTab"),
  topTab: document.getElementById("topTab"),
  riskTab: document.getElementById("riskTab"),
  subjectsTab: document.getElementById("subjectsTab"),
  shortTestsTabButton: document.getElementById("shortTestsTabButton"),
  shortTestsTab: document.getElementById("shortTestsTab"),
  finalExamsTabButton: document.getElementById("finalExamsTabButton"),
  finalExamsTab: document.getElementById("finalExamsTab"),
  printDocument: document.getElementById("printDocument"),
  pdfFixedFooter: document.getElementById("pdfFixedFooter"),
  pdfFooterSchool: document.getElementById("pdfFooterSchool"),
  pdfFooterTitle: document.getElementById("pdfFooterTitle"),
  printReportTitle: document.getElementById("printReportTitle"),
  printSchoolName: document.getElementById("printSchoolName"),
  printPeriodYear: document.getElementById("printPeriodYear"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authFullName: document.getElementById("authFullName"),
  signInButton: document.getElementById("signInButton"),
  signUpButton: document.getElementById("signUpButton"),
  signOutButton: document.getElementById("signOutButton"),
  currentUserName: document.getElementById("currentUserName"),
  databaseStatus: document.getElementById("databaseStatus"),
  openArchiveButton: document.getElementById("openArchiveButton"),
  archivePanel: document.getElementById("archivePanel"),
  archiveSearch: document.getElementById("archiveSearch"),
  archiveTypeFilter: document.getElementById("archiveTypeFilter"),
  refreshArchiveButton: document.getElementById("refreshArchiveButton"),
  archiveList: document.getElementById("archiveList"),
  saveAnalysisButton: document.getElementById("saveAnalysisButton"),
  loginPage: document.getElementById("loginPage"), appShell: document.getElementById("appShell"), loginStatus: document.getElementById("loginStatus"),
  currentUserEmail: document.getElementById("currentUserEmail"), currentUserPlan: document.getElementById("currentUserPlan"), subscriptionExpiry: document.getElementById("subscriptionExpiry"),
  schoolProfileName: document.getElementById("schoolProfileName"), schoolLogoInput: document.getElementById("schoolLogoInput"), schoolLogoPreview: document.getElementById("schoolLogoPreview"),
  saveSchoolProfileButton: document.getElementById("saveSchoolProfileButton"), requestPremiumButton: document.getElementById("requestPremiumButton"), openAdminButton: document.getElementById("openAdminButton"),
  adminPanel: document.getElementById("adminPanel"), subscriptionRequestsList: document.getElementById("subscriptionRequestsList"), premiumUsersList: document.getElementById("premiumUsersList"),
  headerSchoolName: document.getElementById("headerSchoolName"), headerSchoolLogo: document.getElementById("headerSchoolLogo"),
  paymentModal: document.getElementById("paymentModal"), closePaymentModalButton: document.getElementById("closePaymentModalButton"),
  whatsappContactButton: document.getElementById("whatsappContactButton"), paymentConfirmCheckbox: document.getElementById("paymentConfirmCheckbox"),
  paymentPlanInputs: Array.from(document.querySelectorAll('input[name="premiumBillingPeriod"]')),
  paymentModalDescription: document.getElementById("paymentModalDescription"), paymentConfirmText: document.getElementById("paymentConfirmText"), paymentSecurityNote: document.getElementById("paymentSecurityNote"),
  confirmPremiumRequestButton: document.getElementById("confirmPremiumRequestButton"), securityWatermark: document.getElementById("securityWatermark"),
  screenShield: document.getElementById("screenShield"),
  openSupportButton: document.getElementById("openSupportButton"), supportChatToggle: document.getElementById("supportChatToggle"), supportChatPanel: document.getElementById("supportChatPanel"),
  closeSupportChatButton: document.getElementById("closeSupportChatButton"), refreshSupportChatButton: document.getElementById("refreshSupportChatButton"), supportChatMessages: document.getElementById("supportChatMessages"),
  supportChatInput: document.getElementById("supportChatInput"), supportChatSendButton: document.getElementById("supportChatSendButton"), supportChatStatus: document.getElementById("supportChatStatus"), supportUnreadBadge: document.getElementById("supportUnreadBadge"),
  adminSupportThreadsList: document.getElementById("adminSupportThreadsList"), adminSupportMessages: document.getElementById("adminSupportMessages"), adminSupportReplyInput: document.getElementById("adminSupportReplyInput"),
  adminSupportReplyButton: document.getElementById("adminSupportReplyButton"), adminSupportThreadTitle: document.getElementById("adminSupportThreadTitle"), adminSupportThreadMeta: document.getElementById("adminSupportThreadMeta"),
  adminSupportStatusButton: document.getElementById("adminSupportStatusButton"), refreshAdminSupportButton: document.getElementById("refreshAdminSupportButton")
};

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function cleanText(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function normalizeArabic(value) {
  return cleanText(value).replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}
function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString("ar-EG", {minimumFractionDigits: digits, maximumFractionDigits: digits});
}
function formatFileSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} كيلوبايت` : `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
}
function showStatus(message, isError = false) {
  el.statusBox.hidden = false;
  el.statusBox.className = `status-box${isError ? " error" : ""}`;
  el.statusBox.textContent = message;
}
function hideStatus() { el.statusBox.hidden = true; }
function activeMode() {
  if (!state.mode || !MODES[state.mode]) throw new Error("اختر نوع التحليل أولًا.");
  return MODES[state.mode];
}
function setActiveTab(tabName) {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === tabName));
  document.querySelectorAll(".tab-content").forEach(x => x.classList.toggle("active", x.id === `${tabName}Tab`));
}

function selectMode(modeId) {
  if (!MODES[modeId]) return;
  const changed = state.mode && state.mode !== modeId;
  state.mode = modeId;
  const mode = MODES[modeId];
  document.querySelectorAll(".mode-card").forEach(card => {
    const selected = card.dataset.mode === modeId;
    card.classList.toggle("active", selected);
    card.setAttribute("aria-checked", selected ? "true" : "false");
  });
  el.modeHint.textContent = `تم اختيار: ${mode.name}`;
  el.modeHint.classList.add("selected");
  el.setupPanel.hidden = false;
  el.selectedModeName.textContent = mode.name;
  el.filesHelp.textContent = mode.filesHelp;
  el.usageHelp.textContent = mode.usageHelp;
  el.reportTitle.value = mode.reportTitle;
  el.period.value = mode.period;
  el.notes.placeholder = mode.notesPlaceholder;
  el.shortTestThresholdRow.hidden = !mode.supportsShortTests;
  el.finalExamThresholdRow.hidden = !mode.supportsFinalExams;
  if (mode.supportsShortTests) el.shortTestThreshold.value = "50";
  if (mode.supportsFinalExams) el.finalExamThreshold.value = "50";
  if (changed) resetFilesAndResults();
  el.setupPanel.scrollIntoView({behavior: "smooth", block: "start"});
}

function gradeStage(gradeNumber) {
  if (gradeNumber >= 1 && gradeNumber <= 6) return "primary";
  if (gradeNumber >= 7 && gradeNumber <= 9) return "middle";
  if (gradeNumber >= 10 && gradeNumber <= 12) return "secondary";
  return "middle";
}
function gradeOrdinal(gradeNumber) {
  if (gradeNumber >= 1 && gradeNumber <= 6) return gradeNumber;
  if (gradeNumber >= 7 && gradeNumber <= 9) return gradeNumber - 6;
  if (gradeNumber >= 10 && gradeNumber <= 12) return gradeNumber - 9;
  return 1;
}
function makeClassLabel(gradeNumber, classNumber) {
  return classNumber ? `${gradeOrdinal(Number(gradeNumber))}/${classNumber}` : "";
}
function gradeOptionsHtml(selectedGrade) {
  return GRADE_STAGE_GROUPS.map(group => `
    <optgroup label="${group.label}">
      ${group.ids.map(id => `<option value="${id}" ${Number(selectedGrade) === id ? "selected" : ""}>${GRADE_NAMES[id]}</option>`).join("")}
    </optgroup>`).join("");
}
function inferGrade(filename) {
  const normalized = normalizeArabic(filename);
  const hasPrimary = /ابتدائي|ابتدائيه/.test(normalized);
  const hasMiddle = /متوسط|متوسطه/.test(normalized);
  const hasSecondary = /ثانوي|ثانويه/.test(normalized);

  let ordinal = null;
  for (const [number, aliases] of Object.entries(ORDINAL_WORDS)) {
    if (aliases.some(alias => normalized.includes(alias))) {
      ordinal = Number(number);
      break;
    }
  }
  if (!ordinal) {
    const numericPrefix = cleanText(filename).match(/(?:^|[^0-9])(1[0-2]|[1-9])\s*[-_/]/);
    if (numericPrefix) ordinal = Number(numericPrefix[1]);
  }

  if (hasPrimary && ordinal && ordinal <= 6) return ordinal;
  if (hasMiddle && ordinal && ordinal <= 3) return ordinal + 6;
  if (hasSecondary && ordinal && ordinal <= 3) return ordinal + 9;

  // الملفات المختصرة مثل 1-1 و2-3 لا توضح المرحلة؛ نحافظ على التوافق
  // مع ملفات المدرسة الحالية بافتراض المرحلة المتوسطة، ويمكن تعديل الصف من القائمة.
  if (ordinal && ordinal <= 3) return ordinal + 6;
  if (ordinal && ordinal <= 6) return ordinal;
  return 7;
}
function inferClassNumber(filename, gradeNumber = null) {
  const base = cleanText(filename).replace(/\.[^.]+$/, "");
  const pair = base.match(/(?:^|[^0-9])(1[0-2]|[1-9])\s*[-_/]\s*(\d{1,2})(?:[^0-9]|$)/);
  const expectedOrdinal = gradeNumber ? gradeOrdinal(Number(gradeNumber)) : null;
  if (pair && (!expectedOrdinal || Number(pair[1]) === expectedOrdinal)) return pair[2];
  const labeled = normalizeArabic(base).match(/(?:الفصل|فصل|class)\s*[:\-]?\s*(\d{1,2})/i);
  return labeled ? labeled[1] : null;
}
function setFiles(fileList) {
  const incoming = Array.from(fileList).filter(file => file.name.toLowerCase().endsWith(".xlsx"));
  for (const file of incoming) {
    if (!state.files.some(x => x.file.name === file.name && x.file.size === file.size)) {
      state.files.push({file, grade: inferGrade(file.name)});
    }
  }
  renderFileList();
}
function renderFileList() {
  if (!state.files.length) {
    el.fileList.className = "file-list empty-state";
    el.fileList.textContent = "لم يتم اختيار ملفات.";
    return;
  }
  el.fileList.className = "file-list";
  el.fileList.innerHTML = state.files.map((item, index) => `
    <div class="file-row">
      <div class="file-name"><strong>${escapeHtml(item.file.name)}</strong><small>${formatFileSize(item.file.size)}</small></div>
      <select data-grade-index="${index}" aria-label="الصف الدراسي للملف ${escapeHtml(item.file.name)}">
        ${gradeOptionsHtml(item.grade)}
      </select>
      <button type="button" data-remove-index="${index}" aria-label="حذف الملف">×</button>
    </div>`).join("");
  el.fileList.querySelectorAll("select[data-grade-index]").forEach(node => node.addEventListener("change", e => {
    state.files[Number(e.target.dataset.gradeIndex)].grade = Number(e.target.value);
  }));
  el.fileList.querySelectorAll("button[data-remove-index]").forEach(node => node.addEventListener("click", e => {
    state.files.splice(Number(e.target.dataset.removeIndex), 1);
    renderFileList();
  }));
}

function u16(view, offset) { return view.getUint16(offset, true); }
function u32(view, offset) { return view.getUint32(offset, true); }
async function inflateRaw(bytes) {
  if (!("DecompressionStream" in window)) throw new Error("المتصفح قديم. استخدم أحدث إصدار من Chrome أو Edge.");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzipXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  const start = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= start; i--) {
    if (u32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("الملف ليس XLSX صالحًا أو تالف.");
  const entryCount = u16(view, eocd + 10);
  let pos = u32(view, eocd + 16);
  const index = new Map();
  const cache = new Map();
  for (let i = 0; i < entryCount; i++) {
    if (u32(view, pos) !== 0x02014b50) throw new Error("تعذر قراءة بنية ملف Excel.");
    const method = u16(view, pos + 10);
    const compressedSize = u32(view, pos + 20);
    const nameLen = u16(view, pos + 28);
    const extraLen = u16(view, pos + 30);
    const commentLen = u16(view, pos + 32);
    const localOffset = u32(view, pos + 42);
    const name = decoder.decode(bytes.slice(pos + 46, pos + 46 + nameLen)).replace(/^\//, "");
    const localNameLen = u16(view, localOffset + 26);
    const localExtraLen = u16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    index.set(name, {method, compressedSize, dataStart});
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return {
    has(name) { return index.has(name); },
    async get(name) {
      if (cache.has(name)) return cache.get(name);
      const meta = index.get(name);
      if (!meta) return undefined;
      const compressed = bytes.slice(meta.dataStart, meta.dataStart + meta.compressedSize);
      let data;
      if (meta.method === 0) data = compressed;
      else if (meta.method === 8) data = await inflateRaw(compressed);
      else throw new Error(`طريقة ضغط غير مدعومة داخل Excel: ${meta.method}`);
      cache.set(name, data);
      return data;
    }
  };
}
function xmlDoc(bytes, label) {
  if (!bytes) throw new Error(`ملف Excel لا يحتوي على ${label}.`);
  const doc = new DOMParser().parseFromString(decoder.decode(bytes), "application/xml");
  if (doc.querySelector("parsererror")) throw new Error(`تعذر قراءة ${label} داخل ملف Excel.`);
  return doc;
}
function localNameElements(parent, name) { return Array.from(parent.getElementsByTagNameNS("*", name)); }
function normalizePath(base, target) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/");
  parts.pop();
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop(); else parts.push(part);
  }
  return parts.join("/");
}
async function readSharedStrings(entries) {
  const raw = await entries.get("xl/sharedStrings.xml");
  if (!raw) return [];
  const doc = xmlDoc(raw, "النصوص المشتركة");
  return localNameElements(doc, "si").map(si => localNameElements(si, "t").map(t => t.textContent || "").join(""));
}
async function readSheetPaths(entries) {
  const workbookPath = "xl/workbook.xml";
  const wb = xmlDoc(await entries.get(workbookPath), "هيكل المصنف");
  const rels = xmlDoc(await entries.get("xl/_rels/workbook.xml.rels"), "علاقات المصنف");
  const relMap = new Map(localNameElements(rels, "Relationship").map(r => [r.getAttribute("Id"), r.getAttribute("Target")]));
  return localNameElements(wb, "sheet").map(s => {
    const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const target = relMap.get(rid);
    return {name: s.getAttribute("name") || "Sheet", path: normalizePath(workbookPath, target)};
  });
}
async function parseWorksheet(entries, path, shared) {
  const doc = xmlDoc(await entries.get(path), path);
  const cells = {};
  for (const c of localNameElements(doc, "c")) {
    const ref = c.getAttribute("r");
    if (!ref) continue;
    const type = c.getAttribute("t");
    let value = null;
    if (type === "inlineStr") value = localNameElements(c, "t").map(t => t.textContent || "").join("");
    else {
      const v = localNameElements(c, "v")[0];
      if (!v) continue;
      const raw = v.textContent || "";
      if (type === "s") value = shared[Number(raw)] ?? raw;
      else if (type === "b") value = raw === "1";
      else if (type === "str" || type === "e") value = raw;
      else {
        const n = Number(raw);
        value = Number.isFinite(n) ? n : raw;
      }
    }
    if (value !== null) cells[ref] = value;
  }
  return cells;
}
function splitRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return [0, 0];
  let col = 0;
  for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64;
  return [col, Number(m[2])];
}
function parsePercentage(value) {
  if (typeof value === "number" && value >= 0 && value <= 100) return value;
  if (typeof value !== "string") return null;
  const m = value.replaceAll("،", ".").replaceAll(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 0 && n <= 100 ? n : null;
}
function findLabel(cells, exactLabels, startsWith = []) {
  const exact = new Set(exactLabels.map(cleanText));
  for (const [ref, val] of Object.entries(cells)) {
    const txt = cleanText(val);
    if (exact.has(txt) || startsWith.some(x => txt.startsWith(cleanText(x)))) return [ref, val];
  }
  return null;
}
function findAverage(cells) {
  const label = findLabel(cells, ["المعدل"]) || findLabel(cells, ["The Grand Point Average"]);
  if (!label) return null;
  const [labelCol, row] = splitRef(label[0]);
  for (const targetRow of [row, row - 1, row + 1]) {
    const candidates = [];
    for (const [ref, val] of Object.entries(cells)) {
      const [col, r] = splitRef(ref);
      if (r !== targetRow || ref === label[0]) continue;
      const n = parsePercentage(val);
      if (n === null) continue;
      candidates.push({priority: typeof val === "string" && val.includes("%") ? 1 : 0, col, n, dist: Math.abs(col - labelCol)});
    }
    if (candidates.length) {
      candidates.sort((a, b) => b.priority - a.priority || b.col - a.col || a.dist - b.dist);
      return candidates[0].n;
    }
  }
  return null;
}
function findClassNumber(cells) {
  const label = findLabel(cells, ["الفصل :", "الفصل:", "Class :", "Class:"]);
  if (label) {
    const [labelCol, row] = splitRef(label[0]);
    const nearby = [];
    for (const [ref, val] of Object.entries(cells)) {
      const [col, r] = splitRef(ref);
      const txt = cleanText(val);
      if (r === row && Math.abs(col - labelCol) <= 12 && /^\d{1,2}$/.test(txt)) nearby.push([Math.abs(col - labelCol), txt]);
    }
    nearby.sort((a, b) => a[0] - b[0]);
    if (nearby.length) return nearby[0][1];
  }
  const fallback = cleanText(cells.AA28);
  return /^\d{1,2}$/.test(fallback) ? fallback : null;
}
function findStudentName(cells) {
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const m = cleanText(val).match(/^اسم الطالب\s*:\s*(.+)$/);
    if (m) return m[1].trim();
  }
  return null;
}
function findSchoolName(cells) {
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const txt = cleanText(val);
    const labeled = txt.match(/^اسم المدرسة\s*:\s*(.+)$/);
    if (labeled) return labeled[1].trim();
  }
  const known = cleanText(cells.AD26);
  if (known && !["مدير المدرسة", "المعدل"].includes(known)) return known;
  const candidates = [];
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const txt = cleanText(val);
    if (["مدرسة", "متوسطة", "ثانوية", "ابتدائية"].some(x => txt.includes(x)) && txt.length <= 90) candidates.push(txt);
  }
  candidates.sort((a, b) => a.length - b.length);
  return candidates[0] || "";
}
function findYears(cells) {
  let hijri = "", gregorian = "";
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const txt = cleanText(val);
    if (/^14\d{2}(?:\/14\d{2})?$/.test(txt)) hijri = txt;
    else if (/^20\d{2}(?:\/20\d{2})?$/.test(txt)) gregorian = txt;
  }
  return [hijri, gregorian];
}
function validSubjectName(text) {
  if (!text || text.length > 80) return false;
  const normalized = normalizeArabic(text);
  const blocked = [
    "المواد", "المواد الدراسية", "النتيجة", "المعدل", "التقدير العام", "المجموع الكلي للدرجة الموزونة",
    "مجموع الدرجات الموزونة", "السلوك", "المواظبة", "النشاط", "مدير المدرسة", "الختم",
    "الرقم المرجعي", "الجنسية", "تاريخ الميلاد"
  ].map(normalizeArabic);
  return !blocked.includes(normalized);
}
function findHeaderCell(cells, aliases, preferredRow = null) {
  const normalizedAliases = aliases.map(normalizeArabic);
  const matches = [];
  for (const [ref, value] of Object.entries(cells)) {
    const text = normalizeArabic(value);
    if (!text) continue;
    if (!normalizedAliases.some(alias => text === alias || text.includes(alias))) continue;
    const [col, row] = splitRef(ref);
    matches.push({ref, col, row, value: cleanText(value), rowDistance: preferredRow === null ? 0 : Math.abs(row - preferredRow)});
  }
  matches.sort((a, b) => a.rowDistance - b.rowDistance || b.col - a.col);
  return matches[0] || null;
}
function numToColumn(number) {
  let output = "";
  let value = Number(number);
  while (value > 0) {
    value--;
    output = String.fromCharCode(65 + (value % 26)) + output;
    value = Math.floor(value / 26);
  }
  return output;
}
function extractSubjectDetails(cells) {
  const subjects = {};
  const short_tests = {};
  const subject_details = {};

  // تحديد أعمدة جدول المواد ديناميكيًا لأن مواقع الأعمدة تختلف بين
  // إشعار الفترة والنتيجة الفصلية.
  const subjectHeader = findHeaderCell(cells, ["المواد الدراسية", "subjects"]);
  if (subjectHeader) {
    const headerRow = subjectHeader.row;
    const nearHeader = (aliases) => {
      const candidates = [];
      const normalizedAliases = aliases.map(normalizeArabic);
      for (const [ref, value] of Object.entries(cells)) {
        const [col, row] = splitRef(ref);
        if (Math.abs(row - headerRow) > 3 || col >= subjectHeader.col) continue;
        const text = normalizeArabic(value);
        if (!normalizedAliases.some(alias => text === alias || text.includes(alias))) continue;
        candidates.push({ref, col, row, value: cleanText(value), distance: Math.abs(row - headerRow) + Math.abs(subjectHeader.col - col) / 100});
      }
      candidates.sort((a, b) => a.distance - b.distance);
      return candidates[0] || null;
    };

    const totalHeader = nearHeader(["المجموع", "total"]);
    const shortHeader = nearHeader(["اختبارات قصيرة", "short tests"]);
    const evaluationHeader = nearHeader(["أدوات تقييم متنوعة", "evaluation tools"]);
    const finalHeader = nearHeader(["اختبارات نهاية الفترة", "اختبار نهاية الفصل", "end of period tests", "final exam"]);
    const weightedHeader = nearHeader(["الدرجة الموزونة", "weighted mark"]);
    const maxRow = Math.min(maxRowNumber(cells), headerRow + 70);

    for (let row = headerRow + 1; row <= maxRow; row++) {
      const subject = cleanText(cells[`${numToColumn(subjectHeader.col)}${row}`]);
      if (!validSubjectName(subject)) continue;
      const total = totalHeader ? parsePercentage(cells[`${numToColumn(totalHeader.col)}${row}`]) : null;
      const short = shortHeader ? parsePercentage(cells[`${numToColumn(shortHeader.col)}${row}`]) : null;
      const evaluation = evaluationHeader ? parsePercentage(cells[`${numToColumn(evaluationHeader.col)}${row}`]) : null;
      const finalExam = finalHeader ? parsePercentage(cells[`${numToColumn(finalHeader.col)}${row}`]) : null;
      if (total !== null) subjects[subject] = total;
      if (short !== null) short_tests[subject] = short;
      if (total !== null || short !== null || evaluation !== null || finalExam !== null) {
        subject_details[subject] = {total, short, evaluation, final_exam: finalExam};
      }
    }

    if (Object.keys(subject_details).length) {
      return {
        subjects,
        short_tests,
        subject_details,
        table_kind: weightedHeader ? "percentage" : "period_raw"
      };
    }
  }

  // نموذج قديم للنتيجة النهائية: اسم المادة في U والدرجة المحصلة في M.
  for (let row = 25; row <= 120; row++) {
    const subject = cleanText(cells[`U${row}`]);
    const score = parsePercentage(cells[`M${row}`]);
    if (validSubjectName(subject) && score !== null) subjects[subject] = score;
  }
  return {subjects, short_tests, subject_details, table_kind: "unknown"};
}
const PERIOD_100_POINT_SUBJECTS = new Set([
  "التربية البدنية والدفاع عن النفس",
  "التربية الفنية",
  "المهارات الحياتية والأسرية",
  "التفكير الناقد"
].map(normalizeArabic));
function inferPeriodProfiles(records) {
  const grouped = new Map();
  for (const record of records) {
    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      if (!grouped.has(subject)) grouped.set(subject, []);
      grouped.get(subject).push({...detail, table_kind: record.subject_table_kind});
    }
  }
  const profiles = {};
  for (const [subject, samples] of grouped.entries()) {
    const numbers = key => samples.map(item => Number(item[key])).filter(Number.isFinite);
    const totals = numbers("total");
    const evaluations = numbers("evaluation");
    const finals = numbers("final_exam");
    const shorts = numbers("short");
    const isPercentageTable = samples.some(item => item.table_kind === "percentage");
    const normalizedSubject = normalizeArabic(subject);
    let totalMax;
    if (isPercentageTable) totalMax = 100;
    else if (
      PERIOD_100_POINT_SUBJECTS.has(normalizedSubject) ||
      Math.max(0, ...totals) > 60.0001 ||
      Math.max(0, ...evaluations) > 40.0001 ||
      Math.max(0, ...finals) > 40.0001
    ) totalMax = 100;
    else totalMax = 60;

    let shortMax = 0;
    const maxShortObserved = Math.max(0, ...shorts);
    if (maxShortObserved > 0) {
      if (
        normalizedSubject.includes(normalizeArabic("التربية البدنية")) ||
        Math.max(0, ...evaluations) > 80.0001
      ) shortMax = 10;
      else shortMax = 20;
      if (maxShortObserved > shortMax) shortMax = Math.ceil(maxShortObserved);
    }
    profiles[subject] = {total_max: totalMax, short_max: shortMax};
  }
  return profiles;
}
function finalizePeriodDetailedRecords(records) {
  const profiles = inferPeriodProfiles(records);
  for (const record of records) {
    if (record.source_kind !== "detailed") continue;
    const normalizedSubjects = {};
    const normalizedShortTests = {};
    let earned = 0;
    let possible = 0;

    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      const profile = profiles[subject];
      if (!profile) continue;
      const total = Number(detail.total);
      if (Number.isFinite(total) && profile.total_max > 0) {
        earned += total;
        possible += profile.total_max;
        normalizedSubjects[subject] = Math.round(total / profile.total_max * 10000) / 100;
      }
      const shortScore = Number(detail.short);
      if (Number.isFinite(shortScore) && profile.short_max > 0) {
        normalizedShortTests[subject] = {
          score: Math.round(shortScore * 100) / 100,
          max: profile.short_max,
          percentage: Math.round(shortScore / profile.short_max * 10000) / 100
        };
      }
    }

    record.subjects = Object.keys(normalizedSubjects).length ? normalizedSubjects : record.subjects;
    record.short_tests = normalizedShortTests;
    if (!Number.isFinite(record.average) && possible > 0) {
      record.average = Math.round(earned / possible * 1000000) / 10000;
      record.average_source = "calculated";
      record.average_calculation = {earned: Math.round(earned * 100) / 100, possible};
    } else if (Number.isFinite(record.average)) {
      record.average_source = record.average_source || "file";
    }
    if (Number.isFinite(record.average)) record.category = classifyAverage(record.average, "period");
  }
  return records;
}
function inferFinalExamMax(observedMax) {
  const value = Number(observedMax);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // في النماذج السعودية الشائعة تكون درجة اختبار نهاية الفصل 40 درجة،
  // مع إبقاء دعم مرن لأي نموذج يستخدم 50 أو 60 أو 100 درجة.
  if (value <= 40.0001) return 40;
  if (value <= 50.0001) return 50;
  if (value <= 60.0001) return 60;
  return 100;
}
function finalizeFinalExamRecords(records) {
  const groups = new Map();
  for (const record of records) {
    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      const score = Number(detail?.final_exam);
      if (!Number.isFinite(score)) continue;
      const key = `${record.grade_number}|||${subject}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(score);
    }
  }
  const profiles = new Map();
  for (const [key, scores] of groups.entries()) {
    const observedMax = Math.max(0, ...scores);
    const max = inferFinalExamMax(observedMax);
    if (max > 0) profiles.set(key, max);
  }
  for (const record of records) {
    const normalized = {};
    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      const score = Number(detail?.final_exam);
      const max = profiles.get(`${record.grade_number}|||${subject}`) || 0;
      if (!Number.isFinite(score) || max <= 0) continue;
      normalized[subject] = {
        score: Math.round(score * 100) / 100,
        max,
        percentage: Math.round(score / max * 10000) / 100
      };
    }
    record.final_exams = normalized;
  }
  return records;
}

function classifyAverage(value, modeId) {
  if (Math.abs(value - 100) <= 0.005) return "100%";
  if (value >= 90) return "ممتاز";
  if (value >= 80) return "جيد جداً";
  if (value >= 70) return "جيد";
  if (modeId === "past") return "مقبول";
  if (value >= 60) return "مقبول";
  return "ضعيف";
}

function maxRowNumber(cells) {
  return Math.max(0, ...Object.keys(cells).map(ref => splitRef(ref)[1]));
}
function findAllStudentTableHeaders(cells) {
  const rows = [];
  for (let row = 1; row <= maxRowNumber(cells); row++) {
    if (normalizeArabic(cells[`B${row}`]) === normalizeArabic("الطالب") && normalizeArabic(cells[`D${row}`]) === normalizeArabic("النسبة")) rows.push(row);
  }
  return rows;
}
function parseTabularPeriodSheet(cells, fileName, gradeNumber, sheetName, modeId) {
  const sectionRows = Object.entries(cells)
    .filter(([, value]) => normalizeArabic(value) === normalizeArabic("معدلات جميع الطلاب"))
    .map(([ref]) => splitRef(ref)[1]);
  const headers = findAllStudentTableHeaders(cells);
  if (!headers.length) return [];
  let headerRow;
  if (sectionRows.length) headerRow = headers.find(row => row > sectionRows.at(-1)) || headers.at(-1);
  else headerRow = headers.at(-1);
  const records = [];
  const seen = new Set();
  for (let row = headerRow + 1; row <= maxRowNumber(cells); row++) {
    const studentName = cleanText(cells[`B${row}`]);
    const average = parsePercentage(cells[`D${row}`]);
    if (!studentName || average === null || normalizeArabic(studentName) === normalizeArabic("الطالب")) continue;
    const key = `${normalizeArabic(studentName)}|${average}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const gradeName = GRADE_NAMES[gradeNumber] || cleanText(cells[`E${row}`]);
    const periodLabel = cleanText(cells[`G${row}`]);
    const semesterLabel = cleanText(cells[`H${row}`]);
    const academicYear = cleanText(cells[`I${row}`]);
    const inferredClass = inferClassNumber(fileName, gradeNumber);
    records.push({
      workbook_name: fileName,
      sheet_name: sheetName,
      grade_number: gradeNumber,
      grade_name: gradeName,
      class_number: inferredClass,
      class_label: makeClassLabel(gradeNumber, inferredClass),
      student_name: studentName,
      average: Math.round(average * 10000) / 10000,
      category: classifyAverage(average, modeId),
      school_name: "",
      academic_year_hijri: academicYear,
      academic_year_gregorian: "",
      period_label: periodLabel,
      semester_label: semesterLabel,
      subjects: {},
      short_tests: {},
      final_exams: {},
      subject_details: {},
      subject_table_kind: "summary",
      average_source: "file",
      source_kind: "summary"
    });
  }
  return records;
}

async function parseWorkbook(file, gradeNumber, modeId = state.mode) {
  const mode = MODES[modeId];
  if (!mode) throw new Error("نوع التحليل غير صالح.");
  const entries = await unzipXlsx(await file.arrayBuffer());
  const shared = await readSharedStrings(entries);
  const sheetPaths = await readSheetPaths(entries);
  const parsedSheets = [];
  for (const sheet of sheetPaths) parsedSheets.push({sheet, cells: await parseWorksheet(entries, sheet.path, shared)});

  // ملفات تحليل الفترة المجمعة: نقرأ قسم «معدلات جميع الطلاب»، ونحتفظ كذلك بأي كشوف تفصيلية
  // داخل الملف نفسه حتى يمكن دمج المعدل العام مع درجات الاختبارات القصيرة دون تكرار الطالب.
  const tabularRecords = modeId === "period"
    ? parsedSheets.flatMap(({sheet, cells}) => parseTabularPeriodSheet(cells, file.name, gradeNumber, sheet.name, modeId))
    : [];

  const records = [];
  for (const {sheet, cells} of parsedSheets) {
    const detectedAverage = findAverage(cells);
    const studentName = findStudentName(cells);
    const classNumber = (mode.requiresClasses || mode.supportsClassAnalysis)
      ? (findClassNumber(cells) || inferClassNumber(file.name, gradeNumber))
      : null;
    const subjectDetails = extractSubjectDetails(cells);
    const hasSubjectResults = Object.keys(subjectDetails.subject_details || {}).length > 0 ||
      Object.keys(subjectDetails.subjects || {}).length > 0;

    if (detectedAverage === null && studentName === null && classNumber === null && !hasSubjectResults) continue;
    if (mode.requiresClasses && classNumber === null) {
      throw new Error(`لم يتم العثور على رقم الفصل في الورقة ${sheet.name} داخل ${file.name}. تأكد أنك اخترت «نتيجة الفصل الدراسي».`);
    }
    if (detectedAverage === null && modeId !== "period") {
      throw new Error(`لم يتم العثور على المعدل في الورقة ${sheet.name} داخل ${file.name}.`);
    }
    if (detectedAverage === null && modeId === "period" && !hasSubjectResults) {
      throw new Error(`لم يتم العثور على معدل أو نتائج مواد قابلة للحساب في الورقة ${sheet.name} داخل ${file.name}.`);
    }

    const [hijri, gregorian] = findYears(cells);
    const average = detectedAverage === null ? null : Math.round(detectedAverage * 10000) / 10000;
    records.push({
      workbook_name: file.name,
      sheet_name: sheet.name,
      grade_number: gradeNumber,
      grade_name: GRADE_NAMES[gradeNumber],
      class_number: classNumber,
      class_label: makeClassLabel(gradeNumber, classNumber),
      student_name: studentName || `طالب بدون اسم (${sheet.name})`,
      average,
      category: Number.isFinite(average) ? classifyAverage(average, modeId) : "",
      school_name: findSchoolName(cells),
      academic_year_hijri: hijri,
      academic_year_gregorian: gregorian,
      period_label: "",
      semester_label: "",
      subjects: subjectDetails.subjects,
      short_tests: subjectDetails.short_tests,
      final_exams: {},
      subject_details: subjectDetails.subject_details,
      subject_table_kind: subjectDetails.table_kind,
      average_source: Number.isFinite(average) ? "file" : "pending_calculation",
      source_kind: "detailed"
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (modeId === "period") finalizePeriodDetailedRecords(records);
  if (mode.supportsFinalExams) finalizeFinalExamRecords(records);
  const unresolved = records.find(record => !Number.isFinite(record.average));
  if (unresolved) {
    throw new Error(`تعذر حساب المعدل من نتائج المواد في الورقة ${unresolved.sheet_name} داخل ${file.name}. تأكد من وجود أسماء المواد وعمود المجموع.`);
  }

  const combined = modeId === "period" ? mergePeriodRecords([...tabularRecords, ...records], modeId) : records;
  if (!combined.length) throw new Error(`لم يتم العثور على بيانات طلاب داخل ${file.name}.`);
  return combined;
}

function mergePeriodRecords(records, modeId = "period") {
  const merged = new Map();
  for (const record of records) {
    const normalizedName = normalizeArabic(record.student_name);
    const anonymous = !normalizedName || normalizedName.startsWith(normalizeArabic("طالب بدون اسم"));
    const key = anonymous
      ? `${record.grade_number}|${record.workbook_name}|${record.sheet_name}`
      : `${record.grade_number}|${normalizedName}`;

    if (!merged.has(key)) {
      merged.set(key, {
        ...record,
        subjects: {...(record.subjects || {})},
        short_tests: {...(record.short_tests || {})},
        final_exams: {...(record.final_exams || {})},
        subject_details: {...(record.subject_details || {})}
      });
      continue;
    }

    const current = merged.get(key);
    const currentHasSummary = String(current.source_kind || "").includes("summary");
    const incomingIsSummary = record.source_kind === "summary";

    // المعدل الوارد في ملف «معدلات جميع الطلاب» هو المرجع الأول.
    // عند عدم وجوده نستخدم المعدل المحسوب من مجموع درجات المواد.
    if (
      incomingIsSummary ||
      (!currentHasSummary && !Number.isFinite(current.average) && Number.isFinite(record.average))
    ) {
      current.average = record.average;
      current.category = classifyAverage(record.average, modeId);
      current.average_source = record.average_source || (incomingIsSummary ? "file" : "calculated");
      current.average_calculation = record.average_calculation || current.average_calculation;
    }

    current.subjects = {...current.subjects, ...(record.subjects || {})};
    current.short_tests = {...current.short_tests, ...(record.short_tests || {})};
    current.final_exams = {...current.final_exams, ...(record.final_exams || {})};
    current.subject_details = {...current.subject_details, ...(record.subject_details || {})};
    current.class_number = current.class_number || record.class_number || null;
    current.class_label = current.class_label || record.class_label || "";
    current.school_name = current.school_name || record.school_name || "";
    current.academic_year_hijri = current.academic_year_hijri || record.academic_year_hijri || "";
    current.academic_year_gregorian = current.academic_year_gregorian || record.academic_year_gregorian || "";
    current.period_label = current.period_label || record.period_label || "";
    current.semester_label = current.semester_label || record.semester_label || "";

    const kinds = new Set(
      `${current.source_kind || ""}+${record.source_kind || ""}`
        .split("+")
        .filter(Boolean)
    );
    current.source_kind = [...kinds].join("+");
  }

  const output = [...merged.values()].filter(record => Number.isFinite(record.average));
  return output.sort((a, b) =>
    a.grade_number - b.grade_number || a.student_name.localeCompare(b.student_name, "ar")
  );
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}
function roundedPct(count, total) { return Math.round((total ? count / total * 100 : 0) * 100) / 100; }
function summaryGroup(records, modeId) {
  const mode = MODES[modeId];
  const counts = Object.fromEntries(mode.categories.map(category => [category, 0]));
  for (const record of records) counts[record.category] = (counts[record.category] || 0) + 1;
  const total = records.length;
  const average = total ? records.reduce((sum, record) => sum + record.average, 0) / total : 0;
  const excellentCount = (counts["100%"] || 0) + (counts["ممتاز"] || 0);
  return {
    total,
    average: Math.round(average * 100) / 100,
    counts,
    percentages: Object.fromEntries(mode.categories.map(category => [category, roundedPct(counts[category] || 0, total)])),
    excellent_including_100: excellentCount,
    excellent_rate_including_100: roundedPct(excellentCount, total)
  };
}
function topStudents(records, limit) {
  const sorted = [...records].sort((a, b) => b.average - a.average || a.student_name.localeCompare(b.student_name, "ar"));
  const output = [];
  let previousAverage = null;
  let rank = 0;
  for (let index = 0; index < sorted.length; index++) {
    const record = sorted[index];
    const roundedAverage = Math.round(record.average * 100) / 100;
    if (previousAverage === null || Math.abs(roundedAverage - previousAverage) > 0.0001) rank = index + 1;
    if (rank > limit) break;
    output.push({
      rank,
      student_name: record.student_name,
      grade_name: record.grade_name,
      class_label: record.class_label,
      average: roundedAverage,
      category: record.category
    });
    previousAverage = roundedAverage;
  }
  return output;
}
function mostCommon(values) {
  const map = countBy(values.filter(Boolean), value => value);
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}
function buildNarrative(analysis, threshold, notes, modeId) {
  const mode = MODES[modeId];
  const overall = analysis.overall;
  const rate = overall.excellent_rate_including_100;
  const average = overall.average;
  const level = rate >= 90 ? "مرتفعًا جدًا" : rate >= 75 ? "مرتفعًا" : rate >= 50 ? "جيدًا بوجه عام" : "بحاجة واضحة إلى التحسين";
  const opening = `تعكس النتائج مستوى ${level} من التحصيل؛ إذ بلغت نسبة الحاصلين على ممتاز فأعلى ${rate.toFixed(1)}%، وبلغ المتوسط العام ${average.toFixed(2)}%.`;
  const insights = [];
  const recommendations = [];

  const classItemsForNarrative = Object.values(analysis.classes).sort((a, b) => b.average - a.average);
  if (MODES[modeId].supportsClassAnalysis && classItemsForNarrative.length) {
    const highClass = classItemsForNarrative[0];
    const lowClass = classItemsForNarrative.at(-1);
    const spread = highClass && lowClass ? Math.round((highClass.average - lowClass.average) * 100) / 100 : 0;
    if (highClass) insights.push(`حقق الفصل ${highClass.class_label} أعلى متوسط فصلي بنسبة ${highClass.average.toFixed(2)}%.`);
    if (lowClass && highClass && lowClass.class_label !== highClass.class_label) insights.push(`بلغ أقل متوسط فصلي ${lowClass.average.toFixed(2)}% في الفصل ${lowClass.class_label}، وبلغ الفارق بين أعلى وأقل فصل ${spread.toFixed(2)} نقطة مئوية.`);
    recommendations.push(spread >= 5
      ? "تحليل ممارسات الفصول الأعلى أداءً ونقل الممارسات الفعالة إلى الفصول الأقل متوسطًا."
      : "الحفاظ على تقارب مستويات الفصول وتعزيز الممارسات التعليمية المشتركة بين المعلمين.");
  }

  if (modeId !== "semester") {
    const grades = Object.values(analysis.grades).sort((a, b) => b.average - a.average);
    const high = grades[0];
    const low = grades.at(-1);
    if (high) insights.push(`حقق ${high.grade_name} أعلى متوسط بين الصفوف بنسبة ${high.average.toFixed(2)}%.`);
    if (high && low && high.grade_number !== low.grade_number) insights.push(`بلغ الفارق بين أعلى وأقل متوسط للصفوف ${(high.average - low.average).toFixed(2)} نقطة مئوية.`);
    if (modeId === "past") insights.push("هذا النوع من التحليل مبني على نتائج الصفوف النهائية ولا يعتمد على بيانات الفصول.");
    if (modeId === "period") {
      insights.push("تحليل الفترة يعرض النتائج على مستوى الصفوف والفصول، ويستخرج درجات الاختبارات القصيرة تلقائيًا.");
      if (!classItemsForNarrative.length) insights.push("لم تتوافر أرقام فصول قابلة للاستخراج؛ لذلك اقتصر العرض الحالي على مستوى الصفوف.");
      if (analysis.calculated_average_count) insights.push(`تم حساب معدل ${analysis.calculated_average_count} طالبًا تلقائيًا من مجموع درجات المواد مقارنة بدرجاتها القصوى لعدم وجود حقل معدل داخل الملفات.`);
    }
    recommendations.push(modeId === "past"
      ? "مقارنة مؤشرات كل صف بنتائجه في العام الحالي لقياس التحسن أو التراجع وتحديد أسباب الفروق."
      : "مراجعة مؤشرات الفترة مع المعلمين وتحديد التدخلات السريعة قبل الاختبارات اللاحقة.");
  }

  const absentCategories = mode.reportCategories.filter(category => (overall.counts[category] || 0) === 0);
  if (absentCategories.length) {
    const scope = mode.supportsClassAnalysis && Object.keys(analysis.classes).length
      ? "على مستوى جميع الصفوف والفصول"
      : "على مستوى جميع الصفوف";
    insights.push(`لم يُسجل أي طالب ضمن مستويات ${formatArabicList(absentCategories.map(categoryLabel))} ${scope}؛ لذلك لم تظهر هذه المستويات في الجداول لعدم وجود بيانات.`);
  }

  insights.push(`بلغ عدد الطلاب الحاصلين على أقل من ${threshold}% عدد ${analysis.at_risk_count} من أصل ${overall.total} طالبًا بنسبة ${roundedPct(analysis.at_risk_count, overall.total).toFixed(2)}%.`);
  if (modeId === "period") {
    if (analysis.short_test_summary.length) {
      const highest = analysis.short_test_summary.slice().sort((a, b) => b.weak_count - a.weak_count || b.weak_rate - a.weak_rate)[0];
      insights.push(`تم رصد ${analysis.short_test_weak_count} حالة ضعف في الاختبارات القصيرة لدى ${analysis.short_test_weak_student_count} طالبًا وفق حد ${analysis.short_test_threshold}%.`);
      if (highest) insights.push(`سجلت مادة ${highest.subject} في ${highest.grade_name} أعلى عدد حالات ضعف (${highest.weak_count} حالة).`);
      recommendations.push("إعداد قوائم علاجية حسب المادة للطلاب الأقل من نسبة الضعف المحددة، ثم إعادة القياس باختبار قصير لاحق.");
    } else {
      insights.push("لم تُكتشف بيانات تفصيلية لعمود الاختبارات القصيرة في الملفات الحالية؛ لذلك لم تُنشأ قائمة ضعاف المواد.");
      recommendations.push("لإظهار ضعاف المواد، ارفع كشوف الطلاب التفصيلية التي تتضمن عمود «اختبارات قصيرة» بجانب اسم كل مادة.");
    }
  }
  if (mode.supportsFinalExams) {
    if (analysis.final_exam_summary.length) {
      if (analysis.final_exam_weak_count) {
        const highest = analysis.final_exam_summary.slice().sort((a, b) => b.weak_count - a.weak_count || b.weak_rate - a.weak_rate)[0];
        insights.push(`تم رصد ${analysis.final_exam_weak_count} حالة ضعف في اختبار نهاية الفصل لدى ${analysis.final_exam_weak_student_count} طالبًا وفق حد أقل من ${analysis.final_exam_threshold}%.`);
        if (highest?.weak_count) insights.push(`سجلت مادة ${highest.subject} في ${highest.grade_name} أعلى عدد حالات ضعف في اختبار نهاية الفصل (${highest.weak_count} حالة).`);
        recommendations.push("إعداد خطط علاجية حسب المادة للطلاب الأقل من نسبة الضعف المحددة في اختبار نهاية الفصل، وربطها بنتائج القياس اللاحق.");
      } else {
        insights.push(`لم يُسجل أي طالب أقل من ${analysis.final_exam_threshold}% في اختبار نهاية الفصل ضمن المواد التي تحتوي على اختبار.`);
        recommendations.push("المحافظة على مستوى التحصيل في اختبار نهاية الفصل مع تقديم إثراء للطلاب المتفوقين ومتابعة أي تراجع مبكر.");
      }
    } else {
      insights.push("لم تُكتشف درجات تفصيلية لاختبار نهاية الفصل في الملفات المرفوعة؛ لذلك لم تُنشأ قائمة ضعاف المواد لهذا الاختبار.");
      recommendations.push("لإظهار ضعاف اختبار نهاية الفصل، استخدم ملفات النتائج التفصيلية التي تتضمن عمود «اختبار نهاية الفصل» لكل مادة؛ ملفات المعدلات المختصرة وحدها لا تكفي.");
    }
  }
  if (analysis.at_risk_count) {
    recommendations.push("إعداد خطط علاجية فردية للطلاب الأولى بالرعاية مع توثيق التدخلات وقياس أثرها دوريًا.", "تفعيل التواصل المنتظم مع أولياء الأمور للحالات المتعثرة وربط المتابعة بمؤشرات قابلة للقياس.");
  } else recommendations.push("الاستمرار في التدخلات الوقائية التي حافظت على انخفاض التعثر الدراسي.");
  recommendations.push("تقديم برامج إثرائية للطلاب المتفوقين لضمان استمرار النمو وعدم الاكتفاء بمستوى التحصيل الحالي.", "مراجعة نتائج المواد الأقل متوسطًا ووضع تدخلات تعليمية محددة لها.");
  return {opening, insights, recommendations, school_notes: cleanText(notes)};
}
function analyzeRecords(records, threshold, notes, modeId = state.mode, shortTestThreshold = 50, finalExamThreshold = 50) {
  const mode = MODES[modeId];
  if (!mode) throw new Error("نوع التحليل غير صالح.");
  const grades = {};
  const classes = {};
  for (const gradeNumber of [...new Set(records.map(record => record.grade_number))].sort()) {
    const group = records.filter(record => record.grade_number === gradeNumber);
    const risk = group.filter(record => record.average < threshold).sort((a, b) => a.average - b.average);
    grades[gradeNumber] = {
      ...summaryGroup(group, modeId), grade_number: gradeNumber, grade_name: GRADE_NAMES[gradeNumber],
      top_students: topStudents(group, 10), at_risk_count: risk.length,
      at_risk_students: risk.map(record => ({student_name: record.student_name, class_label: record.class_label, average: Math.round(record.average * 100) / 100}))
    };
  }
  if (mode.supportsClassAnalysis) {
    const classKeys = [...new Set(records
      .filter(record => record.class_label)
      .map(record => `${record.grade_number}|||${record.class_label}`)
    )].sort((a, b) => {
      const [gradeA, labelA] = a.split("|||");
      const [gradeB, labelB] = b.split("|||");
      const classA = Number(labelA.split("/")[1] || 0);
      const classB = Number(labelB.split("/")[1] || 0);
      return Number(gradeA) - Number(gradeB) || classA - classB;
    });
    for (const key of classKeys) {
      const [gradeValue, label] = key.split("|||");
      const gradeNumber = Number(gradeValue);
      const group = records.filter(record => record.grade_number === gradeNumber && record.class_label === label);
      classes[key] = {...summaryGroup(group, modeId), class_label: label, grade_number: gradeNumber, grade_name: GRADE_NAMES[gradeNumber],
        top_students: topStudents(group, 5), at_risk_count: group.filter(record => record.average < threshold).length};
    }
  }
  const subjectMap = new Map();
  for (const record of records) for (const [subject, value] of Object.entries(record.subjects || {})) {
    if (!subjectMap.has(subject)) subjectMap.set(subject, []);
    subjectMap.get(subject).push(value);
  }
  const subject_summary = [...subjectMap.entries()]
    .map(([subject, values]) => ({subject, average: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100, students: values.length}))
    .sort((a, b) => b.average - a.average);

  // تحليل الاختبارات القصيرة حسب الصف والمادة.
  // الدرجة القصوى تُقرأ من بنية نتيجة الفترة وتُحوَّل كل درجة إلى نسبة مئوية.
  const shortTestGroups = new Map();
  for (const record of records) {
    for (const [subject, rawValue] of Object.entries(record.short_tests || {})) {
      let score;
      let maxScore;
      let percentage;
      if (rawValue && typeof rawValue === "object") {
        score = Number(rawValue.score);
        maxScore = Number(rawValue.max);
        percentage = Number(rawValue.percentage);
      } else {
        score = Number(rawValue);
        maxScore = null;
        percentage = null;
      }
      if (!Number.isFinite(score)) continue;
      const key = `${record.grade_number}|||${subject}`;
      if (!shortTestGroups.has(key)) {
        shortTestGroups.set(key, {
          grade_number: record.grade_number,
          grade_name: record.grade_name,
          subject,
          entries: []
        });
      }
      shortTestGroups.get(key).entries.push({record, score, maxScore, percentage});
    }
  }

  const short_test_summary = [];
  const short_test_weak_students = [];
  for (const group of shortTestGroups.values()) {
    const declaredMax = Math.max(0, ...group.entries.map(item => Number(item.maxScore)).filter(Number.isFinite));
    const observedMax = Math.max(0, ...group.entries.map(item => item.score));
    const maxScore = declaredMax > 0 ? declaredMax : observedMax;
    if (maxScore <= 0) continue;

    const assessed = group.entries.map(item => {
      const pct = Number.isFinite(item.percentage)
        ? item.percentage
        : Math.round(item.score / maxScore * 10000) / 100;
      return {...item, percentage: pct};
    });
    const weak = assessed.filter(item => item.percentage < shortTestThreshold);
    const averagePercent = assessed.reduce((sum, item) => sum + item.percentage, 0) / assessed.length;

    short_test_summary.push({
      grade_number: group.grade_number,
      grade_name: group.grade_name,
      subject: group.subject,
      max_score: maxScore,
      students: assessed.length,
      weak_count: weak.length,
      weak_rate: roundedPct(weak.length, assessed.length),
      average_percent: Math.round(averagePercent * 100) / 100
    });

    for (const item of weak) {
      short_test_weak_students.push({
        student_name: item.record.student_name,
        grade_name: item.record.grade_name,
        grade_number: item.record.grade_number,
        class_label: item.record.class_label,
        subject: group.subject,
        score: item.score,
        max_score: maxScore,
        percentage: item.percentage
      });
    }
  }
  short_test_summary.sort((a, b) => a.grade_number - b.grade_number || b.weak_count - a.weak_count || a.subject.localeCompare(b.subject, "ar"));
  short_test_weak_students.sort((a, b) => a.grade_number - b.grade_number || a.subject.localeCompare(b.subject, "ar") || a.percentage - b.percentage);

  // تحليل اختبار نهاية الفصل حسب الصف والمادة.
  const finalExamGroups = new Map();
  for (const record of records) {
    for (const [subject, rawValue] of Object.entries(record.final_exams || {})) {
      const score = Number(rawValue?.score ?? rawValue);
      const maxScore = Number(rawValue?.max);
      const percentage = Number(rawValue?.percentage);
      if (!Number.isFinite(score)) continue;
      const key = `${record.grade_number}|||${subject}`;
      if (!finalExamGroups.has(key)) finalExamGroups.set(key, {
        grade_number: record.grade_number,
        grade_name: record.grade_name,
        subject,
        entries: []
      });
      finalExamGroups.get(key).entries.push({record, score, maxScore, percentage});
    }
  }

  const final_exam_summary = [];
  const final_exam_weak_students = [];
  for (const group of finalExamGroups.values()) {
    const declaredMax = Math.max(0, ...group.entries.map(item => item.maxScore).filter(Number.isFinite));
    const observedMax = Math.max(0, ...group.entries.map(item => item.score));
    const maxScore = declaredMax > 0 ? declaredMax : inferFinalExamMax(observedMax);
    if (maxScore <= 0) continue;
    const assessed = group.entries.map(item => ({
      ...item,
      percentage: Number.isFinite(item.percentage)
        ? item.percentage
        : Math.round(item.score / maxScore * 10000) / 100
    }));
    const weak = assessed.filter(item => item.percentage < finalExamThreshold);
    const averagePercent = assessed.reduce((sum, item) => sum + item.percentage, 0) / assessed.length;
    final_exam_summary.push({
      grade_number: group.grade_number,
      grade_name: group.grade_name,
      subject: group.subject,
      max_score: maxScore,
      students: assessed.length,
      weak_count: weak.length,
      weak_rate: roundedPct(weak.length, assessed.length),
      average_percent: Math.round(averagePercent * 100) / 100
    });
    for (const item of weak) final_exam_weak_students.push({
      student_name: item.record.student_name,
      grade_name: item.record.grade_name,
      grade_number: item.record.grade_number,
      class_label: item.record.class_label,
      subject: group.subject,
      score: item.score,
      max_score: maxScore,
      percentage: item.percentage
    });
  }
  final_exam_summary.sort((a, b) => a.grade_number - b.grade_number || b.weak_count - a.weak_count || a.subject.localeCompare(b.subject, "ar"));
  final_exam_weak_students.sort((a, b) => a.grade_number - b.grade_number || a.subject.localeCompare(b.subject, "ar") || a.percentage - b.percentage);

  const atRisk = records.filter(record => record.average < threshold).sort((a, b) => {
    const classDiff = mode.supportsClassAnalysis ? Number(a.class_number || 0) - Number(b.class_number || 0) : 0;
    return a.grade_number - b.grade_number || classDiff || a.average - b.average;
  });
  const uniqueWeakStudents = new Set(short_test_weak_students.map(item => `${item.grade_number}|${normalizeArabic(item.student_name)}|${item.class_label}`));
  const uniqueFinalWeakStudents = new Set(final_exam_weak_students.map(item => `${item.grade_number}|${normalizeArabic(item.student_name)}|${item.class_label}`));
  const analysis = {
    mode_id: modeId, mode_name: mode.name, overall: summaryGroup(records, modeId), grades, classes,
    at_risk_count: atRisk.length,
    at_risk_students: atRisk.map(record => ({student_name: record.student_name, grade_name: record.grade_name, class_label: record.class_label, average: Math.round(record.average * 100) / 100})),
    top_students_school: topStudents(records, 10), subject_summary,
    short_test_threshold: shortTestThreshold,
    short_test_summary,
    short_test_weak_students,
    short_test_weak_count: short_test_weak_students.length,
    short_test_weak_student_count: uniqueWeakStudents.size,
    final_exam_threshold: finalExamThreshold,
    final_exam_summary,
    final_exam_weak_students,
    final_exam_weak_count: final_exam_weak_students.length,
    final_exam_weak_student_count: uniqueFinalWeakStudents.size,
    calculated_average_count: records.filter(record => record.average_source === "calculated").length,
    threshold,
    school_name_detected: mostCommon(records.map(record => record.school_name)),
    academic_year_hijri_detected: mostCommon(records.map(record => record.academic_year_hijri)),
    academic_year_gregorian_detected: mostCommon(records.map(record => record.academic_year_gregorian)),
    period_detected: mostCommon(records.map(record => record.period_label)),
    records
  };
  analysis.narrative = buildNarrative(analysis, threshold, notes, modeId);
  return analysis;
}

function buildTable(headers, rows, nameCol = -1) {
  const body = rows.length
    ? rows.map(row => `<tr>${row.map((cell, index) => `<td class="${index === nameCol ? "name-cell" : ""}">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}">لا توجد بيانات.</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function buildBarChart(items, suffix = "") {
  const max = Math.max(...items.map(item => Number(item.value)), 1);
  return `<div class="chart">${items.map(item => `
    <div class="chart-row">
      <span class="chart-label">${escapeHtml(item.label)}</span>
      <div class="chart-track"><div class="chart-bar" style="width:${Math.max(1, Number(item.value) / max * 100)}%"></div></div>
      <span class="chart-value">${escapeHtml(item.display ?? item.value)}${escapeHtml(suffix)}</span>
    </div>`).join("")}</div>`;
}
function categoryLabel(category) { return category === "جيد جداً" ? "جيد جدًا" : category; }
function categoryHeaders(mode, categories = mode.reportCategories) { return categories.map(categoryLabel); }
function categoryValues(summary, mode, categories = mode.reportCategories) { return categories.map(category => summary.counts[category] || 0); }
function categoriesWithData(summaries, mode) {
  const groups = Array.isArray(summaries) ? summaries : [summaries];
  return mode.reportCategories.filter(category => groups.some(summary => (summary?.counts?.[category] || 0) > 0));
}
function formatArabicList(items) {
  const values = items.filter(Boolean);
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} أو ${values[1]}`;
  return `${values.slice(0, -1).join("، ")} أو ${values.at(-1)}`;
}

function renderKpis(result) {
  const overall = result.overall;
  let html = `
    <article class="kpi"><span>إجمالي الطلاب</span><strong>${overall.total.toLocaleString("ar-EG")}</strong></article>
    <article class="kpi"><span>المتوسط العام</span><strong>${formatNumber(overall.average)}%</strong></article>
    <article class="kpi"><span>ممتاز فأعلى</span><strong>${formatNumber(overall.excellent_rate_including_100)}%</strong></article>
    <article class="kpi warning"><span>أقل من ${result.threshold}%</span><strong>${result.at_risk_count.toLocaleString("ar-EG")}</strong></article>`;
  if (result.mode_id === "period") html += `
    ${result.calculated_average_count ? `<article class="kpi"><span>معدلات محسوبة تلقائيًا</span><strong>${result.calculated_average_count.toLocaleString("ar-EG")}</strong></article>` : ""}
    <article class="kpi warning"><span>طلاب ضعاف الاختبار القصير</span><strong>${result.short_test_weak_student_count.toLocaleString("ar-EG")}</strong></article>
    <article class="kpi warning"><span>حالات ضعف المواد</span><strong>${result.short_test_weak_count.toLocaleString("ar-EG")}</strong></article>`;
  if (MODES[result.mode_id].supportsFinalExams) html += `
    <article class="kpi warning"><span>طلاب ضعاف اختبار نهاية الفصل</span><strong>${result.final_exam_weak_student_count.toLocaleString("ar-EG")}</strong></article>
    <article class="kpi warning"><span>حالات ضعف مواد الاختبار النهائي</span><strong>${result.final_exam_weak_count.toLocaleString("ar-EG")}</strong></article>`;
  el.kpiGrid.innerHTML = html;
}
function renderOverview(result) {
  const mode = MODES[result.mode_id];
  const gradeItems = Object.values(result.grades);
  const activeCategories = categoriesWithData(gradeItems, mode);
  const rows = gradeItems.map(grade => [
    grade.grade_name,
    ...categoryValues(grade, mode, activeCategories),
    grade.total,
    `${formatNumber(grade.average)}%`
  ]);
  const chartItems = activeCategories.map(category => ({label: categoryLabel(category), value: result.overall.counts[category] || 0}));
  const narrative = result.narrative;
  el.overviewTab.innerHTML = `
    <section class="section-block">
      <h3>التحليل العام على مستوى المدرسة</h3>
      ${buildTable(["الصف", ...categoryHeaders(mode, activeCategories), "الإجمالي", "المتوسط"], rows)}
      ${buildBarChart(chartItems)}
    </section>
    <section class="section-block">
      <h3>قراءة تحليلية</h3>
      <div class="narrative"><strong>${escapeHtml(narrative.opening)}</strong><ul>${narrative.insights.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${narrative.school_notes ? `<p><b>ملاحظات المدرسة:</b> ${escapeHtml(narrative.school_notes)}</p>` : ""}</div>
      <h3>توصيات مقترحة</h3>
      <div class="narrative"><ul>${narrative.recommendations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
    </section>`;
}
function renderClasses(result) {
  const mode = MODES[result.mode_id];
  const values = Object.values(result.classes).sort((a, b) =>
    a.grade_number - b.grade_number || Number(a.class_number || a.class_label.split("/")[1] || 0) - Number(b.class_number || b.class_label.split("/")[1] || 0)
  );
  if (!mode.supportsClassAnalysis || !values.length) {
    el.classesTab.innerHTML = `<div class="narrative">لم تتوافر بيانات فصول قابلة للتحليل في الملفات المرفوعة.</div>`;
    return;
  }

  const gradeTables = Object.values(result.grades).sort((a, b) => a.grade_number - b.grade_number).map(grade => {
    const classItems = values.filter(item => item.grade_number === grade.grade_number);
    if (!classItems.length) return "";
    const activeCategories = categoriesWithData([grade, ...classItems], mode);
    const rows = activeCategories.map(category => [
      categoryLabel(category),
      ...classItems.map(item => item.counts[category] || 0),
      grade.counts[category] || 0
    ]);
    rows.push(["الإجمالي", ...classItems.map(item => item.total), grade.total]);
    rows.push(["المتوسط", ...classItems.map(item => `${formatNumber(item.average)}%`), `${formatNumber(grade.average)}%`]);
    return `<section class="section-block class-analysis-block">
      <h3>تحليل النتائج على مستوى فصول ${escapeHtml(grade.grade_name)}</h3>
      ${buildTable(["مستوى التحصيل", ...classItems.map(item => `الفصل ${item.class_label}`), "مجموع الصف"], rows)}
    </section>`;
  }).join("");

  const activeClassCategories = categoriesWithData(values, mode);
  el.classesTab.innerHTML = `
    ${gradeTables}
    <section class="section-block">
      <h3>مؤشرات الفصول</h3>
      <div class="cards-grid">${values.map(item => `
        <article class="summary-card">
          <h3>الفصل ${escapeHtml(item.class_label)}</h3>
          <div class="meta"><span>عدد الطلاب</span><strong>${item.total}</strong></div>
          <div class="meta"><span>المتوسط</span><strong>${formatNumber(item.average)}%</strong></div>
          <div class="meta"><span>ممتاز فأعلى</span><strong>${item.excellent_including_100}</strong></div>
          <div class="meta"><span>أولى بالرعاية</span><strong>${item.at_risk_count}</strong></div>
        </article>`).join("")}</div>
    </section>
    <section class="section-block">
      <h3>مقارنة متوسطات الفصول</h3>
      ${buildBarChart(values.map(item => ({label: item.class_label, value: item.average, display: formatNumber(item.average)})), "%")}
      ${buildTable(["الفصل", "الصف", "الطلاب", "المتوسط", ...categoryHeaders(mode, activeClassCategories), "أولى بالرعاية"], values.map(item => [
        item.class_label, item.grade_name, item.total, `${formatNumber(item.average)}%`,
        ...categoryValues(item, mode, activeClassCategories), item.at_risk_count
      ]))}
    </section>`;
}

function renderTop(result) {
  const mode = MODES[result.mode_id];
  const classItems = Object.values(result.classes).sort((a, b) =>
    a.grade_number - b.grade_number || Number(a.class_label.split("/")[1] || 0) - Number(b.class_label.split("/")[1] || 0)
  );
  const hasClassAnalysis = mode.supportsClassAnalysis && classItems.length > 0;
  if (!hasClassAnalysis) {
    let html = `<section class="section-block"><h3>العشرة الأوائل على مستوى المدرسة</h3>${buildTable(["الترتيب", "اسم الطالب", "الصف", "المعدل"], result.top_students_school.map(item => [item.rank, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]), 1)}</section>`;
    html += Object.values(result.grades).map(grade => `
      <section class="section-block">
        <h3>${result.mode_id === "past" ? "فرسان" : "العشرة الأوائل —"} ${escapeHtml(grade.grade_name)}</h3>
        ${buildTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], grade.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), 1)}
      </section>`).join("");
    el.topTab.innerHTML = html;
    return;
  }
  let html = `<section class="section-block"><h3>العشرة الأوائل على مستوى المدرسة</h3>${buildTable(["الترتيب", "اسم الطالب", "الصف", "الفصل", "المعدل"], result.top_students_school.map(item => [item.rank, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]), 1)}</section>`;
  for (const grade of Object.values(result.grades).sort((a, b) => a.grade_number - b.grade_number)) html += `<section class="section-block"><h3>العشرة الأوائل — ${escapeHtml(grade.grade_name)}</h3>${buildTable(["الترتيب", "اسم الطالب", "الفصل", "المعدل"], grade.top_students.map(item => [item.rank, item.student_name, item.class_label, `${formatNumber(item.average)}%`]), 1)}</section>`;
  html += `<section class="section-block"><h3>أفضل خمسة طلاب في كل فصل</h3>`;
  for (const classItem of classItems) html += `<h4>الفصل ${escapeHtml(classItem.class_label)}</h4>${buildTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], classItem.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), 1)}`;
  el.topTab.innerHTML = html + `</section>`;
}

function renderRisk(result) {
  if (!result.at_risk_students.length) {
    el.riskTab.innerHTML = `<div class="narrative">لا يوجد طلاب حاصلون على أقل من ${result.threshold}%.</div>`;
    return;
  }
  const withClasses = MODES[result.mode_id].supportsClassAnalysis && Object.keys(result.classes).length > 0;
  const headers = withClasses ? ["م", "اسم الطالب", "الصف", "الفصل", "المعدل"] : ["م", "اسم الطالب", "الصف", "المعدل"];
  const rows = result.at_risk_students.map((item, index) => withClasses
    ? [index + 1, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]
    : [index + 1, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]);
  el.riskTab.innerHTML = `<section class="section-block"><h3>الطلاب الحاصلون على أقل من ${result.threshold}% <span class="badge danger">${result.at_risk_count} طلاب</span></h3>${buildTable(headers, rows, 1)}<div class="narrative">هذه القائمة مبنية على المعدل فقط. تُضاف الظروف الخاصة وخطة المتابعة من خانة ملاحظات المدرسة.</div></section>`;
}
function renderSubjects(result) {
  if (!result.subject_summary.length) {
    el.subjectsTab.innerHTML = `<div class="narrative">لم يتم العثور على بيانات مواد قابلة للتحليل في الملفات المختارة.</div>`;
    return;
  }
  const rows = result.subject_summary.map(item => [item.subject, `${formatNumber(item.average)}%`, item.students]);
  const chart = result.subject_summary.slice().sort((a, b) => a.average - b.average).slice(0, 12).map(item => ({label: item.subject, value: item.average, display: formatNumber(item.average)}));
  el.subjectsTab.innerHTML = `<section class="section-block"><h3>متوسطات المواد</h3>${buildTable(["المادة", "متوسط الدرجة", "عدد الطلاب"], rows, 0)}<h3>المواد الأقل متوسطًا</h3>${buildBarChart(chart, "%")}</section>`;
}
function renderFinalExams(result) {
  const mode = MODES[result.mode_id];
  if (!mode.supportsFinalExams) {
    el.finalExamsTab.innerHTML = "";
    return;
  }
  if (!result.final_exam_summary.length) {
    el.finalExamsTab.innerHTML = `<div class="narrative"><strong>لم يتم العثور على درجات اختبار نهاية الفصل.</strong><p>لإظهار ضعاف المواد ارفع ملفات النتائج التفصيلية التي يظهر فيها عمود «اختبار نهاية الفصل» داخل كشف كل طالب. ملفات المعدلات أو النتائج المجمعة فقط لا تحتوي على التفاصيل اللازمة.</p></div>`;
    return;
  }
  const summaryRows = result.final_exam_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]);
  const hasClasses = result.final_exam_weak_students.some(item => item.class_label);
  const detailHeaders = hasClasses
    ? ["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"]
    : ["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"];
  const detailRows = result.final_exam_weak_students.map((item, index) => hasClasses
    ? [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]
    : [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]);
  const weakDetails = detailRows.length
    ? buildTable(detailHeaders, detailRows, 1)
    : `<div class="narrative">لا يوجد طلاب أقل من ${result.final_exam_threshold}% في اختبار نهاية الفصل.</div>`;
  el.finalExamsTab.innerHTML = `
    <section class="section-block">
      <h3>ملخص ضعف المواد في اختبار نهاية الفصل — أقل من ${result.final_exam_threshold}%</h3>
      <div class="narrative">تُحسب النسبة بقسمة درجة الطالب في اختبار نهاية الفصل على الدرجة القصوى للاختبار في المادة. الحد الافتراضي أقل من 50%، ويمكن تعديله قبل التحليل. المواد التي لا تحتوي على اختبار نهاية فصل تُستبعد تلقائيًا.</div>
      ${buildTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب المقيمون", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], summaryRows, 1)}
      <h3>قائمة الطلاب الضعاف حسب المادة <span class="badge danger">${result.final_exam_weak_count} حالة</span></h3>
      ${weakDetails}
    </section>`;
}

function renderShortTests(result) {
  if (result.mode_id !== "period") {
    el.shortTestsTab.innerHTML = "";
    return;
  }
  if (!result.short_test_summary.length) {
    el.shortTestsTab.innerHTML = `<div class="narrative"><strong>لم يتم العثور على درجات الاختبارات القصيرة.</strong><p>ملفات «معدلات جميع الطلاب» تحتوي على المعدل العام فقط. لإظهار ضعاف المواد ارفع كشوف الطلاب التفصيلية التي يظهر فيها عمود «اختبارات قصيرة».</p></div>`;
    return;
  }
  const summaryRows = result.short_test_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]);
  const hasClasses = result.short_test_weak_students.some(item => item.class_label);
  const detailHeaders = hasClasses
    ? ["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"]
    : ["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"];
  const detailRows = result.short_test_weak_students.map((item, index) => hasClasses
    ? [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]
    : [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]);
  el.shortTestsTab.innerHTML = `
    <section class="section-block">
      <h3>ملخص ضعف المواد في الاختبار القصير — أقل من ${result.short_test_threshold}%</h3>
      <div class="narrative">تُحسب نسبة الطالب بقسمة درجته على الدرجة القصوى المخصصة للاختبار القصير في المادة. يُعد الطالب ضعيفًا عندما تكون النسبة أقل من الحد المحدد، والحد الافتراضي 50%. المواد التي لا تحتوي على اختبار قصير تُستبعد تلقائيًا.</div>
      ${buildTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب المقيمون", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], summaryRows, 1)}
      <h3>قائمة الطلاب الضعاف حسب المادة <span class="badge danger">${result.short_test_weak_count} حالة</span></h3>
      ${buildTable(detailHeaders, detailRows, 1)}
    </section>`;
}

function renderResult(result) {
  state.result = result;
  if (el.saveAnalysisButton) el.saveAnalysisButton.hidden = false; updatePremiumUi();
  const mode = MODES[result.mode_id];
  el.resultsPanel.hidden = false;
  const hasClassAnalysis = mode.supportsClassAnalysis && Object.keys(result.classes).length > 0;
  el.classesTabButton.hidden = !hasClassAnalysis;
  el.shortTestsTabButton.hidden = !mode.supportsShortTests;
  el.finalExamsTabButton.hidden = !mode.supportsFinalExams;
  const activeTab = document.querySelector(".tab.active")?.dataset.tab;
  if (
    (!hasClassAnalysis && activeTab === "classes") ||
    (!mode.supportsShortTests && activeTab === "shortTests") ||
    (!mode.supportsFinalExams && activeTab === "finalExams")
  ) setActiveTab("overview");
  el.resultModeBadge.textContent = mode.name;
  const school = result.metadata.school_name || result.school_name_detected || state.account?.school_name || "المدرسة";
  const year = result.metadata.academic_year || result.academic_year_hijri_detected || "";
  el.resultsSubtitle.textContent = `${school}${year ? ` — ${year}` : ""}`;
  if (el.printReportTitle) el.printReportTitle.textContent = result.metadata.report_title || mode.reportTitle || "تحليل النتائج التعليمية";
  if (el.printSchoolName) el.printSchoolName.textContent = school;
  if (el.printPeriodYear) {
    const period = result.metadata.period || result.period_detected || mode.period || "";
    el.printPeriodYear.textContent = [period, year].filter(Boolean).join(" - ");
  }
  if (el.pdfFooterSchool) el.pdfFooterSchool.textContent = school;
  if (el.pdfFooterTitle) el.pdfFooterTitle.textContent = result.metadata.report_title || mode.reportTitle || "تحليل النتائج التعليمية";
  renderKpis(result);
  renderOverview(result);
  renderClasses(result);
  renderTop(result);
  renderRisk(result);
  renderSubjects(result);
  renderFinalExams(result);
  renderShortTests(result);
  preparePrintDocument();
  setActiveTab("overview");
  el.resultsPanel.scrollIntoView({behavior: "smooth", block: "start"});
}

function reportColumnWeights(headers) {
  return headers.map(header => {
    const text = cleanText(header);
    if (/اسم الطالب/.test(text)) return 3.2;
    if (/المادة/.test(text)) return 2.15;
    if (/الصف|الفصل/.test(text)) return 1.45;
    if (/التقدير/.test(text)) return 1.35;
    if (/الدرجة القصوى|متوسط الاختبار/.test(text)) return 1.45;
    if (/النسبة|المعدل|المتوسط/.test(text)) return 1.2;
    if (/الترتيب|^م$/.test(text)) return .72;
    return 1;
  });
}
function reportColgroup(headers) {
  const weights = reportColumnWeights(headers);
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  return `<colgroup>${weights.map(weight => `<col style="width:${(weight / total * 100).toFixed(3)}%">`).join("")}</colgroup>`;
}
function reportChunkSize(headers) {
  // أحجام محسوبة لتبقى كل كتلة جدول كاملة داخل صفحة A4 قدر الإمكان.
  // الجداول الأعرض تُقسّم إلى أجزاء أقصر، بدل تمدد الصفوف أو انقسام الجدول.
  const columns = headers.length;
  if (columns >= 8) return 8;
  if (columns === 7) return 9;
  if (columns === 6) return 11;
  if (columns === 5) return 13;
  return 15;
}
function reportTable(headers, rows, options = {}) {
  const safeHeaders = headers.map(item => cleanText(item));
  const safeRows = Array.isArray(rows) ? rows : [];
  const chunkSize = Number(options.chunkSize || reportChunkSize(safeHeaders));
  const chunks = safeRows.length
    ? Array.from({length: Math.ceil(safeRows.length / chunkSize)}, (_, index) => safeRows.slice(index * chunkSize, (index + 1) * chunkSize))
    : [[]];
  const nameColumns = safeHeaders.map((header, index) => /اسم الطالب|المادة/.test(header) ? index : -1).filter(index => index >= 0);
  return chunks.map((chunk, index) => {
    const continuation = index > 0;
    const body = chunk.length
      ? chunk.map(row => `<tr>${safeHeaders.map((_, cellIndex) => `<td${nameColumns.includes(cellIndex) ? ' class="text-cell"' : ""}>${escapeHtml(row[cellIndex] ?? "")}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${safeHeaders.length}" class="empty-cell">لا توجد بيانات.</td></tr>`;
    const continuationLabel = continuation
      ? `<div class="table-continuation-title">${escapeHtml(options.continuationTitle || options.title || "تابع الجدول")}</div>`
      : "";
    const pageClass = continuation && options.pageBreakContinuation !== false ? " report-table-new-page" : "";
    return `<div class="report-table-block${pageClass}">${continuationLabel}<table class="report-table">${reportColgroup(safeHeaders)}<thead><tr>${safeHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>${chunks.length > 1 ? `<div class="table-part-label">الجزء ${index + 1} من ${chunks.length}</div>` : ""}</div>`;
  }).join("");
}
function reportSection(title, content, options = {}) {
  const classes = ["report-section"];
  if (options.pageBreak) classes.push("report-page-break");
  if (options.keepTogether) classes.push("report-keep-together");
  return `<section class="${classes.join(" ")}"><h2>${escapeHtml(title)}</h2>${content}</section>`;
}
function reportList(items) {
  return `<ul class="report-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}
function reportObjectives(modeId) {
  if (modeId === "past") return [
    "الوقوف على المستوى الفعلي للطلاب من واقع نتائج العام الماضي.", "التعرف على نسب الطلاب في مستويات التحصيل المختلفة على مستوى كل صف.",
    "مقارنة متوسطات الصفوف المرفوعة وتحديد الصف الأعلى أداءً.", "حصر العشرة الأوائل في كل صف وتقديم برامج إثرائية مناسبة لهم.",
    "تحديد الطلاب الأولى بالرعاية ووضع توصيات داعمة لهم.", "رصد ضعاف المواد في اختبار نهاية الفصل وفق نسبة ضعف قابلة للتعديل.", "الخروج بتوصيات وفقًا لمؤشرات التقرير."
  ];
  if (modeId === "period") return [
    "الوقوف على المستوى الفعلي للطلاب خلال الفترة المحددة.", "تحليل مستويات التحصيل على مستوى كل صف وكل فصل.",
    "حصر العشرة الأوائل في كل صف وأفضل خمسة طلاب في كل فصل.", "رصد ضعاف المواد في الاختبارات القصيرة وفق نسبة ضعف قابلة للتعديل.",
    "تحديد المواد الأعلى في عدد حالات الضعف واقتراح تدخلات علاجية سريعة.", "الخروج بتوصيات وفقًا لمؤشرات الفترة."
  ];
  return [
    "الوقوف على المستوى الفعلي للطلاب من واقع الاختبارات.", "التعرف على نسبة الطلاب الممتازين والعمل على زيادتها.",
    "التعرف على الطلاب الحاصلين على جيد أو أقل وتقديم البرامج المناسبة لهم.", "المقارنة بين فصول الصف الواحد ومعرفة الفروق في المستوى التحصيلي.",
    "مقارنة متوسط كل فصل وتعزيز أعلى نسبة.", "حصر العشرة الأوائل في كل صف وأفضل خمسة طلاب في كل فصل.", "رصد ضعاف المواد في اختبار نهاية الفصل وفق نسبة ضعف قابلة للتعديل.", "الخروج بتوصيات وفقًا لنتائج التقرير."
  ];
}
function reportHeaderHtml(schoolLogo, guidanceLogo, school, reportTitle, wordMode = false) {
  const attrs = wordMode ? ' style="mso-element:header" id="reportHeader"' : "";
  return `<div class="report-running-header"${attrs}><table role="presentation"><tr><td class="header-school-logo"><img src="${schoolLogo}" alt="شعار المدرسة"></td><td class="header-center"><strong>${escapeHtml(school)}</strong><span>التقارير والمؤشرات التعليمية</span><small>${escapeHtml(reportTitle)}</small></td><td class="header-guidance-logo"><img src="${guidanceLogo}" alt="رمز التميز والإنجاز"></td></tr></table></div>`;
}
function wordPageField(code, fallback) {
  return `<!--[if supportFields]><span style="mso-element:field-begin"></span><span style='mso-field-code:" ${code} "'></span><span style="mso-element:field-end"></span><![endif]--><!--[if !supportFields]-->${fallback}<!--[endif]-->`;
}
function reportFooterHtml(school, reportTitle, wordMode = false) {
  const attrs = wordMode ? ' style="mso-element:footer" id="reportFooter"' : "";
  const page = wordMode ? wordPageField("PAGE", "1") : "";
  const pages = wordMode ? wordPageField("NUMPAGES", "1") : "";
  const pageText = wordMode ? `صفحة ${page} من ${pages}` : "تقرير تحليلي";
  return `<div class="report-running-footer"${attrs}><table role="presentation"><tr><td>${escapeHtml(school)}</td><td>${escapeHtml(reportTitle)}</td><td class="footer-page">${pageText}</td></tr></table></div>`;
}
function reportFrameRows(content) {
  const template = document.createElement("template");
  template.innerHTML = content.trim();
  return Array.from(template.content.children).map((node, index) => {
    const pageBreak = index > 0 && node.classList?.contains("report-page-break");
    const cover = node.classList?.contains("report-cover");
    return `<tr class="page-frame-row${pageBreak ? " report-row-break" : ""}${cover ? " report-cover-row" : ""}"><td class="page-frame-cell">${node.outerHTML}</td></tr>`;
  }).join("");
}
function reportContentHtml(result, brandLogos = {}, options = {}) {
  const mode = MODES[result.mode_id];
  const metadata = result.metadata;
  const school = metadata.school_name || result.school_name_detected || "المدرسة";
  const year = metadata.academic_year || result.academic_year_hijri_detected || "";
  const period = metadata.period || result.period_detected || mode.period || "";
  const title = metadata.report_title || mode.reportTitle || "تحليل النتائج التعليمية";
  const gradeItems = Object.values(result.grades);
  const activeSchoolCategories = categoriesWithData(gradeItems, mode);
  const gradeRows = gradeItems.map(grade => [
    grade.grade_name,
    ...categoryValues(grade, mode, activeSchoolCategories),
    grade.total,
    `${formatNumber(grade.average)}%`
  ]);
  const objectives = reportObjectives(result.mode_id);
  const mechanism = result.mode_id === "past"
    ? ["توزيع الطلاب على مستويات: 100%، ممتاز، جيد جدًا، جيد، مقبول.", "إعداد إحصائية مجمعة لكل صف على حدة.", "حساب متوسطات الصفوف والمواد وحصر العشرة الأوائل والطلاب الأولى بالرعاية.", `تحويل درجات اختبار نهاية الفصل إلى نسب مئوية ورصد النتائج الأقل من ${result.final_exam_threshold}%.`]
    : result.mode_id === "period"
      ? ["استخراج المعدل من الملف، أو حسابه تلقائيًا من مجموع درجات المواد ودرجاتها القصوى عند غيابه.", "توزيع الطلاب على مستويات التحصيل وحساب متوسط كل صف وكل فصل وحصر الأوائل والطلاب الأولى بالرعاية.", "إعداد جدول تحليل مستقل لفصول كل صف وحصر أفضل خمسة طلاب في كل فصل.", `تحويل درجات الاختبارات القصيرة إلى نسب مئوية ورصد النسب الأقل من ${result.short_test_threshold}%.`]
      : ["توزيع الطلاب على مستويات: 100%، ممتاز، جيد جدًا، جيد، مقبول، ضعيف.", "إعداد إحصائية مجمعة لكل فصل ولكل صف.", "حساب متوسطات الفصول والمواد وتحديد الطلاب الأولى بالرعاية والأوائل.", `تحويل درجات اختبار نهاية الفصل إلى نسب مئوية ورصد النتائج الأقل من ${result.final_exam_threshold}%.`];

  const schoolLogo = brandLogos.school || BRAND_ASSETS.school;
  const guidanceLogo = brandLogos.guidance || BRAND_ASSETS.guidance;
  const classItemsAll = Object.values(result.classes).sort((a, b) => a.grade_number - b.grade_number || Number(a.class_label.split("/")[1] || 0) - Number(b.class_label.split("/")[1] || 0));
  const hasClassAnalysis = mode.supportsClassAnalysis && classItemsAll.length > 0;
  const coverContent = `
    <div class="report-cover">
      <div class="cover-brand-row">
        <div class="cover-logo-box"><img src="${schoolLogo}" alt="شعار المدرسة"></div>
        <div class="cover-brand-copy"><span>منصة رقمية للتقارير والمؤشرات التعليمية</span><strong>${escapeHtml(school)}</strong><small>التقارير والمؤشرات التعليمية</small></div>
        <div class="cover-logo-box guidance"><img src="${guidanceLogo}" alt="رمز التميز والإنجاز"></div>
      </div>
      <div class="cover-rule"><i></i><i></i><i></i></div>
      <div class="cover-badge">تقرير تحليلي معتمد</div>
      <div class="cover-title"><h1>${escapeHtml(title)}</h1><h2>${escapeHtml([period, year].filter(Boolean).join(" - ") || mode.name)}</h2><p>قراءة إحصائية وتربوية لمؤشرات التحصيل الدراسي</p></div>
      <div class="cover-metrics">
        <div><span>نوع التحليل</span><strong>${escapeHtml(mode.name)}</strong></div>
        <div><span>إجمالي الطلاب</span><strong>${result.overall.total.toLocaleString("ar-EG")}</strong></div>
        <div><span>المتوسط العام</span><strong>${formatNumber(result.overall.average)}%</strong></div>
        <div><span>تاريخ الإصدار</span><strong>${new Date().toLocaleDateString("ar-SA")}</strong></div>
      </div>
      <div class="cover-seal"><span>المدرسة</span><b>منصة تحليل النتائج التعليمية</b></div>
      <div class="cover-note">أُعد هذا التقرير إلكترونيًا، وتُستخدم بياناته لدعم القرار التربوي وخطط التحسين والمتابعة.</div>
    </div>`;
  let content = "";

  content += reportSection("أهداف التقرير وآلية الإعداد", `
    <div class="two-column-block"><div><h3>أهداف التقرير</h3>${reportList(objectives)}</div><div><h3>آلية إعداد التقرير</h3>${reportList(mechanism)}</div></div>
  `, {pageBreak: true});

  content += reportSection("أولًا: التحليل العام على مستوى المدرسة", `
    <p class="report-lead">${escapeHtml(result.narrative.opening)}</p>
    <table class="report-summary-grid" role="presentation"><tr>
      <td><span>إجمالي الطلاب</span><strong>${result.overall.total.toLocaleString("ar-EG")}</strong></td>
      <td><span>المتوسط العام</span><strong>${formatNumber(result.overall.average)}%</strong></td>
      <td><span>ممتاز فأعلى</span><strong>${formatNumber(result.overall.excellent_rate_including_100)}%</strong></td>
      <td class="warning"><span>أقل من ${result.threshold}%</span><strong>${result.at_risk_count.toLocaleString("ar-EG")}</strong></td>
    </tr></table>
    ${reportTable(["الصف", ...categoryHeaders(mode, activeSchoolCategories), "الإجمالي", "المتوسط"], gradeRows, {title: "التحليل العام على مستوى المدرسة", continuationTitle: "تابع التحليل العام"})}
    <div class="report-notice"><b>إجمالي الطلاب الأقل من ${result.threshold}%:</b> ${result.at_risk_count} طالبًا.</div>
  `);

  if (!hasClassAnalysis) {
    for (const grade of gradeItems) {
      const topContent = metadata.include_names
        ? reportTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], grade.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), {title: `الأوائل في ${grade.grade_name}`})
        : `<p class="report-muted">تم إخفاء أسماء الطلاب حسب إعدادات التصدير.</p>`;
      content += reportSection(`${result.mode_id === "past" ? "فرسان" : "العشرة الأوائل -"} ${grade.grade_name}`, topContent, {pageBreak: true});
    }
  } else {
    for (const grade of gradeItems) {
      const classItems = Object.values(result.classes).filter(item => item.grade_number === grade.grade_number);
      const activeCategories = categoriesWithData([grade, ...classItems], mode);
      const rows = activeCategories.map(category => [categoryLabel(category), ...classItems.map(item => item.counts[category] || 0), grade.counts[category] || 0]);
      rows.push(["الإجمالي", ...classItems.map(item => item.total), grade.total]);
      rows.push(["المتوسط", ...classItems.map(item => `${formatNumber(item.average)}%`), `${formatNumber(grade.average)}%`]);
      let gradeContent = reportTable(["التقدير", ...classItems.map(item => item.class_label), "المجموع"], rows, {title: `تحليل ${grade.grade_name}`, chunkSize: 12});
      if (metadata.include_names) {
        gradeContent += `<h3>العشرة الأوائل - ${escapeHtml(grade.grade_name)}</h3>`;
        gradeContent += reportTable(["الترتيب", "اسم الطالب", "الفصل", "المعدل"], grade.top_students.map(item => [item.rank, item.student_name, item.class_label, `${formatNumber(item.average)}%`]), {title: `العشرة الأوائل - ${grade.grade_name}`});
        gradeContent += `<h3>أفضل خمسة طلاب في فصول ${escapeHtml(grade.grade_name)}</h3>`;
        for (const classItem of classItems) {
          gradeContent += `<div class="class-top-block"><h4>الفصل ${escapeHtml(classItem.class_label)}</h4>${reportTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], classItem.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), {title: `أفضل خمسة - الفصل ${classItem.class_label}`, chunkSize: 8})}</div>`;
        }
      }
      content += reportSection(`تحليل ${grade.grade_name}`, gradeContent, {pageBreak: true});
    }
  }

  let narrativeContent = `<p class="report-lead">${escapeHtml(result.narrative.opening)}</p>${reportList(result.narrative.insights)}`;
  if (result.narrative.school_notes) narrativeContent += `<h3>ملاحظات المدرسة</h3><p>${escapeHtml(result.narrative.school_notes)}</p>`;
  narrativeContent += `<h3>دلالات وتوصيات</h3>${reportList(result.narrative.recommendations)}`;
  content += reportSection("قراءة تحليلية للنتائج", narrativeContent, {pageBreak: true});

  if (metadata.include_names) {
    const headers = hasClassAnalysis ? ["م", "اسم الطالب", "الصف", "الفصل", "المعدل"] : ["م", "اسم الطالب", "الصف", "المعدل"];
    const rows = result.at_risk_students.map((item, index) => hasClassAnalysis
      ? [index + 1, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]
      : [index + 1, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]);
    content += reportSection("الطلاب الأولى بالرعاية", rows.length
      ? reportTable(headers, rows, {title: "الطلاب الأولى بالرعاية", continuationTitle: "تابع الطلاب الأولى بالرعاية"})
      : `<div class="report-success">لا يوجد طلاب أقل من الحد المحدد.</div>`, {pageBreak: true});
  }

  if (mode.supportsFinalExams) {
    let finalContent = "";
    if (result.final_exam_summary.length) {
      finalContent += reportTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], result.final_exam_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]), {title: "ملخص ضعف المواد", continuationTitle: "تابع ملخص ضعف المواد"});
      if (metadata.include_names) {
        if (result.final_exam_weak_students.length) finalContent += hasClassAnalysis
          ? reportTable(["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.final_exam_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف اختبار نهاية الفصل", continuationTitle: "تابع ضعاف اختبار نهاية الفصل"})
          : reportTable(["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.final_exam_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف اختبار نهاية الفصل", continuationTitle: "تابع ضعاف اختبار نهاية الفصل"});
        else finalContent += `<div class="report-success">لا يوجد طلاب أقل من ${result.final_exam_threshold}% في اختبار نهاية الفصل.</div>`;
      }
    } else finalContent = `<div class="report-muted">لم تتوافر درجات تفصيلية لاختبار نهاية الفصل في الملفات المرفوعة.</div>`;
    content += reportSection(`ضعاف المواد في اختبار نهاية الفصل - أقل من ${result.final_exam_threshold}%`, finalContent, {pageBreak: true});
  }

  if (result.mode_id === "period") {
    let shortContent = "";
    if (result.short_test_summary.length) {
      shortContent += reportTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب", "عدد الضعاف", "نسبة الضعف"], result.short_test_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`]), {title: "ملخص ضعف الاختبارات القصيرة", continuationTitle: "تابع ملخص ضعف الاختبارات القصيرة"});
      if (metadata.include_names) shortContent += hasClassAnalysis
        ? reportTable(["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.short_test_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف الاختبار القصير", continuationTitle: "تابع ضعاف الاختبار القصير"})
        : reportTable(["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.short_test_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف الاختبار القصير", continuationTitle: "تابع ضعاف الاختبار القصير"});
    } else shortContent = `<div class="report-muted">لم تتوافر درجات تفصيلية للاختبارات القصيرة في الملفات المرفوعة.</div>`;
    content += reportSection(`ضعاف المواد في الاختبار القصير - أقل من ${result.short_test_threshold}%`, shortContent, {pageBreak: true});
  }

  if (result.subject_summary.length) {
    content += reportSection("متوسطات المواد", reportTable(["المادة", "المتوسط", "عدد الطلاب"], result.subject_summary.map(item => [item.subject, `${formatNumber(item.average)}%`, item.students]), {title: "متوسطات المواد", continuationTitle: "تابع متوسطات المواد"}), {pageBreak: true});
  }

  {const managerName=window.MishkatSchoolContext?.getContext?.().managerName||"";content += `<div class="report-closing"><div><strong>المدرسة</strong><span>التقارير والمؤشرات التعليمية</span></div><div class="signature-lines"><span>المعدّ</span><span>المراجع</span><span>مدير المدرسة${managerName?`<br><b>${escapeHtml(managerName)}</b>`:""}</span></div></div>`;}

  const wordMode = Boolean(options.wordMode);
  if (wordMode) return `${reportHeaderHtml(schoolLogo, guidanceLogo, school, title, true)}${reportFooterHtml(school, title, true)}<div class="report-pages Section1">${coverContent}${content}</div>`;
  return `<div class="print-cover-only">${coverContent}</div><table class="print-page-frame" role="presentation"><thead><tr><td class="page-frame-cell">${reportHeaderHtml(schoolLogo, guidanceLogo, school, title, false)}</td></tr></thead><tfoot><tr><td class="page-frame-cell">${reportFooterHtml(school, title, false)}</td></tr></tfoot><tbody>${reportFrameRows(content)}</tbody></table>`;
}
function reportDocumentStyles() {
  return `
    @page Section1{size:595.3pt 841.9pt;margin:78pt 42pt 58pt 42pt;mso-header-margin:20pt;mso-footer-margin:18pt;mso-header:reportHeader;mso-footer:reportFooter}
    *{box-sizing:border-box}html,body{direction:rtl}body{margin:0;background:#fff;color:#213746;font-family:"Cairo","Segoe UI",Tahoma,Arial,sans-serif;font-size:10.5pt;line-height:1.72}
    .Section1{page:Section1}.report-running-header,.report-running-footer{width:100%;font-size:8.5pt;color:#617784}.report-running-header table,.report-running-footer table{width:100%;border-collapse:collapse;table-layout:fixed}.report-running-header td,.report-running-footer td{border:0;padding:3pt 5pt;background:#fff;vertical-align:middle}.report-running-header{border-bottom:1.6pt solid #0b628f;padding-bottom:4pt}.report-running-header .header-school-logo{width:18%;text-align:right}.report-running-header .header-guidance-logo{width:27%;text-align:left}.report-running-header img{max-height:38pt;max-width:110pt;object-fit:contain}.report-running-header .header-center{text-align:center}.report-running-header strong,.report-running-header span,.report-running-header small{display:block}.report-running-header strong{font-size:11pt;color:#073f65}.report-running-header span{font-size:8pt;color:#39752f;font-weight:700}.report-running-header small{font-size:7.4pt;color:#687d88;margin-top:1pt}.report-running-footer{border-top:1pt solid #0b628f;padding-top:3pt}.report-running-footer td{font-size:7.5pt}.report-running-footer td:first-child{color:#073f65;font-weight:700}.report-running-footer td:nth-child(2){text-align:center}.report-running-footer .footer-page{text-align:left;width:18%}
    .report-cover{height:650pt;position:relative;text-align:center;display:table;width:100%;page-break-after:always;border:8pt solid #eaf4f7;outline:1.5pt solid #0b628f;outline-offset:-13pt;background:#fff}.report-cover>*{position:relative;z-index:2}.cover-badge{display:inline-block;margin-top:72pt;padding:7pt 18pt;border:1pt solid #c9dec0;background:#eef7e9;color:#39752f;border-radius:18pt;font-weight:700}.cover-rule{display:table;width:62%;height:5pt;margin:20pt auto 34pt}.cover-rule i{display:table-cell}.cover-rule i:nth-child(1){background:#73a944}.cover-rule i:nth-child(2){background:#0b628f}.cover-rule i:nth-child(3){background:#f7941d}.cover-title h1{font-size:27pt;line-height:1.35;color:#073f65;margin:0 0 12pt}.cover-title h2{font-size:17pt;color:#39752f;margin:0 0 8pt}.cover-title p{font-size:11pt;color:#657b86;margin:0}.cover-metrics{display:table;width:84%;margin:58pt auto 0;border-collapse:separate;border-spacing:8pt}.cover-metrics>div{display:table-cell;width:33.333%;padding:12pt 8pt;border:1pt solid #cbdde5;background:#f7fbfc}.cover-metrics span,.cover-metrics strong{display:block}.cover-metrics span{font-size:8pt;color:#687d88}.cover-metrics strong{font-size:11pt;color:#073f65;margin-top:3pt}.cover-note{position:absolute;right:30pt;left:30pt;bottom:32pt;border-top:1pt solid #d6e3e8;padding-top:12pt;font-size:8pt;color:#71848e}
    .report-section{margin:0 0 20pt}.report-page-break{page-break-before:always}.report-section h2{color:#073f65;font-size:16pt;line-height:1.4;margin:0 0 12pt;padding:7pt 10pt;background:#f0f7f9;border-right:5pt solid #73a944;border-bottom:1pt solid #cbdde5;page-break-after:avoid}.report-section h3{font-size:12pt;color:#0b628f;margin:14pt 0 7pt;page-break-after:avoid}.report-section h4{font-size:10.5pt;color:#39752f;margin:10pt 0 6pt;page-break-after:avoid}.report-section p{margin:0 0 9pt;text-align:justify}.report-list{margin:4pt 0 12pt;padding-right:20pt}.report-list li{margin:0 0 5pt;line-height:1.7;text-align:justify}.two-column-block{display:table;width:100%;table-layout:fixed}.two-column-block>div{display:table-cell;width:50%;vertical-align:top;padding:0 10pt}.two-column-block>div:first-child{border-left:1pt solid #dce7ec}.report-lead{background:#f7fbf4;border-right:5pt solid #73a944;padding:10pt 12pt;font-weight:700;color:#2d4856;page-break-inside:avoid}.report-notice,.report-success,.report-muted{padding:9pt 11pt;margin:10pt 0 14pt;border:1pt solid #ead6a8;border-right:5pt solid #f7941d;background:#fff8ea;page-break-inside:avoid}.report-success{border-color:#c9dec0;border-right-color:#73a944;background:#f3faef;color:#315f2a}.report-muted{border-color:#d8e3e7;border-right-color:#8ca0aa;background:#f6f9fa;color:#657b86}
    .report-summary-grid{width:100%;border-collapse:separate;border-spacing:6pt;margin:8pt 0 15pt;table-layout:fixed;page-break-inside:avoid}.report-summary-grid td{border:1pt solid #cbdde5;background:#f4fafc;padding:10pt 5pt;text-align:center}.report-summary-grid td.warning{background:#fff7e9;border-color:#f1d7a1}.report-summary-grid span,.report-summary-grid strong{display:block}.report-summary-grid span{font-size:8pt;color:#687d88}.report-summary-grid strong{font-size:17pt;color:#073f65;margin-top:3pt}.report-summary-grid .warning strong{color:#b45309}
    .report-table-block{width:100%;margin:8pt 0 15pt;page-break-inside:avoid;break-inside:avoid}.report-table-new-page{page-break-before:always}.table-continuation-title{font-size:10pt;font-weight:700;color:#073f65;margin:0 0 5pt;padding:4pt 7pt;background:#eef6f8;border-right:3pt solid #73a944}.report-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.4pt;line-height:1.45}.report-table thead{display:table-header-group}.report-table tr{page-break-inside:avoid;break-inside:avoid}.report-table th,.report-table td{border:1pt solid #9babb3;text-align:center;vertical-align:middle;padding:5.5pt 4pt;height:27pt;word-wrap:break-word;overflow-wrap:anywhere}.report-table th{background:#0b628f;color:#fff;font-weight:700}.report-table tbody tr:nth-child(even) td{background:#f4f8fa}.report-table tbody tr:last-child td{border-bottom:2pt solid #39752f}.report-table .text-cell{text-align:right;padding-right:6pt}.report-table .empty-cell{text-align:center;color:#71848e}.table-part-label{text-align:left;font-size:7pt;color:#71848e;margin-top:2pt}.class-top-block{page-break-inside:avoid}.report-closing{margin-top:28pt;padding-top:13pt;border-top:2pt solid #0b628f;text-align:center;page-break-inside:avoid}.report-closing strong,.report-closing span{display:block}.report-closing strong{color:#073f65;font-size:12pt}.report-closing>div>span{color:#39752f;font-size:9pt}.signature-lines{display:table;width:100%;margin-top:36pt}.signature-lines span{display:table-cell;width:33.333%;padding-top:7pt;border-top:1pt solid #9babb3;color:#516b79!important}
  `;
}
function wordReportHtml(result, brandLogos = {}) {
  const content = reportContentHtml(result, brandLogos, {wordMode: true});
  return `<!doctype html><html dir="rtl" lang="ar" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>${reportDocumentStyles()}</style></head><body>${content}</body></html>`;
}
function docxXmlEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function docxRun(text, options = {}) {
  const size = Number(options.size || 20);
  const color = options.color || "213746";
  const props = [
    '<w:rFonts w:ascii="Cairo" w:hAnsi="Cairo" w:eastAsia="Cairo" w:cs="Cairo"/>',
    `<w:color w:val="${color}"/>`,
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
    '<w:rtl/>'
  ];
  if (options.bold) props.push('<w:b/><w:bCs/>');
  if (options.italic) props.push('<w:i/><w:iCs/>');
  return `<w:r><w:rPr>${props.join("")}</w:rPr><w:t xml:space="preserve">${docxXmlEscape(text)}</w:t></w:r>`;
}
function docxParagraph(text = "", options = {}) {
  const align = options.align || "right";
  const spacingBefore = Number(options.before || 0);
  const spacingAfter = Number(options.after ?? 100);
  const line = Number(options.line || 330);
  const pPr = [
    '<w:bidi/>',
    `<w:jc w:val="${align}"/>`,
    `<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}" w:line="${line}" w:lineRule="auto"/>`
  ];
  if (options.keepNext) pPr.push('<w:keepNext/>');
  if (options.keepLines) pPr.push('<w:keepLines/>');
  if (options.pageBreakBefore) pPr.push('<w:pageBreakBefore/>');
  if (options.indent) pPr.push(`<w:ind w:right="${options.indent}" w:hanging="${options.hanging || 0}"/>`);
  if (options.shading) pPr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${options.shading}"/>`);
  if (options.borderRight || options.borderBottom) {
    pPr.push(`<w:pBdr>${options.borderRight ? `<w:right w:val="single" w:sz="${options.borderRightSize || 18}" w:space="5" w:color="${options.borderRight}"/>` : ""}${options.borderBottom ? `<w:bottom w:val="single" w:sz="6" w:space="3" w:color="${options.borderBottom}"/>` : ""}</w:pBdr>`);
  }
  const content = Array.isArray(text)
    ? text.map(run => docxRun(run.text, run)).join("")
    : docxRun(text, options);
  return `<w:p><w:pPr>${pPr.join("")}</w:pPr>${content}</w:p>`;
}
function docxPageBreak() { return '<w:p><w:pPr><w:bidi/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>'; }
function docxHeading(text, level = 1, pageBreakBefore = false) {
  const levelOptions = level === 1
    ? {size: 30, color: "073F65", bold: true, shading: "F0F7F9", borderRight: "73A944", borderRightSize: 22, borderBottom: "CBDDE5", before: 80, after: 180, keepNext: true, keepLines: true, pageBreakBefore}
    : level === 2
      ? {size: 24, color: "0B628F", bold: true, before: 140, after: 90, keepNext: true, keepLines: true, pageBreakBefore}
      : {size: 21, color: "39752F", bold: true, before: 100, after: 70, keepNext: true, keepLines: true, pageBreakBefore};
  return docxParagraph(text, levelOptions);
}
function docxBullet(text) {
  return docxParagraph(`• ${text}`, {size: 19, color: "213746", indent: 420, hanging: 180, after: 65, line: 330, keepLines: true});
}
function docxCell(text, width, options = {}) {
  const shading = options.shading ? `<w:shd w:val="clear" w:color="auto" w:fill="${options.shading}"/>` : "";
  const borders = options.borderBottom ? `<w:tcBorders><w:bottom w:val="single" w:sz="${options.borderBottomSize || 12}" w:space="0" w:color="${options.borderBottom}"/></w:tcBorders>` : "";
  const paragraph = docxParagraph(text, {
    size: options.size || 17,
    color: options.color || "213746",
    bold: options.bold,
    align: options.align || "center",
    before: 0,
    after: 0,
    line: options.line || 270,
    keepLines: true
  });
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shading}${borders}<w:vAlign w:val="center"/><w:tcMar><w:top w:w="45" w:type="dxa"/><w:left w:w="55" w:type="dxa"/><w:bottom w:w="45" w:type="dxa"/><w:right w:w="55" w:type="dxa"/></w:tcMar></w:tcPr>${paragraph}</w:tc>`;
}
function docxColumnWidths(headers, totalWidth = 10440) {
  const weights = reportColumnWeights(headers);
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  const widths = weights.map(weight => Math.max(650, Math.round(totalWidth * weight / total)));
  const difference = totalWidth - widths.reduce((sum, value) => sum + value, 0);
  widths[widths.length - 1] += difference;
  return widths;
}
function docxTableXml(headers, rows, options = {}) {
  const tableWidth = Number(options.totalWidth || 10080);
  const widths = docxColumnWidths(headers, tableWidth);
  const grid = widths.map(width => `<w:gridCol w:w="${width}"/>`).join("");
  const border = '<w:tblBorders><w:top w:val="single" w:sz="7" w:color="8FA3AD"/><w:left w:val="single" w:sz="7" w:color="8FA3AD"/><w:bottom w:val="single" w:sz="11" w:color="39752F"/><w:right w:val="single" w:sz="7" w:color="8FA3AD"/><w:insideH w:val="single" w:sz="5" w:color="B7C4CA"/><w:insideV w:val="single" w:sz="5" w:color="B7C4CA"/></w:tblBorders>';
  const headerCells = headers.map((header, index) => docxCell(header, widths[index], {shading: "0B628F", color: "FFFFFF", bold: true, size: headers.length >= 8 ? 14 : 15, line: 225})).join("");
  const headerRow = `<w:tr><w:trPr><w:tblHeader/><w:cantSplit/><w:trHeight w:val="360" w:hRule="atLeast"/></w:trPr>${headerCells}</w:tr>`;
  const nameColumns = headers.map((header, index) => /اسم الطالب|المادة/.test(cleanText(header)) ? index : -1).filter(index => index >= 0);
  const bodyRows = (rows.length ? rows : [["لا توجد بيانات.", ...Array(Math.max(0, headers.length - 1)).fill("")]]).map((row, rowIndex) => {
    const shading = rowIndex % 2 ? "F3F7F9" : "FFFFFF";
    const last = rowIndex === rows.length - 1;
    const cells = headers.map((_, cellIndex) => docxCell(row[cellIndex] ?? "", widths[cellIndex], {
      shading,
      align: nameColumns.includes(cellIndex) ? "right" : "center",
      size: headers.length >= 8 ? 13 : headers.length >= 6 ? 14 : 15,
      line: headers.length >= 8 ? 210 : 225,
      borderBottom: last ? "39752F" : null,
      borderBottomSize: last ? 12 : 0
    })).join("");
    return `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="330" w:hRule="atLeast"/></w:trPr>${cells}</w:tr>`;
  }).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:jc w:val="center"/><w:bidiVisual/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>${border}<w:tblCellMar><w:top w:w="35" w:type="dxa"/><w:left w:w="45" w:type="dxa"/><w:bottom w:w="35" w:type="dxa"/><w:right w:w="45" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>`;
}
function docxTableBlocks(headers, rows, options = {}) {
  const chunkSize = Number(options.chunkSize || reportChunkSize(headers));
  const chunks = rows.length ? Array.from({length: Math.ceil(rows.length / chunkSize)}, (_, index) => rows.slice(index * chunkSize, (index + 1) * chunkSize)) : [[]];
  return chunks.map((chunk, index) => {
    let xml = "";
    const shouldBreak = index > 0 || (options.pageBreakBefore && index === 0);
    if (shouldBreak) xml += docxPageBreak();
    if (index > 0) xml += docxHeading(options.continuationTitle || options.title || "تابع الجدول", 3, false);
    xml += docxTableXml(headers, chunk, options);
    if (chunks.length > 1) xml += docxParagraph(`الجزء ${index + 1} من ${chunks.length}`, {size: 14, color: "71848E", align: "left", after: 80});
    return xml;
  }).join("");
}
let docxDrawingIdCounter = 1;
function docxImageRun(relId, cx, cy, name) {
  const drawingId = docxDrawingIdCounter++;
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${drawingId}" name="${docxXmlEscape(name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="${docxXmlEscape(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}
function docxImageParagraph(relId, cx, cy, name, align = "center") {
  return `<w:p><w:pPr><w:bidi/><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="0"/></w:pPr>${docxImageRun(relId, cx, cy, name)}</w:p>`;
}
function docxHeaderXml(school, reportTitle) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:tbl><w:tblPr><w:tblW w:w="10440" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:bidiVisual/><w:tblBorders><w:bottom w:val="single" w:sz="16" w:color="0B628F"/><w:top w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="5840"/><w:gridCol w:w="2400"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="900" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${docxImageParagraph("rIdSchool", 820000, 610000, "شعار المدرسة", "right")}</w:tc><w:tc><w:tcPr><w:tcW w:w="5840" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${docxParagraph([{text: school, bold: true, size: 22, color: "073F65"}], {align: "center", after: 0, line: 250})}${docxParagraph([{text: "تحليل النتائج التعليمية", bold: true, size: 17, color: "39752F"}], {align: "center", after: 0, line: 220})}${docxParagraph(reportTitle, {align: "center", size: 14, color: "687D88", after: 0, line: 200})}</w:tc><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${docxImageParagraph("rIdGuidance", 1400000, 520000, "رمز التميز والإنجاز", "left")}</w:tc></w:tr></w:tbl></w:hdr>`;
}
function docxFieldRun(instruction, fallback = "1") {
  return `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${instruction} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>${docxRun(fallback, {size: 14, color: "617784"})}<w:r><w:fldChar w:fldCharType="end"/></w:r>`;
}
function docxFooterXml(school, reportTitle) {
  const pageParagraph = `<w:p><w:pPr><w:bidi/><w:jc w:val="left"/><w:spacing w:before="0" w:after="0"/></w:pPr>${docxRun("صفحة ", {size: 14, color: "617784"})}${docxFieldRun("PAGE")}${docxRun(" من ", {size: 14, color: "617784"})}${docxFieldRun("NUMPAGES")}</w:p>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:tbl><w:tblPr><w:tblW w:w="10440" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:bidiVisual/><w:tblBorders><w:top w:val="single" w:sz="10" w:color="0B628F"/><w:bottom w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="4440"/><w:gridCol w:w="3000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>${docxParagraph(school, {size: 14, color: "073F65", bold: true, align: "right", after: 0})}</w:tc><w:tc><w:tcPr><w:tcW w:w="4440" w:type="dxa"/></w:tcPr>${docxParagraph(reportTitle, {size: 13, color: "617784", align: "center", after: 0})}</w:tc><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>${pageParagraph}</w:tc></w:tr></w:tbl></w:ftr>`;
}
function docxCoverBrandXml(school) {
  const noBorders = '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';
  return `<w:tbl><w:tblPr><w:tblW w:w="10080" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:jc w:val="center"/><w:bidiVisual/>${noBorders}</w:tblPr><w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="5680"/><w:gridCol w:w="2200"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="1780" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${docxImageParagraph("rIdCoverSchool", 1180000, 1030000, "شعار المدرسة", "center")}</w:tc><w:tc><w:tcPr><w:tcW w:w="5680" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${docxParagraph("المملكة العربية السعودية", {align: "center", size: 16, color: "687D88", bold: true, after: 20, line: 210})}${docxParagraph("التقارير والمؤشرات التعليمية", {align: "center", size: 15, color: "687D88", after: 25, line: 210})}${docxParagraph(school, {align: "center", size: 25, color: "073F65", bold: true, after: 20, line: 300})}${docxParagraph("تحليل النتائج التعليمية", {align: "center", size: 18, color: "39752F", bold: true, after: 0, line: 230})}</w:tc><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${docxImageParagraph("rIdCoverGuidance", 1450000, 780000, "رمز التميز والإنجاز", "center")}</w:tc></w:tr></w:tbl>`;
}
function docxCoverMetricCell(label, value, width, fill = "F4FAFC", accent = "0B628F") {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/><w:tcBorders><w:top w:val="single" w:sz="7" w:color="CBDDE5"/><w:left w:val="single" w:sz="7" w:color="CBDDE5"/><w:bottom w:val="single" w:sz="7" w:color="${accent}"/><w:right w:val="single" w:sz="7" w:color="CBDDE5"/></w:tcBorders><w:vAlign w:val="center"/><w:tcMar><w:top w:w="130" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="130" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar></w:tcPr>${docxParagraph(label, {align: "center", size: 14, color: "687D88", bold: true, after: 25, line: 190})}${docxParagraph(value, {align: "center", size: 20, color: accent, bold: true, after: 0, line: 250})}</w:tc>`;
}
function docxCoverMetricsXml(result, mode) {
  const width = 2520;
  const date = new Date().toLocaleDateString("ar-SA");
  return `<w:tbl><w:tblPr><w:tblW w:w="10080" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:jc w:val="center"/><w:bidiVisual/><w:tblCellSpacing w:w="90" w:type="dxa"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid>${Array(4).fill(`<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="1050" w:hRule="atLeast"/></w:trPr>${docxCoverMetricCell("نوع التحليل", mode.name, width)}${docxCoverMetricCell("إجمالي الطلاب", result.overall.total.toLocaleString("ar-EG"), width)}${docxCoverMetricCell("المتوسط العام", `${formatNumber(result.overall.average)}%`, width, "F3FAEF", "39752F")}${docxCoverMetricCell("تاريخ الإصدار", date, width, "FFF8EA", "B45309")}</w:tr></w:tbl>`;
}
function docxCoverXml(result, title, school, period, year, mode) {
  let xml = "";
  xml += docxCoverBrandXml(school);
  xml += docxParagraph("", {align: "center", size: 2, borderBottom: "0B628F", before: 40, after: 180});
  xml += docxParagraph("تقرير تحليلي معتمد", {align: "center", size: 18, color: "39752F", bold: true, shading: "EEF7E9", before: 180, after: 210, line: 230});
  xml += docxParagraph(title, {align: "center", size: 46, color: "073F65", bold: true, before: 150, after: 130, line: 520, keepLines: true});
  xml += docxParagraph([period, year].filter(Boolean).join(" - ") || mode.name, {align: "center", size: 25, color: "39752F", bold: true, after: 90, line: 320});
  xml += docxParagraph("قراءة إحصائية وتربوية لمؤشرات التحصيل الدراسي", {align: "center", size: 18, color: "657B86", after: 360, line: 240});
  xml += docxCoverMetricsXml(result, mode);
  xml += docxParagraph("المدرسة", {align: "center", size: 23, color: "073F65", bold: true, before: 600, after: 20, line: 280});
  xml += docxParagraph("منصة تحليل النتائج التعليمية · التقارير والمؤشرات التعليمية", {align: "center", size: 16, color: "39752F", bold: true, after: 220, line: 220});
  xml += docxParagraph("أُعد هذا التقرير إلكترونيًا لدعم القرار التربوي وخطط التحسين والمتابعة.", {align: "center", size: 14, color: "71848E", borderBottom: "CBDDE5", after: 0, line: 210});
  xml += docxPageBreak();
  return xml;
}
function buildDocxDocumentXml(result) {
  const mode = MODES[result.mode_id];
  const metadata = result.metadata;
  const school = metadata.school_name || result.school_name_detected || "المدرسة";
  const year = metadata.academic_year || result.academic_year_hijri_detected || "";
  const period = metadata.period || result.period_detected || mode.period || "";
  const title = metadata.report_title || mode.reportTitle || "تحليل النتائج التعليمية";
  const gradeItems = Object.values(result.grades);
  const activeSchoolCategories = categoriesWithData(gradeItems, mode);
  const classItemsAll = Object.values(result.classes).sort((a, b) => a.grade_number - b.grade_number || Number(a.class_label.split("/")[1] || 0) - Number(b.class_label.split("/")[1] || 0));
  const hasClassAnalysis = mode.supportsClassAnalysis && classItemsAll.length > 0;
  const objectives = reportObjectives(result.mode_id);
  const mechanism = result.mode_id === "past"
    ? ["توزيع الطلاب على مستويات: 100%، ممتاز، جيد جدًا، جيد، مقبول.", "إعداد إحصائية مجمعة لكل صف على حدة.", "حساب متوسطات الصفوف والمواد وحصر العشرة الأوائل والطلاب الأولى بالرعاية.", `تحويل درجات اختبار نهاية الفصل إلى نسب مئوية ورصد النتائج الأقل من ${result.final_exam_threshold}%.`]
    : result.mode_id === "period"
      ? ["استخراج المعدل من الملف، أو حسابه تلقائيًا من مجموع درجات المواد ودرجاتها القصوى عند غيابه.", "توزيع الطلاب على مستويات التحصيل وحساب متوسط كل صف وكل فصل وحصر الأوائل والطلاب الأولى بالرعاية.", "إعداد جدول تحليل مستقل لفصول كل صف وحصر أفضل خمسة طلاب في كل فصل.", `تحويل درجات الاختبارات القصيرة إلى نسب مئوية ورصد النسب الأقل من ${result.short_test_threshold}%.`]
      : ["توزيع الطلاب على مستويات: 100%، ممتاز، جيد جدًا، جيد، مقبول، ضعيف.", "إعداد إحصائية مجمعة لكل فصل ولكل صف.", "حساب متوسطات الفصول والمواد وتحديد الطلاب الأولى بالرعاية والأوائل.", `تحويل درجات اختبار نهاية الفصل إلى نسب مئوية ورصد النتائج الأقل من ${result.final_exam_threshold}%.`];
  let body = docxCoverXml(result, title, school, period, year, mode);
  body += docxHeading("أهداف التقرير وآلية الإعداد", 1, false);
  body += docxHeading("أهداف التقرير", 2, false) + objectives.map(docxBullet).join("");
  body += docxHeading("آلية إعداد التقرير", 2, false) + mechanism.map(docxBullet).join("");
  body += docxHeading("أولًا: التحليل العام على مستوى المدرسة", 1, true);
  body += docxParagraph(result.narrative.opening, {size: 20, color: "2D4856", bold: true, shading: "F7FBF4", borderRight: "73A944", before: 40, after: 160, line: 340, keepLines: true});
  body += docxTableXml(["إجمالي الطلاب", "المتوسط العام", "ممتاز فأعلى", `أقل من ${result.threshold}%`], [[result.overall.total.toLocaleString("ar-EG"), `${formatNumber(result.overall.average)}%`, `${formatNumber(result.overall.excellent_rate_including_100)}%`, result.at_risk_count.toLocaleString("ar-EG")]], {totalWidth: 10440});
  const gradeRows = gradeItems.map(grade => [grade.grade_name, ...categoryValues(grade, mode, activeSchoolCategories), grade.total, `${formatNumber(grade.average)}%`]);
  body += docxTableBlocks(["الصف", ...categoryHeaders(mode, activeSchoolCategories), "الإجمالي", "المتوسط"], gradeRows, {title: "التحليل العام", continuationTitle: "تابع التحليل العام", pageBreakBefore: false});
  body += docxParagraph(`إجمالي الطلاب الأقل من ${result.threshold}%: ${result.at_risk_count} طالبًا.`, {size: 19, color: "7A4A00", bold: true, shading: "FFF8EA", borderRight: "F7941D", before: 80, after: 120, keepLines: true});

  if (!hasClassAnalysis) {
    for (const grade of gradeItems) {
      body += docxHeading(`${result.mode_id === "past" ? "فرسان" : "العشرة الأوائل -"} ${grade.grade_name}`, 1, true);
      if (metadata.include_names) body += docxTableBlocks(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], grade.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), {title: `الأوائل في ${grade.grade_name}`});
      else body += docxParagraph("تم إخفاء أسماء الطلاب حسب إعدادات التصدير.", {size: 18, color: "657B86", shading: "F6F9FA"});
    }
  } else {
    for (const grade of gradeItems) {
      const classItems = Object.values(result.classes).filter(item => item.grade_number === grade.grade_number);
      const activeCategories = categoriesWithData([grade, ...classItems], mode);
      const rows = activeCategories.map(category => [categoryLabel(category), ...classItems.map(item => item.counts[category] || 0), grade.counts[category] || 0]);
      rows.push(["الإجمالي", ...classItems.map(item => item.total), grade.total]);
      rows.push(["المتوسط", ...classItems.map(item => `${formatNumber(item.average)}%`), `${formatNumber(grade.average)}%`]);
      body += docxHeading(`تحليل ${grade.grade_name}`, 1, true);
      body += docxTableBlocks(["التقدير", ...classItems.map(item => item.class_label), "المجموع"], rows, {title: `تحليل ${grade.grade_name}`, chunkSize: 12});
      if (metadata.include_names) {
        body += docxHeading(`العشرة الأوائل - ${grade.grade_name}`, 2, true);
        body += docxTableBlocks(["الترتيب", "اسم الطالب", "الفصل", "المعدل"], grade.top_students.map(item => [item.rank, item.student_name, item.class_label, `${formatNumber(item.average)}%`]), {title: `العشرة الأوائل - ${grade.grade_name}`});
        body += docxHeading(`أفضل خمسة طلاب في فصول ${grade.grade_name}`, 2, true);
        classItems.forEach((classItem, classIndex) => {
          // مجموعتان صغيرتان في كل صفحة كحد أقصى؛ لتبقى كل طاولة كاملة دون انقسام.
          if (classIndex > 0 && classIndex % 2 === 0) body += docxPageBreak();
          body += docxHeading(`الفصل ${classItem.class_label}`, 3, false);
          body += docxTableBlocks(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], classItem.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), {title: `أفضل خمسة - الفصل ${classItem.class_label}`, chunkSize: 8});
        });
      }
    }
  }

  body += docxHeading("قراءة تحليلية للنتائج", 1, true);
  body += docxParagraph(result.narrative.opening, {size: 20, color: "2D4856", bold: true, shading: "F7FBF4", borderRight: "73A944", after: 140});
  body += result.narrative.insights.map(docxBullet).join("");
  if (result.narrative.school_notes) body += docxHeading("ملاحظات المدرسة", 2, false) + docxParagraph(result.narrative.school_notes, {size: 19});
  body += docxHeading("دلالات وتوصيات", 2, false) + result.narrative.recommendations.map(docxBullet).join("");

  if (metadata.include_names) {
    body += docxHeading("الطلاب الأولى بالرعاية", 1, true);
    const headers = hasClassAnalysis ? ["م", "اسم الطالب", "الصف", "الفصل", "المعدل"] : ["م", "اسم الطالب", "الصف", "المعدل"];
    const rows = result.at_risk_students.map((item, index) => hasClassAnalysis
      ? [index + 1, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]
      : [index + 1, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]);
    body += rows.length ? docxTableBlocks(headers, rows, {title: "الطلاب الأولى بالرعاية", continuationTitle: "تابع الطلاب الأولى بالرعاية"}) : docxParagraph("لا يوجد طلاب أقل من الحد المحدد.", {size: 19, color: "315F2A", bold: true, shading: "F3FAEF", borderRight: "73A944"});
  }

  if (mode.supportsFinalExams) {
    body += docxHeading(`ضعاف المواد في اختبار نهاية الفصل - أقل من ${result.final_exam_threshold}%`, 1, true);
    if (result.final_exam_summary.length) {
      body += docxTableBlocks(["الصف", "المادة", "الدرجة القصوى", "الطلاب", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], result.final_exam_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]), {title: "ملخص ضعف المواد", continuationTitle: "تابع ملخص ضعف المواد"});
      if (metadata.include_names) {
        if (result.final_exam_weak_students.length) body += hasClassAnalysis
          ? docxTableBlocks(["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.final_exam_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف اختبار نهاية الفصل", continuationTitle: "تابع ضعاف اختبار نهاية الفصل"})
          : docxTableBlocks(["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.final_exam_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف اختبار نهاية الفصل", continuationTitle: "تابع ضعاف اختبار نهاية الفصل"});
        else body += docxParagraph(`لا يوجد طلاب أقل من ${result.final_exam_threshold}% في اختبار نهاية الفصل.`, {size: 19, color: "315F2A", bold: true, shading: "F3FAEF", borderRight: "73A944"});
      }
    } else body += docxParagraph("لم تتوافر درجات تفصيلية لاختبار نهاية الفصل في الملفات المرفوعة.", {size: 18, color: "657B86", shading: "F6F9FA", borderRight: "8CA0AA"});
  }

  if (result.mode_id === "period") {
    body += docxHeading(`ضعاف المواد في الاختبار القصير - أقل من ${result.short_test_threshold}%`, 1, true);
    if (result.short_test_summary.length) {
      body += docxTableBlocks(["الصف", "المادة", "الدرجة القصوى", "الطلاب", "عدد الضعاف", "نسبة الضعف"], result.short_test_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`]), {title: "ملخص ضعف الاختبارات القصيرة", continuationTitle: "تابع ملخص ضعف الاختبارات القصيرة"});
      if (metadata.include_names) body += hasClassAnalysis
        ? docxTableBlocks(["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.short_test_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف الاختبار القصير", continuationTitle: "تابع ضعاف الاختبار القصير"})
        : docxTableBlocks(["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.short_test_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]), {title: "ضعاف الاختبار القصير", continuationTitle: "تابع ضعاف الاختبار القصير"});
    } else body += docxParagraph("لم تتوافر درجات تفصيلية للاختبارات القصيرة في الملفات المرفوعة.", {size: 18, color: "657B86", shading: "F6F9FA", borderRight: "8CA0AA"});
  }

  if (result.subject_summary.length) {
    body += docxHeading("متوسطات المواد", 1, true);
    body += docxTableBlocks(["المادة", "المتوسط", "عدد الطلاب"], result.subject_summary.map(item => [item.subject, `${formatNumber(item.average)}%`, item.students]), {title: "متوسطات المواد", continuationTitle: "تابع متوسطات المواد"});
  }
  body += docxParagraph("المدرسة", {align: "center", size: 24, color: "073F65", bold: true, borderBottom: "0B628F", before: 500, after: 40, keepLines: true});
  body += docxParagraph("تحليل النتائج التعليمية", {align: "center", size: 18, color: "39752F", bold: true, after: 500});
  body += docxTableXml(["المعدّ", "المراجع", "مدير المدرسة"], [["", "", window.MishkatSchoolContext?.getContext?.().managerName||""]], {totalWidth: 9000});
  const sectPr = '<w:sectPr><w:titlePg/><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1320" w:right="720" w:bottom="1080" w:left="720" w:header="300" w:footer="300" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>';
  return {xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}${sectPr}</w:body></w:document>`, school, title};
}
function docxStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Cairo" w:hAnsi="Cairo" w:eastAsia="Cairo" w:cs="Cairo"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:rtl/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:bidi/><w:jc w:val="right"/><w:spacing w:after="100" w:line="330" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
}
function docxSettingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="90"/><w:defaultTabStop w:val="720"/><w:displayBackgroundShape/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat><w:themeFontLang w:val="ar-SA" w:bidi="ar-SA"/><w:decimalSymbol w:val="."/><w:listSeparator w:val=","/><w:updateFields w:val="true"/></w:settings>`;
}
function dataUrlToBytes(dataUrl) {
  const base64 = String(dataUrl).split(",").pop();
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
let crcTableCache = null;
function crc32(bytes) {
  if (!crcTableCache) {
    crcTableCache = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      crcTableCache[n] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = crcTableCache[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function le16(value) { return new Uint8Array([value & 255, (value >>> 8) & 255]); }
function le32(value) { return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
function zipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((Math.floor(now.getSeconds() / 2)) & 31);
  const dosDate = (((now.getFullYear() - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = crc32(data);
    const flags = 0x0800;
    const localHeader = concatBytes([le32(0x04034b50), le16(20), le16(flags), le16(0), le16(dosTime), le16(dosDate), le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), name]);
    localParts.push(localHeader, data);
    const central = concatBytes([le32(0x02014b50), le16(20), le16(20), le16(flags), le16(0), le16(dosTime), le16(dosDate), le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), le16(0), le16(0), le16(0), le32(0), le32(offset), name]);
    centralParts.push(central);
    offset += localHeader.length + data.length;
  }
  const centralData = concatBytes(centralParts);
  const end = concatBytes([le32(0x06054b50), le16(0), le16(0), le16(files.length), le16(files.length), le32(centralData.length), le32(offset), le16(0)]);
  return concatBytes([...localParts, centralData, end]);
}
function buildDocxPackage(result, brandLogos) {
  docxDrawingIdCounter = 1;
  const document = buildDocxDocumentXml(result);
  const schoolBytes = dataUrlToBytes(brandLogos.school);
  const guidanceBytes = dataUrlToBytes(brandLogos.guidance);
  const created = new Date().toISOString();
  const files = [
    {name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`},
    {name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`},
    {name: "word/document.xml", data: document.xml},
    {name: "word/styles.xml", data: docxStylesXml()},
    {name: "word/settings.xml", data: docxSettingsXml()},
    {name: "word/header1.xml", data: docxHeaderXml(document.school, document.title)},
    {name: "word/footer1.xml", data: docxFooterXml(document.school, document.title)},
    {name: "word/_rels/document.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rIdCoverSchool" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/school-logo.png"/><Relationship Id="rIdCoverGuidance" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/student-guidance-logo.png"/></Relationships>`},
    {name: "word/_rels/header1.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSchool" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/school-logo.png"/><Relationship Id="rIdGuidance" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/student-guidance-logo.png"/></Relationships>`},
    {name: "word/media/school-logo.png", data: schoolBytes},
    {name: "word/media/student-guidance-logo.png", data: guidanceBytes},
    {name: "docProps/core.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${docxXmlEscape(document.title)}</dc:title><dc:subject>تحليل النتائج التعليمية</dc:subject><dc:creator>منصة تحليل النتائج التعليمية</dc:creator><cp:lastModifiedBy>منصة تحليل النتائج التعليمية</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`},
    {name: "docProps/app.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>منصة تحليل النتائج التعليمية</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>المدرسة</Company><AppVersion>1.0</AppVersion></Properties>`}
  ];
  return zipStore(files);
}

function preparePrintDocument() {
  if (!state.result || !el.printDocument) return;
  el.printDocument.innerHTML = reportContentHtml(state.result, {school: state.account?.school_logo_data || BRAND_ASSETS.school, guidance: BRAND_ASSETS.guidance}, {wordMode: false});
}
async function downloadWord() {
  if (!state.result || !requirePremium("تصدير Word")) return;
  const originalText = el.exportButton.textContent;
  el.exportButton.disabled = true;
  el.exportButton.textContent = "جارٍ تجهيز ملف Word...";
  try {
    const brandLogos = await getBrandData();
    // إنشاء ملف DOCX حقيقي بهيكل OOXML كامل. هذا يمنح Word تحكمًا أدق
    // في مقاس A4، وصفحة الغلاف، والهيدر والفوتر، وثبات عرض الجداول والخلايا.
    const docxBytes = buildDocxPackage(state.result, brandLogos);
    const blob = new Blob([docxBytes], {type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
    const metadata = state.result.metadata || {};
    const school = metadata.school_name || state.result.school_name_detected || "المدرسة";
    const title = metadata.report_title || MODES[state.mode]?.reportTitle || state.result.mode_name || "تحليل النتائج";
    const safeSchool = String(school).replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 50) || "المدرسة";
    const safeTitle = String(title).replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60) || "تحليل النتائج";
    const filename = `${safeTitle} - ${safeSchool}.docx`;

    // دعم المتصفحات القديمة والجديدة مع تأخير إلغاء الرابط حتى يكتمل التنزيل.
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
      }, 30000);
    }
    showStatus("تم تجهيز تقرير Word بصيغة DOCX وتنزيله بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus(`تعذر تجهيز تقرير Word: ${error?.message || "خطأ غير معروف"}.`, true);
  } finally {
    el.exportButton.disabled = false;
    el.exportButton.textContent = originalText;
  }
}

async function analyzeFiles() {
  if (!state.mode) { showStatus("اختر نوع التحليل أولًا.", true); return; }
  if (!state.files.length) { showStatus("اختر ملف Excel واحدًا على الأقل.", true); return; }
  const grades = state.files.map(item => item.grade);
  if (state.mode !== "period" && new Set(grades).size !== grades.length) {
    showStatus("لا يمكن رفع ملفين للصف الدراسي نفسه في هذا النوع من التحليل.", true);
    return;
  }
  const threshold = Number(el.threshold.value || 85);
  const shortTestThreshold = Number(el.shortTestThreshold.value || 50);
  const finalExamThreshold = Number(el.finalExamThreshold.value || 50);
  if (!(threshold >= 0 && threshold <= 100)) { showStatus("حد الرعاية يجب أن يكون بين 0 و100.", true); return; }
  if (!(shortTestThreshold >= 0 && shortTestThreshold <= 100)) { showStatus("نسبة ضعف الاختبار القصير يجب أن تكون بين 0 و100.", true); return; }
  if (!(finalExamThreshold >= 0 && finalExamThreshold <= 100)) { showStatus("نسبة ضعف اختبار نهاية الفصل يجب أن تكون بين 0 و100.", true); return; }

  el.analyzeButton.disabled = true;
  el.analyzeButton.textContent = "جارٍ التحليل...";
  showStatus("جارٍ قراءة ملفات Excel. قد تستغرق العملية عدة ثوانٍ...");
  try {
    let records = [];
    for (let index = 0; index < state.files.length; index++) {
      const item = state.files[index];
      showStatus(`جارٍ تحليل ${item.file.name} (${index + 1}/${state.files.length})...`);
      records = records.concat(await parseWorkbook(item.file, item.grade, state.mode));
    }
    if (state.mode === "period") records = mergePeriodRecords(records, state.mode);
    const result = analyzeRecords(records, threshold, el.notes.value, state.mode, shortTestThreshold, finalExamThreshold);
    result.metadata = {
      school_name: cleanText(el.schoolName.value),
      academic_year: cleanText(el.academicYear.value),
      period: cleanText(el.period.value) || result.period_detected || activeMode().period,
      report_title: cleanText(el.reportTitle.value) || activeMode().reportTitle,
      include_names: el.includeNames.checked
    };
    renderResult(result);
    const calculatedMessage = result.calculated_average_count
      ? ` وتم حساب معدل ${result.calculated_average_count} طالبًا تلقائيًا من نتائج المواد.`
      : "";
    showStatus(`تم تحليل ${result.overall.total} طالبًا بنجاح بنمط «${result.mode_name}».${calculatedMessage}`);
  } catch (error) {
    console.error(error);
    showStatus(error?.message || "حدث خطأ أثناء تحليل الملفات.", true);
  } finally {
    el.analyzeButton.disabled = false;
    el.analyzeButton.textContent = "تحليل النتائج";
  }
}
function resetFilesAndResults() {
  state.files = [];
  state.result = null;
  el.fileInput.value = "";
  el.resultsPanel.hidden = true;
  renderFileList();
  hideStatus();
}
function setupTabs() {
  document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
    if (button.hidden) return;
    setActiveTab(button.dataset.tab);
  }));
}



function showLoginStatus(message, isError = false) { if (!el.loginStatus) return; el.loginStatus.hidden=false; el.loginStatus.textContent=message; el.loginStatus.classList.toggle("error",isError); }
function activeEntitlement(){
  const now=Date.now();
  const active=(state.entitlements||[]).filter(e=>e.is_active!==false&&e.expires_at&&new Date(e.expires_at).getTime()>now);
  return active.find(e=>e.product_code==="all_access")||active.find(e=>e.product_code===CURRENT_PACKAGE_CODE)||null;
}
function isPremiumAccess(){
  if(SCHOOL_EDITION)return true;
  if(!state.account||!state.account.is_active)return false;
  return Boolean(state.account.is_system_admin||state.packageAccess);
}
function premiumExpiryLabel(){
  if(SCHOOL_EDITION)return "نسخة المدرسة — جميع الأدوات متاحة";
  if(state.account?.is_system_admin)return "مدير النظام — جميع المنصات متاحة";
  const entitlement=activeEntitlement();
  if(!entitlement)return "الحفظ والطباعة والتصدير غير متاحة في باقة التحاليل";
  const packageName=PACKAGE_LABELS[entitlement.product_code]||"الاشتراك";
  const period=entitlement.billing_period==="monthly"?"شهري":"سنوي";
  return `${packageName} — ${period} — صالح حتى ${new Date(entitlement.expires_at).toLocaleDateString("ar-SA")}`;
}
function applyBranding() {
  const school=state.account?.school_name || "اسم المدرسة";
  const logo=state.account?.school_logo_data || BRAND_ASSETS.school;
  if(el.headerSchoolName) el.headerSchoolName.textContent=school;
  if(el.headerSchoolLogo) el.headerSchoolLogo.src=logo;
  if(el.schoolProfileName) el.schoolProfileName.value=state.account?.school_name || "";
  if(el.schoolLogoPreview) el.schoolLogoPreview.src=logo;
  if(el.schoolName && !el.schoolName.value) el.schoolName.value=state.account?.school_name || "";
  document.querySelectorAll(".report-school-logo").forEach(img=>img.src=logo);
  brandDataCache=null;
}
function updatePremiumUi() {
  const access=isPremiumAccess();
  const entitlement=activeEntitlement();
  document.body.classList.toggle("premium-unprotected", access);
  if(access){
    document.body.classList.remove("capture-guard");
    if(el.screenShield) el.screenShield.hidden=true;
    clearTimeout(state.securityTimer);
  }
  if(el.currentUserPlan){
    const packageName=entitlement?PACKAGE_LABELS[entitlement.product_code]:"";
    el.currentUserPlan.textContent=SCHOOL_EDITION?"منصة المدرسة":state.account?.is_system_admin?"مدير النظام":access?packageName:"تجريبي";
  }
  if(el.subscriptionExpiry) el.subscriptionExpiry.textContent=premiumExpiryLabel();
  if(el.requestPremiumButton){
    el.requestPremiumButton.hidden=SCHOOL_EDITION||Boolean(state.account?.is_system_admin);
    el.requestPremiumButton.disabled=false;
    el.requestPremiumButton.textContent=entitlement?.product_code==="all_access"?"إدارة أو ترقية الباقة الشاملة":access?"ترقية للباقة الشاملة أو السنوية":"طلب تفعيل Premium";
  }
  updateSecurityWatermark();
  if(el.openArchiveButton){el.openArchiveButton.disabled=!access;el.openArchiveButton.classList.toggle("locked-feature",!access);}
  [el.saveAnalysisButton,el.exportButton,el.printButton].forEach(btn=>{if(!btn)return;btn.disabled=!access;btn.classList.toggle("locked-feature",!access);});
  if(el.saveAnalysisButton) el.saveAnalysisButton.hidden=!state.result;
  if(el.openAdminButton) el.openAdminButton.hidden=!state.account?.is_system_admin;
}
function requirePremium(feature="هذه الميزة") {
  if(isPremiumAccess())return true;
  showDatabaseStatus(`${feature} تتطلب باقة تحليل النتائج أو الباقة الشاملة. باقة التحاليل: 10 ريالات شهريًا أو 50 ريالًا سنويًا.`,true);
  document.querySelector(".account-panel")?.scrollIntoView({behavior:"smooth"});
  return false;
}
async function imageFileToDataUrl(file){if(!file)return null;if(file.size>2*1024*1024)throw new Error("حجم الشعار يجب ألا يتجاوز 2 ميجابايت.");return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("تعذر قراءة الشعار."));r.readAsDataURL(file);});}

function showDatabaseStatus(message, isError = false) {
  el.databaseStatus.hidden = false;
  el.databaseStatus.textContent = message;
  el.databaseStatus.classList.toggle("error", isError);
}
function hideDatabaseStatus() { el.databaseStatus.hidden = true; }
function roleLabel() { if(SCHOOL_EDITION)return "نسخة المدرسة — جميع الأدوات متاحة"; const e=activeEntitlement(); return isPremiumAccess() ? `${state.account?.is_system_admin?"مدير النظام":PACKAGE_LABELS[e?.product_code]||"Premium"} — الحفظ والتصدير متاحان` : "تجريبي — التحليل والعرض فقط"; }
function modeDbName(mode) { return MODES[mode]?.name || mode; }
async function loadProfile(user) {
  if (!db || !user) return null;
  let {data,error}=await db.from("premium_accounts").select("user_id,full_name,school_name,school_logo_data,plan,subscription_period,premium_started_at,premium_expires_at,is_system_admin,is_active").eq("user_id",user.id).maybeSingle();
  if(error) throw error;
  if(!data){await new Promise(r=>setTimeout(r,500));({data,error}=await db.from("premium_accounts").select("user_id,full_name,school_name,school_logo_data,plan,subscription_period,premium_started_at,premium_expires_at,is_system_admin,is_active").eq("user_id",user.id).single());if(error)throw error;}
  return data;
}
async function loadPackageAccess(){
  state.packageAccess=false;
  state.entitlements=[];
  if(!state.user)return;
  const [accessRes,entitlementsRes]=await Promise.all([
    db.rpc("premium_has_package_access",{p_product_code:CURRENT_PACKAGE_CODE,p_user_id:state.user.id}),
    db.from("premium_entitlements").select("product_code,billing_period,started_at,expires_at,is_active").eq("user_id",state.user.id).order("expires_at",{ascending:false})
  ]);
  if(accessRes.error)throw accessRes.error;
  if(entitlementsRes.error)throw entitlementsRes.error;
  state.packageAccess=Boolean(accessRes.data);
  state.entitlements=entitlementsRes.data||[];
}
async function applySession(session) {
  state.user=session?.user||null;state.account=null;state.profile=null;state.packageAccess=false;state.entitlements=[];
  if(!state.user){window.location.replace("../index.html");return;}
  if(state.user){
    try{
      state.account=await loadProfile(state.user);
      state.profile=state.account;
      await loadPackageAccess();
      // لا تُفتح أي منصة بمجرد تسجيل الدخول أو من رابط محفوظ؛ يجب اختيارها من بوابة المنصات أولًا.
      if(!cameFromUnifiedPortal()){window.location.replace("../index.html?notice=choose_platform");return;}
      if(!state.packageAccess&&!state.account?.is_system_admin){window.location.replace("../index.html?notice=package_locked");return;}
    }catch(error){console.error(error);showLoginStatus("تم تسجيل الدخول، لكن تعذر تحميل بيانات الحساب أو الباقة.",true);}
  }
  const loggedIn=Boolean(state.user&&state.account?.is_active);
  if(el.loginPage)el.loginPage.hidden=loggedIn;if(el.appShell)el.appShell.hidden=!loggedIn;if(el.supportChatToggle)el.supportChatToggle.hidden=!loggedIn;
  if(loggedIn){
    if(el.currentUserName)el.currentUserName.textContent=state.account.full_name||state.user.email;
    if(el.currentUserEmail)el.currentUserEmail.textContent=state.user.email||"";
    applyBranding();updatePremiumUi();renderUnifiedPlatformSwitcher();hideDatabaseStatus();startSupportPolling();
  }else{
    state.archive=[];state.supportThread=null;state.supportMessages=[];state.adminSupportThreads=[];state.adminSelectedThread=null;
    stopSupportPolling();closeSupportChat();if(el.archivePanel)el.archivePanel.hidden=true;if(el.adminPanel)el.adminPanel.hidden=true;
  }
}
async function signIn(){const email=el.authEmail.value.trim(),password=el.authPassword.value;if(!email||!password)return showLoginStatus("أدخل البريد الإلكتروني وكلمة المرور.",true);el.signInButton.disabled=true;try{const{data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;await applySession(data.session);}catch(error){showLoginStatus(error.message||"تعذر تسجيل الدخول.",true);}finally{el.signInButton.disabled=false;}}
async function signUp(){const email=el.authEmail.value.trim(),password=el.authPassword.value,full_name=el.authFullName.value.trim();if(!email||!password||!full_name)return showLoginStatus("أدخل الاسم والبريد وكلمة المرور.",true);if(password.length<6)return showLoginStatus("كلمة المرور يجب ألا تقل عن 6 أحرف.",true);el.signUpButton.disabled=true;try{const{data,error}=await db.auth.signUp({email,password,options:{data:{full_name}}});if(error)throw error;if(data.session){await applySession(data.session);}else showLoginStatus("تم إنشاء الحساب. افتح رسالة تأكيد البريد ثم سجّل الدخول.");}catch(error){showLoginStatus(error.message||"تعذر إنشاء الحساب.",true);}finally{el.signUpButton.disabled=false;}}
async function signOut(){clearUnifiedLaunches();await db.auth.signOut();await applySession(null);showLoginStatus("تم تسجيل الخروج.");}
async function saveSchoolProfile(){if(!state.user)return;const name=el.schoolProfileName.value.trim();if(!name)return showDatabaseStatus("اكتب اسم المدرسة أولًا.",true);const logo=state.pendingSchoolLogo||state.account?.school_logo_data||null;el.saveSchoolProfileButton.disabled=true;try{const{data,error}=await db.rpc("premium_update_school_profile",{p_full_name:state.account.full_name||state.user.email,p_school_name:name,p_school_logo_data:logo});if(error)throw error;state.account=data;state.profile=data;state.pendingSchoolLogo=null;applyBranding();showDatabaseStatus("تم حفظ اسم المدرسة وشعارها.");}catch(error){showDatabaseStatus(error.message||"تعذر حفظ بيانات المدرسة.",true);}finally{el.saveSchoolProfileButton.disabled=false;}}
function selectedPremiumPlan(){
  const value=el.paymentPlanInputs?.find(input=>input.checked)?.value||"results_analysis_yearly";
  const [productCode,period]=value.startsWith("all_access_")
    ? ["all_access",value.replace("all_access_","")]
    : ["results_analysis",value.replace("results_analysis_","")];
  const comprehensive=productCode==="all_access";
  const monthly=period==="monthly";
  return {
    productCode,
    period,
    label: comprehensive?"الباقة الشاملة":PACKAGE_LABELS.results_analysis,
    amount: comprehensive?(monthly?50:300):(monthly?10:50),
    amountText: `${comprehensive?(monthly?50:300):(monthly?10:50)} ريالًا`,
    months: monthly?1:12,
    durationText: monthly?"شهر واحد":"12 شهرًا"
  };
}

function activePackageForSubscription(code){
  const now=Date.now();return (state.entitlements||[]).find(e=>e.product_code===code&&e.is_active!==false&&new Date(e.expires_at).getTime()>now)||null;
}
function evaluatePremiumPlan(plan){
  if(state.account?.is_system_admin)return{allowed:false,kind:'admin',message:'مدير النظام لديه صلاحية كاملة ولا يحتاج إلى اشتراك.'};
  const bundle=activePackageForSubscription('all_access');const target=activePackageForSubscription(plan.productCode);
  if(plan.productCode!=='all_access'&&bundle)return{allowed:false,kind:'covered',message:'أنت مشترك في الباقة الشاملة بالفعل، ومنصة التحاليل مشمولة فيها.'};
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

function buildWhatsAppMessage(plan){
  const school=state.account?.school_name||"غير محددة";
  const name=state.account?.full_name||state.user?.email||"غير محدد";
  const email=state.user?.email||"غير محدد";
  return [
    "السلام عليكم، أرغب في الحصول على بيانات الاشتراك وطلب التفعيل.",
    `المنصة الحالية: ${PACKAGE_LABELS.results_analysis}`,
    `الباقة المطلوبة: ${plan.label}`,
    `المدة: ${plan.period==="monthly"?"شهرية":"سنوية"} — ${plan.amountText}`,
    `الاسم: ${name}`,
    `المدرسة: ${school}`,
    `البريد: ${email}`
  ].join("\n");
}
function updatePaymentPlanUi(){
  const plan=selectedPremiumPlan();const eligibility=evaluatePremiumPlan(plan);
  el.paymentPlanInputs?.forEach(input=>input.closest(".subscription-plan-option")?.classList.toggle("selected",input.checked));
  if(el.paymentModalDescription)el.paymentModalDescription.textContent=`${plan.label} (${plan.amountText}) — ${eligibility.message}`;
  if(el.paymentConfirmText)el.paymentConfirmText.textContent=`أؤكد أنني تواصلت عبر واتساب بخصوص ${plan.label} ${plan.period==="monthly"?"الشهرية":"السنوية"} بقيمة ${plan.amountText}.`;
  if(el.paymentSecurityNote)el.paymentSecurityNote.innerHTML=`<strong>حالة الطلب:</strong> ${escapeHtml(eligibility.message)}`;
  if(el.whatsappContactButton){const message=encodeURIComponent(buildWhatsAppMessage(plan));el.whatsappContactButton.href=`https://wa.me/966582712620?text=${message}`;}
  el.paymentConfirmCheckbox.checked=false;
  el.confirmPremiumRequestButton.textContent=eligibility.kind==='period_upgrade'?'إرسال طلب الترقية السنوية':eligibility.kind==='bundle_upgrade'?'إرسال طلب الباقة الشاملة':'إرسال طلب التفعيل';
  el.confirmPremiumRequestButton.disabled=!eligibility.allowed||!el.paymentConfirmCheckbox.checked;
  return eligibility;
}
function openPaymentModal(){
  if(state.account?.is_system_admin){
    showDatabaseStatus("مدير النظام لديه صلاحية كاملة لجميع المنصات.");
    return;
  }
  if(!el.paymentModal) return;
  el.paymentModal.hidden=false;
  el.paymentModal.setAttribute("aria-hidden","false");
  updatePaymentPlanUi();
  document.body.classList.add("modal-open");
  setTimeout(()=>el.whatsappContactButton?.focus(),60);
}
function closePaymentModal(){
  if(!el.paymentModal) return;
  el.paymentModal.hidden=true;
  el.paymentModal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}
async function requestPremium(){
  const plan=selectedPremiumPlan();const eligibility=evaluatePremiumPlan(plan);
  if(!eligibility.allowed)return showDatabaseStatus(eligibility.message,true);
  if(!el.paymentConfirmCheckbox?.checked){showDatabaseStatus("يجب التواصل عبر واتساب أولًا ثم تأكيد التواصل قبل إرسال الطلب.",true);return;}
  el.confirmPremiumRequestButton.disabled=true;const original=el.confirmPremiumRequestButton.textContent;el.confirmPremiumRequestButton.textContent="جارٍ إرسال الطلب...";
  try{
    const note=[`مصدر الطلب: ${PACKAGE_LABELS.results_analysis}`,`الباقة المطلوبة: ${plan.label}`,`المدة: ${plan.period==="monthly"?"شهرية":"سنوية"} بقيمة ${plan.amountText}`,`نوع الطلب: ${eligibility.kind==='period_upgrade'?'ترقية سنوية مع إضافة المدة المتبقية':eligibility.kind==='bundle_upgrade'?'ترقية شاملة مع حفظ مدة الباقة الحالية':'اشتراك جديد'}`,`المدرسة: ${state.account?.school_name||"غير محددة"}`,"تم التواصل عبر واتساب على الرقم 00966582712620"].join(" | ");
    const{error}=await db.rpc("premium_request_package_subscription",{p_product_code:plan.productCode,p_billing_period:plan.period,p_user_note:note});if(error)throw error;
    closePaymentModal();
    showDatabaseStatus(eligibility.kind==='period_upgrade'?"تم إرسال طلب الترقية السنوية، وسيتم احتساب المدة المتبقية تلقائيًا.":eligibility.kind==='bundle_upgrade'?"تم إرسال طلب الباقة الشاملة، وستعود مدة باقتك الحالية بعد انتهاء الشاملة.":`تم إرسال طلب ${plan.label}.`);
  }catch(error){showDatabaseStatus(subscriptionErrorMessage(error),true);}
  finally{el.confirmPremiumRequestButton.textContent=original;const latest=evaluatePremiumPlan(selectedPremiumPlan());el.confirmPremiumRequestButton.disabled=!latest.allowed||!el.paymentConfirmCheckbox?.checked;}
}
async function saveCurrentAnalysis() {
  if (!state.user || !requirePremium("حفظ التحليل")) return;
  if (!state.result) return;
  const original = el.saveAnalysisButton.textContent;
  el.saveAnalysisButton.disabled = true;
  el.saveAnalysisButton.textContent = "جارٍ الحفظ...";
  try {
    const {data, error} = await db.from("premium_saved_analyses").insert(buildSavedPayload()).select("id").single();
    if (error) throw error;
    showDatabaseStatus(`تم حفظ التحليل في الأرشيف بنجاح. رقم الحفظ: ${data.id.slice(0, 8)}`);
    await loadArchive();
  } catch (error) { console.error(error); showDatabaseStatus(error.message || "تعذر حفظ التحليل.", true); }
  finally { el.saveAnalysisButton.disabled = false; el.saveAnalysisButton.textContent = original; }
}
function escapeHtmlDb(value) { return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch])); }
function renderArchive() {
  const q = el.archiveSearch.value.trim().toLowerCase();
  const t = el.archiveTypeFilter.value;
  const rows = state.archive.filter(item => (!t || item.analysis_type === t) && (!q || [item.title,item.academic_year,item.period_name,...(item.grade_labels||[])].join(" ").toLowerCase().includes(q)));
  if (!rows.length) { el.archiveList.innerHTML = '<div class="empty-state">لا توجد تحليلات مطابقة.</div>'; return; }
  el.archiveList.innerHTML = rows.map(item => `<article class="archive-card">
    <div class="archive-card-head"><div><span>${escapeHtmlDb(modeDbName(item.analysis_type))}</span><h3>${escapeHtmlDb(item.title)}</h3></div><time>${new Date(item.created_at).toLocaleString("ar-SA")}</time></div>
    <div class="archive-meta"><span>العام: ${escapeHtmlDb(item.academic_year || "—")}</span><span>الفترة: ${escapeHtmlDb(item.period_name || "—")}</span><span>الطلاب: ${item.student_count}</span><span>المتوسط: ${item.overall_average == null ? "—" : Number(item.overall_average).toFixed(2)+"%"}</span></div>
    <div class="archive-grades">${(item.grade_labels||[]).map(x=>`<b>${escapeHtmlDb(x)}</b>`).join("")}</div>
    <div class="actions inline-actions"><button class="primary-button" data-open-analysis="${item.id}" type="button">فتح التحليل</button>${isPremiumAccess() ? `<button class="danger-button" data-delete-analysis="${item.id}" type="button">حذف</button>` : ""}</div>
  </article>`).join("");
  el.archiveList.querySelectorAll("[data-open-analysis]").forEach(b=>b.addEventListener("click",()=>openSavedAnalysis(b.dataset.openAnalysis)));
  el.archiveList.querySelectorAll("[data-delete-analysis]").forEach(b=>b.addEventListener("click",()=>deleteSavedAnalysis(b.dataset.deleteAnalysis)));
}
async function loadArchive() {
  if (!state.user || !requirePremium("الأرشيف السحابي")) return;
  el.archiveList.innerHTML = '<div class="empty-state">جارٍ تحميل الأرشيف...</div>';
  const {data, error} = await db.from("premium_saved_analyses").select("id,title,analysis_type,academic_year,period_name,grade_labels,student_count,overall_average,created_at").order("created_at", {ascending:false});
  if (error) { el.archiveList.innerHTML = `<div class="status-box error">${escapeHtmlDb(error.message)}</div>`; return; }
  state.archive = data || [];
  renderArchive();
}
async function openSavedAnalysis(id) {
  const {data, error} = await db.from("premium_saved_analyses").select("report_data").eq("id", id).single();
  if (error) return showDatabaseStatus(error.message, true);
  const r = data.report_data;
  state.mode = r.mode || r.analysis_type || state.mode || "semester";
  document.querySelectorAll(".mode-card").forEach(card => { const selected = card.dataset.mode === state.mode; card.classList.toggle("selected", selected); card.setAttribute("aria-checked", selected ? "true" : "false"); });
  renderResult(r);
  el.archivePanel.hidden = true;
  showDatabaseStatus("تم فتح التحليل المحفوظ. يمكنك عرضه أو تصديره Word وPDF.");
}
async function deleteSavedAnalysis(id) {
  if (!requirePremium("حذف التحليل") || !confirm("هل تريد حذف هذا التحليل نهائيًا؟")) return;
  const {error} = await db.from("premium_saved_analyses").delete().eq("id", id);
  if (error) return showDatabaseStatus(error.message, true);
  await loadArchive();
  showDatabaseStatus("تم حذف التحليل.");
}

async function loadAdminData(){
  if(!state.account?.is_system_admin)return;
  el.subscriptionRequestsList.innerHTML="جارٍ التحميل...";el.premiumUsersList.innerHTML="جارٍ التحميل...";
  const[{data:req,error:e1},{data:users,error:e2},{data:ents,error:e3}]=await Promise.all([
    db.from("premium_subscription_requests").select("id,user_id,product_code,amount_sar,billing_period,duration_months,status,user_note,requested_at,request_kind,upgrade_context").eq("status","pending").order("requested_at",{ascending:true}),
    db.from("premium_accounts").select("user_id,full_name,email,school_name,is_system_admin,is_active,created_at").order("created_at",{ascending:false}),
    db.from("premium_entitlements").select("user_id,product_code,billing_period,expires_at,is_active").order("expires_at",{ascending:false})
  ]);
  if(e1||e2||e3){showDatabaseStatus((e1||e2||e3).message,true);return;}
  state.adminRequests=req||[];state.adminUsers=users||[];state.adminEntitlements=ents||[];
  renderAdminData();await loadAdminSupportThreads();
}
function adminRequestDescription(r){
  if(r.request_kind==="upgrade_period")return "ترقية من الشهرية إلى السنوية مع إضافة المدة المتبقية.";
  if(r.request_kind==="upgrade_bundle")return "ترقية إلى الباقة الشاملة مع حفظ مدة الباقة الحالية واستعادتها بعد انتهاء الشاملة.";
  return "اشتراك جديد.";
}
function renderAdminData(){
  const userMap=Object.fromEntries(state.adminUsers.map(u=>[u.user_id,u]));
  const now=Date.now();
  el.subscriptionRequestsList.innerHTML=state.adminRequests.length?state.adminRequests.map(r=>{
    const u=userMap[r.user_id]||{};
    const periodLabel=r.billing_period==="monthly"?"شهري":"سنوي";
    const packageLabel=PACKAGE_LABELS[r.product_code]||r.product_code||"باقة غير محددة";
    return `<article class="admin-item"><h4>${escapeHtml(packageLabel)}</h4><p><strong>صاحب الطلب:</strong> ${escapeHtml(u.school_name||u.full_name||"مستخدم")} — ${escapeHtml(u.email||"")}</p><p>${Number(r.amount_sar).toFixed(0)} ريال · ${periodLabel} · ${new Date(r.requested_at).toLocaleString("ar-SA")}</p><p><strong>${escapeHtml(adminRequestDescription(r))}</strong></p><p>${escapeHtml(r.user_note||"")}</p><div class="actions inline-actions"><button class="primary-button" data-approve-request="${r.id}">تفعيل ${escapeHtml(packageLabel)}</button><button class="danger-button" data-reject-request="${r.id}">رفض</button></div></article>`;
  }).join(""):"<div class='empty-state'>لا توجد طلبات معلقة.</div>";
  el.premiumUsersList.innerHTML=state.adminUsers.length?state.adminUsers.map(u=>{
    const isSelf=u.user_id===state.user?.id;
    const activeEnts=state.adminEntitlements.filter(e=>e.user_id===u.user_id&&e.is_active!==false&&new Date(e.expires_at).getTime()>now);
    const packages=u.is_system_admin?["مدير النظام — جميع الباقات"]:activeEnts.length?activeEnts.map(e=>`${PACKAGE_LABELS[e.product_code]||e.product_code} (${e.billing_period==="monthly"?"شهري":"سنوي"} حتى ${new Date(e.expires_at).toLocaleDateString("ar-SA")})`):["لا توجد باقة نشطة"];
    const roleButton=u.is_system_admin?`<button class="secondary-button compact-button" data-set-admin="false" data-user-id="${u.user_id}" ${isSelf?"disabled title='لا يمكن إلغاء صلاحيتك من حسابك الحالي'":""}>إلغاء صلاحية المدير</button>`:`<button class="primary-button compact-button" data-set-admin="true" data-user-id="${u.user_id}">تعيين مدير</button>`;
    return `<article class="admin-item admin-user-item"><div class="admin-user-title"><div><h4>${escapeHtml(u.school_name||u.full_name||"مستخدم")}</h4><p>${escapeHtml(u.email||"بريد غير متاح")}</p></div><span class="admin-role-badge ${u.is_system_admin?"manager":"user"}">${u.is_system_admin?"مدير":"مستخدم"}</span></div><p>${packages.map(escapeHtml).join("<br>")}</p><div class="actions inline-actions">${roleButton}</div></article>`;
  }).join(""):"<div class='empty-state'>لا يوجد مستخدمون.</div>";
  el.subscriptionRequestsList.querySelectorAll("[data-approve-request]").forEach(b=>b.onclick=()=>approveRequest(b.dataset.approveRequest));
  el.subscriptionRequestsList.querySelectorAll("[data-reject-request]").forEach(b=>b.onclick=()=>rejectRequest(b.dataset.rejectRequest));
  el.premiumUsersList.querySelectorAll("[data-set-admin]").forEach(b=>b.onclick=()=>setAdminRole(b.dataset.userId,b.dataset.setAdmin==="true"));
}
async function approveRequest(requestId){
  const{error}=await db.rpc("premium_admin_activate_package_request",{p_request_id:requestId,p_admin_note:"تم التفعيل من لوحة إدارة منصة تحليل النتائج"});
  if(error)return showDatabaseStatus(subscriptionErrorMessage(error),true);
  showDatabaseStatus("تم التفعيل مع تطبيق قواعد الترقية وحفظ المدة المتبقية.");
  await loadAdminData();
}
async function rejectRequest(requestId){
  const{error}=await db.rpc("premium_admin_reject_request",{p_request_id:requestId,p_admin_note:"تم رفض الطلب"});
  if(error)return showDatabaseStatus(error.message,true);
  showDatabaseStatus("تم رفض الطلب.");
  await loadAdminData();
}
async function setAdminRole(userId,makeAdmin){
  const user=state.adminUsers.find(u=>u.user_id===userId);if(!user)return;
  const action=makeAdmin?"تعيين هذا الحساب مديرًا للنظام":"إلغاء صلاحية المدير من هذا الحساب";
  if(!confirm(`${action}؟\n${user.email||user.full_name||userId}`))return;
  const{error}=await db.rpc("premium_admin_set_role",{p_user_id:userId,p_is_admin:makeAdmin});
  if(error){const message=error.message?.includes("cannot_remove_own")?"لا يمكنك إلغاء صلاحية المدير من حسابك الحالي.":error.message;return showDatabaseStatus(message||"تعذر تعديل الصلاحية.",true);}
  showDatabaseStatus(makeAdmin?"تم تعيين الحساب مديرًا للنظام.":"تم إلغاء صلاحية المدير من الحساب.");await loadAdminData();
}

function formatSupportTime(value){return value?new Date(value).toLocaleString("ar-SA",{dateStyle:"short",timeStyle:"short"}):"";}
function supportMessageHtml(message,adminView=false){
  const isCurrentUser=message.sender_id===state.user?.id;
  const isAdminSender=state.adminUsers.some(u=>u.user_id===message.sender_id&&u.is_system_admin);
  const mine=adminView?isAdminSender:isCurrentUser;
  const senderLabel=adminView?(isCurrentUser?"أنت — الدعم":isAdminSender?"مدير آخر — الدعم":"المستخدم"):(isCurrentUser?"أنت":"الدعم الفني");
  return `<div class="support-message ${mine?"mine":"theirs"}"><div class="support-message-meta"><span>${senderLabel}</span><time>${formatSupportTime(message.created_at)}</time></div><p>${escapeHtml(message.message).replaceAll("\n","<br>")}</p></div>`;
}
function showSupportStatus(message,isError=false){if(!el.supportChatStatus)return;el.supportChatStatus.hidden=false;el.supportChatStatus.textContent=message;el.supportChatStatus.classList.toggle("error",isError);setTimeout(()=>{if(el.supportChatStatus)el.supportChatStatus.hidden=true;},4000);}
function renderUserSupportMessages(){
  if(!el.supportChatMessages)return;
  el.supportChatMessages.innerHTML=state.supportMessages.length?state.supportMessages.map(m=>supportMessageHtml(m,false)).join(""):'<div class="support-empty">ابدأ المحادثة برسالة، وسيصل رد الدعم هنا.</div>';
  requestAnimationFrame(()=>{el.supportChatMessages.scrollTop=el.supportChatMessages.scrollHeight;});
  const unread=state.supportThread&&state.supportThread.last_message_at&&(!state.supportThread.last_read_by_user_at||new Date(state.supportThread.last_message_at)>new Date(state.supportThread.last_read_by_user_at));
  if(el.supportUnreadBadge){el.supportUnreadBadge.hidden=!unread;el.supportUnreadBadge.textContent=unread?"1":"0";}
}
async function loadUserSupportChat(silent=false){
  if(!state.user)return;
  const{data:thread,error}=await db.from("premium_support_threads").select("id,user_id,status,last_message_at,last_read_by_user_at,last_read_by_admin_at,created_at").eq("user_id",state.user.id).maybeSingle();
  if(error){if(!silent)showSupportStatus(error.message,true);return;}
  state.supportThread=thread||null;
  if(!thread){state.supportMessages=[];renderUserSupportMessages();return;}
  const{data:messages,error:messageError}=await db.from("premium_support_messages").select("id,thread_id,sender_id,message,created_at").eq("thread_id",thread.id).order("created_at",{ascending:true}).limit(300);
  if(messageError){if(!silent)showSupportStatus(messageError.message,true);return;}
  state.supportMessages=messages||[];renderUserSupportMessages();
  if(!el.supportChatPanel?.hidden){await db.rpc("premium_support_mark_read",{p_thread_id:thread.id});state.supportThread.last_read_by_user_at=new Date().toISOString();if(el.supportUnreadBadge)el.supportUnreadBadge.hidden=true;}
}
async function sendUserSupportMessage(){
  const message=el.supportChatInput?.value.trim();if(!message)return showSupportStatus("اكتب رسالة أولًا.",true);
  el.supportChatSendButton.disabled=true;const original=el.supportChatSendButton.textContent;el.supportChatSendButton.textContent="جارٍ الإرسال...";
  try{const{error}=await db.rpc("premium_support_send_message",{p_message:message,p_thread_id:null});if(error)throw error;el.supportChatInput.value="";await loadUserSupportChat();}
  catch(error){showSupportStatus(error.message||"تعذر إرسال الرسالة.",true);}finally{el.supportChatSendButton.disabled=false;el.supportChatSendButton.textContent=original;}
}
async function openSupportChat(){if(!state.user)return;el.supportChatPanel.hidden=false;el.supportChatToggle?.setAttribute("aria-expanded","true");await loadUserSupportChat();setTimeout(()=>el.supportChatInput?.focus(),50);}
function closeSupportChat(){if(el.supportChatPanel)el.supportChatPanel.hidden=true;el.supportChatToggle?.setAttribute("aria-expanded","false");}
function toggleSupportChat(){if(el.supportChatPanel?.hidden)openSupportChat();else closeSupportChat();}
function startSupportPolling(){stopSupportPolling();if(!state.user)return;loadUserSupportChat(true);state.supportPollTimer=setInterval(async()=>{if(!state.user)return;if(!el.supportChatPanel?.hidden)await loadUserSupportChat(true);else await checkUserSupportUnread();if(state.account?.is_system_admin&&!el.adminPanel?.hidden)await loadAdminSupportThreads(true);},9000);}
function stopSupportPolling(){if(state.supportPollTimer){clearInterval(state.supportPollTimer);state.supportPollTimer=null;}}
async function checkUserSupportUnread(){
  if(!state.user)return;const{data}=await db.from("premium_support_threads").select("id,last_message_at,last_read_by_user_at").eq("user_id",state.user.id).maybeSingle();state.supportThread=data||state.supportThread;
  const unread=data&&data.last_message_at&&(!data.last_read_by_user_at||new Date(data.last_message_at)>new Date(data.last_read_by_user_at));if(el.supportUnreadBadge){el.supportUnreadBadge.hidden=!unread;el.supportUnreadBadge.textContent=unread?"1":"0";}
}
async function loadAdminSupportThreads(silent=false){
  if(!state.account?.is_system_admin||!el.adminSupportThreadsList)return;
  if(!silent)el.adminSupportThreadsList.innerHTML='<div class="empty-state">جارٍ تحميل المحادثات...</div>';
  const{data,error}=await db.from("premium_support_threads").select("id,user_id,status,last_message_at,last_read_by_user_at,last_read_by_admin_at,created_at").order("last_message_at",{ascending:false});
  if(error){if(!silent)el.adminSupportThreadsList.innerHTML=`<div class="status-box error">${escapeHtml(error.message)}</div>`;return;}
  state.adminSupportThreads=data||[];renderAdminSupportThreads();
}
function renderAdminSupportThreads(){
  const users=Object.fromEntries(state.adminUsers.map(u=>[u.user_id,u]));
  el.adminSupportThreadsList.innerHTML=state.adminSupportThreads.length?state.adminSupportThreads.map(t=>{const u=users[t.user_id]||{};const unread=t.last_message_at&&(!t.last_read_by_admin_at||new Date(t.last_message_at)>new Date(t.last_read_by_admin_at));const selected=state.adminSelectedThread?.id===t.id;return `<button class="admin-support-thread ${selected?"selected":""}" data-support-thread="${t.id}" type="button"><span class="thread-status ${t.status}"></span><span class="thread-copy"><strong>${escapeHtml(u.school_name||u.full_name||"مستخدم")}</strong><small>${escapeHtml(u.email||t.user_id)}</small><time>${formatSupportTime(t.last_message_at)}</time></span>${unread?'<b class="thread-unread">جديد</b>':''}</button>`}).join(""):'<div class="empty-state">لا توجد محادثات دعم حتى الآن.</div>';
  el.adminSupportThreadsList.querySelectorAll("[data-support-thread]").forEach(b=>b.onclick=()=>selectAdminSupportThread(b.dataset.supportThread));
}
async function selectAdminSupportThread(threadId){
  const thread=state.adminSupportThreads.find(t=>t.id===threadId);if(!thread)return;state.adminSelectedThread=thread;renderAdminSupportThreads();
  const user=state.adminUsers.find(u=>u.user_id===thread.user_id)||{};el.adminSupportThreadTitle.textContent=user.school_name||user.full_name||"مستخدم";el.adminSupportThreadMeta.textContent=`${user.email||""} · ${thread.status==="closed"?"مغلقة":"مفتوحة"}`;
  el.adminSupportReplyInput.disabled=false;el.adminSupportReplyButton.disabled=false;el.adminSupportStatusButton.hidden=false;el.adminSupportStatusButton.textContent=thread.status==="closed"?"إعادة فتح المحادثة":"إغلاق المحادثة";
  await loadAdminSupportMessages(threadId);
}
async function loadAdminSupportMessages(threadId){
  el.adminSupportMessages.innerHTML='<div class="support-empty">جارٍ تحميل الرسائل...</div>';
  const{data,error}=await db.from("premium_support_messages").select("id,thread_id,sender_id,message,created_at").eq("thread_id",threadId).order("created_at",{ascending:true}).limit(500);
  if(error){el.adminSupportMessages.innerHTML=`<div class="status-box error">${escapeHtml(error.message)}</div>`;return;}
  state.adminSupportMessages=data||[];el.adminSupportMessages.innerHTML=state.adminSupportMessages.length?state.adminSupportMessages.map(m=>supportMessageHtml(m,true)).join(""):'<div class="support-empty">لا توجد رسائل.</div>';requestAnimationFrame(()=>{el.adminSupportMessages.scrollTop=el.adminSupportMessages.scrollHeight;});
  await db.rpc("premium_support_mark_read",{p_thread_id:threadId});const thread=state.adminSupportThreads.find(t=>t.id===threadId);if(thread)thread.last_read_by_admin_at=new Date().toISOString();renderAdminSupportThreads();
}
async function sendAdminSupportReply(){
  const thread=state.adminSelectedThread;const message=el.adminSupportReplyInput?.value.trim();if(!thread)return;if(!message)return showDatabaseStatus("اكتب رد الدعم أولًا.",true);
  el.adminSupportReplyButton.disabled=true;const original=el.adminSupportReplyButton.textContent;el.adminSupportReplyButton.textContent="جارٍ الإرسال...";
  try{const{error}=await db.rpc("premium_support_send_message",{p_message:message,p_thread_id:thread.id});if(error)throw error;el.adminSupportReplyInput.value="";await loadAdminSupportThreads(true);state.adminSelectedThread=state.adminSupportThreads.find(t=>t.id===thread.id)||thread;await loadAdminSupportMessages(thread.id);}
  catch(error){showDatabaseStatus(error.message||"تعذر إرسال الرد.",true);}finally{el.adminSupportReplyButton.disabled=false;el.adminSupportReplyButton.textContent=original;}
}
async function toggleAdminSupportStatus(){
  const thread=state.adminSelectedThread;if(!thread)return;const next=thread.status==="closed"?"open":"closed";const{error}=await db.rpc("premium_support_set_status",{p_thread_id:thread.id,p_status:next});if(error)return showDatabaseStatus(error.message,true);thread.status=next;el.adminSupportStatusButton.textContent=next==="closed"?"إعادة فتح المحادثة":"إغلاق المحادثة";el.adminSupportThreadMeta.textContent=el.adminSupportThreadMeta.textContent.replace(/مفتوحة|مغلقة/,next==="closed"?"مغلقة":"مفتوحة");await loadAdminSupportThreads(true);showDatabaseStatus(next==="closed"?"تم إغلاق محادثة الدعم.":"تمت إعادة فتح محادثة الدعم.");
}

function updateSecurityWatermark(){
  if(!el.securityWatermark) return;
  if(!state.user || isPremiumAccess()){
    el.securityWatermark.textContent="";
    el.securityWatermark.hidden=true;
    return;
  }
  const label=[state.account?.school_name||"منصة تحليل النتائج",state.user.email||state.account?.full_name||"مستخدم",new Date().toLocaleString("ar-SA")].join(" • ");
  el.securityWatermark.textContent=Array(18).fill(label).join("     ");
  el.securityWatermark.hidden=false;
}
function showScreenShield(duration=1600){
  if(!el.screenShield||!state.user||isPremiumAccess())return;
  document.body.classList.add("capture-guard");
  el.screenShield.hidden=false;
  clearTimeout(state.securityTimer);
  state.securityTimer=setTimeout(()=>{
    el.screenShield.hidden=true;
    if(document.hasFocus() && !document.hidden) document.body.classList.remove("capture-guard");
  },duration);
}
function isEditableTarget(target){return target instanceof HTMLElement && !!target.closest("input,textarea,select,[contenteditable='true']");}
function installContentProtection(){
  document.addEventListener("contextmenu",event=>{if(!isEditableTarget(event.target))event.preventDefault();});
  document.addEventListener("copy",event=>{if(!isEditableTarget(event.target)){event.preventDefault();showDatabaseStatus("نسخ محتوى التقارير غير متاح لحماية بيانات الطلاب.",true);}});
  document.addEventListener("cut",event=>{if(!isEditableTarget(event.target))event.preventDefault();});
  document.addEventListener("dragstart",event=>{if(event.target instanceof HTMLImageElement||!isEditableTarget(event.target))event.preventDefault();});
  const captureAttempt=()=>{
    if(isPremiumAccess()) return;
    showScreenShield(3200);
    setTimeout(()=>navigator.clipboard?.writeText("").catch(()=>{}),40);
    setTimeout(()=>navigator.clipboard?.writeText("").catch(()=>{}),450);
  };
  document.addEventListener("keydown",event=>{
    const key=String(event.key||"").toLowerCase();
    const premium=isPremiumAccess();
    const blockedKeys=premium?["c","s","u"]:["c","s","p","u"];
    const blocked=(event.ctrlKey||event.metaKey)&&blockedKeys.includes(key);
    const dev=(event.ctrlKey||event.metaKey)&&event.shiftKey&&["i","j","c"].includes(key);
    const snip=(event.metaKey||event.getModifierState?.("Meta"))&&event.shiftKey&&key==="s";
    if(blocked&&!isEditableTarget(event.target)){event.preventDefault();showDatabaseStatus("هذا الاختصار معطّل لحماية التقرير.",true);}
    if(dev||key==="f12"){event.preventDefault();captureAttempt();}
    if(!premium&&(key==="printscreen"||snip)){event.preventDefault();captureAttempt();}
    if(key==="escape"&&!el.paymentModal?.hidden)closePaymentModal();
  },true);
  document.addEventListener("keyup",event=>{if(!isPremiumAccess()&&String(event.key||"").toLowerCase()==="printscreen")captureAttempt();},true);
  window.addEventListener("blur",()=>{if(state.user&&!isPremiumAccess()&&!document.body.classList.contains("modal-open"))captureAttempt();});
  window.addEventListener("focus",()=>{if(state.user){setTimeout(()=>{if(document.hasFocus()&&!document.hidden){el.screenShield.hidden=true;document.body.classList.remove("capture-guard");}},350);}});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.user&&!isPremiumAccess())captureAttempt();});
  // حماية فقدان التركيز تعمل للحساب التجريبي فقط؛ Premium يسمح بلقطات الشاشة وأداة القص.
  setInterval(()=>{
    if(!state.user||isPremiumAccess()||document.body.classList.contains("modal-open"))return;
    if(document.hidden||!document.hasFocus()) showScreenShield(650);
  },80);
  window.addEventListener("beforeprint",event=>{if(!isPremiumAccess()){event.preventDefault?.();captureAttempt();}});
}

async function initDatabase() {
  if(SCHOOL_EDITION){
    const ctx=window.MishkatSchoolContext?.getContext?.()||{};
    state.user={id:ctx.id||"mishkat-school-user",email:""};
    state.account={user_id:state.user.id,full_name:ctx.counselorName||"الموجه الطلابي",school_name:ctx.schoolName||"مدارس المشكاة الأهلية",school_logo_data:"../assets/school-logo.png",is_system_admin:false,is_active:true};
    state.profile=state.account;state.packageAccess=true;state.entitlements=[];
    if(el.loginPage)el.loginPage.hidden=true;if(el.appShell)el.appShell.hidden=false;if(el.supportChatToggle)el.supportChatToggle.hidden=true;
    if(el.currentUserName)el.currentUserName.textContent=state.account.full_name;if(el.currentUserEmail)el.currentUserEmail.textContent=ctx.stage||"";
    applyBranding();updatePremiumUi();renderUnifiedPlatformSwitcher();hideDatabaseStatus();
    window.addEventListener("mishkat:school-context-changed",()=>{const c=window.MishkatSchoolContext?.getContext?.()||{};state.account.full_name=c.counselorName||state.account.full_name;state.account.school_name=c.schoolName||state.account.school_name;applyBranding();});
    return;
  }
  if (!db) return showDatabaseStatus("تعذر تحميل مكتبة الاتصال بقاعدة البيانات.", true);
  const {data} = await db.auth.getSession();
  await applySession(data.session);
  db.auth.onAuthStateChange((_event, session) => setTimeout(() => applySession(session), 0));
}

document.querySelectorAll(".mode-card").forEach(card => card.addEventListener("click", () => selectMode(card.dataset.mode)));
el.fileInput.addEventListener("change", event => setFiles(event.target.files));
el.dropZone.addEventListener("dragover", event => { event.preventDefault(); el.dropZone.classList.add("dragging"); });
el.dropZone.addEventListener("dragleave", () => el.dropZone.classList.remove("dragging"));
el.dropZone.addEventListener("drop", event => { event.preventDefault(); el.dropZone.classList.remove("dragging"); setFiles(event.dataTransfer.files); });
el.analyzeButton.addEventListener("click", analyzeFiles);
el.resetButton.addEventListener("click", resetFilesAndResults);
el.exportButton.addEventListener("click", downloadWord);
el.printButton.addEventListener("click", () => { if(!requirePremium("الطباعة وPDF")) return; preparePrintDocument(); requestAnimationFrame(() => window.print()); });
el.signInButton?.addEventListener("click", signIn);
el.signUpButton?.addEventListener("click", signUp);
el.signOutButton?.addEventListener("click", signOut);
el.openArchiveButton?.addEventListener("click", async () => { if(!requirePremium("الأرشيف السحابي")) return; el.archivePanel.hidden = !el.archivePanel.hidden; if (!el.archivePanel.hidden) { await loadArchive(); el.archivePanel.scrollIntoView({behavior:"smooth"}); } });
el.refreshArchiveButton?.addEventListener("click", loadArchive);
el.archiveSearch?.addEventListener("input", renderArchive);
el.archiveTypeFilter?.addEventListener("change", renderArchive);
el.saveAnalysisButton?.addEventListener("click", saveCurrentAnalysis);
el.schoolLogoInput?.addEventListener("change", async e=>{try{state.pendingSchoolLogo=await imageFileToDataUrl(e.target.files?.[0]);if(state.pendingSchoolLogo)el.schoolLogoPreview.src=state.pendingSchoolLogo;}catch(error){showDatabaseStatus(error.message,true);}});
el.saveSchoolProfileButton?.addEventListener("click",saveSchoolProfile);
el.paymentPlanInputs?.forEach(input=>input.addEventListener("change",updatePaymentPlanUi));
el.requestPremiumButton?.addEventListener("click",openPaymentModal);
el.closePaymentModalButton?.addEventListener("click",closePaymentModal);
document.querySelectorAll("[data-close-payment-modal]").forEach(node=>node.addEventListener("click",closePaymentModal));
el.paymentConfirmCheckbox?.addEventListener("change",()=>{const eligibility=evaluatePremiumPlan(selectedPremiumPlan());el.confirmPremiumRequestButton.disabled=!eligibility.allowed||!el.paymentConfirmCheckbox.checked;});
el.confirmPremiumRequestButton?.addEventListener("click",requestPremium);
el.openAdminButton?.addEventListener("click",async()=>{el.adminPanel.hidden=!el.adminPanel.hidden;if(!el.adminPanel.hidden){await loadAdminData();el.adminPanel.scrollIntoView({behavior:"smooth"});}});
el.openSupportButton?.addEventListener("click",openSupportChat);
el.supportChatToggle?.addEventListener("click",toggleSupportChat);
el.closeSupportChatButton?.addEventListener("click",closeSupportChat);
el.refreshSupportChatButton?.addEventListener("click",()=>loadUserSupportChat());
el.supportChatSendButton?.addEventListener("click",sendUserSupportMessage);
el.supportChatInput?.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendUserSupportMessage();}});
el.refreshAdminSupportButton?.addEventListener("click",()=>loadAdminSupportThreads());
el.adminSupportReplyButton?.addEventListener("click",sendAdminSupportReply);
el.adminSupportReplyInput?.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendAdminSupportReply();}});
el.adminSupportStatusButton?.addEventListener("click",toggleAdminSupportStatus);

setupTabs();
renderFileList();
installContentProtection();
initDatabase();

window.__APP_TEST__ = {selectMode, parseWorkbook, analyzeRecords, classifyAverage, parseTabularPeriodSheet, extractSubjectDetails, finalizeFinalExamRecords, inferFinalExamMax, mergePeriodRecords, inferGrade, inferClassNumber, gradeOrdinal, makeClassLabel, gradeOptionsHtml, categoriesWithData, categoryLabel, formatArabicList, renderOverview, renderClasses, reportContentHtml, wordReportHtml, buildDocxPackage, getMode: id => MODES[id], getState: () => state};
