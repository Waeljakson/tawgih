"use strict";
/*
 * Mishkat School Platform - Bubble directory adapter V1.0.47
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
  const keyNorm = value => String(value??"").toLowerCase().replace(/[\s_.-]+/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه");
  const looksLikeBubbleId = value => /^\d{10,}x\d+$/i.test(String(value||"")) || /^\d{13,}$/.test(String(value||""));
  function labelOf(value){
    value = first(value);
    if(value == null) return "";
    if(typeof value === "string" || typeof value === "number"){
      const text=String(value).trim();
      return looksLikeBubbleId(text)?"":text;
    }
    if(typeof value !== "object") return "";
    const preferred=[
      "Full Name","full_name","Dep. Name","Department Name","department name",
      "Class Name","class name","ClassName","className","Class_Name","class_name","اسم الفصل","الفصل","section","Section",
      "School Name","school name","SchoolName","schoolName","School_Name","school_name",
      "Complex Name","complex name","Campus Name","campus name","اسم المجمع","المجمع","مجمع",
      "Arabic Name","arabic name","Job Titel","job titel","JobTitel","jobTitel","Titel","titel","Name","name","Title","title","label","Label","display","Display",
      "اسم","الاسم","اسم المدرسة","School","school"
    ];
    for(const key of preferred){
      const raw=value?.[key];
      if(raw===undefined||raw===null||raw==="")continue;
      const text=(typeof raw==="object")?labelOf(raw):String(raw).trim();
      if(text&&!looksLikeBubbleId(text))return text;
    }
    let best="",score=-1;
    const blocked=/^(id|_id|uniqueid|createddate|modifieddate|createdby|slug|createdat|updatedat)$/;
    for(const [key,raw] of Object.entries(value)){
      const nk=keyNorm(key);
      if(blocked.test(nk))continue;
      if(typeof raw!=="string"&&typeof raw!=="number")continue;
      const text=String(raw).trim();
      if(!text||looksLikeBubbleId(text)||/^https?:\/\//i.test(text))continue;
      let s=1;
      if(nk.includes("school")&&nk.includes("name"))s=100;
      else if(nk.includes("مجمع")||nk.includes("campus")||nk.includes("complex"))s=95;
      else if(nk.includes("name")||nk.includes("اسم"))s=90;
      else if(nk.includes("title")||nk.includes("label")||nk.includes("display"))s=80;
      else if(nk==="school")s=70;
      if(s>score){best=text;score=s;}
    }
    return best;
  }
  const boolOf = value => value === true || value === 1 || ["true","yes","نعم","1"].includes(String(value).trim().toLowerCase());
  const activeOf = (raw, fallback=true) => {
    for(const key of ["Active","active","is_active"]){
      if(raw?.[key]!==undefined&&raw?.[key]!==null)return boolOf(raw[key]);
    }
    return fallback;
  };
  const norm = v => String(v??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/\s+/g," ").trim();

  function normalizePhoneDisplay(value){
    const text=String(value??"").trim();
    if(!text)return "";

    // Bubble data may contain phone numbers imported from spreadsheets as text such as 9.66506E+11.
    // Expand scientific notation without converting ordinary phone strings to Number,
    // so leading zeroes in correctly stored phone numbers stay untouched.
    const m=text.match(/^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
    if(!m)return text;

    const sign=m[1]==="-"?"-":"";
    const whole=m[2]||"";
    const frac=m[3]||"";
    const exp=Number(m[4]);
    if(!Number.isFinite(exp))return text;

    const digits=(whole+frac).replace(/^0+(?=\d)/,"");
    const decimalPos=whole.length+exp;

    if(decimalPos<=0){
      return sign+"0"+"0".repeat(Math.abs(decimalPos))+(digits||"0");
    }
    if(decimalPos>=digits.length){
      return sign+(digits||"0")+"0".repeat(decimalPos-digits.length);
    }
    // A phone value should be an integer. If the stored scientific value still contains
    // fractional digits, preserve the expanded text rather than silently rounding it.
    return sign+digits.slice(0,decimalPos)+"."+digits.slice(decimalPos);
  }

  function parentPhoneOf(raw){
    const direct=pick(raw,[
      "Parent phone","Parent Phone","parent phone","parent_phone",
      "guardian_phone","phone","mobile","Guardian Phone",
      "رقم ولي الأمر","رقم جوال ولي الأمر"
    ],"");
    if(direct!==""&&direct!==null&&direct!==undefined)return normalizePhoneDisplay(direct);

    for(const [key,value] of Object.entries(raw||{})){
      if(value===undefined||value===null||String(value).trim()==="")continue;
      const nk=keyNorm(key);
      const isParentPhone =
        nk==="parentphone" ||
        nk==="guardianphone" ||
        nk==="parentmobile" ||
        nk==="guardianmobile" ||
        (nk.includes("parent")&&(nk.includes("phone")||nk.includes("mobile"))) ||
        (nk.includes("guardian")&&(nk.includes("phone")||nk.includes("mobile"))) ||
        (nk.includes("ولي")&&(nk.includes("رقم")||nk.includes("جوال")));
      if(isParentPhone)return normalizePhoneDisplay(value);
    }
    return "";
  }

  const unwrapIncoming=(value)=>{
    const cfg=global.MISHKAT_BUBBLE_CONFIG||{};
    if(typeof cfg.normalizeDirectoryPayload==="function")return cfg.normalizeDirectoryPayload(value);
    return value?.response||value?.data||value||{};
  };
  const hasList=(obj,keys)=>keys.some(k=>Array.isArray(obj?.[k])&&obj[k].length);
  const mergeDirectorySources=(primary={},extra={})=>{
    const out={...extra,...primary};
    const toArray=value=>Array.isArray(value)?value:(value!==undefined&&value!==null&&value!==""?[value]:[]);
    const relationList=(obj,keys)=>toArray(pick(obj||{},keys,[])).filter(Boolean);
    const hydrateRefs=(refs,fullRows)=>{
      const map=new Map((fullRows||[]).map(row=>[idOf(row),row]).filter(([id])=>id));
      return (refs||[]).map(row=>{
        const id=idOf(row);const full=id?map.get(id):null;
        if(!full)return row;
        return row&&typeof row==="object"?{...full,...row}:full;
      });
    };
    const studentNameOf=row=>norm(String(pick(row||{},["Full Name","full_name","Student Name","student_name","Name","name","اسم الطالب","الاسم"],"")));
    const hydrateStudentRefs=(refs,fullRows)=>{
      const byId=new Map((fullRows||[]).map(row=>[idOf(row),row]).filter(([id])=>id));
      const byName=new Map();
      (fullRows||[]).forEach(row=>{const name=studentNameOf(row);if(!name)return;const list=byName.get(name)||[];list.push(row);byName.set(name,list);});
      return (refs||[]).map(row=>{
        const id=idOf(row);let full=id?byId.get(id):null;
        if(!full&&row&&typeof row==="object"){
          const name=studentNameOf(row),matches=name?(byName.get(name)||[]):[];
          if(matches.length===1)full=matches[0];
        }
        if(!full)return row;
        return row&&typeof row==="object"?{...full,...row}:full;
      });
    };
    const hydrateScoped=(p,e,{allowExtraFallback=true}={})=>{
      if(!p.length)return allowExtraFallback?e:[];
      return hydrateRefs(p,e);
    };

    // Distribution lists come from guidance_bootstrap (Current User -> user data).
    const scopedGroups=[
      ["schools",["schools","school","Schools","School"]],
      ["departments",["departments","Departments","Department"]],
      ["grades",["grades","Grade","Grades"]],
      ["academicYears",["academicYears","academic_years","academic year","years"]],
      ["terms",["terms","academicTerms","academic_terms","semesters"]]
    ];
    for(const [canonical,keys] of scopedGroups){
      out[canonical]=hydrateScoped(listFrom(primary,keys),listFrom(extra,keys));
    }

    const supplementalGroups=[
      ["classes",["classes","Classes","Class"]],
      ["jobTitles",["jobTitles","job_titles","Job Titels","Job Titles","Job Titel","Job Title"]],
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

    // Resolve the exact logged-in Users Data row from the Bubble user relation.
    const scopedUser=primary.currentUsersData||primary.current_users_data||null;
    const userId=String(global.MishkatBubbleAuth?.getUserId?.()||"");
    const userRows=listFrom(out,["usersData","users_data","Users Data","employees","staff"]);
    const currentFull=userId?userRows.find(row=>idOf(pick(row,["User","user"],""))===userId):null;
    if(scopedUser||currentFull)out.currentUsersData={...(currentFull||{}),...(scopedUser||{})};

    // Students:
    // Workflow API student lists can be truncated. Prefer the complete Students Data API
    // result during supplement merge, then enforce the current user's School + Department + Grades
    // in scopeStudentsToCurrentUser() before publishing anything to the UI.
    const primaryStudents=listFrom(primary,["students","student","Students","schoolStudents","school_students"]);
    const fullStudents=listFrom(extra,["students","Students","schoolStudents","school_students"]);
    const actualUserStudents=currentFull?relationList(currentFull,["Students"]):[];

    if(fullStudents.length){
      out.students=fullStudents;
    }else{
      const fallbackRefs=primaryStudents.length?primaryStudents:actualUserStudents;
      out.students=hydrateStudentRefs(fallbackRefs,fullStudents);
    }

    const primaryStudentClasses=listFrom(primary,["studentClasses","student_classes","Student Classes","student classes"]);
    if(primaryStudentClasses.length)out.studentClasses=primaryStudentClasses;

    const primaryStudentPhones=listFrom(primary,["studentPhones","student_phones","Student Phones","student phones"]);
    if(primaryStudentPhones.length)out.studentPhones=primaryStudentPhones;

    if(primary.studentPhoneById&&typeof primary.studentPhoneById==="object")
      out.studentPhoneById={...(extra.studentPhoneById||{}),...primary.studentPhoneById};
    if(primary.studentPhoneByName&&typeof primary.studentPhoneByName==="object")
      out.studentPhoneByName={...(extra.studentPhoneByName||{}),...primary.studentPhoneByName};

    // Employee selectors use Users Data. Keep the full employee directory available here;
    // the records UI scopes it to Current User's Schools.
    out.employees=listFrom(out,["employees","usersData","users_data","Users Data","staff","schoolEmployees","school_employees"]);
    out.__mishkatScope={...(primary.__mishkatScope||extra.__mishkatScope||{}),studentsFromCompleteDataApi:Boolean(fullStudents.length),studentScope:"school+stage+grades"};
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
      schools:listFrom(src,["schools","school","Schools","School"]),
      departments:listFrom(src,["departments","Departments","Department"]),
      grades:listFrom(src,["grades","Grade","Grades"]),
      classes:listFrom(src,["classes","Classes","Class"]),
      jobTitles:listFrom(src,["jobTitles","job_titles","Job Titels","Job Titles","Job Titel","Job Title"])
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

  function classLabelOf(value,rawStudent={}){
    value=first(value);
    // If Bubble returned a populated Class thing, prefer its explicit display fields.
    if(value && typeof value==="object"){
      const direct=pick(value,[
        "Class Name","class name","ClassName","className","Class_Name","class_name",
        "اسم الفصل","الفصل","Section Name","section name","section","Section",
        "Name","name","Title","title","label","Label","display","Display"
      ],"");
      const text=direct && typeof direct!=="object" ? String(direct).trim() : labelOf(direct||value);
      if(text && !looksLikeBubbleId(text))return text;
      // Some Bubble Class tables use slug as the human-readable section code.
      const slug=String(value?.slug||"").trim();
      if(slug && !looksLikeBubbleId(slug))return slug;
    }
    // If Class is stored directly as text on Students, use it.
    if(typeof value==="string"||typeof value==="number"){
      const text=String(value).trim();
      if(text && !looksLikeBubbleId(text))return text;
    }
    // Last fallback: denormalized class/section text fields on the Student thing.
    const fallback=pick(rawStudent,[
      "Class Name","class name","ClassName","className","class_name",
      "Section","section","Section Name","section name","اسم الفصل","الفصل"
    ],"");
    if(fallback && typeof fallback!=="object"){
      const text=String(fallback).trim();
      if(text && !looksLikeBubbleId(text))return text;
    }
    return "";
  }

  function normalizeStudent(raw, index, lookup){
    const id = idOf(raw, `student-${index+1}`);
    const schoolRaw = resolveRef(pick(raw,["School","school","المدرسة"],""),lookup.schools);
    const depRaw = resolveRef(pick(raw,["Dep","Department","department","stage","المرحلة"],""),lookup.departments);
    const gradeRaw = resolveRef(pick(raw,["grade","Grade","Grades","الصف"],""),lookup.grades);
    const classRaw = resolveRef(pick(raw,["Class","class","Classes","class_name","Class Name","classroom","section","Section","الفصل","اسم الفصل"],""),lookup.classes);
    // Bubble School is the campus/complex (المجمع) in this deployment.
    const campusRaw = schoolRaw;
    return {
      id,
      name: String(pick(raw,["Full Name","full_name","name","Name","Student Name","اسم الطالب","الاسم"],"")),
      reference: String(pick(raw,["code","local id","National ID","student_reference","student_id","student_number","Student ID","رقم الطالب"],id)),
      code: String(pick(raw,["code"],"")),
      nationalId: String(pick(raw,["National ID","national_id"],"")),
      schoolName: labelOf(schoolRaw), schoolId: idOf(schoolRaw),
      campus: labelOf(schoolRaw), campusId: idOf(schoolRaw),
      stage: labelOf(depRaw), stageId: idOf(depRaw),
      grade: labelOf(gradeRaw), gradeId: idOf(gradeRaw),
      className: classLabelOf(classRaw,raw), classId: idOf(classRaw),
      guardianName: String(pick(raw,["guardian_name","parent_name","father_name","Guardian Name","ولي الأمر","اسم ولي الأمر"],"")),
      guardianPhone: parentPhoneOf(raw),
      birthDate: String(pick(raw,["birth_date","date_of_birth","DOB","تاريخ الميلاد"],"")).slice(0,10),
      previousSchool: String(pick(raw,["previous_school","Previous School","المدرسة السابقة"],"")),
      active: activeOf(raw,true), userId:idOf(pick(raw,["user","User"],"")), raw
    };
  }

  function normalizeEmployee(raw, index, lookup){
    const id = idOf(raw, `employee-${index+1}`);
    const toArray=value=>Array.isArray(value)?value:(value!==undefined&&value!==null&&value!==""?[value]:[]);
    const schoolValues=toArray(pick(raw,["activity schools","activity_schools","Schools","schools","School","school"],[])).map(v=>resolveRef(v,lookup.schools)).filter(Boolean);
    const depValues=toArray(pick(raw,["Dep","Dep list","dep","departments","Department","stage"],[])).map(v=>resolveRef(v,lookup.departments)).filter(Boolean);
    const currentJob = resolveRef(first(pick(raw,["Current Job","current_job","Job Title","job_title","role","position","title"],"")),lookup.jobTitles);
    const schoolIds=[...new Set(schoolValues.map(idOf).filter(Boolean))];
    const schoolNames=[...new Set(schoolValues.map(labelOf).filter(Boolean))];
    const stageIds=[...new Set(depValues.map(idOf).filter(Boolean))];
    const stageNames=[...new Set(depValues.map(labelOf).filter(Boolean))];
    const fullName=String(pick(raw,["Full Name","full_name"],"")).trim();
    const currentJobRaw=pick(raw,["Current Job","current_job","Job Title","job_title","role","position","title"],"");
    const currentJobName=labelOf(currentJob)||labelOf(currentJobRaw)||String(
      pick(raw,["Current Job Name","current_job_name","Job Title Name","job_title_name"],"")
    ).trim();

    return {
      id,
      fullName,
      name: fullName || String(pick(raw,["name","employee_name","Name","Employee Name","اسم الموظف","الاسم"],"")).trim(),
      role: currentJobName,
      currentJobName,
      currentJobId:idOf(first(currentJobRaw)),
      employeeCode: String(pick(raw,["Employee Code","employee_code"],"")),
      phone: String(pick(raw,["Phone Number","phone","mobile"],"")),
      schoolName:schoolNames[0]||"", schoolId:schoolIds[0]||"", schoolNames, schoolIds,
      campus:schoolNames[0]||"", campusId:schoolIds[0]||"",
      stage:stageNames[0]||"", stageId:stageIds[0]||"", stageNames, stageIds,
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
    const students=listFrom(src,["students","student","Students","schoolStudents","school_students"]);
    const studentClasses=listFrom(src,["studentClasses","student_classes","Student Classes","student classes"]);
    const studentPhones=listFrom(src,["studentPhones","student_phones","Student Phones","student phones"]);
    const studentPhoneById=(src.studentPhoneById&&typeof src.studentPhoneById==="object")?src.studentPhoneById:{};
    const studentPhoneByName=(src.studentPhoneByName&&typeof src.studentPhoneByName==="object")?src.studentPhoneByName:{};
    const employees=listFrom(src,["employees","employee","usersData","users_data","Users Data","staff","schoolEmployees","school_employees"]);
    const years=listFrom(src,["academicYears","academic_years","academic year","years"]);
    const terms=listFrom(src,["terms","academicTerms","academic_terms","semesters"]);
    const normalizedStudents=students.map((x,i)=>{
      const student=normalizeStudent(x,i,lookup);
      // guidance_bootstrap returns student_classes in the exact same order as Current User's Students.
      // This direct text value is authoritative for display and avoids depending on Data API relation hydration.
      const directClass=studentClasses[i];
      const directClassName=(directClass&&typeof directClass==="object")?classLabelOf(directClass,x):String(directClass??"").trim();
      if(directClassName&&!looksLikeBubbleId(directClassName))student.className=directClassName;

      // Pair direct Parent phone values only when Bubble returned one value per scoped student.
      // This avoids assigning a phone to the wrong student if Bubble drops empty list items.
      if(studentPhones.length===students.length){
        const directPhone=String(studentPhones[i]??"").trim();
        if(directPhone)student.guardianPhone=normalizePhoneDisplay(directPhone);
      }

      // Stable fallback: Parent phone captured from the original bootstrap response.
      // Match by Student ID first, then normalized Full Name.
      if(!student.guardianPhone){
        const byId=student.id?studentPhoneById[String(student.id)]:"";
        const byName=student.name?studentPhoneByName[norm(student.name)]:"";
        const preservedPhone=byId||byName||"";
        if(preservedPhone)student.guardianPhone=normalizePhoneDisplay(preservedPhone);
      }
      return student;
    });
    return {
      students:normalizedStudents.filter(x=>x.name&&x.active),
      employees:employees.map((x,i)=>normalizeEmployee(x,i,lookup)).filter(x=>x.name&&x.active),
      academicYears:(years.length?years:FALLBACK.academicYears).map(normalizeAcademicYear).filter(x=>x.name),
      terms:terms.map((x,i)=>normalizeSimple(x,i,"term")).filter(x=>x.name&&x.active),
      campuses:listFrom(src,["campuses","complexes","schools","school","Schools","School"]).map((x,i)=>normalizeSimple(x,i,"campus")).filter(x=>x.name&&x.active),
      stages:listFrom(src,["stages","departments","Departments","Department"]).map((x,i)=>normalizeSimple(x,i,"stage")).filter(x=>x.name&&x.active),
      grades:listFrom(src,["grades","Grade","Grades"]).map((x,i)=>normalizeSimple(x,i,"grade")).filter(x=>x.name&&x.active),
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

  function scopeStudentsToCurrentUser(rows=[]){
    const c=global.MishkatSchoolContext?.getContext?.()||{};
    const schoolIds=new Set((c.assignedSchoolIds||[]).map(String)),schoolNames=new Set((c.assignedSchoolNames||[]).map(norm));
    const stageIds=new Set((c.assignedStageIds||[]).map(String)),stageNames=new Set((c.assignedStageNames||[]).map(norm));
    const gradeIds=new Set((c.assignedGradeIds||[]).map(String)),gradeNames=new Set((c.assignedGradeNames||[]).map(norm));
    // SECURITY: School scope is mandatory. Never show a stage-wide student list if Schools is unavailable.
    if(!schoolIds.size&&!schoolNames.size)return [];
    const match=(id,name,ids,names)=>{
      if(!ids.size&&!names.size)return true;
      if(id&&ids.has(String(id)))return true;
      if(name&&names.has(norm(name)))return true;
      return false;
    };
    return (rows||[]).filter(student=>
      match(student.schoolId,student.schoolName,schoolIds,schoolNames)&&
      match(student.stageId,student.stage,stageIds,stageNames)&&
      match(student.gradeId,student.grade,gradeIds,gradeNames)
    );
  }

  let snapshot=normalize(FALLBACK);
  async function loadFromDataApi({supplementOnly=false}={}){
    const store=global.MishkatBubbleStore,config=global.MISHKAT_BUBBLE_CONFIG||{};
    if(!store?.remoteEnabled?.() && !config.dataApiBase && !config.objectApiBase)return null;
    const typeNames=supplementOnly?[
      "School","Department","Grades","Class","Job Titels","job_titles","Job Title","academic year","terms","Users Data","Students",
      "Guidance_Action","Guidance_Way","Guidance_Reason","Guidance_Situ","Guidance_FailType",
      "Guidance_ProblemBehav","Guidance_ProblemEdu","Guidance_Skills","guidance_Studentnotice","Guidance_observ"
    ]:[
      "School","Department","Grades","Class","Job Titels","job_titles","Job Title","academic year","terms","Users Data","Students",
      "Guidance_Action","Guidance_Way","Guidance_Reason","Guidance_Situ","Guidance_FailType",
      "Guidance_ProblemBehav","Guidance_ProblemEdu","Guidance_Skills","guidance_Studentnotice","Guidance_observ"
    ];
    const src={};
    const results=await Promise.allSettled(typeNames.map(async type=>{
      const rows=await store.list(type,[],{sortField:"Modified Date",descending:false});
      return [type,Array.isArray(rows)?rows:[]];
    }));
    let success=0;
    results.forEach((result,index)=>{
      const type=typeNames[index];
      if(result.status==="fulfilled"){
        src[type]=result.value[1];success++;
      }else{
        console.warn(`Bubble directory type unavailable: ${type}`,result.reason);
      }
    });

    // Bubble schema in this deployment:
    // Data type: "Job Titels", label field: "Job Titel".
    // Keep a canonical array so relation IDs from Users Data -> Current Job can resolve.
    const jobCandidates=[
      src["Job Titels"],src["job_titles"],src["Job Title"],src["Job Titles"],src.jobTitles
    ].filter(Array.isArray);
    const populatedJobs=jobCandidates.find(rows=>rows.length);
    if(populatedJobs){
      src.jobTitles=populatedJobs;
      src["Job Titels"]=populatedJobs;
    }

    return success?src:null;
  }
  let activeLoadPromise=null;

  function publishDirectory(incoming,bootstrapLoaded,phase="bootstrap"){
    if(!incoming||typeof incoming!=="object")return snapshot;
    incoming=unwrapIncoming(incoming);
    global.MISHKAT_BUBBLE_DATA=incoming;
    try{localStorage.setItem("mishkat_bubble_directory_snapshot_v1",JSON.stringify(incoming));}catch(_error){}
    try{global.MishkatSchoolContext?.build?.();global.MishkatSchoolContext?.applyDocument?.(document);}catch(_error){}

    const next=normalize(incoming||FALLBACK);
    const beforeScope=next.students.length;
    next.students=scopeStudentsToCurrentUser(next.students);

    // Never erase a previously loaded good student list because of a late empty response.
    if(snapshot?.students?.length && !next.students.length && phase!=="initial-empty"){
      next.students=snapshot.students;
    }
    next.connection={
      authenticated:Boolean(global.MishkatBubbleAuth?.isAuthenticated?.()),
      bootstrapLoaded:Boolean(bootstrapLoaded),
      phase,
      rawStudents:listFrom(incoming||{},["students","student","Students","schoolStudents","school_students"]).length,
      normalizedStudents:next.students.length,
      studentsBeforeSchoolScope:beforeScope,
      schoolScopeApplied:true,
      employees:next.employees.length
    };
    snapshot=next;
    try{
      global.MishkatSchoolContext?.build?.();
      global.MishkatSchoolContext?.applyDocument?.(document);
      global.dispatchEvent(new CustomEvent("mishkat:directory-loaded",{detail:snapshot}));
      global.dispatchEvent(new CustomEvent("mishkat:directory-ready",{detail:snapshot}));
    }catch(_error){}
    return snapshot;
  }

  async function load(options={}){
    const force=Boolean(options?.force);
    if(activeLoadPromise){
      if(!force)return activeLoadPromise;
      try{await activeLoadPromise;}catch(_e){}
    }
    activeLoadPromise=(async()=>{
      let incoming=force?null:(global.MISHKAT_BUBBLE_DATA||null);
      const config=global.MISHKAT_BUBBLE_CONFIG||{};
      let bootstrapLoaded=false;

      // 1) Load the user-scoped bootstrap once, with retry/cache handled by bubble-config.
      if(config.directoryEndpoint){
        try{
          if(typeof config.fetchDirectorySnapshot==="function"){
            incoming=await config.fetchDirectorySnapshot({force});
          }else if(!incoming){
            const response=await fetch(config.directoryEndpoint,{credentials:config.credentials||"include",headers:{"Accept":"application/json",...(config.headers||{})},cache:"no-store"});
            if(!response.ok)throw new Error(`HTTP ${response.status}`);
            incoming=unwrapIncoming(await response.json());
          }
          bootstrapLoaded=Boolean(incoming);
        }catch(error){
          console.warn("Bubble directory bootstrap unavailable; keeping last good snapshot if present.",error);
        }
      }else if(incoming){
        incoming=unwrapIncoming(incoming);
        bootstrapLoaded=true;
      }

      if(!incoming){
        try{incoming=JSON.parse(localStorage.getItem("mishkat_bubble_directory_snapshot_v1")||"null");}catch(_error){}
      }

      // 2) Publish students/scope immediately. Do not wait for Users Data and lookup tables.
      if(incoming&&Object.keys(incoming).length){
        publishDirectory(incoming,bootstrapLoaded,"bootstrap");
      }

      // 3) Load supplementary tables in PARALLEL. This is mainly for employees / names / lookup hydration.
      const supplement=await loadFromDataApi({supplementOnly:true}).catch(error=>{
        console.warn("Bubble directory supplement unavailable.",error);return null;
      });

      if(supplement){
        const merged=incoming?mergeDirectorySources(incoming,supplement):supplement;
        publishDirectory(merged,bootstrapLoaded,"supplement");
        incoming=merged;
      }else if(!incoming){
        const all=await loadFromDataApi().catch(()=>null);
        if(all){incoming=all;publishDirectory(all,false,"data-api");}
      }

      // If every remote source failed, keep the already loaded last-good snapshot rather than replacing it with FALLBACK.
      if(!incoming && !snapshot.students.length && !snapshot.employees.length){
        snapshot=normalize(FALLBACK);
        snapshot.connection={authenticated:Boolean(global.MishkatBubbleAuth?.isAuthenticated?.()),bootstrapLoaded:false,phase:"fallback",rawStudents:0,normalizedStudents:0,studentsBeforeSchoolScope:0,schoolScopeApplied:true,employees:0};
      }
      return snapshot;
    })();

    try{return await activeLoadPromise;}
    finally{activeLoadPromise=null;}
  }
  const classHydrationPromises=new Map();
  async function hydrateStudentClass(idOrName){
    const student=findStudent(idOrName);
    if(!student)return null;
    if(student.className&&student.guardianPhone)return student;
    if(classHydrationPromises.has(student.id))return classHydrationPromises.get(student.id);

    const job=(async()=>{
      const store=global.MishkatBubbleStore;
      let fullStudent=student.raw||{};
      try{
        if(store?.get && student.id && looksLikeBubbleId(student.id)){
          const remote=await store.get("Students",student.id);
          if(remote&&typeof remote==="object")fullStudent={...fullStudent,...remote};
        }
      }catch(error){console.warn("Mishkat: could not hydrate Student for Class.",error);}

      let classRef=pick(fullStudent,[
        "Class","class","Classes","class_name","Class Name","classroom",
        "section","Section","الفصل","اسم الفصل"
      ],"");
      let classThing=classRef;
      let classId=idOf(classRef);

      if(classId && store?.get){
        try{
          const remoteClass=await store.get("Class",classId);
          if(remoteClass&&typeof remoteClass==="object")classThing=remoteClass;
        }catch(error){console.warn("Mishkat: could not hydrate Students -> Class relation.",error);}
      }

      const exactTitel=(classThing&&typeof classThing==="object")
        ? String(pick(classThing,["Titel","titel"],"")||"").trim()
        : "";
      const className=exactTitel||classLabelOf(classThing,fullStudent)||classLabelOf(classRef,fullStudent);
      const resolvedId=idOf(classThing)||classId;
      const parentPhone=parentPhoneOf(fullStudent)||student.guardianPhone||"";

      student.raw=fullStudent;
      if(className)student.className=className;
      if(resolvedId)student.classId=resolvedId;
      if(parentPhone)student.guardianPhone=parentPhone;

      if(student.className){
        try{
          global.dispatchEvent(new CustomEvent("mishkat:student-class-ready",{
            detail:{studentId:student.id,classId:student.classId||"",className:student.className}
          }));
        }catch(_e){}
      }
      return student;
    })();

    classHydrationPromises.set(student.id,job);
    try{return await job;}
    finally{classHydrationPromises.delete(student.id);}
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
    if(student?.stageId||context.stageId)payload.Department=student?.stageId||context.stageId;
    if(student?.schoolId||context.schoolId)payload.school=student?.schoolId||context.schoolId;
    if(student?.gradeId)payload.grade=student.gradeId;
    if(context.termId||term?.id)payload.Terms=context.termId||term.id;
    if(student?.guardianPhone)payload.Phone=student.guardianPhone;
    // Action and situ are Bubble relations (Guidance_Action / Guidance_Situ).
    // They are intentionally not guessed from visible Arabic labels; pass their Bubble IDs when available.
    if(formData.action_id)payload.Action=formData.action_id;
    if(formData.situ_id)payload.situ=formData.situ_id;
    return payload;
  }
  global.MishkatBubbleDirectory={load,refresh:()=>load({force:true}),getSnapshot,setSnapshot,currentAcademicYear,currentTerm,findStudent,hydrateStudentClass,findEmployee,findLookup,normalize,buildGuidanceSituationPayload,schema};global.MishkatSchoolDirectory=global.MishkatBubbleDirectory;
})(window);
