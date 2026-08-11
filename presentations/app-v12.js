"use strict";

const SUPABASE_URL="https://fpicgtldwfevdvpbxkjf.supabase.co";
const SUPABASE_KEY="sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
const WHATSAPP_NUMBER="966582712620";
const CURRENT_PACKAGE_CODE="presentations";
const SCHOOL_EDITION=true;
const db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.__UNIFIED_PLATFORM_DB__=db;
const META=window.PRESENTATION_META||{categories:[],stages:[],genders:[]};
const CATALOG=window.PRESENTATION_CATALOG||[];
const PACKAGE_LABELS={results_analysis:"باقة تحليل النتائج",guidance_records:"باقة السجلات الرقمية",presentations:"باقة العروض التقديمية",counselor_plan:"باقة خطة الموجه الطلابي",achievement_reports:"منصة تقارير الإنجاز",messages_library:"مكتبة رسائل أولياء الأمور",all_access:"الباقة الشاملة"};
const CATEGORY_LABELS=Object.fromEntries((META.categories||[]).map(x=>[x.value,x.label]));
const STAGE_LABELS=Object.fromEntries((META.stages||[]).map(x=>[x.value,x.label]));
const GENDER_LABELS=Object.fromEntries((META.genders||[]).map(x=>[x.value,x.label]));
const UNIFIED_PLATFORM_ROUTES={
  results_analysis:{label:"تحليل النتائج",href:"../analysis/index.html"},
  guidance_records:{label:"السجلات الرقمية",href:"../records/index.html"},
  presentations:{label:"العروض التقديمية",href:"../presentations/index.html"},
  counselor_plan:{label:"خطة الموجه",href:"../plans/index.html"},
  achievement_reports:{label:"تقارير الإنجاز",href:"../reports/index.html"},
  messages_library:{label:"مراسلات ولي الأمر",href:"../messages/index.html"}
};
const UNIFIED_PLATFORM_ICONS={
  results_analysis:'<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
  guidance_records:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>',
  presentations:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21l4-5 4 5M8 9h3M8 12h7"/></svg>',
  counselor_plan:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m15 16 1.4 1.4L19 14.8"/></svg>',
  achievement_reports:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="m15 17 1.5 1.5L20 15"/></svg>',
  messages_library:'<svg viewBox="0 0 24 24"><path d="M4 5h16v12H7l-3 3z"/><path d="M8 9h8M8 13h5"/></svg>'
};
const state={
  user:null,account:null,entitlements:[],packageAccess:false,
  stage:localStorage.getItem("presentation_stage")||"lower_primary",
  gender:"",
  category:"all",search:"",sort:"recommended",
  currentProgram:null,slides:[],slideIndex:0,autoPlayTimer:null,deckTheme:null,
  requests:[]
};
const el=Object.fromEntries([...document.querySelectorAll("[id]")].map(node=>[node.id,node]));
const $all=(selector,root=document)=>[...root.querySelectorAll(selector)];
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function clean(value){return String(value??"").replace(/\s+/g," ").trim()}
function formatDate(value){if(!value)return"—";const date=new Date(value);return Number.isNaN(date.getTime())?String(value):date.toLocaleDateString("ar-SA")}
function toast(message,error=false){el.toast.textContent=message;el.toast.style.background=error?"#991b1b":"#0f172a";el.toast.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.toast.hidden=true,3400)}
function showStatus(node,message,error=false){node.hidden=false;node.textContent=message;node.classList.toggle("error",error)}
function hideStatus(node){if(node)node.hidden=true}
function openModal(id){document.getElementById(id).hidden=false;document.body.style.overflow="hidden"}
function closeModal(id){if(id==="audienceModal"&&!state.account?.presentation_audience_type){toast("يجب اختيار نوع الطلاب قبل استخدام المنصة.",true);return}document.getElementById(id).hidden=true;document.body.style.overflow=""}
function activeEntitlements(){return (state.entitlements||[]).filter(item=>item.is_active!==false&&item.expires_at&&new Date(item.expires_at).getTime()>Date.now())}
function isAdmin(){return Boolean(state.account?.is_system_admin)}
function hasAllAccess(){return isAdmin()||activeEntitlements().some(item=>item.product_code==="all_access")}
function hasAccess(code){if(SCHOOL_EDITION)return true;const active=activeEntitlements();if(isAdmin())return true;if(code==='messages_library')return active.some(item=>item.billing_period==='yearly');return active.some(item=>item.product_code==='all_access'||item.product_code===code)}
function unifiedLaunchKey(code){return`unified_platform_launch_${code}`}
function rememberUnifiedLaunch(code){try{sessionStorage.setItem(unifiedLaunchKey(code),String(Date.now()));sessionStorage.setItem("unified_last_platform",code)}catch(_error){}}
function clearUnifiedLaunches(){try{Object.keys(sessionStorage).filter(key=>key.startsWith("unified_platform_launch_")).forEach(key=>sessionStorage.removeItem(key));sessionStorage.removeItem("unified_last_platform")}catch(_error){}}
function cameFromUnifiedPortal(){
  const params=new URLSearchParams(location.search);const fromPortal=params.get("from")==="portal";
  let remembered=false;try{remembered=Boolean(sessionStorage.getItem(unifiedLaunchKey(CURRENT_PACKAGE_CODE)))}catch(_error){}
  if(fromPortal){rememberUnifiedLaunch(CURRENT_PACKAGE_CODE);params.delete("from");const query=params.toString();history.replaceState({},"",location.pathname+(query?`?${query}`:""));return true}
  return remembered;
}
function goToUnifiedPlatform(code){const item=UNIFIED_PLATFORM_ROUTES[code];if(!item||item.coming||!hasAccess(code))return;rememberUnifiedLaunch(code);location.href=`${item.href}?from=portal`}
function planMeta(){
  if(SCHOOL_EDITION)return{label:"منصة المدرسة",detail:"جميع الخدمات متاحة",trial:false};
  const active=activeEntitlements();
  if(isAdmin())return{label:"مدير النظام",detail:"صلاحية كاملة لجميع المنصات",trial:false};
  const all=active.find(item=>item.product_code==="all_access");
  if(all)return{label:"الباقة الشاملة",detail:`سارية حتى ${formatDate(all.expires_at)}`,trial:false};
  if(active.length){const names=active.map(item=>PACKAGE_LABELS[item.product_code]||item.product_code).join(" + ");const nearest=[...active].sort((a,b)=>new Date(a.expires_at)-new Date(b.expires_at))[0];return{label:names,detail:`سارية حتى ${formatDate(nearest.expires_at)}`,trial:false}}
  return{label:"حساب غير مشترك",detail:"لا توجد باقة نشطة",trial:true};
}
function renderPlatformSwitcher(){
  const plan=planMeta();
  el.platformSwitcher.innerHTML=Object.entries(UNIFIED_PLATFORM_ROUTES).filter(([code])=>code!=="messages_library").map(([code,item])=>{
    const icon=UNIFIED_PLATFORM_ICONS[code]||"";
    if(item.coming)return`<span class="platform-tab coming" aria-disabled="true"><span class="platform-tab-icon">${icon}</span><span class="platform-tab-copy"><strong>${escapeHtml(item.label)}</strong><small>قريبًا</small></span></span>`;
    if(!hasAccess(code))return`<span class="platform-tab locked" aria-disabled="true"><span class="platform-tab-icon">${icon}</span><span class="platform-tab-copy"><strong>${escapeHtml(item.label)}</strong><small>غير مفعّلة</small></span></span>`;
    const current=code===CURRENT_PACKAGE_CODE;
    return`<a href="${item.href}?from=portal" data-platform="${code}" class="platform-tab${current?" current":""}"${current?' aria-current="page"':""}><span class="platform-tab-icon">${icon}</span><span class="platform-tab-copy"><strong>${escapeHtml(item.label)}</strong><small>${current?"المنصة الحالية":"انتقال إلى المنصة"}</small></span></a>`;
  }).join("");
  el.platformPlanBadge.innerHTML=`<span class="platform-plan-status${plan.trial?" trial":""}"></span><span class="platform-plan-copy"><span>الإتاحة</span><strong>${escapeHtml(plan.label)}</strong><small>${escapeHtml(plan.detail)}</small></span>`;
  el.unifiedPlatformBar.hidden=false;
  $all("[data-platform]",el.platformSwitcher).forEach(link=>link.addEventListener("click",event=>{event.preventDefault();goToUnifiedPlatform(link.dataset.platform)}));
}
function renderIdentity(){
  const school=state.account?.school_name||"اسم المدرسة";const name=state.account?.full_name||state.user?.email||"المستخدم";const logo=state.account?.school_logo_data;
  el.schoolName.textContent=school;el.userName.textContent=name;
  if(logo){el.schoolLogo.src=logo;el.schoolLogo.hidden=false;el.schoolLogoPlaceholder.hidden=true}else{el.schoolLogo.hidden=true;el.schoolLogoPlaceholder.hidden=false;el.schoolLogoPlaceholder.textContent=(school.trim().charAt(0)||"م")}
}
function assignedAudienceType(){return state.account?.presentation_audience_type||state.gender||""}
function audienceText(){const gender=assignedAudienceType();return`${STAGE_LABELS[state.stage]||state.stage} — ${gender?(GENDER_LABELS[gender]||gender):"لم يحدد نوع الطلاب"}`}
function audienceNoun(){return assignedAudienceType()==="girls"?"الطالبات":"الطلاب"}
function audienceTypeError(error){const raw=String(error?.message||error||"");if(raw.includes("presentation_audience_already_selected"))return"تم تثبيت نوع الطلاب لهذا الحساب بالفعل. تغيير النوع متاح لمدير النظام فقط.";if(raw.includes("invalid_audience_type"))return"اختر بنين أو بنات.";if(raw.includes("presentations_package_required"))return"باقة العروض التقديمية غير مفعّلة.";return raw||"تعذر حفظ نوع الطلاب."}
function renderAudienceControls(){
  const locked=state.account?.presentation_audience_type||"";
  const selected=locked||state.gender||"";
  el.audienceSummary.textContent=audienceText();
  el.stageQuickFilters.innerHTML=SCHOOL_EDITION?`<button class="quick-filter active locked-type" type="button" disabled>🔒 ${escapeHtml(STAGE_LABELS[state.stage]||state.stage)}</button>`:META.stages.map(item=>`<button class="quick-filter${state.stage===item.value?" active":""}" data-stage="${item.value}" type="button">${escapeHtml(item.label)}</button>`).join("");
  el.genderQuickFilters.innerHTML=locked
    ?`<button class="quick-filter active locked-type" type="button" disabled title="النوع مثبت على الحساب">🔒 ${escapeHtml(GENDER_LABELS[locked]||locked)}</button>`
    :META.genders.map(item=>`<button class="quick-filter${selected===item.value?" active":""}" data-gender="${item.value}" type="button">${escapeHtml(item.label)}</button>`).join("");
  el.stageChooser.innerHTML=SCHOOL_EDITION?`<div class="choice-card active audience-locked-card"><strong>🔒 ${escapeHtml(STAGE_LABELS[state.stage]||state.stage)}</strong><small>المرحلة محددة تلقائيًا من توزيع المستخدم.</small></div>`:META.stages.map(item=>`<button class="choice-card${state.stage===item.value?" active":""}" data-stage-choice="${item.value}" type="button"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail||item.tone||"")}</small></button>`).join("");
  el.genderChooser.innerHTML=locked
    ?`<div class="choice-card active audience-locked-card"><strong>🔒 ${escapeHtml(GENDER_LABELS[locked]||locked)}</strong><small>هذا النوع مثبت على الحساب. يمكن لمدير النظام فقط تغييره.</small></div>`
    :META.genders.map(item=>`<button class="choice-card${selected===item.value?" active":""}" data-gender-choice="${item.value}" type="button"><strong>${escapeHtml(item.label)}</strong><small>صياغة وصور مناسبة لـ ${escapeHtml(item.audience||item.label)}</small></button>`).join("");
  el.customStage.innerHTML=META.stages.map(item=>`<option value="${item.value}">${escapeHtml(item.label)}</option>`).join("");
  el.customGender.innerHTML=selected?`<option value="${selected}">${escapeHtml(GENDER_LABELS[selected]||selected)}</option>`:'<option value="">حدد نوع الطلاب أولًا</option>';
  el.customGender.disabled=true;
  el.customStage.value=state.stage;el.customGender.value=selected;
  const audienceClose=el.audienceModal?.querySelector('[data-close="audienceModal"]');if(audienceClose)audienceClose.hidden=!locked;
  if(el.confirmAudienceButton){el.confirmAudienceButton.disabled=!selected;el.confirmAudienceButton.textContent=locked?"حفظ المرحلة وعرض البرامج":"تثبيت النوع وعرض البرامج"}
  $all("[data-stage]").forEach(button=>button.onclick=()=>setAudience(button.dataset.stage,selected));
  $all("[data-gender]").forEach(button=>button.onclick=()=>setAudience(state.stage,button.dataset.gender));
  $all("[data-stage-choice]").forEach(button=>button.onclick=()=>{state.stage=button.dataset.stageChoice;renderAudienceControls()});
  $all("[data-gender-choice]").forEach(button=>button.onclick=()=>{if(locked)return;state.gender=button.dataset.genderChoice;renderAudienceControls()});
}
function setAudience(stage,gender){const locked=state.account?.presentation_audience_type||"";state.stage=stage;state.gender=locked||gender||state.gender;localStorage.setItem("presentation_stage",stage);if(state.gender)localStorage.setItem("presentation_gender",state.gender);renderAudienceControls();renderCatalog();updateCustomWhatsApp()}
async function confirmAudience(){
  const locked=state.account?.presentation_audience_type||"";const selected=locked||state.gender;
  if(!selected)return toast("اختر نوع الطلاب أولًا.",true);
  if(!locked){
    if(SCHOOL_EDITION){state.gender=selected;state.account={...state.account,presentation_audience_type:selected};localStorage.setItem("presentation_gender",selected);toast(`تم تثبيت نوع العروض: ${GENDER_LABELS[selected]||selected}`)}
    else{el.confirmAudienceButton.disabled=true;el.confirmAudienceButton.textContent="جارٍ تثبيت النوع...";try{const{data,error}=await db.rpc("premium_choose_presentation_audience",{p_audience_type:selected});if(error)throw error;state.account=Object.freeze({...data});state.gender=data.presentation_audience_type;toast(`تم تثبيت نوع العروض: ${GENDER_LABELS[state.gender]||state.gender}`)}catch(error){toast(audienceTypeError(error),true);renderAudienceControls();return}}
  }
  setAudience(state.stage,state.account?.presentation_audience_type||selected);localStorage.setItem("presentation_audience_set","1");closeModal("audienceModal")
}
function renderCategoryTabs(){el.categoryTabs.innerHTML=META.categories.map(item=>`<button class="category-tab${state.category===item.value?" active":""}" data-category="${item.value}" type="button"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></button>`).join("");$all("[data-category]",el.categoryTabs).forEach(button=>button.onclick=()=>{state.category=button.dataset.category;renderCategoryTabs();renderCatalog()})}
function programMatches(program){
  const stageMatch=(program.stages||[]).includes(state.stage);const genderMatch=(program.genders||[]).includes(assignedAudienceType());const categoryMatch=state.category==="all"||program.category===state.category;const query=clean(state.search).toLowerCase();const searchMatch=!query||`${program.title} ${program.summary} ${(program.keyPoints||[]).join(" ")}`.toLowerCase().includes(query);return stageMatch&&genderMatch&&categoryMatch&&searchMatch;
}
function visiblePrograms(){let list=CATALOG.filter(programMatches);if(state.sort==="title")list=[...list].sort((a,b)=>a.title.localeCompare(b.title,"ar"));if(state.sort==="duration")list=[...list].sort((a,b)=>(a.duration||0)-(b.duration||0));return list}
function programCard(program){
  const stageLabel=STAGE_LABELS[state.stage]||state.stage;const theme=deckThemeFor(program);const slideCount=presentationSlideCount(program);
  return`<article class="program-card deck-card-${theme.family}" style="--card-accent:${theme.primary};--card-accent-2:${theme.secondary}"><div class="program-thumb"><span class="program-category-badge">${escapeHtml(CATEGORY_LABELS[program.category]||program.category)}</span><span class="program-experience-badge">${escapeHtml(theme.familyLabel)}</span><img loading="lazy" src="assets/illustrations/${escapeHtml(program.illustration)}" alt="صورة تعبيرية لبرنامج ${escapeHtml(program.title)}"></div><div class="program-card-body"><h3>${escapeHtml(program.title)}</h3><p>${escapeHtml(program.summary)}</p><div class="program-meta"><span>${escapeHtml(stageLabel)}</span><span>${escapeHtml(GENDER_LABELS[assignedAudienceType()]||"غير محدد")}</span><span>${slideCount} شريحة</span><span>${program.duration||20} دقيقة</span><span>رسوم تفاعلية</span></div><div class="program-actions"><button data-open-program="${program.id}" type="button">عرض تفاعلي داخل المنصة</button><small>تصميم مختلف · لا يوجد تنزيل</small></div></div></article>`}
function renderCatalog(){const list=visiblePrograms();el.visibleProgramCount.textContent=list.length;el.programGrid.innerHTML=list.map(programCard).join("");el.emptyPrograms.hidden=list.length>0;el.ministerialIntro.hidden=state.category!=="all"&&state.category!=="ministerial";$all("[data-open-program]",el.programGrid).forEach(button=>button.onclick=()=>openProgram(button.dataset.openProgram))}
function stagePresentationTone(){const map={lower_primary:"لغة بسيطة وحركة بصرية وألعاب قصيرة",upper_primary:"مواقف واختيارات وتحديات عملية",middle:"حوار واقعي وقرارات تفاعلية",secondary:"تحليل ونقاش وتطبيق مهني"};return map[state.stage]||"محتوى مناسب"}
function slideBrand(){const school=escapeHtml(state.account?.school_name||"المدرسة");const logo=state.account?.school_logo_data;return`<div class="slide-brand"><span class="slide-brand-logo">${logo?`<img src="${logo}" alt="">`:escapeHtml(school.charAt(0)||"م")}</span><span>${school}</span></div>`}
function stableHash(value){let hash=2166136261;for(const ch of String(value||"")){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}return hash>>>0}
const DECK_PALETTES=[
  {primary:"#0f766e",secondary:"#0ea5e9",accent:"#f59e0b",surface:"#ecfeff"},
  {primary:"#6d28d9",secondary:"#db2777",accent:"#f97316",surface:"#faf5ff"},
  {primary:"#1d4ed8",secondary:"#06b6d4",accent:"#84cc16",surface:"#eff6ff"},
  {primary:"#b45309",secondary:"#ef4444",accent:"#facc15",surface:"#fffbeb"},
  {primary:"#047857",secondary:"#65a30d",accent:"#14b8a6",surface:"#ecfdf5"},
  {primary:"#7e22ce",secondary:"#4f46e5",accent:"#22d3ee",surface:"#f5f3ff"},
  {primary:"#be123c",secondary:"#ea580c",accent:"#fbbf24",surface:"#fff1f2"},
  {primary:"#334155",secondary:"#0f766e",accent:"#38bdf8",surface:"#f8fafc"}
];
const DECK_FAMILY_LABELS={journey:"مسار بصري",challenge:"تحدٍ تفاعلي",story:"قصة قيمية",mission:"مهمة تعليمية",studio:"مختبر مهارات",documentary:"عرض وثائقي"};
function deckThemeFor(program){
  const hash=stableHash(`${program.id}-${state.stage}-${assignedAudienceType()}`);const pools={ministerial:["journey","documentary","mission"],qualitative:["challenge","studio","mission"],values:["story","studio","challenge"]};
  const family=(pools[program.category]||["studio"])[hash%(pools[program.category]||["studio"]).length];const palette=DECK_PALETTES[(hash>>>3)%DECK_PALETTES.length];const patterns=["orbits","grid","waves","rays","dots","steps"];
  return{...palette,family,familyLabel:DECK_FAMILY_LABELS[family],pattern:patterns[(hash>>>7)%patterns.length],seed:hash};
}
function presentationSlideCount(program){return 15+(stableHash(program.id)%3)}
function deckContext(program){
  const audience=audienceNoun(),stage=STAGE_LABELS[state.stage],gender=GENDER_LABELS[assignedAudienceType()],illustration=`assets/illustrations/${program.illustration}`;
  const objectives=(program.objectives||[]),points=(program.keyPoints||[]),actions=(program.actions||[]);
  const objectiveSet=objectives.length?objectives:["فهم الفكرة الأساسية","تطبيق السلوك في موقف واقعي","متابعة الأثر بعد البرنامج"];
  const pointSet=points.length?points:["الفكرة تبدأ بالوعي","التطبيق اليومي يصنع التغيير","الدعم متاح عند الحاجة","القرار المسؤول يحمي النتائج"];
  const actionSet=actions.length?actions:["تحديد السلوك المطلوب","تطبيق خطوة صغيرة","طلب التغذية الراجعة","متابعة التحسن"];
  const pick=(arr,i)=>arr[i%arr.length];const genderFocus=assignedAudienceType()==="girls"?"أمثلة قريبة من بيئة الطالبات واحتياجاتهن":"أمثلة قريبة من بيئة الطلاب واحتياجاتهم";
  return{program,audience,stage,gender,illustration,objectiveSet,pointSet,actionSet,pick,genderFocus,tone:stagePresentationTone(),theme:state.deckTheme};
}
function commonQuiz(ctx){return{type:"quiz",title:"اختبر قرارك",subtitle:"اختر الإجابة الأكثر اتساقًا مع هدف البرنامج.",question:`ما التصرف الأكثر فاعلية عند مواجهة موقف مرتبط بموضوع «${ctx.program.title}»؟`,options:["التصرف بسرعة قبل فهم الموقف","التوقف وفهم الموقف ثم اختيار خطوة مسؤولة","تجاهل الموقف تمامًا","انتظار الآخرين ليقرروا بدلًا مني"],correct:1,feedback:["السرعة قد تزيد المشكلة.","صحيح: الفهم ثم الاختيار المسؤول هو المسار الأفضل.","التجاهل لا يعالج السبب.","المسؤولية تبدأ بالمشاركة في القرار."]}}
function commonChoice(ctx){return{type:"choice",title:"اختر المسار",subtitle:"اضغط على كل اختيار لترى أثره المتوقع.",prompt:ctx.program.scenario||`موقف يومي مرتبط بموضوع ${ctx.program.title}. ما القرار الأنسب؟`,options:[{label:"أتوقف وأفهم",feedback:"يمنحك وقتًا لرؤية التفاصيل واختيار استجابة أكثر اتزانًا."},{label:"أطلب دعمًا",feedback:"طلب الدعم مهارة قوة عندما تكون المشكلة أكبر من الحل الفردي."},{label:"أتصرف فورًا",feedback:"قد يكون مناسبًا فقط عندما يكون الموقف آمنًا وواضحًا؛ وإلا فالأفضل التمهل."}]}}
function commonTracker(ctx){return{type:"tracker",title:"متابعة أسبوعية",subtitle:"اضغط على الأيام عند تنفيذ السلوك المستهدف.",days:["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"],task:ctx.program.challenge||`طبّق خطوة من برنامج ${ctx.program.title} وسجّل أثرها.`}}
function commonClosing(ctx){return{type:"closing",title:"القرار يبدأ الآن",summary:ctx.program.challenge||"اختر خطوة واحدة وابدأ تطبيقها اليوم.",challenge:`تحدي ${ctx.stage}: ${ctx.program.challenge||"طبّق خطوة واحدة خلال هذا الأسبوع وشارك أثرها مع موجهك."}`}}
function commonRecap(ctx){return{type:"recap",title:"خلاصة العرض",subtitle:"خمس كلمات تلخص ما نأخذه معنا.",items:[ctx.pick(ctx.pointSet,0),ctx.pick(ctx.pointSet,1),ctx.pick(ctx.actionSet,0),"قرار مسؤول","متابعة الأثر"]}}
function buildJourneyDeck(ctx){return[
  {type:"cover",title:ctx.program.title,summary:ctx.program.summary,illustration:ctx.illustration,kicker:`${CATEGORY_LABELS[ctx.program.category]} · ${ctx.stage} · ${ctx.gender}`},
  {type:"agenda",title:"رحلة البرنامج",subtitle:"من الوعي إلى التطبيق والمتابعة.",items:["نفهم","نلاحظ","نختار","نطبق","نتابع"]},
  {type:"objectives",title:"أهداف الرحلة",subtitle:`أهداف مناسبة لـ ${ctx.audience}.`,items:ctx.objectiveSet.slice(0,4)},
  {type:"stats",title:"بوصلة التنفيذ",subtitle:"أرقام تنظيمية للعرض وليست نتائج إحصائية.",metrics:[{value:"3",label:"محاور أساسية"},{value:"4",label:"خطوات عملية"},{value:"5",label:"أيام متابعة"}]},
  {type:"timeline",title:"من البداية إلى الأثر",subtitle:"مسار متدرج يوضح كيف تتحول الفكرة إلى عادة.",items:["وعي بالموقف","فهم السبب","اختيار الاستجابة","تطبيق السلوك","مراجعة النتيجة"]},
  {type:"concept",title:"خريطة المفهوم",subtitle:`اضغط على العناصر لاستكشاف علاقتها بموضوع ${ctx.program.title}.`,core:ctx.program.title,items:[ctx.pick(ctx.pointSet,0),ctx.pick(ctx.pointSet,1),ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1)]},
  {type:"scenario",title:"مشهد واقعي",subtitle:"ناقش الموقف قبل الانتقال للحل.",text:ctx.program.scenario,illustration:ctx.illustration},
  commonChoice(ctx),
  {type:"process",title:"خطوات التنفيذ",subtitle:"تسلسل واضح يمكن استخدامه داخل المدرسة.",items:[ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1),ctx.pick(ctx.actionSet,2),ctx.pick(ctx.actionSet,3)]},
  {type:"roles",title:"تكامل الأدوار",subtitle:"كل طرف يساهم في نجاح البرنامج.",roles:[{name:"الطالب",text:"يطبّق ويطلب المساندة"},{name:"الموجه",text:"يدعم ويتابع الأثر"},{name:"الأسرة والمعلم",text:"يعززان السلوك الإيجابي"}]},
  commonQuiz(ctx),
  {type:"checklist",title:"قائمة الاستعداد",subtitle:"اضغط على البنود عند تحققها.",items:["فهمت الهدف","حددت سلوكًا واحدًا","اخترت شخصًا داعمًا","حددت موعد المتابعة"]},
  commonTracker(ctx),
  {type:"activity",title:"تطبيق داخل القاعة",subtitle:`نشاط يناسب ${ctx.audience}.`,text:ctx.program.activity,illustration:ctx.illustration},
  commonRecap(ctx),
  {type:"commitment",title:"تعهد شخصي",subtitle:"اكتب خطوة واحدة ستبدأ بها بعد العرض.",prompt:`سأبدأ في موضوع ${ctx.program.title} بـ...`},
  commonClosing(ctx)
]}
function buildChallengeDeck(ctx){return[
  {type:"cover",title:ctx.program.title,summary:ctx.program.summary,illustration:ctx.illustration,kicker:`تحدٍ تفاعلي · ${ctx.stage} · ${ctx.gender}`},
  {type:"hook",title:"سؤال البداية",subtitle:"لا توجد إجابة واحدة قبل التفكير.",question:`كيف يمكن أن يتغير يوم ${ctx.audience} عندما يطبقون ${ctx.program.title} بوعي؟`,illustration:ctx.illustration},
  {type:"objectives",title:"مهمات التحدي",subtitle:ctx.tone,items:ctx.objectiveSet.slice(0,4)},
  {type:"compare",title:"رد تلقائي أم رد واعٍ؟",subtitle:"قارن بين النتيجتين.",left:{title:"رد تلقائي",items:["سرعة دون فهم","تأثر بالمشاعر","نتيجة غير محسوبة"]},right:{title:"رد واعٍ",items:["توقف قصير","فهم الخيارات","قرار مسؤول"]}},
  {type:"meter",title:"مقياس البداية",subtitle:"حرّك المؤشر لتقييم مستوى تطبيقك الحالي.",minLabel:"أحتاج دعمًا",maxLabel:"أطبقه بثبات",question:`ما مدى تطبيقك لمهارة ${ctx.program.title}؟`},
  {type:"concept",title:"مختبر الفكرة",subtitle:"كل عنصر يفتح زاوية مختلفة للمفهوم.",core:ctx.program.title,items:[ctx.pick(ctx.pointSet,0),ctx.pick(ctx.pointSet,1),ctx.pick(ctx.pointSet,2),ctx.pick(ctx.actionSet,0)]},
  {type:"scenario",title:"التحدي الواقعي",subtitle:"ما التفاصيل التي يجب الانتباه لها؟",text:ctx.program.scenario,illustration:ctx.illustration},
  commonChoice(ctx),
  {type:"activity",title:"تجربة سريعة",subtitle:"نفّذ النشاط ثم شارك ما لاحظته.",text:ctx.program.activity,illustration:ctx.illustration},
  {type:"wheel",title:"عجلة التطبيق",subtitle:"اضغط تدوير لتحصل على مهمة عشوائية.",items:["فكر","ناقش","طبّق","لاحظ","شارك","راجع"]},
  {type:"process",title:"خطة من أربع خطوات",subtitle:"من التحدي إلى التحسن.",items:[ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1),ctx.pick(ctx.actionSet,2),ctx.pick(ctx.actionSet,3)]},
  commonQuiz(ctx),
  {type:"checklist",title:"تقييم ذاتي",subtitle:"اختر ما ينطبق عليك الآن.",items:["أفهم أثر اختياراتي","أستطيع تسمية مشاعري أو احتياجي","أطلب المساعدة عند الحاجة","أراجع نتيجة قراري"]},
  commonTracker(ctx),
  commonRecap(ctx),
  {type:"commitment",title:"خطوتي القادمة",subtitle:"حوّل الفكرة إلى موعد وسلوك واضح.",prompt:"خلال هذا الأسبوع سأقوم بـ..."},
  commonClosing(ctx)
]}
function buildStoryDeck(ctx){return[
  {type:"cover",title:ctx.program.title,summary:ctx.program.summary,illustration:ctx.illustration,kicker:`قصة قيمية · ${ctx.stage} · ${ctx.gender}`},
  {type:"story",title:"بداية الحكاية",subtitle:"اقرأ ثم تخيل نفسك مكان الشخصية.",text:`في موقف مدرسي بسيط، احتاج أحد ${ctx.audience} إلى اتخاذ قرار يظهر قيمة «${ctx.program.title}». لم يكن القرار الأسهل، لكنه كان الأكثر أثرًا.`,illustration:ctx.illustration},
  {type:"quote",title:"فكرة تستحق التوقف",quote:ctx.pick(ctx.pointSet,0),caption:`القيمة لا تظهر في الكلام فقط؛ بل في القرار عندما يكون الاختيار صعبًا.`},
  {type:"objectives",title:"ماذا ستكشف القصة؟",subtitle:ctx.genderFocus,items:ctx.objectiveSet.slice(0,4)},
  {type:"concept",title:"بوصلة القيمة",subtitle:"اضغط على الاتجاهات لتكتشف مظاهر القيمة.",core:ctx.program.title,items:["مع النفس","مع الأسرة","مع الزملاء","مع المدرسة"]},
  {type:"scenario",title:"العقدة",subtitle:"ما القيمة التي يحتاجها هذا الموقف؟",text:ctx.program.scenario,illustration:ctx.illustration},
  commonChoice(ctx),
  {type:"compare",title:"أثر القرار",subtitle:"القيمة تغيّر ما يحدث بعد الموقف.",left:{title:"عند غياب القيمة",items:["تضعف الثقة","تزداد المشكلة","يصعب الإصلاح"]},right:{title:"عند تطبيق القيمة",items:["تنمو الثقة","يتضح الموقف","يبدأ الإصلاح"]}},
  {type:"roleplay",title:"مشهد تمثيلي",subtitle:"اختر شخصين لتمثيل الحوار.",roles:[{name:"الشخصية الأولى",text:"تشرح الموقف بصراحة"},{name:"الشخصية الثانية",text:"تستمع وتقترح قرارًا قيميًا"}]},
  {type:"activity",title:"أعد كتابة النهاية",subtitle:"صمّم نهاية تعكس القيمة.",text:ctx.program.activity,illustration:ctx.illustration},
  {type:"ladder",title:"سُلّم القيمة",subtitle:"خطوات صغيرة تقود إلى سلوك ثابت.",items:[ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1),ctx.pick(ctx.actionSet,2),ctx.pick(ctx.actionSet,3)]},
  commonQuiz(ctx),
  {type:"checklist",title:"ميثاق القيمة",subtitle:"اضغط على العبارات التي ستلتزم بها.",items:["أطبق القيمة دون انتظار مكافأة","أعترف بالخطأ وأصلحه","أحترم حقوق الآخرين","أكرر السلوك حتى يصبح عادة"]},
  {type:"meter",title:"مرآة الذات",subtitle:"قيّم نفسك بصدق قبل تحديد خطتك.",minLabel:"أحتاج تدريبًا",maxLabel:"سلوك ثابت",question:`إلى أي مدى تظهر قيمة ${ctx.program.title} في قراراتك؟`},
  commonRecap(ctx),
  {type:"commitment",title:"جملة أعيش بها",subtitle:"اكتب تعهدًا قصيرًا مرتبطًا بالقيمة.",prompt:`سأجعل ${ctx.program.title} ظاهرًا عندما...`},
  commonClosing(ctx)
]}
function buildMissionDeck(ctx){return[
  {type:"cover",title:ctx.program.title,summary:ctx.program.summary,illustration:ctx.illustration,kicker:`مهمة تعليمية · ${ctx.stage} · ${ctx.gender}`},
  {type:"mission",title:"بطاقة المهمة",subtitle:"هدف واضح ووقت محدد ومؤشر نجاح.",mission:`استكشف موضوع ${ctx.program.title}، واتخذ قرارًا عمليًا، ثم تابع أثره لمدة خمسة أيام.`,illustration:ctx.illustration},
  {type:"stats",title:"شارات المهمة",subtitle:"كل شارة تمثل مستوى في الرحلة.",metrics:[{value:"1",label:"اكتشف"},{value:"2",label:"اختر"},{value:"3",label:"طبّق"}]},
  {type:"objectives",title:"شروط النجاح",subtitle:ctx.tone,items:ctx.objectiveSet.slice(0,4)},
  {type:"concept",title:"خريطة المهمة",subtitle:"اضغط على نقاط الخريطة.",core:"الهدف",items:[ctx.pick(ctx.pointSet,0),ctx.pick(ctx.pointSet,1),ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1)]},
  {type:"timeline",title:"مراحل الإنجاز",subtitle:"لا تقفز إلى النهاية قبل المرور بالمراحل.",items:["رصد الموقف","جمع المعلومات","اختيار الحل","تنفيذ الخطوة","تقييم الأثر"]},
  {type:"scenario",title:"المهمة الميدانية",subtitle:"حلّل الموقف كفريق.",text:ctx.program.scenario,illustration:ctx.illustration},
  commonChoice(ctx),
  {type:"process",title:"أدوات المهمة",subtitle:"أربع أدوات تساعدك على الإنجاز.",items:[ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1),ctx.pick(ctx.actionSet,2),ctx.pick(ctx.actionSet,3)]},
  {type:"wheel",title:"مهمة عشوائية",subtitle:"دوّر العجلة وحدد النشاط الذي ستنفذه.",items:["سؤال","موقف","حوار","ملاحظة","قرار","تحدٍ"]},
  {type:"scorecard",title:"لوحة الإنجاز",subtitle:"اضغط على الأعمدة لرفع مستوى الإنجاز.",items:[{label:"الفهم",value:40},{label:"المشاركة",value:55},{label:"التطبيق",value:30},{label:"المتابعة",value:20}]},
  commonQuiz(ctx),
  commonTracker(ctx),
  {type:"activity",title:"تحدي الفريق",subtitle:`تعاونوا لبناء حل يناسب ${ctx.audience}.`,text:ctx.program.activity,illustration:ctx.illustration},
  commonRecap(ctx),
  {type:"commitment",title:"رمز الإنجاز",subtitle:"اكتب اسم الخطوة التي ستنفذها أولًا.",prompt:"مهمتي الأولى هي..."},
  commonClosing(ctx)
]}
function buildStudioDeck(ctx){return[
  {type:"cover",title:ctx.program.title,summary:ctx.program.summary,illustration:ctx.illustration,kicker:`مختبر مهارات · ${ctx.stage} · ${ctx.gender}`},
  {type:"hook",title:"افتح المختبر",subtitle:"ابدأ بملاحظة دقيقة قبل تقديم الحل.",question:`ما المهارة الصغيرة التي يمكن أن تغيّر نتيجة موقف مرتبط بـ ${ctx.program.title}؟`,illustration:ctx.illustration},
  {type:"agenda",title:"محطات المختبر",subtitle:"نلاحظ، نفكك، نجرب، نقيس، نطوّر.",items:["ملاحظة","تحليل","تجربة","قياس","تطوير"]},
  {type:"objectives",title:"نتائج التجربة",subtitle:ctx.tone,items:ctx.objectiveSet.slice(0,4)},
  {type:"compare",title:"قبل وبعد",subtitle:"قارن أثر المهارة على الموقف.",left:{title:"قبل التدريب",items:["استجابة غير واضحة","تكرار الخطأ","صعوبة المتابعة"]},right:{title:"بعد التدريب",items:["خطوة محددة","قرار أوضح","أثر قابل للقياس"]}},
  {type:"concept",title:"مكونات المهارة",subtitle:"اضغط على كل مكوّن.",core:ctx.program.title,items:[ctx.pick(ctx.pointSet,0),ctx.pick(ctx.pointSet,1),ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1)]},
  {type:"meter",title:"خط الأساس",subtitle:"حدّد نقطة البداية قبل التدريب.",minLabel:"بداية",maxLabel:"إتقان",question:`قيّم مستواك الحالي في ${ctx.program.title}.`},
  {type:"scenario",title:"عينة واقعية",subtitle:"حدد المتغير الذي يحتاج إلى تغيير.",text:ctx.program.scenario,illustration:ctx.illustration},
  commonChoice(ctx),
  {type:"activity",title:"تجربة تطبيقية",subtitle:"نفّذ، لاحظ، ثم عدّل.",text:ctx.program.activity,illustration:ctx.illustration},
  {type:"process",title:"بروتوكول التطبيق",subtitle:"كرر الخطوات حتى تصل إلى نتيجة أفضل.",items:[ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1),ctx.pick(ctx.actionSet,2),ctx.pick(ctx.actionSet,3)]},
  commonQuiz(ctx),
  {type:"scorecard",title:"نتائج الملاحظة",subtitle:"اضغط الأعمدة لتمثيل تقدمك المتوقع.",items:[{label:"الوعي",value:35},{label:"الاختيار",value:45},{label:"التطبيق",value:50},{label:"الاستمرار",value:25}]},
  commonTracker(ctx),
  commonRecap(ctx),
  {type:"commitment",title:"فرضية الأسبوع",subtitle:"اكتب ما تتوقع أن يتحسن عند تطبيق الخطوة.",prompt:"أتوقع أن يتحسن... عندما أطبق..."},
  commonClosing(ctx)
]}
function buildDocumentaryDeck(ctx){return[
  {type:"cover",title:ctx.program.title,summary:ctx.program.summary,illustration:ctx.illustration,kicker:`عرض وثائقي · ${ctx.stage} · ${ctx.gender}`},
  {type:"hook",title:"اللقطة الافتتاحية",subtitle:"شاهد الفكرة من زاوية أوسع.",question:`لماذا يظل موضوع ${ctx.program.title} مؤثرًا في الحياة المدرسية حتى عندما لا نلاحظه مباشرة؟`,illustration:ctx.illustration},
  {type:"timeline",title:"تطور الموقف",subtitle:"كل قرار يغيّر المشهد التالي.",items:["بداية الموقف","ظهور الإشارة","اتخاذ القرار","ظهور الأثر","المتابعة"]},
  {type:"objectives",title:"أسئلة الفيلم",subtitle:"ما الذي نبحث عنه أثناء العرض؟",items:ctx.objectiveSet.slice(0,4)},
  {type:"stats",title:"مفاتيح المشاهدة",subtitle:"أرقام تنظيمية تساعد على تذكر المحاور.",metrics:[{value:"4",label:"أسئلة"},{value:"1",label:"موقف محوري"},{value:"5",label:"أيام متابعة"}]},
  {type:"concept",title:"الصورة الكاملة",subtitle:"اضغط على العناصر لكشف العلاقات.",core:ctx.program.title,items:[ctx.pick(ctx.pointSet,0),ctx.pick(ctx.pointSet,1),ctx.pick(ctx.pointSet,2),ctx.pick(ctx.actionSet,0)]},
  {type:"compare",title:"زاويتان للمشهد",subtitle:"الحدث نفسه قد يبدو مختلفًا حسب طريقة النظر.",left:{title:"زاوية المشكلة",items:["ما الذي حدث؟","من تأثر؟","ما الخطر؟"]},right:{title:"زاوية الحل",items:["ما الممكن؟","من يدعم؟","ما الخطوة التالية؟"]}},
  {type:"scenario",title:"المشهد الرئيسي",subtitle:"اقرأ التفاصيل كأنك مخرج للموقف.",text:ctx.program.scenario,illustration:ctx.illustration},
  commonChoice(ctx),
  {type:"roles",title:"شخصيات المشهد",subtitle:"كل شخصية ترى جزءًا من الصورة.",roles:[{name:"الطالب",text:"صاحب القرار والتجربة"},{name:"الموجه",text:"يفسر ويقترح المسار"},{name:"الأسرة والمعلم",text:"يدعمان الاستمرار"}]},
  {type:"process",title:"من المشاهدة إلى العمل",subtitle:"لا يكفي فهم القصة دون خطوة عملية.",items:[ctx.pick(ctx.actionSet,0),ctx.pick(ctx.actionSet,1),ctx.pick(ctx.actionSet,2),ctx.pick(ctx.actionSet,3)]},
  {type:"activity",title:"اكتب تعليقك",subtitle:"لخص الرسالة في جملة أو مشهد قصير.",text:ctx.program.activity,illustration:ctx.illustration},
  commonQuiz(ctx),
  commonTracker(ctx),
  commonRecap(ctx),
  {type:"commitment",title:"المشهد القادم",subtitle:"اكتب كيف تريد أن يكون تصرفك في الموقف القادم.",prompt:"في المرة القادمة سأ..."},
  commonClosing(ctx)
]}
function makeSlides(program){const ctx=deckContext(program);const builders={journey:buildJourneyDeck,challenge:buildChallengeDeck,story:buildStoryDeck,mission:buildMissionDeck,studio:buildStudioDeck,documentary:buildDocumentaryDeck};const slides=(builders[state.deckTheme.family]||buildStudioDeck)(ctx);return slides.slice(0,presentationSlideCount(program))}
function slideShell(content,index,type){const theme=state.deckTheme||deckThemeFor(state.currentProgram||{id:"default",category:"qualitative"});return`<section class="slide slide-${type} deck-${theme.family} motif-${theme.pattern} stage-${state.stage} gender-${assignedAudienceType()}" style="--slide-primary:${theme.primary};--slide-secondary:${theme.secondary};--slide-accent:${theme.accent};--slide-surface:${theme.surface}">${slideBrand()}<div class="deck-family-label">${escapeHtml(theme.familyLabel)}</div><div class="slide-inner">${content}</div><div class="slide-number">${index+1} / ${state.slides.length}</div></section>`}
function renderObjectiveCards(slide){return`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="slide-cards">${slide.items.map((item,i)=>`<article class="slide-card"><b>${i+1}</b><strong>${escapeHtml(item)}</strong></article>`).join("")}</div>`}
function renderSlide(){
  const slide=state.slides[state.slideIndex];if(!slide)return;let content="";
  if(slide.type==="cover")content=`<div class="slide-cover-copy"><span class="slide-kicker">${escapeHtml(slide.kicker)}</span><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.summary)}</p><div class="cover-pulse"><span></span><span></span><span></span></div></div><div class="slide-cover-visual"><div class="visual-halo"></div><img src="${slide.illustration}" alt=""></div>`;
  if(slide.type==="agenda")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="agenda-path">${slide.items.map((item,i)=>`<div class="agenda-stop"><b>${i+1}</b><span>${escapeHtml(item)}</span></div>`).join("")}</div>`;
  if(slide.type==="objectives")content=renderObjectiveCards(slide);
  if(slide.type==="hook")content=`<div class="hook-layout"><div><span class="hook-label">فكر قبل أن تجيب</span><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.question)}</p><div class="thinking-dots"><i></i><i></i><i></i></div></div><div class="hook-visual"><img src="${slide.illustration}" alt=""><div class="orbit-ring one"></div><div class="orbit-ring two"></div></div></div>`;
  if(slide.type==="stats")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="metric-grid">${slide.metrics.map((m,i)=>`<article class="metric-card"><div class="metric-ring" style="--metric:${55+i*14}%"><strong>${escapeHtml(m.value)}</strong></div><span>${escapeHtml(m.label)}</span></article>`).join("")}</div>`;
  if(slide.type==="timeline")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="visual-timeline">${slide.items.map((item,i)=>`<div class="timeline-node"><b>${i+1}</b><span>${escapeHtml(item)}</span></div>`).join("")}</div>`;
  if(slide.type==="concept")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="concept-map"><div class="concept-core">${escapeHtml(slide.core)}</div>${slide.items.map((item,i)=>`<button class="concept-node node-${i+1}" data-concept-node type="button"><b>${i+1}</b><span>${escapeHtml(item)}</span></button>`).join("")}<div class="concept-feedback">اضغط على عنصر</div></div>`;
  if(slide.type==="scenario")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="scenario-layout"><div class="scenario-box"><span>الموقف</span><p>${escapeHtml(slide.text)}</p></div><div class="scenario-visual"><img src="${slide.illustration}" alt=""></div></div>`;
  if(slide.type==="choice")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="choice-scene"><div class="choice-prompt">${escapeHtml(slide.prompt)}</div><div class="choice-options">${slide.options.map((opt,i)=>`<button type="button" data-choice="${i}" data-feedback="${escapeHtml(opt.feedback)}"><b>${String.fromCharCode(65+i)}</b>${escapeHtml(opt.label)}</button>`).join("")}</div><div class="choice-feedback">اختر أحد المسارات لرؤية الأثر.</div></div>`;
  if(slide.type==="process")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="steps-line">${slide.items.map((item,i)=>`<div class="step-item"><b>${i+1}</b><span>${escapeHtml(item)}</span></div>`).join("")}</div>`;
  if(slide.type==="roles")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="roles-grid">${slide.roles.map((role,i)=>`<article class="role-card"><div class="role-avatar">${i+1}</div><h3>${escapeHtml(role.name)}</h3><p>${escapeHtml(role.text)}</p></article>`).join("")}</div>`;
  if(slide.type==="quiz")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="quiz-card"><h3>${escapeHtml(slide.question)}</h3><div class="quiz-options">${slide.options.map((opt,i)=>`<button type="button" data-quiz-option="${i}">${escapeHtml(opt)}</button>`).join("")}</div><div class="quiz-feedback" data-correct="${slide.correct}" data-feedbacks='${escapeHtml(JSON.stringify(slide.feedback))}'>اختر إجابة.</div></div>`;
  if(slide.type==="checklist")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="interactive-checklist">${slide.items.map((item,i)=>`<button type="button" data-check-item><i>✓</i><span>${escapeHtml(item)}</span></button>`).join("")}<div class="check-progress"><span></span></div></div>`;
  if(slide.type==="tracker")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="tracker-task">${escapeHtml(slide.task)}</div><div class="week-tracker">${slide.days.map(day=>`<button type="button" data-track-day><span>${escapeHtml(day)}</span><b>○</b></button>`).join("")}</div><div class="tracker-summary">0 / ${slide.days.length} أيام</div>`;
  if(slide.type==="activity")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="activity-layout"><div class="activity-box"><span>نفّذ الآن</span><h3>نشاط تفاعلي</h3><p>${escapeHtml(slide.text)}</p></div><div class="activity-visual"><img src="${slide.illustration}" alt=""></div></div>`;
  if(slide.type==="compare")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="compare-grid"><article class="compare-panel before"><h3>${escapeHtml(slide.left.title)}</h3>${slide.left.items.map(x=>`<p>— ${escapeHtml(x)}</p>`).join("")}</article><div class="compare-arrow">←</div><article class="compare-panel after"><h3>${escapeHtml(slide.right.title)}</h3>${slide.right.items.map(x=>`<p>✓ ${escapeHtml(x)}</p>`).join("")}</article></div>`;
  if(slide.type==="meter")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="meter-card"><h3>${escapeHtml(slide.question)}</h3><div class="meter-value">50%</div><input data-interactive-meter type="range" min="0" max="100" value="50"><div class="meter-labels"><span>${escapeHtml(slide.minLabel)}</span><span>${escapeHtml(slide.maxLabel)}</span></div><div class="meter-orb"></div></div>`;
  if(slide.type==="wheel")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="wheel-layout"><div class="task-wheel" data-wheel>${slide.items.map((x,i)=>`<span class="wheel-label label-${i+1}">${escapeHtml(x)}</span>`).join("")}</div><div class="wheel-controls"><button type="button" data-spin-wheel>تدوير العجلة</button><strong class="wheel-result">جاهز للمهمة؟</strong></div></div>`;
  if(slide.type==="story")content=`<div class="story-layout"><div class="story-copy"><span>حكاية قصيرة</span><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.text)}</p></div><div class="story-frame"><img src="${slide.illustration}" alt=""><div class="story-caption">${escapeHtml(slide.subtitle)}</div></div></div>`;
  if(slide.type==="quote")content=`<div class="quote-slide"><div class="quote-mark">“</div><blockquote>${escapeHtml(slide.quote)}</blockquote><p>${escapeHtml(slide.caption)}</p></div>`;
  if(slide.type==="roleplay")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="roleplay-stage">${slide.roles.map((r,i)=>`<article class="dialogue-bubble bubble-${i+1}"><b>${escapeHtml(r.name)}</b><p>${escapeHtml(r.text)}</p></article>`).join("")}<div class="stage-lights"><i></i><i></i><i></i></div></div>`;
  if(slide.type==="ladder")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="value-ladder">${slide.items.map((item,i)=>`<div style="--level:${i}"><b>${i+1}</b><span>${escapeHtml(item)}</span></div>`).join("")}</div>`;
  if(slide.type==="mission")content=`<div class="mission-layout"><div class="mission-visual"><img src="${slide.illustration}" alt=""><div class="mission-badge">مهمة</div></div><div class="mission-card"><span>${escapeHtml(slide.subtitle)}</span><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.mission)}</p><div class="mission-status"><i></i> جاهزة للبدء</div></div></div>`;
  if(slide.type==="scorecard")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="scorecard">${slide.items.map((item,i)=>`<button type="button" data-score-bar style="--score:${item.value}%"><span>${escapeHtml(item.label)}</span><i><b></b></i><strong>${item.value}%</strong></button>`).join("")}</div>`;
  if(slide.type==="recap")content=`<h2 class="slide-title">${escapeHtml(slide.title)}</h2><p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p><div class="recap-cloud">${slide.items.map((item,i)=>`<span style="--delay:${i}">${escapeHtml(item)}</span>`).join("")}</div>`;
  if(slide.type==="commitment")content=`<div class="commitment-card"><span>خطوة شخصية</span><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.subtitle)}</p><label>${escapeHtml(slide.prompt)}<input class="commitment-input" type="text" placeholder="اكتب هنا..."></label><div class="signature-line">قرار اليوم</div></div>`;
  if(slide.type==="closing")content=`<div class="closing-icon">✓</div><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.summary)}</p><div class="closing-challenge">${escapeHtml(slide.challenge)}</div>`;
  el.slideCanvas.innerHTML=slideShell(content,state.slideIndex,slide.type);bindSlideInteractions(slide);el.currentSlideNumber.textContent=state.slideIndex+1;el.totalSlideNumber.textContent=state.slides.length;
  el.slideDots.innerHTML=state.slides.map((_,index)=>`<button class="slide-dot${index===state.slideIndex?" active":""}" data-slide-index="${index}" type="button" aria-label="الشريحة ${index+1}"></button>`).join("");$all("[data-slide-index]",el.slideDots).forEach(button=>button.onclick=()=>{state.slideIndex=Number(button.dataset.slideIndex);renderSlide()});
  el.previousSlideButton.disabled=state.slideIndex===0;el.nextSlideButton.disabled=state.slideIndex===state.slides.length-1;
}
function bindSlideInteractions(slide){
  $all("[data-choice]",el.slideCanvas).forEach(button=>button.onclick=()=>{$all("[data-choice]",el.slideCanvas).forEach(x=>x.classList.remove("selected"));button.classList.add("selected");const box=el.slideCanvas.querySelector(".choice-feedback");if(box)box.textContent=button.dataset.feedback||""});
  $all("[data-quiz-option]",el.slideCanvas).forEach(button=>button.onclick=()=>{const box=el.slideCanvas.querySelector(".quiz-feedback");const correct=Number(box?.dataset.correct);let feedback=[];try{feedback=JSON.parse(box?.dataset.feedbacks||"[]")}catch(_error){}const idx=Number(button.dataset.quizOption);$all("[data-quiz-option]",el.slideCanvas).forEach(x=>x.classList.remove("correct","wrong"));button.classList.add(idx===correct?"correct":"wrong");if(box){box.textContent=feedback[idx]|| (idx===correct?"إجابة صحيحة.":"جرّب مرة أخرى.");box.classList.toggle("success",idx===correct)}});
  const meter=el.slideCanvas.querySelector("[data-interactive-meter]");if(meter){const update=()=>{const value=Number(meter.value);const card=meter.closest(".meter-card");card?.style.setProperty("--meter",`${value}%`);const label=card?.querySelector(".meter-value");if(label)label.textContent=`${value}%`};meter.oninput=update;update()}
  $all("[data-check-item]",el.slideCanvas).forEach(button=>button.onclick=()=>{button.classList.toggle("done");const all=$all("[data-check-item]",el.slideCanvas),done=all.filter(x=>x.classList.contains("done")).length;el.slideCanvas.querySelector(".check-progress span")?.style.setProperty("width",`${all.length?done/all.length*100:0}%`)});
  $all("[data-track-day]",el.slideCanvas).forEach(button=>button.onclick=()=>{button.classList.toggle("done");button.querySelector("b").textContent=button.classList.contains("done")?"✓":"○";const all=$all("[data-track-day]",el.slideCanvas),done=all.filter(x=>x.classList.contains("done")).length;const summary=el.slideCanvas.querySelector(".tracker-summary");if(summary)summary.textContent=`${done} / ${all.length} أيام`});
  const spin=el.slideCanvas.querySelector("[data-spin-wheel]");if(spin)spin.onclick=()=>{const wheel=el.slideCanvas.querySelector("[data-wheel]"),result=el.slideCanvas.querySelector(".wheel-result");const turns=4+Math.floor(Math.random()*4),angle=turns*360+Math.floor(Math.random()*360);wheel.style.transform=`rotate(${angle}deg)`;const items=slide.items||[];setTimeout(()=>{if(result)result.textContent=`المهمة: ${items[Math.floor(Math.random()*items.length)]||"ابدأ"}`},1100)};
  $all("[data-concept-node]",el.slideCanvas).forEach(button=>button.onclick=()=>{$all("[data-concept-node]",el.slideCanvas).forEach(x=>x.classList.remove("active"));button.classList.add("active");const feedback=el.slideCanvas.querySelector(".concept-feedback");if(feedback)feedback.textContent=button.textContent.trim()});
  $all("[data-score-bar]",el.slideCanvas).forEach(button=>button.onclick=()=>{const current=Number((button.style.getPropertyValue("--score")||"0").replace("%",""));const next=current>=100?20:Math.min(100,current+10);button.style.setProperty("--score",`${next}%`);button.querySelector("strong").textContent=`${next}%`});
}
function openProgram(id){const program=CATALOG.find(item=>item.id===id);if(!program)return;state.currentProgram=program;state.deckTheme=deckThemeFor(program);state.slides=makeSlides(program);state.slideIndex=0;el.viewerCategory.textContent=CATEGORY_LABELS[program.category]||program.category;el.viewerProgramTitle.textContent=program.title;el.viewerAudience.textContent=audienceText();el.viewerModal.hidden=false;document.body.style.overflow="hidden";renderSlide()}
function closeViewer(){stopAutoPlay();el.viewerModal.hidden=true;document.body.style.overflow="";if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
function nextSlide(){if(state.slideIndex<state.slides.length-1){state.slideIndex++;renderSlide()}else if(state.autoPlayTimer){state.slideIndex=0;renderSlide()}}
function previousSlide(){if(state.slideIndex>0){state.slideIndex--;renderSlide()}}
function startAutoPlay(){stopAutoPlay();state.autoPlayTimer=setInterval(nextSlide,6500);el.toggleAutoPlayButton.textContent="إيقاف التشغيل"}
function stopAutoPlay(){if(state.autoPlayTimer)clearInterval(state.autoPlayTimer);state.autoPlayTimer=null;if(el.toggleAutoPlayButton)el.toggleAutoPlayButton.textContent="تشغيل تلقائي"}
function toggleAutoPlay(){state.autoPlayTimer?stopAutoPlay():startAutoPlay()}
async function toggleFullscreen(){try{if(!document.fullscreenElement)await el.viewerModal.requestFullscreen();else await document.exitFullscreen()}catch(_error){toast("تعذر تشغيل ملء الشاشة.",true)}}
function customRequestPayload(){return{title:clean(el.customTitle.value),category:el.customCategory.value,stage:el.customStage.value,gender:assignedAudienceType(),objective:clean(el.customObjective.value),slides:Number(el.customSlides.value||15),notes:clean(el.customNotes.value)}}
function updateCustomWhatsApp(){const request=customRequestPayload();if(SCHOOL_EDITION){if(el.customWhatsAppLink)el.customWhatsAppLink.hidden=true;if(el.customWhatsappConfirmed)el.customWhatsappConfirmed.checked=true;el.submitCustomRequestButton.disabled=!request.title||!request.objective||request.slides<15||request.slides>40;return}const message=["السلام عليكم، أرغب في تصميم عرض تقديمي خاص.",`العنوان: ${request.title||"لم يحدد بعد"}`,`التصنيف: ${CATEGORY_LABELS[request.category]||"برنامج خاص"}`,`المرحلة: ${STAGE_LABELS[request.stage]||request.stage}`,`الجمهور: ${GENDER_LABELS[request.gender]||request.gender}`,`عدد الشرائح المتوقع: ${request.slides}`,`الهدف: ${request.objective||"سيتم توضيحه"}`,`المدرسة: ${state.account?.school_name||"غير محددة"}`,`الاسم: ${state.account?.full_name||state.user?.email||""}`,`ملاحظات: ${request.notes||"لا توجد"}`].join("\n");el.customWhatsAppLink.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;el.submitCustomRequestButton.disabled=!el.customWhatsappConfirmed.checked||!request.title||!request.objective||request.slides<15||request.slides>40}

const REQUEST_STATUS_LABELS={pending:"قيد المراجعة",contacted:"تم التواصل",quoted:"تم التسعير",in_progress:"قيد التصميم",completed:"مكتمل",rejected:"مرفوض",cancelled:"ملغي"};
const SCHOOL_REQUESTS_KEY="mishkat_school_presentation_requests_v1";
function readSchoolPresentationRequests(){try{const raw=JSON.parse(localStorage.getItem(SCHOOL_REQUESTS_KEY)||"[]");return Array.isArray(raw)?raw:[]}catch(_error){return[]}}
function writeSchoolPresentationRequests(items){try{localStorage.setItem(SCHOOL_REQUESTS_KEY,JSON.stringify(Array.isArray(items)?items:[]))}catch(_error){}}
function renderMyRequests(){
  if(!el.myRequestsList)return;
  el.myRequestsList.innerHTML=state.requests.length?state.requests.map(request=>`<article class="request-item"><div><h4>${escapeHtml(request.title)}</h4><p>${escapeHtml(STAGE_LABELS[request.stage]||request.stage)} — ${escapeHtml(GENDER_LABELS[request.audience_gender]||request.audience_gender)} — ${request.desired_slides} شرائح — ${formatDate(request.created_at)}</p></div><span class="request-status ${escapeHtml(request.status||"pending")}">${escapeHtml(REQUEST_STATUS_LABELS[request.status]||request.status||"قيد المراجعة")}</span></article>`).join(""):'<div class="loading-line">لا توجد طلبات تصميم خاصة حتى الآن.</div>';
}
async function loadMyRequests(){
  if(SCHOOL_EDITION){state.requests=readSchoolPresentationRequests().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));renderMyRequests();return state.requests}
  if(!db){state.requests=[];renderMyRequests();return state.requests}
  const{data,error}=await db.from("premium_custom_presentation_requests").select("id,title,stage,audience_gender,desired_slides,status,estimated_price_sar,created_at").eq("user_id",state.user.id).order("created_at",{ascending:false});
  if(error){el.myRequestsList.innerHTML=`<div class="status-box error">${escapeHtml(error.message)}</div>`;return[]}
  state.requests=data||[];renderMyRequests();return state.requests;
}
function openCustomRequest(){
  if(!assignedAudienceType()){openModal("audienceModal");return toast("حدد نوع الطلاب أولًا.",true)}
  el.customStage.value=state.stage;el.customGender.value=assignedAudienceType();
  if(el.customWhatsappConfirmed)el.customWhatsappConfirmed.checked=SCHOOL_EDITION;
  hideStatus(el.customRequestStatus);updateCustomWhatsApp();openModal("customRequestModal");
}
async function submitCustomRequest(){
  const request=customRequestPayload();
  if(!request.title||!request.objective)return showStatus(el.customRequestStatus,"اكتب عنوان البرنامج والهدف المطلوب.",true);
  if(SCHOOL_EDITION){
    el.submitCustomRequestButton.disabled=true;
    try{
      const item={id:`local-${Date.now()}`,title:request.title,stage:request.stage,audience_gender:request.gender,desired_slides:request.slides,status:"pending",objective:request.objective,notes:request.notes||"",created_at:new Date().toISOString()};
      const rows=[item,...readSchoolPresentationRequests()];writeSchoolPresentationRequests(rows);state.requests=rows;renderMyRequests();showStatus(el.customRequestStatus,"تم تسجيل طلب العرض داخل المنصة.");toast("تم تسجيل طلب العرض");el.customTitle.value="";el.customObjective.value="";el.customNotes.value="";el.customSlides.value="15";
    }catch(error){showStatus(el.customRequestStatus,error?.message||"تعذر تسجيل الطلب.",true)}finally{updateCustomWhatsApp()}
    return;
  }
  if(!el.customWhatsappConfirmed.checked)return showStatus(el.customRequestStatus,"تواصل عبر واتساب ثم فعّل الإقرار.",true);
  el.submitCustomRequestButton.disabled=true;
  try{const{error}=await db.rpc("premium_submit_custom_presentation_request",{p_title:request.title,p_category:request.category,p_stage:request.stage,p_audience_gender:request.gender,p_objective:request.objective,p_desired_slides:request.slides,p_delivery_notes:request.notes||null});if(error)throw error;showStatus(el.customRequestStatus,"تم تسجيل الطلب.");toast("تم إرسال طلب التصميم");el.customTitle.value="";el.customObjective.value="";el.customNotes.value="";el.customSlides.value="15";el.customWhatsappConfirmed.checked=false;await loadMyRequests()}catch(error){showStatus(el.customRequestStatus,error.message||"تعذر إرسال الطلب.",true)}finally{updateCustomWhatsApp()}
}
async function loadAccount(){
  if(SCHOOL_EDITION)return state.account;
  let{data,error}=await db.from("premium_accounts").select("user_id,full_name,email,school_name,school_logo_data,is_system_admin,is_active,presentation_audience_type").eq("user_id",state.user.id).maybeSingle();if(error)throw error;if(!data){await new Promise(resolve=>setTimeout(resolve,500));({data,error}=await db.from("premium_accounts").select("user_id,full_name,email,school_name,school_logo_data,is_system_admin,is_active,presentation_audience_type").eq("user_id",state.user.id).single());if(error)throw error}state.account=Object.freeze({...data});state.gender=data.presentation_audience_type||"";
  const[accessResult,entitlementsResult]=await Promise.all([db.rpc("premium_has_package_access",{p_product_code:CURRENT_PACKAGE_CODE,p_user_id:state.user.id}),db.from("premium_entitlements").select("product_code,billing_period,started_at,expires_at,is_active").eq("user_id",state.user.id).order("expires_at",{ascending:false})]);if(accessResult.error)throw accessResult.error;if(entitlementsResult.error)throw entitlementsResult.error;state.packageAccess=Boolean(accessResult.data);state.entitlements=entitlementsResult.data||[];return state.account;
}

function redirectToPortal(message){try{sessionStorage.setItem("portal_notice",message)}catch(_error){}location.replace("../index.html")}
async function applySession(session){
  if(!session?.user)return redirectToPortal("سجّل الدخول أولًا من بوابة المنصات.");state.user=session.user;
  try{await loadAccount();if(!state.packageAccess)return redirectToPortal("باقة العروض التقديمية غير مفعّلة على هذا الحساب.");if(!cameFromUnifiedPortal())return redirectToPortal("اختر منصة العروض التقديمية من بوابة المنصات أولًا.");renderIdentity();renderPlatformSwitcher();renderAudienceControls();renderCategoryTabs();renderCatalog();await loadMyRequests();el.accessGate.hidden=true;el.appShell.hidden=false;if(!state.account?.presentation_audience_type){openModal("audienceModal");toast("اختر نوع الطلاب مرة واحدة. بعد التثبيت لا يغيّره إلا مدير النظام.")}}catch(error){console.error(error);redirectToPortal("تعذر التحقق من صلاحية منصة العروض التقديمية.")}
}
function bind(){
  el.openAudienceButton.onclick=()=>openModal("audienceModal");el.confirmAudienceButton.onclick=confirmAudience;el.openCustomRequestButton.onclick=openCustomRequest;el.openCustomRequestButtonBottom.onclick=openCustomRequest;el.refreshRequestsButton.onclick=loadMyRequests;
  $all("[data-close]").forEach(button=>button.onclick=()=>closeModal(button.dataset.close));$all(".modal").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal)closeModal(modal.id)}));
  el.programSearch.addEventListener("input",()=>{state.search=el.programSearch.value;renderCatalog()});el.sortPrograms.onchange=()=>{state.sort=el.sortPrograms.value;renderCatalog()};
  el.closeViewerButton.onclick=closeViewer;el.nextSlideButton.onclick=nextSlide;el.previousSlideButton.onclick=previousSlide;el.toggleAutoPlayButton.onclick=toggleAutoPlay;el.fullScreenButton.onclick=toggleFullscreen;
  [el.customTitle,el.customCategory,el.customStage,el.customGender,el.customObjective,el.customSlides,el.customNotes].forEach(node=>node.addEventListener("input",updateCustomWhatsApp));el.customWhatsappConfirmed.onchange=updateCustomWhatsApp;el.submitCustomRequestButton.onclick=submitCustomRequest;
  document.addEventListener("keydown",event=>{
    if(!el.viewerModal.hidden){if(event.key==="ArrowLeft")nextSlide();if(event.key==="ArrowRight")previousSlide();if(event.key==="Escape")closeViewer();if(event.key===" "){event.preventDefault();nextSlide()}}
    if((event.ctrlKey||event.metaKey)&&["s","p"].includes(event.key.toLowerCase())){event.preventDefault();toast("العروض متاحة للمشاهدة داخل المنصة فقط.",true)}
  });
  document.addEventListener("contextmenu",event=>{if(!el.viewerModal.hidden)event.preventDefault()});
}
async function init(){
  bind();
  if(SCHOOL_EDITION){
    const ctx=window.MishkatSchoolContext?.getContext?.()||{};const automaticGender=ctx.schoolType==="girls"?"girls":"boys";
    const stageText=String(ctx.stage||"");const automaticStage=stageText.includes("ثانو")?"secondary":stageText.includes("متوسط")?"middle":stageText.includes("ابتد")?(state.stage==="lower_primary"?"lower_primary":"upper_primary"):state.stage;state.stage=automaticStage;
    state.user={id:ctx.id||"mishkat-school-user",email:""};state.account={user_id:state.user.id,full_name:ctx.counselorName||"الموجه الطلابي",school_name:ctx.schoolName||"مدارس المشكاة الأهلية",school_logo_data:"../assets/school-logo.png",is_system_admin:false,is_active:true,presentation_audience_type:automaticGender};state.packageAccess=true;state.entitlements=[];state.gender=automaticGender;
    localStorage.setItem("presentation_gender",automaticGender);localStorage.setItem("presentation_stage",automaticStage);
    renderIdentity();renderPlatformSwitcher();renderAudienceControls();renderCategoryTabs();renderCatalog();state.requests=[];renderMyRequests();await loadMyRequests();if(el.openAudienceButton)el.openAudienceButton.hidden=true;el.accessGate.hidden=true;el.appShell.hidden=false;return;
  }
  if(!db)return redirectToPortal("تعذر الاتصال بقاعدة البيانات.");const{data,error}=await db.auth.getSession();if(error)return redirectToPortal("تعذر قراءة جلسة الدخول.");await applySession(data.session);db.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){clearUnifiedLaunches();redirectToPortal("تم تسجيل الخروج.")}else if(session?.user&&session.user.id!==state.user?.id)setTimeout(()=>applySession(session),0)})
}
init();
