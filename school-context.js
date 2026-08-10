"use strict";
/*
 * Mishkat School Platform - automatic Bubble school/user context V1.0.24
 * Uses the existing Bubble schema: Users Data / Students / academic year / School / Department.
 * No school settings are required. Never embed a Bubble admin token here.
 */
(function(global){
  const CONTEXT_KEY="mishkat_school_user_context_v4";
  const LEGACY_KEYS=["mishkat_school_user_context_v3","mishkat_school_user_context_v2"];
  const DIRECTORY_KEY="mishkat_bubble_directory_snapshot_v1";
  const schema=global.MISHKAT_BUBBLE_SCHEMA||{};
  const pick=(obj,keys,fallback="")=>{for(const key of keys){const v=obj?.[key];if(v!==undefined&&v!==null&&(!(typeof v==="string")||v.trim()!==""))return v;}return fallback;};
  const first=value=>Array.isArray(value)?(value[0]??""):value;
  const idOf=value=>{value=first(value);if(value==null)return "";if(typeof value==="string"||typeof value==="number")return String(value);return String(pick(value,["id","_id","unique_id","unique id","Unique ID"],""));};
  const text=value=>{value=first(value);if(value==null)return "";if(typeof value==="string"||typeof value==="number")return String(value);return String(pick(value,["Full Name","full_name","Dep. Name","School Name","school name","SchoolName","schoolName","School_Name","school_name","مجمع","المجمع","اسم المجمع","name","Name","title","Title","label","display","اسم","الاسم","اسم المدرسة"],""));};
  const json=(value,fallback=null)=>{try{return JSON.parse(value)}catch(_e){return fallback}};
  const norm=v=>String(v??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/\s+/g," ").trim();
  const boolOf=v=>v===true||v===1||["true","yes","نعم","1"].includes(String(v).trim().toLowerCase());
  const same=(a,b)=>norm(a)&&norm(b)&&norm(a)===norm(b);
  function listFrom(src,keys){let empty=[];for(const key of keys){if(Array.isArray(src?.[key])){if(src[key].length)return src[key];empty=src[key];}}return empty;}
  function makeIndex(rows){const m=new Map();(rows||[]).forEach(row=>{const id=idOf(row);if(id)m.set(id,row);});return m;}
  function createLookup(src){return {
    schools:makeIndex(listFrom(src,["schools","Schools","School"])),
    departments:makeIndex(listFrom(src,["departments","Departments","Department"])),
    grades:makeIndex(listFrom(src,["grades","Grades"])),
    jobTitles:makeIndex(listFrom(src,["jobTitles","job_titles","Job Titles","Job Title"])),
    usersData:listFrom(src,["usersData","users_data","Users Data","employees","staff","schoolEmployees","school_employees"])
  };}
  function resolveRef(value,map){value=first(value);if(value==null)return value;if(typeof value==="object")return value;return map?.get?.(String(value))||value;}
  function schoolTypeOf(...values){
    const s=norm(values.flat(Infinity).map(v=>text(v)||String(v??"")).join(" "));
    if(/بنات|طالبات|girls?|female|اناث|نسائي/.test(s))return "girls";
    if(/بنين|طلاب|boys?|male|ذكور/.test(s))return "boys";
    return "boys";
  }
  function roleValue(raw,lookup){
    const value=first(pick(raw,["Current Job","current_job","Job Title","job_title","role","position","title","المسمى الوظيفي","الصفة"],""));
    return resolveRef(value,lookup.jobTitles);
  }
  function schoolValue(raw,assignment,lookup){
    const value=first(pick(assignment,["school","School","المدرسة"],pick(raw,["activity schools","activity_schools","Schools","schools","School","school","المدرسة"],"")));
    return resolveRef(value,lookup.schools);
  }
  function stageValue(raw,assignment,lookup){
    const value=first(pick(assignment,["stage","school_stage","Stage","Department","Dep","المرحلة"],pick(raw,["Dep","dep","Department","department","Dep list","dep_list","المرحلة"],"")));
    return resolveRef(value,lookup.departments);
  }
  function flattenUser(raw,lookup){
    raw=raw||{};
    const assignment=raw.assignment||raw.distribution||raw.school_assignment||raw.user_assignment||raw.التوزيع||{};
    const school=schoolValue(raw,assignment,lookup);
    const stage=stageValue(raw,assignment,lookup);
    // In the existing Bubble schema, the School relation itself is the campus/complex (المجمع).
    const campusRaw=school;
    const directType=pick(assignment,["school_type","schoolType","school_gender","audience_type","نوع المدرسة","نوع_المدرسة","النوع"],pick(school||{},["school_type","schoolType","type","gender","audience_type","school_gender","نوع المدرسة","نوع_المدرسة","النوع"],""));
    const girlsFlag=pick(assignment,["is_girls_school","girls_school","isGirlsSchool","مدرسة بنات"],pick(school||{},["is_girls_school","girls_school","isGirlsSchool","مدرسة بنات"],null));
    // Employee Gender is intentionally NOT used to decide boys/girls. School data is the source of truth.
    const schoolType=girlsFlag===true?"girls":girlsFlag===false?"boys":schoolTypeOf(directType,school,text(school));
    const firstName=String(pick(raw,["First Name","first_name"],""));
    const secondName=String(pick(raw,["Second Name","second_name"],""));
    const thirdName=String(pick(raw,["Third Name","third_name"],""));
    const familyName=String(pick(raw,["Family Name","family_name"],""));
    const assembled=[firstName,secondName,thirdName,familyName].filter(Boolean).join(" ");
    const counselorName=String(pick(raw,["Full Name","full_name","name","user_name","employee_name","Name","اسم المستخدم","اسم الموظف","الاسم"],assembled));
    const counselorRole=text(roleValue(raw,lookup));
    const manager=pick(assignment,["schoolManager","school_manager","school_manager_name","principal","principal_name","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],pick(school||{},["schoolManager","school_manager","school_manager_name","principal","principal_name","school_principal","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],null));
    return {
      id:idOf(raw),employeeCode:String(pick(raw,["Employee Code","employee_code"],"")),counselorName,counselorRole,
      schoolName:text(school)||String(pick(raw,["school_name","School Name","اسم المدرسة"],"")),schoolId:idOf(school),schoolRaw:school,
      campus:text(school),campusId:idOf(school),stage:text(stage),stageId:idOf(stage),
      schoolType,manager,assignment,raw
    };
  }
  function normalizeEmployee(raw,i,lookup){
    const assignment=raw?.assignment||raw?.distribution||raw?.school_assignment||{};
    const school=schoolValue(raw,assignment,lookup);const stage=stageValue(raw,assignment,lookup);const role=roleValue(raw,lookup);
    return {
      id:idOf(raw)||`employee-${i+1}`,
      name:String(pick(raw,["Full Name","full_name","name","employee_name","Name","اسم الموظف","الاسم"],"")),
      role:text(role),employeeCode:String(pick(raw,["Employee Code","employee_code"],"")),
      schoolName:text(school),schoolId:idOf(school),campus:text(school),campusId:idOf(school),
      stage:text(stage),stageId:idOf(stage),active:(raw?.Active===undefined&&raw?.active===undefined&&raw?.is_active===undefined)?true:boolOf(pick(raw,["Active","active","is_active"],true)),
      userId:idOf(pick(raw,["User","user"],"")),raw
    };
  }
  const currentOf=(list=[])=>list.find(x=>boolOf(pick(x,["Active","isCurrent","is_current","current","default"],false)))||list[0]||null;
  function currentAcademicYearOf(list=[]){
    const active=list.filter(x=>boolOf(pick(x,["Active","active","isCurrent","is_current","current","default"],false)));
    const pool=active.length?active:list;
    const dateScore=x=>{const v=pick(x,["start","Start","Created Date","CreatedDate"],"");const n=Date.parse(v);return Number.isFinite(n)?n:0};
    const titleScore=x=>{const m=String(pick(x,["title","Title","name","Name"],"")).match(/\d+/);return m?Number(m[0]):0};
    return [...pool].sort((a,b)=>(dateScore(b)-dateScore(a))||(titleScore(b)-titleScore(a)))[0]||null;
  }
  let state={loaded:false,context:{},employees:[]};
  function storageGet(key){try{return localStorage.getItem(key)}catch(_e){return null}}
  function storageSet(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_e){}}
  function source(){const direct=global.MISHKAT_BUBBLE_DATA||{};const local=json(storageGet(DIRECTORY_KEY),{})||{};return Object.keys(direct).length?direct:local;}
  function storedContext(){for(const key of [CONTEXT_KEY,...LEGACY_KEYS]){const v=json(storageGet(key),{})||{};if(Object.keys(v).length)return v;}return {};}
  function resolveUsersData(src,lookup,stored){
    const explicit=src.currentUsersData||src.current_users_data||src.currentEmployee||src.current_employee||null;
    if(explicit)return explicit;
    const rawCurrent=src.currentUser||src.current_user||src.userContext||src.user_context||src.loggedInUser||src.logged_in_user||src.employee||stored.currentUser||stored.user||{};
    if(rawCurrent && (rawCurrent["Full Name"]!==undefined||rawCurrent["Employee Code"]!==undefined||rawCurrent["Dep list"]!==undefined||rawCurrent["activity schools"]!==undefined))return rawCurrent;
    const currentId=idOf(rawCurrent)||String(src.currentUserId||src.current_user_id||"");
    if(currentId){const linked=lookup.usersData.find(row=>idOf(pick(row,["User","user"],""))===currentId);if(linked)return linked;}
    return rawCurrent||{};
  }
  function isManagerRole(role){return /مدير المدرسه|مديره المدرسه|مدير|مديره|principal|school manager|head ?teacher/.test(norm(role));}
  function roleKeyOf(role){
    const r=norm(role);
    if(/المشرف العام|مشرف عام|المشرفه العامه|مشرفه عامه|general supervisor/.test(r))return "general_supervisor";
    if(/مدير المجمعات|مديره المجمعات|director of complexes|complexes director/.test(r))return "complexes_director";
    if(/مشرف المجمع|مشرفه المجمع|مشرف مجمع|منسق المجمع|منسقه المجمع|campus supervisor|complex supervisor|campus coordinator|complex coordinator/.test(r))return "complex_supervisor";
    if(/مدير المدرسه|مديره المدرسه|school manager|principal|head ?teacher/.test(r))return "school_manager";
    if(/موجه.*طلابي|الموجه الطلابي|الموجهه الطلابيه|موجه طلابي|مرشد طلابي|guidance counselor|student counselor/.test(r))return "counselor";
    return "staff";
  }
  function relationArray(raw,keys,lookup){
    const value=pick(raw||{},keys,[]);
    const arr=Array.isArray(value)?value:(value?[value]:[]);
    return arr.map(v=>resolveRef(v,lookup)).filter(Boolean);
  }
  function autoManager(user,employees,src,lookup){
    const direct=user.manager||pick(user.schoolRaw||{},["schoolManager","school_manager","principal","manager","director","مدير المدرسة","مديرة المدرسة"],null);
    if(direct){const d=resolveRef(direct,makeIndex(lookup.usersData));const directName=text(d);const directId=idOf(d);const listed=employees.find(e=>(directId&&e.id===directId)||(directName&&same(e.name,directName)));if(listed)return listed;if(directName)return{id:directId,name:directName,role:text(roleValue(d||{},lookup)),raw:d};}
    const candidates=employees.filter(e=>e.active&&isManagerRole(e.role));
    const ranked=candidates.map(e=>({e,score:(same(e.schoolName,user.schoolName)?16:0)+(same(e.campus,user.campus)?8:0)+(same(e.stage,user.stage)?4:0)+(!e.schoolName?1:0)})).sort((a,b)=>b.score-a.score);
    return ranked[0]?.e||null;
  }
  function build(){
    const src=source();const stored=storedContext();const lookup=createLookup(src);const rawUser=resolveUsersData(src,lookup,stored);const user=flattenUser(rawUser,lookup);
    const employees=lookup.usersData.map((x,i)=>normalizeEmployee(x,i,lookup)).filter(e=>e.name&&e.active);
    const years=listFrom(src,["academicYears","academic_years","academic year","years"]);const terms=listFrom(src,["terms","academicTerms","academic_terms","semesters"]);
    const year=currentAcademicYearOf(years),term=currentOf(terms);const manager=autoManager(user,employees,src,lookup);const schoolType=user.schoolType||"boys";
    const roleKey=roleKeyOf(user.counselorRole||"");
    // guidance_bootstrap already returns Current User's user data's Schools / Dep list / Grades.
    // It does not need to return the whole Users Data thing. If rawUser is unavailable,
    // the top-level scoped lists are authoritative and MUST drive both display and filtering.
    let assignedSchoolRows=relationArray(rawUser,["Schools","schools","School","school","activity schools","activity_schools"],lookup.schools);
    let assignedStageRows=relationArray(rawUser,["Dep list","dep_list","Dep","dep","Department","department"],lookup.departments);
    let assignedGradeRows=relationArray(rawUser,["Grades","grades","Grade","grade"],lookup.grades);
    const bootstrapSchoolRows=listFrom(src,["schools","Schools","School"]).map(v=>resolveRef(v,lookup.schools)).filter(Boolean);
    const bootstrapStageRows=listFrom(src,["departments","Departments","Department"]).map(v=>resolveRef(v,lookup.departments)).filter(Boolean);
    const bootstrapGradeRows=listFrom(src,["grades","Grades"]).map(v=>resolveRef(v,lookup.grades)).filter(Boolean);
    if(!assignedSchoolRows.length)assignedSchoolRows=bootstrapSchoolRows;
    if(!assignedStageRows.length)assignedStageRows=bootstrapStageRows;
    if(!assignedGradeRows.length)assignedGradeRows=bootstrapGradeRows;
    const assignedSchoolIds=[...new Set(assignedSchoolRows.map(idOf).filter(Boolean))];
    const assignedSchoolNames=[...new Set(assignedSchoolRows.map(text).filter(Boolean))];
    const assignedStageIds=[...new Set(assignedStageRows.map(idOf).filter(Boolean))];
    const assignedStageNames=[...new Set(assignedStageRows.map(text).filter(Boolean))];
    const assignedGradeIds=[...new Set(assignedGradeRows.map(idOf).filter(Boolean))];
    const assignedGradeNames=[...new Set(assignedGradeRows.map(text).filter(Boolean))];
    const primarySchool=user.schoolRaw||assignedSchoolRows[0]||null;
    const primaryStage=assignedStageRows.find(x=>user.stageId&&idOf(x)===String(user.stageId))||assignedStageRows[0]||null;
    const resolvedSchoolName=user.schoolName||text(primarySchool)||assignedSchoolNames[0]||stored.schoolName||"مدارس المشكاة الأهلية";
    const resolvedSchoolId=user.schoolId||idOf(primarySchool)||assignedSchoolIds[0]||stored.schoolId||"";
    const resolvedStage=user.stage||text(primaryStage)||assignedStageNames[0]||stored.stage||"";
    const resolvedStageId=user.stageId||idOf(primaryStage)||assignedStageIds[0]||stored.stageId||"";
    const canViewSchoolStats=["school_manager","counselor"].includes(roleKey);
    const canViewSupervisionStats=["general_supervisor","complexes_director","complex_supervisor"].includes(roleKey);
    const context={
      id:user.id||stored.id||"",employeeCode:user.employeeCode||stored.employeeCode||"",counselorName:user.counselorName||stored.counselorName||"",
      counselorRole:user.counselorRole||stored.counselorRole||(schoolType==="girls"?"الموجهة الطلابية":"الموجه الطلابي"),
      schoolName:resolvedSchoolName,schoolId:resolvedSchoolId,
      // In this Bubble deployment School == المجمع. Never derive campus from a separate field.
      campus:resolvedSchoolName,campusId:resolvedSchoolId,stage:resolvedStage,stageId:resolvedStageId,
      academicYear:text(year)||stored.academicYear||"",academicYearId:idOf(year)||stored.academicYearId||"",term:text(term)||stored.term||"",termId:idOf(term)||stored.termId||"",
      managerId:manager?.id||"",managerName:manager?.name||"",managerRole:manager?.role||(schoolType==="girls"?"مديرة المدرسة":"مدير المدرسة"),
      schoolType,audienceType:schoolType,schoolTypeLabel:schoolType==="girls"?"بنات":"بنين",studentsLabel:schoolType==="girls"?"الطالبات":"الطلاب",studentLabel:schoolType==="girls"?"الطالبة":"الطالب",
      counselorTitle:/موجه/.test(user.counselorRole||"")?user.counselorRole:(schoolType==="girls"?"الموجهة الطلابية":"الموجه الطلابي"),
      managerTitle:/مدير|مديره/.test(norm(manager?.role||""))?(manager?.role||""):(schoolType==="girls"?"مديرة المدرسة":"مدير المدرسة"),
      roleKey,canViewSchoolStats,canViewSupervisionStats,
      assignedSchoolIds,assignedSchoolNames,assignedStageIds,assignedStageNames,assignedGradeIds,assignedGradeNames,
      supervisionScope:roleKey==="general_supervisor"||roleKey==="complexes_director"?"all":"assigned"
    };
    state={loaded:true,employees,context};storageSet(CONTEXT_KEY,{...context,currentUser:rawUser});return state;
  }
  function getContext(){if(!state.loaded)build();return {...state.context};}
  function getEmployees(){
    if(!state.loaded)build();const c=state.context;
    const schoolIds=new Set(c.assignedSchoolIds||[]),schoolNames=new Set((c.assignedSchoolNames||[]).map(norm));
    if(!schoolIds.size&&!schoolNames.size)return state.employees;
    return state.employees.filter(e=>!e.schoolId&&!e.schoolName||schoolIds.has(String(e.schoolId||""))||schoolNames.has(norm(e.schoolName)));
  }
  function getStudents(){
    const src=source();const rows=listFrom(src,["students","Students","schoolStudents","school_students"]);
    const c=getContext(),lookup=createLookup(src);
    const schoolIds=new Set((c.assignedSchoolIds||[]).map(String)),schoolNames=new Set((c.assignedSchoolNames||[]).map(norm));
    const stageIds=new Set((c.assignedStageIds||[]).map(String)),stageNames=new Set((c.assignedStageNames||[]).map(norm));
    const gradeIds=new Set((c.assignedGradeIds||[]).map(String)),gradeNames=new Set((c.assignedGradeNames||[]).map(norm));
    const matches=(value,ids,names,map)=>{
      if(!ids.size&&!names.size)return true;
      const resolved=resolveRef(value,map),rid=idOf(resolved),rname=norm(text(resolved));
      if(rid&&ids.has(String(rid)))return true;
      if(rname&&names.has(rname))return true;
      return false; // fail closed: never leak a student whose School/Dep/Grade cannot be verified.
    };
    return rows.filter(s=>
      matches(pick(s,["School","school"],""),schoolIds,schoolNames,lookup.schools)&&
      matches(pick(s,["Dep","Department","department"],""),stageIds,stageNames,lookup.departments)&&
      matches(pick(s,["grade","Grade","Grades"],""),gradeIds,gradeNames,lookup.grades)
    );
  }
  async function setManager(){console.info("Mishkat: school manager is automatic from Users Data/School; manual changes are disabled.");return getContext();}
  function optionMatch(select,label){if(!select||!label)return "";const n=norm(label);const aliases={"المرحله المتوسطه":["المتوسطه","middle"],"المتوسطه":["المرحله المتوسطه","middle"],"المرحله الثانويه":["الثانويه","secondary"],"الثانويه":["المرحله الثانويه","secondary"],"الابتدائيه":["primary","المرحله الابتدائيه","upper_primary","lower_primary"]};const choices=[n,...(aliases[n]||[])];const o=[...select.options].find(x=>choices.some(c=>norm(x.textContent)===norm(c)||norm(x.value)===norm(c)||norm(x.textContent).includes(norm(c))));return o?.value||"";}
  function setControl(el,value,{lock=true}={}){if(!el||value===undefined||value===null||String(value)==="")return;if(el.tagName==="SELECT"){let v=optionMatch(el,value)||String(value);if(![...el.options].some(o=>o.value===v)){const o=document.createElement("option");o.value=String(value);o.textContent=String(value);el.appendChild(o);v=String(value);}if(el.value!==v)el.value=v;if(lock)el.disabled=true;}else if("value" in el){if(el.value!==String(value))el.value=String(value);if(lock){el.readOnly=true;el.setAttribute("aria-readonly","true");}}el.dataset.autoContext="true";el.title="يتم تعبئته تلقائيًا من توزيع المستخدم في Bubble";}
  function setText(id,value){const el=document.getElementById(id);if(el&&value&&el.textContent!==value)el.textContent=value;}
  const originals=new WeakMap();
  function genderizeString(value,c){if(c.schoolType!=="girls")return value;return String(value).replace(/الموجه الطلابي/g,c.counselorTitle||"الموجهة الطلابية").replace(/مدير المدرسة/g,c.managerTitle||"مديرة المدرسة").replace(/مدرسة بنين/g,"مدرسة بنات").replace(/صياغات الطلاب/g,"صياغات الطالبات").replace(/شهادات الطلاب/g,"شهادات الطالبات").replace(/تقارير الطلاب/g,"تقارير الطالبات").replace(/نوع الطلاب/g,"نوع الطالبات").replace(/الطلاب/g,"الطالبات").replace(/طلاب/g,"طالبات").replace(/اسم الطالب(?!ة)/g,"اسم الطالبة").replace(/بيانات الطالب(?!ة)/g,"بيانات الطالبة").replace(/ولي أمر الطالب(?!ة)/g,"ولي أمر الطالبة").replace(/ابنكم/g,"ابنتكم").replace(/الطالب(?!ات|ة)/g,"الطالبة");}
  function applyGenderLanguage(root,c){if(!root?.querySelectorAll)return;document.documentElement.dataset.schoolType=c.schoolType;document.body?.setAttribute("data-school-type",c.schoolType);const nodes=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||["SCRIPT","STYLE","TEXTAREA","OPTION"].includes(p.tagName))return NodeFilter.FILTER_REJECT;return node.nodeValue?.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{if(!originals.has(node))originals.set(node,node.nodeValue);const next=genderizeString(originals.get(node),c);if(node.nodeValue!==next)node.nodeValue=next;});root.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el=>{if(!el.dataset.originalPlaceholder)el.dataset.originalPlaceholder=el.getAttribute("placeholder")||"";el.setAttribute("placeholder",genderizeString(el.dataset.originalPlaceholder,c));});}
  function applyDocument(root=document){const c=getContext();const ids={counselorName:["counselorName","counselorInput","profileFullName"],schoolName:["schoolName","schoolInput","schoolProfileName"],managerName:["directorInput","principalName","supervisorInput","profileManagerName"],stage:["schoolStage","stageSelect","stageFilter","metaStage","profileStageName"],campus:["metaCampus","campusInput","complexInput","profileCampusName"],schoolTypeLabel:["profileSchoolType"],academicYear:["yearInput","metaAcademicYear"],term:["termSelect","metaAcademicTerm"]};Object.entries(ids).forEach(([key,list])=>list.forEach(id=>setControl(document.getElementById(id),c[key]||"")));root.querySelectorAll?.('[data-field="counselor_name"],[data-field="counselor5"]').forEach(el=>setControl(el,c.counselorName));root.querySelectorAll?.('[data-field="principal_name"]').forEach(el=>setControl(el,c.managerName));root.querySelectorAll?.('[data-field="stage"]').forEach(el=>setControl(el,c.stage));root.querySelectorAll?.('[data-field="campus"],[data-field="complex"]').forEach(el=>setControl(el,c.campus));setText("headerUserName",c.counselorName);setText("userName",c.counselorName);setText("recordCounselorName",c.counselorName);setText("headerSchoolName",c.schoolName);setText("recordSchoolName",c.schoolName);setText("profileAssignedCampus",c.campus||"—");setText("profileAssignedStage",c.stage||"—");setText("profileAssignedUser",c.counselorName||"—");setText("profileAssignedSchool",c.schoolName||"—");setText("profileAssignedSchoolType",c.schoolTypeLabel);setText("profileAssignedManager",c.managerName||"—");root.querySelectorAll?.('[data-school-context-display]').forEach(el=>{const key=el.dataset.schoolContextDisplay;const value=c[key]||"—";if(el.textContent!==value)el.textContent=value;});const audience=document.getElementById("audienceBadge");if(audience&&/^(—|صياغات|شهادات|تقارير)/.test(audience.textContent.trim()))audience.textContent=c.schoolTypeLabel;const executor=document.getElementById("executorInput");if(executor&&c.schoolType==="girls"&&/الموجه الطلابي/.test(executor.value||""))executor.value=(executor.value||"").replace(/الموجه الطلابي/g,c.counselorTitle||"الموجهة الطلابية").replace(/العاملين/g,"العاملات");const planTitle=document.getElementById("planTitle");if(planTitle&&c.schoolType==="girls"&&/للموجه الطلابي/.test(planTitle.value||""))planTitle.value=(planTitle.value||"").replace(/للموجه الطلابي/g,"للموجهة الطلابية");applyGenderLanguage(root,c);}
  async function refreshFromEndpoint(){const cfg=global.MISHKAT_BUBBLE_CONFIG||{};if(!cfg.directoryEndpoint||global.MISHKAT_BUBBLE_DATA)return;try{const response=await fetch(cfg.directoryEndpoint,{credentials:cfg.credentials||"include",headers:{"Accept":"application/json",...(cfg.headers||{})},cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);const payload=await response.json();global.MISHKAT_BUBBLE_DATA=typeof cfg.normalizeDirectoryPayload==="function"?cfg.normalizeDirectoryPayload(payload):(payload?.response||payload?.data||payload);state.loaded=false;build();applyDocument(document);global.dispatchEvent(new CustomEvent("mishkat:school-context-changed",{detail:getContext()}));}catch(error){console.warn("School context endpoint unavailable; using current/local data.",error);}}
  function boot(){build();applyDocument(document);refreshFromEndpoint();let scheduled=false;const scheduleApply=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;applyDocument(document)},0);};const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes&&m.addedNodes.length))scheduleApply();});observer.observe(document.documentElement,{childList:true,subtree:true});let rounds=0;const timer=setInterval(()=>{applyDocument(document);if(++rounds>=4)clearInterval(timer)},400);global.addEventListener("focus",scheduleApply);global.dispatchEvent(new CustomEvent("mishkat:school-context-ready",{detail:getContext()}));}
  global.MishkatSchoolContext={build,getContext,getEmployees,getStudents,setManager,applyDocument,schoolTypeOf,roleKeyOf,schema};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
