"use strict";
/*
 * Mishkat School Platform - Bubble directory adapter V1.0.15
 * Exact schema aliases are based on the existing Bubble database.
 * Do NOT place a Bubble admin token in frontend JavaScript.
 */
(function(global){
  const FALLBACK = {
    students: [], employees: [],
    academicYears: [{id:"1448", name:"1448", isCurrent:true, active:true}],
    terms: [], campuses: [], stages: [], grades: [], classes: [],
    guidanceActions:[], guidanceWays:[], guidanceReasons:[], guidanceSitu:[], guidanceFailTypes:[], guidanceProblemBehav:[], guidanceProblemEdu:[], guidanceSkills:[], guidanceStudentNotices:[], guidanceObserv:[]
  };
  const schema = global.MISHKAT_BUBBLE_SCHEMA || {};

  const pick = (obj, keys, fallback="") => {
    for(const key of keys){
      const value = obj?.[key];
      if(value !== undefined && value !== null && (!(typeof value === "string") || value.trim() !== "")) return value;
    }
    return fallback;
  };
  const first = value => Array.isArray(value) ? (value[0] ?? "") : value;
  const idOf = (value, fallback="") => {
    if(value == null) return fallback;
    if(typeof value === "string" || typeof value === "number") return String(value);
    return String(pick(value,["id","_id","unique_id","unique id","Unique ID","slug"],fallback));
  };
  const labelOf = value => {
    value = first(value);
    if(value == null) return "";
    if(typeof value === "string" || typeof value === "number") return String(value);
    return String(pick(value,["Full Name","full_name","Dep. Name","School Name","school name","name","Name","title","Title","label","display","اسم","الاسم","school_name","اسم المدرسة"],""));
  };
  const boolOf = value => value === true || value === 1 || ["true","yes","نعم","1"].includes(String(value).trim().toLowerCase());
  const activeOf = (raw, fallback=true) => {
    for(const key of ["Active","active","is_active"]){
      if(raw?.[key]!==undefined&&raw?.[key]!==null)return boolOf(raw[key]);
    }
    return fallback;
  };
  const norm = v => String(v??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/\s+/g," ").trim();

  const unwrapIncoming=(value)=>{
    const cfg=global.MISHKAT_BUBBLE_CONFIG||{};
    if(typeof cfg.normalizeDirectoryPayload==="function")return cfg.normalizeDirectoryPayload(value);
    return value?.response||value?.data||value||{};
  };
  const hasList=(obj,keys)=>keys.some(k=>Array.isArray(obj?.[k])&&obj[k].length);
  const mergeDirectorySources=(primary={},extra={})=>{
    const out={...extra,...primary};
    const hydrateScoped=(p,e)=>{
      if(!p.length)return e;
      const map=new Map(e.map(row=>[idOf(row),row]).filter(([id])=>id));
      return p.map(row=>{
        const id=idOf(row);const full=id?map.get(id):null;
        if(!full)return row;
        return row&&typeof row==="object"?{...full,...row}:full;
      });
    };
    const scopedGroups=[
      ["schools",["schools","Schools","School"]],
      ["departments",["departments","Departments","Department"]],
      ["grades",["grades","Grades"]],
      ["academicYears",["academicYears","academic_years","academic year","years"]],
      ["terms",["terms","academicTerms","academic_terms","semesters"]],
      ["students",["students","Students","schoolStudents","school_students"]]
    ];
    for(const [canonical,keys] of scopedGroups){
      out[canonical]=hydrateScoped(listFrom(primary,keys),listFrom(extra,keys));
    }
    const supplementalGroups=[
      ["classes",["classes","Classes","Class"]],
      ["jobTitles",["jobTitles","job_titles","Job Titles","Job Title"]],
      ["usersData",["usersData","users_data","Users Data","employees","staff","schoolEmployees","school_employees"]],
      ["guidanceActions",["guidanceActions","Guidance_Action"]],
      ["guidanceWays",["guidanceWays","Guidance_Way"]],
      ["guidanceReasons",["guidanceReasons","Guidance_Reason"]],
      ["guidanceSitu",["guidanceSitu","Guidance_Situ"]],
      ["guidanceFailTypes",["guidanceFailTypes","Guidance_FailType"]],
      ["guidanceProblemBehav",["guidanceProblemBehav","Guidance_ProblemBehav"]],
      ["guidanceProblemEdu",["guidanceProblemEdu","Guidance_ProblemEdu"]],
      ["guidanceSkills",["guidanceSkills","Guidance_Skills"]],
      ["guidanceStudentNotices",["guidanceStudentNotices","guidance_Studentnotice"]],
      ["guidanceObserv",["guidanceObserv","Guidance_observ"]]
    ];
    for(const [canonical,keys] of supplementalGroups){
      const p=listFrom(primary,keys),e=listFrom(extra,keys);out[canonical]=p.length?p:e;
    }
    const scopedUser=primary.currentUsersData||primary.current_users_data||null;
    const userId=String(global.MishkatBubbleAuth?.getUserId?.()||"");
    const userRows=listFrom(out,["usersData","users_data","Users Data","employees","staff"]);
    const currentFull=userId?userRows.find(row=>idOf(pick(row,["User","user"],""))===userId):null;
    if(scopedUser||currentFull)out.currentUsersData={...(currentFull||{}),...(scopedUser||{})};
    out.__mishkatScope=primary.__mishkatScope||extra.__mishkatScope||{};
    return out;
  };

  function listFrom(src, keys){
    let empty=[];
    for(const key of keys){
      if(Array.isArray(src?.[key])){if(src[key].length)return src[key];empty=src[key];}
    }
    return empty;
  }
  function createLookup(src){
    const groups = {
      schools:listFrom(src,["schools","Schools","School"]),
      departments:listFrom(src,["departments","Departments","Department"]),
      grades:listFrom(src,["grades","Grades"]),
      classes:listFrom(src,["classes","Classes","Class"]),
      jobTitles:listFrom(src,["jobTitles","job_titles","Job Titles","Job Title"])
    };
    const indexes={};
    Object.entries(groups).forEach(([key,rows])=>{
      const map=new Map();
      rows.forEach(row=>{const id=idOf(row);if(id)map.set(id,row);});
      indexes[key]=map;
    });
    return indexes;
  }
  function resolveRef(value,map){
    value=first(value);
    if(value == null) return value;
    if(typeof value === "object") return value;
    return map?.get?.(String(value)) || value;
  }

  function normalizeStudent(raw, index, lookup){
    const id = idOf(raw, `student-${index+1}`);
    const schoolRaw = resolveRef(pick(raw,["School","school","المدرسة"],""),lookup.schools);
    const depRaw = resolveRef(pick(raw,["Dep","Department","department","stage","المرحلة"],""),lookup.departments);
    const gradeRaw = resolveRef(pick(raw,["grade","Grade","Grades","الصف"],""),lookup.grades);
    const classRaw = resolveRef(pick(raw,["Class","class","class_name","classroom","الفصل"],""),lookup.classes);
    const campusRaw = pick(schoolRaw||{},["campus","Campus","complex","Complex","school_complex","المجمع"],"");
    return {
      id,
      name: String(pick(raw,["Full Name","full_name","name","Name","Student Name","اسم الطالب","الاسم"],"")),
      reference: String(pick(raw,["code","local id","National ID","student_reference","student_id","student_number","Student ID","رقم الطالب"],id)),
      code: String(pick(raw,["code"],"")),
      nationalId: String(pick(raw,["National ID","national_id"],"")),
      schoolName: labelOf(schoolRaw), schoolId: idOf(schoolRaw),
      campus: labelOf(campusRaw) || labelOf(schoolRaw), campusId: idOf(campusRaw) || idOf(schoolRaw),
      stage: labelOf(depRaw), stageId: idOf(depRaw),
      grade: labelOf(gradeRaw), gradeId: idOf(gradeRaw),
      className: labelOf(classRaw), classId: idOf(classRaw),
      guardianName: String(pick(raw,["guardian_name","parent_name","father_name","Guardian Name","ولي الأمر","اسم ولي الأمر"],"")),
      guardianPhone: String(pick(raw,["Parent phone","parent_phone","guardian_phone","phone","mobile","Guardian Phone","رقم ولي الأمر"],"")),
      birthDate: String(pick(raw,["birth_date","date_of_birth","DOB","تاريخ الميلاد"],"")).slice(0,10),
      previousSchool: String(pick(raw,["previous_school","Previous School","المدرسة السابقة"],"")),
      active: activeOf(raw,true), userId:idOf(pick(raw,["user","User"],"")), raw
    };
  }

  function normalizeEmployee(raw, index, lookup){
    const id = idOf(raw, `employee-${index+1}`);
    const schoolRaw = resolveRef(first(pick(raw,["activity schools","activity_schools","Schools","schools","School","school"],"")),lookup.schools);
    const depRaw = resolveRef(first(pick(raw,["Dep","Dep list","dep","departments","Department","stage"],"")),lookup.departments);
    const currentJob = resolveRef(first(pick(raw,["Current Job","current_job","Job Title","job_title","role","position","title"],"")),lookup.jobTitles);
    return {
      id,
      name: String(pick(raw,["Full Name","full_name","name","employee_name","Name","Employee Name","اسم الموظف","الاسم"],"")),
      role: labelOf(currentJob),
      employeeCode: String(pick(raw,["Employee Code","employee_code"],"")),
      phone: String(pick(raw,["Phone Number","phone","mobile"],"")),
      schoolName: labelOf(schoolRaw), schoolId:idOf(schoolRaw),
      campus: labelOf(pick(schoolRaw||{},["campus","Campus","complex","Complex","المجمع"],"")) || labelOf(schoolRaw),
      stage: labelOf(depRaw), stageId:idOf(depRaw),
      active: activeOf(raw,true), userId:idOf(pick(raw,["User","user"],"")), raw
    };
  }

  function normalizeAcademicYear(raw,index){
    return {
      id:idOf(raw,`year-${index+1}`), name:String(pick(raw,["title","Title","name","Name"],"")),
      isCurrent:boolOf(pick(raw,["Active","isCurrent","is_current","current","active_current","default"],false)),
      active:true, start:String(pick(raw,["start","Start"],"")), end:String(pick(raw,["End","end"],"")), raw
    };
  }
  function normalizeSimple(raw, index, prefix){
    return {id:idOf(raw,`${prefix}-${index+1}`),name:labelOf(raw),isCurrent:boolOf(pick(raw,["Active","isCurrent","is_current","current","active_current","default"],false)),active:activeOf(raw,true),raw};
  }
  function normalizeLookup(raw,index,prefix,labelKeys){
    return {id:idOf(raw,`${prefix}-${index+1}`),name:String(pick(raw,labelKeys,"")),active:activeOf(raw,true),raw};
  }

  function normalize(snapshot={}){
    const src={...FALLBACK,...snapshot};
    const lookup=createLookup(src);
    const students=listFrom(src,["students","Students","schoolStudents","school_students"]);
    const employees=listFrom(src,["employees","usersData","users_data","Users Data","staff","schoolEmployees","school_employees"]);
    const years=listFrom(src,["academicYears","academic_years","academic year","years"]);
    const terms=listFrom(src,["terms","academicTerms","academic_terms","semesters"]);
    return {
      students:students.map((x,i)=>normalizeStudent(x,i,lookup)).filter(x=>x.name&&x.active),
      employees:employees.map((x,i)=>normalizeEmployee(x,i,lookup)).filter(x=>x.name&&x.active),
      academicYears:(years.length?years:FALLBACK.academicYears).map(normalizeAcademicYear).filter(x=>x.name),
      terms:terms.map((x,i)=>normalizeSimple(x,i,"term")).filter(x=>x.name&&x.active),
      campuses:listFrom(src,["campuses","complexes"]).map((x,i)=>normalizeSimple(x,i,"campus")).filter(x=>x.name&&x.active),
      stages:listFrom(src,["stages","departments","Departments","Department"]).map((x,i)=>normalizeSimple(x,i,"stage")).filter(x=>x.name&&x.active),
      grades:listFrom(src,["grades","Grades"]).map((x,i)=>normalizeSimple(x,i,"grade")).filter(x=>x.name&&x.active),
      classes:listFrom(src,["classes","Classes","Class"]).map((x,i)=>normalizeSimple(x,i,"class")).filter(x=>x.name&&x.active),
      guidanceActions:listFrom(src,["guidanceActions","Guidance_Action"]).map((x,i)=>normalizeLookup(x,i,"action",["Action_Description","Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceWays:listFrom(src,["guidanceWays","Guidance_Way"]).map((x,i)=>normalizeLookup(x,i,"way",["Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceReasons:listFrom(src,["guidanceReasons","Guidance_Reason"]).map((x,i)=>normalizeLookup(x,i,"reason",["Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceSitu:listFrom(src,["guidanceSitu","Guidance_Situ"]).map((x,i)=>normalizeLookup(x,i,"situ",["Situation_Discreption","Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceFailTypes:listFrom(src,["guidanceFailTypes","Guidance_FailType"]).map((x,i)=>normalizeLookup(x,i,"failtype",["Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceProblemBehav:listFrom(src,["guidanceProblemBehav","Guidance_ProblemBehav"]).map((x,i)=>normalizeLookup(x,i,"problembehav",["ProblemBehav_Title","Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceProblemEdu:listFrom(src,["guidanceProblemEdu","Guidance_ProblemEdu"]).map((x,i)=>normalizeLookup(x,i,"problemedu",["ProblemEdu_Title","Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceSkills:listFrom(src,["guidanceSkills","Guidance_Skills"]).map((x,i)=>normalizeLookup(x,i,"skill",["Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceStudentNotices:listFrom(src,["guidanceStudentNotices","guidance_Studentnotice"]).map((x,i)=>normalizeLookup(x,i,"notice",["Notice_description","Title","title","name","Name"])).filter(x=>x.name&&x.active),
      guidanceObserv:listFrom(src,["guidanceObserv","Guidance_observ"]).map((x,i)=>normalizeLookup(x,i,"observ",["Title","title","name","Name"])).filter(x=>x.name&&x.active),
      raw:src
    };
  }

  let snapshot=normalize(FALLBACK);
  async function loadFromDataApi({supplementOnly=false}={}){
    const store=global.MishkatBubbleStore,config=global.MISHKAT_BUBBLE_CONFIG||{};
    if(!store?.remoteEnabled?.() && !config.dataApiBase && !config.objectApiBase)return null;
    const typeNames=supplementOnly?[
      "School","Department","Grades","Class","Job Title","academic year","terms","Users Data","Students",
      "Guidance_Action","Guidance_Way","Guidance_Reason","Guidance_Situ","Guidance_FailType",
      "Guidance_ProblemBehav","Guidance_ProblemEdu","Guidance_Skills","guidance_Studentnotice","Guidance_observ"
    ]:[
      "School","Department","Grades","Class","Job Title","academic year","terms","Users Data","Students",
      "Guidance_Action","Guidance_Way","Guidance_Reason","Guidance_Situ","Guidance_FailType",
      "Guidance_ProblemBehav","Guidance_ProblemEdu","Guidance_Skills","guidance_Studentnotice","Guidance_observ"
    ];
    const src={};let success=0;
    for(const type of typeNames){
      try{const rows=await store.list(type,[],{sortField:"Modified Date",descending:false});src[type]=Array.isArray(rows)?rows:[];success++;}catch(error){console.warn(`Bubble directory type unavailable: ${type}`,error);}
    }
    return success?src:null;
  }
  async function load(){
    let incoming=global.MISHKAT_BUBBLE_DATA||null;const config=global.MISHKAT_BUBBLE_CONFIG||{};
    let bootstrapLoaded=false;
    if(!incoming&&config.directoryEndpoint){
      try{
        const response=await fetch(config.directoryEndpoint,{credentials:config.credentials||"include",headers:{"Accept":"application/json",...(config.headers||{})},cache:"no-store"});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        incoming=unwrapIncoming(await response.json());bootstrapLoaded=true;
      }catch(error){console.warn("Bubble directory endpoint unavailable; trying Data API/local snapshot.",error);}
    }else if(incoming){incoming=unwrapIncoming(incoming);bootstrapLoaded=Boolean(incoming?.__mishkatScope?.authoritativeStudents);}

    if(incoming){
      // guidance_bootstrap is authoritative for the current user's schools/departments/grades/students.
      // Data API only supplements lookup tables and employee directory; it never replaces scoped students.
      const supplement=await loadFromDataApi({supplementOnly:true}).catch(()=>null);
      if(supplement)incoming=mergeDirectorySources(incoming,supplement);
    }else incoming=await loadFromDataApi();

    if(!incoming){try{incoming=JSON.parse(localStorage.getItem("mishkat_bubble_directory_snapshot_v1")||"null");}catch(_error){}}
    if(incoming&&Object.keys(incoming).length){
      incoming=unwrapIncoming(incoming);
      global.MISHKAT_BUBBLE_DATA=incoming;
      try{localStorage.setItem("mishkat_bubble_directory_snapshot_v1",JSON.stringify(incoming));}catch(_error){}
      try{global.MishkatSchoolContext?.build?.();global.MishkatSchoolContext?.applyDocument?.(document);}catch(_error){}
    }
    snapshot=normalize(incoming||FALLBACK);
    snapshot.connection={
      authenticated:Boolean(global.MishkatBubbleAuth?.isAuthenticated?.()),
      bootstrapLoaded,
      rawStudents:listFrom(incoming||{},["students","Students","schoolStudents","school_students"]).length,
      normalizedStudents:snapshot.students.length,
      employees:snapshot.employees.length
    };
    return snapshot;
  }
  function currentAcademicYear(){
    const active=snapshot.academicYears.filter(x=>x.isCurrent);
    const pool=active.length?active:snapshot.academicYears;
    const dateScore=x=>{const n=Date.parse(x.start||x.raw?.start||"");return Number.isFinite(n)?n:0};
    const titleScore=x=>{const m=String(x.name||"").match(/\d+/);return m?Number(m[0]):0};
    return [...pool].sort((a,b)=>(dateScore(b)-dateScore(a))||(titleScore(b)-titleScore(a)))[0]||null;
  }
  function currentTerm(){return snapshot.terms.find(x=>x.isCurrent)||snapshot.terms[0]||null;}
  function findStudent(idOrName){const v=String(idOrName);return snapshot.students.find(x=>x.id===v)||snapshot.students.find(x=>x.name===v)||null;}
  function findEmployee(idOrName){const v=String(idOrName);return snapshot.employees.find(x=>x.id===v)||snapshot.employees.find(x=>x.name===v)||null;}
  function findLookup(source,idOrName){
    const v=String(idOrName??"").trim();if(!v)return null;
    const n=norm(v.replace(/^\d+\s*[—-]\s*/,""));
    const rows=snapshot[source]||[];
    return rows.find(x=>x.id===v)||rows.find(x=>norm(x.name)===n)||rows.find(x=>norm(x.name).includes(n)||n.includes(norm(x.name)))||null;
  }
  function setSnapshot(data){snapshot=normalize(data||{});try{localStorage.setItem("mishkat_bubble_directory_snapshot_v1",JSON.stringify(data||{}));}catch(_error){}return snapshot;}
  function getSnapshot(){return snapshot;}
  function buildGuidanceSituationPayload(formData={}, context={}){
    const student=findStudent(formData.student_name||formData.studentId||"");
    const source=findEmployee(formData.referral_source||formData.referrer_name||"");
    const term=currentTerm();
    const payload={};
    if(formData.incident_details||formData.Detail)payload.Detail=String(formData.incident_details||formData.Detail);
    if(formData.incident_date||formData.SituationDate)payload.SituationDate=formData.incident_date||formData.SituationDate;
    if(student?.id)payload.Student=student.id;
    if(source?.id)payload.Source=source.id;
    if(context.stageId||student?.stageId)payload.Department=context.stageId||student.stageId;
    if(context.schoolId||student?.schoolId)payload.school=context.schoolId||student.schoolId;
    if(student?.gradeId)payload.grade=student.gradeId;
    if(context.termId||term?.id)payload.Terms=context.termId||term.id;
    if(student?.guardianPhone)payload.Phone=student.guardianPhone;
    // Action and situ are Bubble relations (Guidance_Action / Guidance_Situ).
    // They are intentionally not guessed from visible Arabic labels; pass their Bubble IDs when available.
    if(formData.action_id)payload.Action=formData.action_id;
    if(formData.situ_id)payload.situ=formData.situ_id;
    return payload;
  }
  global.MishkatBubbleDirectory={load,getSnapshot,setSnapshot,currentAcademicYear,currentTerm,findStudent,findEmployee,findLookup,normalize,buildGuidanceSituationPayload,schema};global.MishkatSchoolDirectory=global.MishkatBubbleDirectory;
})(window);
