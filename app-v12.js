const SUPABASE_URL="https://fpicgtldwfevdvpbxkjf.supabase.co";
const SUPABASE_KEY="sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
const SCHOOL_EDITION=true;
window.MISHKAT_SCHOOL_EDITION=true;
const db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
window.__UNIFIED_PLATFORM_DB__=db;
const WHATSAPP_NUMBER="966582712620";
const LABELS={results_analysis:"باقة تحليل النتائج",guidance_records:"باقة السجلات الرقمية",all_access:"الباقة الشاملة",presentations:"منصة العروض التقديمية",counselor_plan:"منصة خطة الموجه الطلابي",achievement_reports:"منصة تقارير الإنجاز",messages_library:"مكتبة رسائل أولياء الأمور",certificates_gift:"شهادات التقدير — هدية",smart_calendar:"التقويم الذكي والتنبيهات — حصري الشاملة"};
const PLATFORMS=[
 {code:"results_analysis",title:"تحليل النتائج التعليمية",desc:"تحليل ملفات Excel، مؤشرات التحصيل، ضعاف المواد، تقارير Word وPDF، وأرشفة التحليلات.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/></svg>`,className:"analysis",href:"analysis/index.html",available:true},
 {code:"guidance_records",title:"السجلات الرقمية للموجه الطلابي",desc:"نماذج رقمية للسجلات الإرشادية، دراسة الحالة، الزيارات، المقابلات، المواظبة والأرشفة.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>`,className:"records",href:"records/index.html",available:true},
 {code:"presentations",title:"العروض التقديمية",desc:"مكتبة عروض توجيهية احترافية مصنفة حسب المرحلة ونوع الطلاب، مع عرض داخلي وطلبات تصميم خاصة.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M10 8l5 2.5-5 2.5z"/></svg>`,className:"presentations",href:"presentations/index.html",available:true},
 {code:"counselor_plan",title:"خطة الموجه الطلابي",desc:"إنشاء خطة أسبوعية ذكية حسب المرحلة والتقويم الدراسي، مع توزيع الأسابيع والإجازات والبرامج وإخراج جاهز للطباعة.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m15 16 1.4 1.4L19 14.8"/></svg>`,className:"counselor-plan",href:"plans/index.html",available:true},
 {code:"smart_calendar",title:"التقويم الذكي والتنبيهات",desc:"تقويم تنفيذي مرتبط بخطة الموجه، يذكّرك بالمناسبات والبرامج القادمة، ويرصد البرامج غير المنفذة وانخفاض الإنجاز تلقائيًا. حصري للباقة الشاملة.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M14 14h2M8 17h2"/><path d="m16 18 1.5 1.5L21 16"/></svg>`,className:"smart-calendar",href:"calendar/index.html",available:true},
 {code:"messages_library",title:"مراسلات الموجه الطلابي",desc:"مكتبة ضخمة من الرسائل المختصرة والراقية لولي الأمر، تشمل التفوق والغياب والسلوك والاختبارات والقدرات والتحصيلي. متاحة للباقات السنوية فقط.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v12H7l-3 3z"/><path d="M8 9h8M8 13h5"/></svg>`,className:"messages",href:"messages/index.html",available:true},
 {code:"achievement_reports",title:"تقارير الإنجاز",desc:"إنشاء تقارير برامج الموجه الطلابي بنماذج جاهزة، أهداف ومؤشرات وخطة تنفيذ وتقويم وصور شواهد، مع الطباعة وPDF وWord.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/><path d="m14 18 2 2 3-4"/></svg>`,className:"reports",href:"reports/index.html",available:true},
 {code:"certificates_gift",title:"شهادات التقدير",desc:"إنشاء شهادات تفوق وتقدير وتهنئة فاخرة من التوجيه الطلابي، مع تهنئة خاصة لولي الأمر وقوالب جاهزة وطباعة فردية وجماعية. هدية للباقات السنوية والشاملة.",icon:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v14H5z"/><path d="m9 21 3-4 3 4"/><path d="m12 6 1.2 2.4 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"/></svg>`,className:"certificates",href:"certificates/index.html",available:true}
];
const state={user:null,account:null,entitlements:[],promoAccesses:[],pendingLogo:null,adminUsers:[],adminRequests:[],adminEntitlements:[],adminCustomRequests:[],adminPromoCodes:[]};
const el=Object.fromEntries([...document.querySelectorAll('[id]')].map(x=>[x.id,x]));
const $all=s=>[...document.querySelectorAll(s)];
function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function clean(v){return String(v??"").replace(/\s+/g," ").trim()}
function nowActive(e){return e&&e.is_active!==false&&new Date(e.expires_at).getTime()>Date.now()}
function activeEntitlements(){return state.entitlements.filter(nowActive)}
function activePromoAccesses(){return state.promoAccesses.filter(x=>new Date(x.access_ends_at).getTime()>Date.now())}
function promoCovers(code){return activePromoAccesses().some(x=>x.product_code===code||x.product_code==='all_access')}
function promoFor(code){return activePromoAccesses().find(x=>x.product_code===code)||activePromoAccesses().find(x=>x.product_code==='all_access')||null}
function isAdmin(){return Boolean(state.account?.is_system_admin)}
function hasAllAccess(){return SCHOOL_EDITION||isAdmin()||activeEntitlements().some(e=>e.product_code==='all_access')||activePromoAccesses().some(x=>x.product_code==='all_access')}
function hasAnnualPackage(){return SCHOOL_EDITION||isAdmin()||activeEntitlements().some(e=>e.billing_period==='yearly')||activePromoAccesses().some(x=>x.product_code==='all_access'||x.product_code==='messages_library')}
function hasGiftCertificatesAccess(){return SCHOOL_EDITION||isAdmin()||activeEntitlements().some(e=>e.product_code==='all_access'||e.billing_period==='yearly')||activePromoAccesses().some(x=>x.product_code==='all_access')}
function hasAccess(code){return true} // منصة المدارس: جميع الخدمات متاحة بدون اشتراك
function hasPaidPackage(){return activeEntitlements().length>0||isAdmin()}
function activePackageFor(code){return activeEntitlements().find(e=>e.product_code===code&&(e.source_request_id||!activePromoAccesses().some(g=>g.product_code===code)))||null}
function planEligibility(product,period){
  if(isAdmin())return{allowed:false,kind:'admin',message:'مدير النظام لديه صلاحية كاملة لجميع المنصات ولا يحتاج إلى اشتراك.'};
  const bundle=activePackageFor('all_access');
  const target=activePackageFor(product);
  if(product!=='all_access'&&bundle)return{allowed:false,kind:'covered',message:'أنت مشترك في الباقة الشاملة بالفعل، وهذه الباقة مشمولة فيها.'};
  if(target){
    if(target.billing_period===period)return{allowed:false,kind:'same',message:'أنت بالفعل مشترك في هذه الباقة بنفس الخطة.'};
    if(target.billing_period==='yearly'&&period==='monthly')return{allowed:false,kind:'downgrade',message:'لا يمكن التحويل من الخطة السنوية إلى الشهرية أثناء سريان الاشتراك.'};
    if(target.billing_period==='monthly'&&period==='yearly')return{allowed:true,kind:'period_upgrade',message:`ترقية إلى الخطة السنوية: سيُضاف العام الجديد بعد نهاية المدة الحالية، والمتبقي الآن ${formatRemainingTime(target.expires_at)}.`};
  }
  if(product==='all_access'){
    const individuals=activeEntitlements().filter(e=>e.product_code!=='all_access');
    if(individuals.length){
      const names=individuals.map(e=>LABELS[e.product_code]||e.product_code).join('، ');
      return{allowed:true,kind:'bundle_upgrade',message:`ترقية إلى الباقة الشاملة: ستعمل كل المنصات لمدة ${period==='monthly'?'شهر':'سنة'}. سيتم حفظ الوقت المتبقي في ${names} واستكماله تلقائيًا بعد انتهاء الباقة الشاملة.`};
    }
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
function promoErrorMessage(error){
 const raw=String(error?.message||error||'');
 const messages={promo_code_required:'اكتب البرومو كود أولًا.',promo_code_not_found:'الكود غير صحيح أو غير موجود.',promo_code_inactive:'هذا الكود موقوف.',promo_code_expired:'انتهت صلاحية استخدام هذا الكود.',promo_code_fully_redeemed:'تم استخدام الكود بالعدد المسموح.',promo_code_already_redeemed:'سبق استخدام هذا الكود على حسابك.',account_not_active:'الحساب موقوف ولا يمكن تفعيل الهدية.',promo_duration_must_be_1_to_10_days:'مدة الهدية يجب أن تكون من يوم إلى 10 أيام.',promo_max_redemptions_must_be_1_to_100:'عدد الاستخدامات يجب أن يكون من 1 إلى 100.',promo_expiry_must_be_in_future:'تاريخ انتهاء الكود يجب أن يكون في المستقبل.',invalid_promo_product:'الباقة أو المنصة المحددة غير صالحة.',invalid_promo_code_format:'استخدم 4 إلى 32 حرفًا إنجليزيًا أو رقمًا، ويمكن استخدام - و _.',promo_code_already_exists:'هذا الكود مستخدم بالفعل. اختر كودًا آخر.',forbidden:'هذه العملية متاحة لمدير النظام فقط.'};
 const key=Object.keys(messages).find(k=>raw.includes(k));return key?messages[key]:(raw||'تعذر تنفيذ عملية البرومو كود.');
}
function generatePromoCode(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let part='';
 if(window.crypto?.getRandomValues){const bytes=new Uint32Array(8);crypto.getRandomValues(bytes);for(const n of bytes)part+=alphabet[n%alphabet.length]}else{for(let i=0;i<8;i++)part+=alphabet[Math.floor(Math.random()*alphabet.length)]}
 return `GIFT-${part}`;
}


function platformLaunchKey(code){return `unified_platform_launch_${code}`}
function rememberPlatformLaunch(code){
  try{
    sessionStorage.setItem(platformLaunchKey(code),String(Date.now()));
    sessionStorage.setItem('unified_last_platform',code);
  }catch(_error){}
}
function clearPlatformLaunches(){
  try{
    Object.keys(sessionStorage).filter(k=>k.startsWith('unified_platform_launch_')).forEach(k=>sessionStorage.removeItem(k));
    sessionStorage.removeItem('unified_last_platform');
  }catch(_error){}
}
function launchPlatform(code,href){
  // School edition: opening a platform must NEVER depend on school settings,
  // manager selection, subscriptions or any saved profile value.
  if(!href)return;
  rememberPlatformLaunch(code);
  const sep=href.includes('?')?'&':'?';
  window.location.assign(`${href}${sep}from=portal`);
}
function formatDate(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('ar-SA')}
function showStatus(node,msg,error=false){node.hidden=false;node.textContent=msg;node.classList.toggle('error',error)}
function hideStatus(node){if(node)node.hidden=true}
function toast(msg){el.toast.textContent=msg;el.toast.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.toast.hidden=true,3500)}
function openModal(id){document.getElementById(id).hidden=false;document.body.style.overflow='hidden'}
function closeModal(id){document.getElementById(id).hidden=true;document.body.style.overflow=''}
function setAuthBusy(b){el.signInButton.disabled=b;el.signUpButton.disabled=b;el.signInButton.textContent=b?'جارٍ التنفيذ...':'تسجيل الدخول'}
function initials(){const n=clean(state.account?.school_name||state.account?.full_name||'مدرسة');return n.charAt(0)||'م'}
async function imageToDataUrl(file){if(!file)return null;if(file.size>2*1024*1024)throw new Error('حجم الشعار يجب ألا يتجاوز 2 ميجابايت.');return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function loadAccount(){
 let{data,error}=await db.from('premium_accounts').select('user_id,full_name,email,school_name,school_logo_data,is_system_admin,is_active,presentation_audience_type').eq('user_id',state.user.id).maybeSingle();
 if(error)throw error;if(!data){await new Promise(r=>setTimeout(r,500));({data,error}=await db.from('premium_accounts').select('user_id,full_name,email,school_name,school_logo_data,is_system_admin,is_active,presentation_audience_type').eq('user_id',state.user.id).single());if(error)throw error}
 state.account=data;
 const nowIso=new Date().toISOString();
 const[entsResult,promoResult]=await Promise.all([
  db.from('premium_entitlements').select('id,user_id,product_code,billing_period,started_at,expires_at,source_request_id,is_active').eq('user_id',state.user.id).order('expires_at',{ascending:false}),
  db.from('premium_promo_redemptions').select('id,product_code,duration_days,access_started_at,access_ends_at,entitlement_expires_at,redeemed_at').eq('user_id',state.user.id).gt('access_ends_at',nowIso).order('access_ends_at',{ascending:false})
 ]);
 if(entsResult.error)throw entsResult.error;if(promoResult.error)throw promoResult.error;state.entitlements=entsResult.data||[];state.promoAccesses=promoResult.data||[];
}
function planSummary(){
 if(SCHOOL_EDITION)return{title:"منصة المدرسة",details:"مدارس المشكاة الأهلية — جميع الخدمات متاحة",chips:["جميع الخدمات متاحة","نسخة المدرسة"]};
 const gifts=activePromoAccesses();const giftProducts=new Set(gifts.map(g=>g.product_code));
 const giftChips=gifts.map(g=>`هدية: ${LABELS[g.product_code]||g.product_code} حتى ${formatDate(g.access_ends_at)}`);
 if(isAdmin())return{title:'مدير النظام',details:'صلاحية كاملة لجميع المنصات والباقات.',chips:['جميع المنصات','هدية: شهادات التقدير',...giftChips]};
 const active=activeEntitlements();const paidActive=active.filter(e=>e.source_request_id||!giftProducts.has(e.product_code));const all=paidActive.find(e=>e.product_code==='all_access');
 if(all){const resumed=paidActive.filter(e=>e.product_code!=='all_access'&&new Date(e.expires_at).getTime()>new Date(all.expires_at).getTime());const resumeText=resumed.length?` — وبعد انتهائها تُستأنف ${resumed.map(e=>LABELS[e.product_code]||e.product_code).join('، ')} حتى ${formatDate(resumed.reduce((m,e)=>new Date(e.expires_at)>new Date(m.expires_at)?e:m).expires_at)}`:'';return{title:'الباقة الشاملة',details:`${all.billing_period==='monthly'?'اشتراك شهري':'اشتراك سنوي'} — سارية حتى ${formatDate(all.expires_at)}${resumeText}`,chips:['تحليل النتائج','السجلات الرقمية','العروض التقديمية','خطة الموجه الطلابي','تقارير الإنجاز','التقويم الذكي والتنبيهات','هدية: شهادات التقدير','كل المنصات القادمة',...giftChips]};}
 if(!paidActive.length&&gifts.length)return{title:gifts.some(g=>g.product_code==='all_access')?'الباقة الشاملة — كود هدية':'كود هدية مفعّل',details:gifts.map(g=>`${LABELS[g.product_code]||g.product_code}: ${g.duration_days} ${g.duration_days===1?'يوم':'أيام'} حتى ${formatDate(g.access_ends_at)}`).join(' — '),chips:giftChips};
 if(!paidActive.length)return{title:'حساب غير مشترك',details:'لا توجد باقة مدفوعة نشطة. اختر الباقة المطلوبة أو فعّل كود هدية.',chips:['لا توجد منصة مفعّلة']};
 const chips=paidActive.map(e=>LABELS[e.product_code]||e.product_code);const certificateGift=hasGiftCertificatesAccess()?['هدية: شهادات التقدير']:[];return{title:chips.join(' + '),details:paidActive.map(e=>`${LABELS[e.product_code]||e.product_code}: حتى ${formatDate(e.expires_at)}`).join(' — '),chips:[...chips,...certificateGift,...giftChips]};
}
function renderIdentity(){
 const school=state.account?.school_name||'أضف اسم المدرسة';const name=state.account?.full_name||state.user?.email||'مستخدم';const logo=state.pendingLogo||state.account?.school_logo_data;
 el.headerSchoolName.textContent=school;el.headerUserName.textContent=name;if(el.profileFullName)el.profileFullName.value=state.account?.full_name||'';if(el.schoolProfileName)el.schoolProfileName.value=state.account?.school_name||'';
 [ [el.headerSchoolLogo,el.headerLogoPlaceholder],[el.schoolLogoPreview,el.profileLogoPlaceholder] ].forEach(([img,ph])=>{if(!img||!ph)return;if(logo){img.src=logo;img.hidden=false;ph.hidden=true}else{img.hidden=true;ph.hidden=false;if(ph===el.headerLogoPlaceholder)ph.textContent=initials()}});
 const p=planSummary();el.headerPlanName.textContent=p.title;el.headerPlanExpiry.textContent=p.details;el.currentPackageTitle.textContent=p.title;el.currentPackageDetails.textContent=p.details;el.activePackageChips.innerHTML=p.chips.map(c=>`<span class="package-chip">${escapeHtml(c)}</span>`).join('');
 el.openAdminButton.hidden=!isAdmin();
 el.accessExplanation.textContent='جميع خدمات منصة مدارس المشكاة الأهلية متاحة بدون باقات أو اشتراكات.';
 renderPlatforms();
}
function platformStatus(p){
 if(!p.available)return{mode:'coming',label:'قريبًا',meta:'قيد التطوير',button:'ستتاح لاحقًا'};
 if(SCHOOL_EDITION)return{mode:'active',label:'متاحة',meta:'متاحة ضمن منصة مدارس المشكاة الأهلية',button:'دخول المنصة'};
 if(p.code==='messages_library'&&!hasAnnualPackage())return{mode:'locked',label:'سنوي فقط',meta:'متاحة حصريًا لأي باقة سنوية',button:'الترقية إلى السنوي'};
 if(p.code==='smart_calendar'&&!hasAllAccess())return{mode:'locked',label:'حصري الشاملة',meta:'متاح فقط مع الباقة الشاملة الشهرية أو السنوية',button:'الترقية للشاملة'};
 if(p.code==='smart_calendar'&&hasAllAccess())return{mode:'active',label:'ميزة الشاملة',meta:'التقويم والتنبيهات الذكية مفعّلان ضمن الباقة الشاملة',button:'فتح التقويم'};
 if(p.code==='certificates_gift'&&!hasGiftCertificatesAccess())return{mode:'locked',label:'هدية السنوي',meta:'هدية مجانية لأي باقة سنوية أو الباقة الشاملة',button:'عرض الباقات'};
 if(p.code==='certificates_gift'&&hasGiftCertificatesAccess())return{mode:'active',label:'هدية مفعّلة',meta:'مشمولة مجانًا مع الباقة السنوية أو الشاملة',button:'دخول المنصة'};
 if(hasAccess(p.code)){
   const gift=promoFor(p.code);
   const e=activeEntitlements().find(x=>x.product_code==='all_access')||activeEntitlements().find(x=>x.product_code===p.code);
   const meta=isAdmin()?'متاحة لمدير النظام':gift?`هدية مفعّلة حتى ${formatDate(gift.access_ends_at)}`:e?`سارية حتى ${formatDate(e.expires_at)}`:'متاحة';
   return{mode:'active',label:gift?'هدية مفعّلة':'مفعّلة',meta,button:'دخول المنصة'};
 }
 return{mode:'locked',label:'غير مفعّلة',meta:'هذه المنصة غير مشمولة في باقتك الحالية',button:'عرض خيارات الاشتراك'};
}
function renderPlatforms(){
 const cards=PLATFORMS.map((p,index)=>{const s=platformStatus(p);const usable=s.mode==='active';const action=usable?`<button class="primary-button platform-action-button" type="button" data-launch-platform="${p.code}" data-platform-href="${p.href}"><span>دخول المنصة</span><b>←</b></button>`:`<button class="locked-button secondary-button platform-action-button" type="button" ${s.mode==='locked'?`data-request-locked="${p.code}"`:''} ${s.mode==='coming'?'disabled':''}><span>${s.button}</span><b>${s.mode==='coming'?'…':'+'}</b></button>`;return{...p,status:s,html:`<article class="platform-card ${p.className} ${s.mode}"><div class="platform-card-accent"></div><div class="platform-top"><div class="platform-icon">${p.icon}</div><span class="status-badge">${s.label}</span></div><div class="platform-card-body"><span class="platform-number">0${index+1}</span><h3>${p.title}</h3><p>${p.desc}</p></div><div class="platform-card-footer"><div class="platform-meta">${s.meta}</div>${action}</div></article>`}});
 const activeCards=cards.filter(x=>x.status.mode==='active');
 const inactiveCards=cards.filter(x=>x.status.mode!=='active');
 if(el.activePlatformGrid&&activeCards.length)el.activePlatformGrid.innerHTML=activeCards.map(x=>x.html).join('');
 if(el.lockedPlatformGrid)el.lockedPlatformGrid.innerHTML=inactiveCards.map(x=>x.html).join('');
 if(el.activePlatformCount)el.activePlatformCount.textContent=String(SCHOOL_EDITION?PLATFORMS.filter(p=>p.available).length:activeCards.length);
 if(el.lockedPlatformCount)el.lockedPlatformCount.textContent=String(inactiveCards.length);
 if(el.activePlatformCountBadge)el.activePlatformCountBadge.textContent=String(SCHOOL_EDITION?PLATFORMS.filter(p=>p.available).length:activeCards.length);
 if(el.lockedPlatformCountBadge)el.lockedPlatformCountBadge.textContent=String(inactiveCards.length);
 $all('[data-launch-platform]').forEach(b=>b.onclick=()=>launchPlatform(b.dataset.launchPlatform,b.dataset.platformHref));
 $all('[data-request-locked]').forEach(b=>b.onclick=()=>showSubscription(b.dataset.requestLocked));
}
async function applySession(session){
 state.user=session?.user||null;state.account=null;state.entitlements=[];state.promoAccesses=[];state.pendingLogo=null;
 if(!state.user){clearPlatformLaunches();if(el.authBoot)el.authBoot.hidden=true;el.loginPage.hidden=false;el.portalShell.hidden=true;return}
 try{
   await loadAccount();
   if(state.account?.is_active===false)throw new Error('هذا الحساب موقوف. تواصل مع مدير النظام.');
   // V19.0.9: لا نعرض نموذج تسجيل الدخول أثناء فحص الجلسة؛ ننتقل مباشرة من شاشة التحقق إلى البوابة.
   clearPlatformLaunches();
   if(el.authBoot)el.authBoot.hidden=true;el.loginPage.hidden=true;el.portalShell.hidden=false;renderIdentity();handleNotice();
 }catch(err){if(el.authBoot)el.authBoot.hidden=true;showStatus(el.loginStatus,err.message||'تعذر تحميل الحساب.',true);el.loginPage.hidden=false;el.portalShell.hidden=true}
}
function handleNotice(){
 let stored='';try{stored=sessionStorage.getItem('portal_notice')||'';sessionStorage.removeItem('portal_notice')}catch(_error){}
 if(stored){el.portalNotice.hidden=false;el.portalNotice.textContent=stored;return}
 const n=new URLSearchParams(location.search).get('notice');
 if(n==='package_locked'){el.portalNotice.hidden=false;el.portalNotice.textContent='المنصة التي حاولت فتحها غير مشمولة في باقتك الحالية. اختر منصة مفعّلة أو اطلب ترقية الباقة.';history.replaceState({},'',location.pathname);return}
 if(n==='choose_platform'){el.portalNotice.hidden=false;el.portalNotice.textContent='تم توجيهك إلى بوابة المنصات. اختر بنفسك المنصة المفعّلة التي تريد الدخول إليها.';history.replaceState({},'',location.pathname);return}
 el.portalNotice.hidden=true
}
async function signIn(){const email=clean(el.authEmail.value),password=el.authPassword.value;if(!email||!password)return showStatus(el.loginStatus,'أدخل البريد الإلكتروني وكلمة المرور.',true);setAuthBusy(true);try{const{data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;await applySession(data.session)}catch(e){showStatus(el.loginStatus,e.message||'تعذر تسجيل الدخول.',true)}finally{setAuthBusy(false)}}
async function signUp(){const email=clean(el.authEmail.value),password=el.authPassword.value,full_name=clean(el.authFullName.value);if(!email||password.length<6||!full_name)return showStatus(el.loginStatus,'اكتب الاسم والبريد وكلمة مرور من 6 أحرف على الأقل.',true);setAuthBusy(true);try{const{data,error}=await db.auth.signUp({email,password,options:{data:{full_name}}});if(error)throw error;if(data.session)await applySession(data.session);else showStatus(el.loginStatus,'تم إنشاء الحساب. راجع بريدك لتأكيد الحساب ثم سجّل الدخول.')}catch(e){showStatus(el.loginStatus,e.message||'تعذر إنشاء الحساب.',true)}finally{setAuthBusy(false)}}
async function signOut(){clearPlatformLaunches();await db.auth.signOut();await applySession(null)}
async function saveProfile(){
 const managerSelect=document.getElementById("schoolDirectorSelect");
 el.saveSchoolProfileButton.disabled=true;
 try{
   if(window.MishkatSchoolContext&&managerSelect)await window.MishkatSchoolContext.setManager(managerSelect.value);
   const ctx=window.MishkatSchoolContext?.getContext?.()||{};
   if(state.account){state.account.full_name=ctx.counselorName||state.account.full_name;state.account.school_name=ctx.schoolName||state.account.school_name;}
   renderIdentity();
   if(el.profileStatus)showStatus(el.profileStatus,ctx.managerName?`مدير المدرسة: ${ctx.managerName}`:'بيانات التوزيع تُحمّل تلقائيًا.');
 }catch(e){showStatus(el.profileStatus,e.message||'تعذر حفظ الإعدادات.',true)}finally{el.saveSchoolProfileButton.disabled=false}
}
async function requestActivation(){const p=selectedPlan();const eligibility=planEligibility(p.product,p.period);if(!eligibility.allowed)return showStatus(el.subscriptionStatus,eligibility.message,true);if(!el.whatsappConfirmed.checked)return;el.sendActivationRequestButton.disabled=true;try{const note=`طلب من البوابة الموحدة — ${p.label} — ${p.period==='monthly'?'شهري':'سنوي'} — ${eligibility.kind==='period_upgrade'?'ترقية من شهري إلى سنوي':eligibility.kind==='bundle_upgrade'?'ترقية إلى الباقة الشاملة مع حفظ المدة المتبقية':'اشتراك جديد'} — تم التواصل عبر واتساب على 00966582712620.`;const{error}=await db.rpc('premium_request_package_subscription',{p_product_code:p.product,p_billing_period:p.period,p_user_note:note});if(error)throw error;showStatus(el.subscriptionStatus,eligibility.kind==='period_upgrade'?'تم إرسال طلب الترقية السنوية. ستُضاف المدة الحالية المتبقية تلقائيًا عند التفعيل.':eligibility.kind==='bundle_upgrade'?'تم إرسال طلب الباقة الشاملة. ستُحفظ مدة باقتك الحالية وتعود بعد انتهاء الشاملة.':'تم إرسال طلب التفعيل إلى مدير النظام.');toast('تم إرسال الطلب')}catch(e){showStatus(el.subscriptionStatus,subscriptionErrorMessage(e),true)}finally{const latest=planEligibility(p.product,p.period);el.sendActivationRequestButton.disabled=!latest.allowed||!el.whatsappConfirmed.checked}}
const PRESENTATION_AUDIENCE_LABELS={boys:'بنين',girls:'بنات'};
async function loadAdmin(){
 if(!isAdmin())return;showStatus(el.adminStatus,'جارٍ تحميل البيانات...');
 const[rr,ur,er,cr,pr]=await Promise.all([
  db.from('premium_subscription_requests').select('id,user_id,product_code,amount_sar,billing_period,status,user_note,requested_at,request_kind,upgrade_context').eq('status','pending').order('requested_at',{ascending:true}),
  db.from('premium_accounts').select('user_id,full_name,email,school_name,is_system_admin,is_active,created_at,presentation_audience_type').order('created_at',{ascending:false}),
  db.from('premium_entitlements').select('user_id,product_code,billing_period,expires_at,is_active').order('expires_at',{ascending:false}),
  db.from('premium_custom_presentation_requests').select('id,user_id,school_name,requester_name,title,category,stage,audience_gender,objective,desired_slides,delivery_notes,status,estimated_price_sar,created_at').in('status',['pending','contacted','quoted','in_progress']).order('created_at',{ascending:true}),
  db.from('premium_promo_codes').select('id,code,product_code,duration_days,max_redemptions,redeemed_count,is_active,expires_at,created_at').order('created_at',{ascending:false})
 ]);
 const error=rr.error||ur.error||er.error||cr.error||pr.error;if(error)return showStatus(el.adminStatus,error.message,true);
 state.adminRequests=rr.data||[];state.adminUsers=ur.data||[];state.adminEntitlements=er.data||[];state.adminCustomRequests=cr.data||[];state.adminPromoCodes=pr.data||[];hideStatus(el.adminStatus);renderAdmin()
}
function adminRequestDescription(r){
 if(r.request_kind==='upgrade_period')return 'ترقية من الخطة الشهرية إلى السنوية مع إضافة المدة المتبقية.';
 if(r.request_kind==='upgrade_bundle'){const items=r.upgrade_context?.source_packages||[];const names=items.map(x=>LABELS[x.product_code]||x.product_code).join('، ');return `ترقية إلى الباقة الشاملة مع حفظ المدة المتبقية${names?` في: ${names}`:''}.`;}
 return 'اشتراك جديد.';
}
function adminAudienceControl(u){
 const selected=u.presentation_audience_type||'';
 return `<div class="admin-audience-control"><div><strong>نوع طلاب العروض</strong><small>${selected?`النوع الحالي: ${escapeHtml(PRESENTATION_AUDIENCE_LABELS[selected]||selected)}`:'لم يحدد المستخدم النوع بعد'}</small></div><select data-audience-select="${u.user_id}" aria-label="نوع طلاب العروض"><option value="boys" ${selected==='boys'?'selected':''}>بنين</option><option value="girls" ${selected==='girls'?'selected':''}>بنات</option></select><button class="secondary-button" data-set-audience="${u.user_id}" type="button">${selected?'تغيير النوع':'تعيين النوع'}</button></div>`;
}
function renderAdmin(){
 const userMap=Object.fromEntries(state.adminUsers.map(u=>[u.user_id,u]));
 el.adminRequestsList.innerHTML=state.adminRequests.length?state.adminRequests.map(r=>{const u=userMap[r.user_id]||{};return `<article class="admin-item"><div class="admin-item-head"><div><h4>${escapeHtml(LABELS[r.product_code]||r.product_code)}</h4><p>${escapeHtml(u.school_name||u.full_name||'مستخدم')} — ${escapeHtml(u.email||'')}</p></div><span>${r.billing_period==='monthly'?'شهري':'سنوي'} · ${Number(r.amount_sar).toFixed(0)} ريال</span></div><p><strong>${escapeHtml(adminRequestDescription(r))}</strong></p><p>${escapeHtml(r.user_note||'')}</p><div class="actions"><button class="primary-button" data-approve="${r.id}">تفعيل الباقة</button><button class="danger-button" data-reject="${r.id}">رفض</button></div></article>`}).join(''):'<div class="status-box">لا توجد طلبات معلقة.</div>';
 const now=Date.now();
 el.adminUsersList.innerHTML=state.adminUsers.map(u=>{
  const active=state.adminEntitlements.filter(e=>e.user_id===u.user_id&&e.is_active!==false&&new Date(e.expires_at).getTime()>now);
  const packages=u.is_system_admin?['مدير النظام — جميع الباقات']:active.length?active.map(e=>`${LABELS[e.product_code]||e.product_code} حتى ${formatDate(e.expires_at)}`):['لا توجد باقة نشطة'];
  const self=u.user_id===state.user.id;
  return `<article class="admin-item"><div class="admin-item-head"><div><h4>${escapeHtml(u.school_name||u.full_name||'مستخدم')}</h4><p>${escapeHtml(u.email||'')}</p></div><span>${u.is_system_admin?'مدير':'مستخدم'}</span></div><p>${packages.map(escapeHtml).join('<br>')}</p>${adminAudienceControl(u)}<div class="actions">${u.is_system_admin?`<button class="danger-button" data-admin-role="false" data-user-id="${u.user_id}" ${self?'disabled':''}>إلغاء صلاحية المدير</button>`:`<button class="secondary-button" data-admin-role="true" data-user-id="${u.user_id}">تعيين مدير</button>`}</div></article>`
 }).join('');
 const categoryLabels={ministerial:'وزاري',qualitative:'نوعي',values:'قيمي',custom:'خاص'};const stageLabels={lower_primary:'الابتدائية الدنيا',upper_primary:'الابتدائية العليا',middle:'المتوسطة',secondary:'الثانوية'};const genderLabels={boys:'بنين',girls:'بنات'};
 if(el.adminCustomRequestsList)el.adminCustomRequestsList.innerHTML=state.adminCustomRequests.length?state.adminCustomRequests.map(r=>`<article class="admin-item"><div class="admin-item-head"><div><h4>${escapeHtml(r.title)}</h4><p>${escapeHtml(r.school_name||r.requester_name||'مستخدم')}</p></div><span>${escapeHtml(categoryLabels[r.category]||r.category)} · ${escapeHtml(stageLabels[r.stage]||r.stage)} · ${escapeHtml(genderLabels[r.audience_gender]||r.audience_gender)}</span></div><p><strong>الهدف:</strong> ${escapeHtml(r.objective)}</p><p>${r.desired_slides} شرائح${r.delivery_notes?` — ${escapeHtml(r.delivery_notes)}`:''}</p><div class="actions"><button class="secondary-button" data-custom-contacted="${r.id}">تم التواصل</button><button class="primary-button" data-custom-completed="${r.id}">مكتمل</button></div></article>`).join(''):'<div class="status-box">لا توجد طلبات عروض خاصة قيد المتابعة.</div>';
 if(el.adminPromoList)el.adminPromoList.innerHTML=state.adminPromoCodes.length?state.adminPromoCodes.map(p=>{const expired=p.expires_at&&new Date(p.expires_at).getTime()<=Date.now();const full=Number(p.redeemed_count)>=Number(p.max_redemptions);const status=!p.is_active?'موقوف':expired?'منتهي':full?'مكتمل الاستخدام':'نشط';const statusClass=!p.is_active||expired||full?'inactive':'active';return `<article class="admin-item promo-code-item ${statusClass}"><div class="admin-item-head"><div><h4 class="promo-code-text">${escapeHtml(p.code)}</h4><p>${escapeHtml(LABELS[p.product_code]||p.product_code)} — ${p.duration_days} ${p.duration_days===1?'يوم':'أيام'}</p></div><span>${status}</span></div><div class="promo-code-meta"><span>الاستخدام: ${p.redeemed_count}/${p.max_redemptions}</span><span>${p.expires_at?`صلاحية الكود حتى ${formatDate(p.expires_at)}`:'بدون تاريخ انتهاء'}</span><span>أُنشئ ${formatDate(p.created_at)}</span></div><div class="actions"><button class="secondary-button" data-copy-promo="${escapeHtml(p.code)}">نسخ الكود</button><button class="${p.is_active?'danger-button':'primary-button'}" data-toggle-promo="${p.id}" data-promo-active="${p.is_active?'true':'false'}">${p.is_active?'إيقاف الكود':'إعادة التفعيل'}</button></div></article>`}).join(''):'<div class="status-box">لم يتم إنشاء أكواد هدايا بعد.</div>';
 $all('[data-approve]').forEach(b=>b.onclick=()=>approve(b.dataset.approve));
 $all('[data-reject]').forEach(b=>b.onclick=()=>rejectReq(b.dataset.reject));
 $all('[data-admin-role]').forEach(b=>b.onclick=()=>setAdmin(b.dataset.userId,b.dataset.adminRole==='true'));
 $all('[data-set-audience]').forEach(b=>b.onclick=()=>setPresentationAudience(b.dataset.setAudience));
 $all('[data-custom-contacted]').forEach(b=>b.onclick=()=>updateCustomRequest(b.dataset.customContacted,'contacted'));
 $all('[data-custom-completed]').forEach(b=>b.onclick=()=>updateCustomRequest(b.dataset.customCompleted,'completed'));
 $all('[data-copy-promo]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copyPromo);toast('تم نسخ البرومو كود')}catch(_e){prompt('انسخ البرومو كود:',b.dataset.copyPromo)}});
 $all('[data-toggle-promo]').forEach(b=>b.onclick=()=>togglePromoCode(b.dataset.togglePromo,b.dataset.promoActive==='true'));
}
async function createPromoCode(){
 const code=clean(el.adminPromoCode?.value||'')||null;const product=el.adminPromoProduct?.value||'all_access';const days=Number(el.adminPromoDays?.value||1);const maxUses=Number(el.adminPromoMaxUses?.value||1);const rawExpiry=el.adminPromoExpiresAt?.value||'';const expiresAt=rawExpiry?new Date(rawExpiry).toISOString():null;
 if(days<1||days>10)return showStatus(el.promoAdminStatus,'مدة الهدية يجب أن تكون من يوم إلى 10 أيام.',true);
 if(maxUses<1||maxUses>100)return showStatus(el.promoAdminStatus,'عدد مرات الاستخدام يجب أن يكون من 1 إلى 100.',true);
 el.createPromoCodeButton.disabled=true;hideStatus(el.promoAdminStatus);
 try{const{data,error}=await db.rpc('premium_admin_create_promo_code',{p_code:code,p_product_code:product,p_duration_days:days,p_max_redemptions:maxUses,p_expires_at:expiresAt});if(error)throw error;el.adminPromoCode.value='';showStatus(el.promoAdminStatus,`تم إنشاء الكود ${data.code} بنجاح.`);toast('تم إنشاء برومو كود الهدية');await loadAdmin()}catch(e){showStatus(el.promoAdminStatus,promoErrorMessage(e),true)}finally{el.createPromoCodeButton.disabled=false}
}
async function togglePromoCode(id,currentActive){
 const action=currentActive?'إيقاف':'إعادة تفعيل';if(!confirm(`${action} هذا البرومو كود؟`))return;
 const{error}=await db.rpc('premium_admin_set_promo_code_active',{p_promo_id:id,p_is_active:!currentActive});if(error)return showStatus(el.adminStatus,promoErrorMessage(error),true);toast(currentActive?'تم إيقاف الكود':'تم تفعيل الكود');await loadAdmin()
}
async function redeemPromoCode(){
 const code=clean(el.promoRedeemCode.value).toUpperCase();if(!code)return showStatus(el.promoRedeemStatus,'اكتب البرومو كود أولًا.',true);
 el.redeemPromoButton.disabled=true;hideStatus(el.promoRedeemStatus);
 try{const{data,error}=await db.rpc('premium_redeem_promo_code',{p_code:code});if(error)throw error;await loadAccount();renderIdentity();const label=LABELS[data.product_code]||data.product_code;showStatus(el.promoRedeemStatus,`تم تفعيل ${label} هدية لمدة ${data.duration_days} ${data.duration_days===1?'يوم':'أيام'}، وتنتهي الهدية في ${new Date(data.access_ends_at).toLocaleString('ar-SA')}.`);el.promoRedeemCode.value='';toast('تم تفعيل كود الهدية بنجاح')}catch(e){showStatus(el.promoRedeemStatus,promoErrorMessage(e),true)}finally{el.redeemPromoButton.disabled=false}
}
async function updateCustomRequest(id,status){const{error}=await db.rpc('premium_admin_update_custom_presentation_request',{p_request_id:id,p_status:status,p_estimated_price_sar:null,p_admin_note:status==='completed'?'تم إكمال الطلب من لوحة الإدارة':'تم التواصل مع العميل'});if(error)return showStatus(el.adminStatus,error.message,true);toast(status==='completed'?'تم إكمال طلب العرض':'تم تحديث حالة الطلب');await loadAdmin()}
async function approve(id){const{error}=await db.rpc('premium_admin_activate_package_request',{p_request_id:id,p_admin_note:'تم التفعيل من البوابة الموحدة'});if(error)return showStatus(el.adminStatus,subscriptionErrorMessage(error),true);toast('تم تفعيل الباقة');await loadAdmin();await loadAccount();renderIdentity()}
async function rejectReq(id){const{error}=await db.rpc('premium_admin_reject_request',{p_request_id:id,p_admin_note:'تم رفض الطلب من البوابة الموحدة'});if(error)return showStatus(el.adminStatus,error.message,true);toast('تم رفض الطلب');await loadAdmin()}
async function setAdmin(userId,makeAdmin){if(!confirm(makeAdmin?'تعيين هذا الحساب مديرًا للنظام؟':'إلغاء صلاحية المدير؟'))return;const{error}=await db.rpc('premium_admin_set_role',{p_user_id:userId,p_is_admin:makeAdmin});if(error)return showStatus(el.adminStatus,error.message,true);toast(makeAdmin?'تم تعيين مدير':'تم إلغاء صلاحية المدير');await loadAdmin()}
async function setPresentationAudience(userId){
 const select=document.querySelector(`[data-audience-select="${userId}"]`);const audience=select?.value;
 if(!audience)return showStatus(el.adminStatus,'اختر نوع الطلاب أولًا.',true);
 const label=PRESENTATION_AUDIENCE_LABELS[audience]||audience;
 if(!confirm(`تغيير نوع عروض هذا المستخدم إلى ${label}؟ سيصبح هذا هو النوع الوحيد المتاح له.`))return;
 const{error}=await db.rpc('premium_admin_set_presentation_audience',{p_user_id:userId,p_audience_type:audience});
 if(error)return showStatus(el.adminStatus,error.message,true);
 toast(`تم تعيين نوع العروض: ${label}`);await loadAdmin();if(userId===state.user.id){await loadAccount();renderIdentity()}
}
function bind(){
 // Delegated navigation remains active even if cards are re-rendered later.
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-launch-platform]');if(!b)return;e.preventDefault();launchPlatform(b.dataset.launchPlatform,b.dataset.platformHref);});
 el.signInButton.onclick=signIn;el.signUpButton.onclick=signUp;el.authPassword.addEventListener('keydown',e=>{if(e.key==='Enter')signIn()});el.signOutButton.onclick=signOut;
 if(el.portalSupportButton)el.portalSupportButton.onclick=()=>document.getElementById('unifiedSupportToggle')?.click();
 if(el.openProfileButton)el.openProfileButton.onclick=()=>openModal('profileModal');if(el.openSubscriptionButton)el.openSubscriptionButton.onclick=()=>showSubscription();
 if(el.openPromoButton)el.openPromoButton.onclick=()=>{hideStatus(el.promoRedeemStatus);openModal('promoModal');setTimeout(()=>el.promoRedeemCode?.focus(),80)};
 if(el.openAdminButton)el.openAdminButton.onclick=async()=>{openModal('adminModal');await loadAdmin()};
 if(el.schoolLogoInput)el.schoolLogoInput.onchange=async()=>{try{state.pendingLogo=await imageToDataUrl(el.schoolLogoInput.files?.[0]);renderIdentity()}catch(e){showStatus(el.profileStatus,e.message,true)}};if(el.saveSchoolProfileButton)el.saveSchoolProfileButton.onclick=saveProfile;
 $all('[data-close-modal]').forEach(b=>b.onclick=()=>closeModal(b.dataset.closeModal));$all('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)closeModal(m.id)});
 $all('input[name="productCode"],input[name="billingPeriod"]').forEach(x=>x.onchange=updatePlan);if(el.whatsappConfirmed)el.whatsappConfirmed.onchange=updatePlan;if(el.sendActivationRequestButton)el.sendActivationRequestButton.onclick=requestActivation;
 if(el.redeemPromoButton)el.redeemPromoButton.onclick=redeemPromoCode;if(el.promoRedeemCode)el.promoRedeemCode.addEventListener('keydown',e=>{if(e.key==='Enter')redeemPromoCode()});
 if(el.generatePromoCodeButton)el.generatePromoCodeButton.onclick=()=>{el.adminPromoCode.value=generatePromoCode();el.adminPromoCode.focus()};if(el.createPromoCodeButton)el.createPromoCodeButton.onclick=createPromoCode;
 $all('[data-quick-plan]').forEach(b=>b.onclick=()=>showSubscription(b.dataset.quickPlan));
 $all('[data-admin-tab]').forEach(b=>b.onclick=()=>{const tab=b.dataset.adminTab;$all('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===b));el.adminRequestsPanel.hidden=tab!=='requests';if(el.adminPromoPanel)el.adminPromoPanel.hidden=tab!=='promo';el.adminUsersPanel.hidden=tab!=='users';if(el.adminCustomRequestsPanel)el.adminCustomRequestsPanel.hidden=tab!=='custom'});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$all('.modal:not([hidden])').forEach(m=>closeModal(m.id))})
}
async function init(){
  // School edition boots without any remote authentication/backend dependency.
  if(el.authBoot){el.authBoot.hidden=true;el.authBoot.style.display="none";}
  if(el.loginPage)el.loginPage.hidden=true;
  if(el.portalShell)el.portalShell.hidden=false;
  state.user={id:"mishkat-school-local",email:"school@mishkat.local"};
  state.account={user_id:state.user.id,full_name:"مستخدم المدرسة",school_name:"مدارس المشكاة الأهلية",school_logo_data:"assets/school-logo.png",is_system_admin:false,is_active:true};
  state.entitlements=[];state.promoAccesses=[];
  // Render school services first. They must never depend on profile/Bubble/settings.
  try{renderPlatforms();}catch(error){console.error("Mishkat platform rendering error",error);}
  try{bind();}catch(error){console.error("Mishkat portal binding error",error);}
  try{renderIdentity();}catch(error){console.error("Mishkat identity rendering error",error);}
  try{handleNotice();}catch(error){console.error("Mishkat notice error",error);}
}init();
