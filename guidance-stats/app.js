"use strict";
(function(global){
  const TYPES=[
    {type:"Guidance_Attandance",label:"الغياب",group:"attendance",date:["MeetingDate","MsgDate"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic year"],term:["Term"]},
    {type:"Guidance_Cases",label:"دراسة الحالات",group:"individual",date:["DiscoverDate"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic Year"],term:["Terms"]},
    {type:"Guidance_Collective",label:"الإرشاد الجمعي",group:"collective",date:["Collective Date"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic year"],term:["Term"]},
    {type:"Guidance_Contact",label:"التواصل",group:"contacts",date:["Contact_Date"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic Year"],term:["Terms"]},
    {type:"guidance_Fail",label:"الضعف الدراسي",group:"attendance",date:["Fail Date"],student:["Student"],school:["school"],dep:["Dep"],year:["academic year"],term:["term"]},
    {type:"Guidance_Late",label:"التأخر",group:"attendance",date:["MeetingDate","MsgDate"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic year"],term:["Term"]},
    {type:"Guidance_Log",label:"سجل المتابعة",group:"individual",date:["SetDate","MessageDate"],student:["student"],school:["school"],dep:["Dep"],year:["year"],term:[]},
    {type:"Guidance_Mettings",label:"المقابلات والجلسات",group:"individual",date:["Meeting Date"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic Year"],term:["Terms"]},
    {type:"Guidance_Observation",label:"الملاحظة",group:"collective",date:["Observ Date"],student:["student"],school:["School"],dep:["Dep"],year:["Academic year"],term:["term"]},
    {type:"Guidance_Periodic",label:"المتابعة الدورية",group:"individual",date:["Perd Date"],student:["student"],school:["School"],dep:["Dep"],year:["Academic year"],term:["Term"]},
    {type:"Guidance_Project",label:"المشروعات",group:"collective",date:["Start Date","Last Date"],student:[],school:["school"],dep:["dep"],year:["year"],term:["Team"]},
    {type:"Guidance_Project_Progress",label:"متابعة المشروعات",group:"collective",date:["Do Date"],student:[],school:["school"],dep:["dep"],year:[],term:[]},
    {type:"Guidance_Situation",label:"المواقف اليومية",group:"individual",date:["SituationDate"],student:["Student"],school:["school"],dep:["Department"],year:["Academic year"],term:["Terms"]},
    {type:"Guidance_SubCollective",label:"البرامج/الزيارات التوجيهية",group:"collective",date:["Collective Date","next Date"],student:[],school:["School"],dep:["Dep"],year:["Academic year"],term:["Term"]},
    {type:"Guidance_Plan",label:"الخطط",group:"plans",date:["Modified Date","Created Date"],student:[],school:["School"],dep:["Department"],year:["AcademicYear"],term:["Term"]},
    {type:"Guidance_Event",label:"التقويم والأحداث",group:"plans",date:["EventDate"],student:["Student"],school:["School"],dep:["Department"],year:["AcademicYear"],term:["Term"]},
    {type:"Guidance_Message",label:"المراسلات",group:"contacts",date:["SentDate","CreatedDateCustom","Created Date"],student:["Student"],school:["School"],dep:["Department"],year:["AcademicYear"],term:["Term"]},
    {type:"Guidance_Presentation",label:"العروض التقديمية",group:"collective",date:["CreatedAt","UpdatedAt","Created Date"],student:[],school:["School"],dep:["Department"],year:["AcademicYear"],term:["Term"]},
    {type:"Guidance_Certificate",label:"شهادات التقدير",group:"certificates",date:["IssueDate","Created Date"],student:["Student"],school:["School"],dep:["Department"],year:["AcademicYear"],term:["Term"]}
  ];
  const PROGRAM_TYPES=new Set(["Guidance_Collective","Guidance_SubCollective","Guidance_Project"]);
  const SESSION_TYPES=new Set(["Guidance_Mettings"]);
  const $=id=>document.getElementById(id);
  const norm=v=>String(v??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/[\u064B-\u065F\u0670]/g,"").replace(/\s+/g," ").trim();
  const idOf=v=>{if(v==null)return"";if(typeof v==="string"||typeof v==="number")return String(v);return String(v._id||v.id||v.unique_id||v["unique id"]||v["Unique ID"]||"")};
  const looksLikeBubbleId=v=>/^\d{10,}x\d+$/i.test(String(v||""))||/^\d{13,}$/.test(String(v||""));
  const labelOf=v=>{
    if(v==null)return"";
    if(typeof v==="string"||typeof v==="number"){
      const text=String(v).trim();
      return looksLikeBubbleId(text)?"":text;
    }
    const keys=["School Name","school name","SchoolName","schoolName","School_Name","school_name","Complex Name","complex name","Campus Name","campus name","اسم المدرسة","اسم المجمع","المجمع","Dep. Name","Department Name","Full Name","Titel","Title","title","Name","name","label","Label","display","Display"];
    for(const key of keys){const raw=v?.[key];if(raw===undefined||raw===null||raw==="")continue;const text=typeof raw==="object"?labelOf(raw):String(raw).trim();if(text&&!looksLikeBubbleId(text))return text}
    return"";
  };
  const first=(row,keys)=>{for(const k of keys||[]){const v=row?.[k];if(v!==undefined&&v!==null&&v!=="")return v}return""};
  const relValues=v=>Array.isArray(v)?v:(v?[v]:[]);
  const relationMatches=(v,id,name)=>relValues(v).some(x=>(id&&idOf(x)===String(id))||(name&&norm(labelOf(x)||x)===norm(name)));
  const schoolRows=()=>{
    const snap=global.MishkatBubbleDirectory?.getSnapshot?.()||{};
    const normalized=[...(Array.isArray(snap.campuses)?snap.campuses:[]),...(Array.isArray(snap.schools)?snap.schools:[])];
    if(normalized.length)return normalized;
    const raw=snap.raw||{};
    return raw.School||raw.schools||raw.Schools||[];
  };
  const depRows=()=>{
    const snap=global.MishkatBubbleDirectory?.getSnapshot?.()||{};
    if(Array.isArray(snap.departments)&&snap.departments.length)return snap.departments;
    const raw=snap.raw||{};
    return raw.Department||raw.Departments||raw.departments||[];
  };
  const termRows=()=>global.MishkatBubbleDirectory?.getSnapshot?.()?.terms||[];
  const yearRows=()=>global.MishkatBubbleDirectory?.getSnapshot?.()?.academicYears||[];
  function current(){return global.MishkatSchoolContext?.getContext?.()||{}}
  function params(){return new URLSearchParams(location.search)}
  const FULL_STATS_ROLES=new Set(["system_admin","general_supervisor","complexes_director","complex_supervisor","guidance_supervisor","guidance_coordinator"]);
  function requestedScope(){return params().get("scope")==="supervision"?"supervision":"school"}
  function scopeFor(c){
    if(c?.roleKey==="counselor"||c?.roleKey==="school_manager")return "school";
    if(FULL_STATS_ROLES.has(c?.roleKey))return "supervision";
    return requestedScope();
  }
  function canAccess(c,scope){return scope==="supervision"?Boolean(c.canViewSupervisionStats):Boolean(c.canViewSchoolStats)}
  function counselorAssignmentScope(c){
    const schoolIds=new Set((c.assignedSchoolIds||[]).map(String).filter(Boolean));
    const schoolNames=new Set((c.assignedSchoolNames||[]).map(norm).filter(Boolean));
    const stageIds=new Set((c.assignedStageIds||[]).map(String).filter(Boolean));
    const stageNames=new Set((c.assignedStageNames||[]).map(norm).filter(Boolean));
    // Fallbacks are only used when Bubble returned a single resolved assignment.
    if(!schoolIds.size&&c.schoolId)schoolIds.add(String(c.schoolId));
    if(!schoolNames.size&&c.schoolName)schoolNames.add(norm(c.schoolName));
    if(!stageIds.size&&c.stageId)stageIds.add(String(c.stageId));
    if(!stageNames.size&&c.stage)String(c.stage).split('،').map(norm).filter(Boolean).forEach(x=>stageNames.add(x));
    return{schoolIds,schoolNames,stageIds,stageNames};
  }
  function allowedSchoolSet(c,scope){
    if(scope==="school"){
      if(c.roleKey==="counselor"){
        const a=counselorAssignmentScope(c);
        return{ids:a.schoolIds,names:a.schoolNames,all:false};
      }
      return{ids:new Set([c.schoolId].filter(Boolean).map(String)),names:new Set([c.schoolName].filter(Boolean).map(norm)),all:false};
    }
    if(FULL_STATS_ROLES.has(c.roleKey))return{ids:new Set(),names:new Set(),all:true};
    const ids=new Set((c.assignedSchoolIds||[]).map(String));
    const names=new Set((c.assignedSchoolNames||[]).map(norm));
    if(!ids.size&&c.schoolId)ids.add(String(c.schoolId));
    if(!names.size&&c.schoolName)names.add(norm(c.schoolName));
    return{ids,names,all:false};
  }
  function schoolMap(){
    const m=new Map();
    schoolRows().forEach(r=>{const id=idOf(r);const name=labelOf(r)||String(r?.name||"").trim();if(id&&name&&!looksLikeBubbleId(name))m.set(String(id),name)});
    const c=current();
    if(c.schoolId&&c.schoolName)m.set(String(c.schoolId),String(c.schoolName));
    (c.assignedSchoolIds||[]).forEach((id,i)=>{const name=(c.assignedSchoolNames||[])[i];if(id&&name)m.set(String(id),String(name))});
    return m;
  }
  function schoolNameOf(v,map){
    if(Array.isArray(v))v=v[0];
    const id=idOf(v);
    const mapped=id&&map.get(String(id));
    if(mapped&&!looksLikeBubbleId(mapped))return mapped;
    const direct=labelOf(v);
    if(direct)return direct;
    const c=current();
    if(id&&String(id)===String(c.schoolId||"")&&c.schoolName)return c.schoolName;
    return "غير محدد";
  }
  function depMap(){
    const m=new Map();
    depRows().forEach(r=>{const id=idOf(r),name=labelOf(r);if(id&&name&&!looksLikeBubbleId(name))m.set(String(id),name)});
    const c=current();
    if(c.stageId&&c.stage)m.set(String(c.stageId),String(c.stage));
    (c.assignedStageIds||[]).forEach((id,i)=>{const name=(c.assignedStageNames||[])[i];if(id&&name)m.set(String(id),String(name))});
    return m;
  }
  function depNameOf(v,map){
    if(Array.isArray(v))v=v[0];
    const id=idOf(v),mapped=id&&map.get(String(id));
    if(mapped&&!looksLikeBubbleId(mapped))return mapped;
    const direct=labelOf(v);
    if(direct)return direct;
    const c=current();
    if(id&&String(id)===String(c.stageId||"")&&c.stage)return c.stage;
    return "غير محدد";
  }
  function depMatch(v,c,scope){
    if(scope!=="school"||c.roleKey!=="counselor")return true;
    const a=counselorAssignmentScope(c);
    // Fail closed: a counselor without a Bubble stage assignment must not inherit all stages.
    if(!a.stageIds.size&&!a.stageNames.size)return false;
    return relValues(v).some(x=>{
      const id=idOf(x),name=norm(labelOf(x)||x);
      return(id&&a.stageIds.has(String(id)))||(name&&a.stageNames.has(name));
    });
  }
  function inAllowedSchool(v,allowed,map){if(allowed.all)return true;const id=idOf(Array.isArray(v)?v[0]:v);const name=schoolNameOf(v,map);return(id&&allowed.ids.has(String(id)))||(name&&allowed.names.has(norm(name)))}
  function selectedFilters(){return{year:$("yearFilter").value,term:$("termFilter").value,school:$("schoolFilter").value}}
  function rowPasses(item,row,c,scope,allowed,smap,filters){
    const school=first(row,item.school);if(!inAllowedSchool(school,allowed,smap))return false;if(!depMatch(first(row,item.dep),c,scope))return false;
    if(filters.school&&!relationMatches(school,filters.school,smap.get(filters.school)||""))return false;
    if(filters.year){const y=first(row,item.year);if(y&&!relationMatches(y,filters.year,""))return false}
    if(filters.term){const t=first(row,item.term);if(t&&!relationMatches(t,filters.term,""))return false}
    return true;
  }
  function dateOf(item,row){const v=first(row,item.date)||row?.["Modified Date"]||row?.["Created Date"]||"";const d=new Date(v);return Number.isFinite(d.getTime())?d:null}
  function studentIds(item,row){const v=first(row,item.student);return relValues(v).map(x=>idOf(x)||String(x||"")).filter(Boolean)}
  function safeJSON(value){if(!value)return{};if(typeof value==="object")return value;try{return JSON.parse(value)}catch(_e){return{}}}
  function planProgress(row){
    const meta=safeJSON(row?.Notes??row?.notes??"");const segments=Array.isArray(meta.segments)?meta.segments:[];let total=0,completed=0;
    segments.filter(s=>s&&s.type==="week").forEach(seg=>{[...(seg.tasks||[]),...(seg.programs||[]),...(seg.emerging||[])].forEach(item=>{if(!String(item?.text||"").trim())return;total++;if(item.done===true)completed++})});
    if(total)return{total,completed,percent:Math.round(completed/total*100)};
    const status=norm(row?.Status||row?.status||"");return{total:status==="completed"?1:0,completed:status==="completed"?1:0,percent:status==="completed"?100:0};
  }
  async function loadAll(){
    const store=global.MishkatBubbleStore;if(!store)return[];
    return Promise.all(TYPES.map(async item=>{try{const rows=await store.list(item.type,[],{sortField:"Modified Date",descending:true});return{item,rows:Array.isArray(rows)?rows:[]}}catch(e){console.warn("Statistics source unavailable",item.type,e);return{item,rows:[]}}}));
  }
  function option(select,id,name,currentId){const o=document.createElement("option");o.value=id;o.textContent=name;if(String(id)===String(currentId||""))o.selected=true;select.appendChild(o)}
  function setupFilters(c,scope,allowed){
    const yf=$("yearFilter"),tf=$("termFilter"),sf=$("schoolFilter");
    yf.innerHTML='<option value="">كل الأعوام</option>';tf.innerHTML='<option value="">كل الفصول</option>';sf.innerHTML='<option value="">كل المجمعات المسموح بها</option>';
    yearRows().forEach(y=>option(yf,y.id,y.name,c.academicYearId));termRows().forEach(t=>option(tf,t.id,t.name,c.termId));
    if(scope==="supervision"){$("schoolFilterLabel").hidden=false;const sm=schoolMap();schoolRows().forEach(s=>{const id=idOf(s),name=labelOf(s)||id;if(allowed.all||allowed.ids.has(id)||allowed.names.has(norm(name)))option(sf,id,name,"")})}else $("schoolFilterLabel").hidden=true;
  }
  function bars(target,rows){const box=$(target);box.innerHTML="";const max=Math.max(1,...rows.map(x=>x.value));if(!rows.length){box.innerHTML='<div class="empty">لا توجد بيانات في النطاق المحدد.</div>';return}rows.forEach(x=>{const el=document.createElement("div");el.className="bar-row";el.innerHTML=`<span>${x.label}</span><div class="bar"><i style="width:${Math.max(2,(x.value/max)*100)}%"></i></div><b>${x.value}</b>`;box.appendChild(el)})}
  function setMetric(id,v,suffix=""){const node=$(id);if(node)node.textContent=`${v??0}${suffix}`}
  function ensureAgg(map,sid,sname){const key=String(sid||norm(sname)||"غير محدد");if(!map.has(key))map.set(key,{id:key,name:sname||"غير محدد",total:0,students:new Set(),individual:0,contacts:0,collective:0,programs:0,sessions:0,planTotal:0,planCompleted:0,planFallbackSum:0,planFallbackCount:0,stages:new Map()});return map.get(key)}
  function ensureStageAgg(schoolAgg,depId,depName){
    const name=depName||"غير محدد";
    const key=String(depId||norm(name)||"غير محدد");
    if(!schoolAgg.stages.has(key))schoolAgg.stages.set(key,{id:key,name,total:0,students:new Set(),programs:0,sessions:0,planTotal:0,planCompleted:0,planFallbackSum:0,planFallbackCount:0});
    return schoolAgg.stages.get(key);
  }
  function stageRank(name){
    const n=norm(name);
    if(n.includes("روض")||n.includes("تمهيد"))return 0;
    if(n.includes("ابتد")&&(n.includes("اولي")||n.includes("اوليه")||n.includes("اولى")))return 1;
    if(n.includes("ابتد")&&n.includes("عليا"))return 2;
    if(n.includes("متوسط"))return 3;
    if(n.includes("ثانو"))return 4;
    return 99;
  }
  function seedSchools(map,c,scope,allowed,smap){
    if(scope==="school"){ensureAgg(map,c.schoolId||norm(c.schoolName),c.schoolName||"المدرسة");return}
    if(allowed.all){smap.forEach((name,id)=>ensureAgg(map,id,name));return}
    allowed.ids.forEach(id=>ensureAgg(map,id,smap.get(String(id))||String(id)));
    allowed.names.forEach(name=>{if(![...map.values()].some(a=>norm(a.name)===name))ensureAgg(map,name,name)})
  }
  function completionOf(a){if(a.planTotal)return Math.round(a.planCompleted/a.planTotal*100);if(a.planFallbackCount)return Math.round(a.planFallbackSum/a.planFallbackCount);return 0}
  function renderPlanChart(rows){const box=$("planCompletionChart");box.innerHTML="";if(!rows.length){box.innerHTML='<div class="empty">لا توجد مجمعات في النطاق.</div>';return}rows.forEach(a=>{const pct=completionOf(a);const row=document.createElement("div");row.className="school-chart-row";row.innerHTML=`<span title="${a.name}">${a.name}</span><div class="chart-track"><i style="width:${pct}%"></i></div><b>${pct}%</b>`;box.appendChild(row)})}
  function renderExecutionChart(rows){const box=$("programSessionsChart");box.innerHTML="";if(!rows.length){box.innerHTML='<div class="empty">لا توجد مجمعات في النطاق.</div>';return}const max=Math.max(1,...rows.flatMap(a=>[a.programs,a.sessions]));rows.forEach(a=>{const row=document.createElement("div");row.className="school-chart-row";row.innerHTML=`<span title="${a.name}">${a.name}</span><div class="dual-bars"><div class="dual-track program"><i style="width:${a.programs?Math.max(3,a.programs/max*100):0}%"></i></div><div class="dual-track session"><i style="width:${a.sessions?Math.max(3,a.sessions/max*100):0}%"></i></div><div class="dual-values"><span class="p">برامج ${a.programs}</span><span class="s">جلسات ${a.sessions}</span></div></div><b>${a.programs+a.sessions}</b>`;box.appendChild(row)})}
  function renderCampusStageTable(rows){
    const body=$("schoolsBody");
    body.innerHTML="";
    rows.forEach(a=>{
      const pct=completionOf(a);
      const summary=document.createElement("tr");
      summary.className="campus-summary-row";
      summary.innerHTML=`<td colspan="6"><div class="campus-summary"><div><span class="campus-label">المجمع</span><strong>${a.name}</strong></div><div class="campus-total"><span>إجمالي النشاط</span><b>${a.total}</b></div><div class="campus-total"><span>الطلاب</span><b>${a.students.size}</b></div><div class="campus-total"><span>إنجاز الخطة</span><b>${pct}%</b></div></div></td>`;
      body.appendChild(summary);
      const stages=[...a.stages.values()].sort((x,y)=>stageRank(x.name)-stageRank(y.name)||String(x.name).localeCompare(String(y.name),"ar"));
      if(!stages.length){
        const empty=document.createElement("tr");
        empty.className="stage-empty-row";
        empty.innerHTML='<td colspan="6">لا يوجد نشاط مسجل على مستوى المراحل داخل هذا المجمع.</td>';
        body.appendChild(empty);
        return;
      }
      stages.forEach(st=>{
        const spct=completionOf(st);
        const tr=document.createElement("tr");
        tr.className="stage-detail-row";
        tr.innerHTML=`<td><div class="stage-name"><i></i><b>${st.name}</b></div></td><td class="completion-cell"><strong>${spct}%</strong><div><i style="width:${spct}%"></i></div></td><td>${st.programs}</td><td>${st.sessions}</td><td><strong>${st.total}</strong></td><td>${st.students.size}</td>`;
        body.appendChild(tr);
      });
    });
    if(!body.children.length)body.innerHTML='<tr><td colspan="6" class="empty">لا توجد بيانات.</td></tr>';
  }
  function render(data,c,scope,allowed){
    const filters=selectedFilters(),smap=schoolMap(),dmap=depMap(),typeCounts=[],schoolAgg=new Map(),unique=new Set(),latest=[];
    const groups={individual:0,collective:0,contacts:0,attendance:0,plans:0,certificates:0};let total=0,programs=0,sessions=0;
    seedSchools(schoolAgg,c,scope,allowed,smap);
    data.forEach(({item,rows})=>{let count=0;rows.forEach(row=>{
      if(!rowPasses(item,row,c,scope,allowed,smap,filters))return;
      count++;total++;groups[item.group]=(groups[item.group]||0)+1;studentIds(item,row).forEach(x=>unique.add(x));
      const school=first(row,item.school),sid=idOf(Array.isArray(school)?school[0]:school)||schoolNameOf(school,smap),sname=schoolNameOf(school,smap),a=ensureAgg(schoolAgg,sid,sname);
      const dep=first(row,item.dep),did=idOf(Array.isArray(dep)?dep[0]:dep),dname=depNameOf(dep,dmap),st=ensureStageAgg(a,did,dname);
      const ids=studentIds(item,row);
      a.total++;st.total++;ids.forEach(x=>{a.students.add(x);st.students.add(x)});if(item.group==="individual")a.individual++;if(item.group==="contacts")a.contacts++;if(item.group==="collective")a.collective++;
      if(PROGRAM_TYPES.has(item.type)){a.programs++;st.programs++;programs++}if(SESSION_TYPES.has(item.type)){a.sessions++;st.sessions++;sessions++}
      if(item.type==="Guidance_Plan"){const p=planProgress(row);if(p.total){a.planTotal+=p.total;a.planCompleted+=p.completed;st.planTotal+=p.total;st.planCompleted+=p.completed}else{a.planFallbackSum+=p.percent;a.planFallbackCount++;st.planFallbackSum+=p.percent;st.planFallbackCount++}}
      const d=dateOf(item,row);if(d)latest.push({label:item.label,campus:sname,stage:dname,date:d});
    });if(count)typeCounts.push({label:item.label,value:count})});
    const schoolRowsView=[...schoolAgg.values()].filter(a=>filters.school?String(a.id)===String(filters.school)||norm(a.name)===norm(smap.get(filters.school)||""):true).sort((a,b)=>completionOf(b)-completionOf(a)||b.total-a.total);
    const planTotal=schoolRowsView.reduce((n,a)=>n+a.planTotal,0),planCompleted=schoolRowsView.reduce((n,a)=>n+a.planCompleted,0);let scopeCompletion=planTotal?Math.round(planCompleted/planTotal*100):0;if(!planTotal){const fallback=schoolRowsView.filter(a=>a.planFallbackCount);if(fallback.length)scopeCompletion=Math.round(fallback.reduce((n,a)=>n+completionOf(a),0)/fallback.length)}
    setMetric("mPlanCompletion",scopeCompletion,"%");setMetric("mTotal",total);setMetric("mStudents",unique.size);setMetric("mPrograms",programs);setMetric("mSessions",sessions);setMetric("mIndividual",groups.individual);setMetric("mContacts",groups.contacts);setMetric("mAttendance",groups.attendance);
    renderPlanChart(schoolRowsView);renderExecutionChart(schoolRowsView);
    bars("typeBars",typeCounts.sort((a,b)=>b.value-a.value).slice(0,12));bars("operationalBars",[{label:"السجلات الفردية",value:groups.individual},{label:"التواصل والمراسلات",value:groups.contacts},{label:"المواظبة والضعف",value:groups.attendance},{label:"البرامج الجماعية",value:groups.collective},{label:"الخطط والأحداث",value:groups.plans},{label:"الشهادات",value:groups.certificates}].filter(x=>x.value));
    renderCampusStageTable(schoolRowsView);
    const lb=$("latestBody");lb.innerHTML="";latest.sort((a,b)=>b.date-a.date).slice(0,15).forEach(x=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${x.label}</td><td><b>${x.campus}</b></td><td>${x.stage}</td><td>${x.date.toLocaleDateString("ar-SA")}</td>`;lb.appendChild(tr)});if(!lb.children.length)lb.innerHTML='<tr><td colspan="4" class="empty">لا توجد نشاطات مؤرخة.</td></tr>';
    $("comparisonPanel").hidden=false;
  }
  function supervisionScopeLabel(c,allowed){
    if(FULL_STATS_ROLES.has(c.roleKey))return"جميع المجمعات والمراحل";
    return allowed.all?"جميع المجمعات والمراحل":"نطاق الإشراف";
  }
  async function boot(){
    document.body.classList.add("loading");try{await global.MishkatBubbleDirectory?.load?.()}catch(e){console.warn(e)}try{global.MishkatSchoolContext?.build?.()}catch(e){}const c=current();const scope=scopeFor(c);
    if(!canAccess(c,scope)){$("denied").hidden=false;$("deniedText").textContent=`المسمى الحالي: ${c.counselorRole||"غير محدد"}. ${scope==="supervision"?"الإحصائيات الشاملة متاحة للمشرف، المشرف العام، مشرف المجمع، مدير المجمعات ومدير النظام.":"إحصائيات المدرسة متاحة لمدير المدرسة والموجه الطلابي ضمن نطاق المدرسة."}`;document.body.classList.remove("loading");return}
    $("app").hidden=false;$("who").textContent=c.counselorName||"—";$("role").textContent=c.counselorRole||"—";$("currentYear").textContent=c.academicYear||"—";$("currentTerm").textContent=c.term||"—";
    const allowed=allowedSchoolSet(c,scope);
    if(scope==="school"){
      $("scopeKicker").textContent="إحصائيات نطاق الإسناد";
      $("pageTitle").textContent="إحصائيات التوجيه الطلابي";
      const campusLabel=c.campus||c.schoolName||"—",stageLabel=c.stage||"—";
      $("scopeName").textContent=c.roleKey==="counselor"?`${campusLabel} — ${stageLabel}`:campusLabel;
      $("pageSubtitle").textContent=c.roleKey==="school_manager"?"لوحة المدرسة فقط: الخطة والبرامج والجلسات والسجلات":"البيانات محسوبة حصريًا من المجمع والمرحلة المسندين للموجه في Bubble";
      if(c.roleKey==="counselor"){
        const a=counselorAssignmentScope(c);
        if((!a.schoolIds.size&&!a.schoolNames.size)||(!a.stageIds.size&&!a.stageNames.size)){
          $("warning").hidden=false;
          $("warning").textContent="إسناد الموجه غير مكتمل في Bubble (المجمع/المرحلة)، لذلك تم إيقاف عرض الإحصائيات خارج نطاق محدد.";
        }
      }
    }
    else{$("scopeKicker").textContent="المتابعة الإشرافية";$("pageTitle").textContent="الإحصائيات الإشرافية للتوجيه الطلابي";$("scopeName").textContent=supervisionScopeLabel(c,allowed);$("pageSubtitle").textContent="إحصائيات شاملة لجميع المجمعات والمراحل مع فلاتر المقارنة والتفصيل";if(!allowed.all&&!allowed.ids.size&&!allowed.names.size){$("warning").hidden=false;$("warning").textContent="لا توجد مجمعات موزعة على هذا المستخدم؛ لن تُعرض بيانات خارج نطاقه."}}
    setupFilters(c,scope,allowed);let data=await loadAll();const rerender=()=>render(data,c,scope,allowed);$("yearFilter").onchange=rerender;$("termFilter").onchange=rerender;$("schoolFilter").onchange=rerender;$("printBtn").onclick=()=>print();$("refreshBtn").onclick=async()=>{document.body.classList.add("loading");data=await loadAll();rerender();document.body.classList.remove("loading")};rerender();document.body.classList.remove("loading");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
