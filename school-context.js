"use strict";
/*
 * Mishkat School Platform - automatic Bubble school/user context V1.0.54
 * Uses the existing Bubble schema: Users Data / Students / academic year / School / Department.
 * No school settings are required. Never embed a Bubble admin token here.
 */
(function(global){
  const CONTEXT_KEY="mishkat_school_user_context_v4";
  const LEGACY_KEYS=["mishkat_school_user_context_v3","mishkat_school_user_context_v2"];
  const DIRECTORY_KEY="mishkat_bubble_directory_snapshot_v1";
  const MANAGER_CACHE_KEY="mishkat_school_manager_direct_v3";
  const MANAGER_PERSISTENT_CACHE_KEY="mishkat_school_manager_persistent_v1";
  const MANAGER_PERSISTENT_TTL=6*60*60*1000;
  const schema=global.MISHKAT_BUBBLE_SCHEMA||{};
  const pick=(obj,keys,fallback="")=>{for(const key of keys){const v=obj?.[key];if(v===undefined||v===null)continue;if(typeof v==="string"&&!v.trim())continue;if(Array.isArray(v)&&!v.length)continue;return v;}return fallback;};
  const first=value=>Array.isArray(value)?(value[0]??""):value;
  const idOf=value=>{value=first(value);if(value==null)return "";if(typeof value==="string"||typeof value==="number")return String(value);return String(pick(value,["id","_id","unique_id","unique id","Unique ID"],""));};
  const keyNorm=value=>String(value??"").toLowerCase().replace(/[\s_.-]+/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه");
  const looksLikeBubbleId=value=>/^\d{10,}x\d+$/i.test(String(value||""))||/^\d{13,}$/.test(String(value||""));
  function text(value){
    value=first(value);
    if(value==null)return "";
    if(typeof value==="string"||typeof value==="number"){
      const t=String(value).trim();
      return looksLikeBubbleId(t)?"":t;
    }
    if(typeof value!=="object")return "";
    const preferred=[
      "Full Name","full_name","Dep. Name","Department Name","department name",
      "School Name","school name","SchoolName","schoolName","School_Name","school_name",
      "Complex Name","complex name","Campus Name","campus name","اسم المجمع","المجمع","مجمع",
      "Arabic Name","arabic name","Name","name","Title","title","Job Titel","job titel","JobTitel","job_titel","label","Label","display","Display",
      "اسم","الاسم","اسم المدرسة","School","school"
    ];
    for(const key of preferred){
      const raw=value?.[key];
      if(raw===undefined||raw===null||raw==="")continue;
      const t=(typeof raw==="object")?text(raw):String(raw).trim();
      if(t&&!looksLikeBubbleId(t))return t;
    }
    let best="",score=-1;
    const blocked=/^(id|_id|uniqueid|createddate|modifieddate|createdby|slug|createdat|updatedat)$/;
    for(const [key,raw] of Object.entries(value)){
      const nk=keyNorm(key);
      if(blocked.test(nk))continue;
      if(typeof raw!=="string"&&typeof raw!=="number")continue;
      const t=String(raw).trim();
      if(!t||looksLikeBubbleId(t)||/^https?:\/\//i.test(t))continue;
      let s=1;
      if(nk.includes("school")&&nk.includes("name"))s=100;
      else if(nk.includes("مجمع")||nk.includes("campus")||nk.includes("complex"))s=95;
      else if(nk.includes("name")||nk.includes("اسم"))s=90;
      else if(nk.includes("title")||nk.includes("titel")||nk.includes("label")||nk.includes("display"))s=80;
      else if(nk==="school")s=70;
      if(s>score){best=t;score=s;}
    }
    return best;
  }
  function semanticField(obj,matcher){
    if(!obj||typeof obj!=="object")return "";
    for(const [key,value] of Object.entries(obj)){
      if(matcher.test(keyNorm(key))&&value!==undefined&&value!==null&&value!=="")return value;
    }
    return "";
  }
  const json=(value,fallback=null)=>{try{return JSON.parse(value)}catch(_e){return fallback}};
  const norm=v=>String(v??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/\s+/g," ").trim();
  const boolOf=v=>v===true||v===1||["true","yes","نعم","1"].includes(String(v).trim().toLowerCase());
  const same=(a,b)=>norm(a)&&norm(b)&&norm(a)===norm(b);
  function listFrom(src,keys){let empty=[];for(const key of keys){if(Array.isArray(src?.[key])){if(src[key].length)return src[key];empty=src[key];}}return empty;}
  function makeIndex(rows){const m=new Map();(rows||[]).forEach(row=>{const id=idOf(row);if(id)m.set(id,row);});return m;}
  function createLookup(src){return {
    schools:makeIndex(listFrom(src,["schools","school","Schools","School"])),
    departments:makeIndex(listFrom(src,["departments","Departments","Department"])),
    grades:makeIndex(listFrom(src,["grades","Grade","Grades"])),
    jobTitles:makeIndex(listFrom(src,["jobTitles","job_titels","job_titles","Job Titels","Job Titles","Job Titel","Job Title"])),
    usersData:listFrom(src,["usersData","users_data","Users Data","employees","staff","schoolEmployees","school_employees"])
  };}
  function resolveRef(value,map){
    value=first(value);
    if(value==null)return value;
    // Bubble may return a relation as a partially populated object containing only its ID.
    // Hydrate that object from the corresponding lookup table so fields such as
    // Current Job -> Job Titel and Schools -> School Name remain available.
    if(typeof value==="object"){
      const rid=idOf(value);
      const full=rid?map?.get?.(String(rid)):null;
      return full?{...full,...value}:value;
    }
    return map?.get?.(String(value))||value;
  }
  function schoolTypeOf(...values){
    const s=norm(values.flat(Infinity).map(v=>text(v)||String(v??"")).join(" "));
    if(/بنات|طالبات|girls?|female|اناث|نسائي/.test(s))return "girls";
    if(/بنين|طلاب|boys?|male|ذكور/.test(s))return "boys";
    return "boys";
  }
  function roleValue(raw,lookup){
    const keys=["Current Job","current_job","Current Job Name","current_job_name","Job Title Name","job_title_name","Job Title","job_title","Job Titel","job_titel","job_titels","role","position","title","المسمى الوظيفي","الصفة"];
    // Do not stop at an unresolved Bubble relation ID. Try every available role alias
    // until a human-readable title can be obtained.
    for(const key of keys){
      let value=raw?.[key];
      if(value===undefined||value===null||(typeof value==="string"&&!value.trim())||(Array.isArray(value)&&!value.length))continue;
      value=first(value);
      const resolved=resolveRef(value,lookup.jobTitles);
      if(text(resolved))return resolved;
    }
    return "";
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
    const directType=pick(assignment,["school_type","schoolType","school_gender","audience_type","نوع المدرسة","نوع_المدرسة","النوع"],pick(school||{},["school_type","schoolType","type","gender","audience_type","school_gender","نوع المدرسة","نوع_المدرسة","النوع"],semanticField(school,/schooltype|gender|audience|نوع|جنس/)));
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
    const manager=pick(assignment,["schoolManager","school_manager","school_manager_name","School Manager","School Manager Name","principal","principal_name","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],pick(raw,["schoolManager","school_manager","school_manager_name","School Manager","School Manager Name","principal","principal_name","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],pick(school||{},["schoolManager","school_manager","school_manager_name","School Manager","School Manager Name","principal","principal_name","school_principal","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],semanticField(school,/manager|principal|director|مدير/))));
    return {
      id:idOf(raw),employeeCode:String(pick(raw,["Employee Code","employee_code"],"")),counselorName,counselorRole,
      schoolName:text(school)||String(pick(raw,["school_name","School Name","اسم المدرسة"],"")),schoolId:idOf(school),schoolRaw:school,
      campus:text(school),campusId:idOf(school),stage:text(stage),stageId:idOf(stage),
      schoolType,manager,assignment,raw
    };
  }
  function normalizeEmployee(raw,i,lookup){
    const assignment=raw?.assignment||raw?.distribution||raw?.school_assignment||{};
    const toArray=value=>Array.isArray(value)?value:(value!==undefined&&value!==null&&value!==""?[value]:[]);
    const collect=(obj,keys)=>keys.flatMap(key=>toArray(obj?.[key])).filter(v=>v!==undefined&&v!==null&&v!=="");
    // Users Data contains both `activity schools` and `Schools` in this deployment.
    // Merge all populated relation aliases instead of taking the first key, because
    // Bubble can return an empty `activity schools` list while `Schools` contains the real assignment.
    const rawSchools=[...collect(assignment,["schools","Schools","school","School"]),...collect(raw,["activity schools","activity_schools","Schools","schools","School","school","School Name","school_name","المدرسة"])];
    const rawStages=[...collect(assignment,["stages","stage","school_stage","Stage","Department","Dep","Dep list","المرحلة"]),...collect(raw,["Dep","Dep list","dep","departments","Department","department","stage","Stage","Department Name","department_name","المرحلة"])];
    const schools=rawSchools.map(v=>resolveRef(v,lookup.schools)).filter(Boolean);
    const stages=rawStages.map(v=>resolveRef(v,lookup.departments)).filter(Boolean);
    const school=schools[0]||schoolValue(raw,assignment,lookup);
    const stage=stages[0]||stageValue(raw,assignment,lookup);
    const role=roleValue(raw,lookup);
    const schoolIds=[...new Set(schools.map(idOf).filter(Boolean))];
    const schoolNames=[...new Set(schools.map(text).filter(Boolean))];
    const stageIds=[...new Set(stages.map(idOf).filter(Boolean))];
    const stageNames=[...new Set(stages.map(text).filter(Boolean))];
    return {
      id:idOf(raw)||`employee-${i+1}`,
      name:String(pick(raw,["Full Name","full_name","name","employee_name","Name","اسم الموظف","الاسم"],"")),
      role:text(role),employeeCode:String(pick(raw,["Employee Code","employee_code"],"")),
      schoolName:text(school),schoolId:idOf(school),schoolNames,schoolIds,campus:text(school),campusId:idOf(school),
      stage:text(stage),stageId:idOf(stage),stageNames,stageIds,active:(raw?.Active===undefined&&raw?.active===undefined&&raw?.is_active===undefined)?true:boolOf(pick(raw,["Active","active","is_active"],true)),
      userId:idOf(pick(raw,["User","user"],"")),raw
    };
  }
  function termLabel(value){return (typeof value==="object"?text(value):String(value??"")).trim();}
  function termOrder(value){
    const s=norm(termLabel(value));
    if(/الفصل\s*(الدراسي\s*)?(الاول|1)|الترم\s*(الاول|1)|semester\s*1|term\s*1|first\s*(semester|term)/.test(s))return 1;
    if(/الفصل\s*(الدراسي\s*)?(الثاني|2)|الترم\s*(الثاني|2)|semester\s*2|term\s*2|second\s*(semester|term)/.test(s))return 2;
    if(/الفصل\s*(الدراسي\s*)?(الثالث|3)|الترم\s*(الثالث|3)|semester\s*3|term\s*3|third\s*(semester|term)/.test(s))return 3;
    return 99;
  }
  function currentTermOf(list=[]){
    const explicit=list.find(x=>x&&typeof x==="object"&&boolOf(pick(x,["isCurrent","is_current","current","Current","active_current","default","Default"],false)));
    if(explicit)return explicit;
    const now=Date.now();
    const dated=list.find(x=>{
      if(!x||typeof x!=="object")return false;
      const start=Date.parse(pick(x,["start","Start","start_date","Start Date","from","From"],""));
      const end=Date.parse(pick(x,["end","End","end_date","End Date","to","To"],""));
      return Number.isFinite(start)&&Number.isFinite(end)&&now>=start&&now<=end;
    });
    if(dated)return dated;
    return [...list].sort((a,b)=>termOrder(a)-termOrder(b))[0]||null;
  }
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
  function managerRoleScore(role){
    const r=norm(role);
    if(!r)return 0;
    // لا نعتبر إدارة المجمعات/المجمع مديرًا للمدرسة حتى لا يظهر اسم خاطئ في بيانات التوزيع.
    if(/مدير(?:ه)? المجمعات|مدير(?:ه)? المجمع|complexes? director|campus director|complex manager/.test(r))return 0;
    if(/مدير(?:ه)? (?:ال)?مدرسه|school manager|school principal|principal|head ?teacher/.test(r))return 120;
    if(/مدير|مديره|manager|director/.test(r))return 10;
    return 0;
  }
  function isManagerRole(role){return managerRoleScore(role)>0;}
  function roleKeyOf(role){
    const r=norm(role);
    if(/مدير النظام|مديره النظام|مسؤول النظام|مسؤوله النظام|system admin|system administrator|administrator/.test(r))return "system_admin";
    if(/المشرف العام|مشرف عام|المشرفه العامه|مشرفه عامه|general supervisor/.test(r))return "general_supervisor";
    if(/مدير المجمعات|مديره المجمعات|director of complexes|complexes director/.test(r))return "complexes_director";
    if(/مشرف المجمع|مشرفه المجمع|مشرف مجمع|منسق المجمع|منسقه المجمع|campus supervisor|complex supervisor|campus coordinator|complex coordinator/.test(r))return "complex_supervisor";
    if(/مشرف.*التوجيه.*الطلابي|مشرفه.*التوجيه.*الطلابي|guidance supervisor|student guidance supervisor/.test(r))return "guidance_supervisor";
    if(/منسق.*التوجيه.*الطلابي|منسقه.*التوجيه.*الطلابي|guidance coordinator|student guidance coordinator/.test(r))return "guidance_coordinator";
    if(/مدير(?:ه)? (?:ال)?مدرسه|school manager|school principal|principal|head ?teacher/.test(r))return "school_manager";
    if(/موجه.*طلابي|الموجه الطلابي|الموجهه الطلابيه|موجه طلابي|مرشد طلابي|guidance counselor|student counselor/.test(r))return "counselor";
    return "staff";
  }
  function relationArray(raw,keys,lookup){
    const values=[];
    for(const key of keys){
      const value=raw?.[key];
      if(value===undefined||value===null||value==="")continue;
      const arr=Array.isArray(value)?value:[value];
      values.push(...arr);
    }
    return values.map(v=>resolveRef(v,lookup)).filter(Boolean);
  }
  function managerScopeSignature(ids=[],names=[]){
    const a=[...new Set((ids||[]).map(String).filter(Boolean))].sort();
    const b=[...new Set((names||[]).map(norm).filter(Boolean))].sort();
    return JSON.stringify({ids:a,names:b});
  }
  function sessionJsonGet(key){try{return json(sessionStorage.getItem(key),null)}catch(_e){return null}}
  function sessionJsonSet(key,value){try{sessionStorage.setItem(key,JSON.stringify(value))}catch(_e){}}
  function cachedManager(ids=[],names=[]){
    const scope=managerScopeSignature(ids,names);
    const fromSession=sessionJsonGet(MANAGER_CACHE_KEY);
    if(fromSession?.name&&fromSession.scope===scope){
      return {id:String(fromSession.id||""),name:String(fromSession.name||""),role:String(fromSession.role||"مدير المدرسة"),raw:fromSession.raw||{},cacheSource:"session"};
    }
    // Persistent stale-while-revalidate cache: makes the manager visible immediately
    // on a new page/tab while Bubble is refreshed in the background.
    const fromLocal=json(storageGet(MANAGER_PERSISTENT_CACHE_KEY),null);
    const age=Date.now()-Number(fromLocal?.savedAt||0);
    if(fromLocal?.name&&fromLocal.scope===scope&&age>=0&&age<MANAGER_PERSISTENT_TTL){
      sessionJsonSet(MANAGER_CACHE_KEY,fromLocal);
      return {id:String(fromLocal.id||""),name:String(fromLocal.name||""),role:String(fromLocal.role||"مدير المدرسة"),raw:fromLocal.raw||{},cacheSource:"local"};
    }
    return null;
  }
  function publishResolvedManager(manager,scopeIds=[],scopeNames=[]){
    if(!manager?.name)return null;
    const entry={scope:managerScopeSignature(scopeIds,scopeNames),id:manager.id||"",name:manager.name,role:manager.role||"مدير المدرسة",raw:manager.raw||{},savedAt:Date.now()};
    sessionJsonSet(MANAGER_CACHE_KEY,entry);
    storageSet(MANAGER_PERSISTENT_CACHE_KEY,entry);
    if(state?.context){
      state.context.managerId=manager.id||"";
      state.context.managerName=manager.name||"";
      state.context.managerRole=manager.role||"مدير المدرسة";
      state.context.managerTitle=/مدير|مديره/.test(norm(manager.role||""))?(manager.role||""):(state.context.schoolType==="girls"?"مديرة المدرسة":"مدير المدرسة");
      storageSet(CONTEXT_KEY,{...state.context});
      try{applyDocument(document)}catch(_e){}
      try{global.dispatchEvent(new CustomEvent("mishkat:school-context-changed",{detail:getContext()}))}catch(_e){}
    }
    return manager;
  }
  function exactSchoolManagerTitle(value){return roleKeyOf(text(value)||value)==="school_manager";}
  function relationIds(raw,keys){
    const out=[];
    for(const key of keys){
      const value=raw?.[key];
      const arr=Array.isArray(value)?value:(value!==undefined&&value!==null&&value!==""?[value]:[]);
      for(const item of arr){const id=idOf(item);if(id)out.push(String(id));}
    }
    return [...new Set(out)];
  }
  function relationNames(raw,keys,lookup){
    const out=[];
    for(const key of keys){
      const value=raw?.[key];
      const arr=Array.isArray(value)?value:(value!==undefined&&value!==null&&value!==""?[value]:[]);
      for(const item of arr){const resolved=resolveRef(item,lookup);const name=text(resolved);if(name)out.push(name);}
    }
    return [...new Set(out)];
  }
  function managerMatchesScope(raw,scopeIds,scopeNames,lookup){
    const keys=["activity schools","activity_schools","Schools","schools","School","school","المدرسة"];
    const ids=relationIds(raw,keys);
    const names=relationNames(raw,keys,lookup.schools);
    return (scopeIds||[]).some(id=>ids.includes(String(id)))||(scopeNames||[]).some(n=>names.some(name=>same(n,name)));
  }
  async function directDataApiList(type,constraints=[]){
    const cfg=global.MISHKAT_BUBBLE_CONFIG||{};
    const base=String(cfg.dataApiBase||cfg.objectApiBase||"").replace(/\/$/,"");
    if(!base)throw new Error("bubble_data_api_missing");
    const apiType=cfg?.typeApiNames?.[type]||type;
    const params=new URLSearchParams();
    if(constraints.length)params.set("constraints",JSON.stringify(constraints));
    params.set("limit","100");params.set("cursor","0");
    const token=global.MishkatBubbleAuth?.getToken?.()||((typeof cfg.tokenProvider==="function")?await cfg.tokenProvider():"")||"";
    const response=await fetch(`${base}/${encodeURIComponent(String(apiType)).replace(/%2F/gi,"/")}?${params}`,{method:"GET",credentials:cfg.credentials||"omit",headers:{Accept:"application/json",...(cfg.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})},cache:"no-store"});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload?.message||payload?.error||`HTTP ${response.status}`);
    const body=payload?.response&&typeof payload.response==="object"?payload.response:payload;
    return Array.isArray(body?.results)?body.results:(Array.isArray(body)?body:[]);
  }
  let managerResolutionPromise=null;
  async function resolveManagerDirect({force=false}={}){
    const c=getContext();
    const scopeIds=(c.assignedSchoolIds||[]).map(String).filter(Boolean);
    const scopeNames=(c.assignedSchoolNames||[]).filter(Boolean);
    if(!scopeIds.length&&!scopeNames.length)return null;
    if(c.managerName&&!force)return {id:c.managerId||"",name:c.managerName,role:c.managerRole||"مدير المدرسة"};
    const cached=cachedManager(scopeIds,scopeNames);
    if(cached&&!force)return publishResolvedManager(cached,scopeIds,scopeNames);
    if(managerResolutionPromise&&!force)return managerResolutionPromise;
    managerResolutionPromise=(async()=>{
      const src=source();
      const lookup=createLookup(src);
      let titleRows=listFrom(src,["jobTitles","job_titels","job_titles","Job Titels","Job Titles","Job Titel","Job Title"]);
      let managerTitles=titleRows.filter(exactSchoolManagerTitle);
      if(!managerTitles.length){
        // Canonical endpoint first. Only use aliases as a fallback. This avoids
        // three serial network round-trips before the manager lookup can start.
        try{
          const rows=await directDataApiList("job_titels",[]);
          if(rows.length){titleRows=rows;managerTitles=rows.filter(exactSchoolManagerTitle);}
        }catch(_e){}
        if(!managerTitles.length){
          const attempts=await Promise.allSettled(["Job Titels","Job Title"].map(type=>directDataApiList(type,[])));
          for(const result of attempts){
            if(result.status!=="fulfilled"||!result.value?.length)continue;
            const found=result.value.filter(exactSchoolManagerTitle);
            if(found.length){titleRows=result.value;managerTitles=found;break;}
          }
        }
      }
      const jobIds=[...new Set(managerTitles.map(idOf).filter(Boolean))];
      if(!jobIds.length){console.warn("Mishkat manager resolver: school-manager Job Titel was not returned by Bubble.");return null;}
      const rows=[];const seen=new Set();
      const addRows=list=>{for(const row of list||[]){const id=idOf(row)||JSON.stringify(row);if(seen.has(id))continue;seen.add(id);rows.push(row);}};
      // Start every school-scoped candidate query together and continue as soon
      // as the first non-empty result arrives. Previously these were awaited serially.
      const scopedCalls=[];
      for(const jobId of jobIds){
        for(const schoolId of scopeIds){
          for(const schoolField of ["Schools","activity schools"]){
            scopedCalls.push((async()=>{
              const result=await directDataApiList("Users Data",[
                {key:"Current Job",constraint_type:"equals",value:jobId},
                {key:schoolField,constraint_type:"contains",value:schoolId}
              ]);
              if(!result?.length)throw new Error("empty_manager_scope");
              return result;
            })());
          }
        }
      }
      if(scopedCalls.length){
        try{addRows(await Promise.any(scopedCalls));}catch(_e){}
      }
      // Fallback: request managers by Current Job in parallel, then intersect locally.
      if(!rows.length){
        const fallback=await Promise.allSettled(jobIds.map(jobId=>directDataApiList("Users Data",[{key:"Current Job",constraint_type:"equals",value:jobId}])));
        fallback.forEach(result=>{if(result.status==="fulfilled")addRows(result.value)});
      }
      if(!rows.length){console.warn("Mishkat manager resolver: Bubble returned no Users Data rows for مدير المدرسة.");return null;}
      const fullLookup=createLookup({...src,jobTitles:titleRows,job_titels:titleRows});
      let candidates=rows.map((raw,i)=>normalizeEmployee(raw,i,fullLookup)).filter(e=>e.name&&e.active&&exactSchoolManagerTitle(e.role));
      let matched=candidates.filter(e=>managerMatchesScope(e.raw,scopeIds,scopeNames,fullLookup));
      if(!matched.length){
        matched=candidates.filter(e=>{
          const ids=(e.schoolIds?.length?e.schoolIds:[e.schoolId]).filter(Boolean).map(String);
          const names=(e.schoolNames?.length?e.schoolNames:[e.schoolName,e.campus]).filter(Boolean);
          return scopeIds.some(id=>ids.includes(String(id)))||scopeNames.some(n=>names.some(name=>same(n,name)));
        });
      }
      // If the server query was already school-scoped but privacy hid the Schools field in the response,
      // one returned exact-role row is still authoritative for that scoped request.
      const chosen=matched[0]||(rows.length===1&&candidates.length===1?candidates[0]:null);
      if(!chosen){console.warn("Mishkat manager resolver: manager rows were returned but none matched the current school scope.",{scopeIds,scopeNames,count:candidates.length});return null;}
      return publishResolvedManager(chosen,scopeIds,scopeNames);
    })();
    try{return await managerResolutionPromise;}finally{managerResolutionPromise=null;}
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
    const year=currentAcademicYearOf(years),term=currentTermOf(terms);
    const roleKey=roleKeyOf(user.counselorRole||"");
    // AUTHORITATIVE DISTRIBUTION SCOPE FROM BUBBLE:
    // guidance_bootstrap.schools == Current User's user data's Schools
    // guidance_bootstrap.departments == Current User's user data's Dep list
    // guidance_bootstrap.grades == Current User's user data's Grades
    // Do NOT infer the campus from Student.School or from a generic School search.
    const bootstrapSchoolRows=listFrom(src,["schools","school","Schools","School"]).map(v=>resolveRef(v,lookup.schools)).filter(Boolean);
    const bootstrapStageRows=listFrom(src,["departments"]).map(v=>resolveRef(v,lookup.departments)).filter(Boolean);
    const bootstrapGradeRows=listFrom(src,["grades","Grade","Grades"]).map(v=>resolveRef(v,lookup.grades)).filter(Boolean);
    let assignedSchoolRows=bootstrapSchoolRows.length?bootstrapSchoolRows:relationArray(rawUser,["Schools"],lookup.schools);
    let assignedStageRows=bootstrapStageRows.length?bootstrapStageRows:relationArray(rawUser,["Dep list"],lookup.departments);
    let assignedGradeRows=bootstrapGradeRows.length?bootstrapGradeRows:relationArray(rawUser,["Grades"],lookup.grades);
    const assignedSchoolIds=[...new Set(assignedSchoolRows.map(idOf).filter(Boolean))];
    const assignedSchoolNames=[...new Set(assignedSchoolRows.map(text).filter(Boolean))];
    const assignedStageIds=[...new Set(assignedStageRows.map(idOf).filter(Boolean))];
    const assignedStageNames=[...new Set(assignedStageRows.map(text).filter(Boolean))];
    const assignedGradeIds=[...new Set(assignedGradeRows.map(idOf).filter(Boolean))];
    const assignedGradeNames=[...new Set(assignedGradeRows.map(text).filter(Boolean))];
    const primarySchool=assignedSchoolRows[0]||null;
    const primaryGrade=assignedGradeRows[0]||null;
    const primaryStage=assignedStageRows[0]||null;
    // المجمع مصدره الوحيد هنا هو Current User's user data's Schools عبر guidance_bootstrap.schools.
    const resolvedSchoolName=text(primarySchool)||assignedSchoolNames[0]||"";
    const resolvedSchoolId=idOf(primarySchool)||assignedSchoolIds[0]||"";
    const resolvedCampusName=assignedSchoolNames.join("، ");
    // المرحلة مصدرها Current User's user data's Dep list عبر guidance_bootstrap.departments.
    const resolvedStage=assignedStageNames.length?assignedStageNames.join("، "):(text(primaryStage)||user.stage||stored.stage||"");
    const resolvedStageId=idOf(primaryStage)||assignedStageIds[0]||user.stageId||stored.stageId||"";

    // نوع المدرسة يؤخذ من Thing المدرسة/المجمع إن كان الحقل متاحًا، وإلا من اسم المجمع، ثم افتراضي بنين.
    const schoolTypeValue=pick(primarySchool||{},["school_type","schoolType","type","gender","audience_type","school_gender","نوع المدرسة","نوع_المدرسة","النوع"],semanticField(primarySchool,/schooltype|gender|audience|نوع|جنس/));
    const girlsFlag=pick(primarySchool||{},["is_girls_school","girls_school","isGirlsSchool","مدرسة بنات"],null);
    const schoolType=girlsFlag===true?"girls":girlsFlag===false?"boys":schoolTypeOf(schoolTypeValue,primarySchool,resolvedCampusName,user.schoolType);

    // مدير المدرسة: أولًا العلاقة الموجودة على School نفسها، ثم موظف بدور مدير ومطابق لنفس School فقط.
    let manager=null;
    const managerRef=pick(src,["schoolManager","school_manager","school_manager_name","School Manager","School Manager Name","principal","principal_name","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],pick(rawUser,["schoolManager","school_manager","school_manager_name","School Manager","School Manager Name","principal","principal_name","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],pick(primarySchool||{},["schoolManager","school_manager","school_manager_name","School Manager","School Manager Name","principal","principal_name","school_principal","manager","manager_name","director","director_name","مدير المدرسة","مديرة المدرسة"],semanticField(primarySchool,/manager|principal|director|مدير/))));
    if(managerRef){
      const d=resolveRef(managerRef,makeIndex(lookup.usersData));
      const directName=text(d);const directId=idOf(d);
      manager=employees.find(e=>(directId&&e.id===directId)||(directName&&same(e.name,directName)))||(directName?{id:directId,name:directName,role:text(roleValue(d||{},lookup)),raw:d}:null);
    }
    if(!manager&&(assignedSchoolIds.length||assignedSchoolNames.length)){
      const sameAssignedSchool=e=>{
        const ids=(e.schoolIds?.length?e.schoolIds:[e.schoolId]).filter(Boolean).map(String);
        const names=(e.schoolNames?.length?e.schoolNames:[e.schoolName,e.campus]).filter(Boolean);
        return assignedSchoolIds.some(id=>ids.includes(String(id)))||assignedSchoolNames.some(n=>names.some(name=>same(n,name)));
      };
      const sameAssignedStage=e=>{
        const ids=(e.stageIds?.length?e.stageIds:[e.stageId]).filter(Boolean).map(String);
        const names=(e.stageNames?.length?e.stageNames:[e.stage]).filter(Boolean);
        return assignedStageIds.some(id=>ids.includes(String(id)))||assignedStageNames.some(n=>names.some(name=>same(n,name)));
      };
      const candidates=employees.filter(e=>e.active&&isManagerRole(e.role)&&sameAssignedSchool(e));
      const ranked=candidates.map(e=>({e,score:managerRoleScore(e.role)+(sameAssignedStage(e)?8:0)})).sort((a,b)=>b.score-a.score);
      manager=ranked[0]?.e||null;
    }
    if(!manager)manager=cachedManager(assignedSchoolIds,assignedSchoolNames);
    const canViewSchoolStats=["school_manager","counselor"].includes(roleKey);
    const canViewSupervisionStats=["system_admin","general_supervisor","complexes_director","complex_supervisor","guidance_supervisor","guidance_coordinator"].includes(roleKey);
    const context={
      id:user.id||stored.id||"",employeeCode:user.employeeCode||stored.employeeCode||"",counselorName:user.counselorName||stored.counselorName||"",
      counselorRole:user.counselorRole||stored.counselorRole||(schoolType==="girls"?"الموجهة الطلابية":"الموجه الطلابي"),
      schoolName:resolvedSchoolName,schoolId:resolvedSchoolId,
      gradeName:text(primaryGrade)||assignedGradeNames[0]||"",gradeId:idOf(primaryGrade)||assignedGradeIds[0]||"",
      // In this Bubble deployment School == المجمع. Never derive campus from a separate field.
      campus:resolvedCampusName,campusId:resolvedSchoolId,stage:resolvedStage,stageId:resolvedStageId,
      academicYear:text(year)||stored.academicYear||"",academicYearId:idOf(year)||stored.academicYearId||"",term:text(term)||stored.term||"",termId:idOf(term)||stored.termId||"",
      managerId:manager?.id||"",managerName:manager?.name||"",managerRole:manager?.role||(schoolType==="girls"?"مديرة المدرسة":"مدير المدرسة"),
      schoolType,audienceType:schoolType,schoolTypeLabel:schoolType==="girls"?"بنات":"بنين",studentsLabel:schoolType==="girls"?"الطالبات":"الطلاب",studentLabel:schoolType==="girls"?"الطالبة":"الطالب",
      counselorTitle:/موجه/.test(user.counselorRole||"")?user.counselorRole:(schoolType==="girls"?"الموجهة الطلابية":"الموجه الطلابي"),
      managerTitle:/مدير|مديره/.test(norm(manager?.role||""))?(manager?.role||""):(schoolType==="girls"?"مديرة المدرسة":"مدير المدرسة"),
      roleKey,canViewSchoolStats,canViewSupervisionStats,
      assignedSchoolIds,assignedSchoolNames,assignedStageIds,assignedStageNames,assignedGradeIds,assignedGradeNames,
      supervisionScope:["system_admin","general_supervisor","complexes_director","complex_supervisor","guidance_supervisor","guidance_coordinator"].includes(roleKey)?"all":"assigned"
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
    // School is mandatory. If Current User's user data's Schools was not returned, show no students.
    if(!schoolIds.size&&!schoolNames.size)return [];
    const matches=(value,ids,names,map,{required=false}={})=>{
      if(!ids.size&&!names.size)return !required;
      const resolved=resolveRef(value,map),rid=idOf(resolved),rname=norm(text(resolved));
      if(rid&&ids.has(String(rid)))return true;
      if(rname&&names.has(rname))return true;
      return false;
    };
    return rows.filter(s=>
      matches(pick(s,["School","school"],""),schoolIds,schoolNames,lookup.schools,{required:true})&&
      matches(pick(s,["Dep","Department","department"],""),stageIds,stageNames,lookup.departments)&&
      matches(pick(s,["grade","Grade","Grades"],""),gradeIds,gradeNames,lookup.grades)
    );
  }
  async function setManager(){console.info("Mishkat: school manager is automatic from Users Data/School; manual changes are disabled.");return getContext();}
  function optionMatch(select,label){if(!select||!label)return "";const n=norm(label);const aliases={"المرحله المتوسطه":["المتوسطه","middle"],"المتوسطه":["المرحله المتوسطه","middle"],"المرحله الثانويه":["الثانويه","secondary"],"الثانويه":["المرحله الثانويه","secondary"],"الابتدائيه":["primary","المرحله الابتدائيه","upper_primary","lower_primary"]};const choices=[n,...(aliases[n]||[])];const o=[...select.options].find(x=>choices.some(c=>norm(x.textContent)===norm(c)||norm(x.value)===norm(c)||norm(x.textContent).includes(norm(c))));return o?.value||"";}
  function setControl(el,value,{lock=true}={}){if(!el||value===undefined||value===null||String(value)==="")return;if(el.tagName==="SELECT"){let v=optionMatch(el,value)||String(value);if(![...el.options].some(o=>o.value===v)){const o=document.createElement("option");o.value=String(value);o.textContent=String(value);el.appendChild(o);v=String(value);}if(el.value!==v)el.value=v;if(lock)el.disabled=true;}else if("value" in el){if(el.value!==String(value))el.value=String(value);if(lock){el.readOnly=true;el.setAttribute("aria-readonly","true");}}el.dataset.autoContext="true";el.title="يتم تعبئته تلقائيًا من توزيع المستخدم";}
  function setText(id,value){const el=document.getElementById(id);if(el&&value&&el.textContent!==value)el.textContent=value;}
  const originals=new WeakMap();
  function genderizeString(value,c){if(c.schoolType!=="girls")return value;return String(value).replace(/الموجه الطلابي/g,c.counselorTitle||"الموجهة الطلابية").replace(/مدير المدرسة/g,c.managerTitle||"مديرة المدرسة").replace(/مدرسة بنين/g,"مدرسة بنات").replace(/صياغات الطلاب/g,"صياغات الطالبات").replace(/شهادات الطلاب/g,"شهادات الطالبات").replace(/تقارير الطلاب/g,"تقارير الطالبات").replace(/نوع الطلاب/g,"نوع الطالبات").replace(/الطلاب/g,"الطالبات").replace(/طلاب/g,"طالبات").replace(/اسم الطالب(?!ة)/g,"اسم الطالبة").replace(/بيانات الطالب(?!ة)/g,"بيانات الطالبة").replace(/ولي أمر الطالب(?!ة)/g,"ولي أمر الطالبة").replace(/ابنكم/g,"ابنتكم").replace(/الطالب(?!ات|ة)/g,"الطالبة");}
  function applyGenderLanguage(root,c){if(!root?.querySelectorAll)return;document.documentElement.dataset.schoolType=c.schoolType;document.body?.setAttribute("data-school-type",c.schoolType);const nodes=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||["SCRIPT","STYLE","TEXTAREA","OPTION"].includes(p.tagName))return NodeFilter.FILTER_REJECT;return node.nodeValue?.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{if(!originals.has(node))originals.set(node,node.nodeValue);const next=genderizeString(originals.get(node),c);if(node.nodeValue!==next)node.nodeValue=next;});root.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el=>{if(!el.dataset.originalPlaceholder)el.dataset.originalPlaceholder=el.getAttribute("placeholder")||"";el.setAttribute("placeholder",genderizeString(el.dataset.originalPlaceholder,c));});}
  function applyDocument(root=document){const c=getContext();
    const legacyAssigned=document.getElementById("profileAssignedSchool");if(legacyAssigned){const box=legacyAssigned.closest(".status-box")||legacyAssigned.parentElement;if(box)box.remove();}
    const legacyInput=document.getElementById("schoolProfileName");if(legacyInput){const label=legacyInput.closest("label");if(label&&legacyInput.type!=="hidden")label.remove();else if(legacyInput.type==="hidden")legacyInput.remove();}
    const ids={counselorName:["counselorName","counselorInput","profileFullName"],schoolName:["schoolName","schoolInput"],managerName:["directorInput","principalName","supervisorInput","profileManagerName"],stage:["schoolStage","stageSelect","stageFilter","metaStage","profileStageName"],campus:["metaCampus","campusInput","complexInput","profileCampusName"],schoolTypeLabel:["profileSchoolType"],academicYear:["yearInput","metaAcademicYear"],term:["termSelect","metaAcademicTerm"]};Object.entries(ids).forEach(([key,list])=>list.forEach(id=>setControl(document.getElementById(id),c[key]||"")));root.querySelectorAll?.('[data-field="counselor_name"],[data-field="counselor5"]').forEach(el=>setControl(el,c.counselorName));root.querySelectorAll?.('[data-field="principal_name"]').forEach(el=>setControl(el,c.managerName));root.querySelectorAll?.('[data-field="stage"]').forEach(el=>setControl(el,c.stage));root.querySelectorAll?.('[data-field="campus"],[data-field="complex"]').forEach(el=>setControl(el,c.campus));setText("headerUserName",c.counselorName);setText("userName",c.counselorName);setText("recordCounselorName",c.counselorName);setText("headerSchoolName",c.schoolName);setText("recordSchoolName",c.schoolName);setText("profileAssignedCampus",c.campus||"—");setText("profileAssignedStage",c.stage||"—");setText("profileAssignedUser",c.counselorName||"—");setText("profileAssignedSchoolType",c.schoolTypeLabel);setText("profileAssignedManager",c.managerName||"—");root.querySelectorAll?.('[data-school-context-display]').forEach(el=>{const key=el.dataset.schoolContextDisplay;const value=c[key]||"—";if(el.textContent!==value)el.textContent=value;});const audience=document.getElementById("audienceBadge");if(audience&&/^(—|صياغات|شهادات|تقارير)/.test(audience.textContent.trim()))audience.textContent=c.schoolTypeLabel;const executor=document.getElementById("executorInput");if(executor&&c.schoolType==="girls"&&/الموجه الطلابي/.test(executor.value||""))executor.value=(executor.value||"").replace(/الموجه الطلابي/g,c.counselorTitle||"الموجهة الطلابية").replace(/العاملين/g,"العاملات");const planTitle=document.getElementById("planTitle");if(planTitle&&c.schoolType==="girls"&&/للموجه الطلابي/.test(planTitle.value||""))planTitle.value=(planTitle.value||"").replace(/للموجه الطلابي/g,"للموجهة الطلابية");applyGenderLanguage(root,c);}
  async function refreshFromEndpoint(){
    const cfg=global.MISHKAT_BUBBLE_CONFIG||{};
    if(!cfg.directoryEndpoint)return;
    try{
      let normalized;
      if(typeof cfg.fetchDirectorySnapshot==="function"){
        normalized=await cfg.fetchDirectorySnapshot();
      }else{
        const response=await fetch(cfg.directoryEndpoint,{credentials:cfg.credentials||"include",headers:{"Accept":"application/json",...(cfg.headers||{})},cache:"no-store"});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const payload=await response.json();
        normalized=typeof cfg.normalizeDirectoryPayload==="function"?cfg.normalizeDirectoryPayload(payload):(payload?.response||payload?.data||payload);
      }
      const useful=["schools","departments","students"].some(key=>Array.isArray(normalized?.[key])&&normalized[key].length);
      const existingUseful=["schools","departments","students"].some(key=>Array.isArray(global.MISHKAT_BUBBLE_DATA?.[key])&&global.MISHKAT_BUBBLE_DATA[key].length);
      if(!useful&&existingUseful)return;
      global.MISHKAT_BUBBLE_DATA=normalized||global.MISHKAT_BUBBLE_DATA||{};
      state.loaded=false;
      build();
      applyDocument(document);
      if(!state.context.managerName)resolveManagerDirect().catch(()=>{});
      global.dispatchEvent(new CustomEvent("mishkat:school-context-changed",{detail:getContext()}));
    }catch(error){
      console.warn("School context endpoint unavailable; keeping last valid context.",error);
    }
  }
  function boot(){
    build();applyDocument(document);
    // Do not add an artificial 900 ms delay. Start manager resolution immediately
    // whenever the school scope is already known, while the normal bootstrap refresh runs in parallel.
    if(!state.context.managerName)resolveManagerDirect().catch(()=>{});
    refreshFromEndpoint();
    let scheduled=false;
    const scheduleApply=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;state.loaded=false;build();applyDocument(document);if(!state.context.managerName)resolveManagerDirect().catch(()=>{});},0);};
    const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes&&m.addedNodes.length))scheduleApply();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    // Short bootstrap reconciliation only; avoid repeated API retries for four seconds.
    let rounds=0;const timer=setInterval(()=>{state.loaded=false;build();applyDocument(document);if(!state.context.managerName)resolveManagerDirect().catch(()=>{});if(++rounds>=5)clearInterval(timer)},300);
    let backgroundManagerRefreshDone=false;
    global.addEventListener("focus",scheduleApply);
    global.addEventListener("mishkat:directory-loaded",()=>{
      scheduleApply();
      const c=getContext();
      if(!c.managerName)resolveManagerDirect().catch(()=>{});
      else if(!backgroundManagerRefreshDone){
        // Cached/current value is already visible; verify it once without blocking the UI.
        backgroundManagerRefreshDone=true;
        setTimeout(()=>resolveManagerDirect({force:true}).catch(()=>{}),0);
      }
    });
    global.addEventListener("mishkat:bubble-store-ready",()=>{if(!getContext().managerName)resolveManagerDirect().catch(()=>{})});
    global.dispatchEvent(new CustomEvent("mishkat:school-context-ready",{detail:getContext()}));
  }
  global.MishkatSchoolContext={build,getContext,getEmployees,getStudents,setManager,resolveManagerDirect,applyDocument,schoolTypeOf,roleKeyOf,schema};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
