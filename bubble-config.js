"use strict";
/*
 * Mishkat School Platform — Bubble connection settings V1.0.35 STABLE DIRECTORY LOADING
 * Development only: authenticates a real Bubble user, stores the user-scoped token
 * in sessionStorage, and sends it to guidance_bootstrap/Data API.
 * NEVER place a Bubble admin token or user password in this file.
 */
(function(global){
  const TOKEN_KEY="mishkat_bubble_user_token_v1";
  const USER_KEY="mishkat_bubble_user_id_v1";
  const EXPIRES_KEY="mishkat_bubble_token_expires_v1";

  const workflowRoot="https://almeshkat.mgtech.online/version-test/api/1.1/wf";
  const loginEndpoint=`${workflowRoot}/guidance_login_test`;
  const directoryEndpoint=`${workflowRoot}/guidance_bootstrap`;
  const dataApiBase="https://almeshkat.mgtech.online/version-test/api/1.1/obj";

  const storage={
    get(key){try{return sessionStorage.getItem(key)||""}catch(_e){return ""}},
    set(key,value){try{if(value!==undefined&&value!==null&&value!=="")sessionStorage.setItem(key,String(value))}catch(_e){}},
    remove(key){try{sessionStorage.removeItem(key)}catch(_e){}}
  };

  const getToken=()=>storage.get(TOKEN_KEY);

  const LAST_DIRECTORY_KEY="mishkat_last_good_bootstrap_v1";
  let directoryRequestPromise=null;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const hasUsefulDirectory=data=>{
    if(!data||typeof data!=="object")return false;
    const list=key=>Array.isArray(data?.[key])?data[key]:[];
    // A logged-in school user should normally have at least a school or department.
    // Students may legitimately be empty, so they are not the sole validity signal.
    return list("schools").length>0 || list("departments").length>0 || list("students").length>0;
  };
  const readLastGoodDirectory=()=>{
    try{
      const raw=sessionStorage.getItem(LAST_DIRECTORY_KEY);
      return raw?JSON.parse(raw):null;
    }catch(_e){return null;}
  };
  const saveLastGoodDirectory=data=>{
    if(!hasUsefulDirectory(data))return;
    try{sessionStorage.setItem(LAST_DIRECTORY_KEY,JSON.stringify(data));}catch(_e){}
  };

  async function fetchDirectorySnapshot({force=false,retries=3}={}){
    if(!force && directoryRequestPromise)return directoryRequestPromise;
    directoryRequestPromise=(async()=>{
      let lastError=null;
      for(let attempt=1;attempt<=Math.max(1,retries);attempt++){
        try{
          const token=getToken();
          if(!token)throw new Error("bubble_user_token_missing");
          const response=await fetch(directoryEndpoint,{
            method:"GET",
            credentials:"omit",
            headers:{Accept:"application/json",Authorization:`Bearer ${token}`},
            cache:"no-store"
          });
          if(!response.ok)throw new Error(`HTTP ${response.status}`);
          const payload=await response.json();
          const normalized=normalizeDirectoryPayload(payload);
          if(!hasUsefulDirectory(normalized))throw new Error("bootstrap_scope_empty");
          saveLastGoodDirectory(normalized);
          return normalized;
        }catch(error){
          lastError=error;
          if(attempt<retries)await sleep(250*attempt);
        }
      }
      const cached=readLastGoodDirectory();
      if(hasUsefulDirectory(cached)){
        console.warn("Mishkat: using last good Bubble bootstrap snapshot after transient failure.",lastError);
        return cached;
      }
      throw lastError||new Error("guidance_bootstrap_failed");
    })();
    try{return await directoryRequestPromise;}
    finally{directoryRequestPromise=null;}
  }

  function normalizeDirectoryPayload(payload){
    let data=payload?.response??payload?.data??payload??{};
    if(data?.response && typeof data.response==="object" && !Array.isArray(data.response))data=data.response;
    if(!data || typeof data!=="object" || Array.isArray(data))data={};
    const out={...data};
    const arr=(...keys)=>{for(const key of keys){if(Array.isArray(data?.[key]))return data[key];}return [];};
    out.schools=arr("schools","school","Schools","School");
    out.departments=arr("departments","Departments","Department","Dep list","dep_list");
    out.grades=arr("grades","Grade","Grades");
    out.students=arr("students","student","Students","schoolStudents","school_students");
    out.studentClasses=arr("student_classes","studentClasses","Student Classes","student classes");
    out.employees=arr("employees","employee","Users Data","usersData","users_data","staff","schoolEmployees","school_employees");
    out.academicYears=arr("academicYears","academic_years","academic year","years");
    out.terms=arr("terms","academicTerms","academic_terms","semesters");
    const currentYear=data.current_academic_year||data.currentAcademicYear||data["current academic year"]||null;
    if(currentYear){
      const currentId=String(currentYear?._id||currentYear?.id||currentYear?.["unique id"]||currentYear?.["Unique ID"]||"");
      out.academicYears=out.academicYears.map(y=>{
        const yid=String(y?._id||y?.id||y?.["unique id"]||y?.["Unique ID"]||"");
        return currentId&&yid===currentId?{...y,Active:true}:y;
      });
      out.currentAcademicYear=currentYear;
    }
    // guidance_bootstrap already scopes these lists from Current User -> user data.
    // Create a synthetic Users Data context so the existing UI can understand multi-school assignment
    // without requiring Full Name/User ID parameters in the endpoint.
    if(!out.currentUsersData && !out.current_users_data){
      out.currentUsersData={
        "Schools":out.schools,
        "Dep list":out.departments,
        "Grades":out.grades,
        "Students":out.students,
        "User":storage.get(USER_KEY)||""
      };
    }
    out.__mishkatScope={
      source:"guidance_bootstrap",
      authoritativeStudents:true,
      studentsFromUsersData:true,
      enforceSchoolIntersection:true,
      assignedSchools:true,
      assignedDepartments:true,
      assignedGrades:true
    };
    return out;
  }
  const authHeaders={};
  Object.defineProperty(authHeaders,"Authorization",{
    enumerable:true,
    get(){const token=getToken();return token?`Bearer ${token}`:undefined;}
  });

  const findDeep=(obj,key,depth=0)=>{
    if(depth>6||obj==null)return "";
    if(typeof obj!=="object")return "";
    if(obj[key]!==undefined&&obj[key]!==null&&obj[key]!=="")return obj[key];
    for(const value of Object.values(obj)){
      if(value&&typeof value==="object"){
        const found=findDeep(value,key,depth+1);
        if(found!=="")return found;
      }
    }
    return "";
  };

  async function login(email,password){
    email=String(email||"").trim();password=String(password||"");
    if(!email||!password)throw new Error("اكتب البريد الإلكتروني وكلمة المرور");
    const response=await fetch(loginEndpoint,{
      method:"POST",
      headers:{Accept:"application/json","Content-Type":"application/json"},
      body:JSON.stringify({email,password}),
      cache:"no-store"
    });
    const text=await response.text();
    let payload={};
    try{payload=text?JSON.parse(text):{}}catch(_e){payload={message:text}}
    if(!response.ok)throw new Error(payload?.message||payload?.error||`فشل تسجيل الدخول (${response.status})`);
    const token=String(findDeep(payload,"token")||"");
    if(!token)throw new Error("تم تنفيذ تسجيل الدخول لكن Bubble لم يرجع token. راجع Log the user in في guidance_login_test.");
    storage.set(TOKEN_KEY,token);
    storage.set(USER_KEY,findDeep(payload,"user_id")||findDeep(payload,"userId")||"");
    storage.set(EXPIRES_KEY,findDeep(payload,"expires")||"");
    try{
      localStorage.removeItem("mishkat_bubble_directory_snapshot_v1");
      localStorage.removeItem("mishkat_school_user_context_v4");
      localStorage.removeItem("mishkat_school_user_context_v3");
      localStorage.removeItem("mishkat_school_user_context_v2");
      sessionStorage.removeItem(LAST_DIRECTORY_KEY);
    }catch(_e){}
    global.dispatchEvent(new CustomEvent("mishkat:bubble-auth-changed",{detail:{authenticated:true}}));
    return payload;
  }

  function logout(){
    storage.remove(TOKEN_KEY);storage.remove(USER_KEY);storage.remove(EXPIRES_KEY);
    try{
      localStorage.removeItem("mishkat_bubble_directory_snapshot_v1");
      localStorage.removeItem("mishkat_school_user_context_v4");
      localStorage.removeItem("mishkat_school_user_context_v3");
      localStorage.removeItem("mishkat_school_user_context_v2");
      sessionStorage.removeItem(LAST_DIRECTORY_KEY);
    }catch(_e){}
    global.dispatchEvent(new CustomEvent("mishkat:bubble-auth-changed",{detail:{authenticated:false}}));
  }

  function injectLoginStyle(){
    if(document.getElementById("mishkatBubbleTestLoginStyle"))return;
    const style=document.createElement("style");style.id="mishkatBubbleTestLoginStyle";
    style.textContent=`
      .mbtl-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(8,31,20,.58);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Tahoma,Arial,sans-serif;direction:rtl}
      .mbtl-card{width:min(440px,100%);background:#fff;border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,.28);overflow:hidden;border:1px solid rgba(29,96,51,.15)}
      .mbtl-head{padding:22px 24px;background:linear-gradient(135deg,#155d34,#257441);color:#fff}.mbtl-head b{display:block;font-size:20px;margin-bottom:5px}.mbtl-head span{font-size:13px;opacity:.9}
      .mbtl-body{padding:22px 24px}.mbtl-note{font-size:13px;line-height:1.75;color:#53635a;background:#f4f8f5;border:1px solid #e1ebe4;border-radius:14px;padding:11px 13px;margin-bottom:16px}
      .mbtl-field{display:block;margin:12px 0}.mbtl-field span{display:block;font-size:13px;font-weight:700;color:#274735;margin-bottom:7px}.mbtl-field input{width:100%;box-sizing:border-box;border:1px solid #cddbd1;border-radius:12px;padding:12px 13px;font-size:15px;outline:none}.mbtl-field input:focus{border-color:#2e7b4d;box-shadow:0 0 0 3px rgba(46,123,77,.10)}
      .mbtl-submit{width:100%;border:0;border-radius:13px;padding:13px 16px;background:#1c6a3c;color:#fff;font-size:15px;font-weight:800;cursor:pointer;margin-top:8px}.mbtl-submit:disabled{opacity:.6;cursor:wait}
      .mbtl-error{display:none;margin-top:12px;color:#a11b1b;background:#fff0f0;border:1px solid #f3cccc;border-radius:11px;padding:10px 12px;font-size:13px;line-height:1.6}.mbtl-error.show{display:block}
      .mbtl-foot{text-align:center;color:#7a877f;font-size:11px;margin-top:14px}
    `;
    document.head.appendChild(style);
  }

  function showTestLogin(){
    if(getToken()||document.getElementById("mishkatBubbleTestLogin"))return;
    injectLoginStyle();
    const wrap=document.createElement("div");wrap.id="mishkatBubbleTestLogin";wrap.className="mbtl-backdrop";
    wrap.innerHTML=`<form class="mbtl-card" id="mishkatBubbleTestLoginForm" autocomplete="on">
      <div class="mbtl-head"><b>دخول تجريبي — التوجيه الطلابي</b><span>اختبار الربط مع قاعدة بيانات مدارس المشكاة</span></div>
      <div class="mbtl-body">
        <div class="mbtl-note">استخدم نفس حساب المستخدم الموجود في Bubble. بيانات الدخول لا تُحفظ داخل ملفات GitHub، ويتم الاحتفاظ بالـ token داخل جلسة المتصفح فقط.</div>
        <label class="mbtl-field"><span>البريد الإلكتروني</span><input id="mbtlEmail" type="email" autocomplete="username" required></label>
        <label class="mbtl-field"><span>كلمة المرور</span><input id="mbtlPassword" type="password" autocomplete="current-password" required></label>
        <button class="mbtl-submit" id="mbtlSubmit" type="submit">دخول واختبار بياناتي</button>
        <div class="mbtl-error" id="mbtlError"></div>
        <div class="mbtl-foot">بيئة الاختبار: Bubble version-test</div>
      </div>
    </form>`;
    document.body.appendChild(wrap);
    const form=wrap.querySelector("#mishkatBubbleTestLoginForm"),button=wrap.querySelector("#mbtlSubmit"),error=wrap.querySelector("#mbtlError");
    form.addEventListener("submit",async e=>{
      e.preventDefault();error.classList.remove("show");error.textContent="";button.disabled=true;button.textContent="جارٍ تسجيل الدخول...";
      try{
        await login(wrap.querySelector("#mbtlEmail").value,wrap.querySelector("#mbtlPassword").value);
        button.textContent="تم الدخول — جارٍ تحميل بياناتك...";
        location.reload();
      }catch(err){
        error.textContent=err?.message||"تعذر تسجيل الدخول";error.classList.add("show");button.disabled=false;button.textContent="دخول واختبار بياناتي";
      }
    });
  }

  global.MishkatBubbleAuth={
    login,logout,getToken,
    isAuthenticated:()=>Boolean(getToken()),
    getUserId:()=>storage.get(USER_KEY),
    showTestLogin
  };

  global.MISHKAT_BUBBLE_CONFIG=Object.assign({
    loginEndpoint,
    directoryEndpoint,
    dataApiBase,
    credentials:"omit",
    timeoutMs:12000,
    headers:authHeaders,
    tokenProvider:async()=>getToken(),
    normalizeDirectoryPayload,
    fetchDirectorySnapshot,
    typeApiNames:{
      "academic year":"academic year","Users Data":"Users Data","Students":"Students","terms":"terms","School":"School","Department":"Department","Grades":"Grades","Class":"Class","Job Title":"Job Title",
      "Guidance_Attandance":"Guidance_Attandance","Guidance_Cases":"Guidance_Cases","Guidance_Collective":"Guidance_Collective","Guidance_Contact":"Guidance_Contact","guidance_Fail":"guidance_Fail","Guidance_FailType":"Guidance_FailType","Guidance_Late":"Guidance_Late","Guidance_Log":"Guidance_Log","Guidance_Mettings":"Guidance_Mettings","Guidance_observ":"Guidance_observ","Guidance_Observation":"Guidance_Observation","Guidance_Periodic":"Guidance_Periodic","Guidance_ProblemBehav":"Guidance_ProblemBehav","Guidance_ProblemEdu":"Guidance_ProblemEdu","Guidance_Project":"Guidance_Project","Guidance_Project_Progress":"Guidance_Project_Progress","Guidance_Reason":"Guidance_Reason","Guidance_Situ":"Guidance_Situ","Guidance_Situation":"Guidance_Situation","Guidance_Skills":"Guidance_Skills","Guidance_Statistics":"Guidance_Statistics","guidance_Studentnotice":"guidance_Studentnotice","Guidance_SubCollective":"Guidance_SubCollective","Guidance_Way":"Guidance_Way","Guidance_Action":"Guidance_Action","Guidance_Behav":"Guidance_Behav","Guidance_Edu":"Guidance_Edu",
      "Guidance_Plan":"Guidance_Plan","Guidance_Plan_Item":"Guidance_Plan_Item","Guidance_Event":"Guidance_Event","Guidance_Message":"Guidance_Message","Guidance_Presentation":"Guidance_Presentation","Guidance_Certificate":"Guidance_Certificate","Guidance_Template":"Guidance_Template"
    }
  },global.MISHKAT_BUBBLE_CONFIG||{});

  function boot(){if(!getToken())showTestLogin();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
