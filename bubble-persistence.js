"use strict";
/*
 * Mishkat School Platform — Bubble persistence bridge V1.0.65
 * Schema-aware storage for Guidance_Plan, Guidance_Plan_Item, Guidance_Event,
 * Guidance_Message, Guidance_Presentation, Guidance_Certificate, Guidance_Template.
 *
 * Security: no Bubble admin/API token is embedded here. If a live Data API or
 * Backend Workflow is configured, authentication must come from the hosting
 * environment or a safe user-scoped token/provider.
 */
(function(global){
  if(global.MishkatBubbleStore)return;
  const schema=global.MISHKAT_BUBBLE_SCHEMA||{dataTypes:{},fields:{}};
  const cfg=()=>global.MISHKAT_BUBBLE_CONFIG||{};
  const escType=t=>encodeURIComponent(String(t||"")).replace(/%2F/gi,"/");
  const safeParse=(v,f=null)=>{try{return JSON.parse(v)}catch(_e){return f}};
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const now=()=>new Date().toISOString();
  const uid=()=>global.MishkatSchoolContext?.getContext?.()?.id||"school-user";
  const localKey=t=>`mishkat_bubble_fallback_v2:${t}:${uid()}`;
  const idOf=v=>String(v?._id||v?.id||v?.unique_id||v?.["unique id"]||v?.["Unique ID"]||"");
  const ctx=()=>global.MishkatSchoolContext?.getContext?.()||{};
  const typeName=key=>schema?.dataTypes?.[key]||key;
  const fieldMap=key=>schema?.fields?.[key]||{};
  const localRows=t=>safeParse(localStorage.getItem(localKey(t)),[])||[];
  const setLocalRows=(t,rows)=>{try{localStorage.setItem(localKey(t),JSON.stringify(rows||[]))}catch(_e){}};
  const randomId=()=>global.crypto?.randomUUID?.()||`local-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const getToken=async()=>{
    const c=cfg();
    if(typeof c.tokenProvider==="function")return await c.tokenProvider();
    return c.userToken||c.authToken||"";
  };
  const headers=async(extra={})=>{
    const c=cfg(),token=await getToken();
    return {Accept:"application/json","Content-Type":"application/json",...(c.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...extra};
  };
  const remoteEnabled=()=>Boolean(cfg().dataApiBase||cfg().objectApiBase);
  const base=()=>String(cfg().dataApiBase||cfg().objectApiBase||"").replace(/\/$/,"");
  const apiType=t=>cfg()?.typeApiNames?.[t]||t;
  const timeout=(promise,ms=12000)=>Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error("bubble_timeout")),ms))]);
  async function request(url,options={}){
    const c=cfg(),method=options.method||"GET";
    let r;
    try{
      r=await timeout(fetch(url,{method,credentials:c.credentials||"include",headers:await headers(options.headers),body:options.body===undefined?undefined:JSON.stringify(options.body),cache:"no-store"}),Number(c.timeoutMs)||12000);
    }catch(error){
      error.method=method;error.url=url;error.status=Number(error?.status||0);
      if(String(error?.message||"").includes("bubble_timeout"))error.code="BUBBLE_TIMEOUT";
      else error.code=error.code||"BUBBLE_NETWORK";
      throw error;
    }
    const txt=await r.text();const data=txt?safeParse(txt,txt):null;
    if(!r.ok){const detail=typeof data==="string"?data:(data?.message||data?.error||data?.body||"");const e=new Error(detail||`HTTP ${r.status}`);e.status=r.status;e.data=data;e.method=method;e.url=url;throw e}
    return data;
  }
  function normalizeResponse(data){
    if(Array.isArray(data))return data;
    if(Array.isArray(data?.response?.results))return data.response.results;
    if(Array.isArray(data?.response))return data.response;
    if(Array.isArray(data?.results))return data.results;
    return data?.response||data;
  }
  const planWorkflowEnabled=()=>Boolean(cfg().planSaveEndpoint);
  const planUpdateWorkflowEnabled=()=>Boolean(cfg().planUpdateEndpoint);
  const planDeleteWorkflowEnabled=()=>Boolean(cfg().planDeleteEndpoint);
  const PLAN_WORKFLOW_MARKER_PREFIX="mishkat_plan_workflow_saved_v1:";
  const normalizeLabel=value=>String(value??"").trim().toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/\s+/g," ");
  function thingLabel(value){
    if(value==null)return "";
    if(typeof value==="string"||typeof value==="number")return String(value);
    for(const key of ["title","Title","name","Name","Full Name","School Name","Dep. Name","Grade Name","Term","term","label","Label"]){
      const v=value?.[key];if(typeof v==="string"&&v.trim())return v.trim();
    }
    for(const [key,v] of Object.entries(value||{})){
      if(/^(id|_id|unique.?id|created|modified|slug)/i.test(key))continue;
      if(typeof v==="string"&&v.trim())return v.trim();
    }
    return "";
  }
  function sourceRows(keys=[]){
    const src=global.MISHKAT_BUBBLE_DATA||{};
    for(const key of keys){const rows=src?.[key];if(Array.isArray(rows)&&rows.length)return rows;}
    return [];
  }
  function thingIdForLabel(keys,label,fallback=""){
    const wanted=normalizeLabel(label);
    if(wanted){
      const rows=sourceRows(keys);
      const exact=rows.find(row=>normalizeLabel(thingLabel(row))===wanted);
      if(exact&&idOf(exact))return idOf(exact);
      const loose=rows.find(row=>{const t=normalizeLabel(thingLabel(row));return t&&(t.includes(wanted)||wanted.includes(t));});
      if(loose&&idOf(loose))return idOf(loose);
    }
    return String(fallback||"");
  }
  function workflowPlanIdentity(payload){
    return [uid(),payload?.grade,payload?.school,payload?.department,payload?.academic_year,payload?.term].map(v=>String(v||"").trim()).join("|");
  }
  function workflowPlanMarkerKey(payload){return PLAN_WORKFLOW_MARKER_PREFIX+workflowPlanIdentity(payload);}
  function isWorkflowPlanKnown(payload){try{return localStorage.getItem(workflowPlanMarkerKey(payload))==="1"}catch(_e){return false}}
  function rememberWorkflowPlan(payload){try{localStorage.setItem(workflowPlanMarkerKey(payload),"1")}catch(_e){}}
  function forgetWorkflowPlan(payload){try{localStorage.removeItem(workflowPlanMarkerKey(payload))}catch(_e){}}
  function rememberWorkflowPlanRow(row){
    const fm=fieldMap("guidancePlan");
    const payload={
      grade:row?.[fm.grade||"Grade"],
      school:row?.[fm.school||"School"],
      department:row?.[fm.department||"Department"],
      academic_year:row?.[fm.academicYear||"AcademicYear"],
      term:row?.[fm.term||"Term"]
    };
    if(payload.grade&&payload.school&&payload.department&&payload.academic_year&&payload.term)rememberWorkflowPlan(payload);
  }
  function workflowPlanPayload(plan){
    const c=ctx(),form=plan?.form||{},progress=plan?.progress||{};
    const grade=String(c.gradeId||(c.assignedGradeIds||[])[0]||"");
    const school=String(c.schoolId||(c.assignedSchoolIds||[])[0]||"");
    const department=String(c.stageId||(c.assignedStageIds||[])[0]||"");
    const academicYear=thingIdForLabel(["academicYears","academic_years","academic year","years"],form.academicYear,c.academicYearId);
    const term=thingIdForLabel(["terms","academicTerms","academic_terms","semesters"],form.termName,c.termId);
    const required=[["grade",grade,"المدرسة (Grade)"],["school",school,"المجمع (School)"],["department",department,"المرحلة (Department)"],["academic_year",academicYear,"العام الدراسي"],["term",term,"الفصل الدراسي"]];
    const missing=required.filter(([,value])=>!String(value||"").trim()).map(([, ,label])=>label);
    if(missing.length){const e=new Error(`تعذر تجهيز مرجع ${missing.join("، ")} من توزيع المستخدم في Bubble.`);e.code="PLAN_WORKFLOW_CONTEXT_MISSING";throw e;}
    return {
      grade,
      school,
      title:String(form.title||"خطة الموجه الطلابي"),
      term,
      academic_year:academicYear,
      department,
      notes:planMetaPayload(plan),
      status:Number(progress.percent||0)>=100?"completed":"in_progress",
      active:true
    };
  }
  function workflowPlanDeletePayload(source){
    const fm=fieldMap("guidancePlan"),c=ctx();
    const row=source?.__bubbleRow||source?.row||source||{};
    const meta=readPlanMeta(row),form=meta?.form||source?.form||{};
    const grade=String(row?.[fm.grade||"Grade"]||c.gradeId||(c.assignedGradeIds||[])[0]||"");
    const school=String(row?.[fm.school||"School"]||c.schoolId||(c.assignedSchoolIds||[])[0]||"");
    const department=String(row?.[fm.department||"Department"]||c.stageId||(c.assignedStageIds||[])[0]||"");
    const academicYear=String(row?.[fm.academicYear||"AcademicYear"]||thingIdForLabel(["academicYears","academic_years","academic year","years"],form.academicYear||source?.academic_year,c.academicYearId)||"");
    const term=String(row?.[fm.term||"Term"]||thingIdForLabel(["terms","academicTerms","academic_terms","semesters"],form.termName||source?.term_name,c.termId)||"");
    const payload={grade,school,department,academic_year:academicYear,term};
    const required=[["grade",grade,"المدرسة (Grade)"],["school",school,"المجمع (School)"],["department",department,"المرحلة (Department)"],["academic_year",academicYear,"العام الدراسي"],["term",term,"الفصل الدراسي"]];
    const missing=required.filter(([,value])=>!String(value||"").trim()).map(([, ,label])=>label);
    if(missing.length){const e=new Error(`تعذر تجهيز مرجع ${missing.join("، ")} لحذف الخطة من Bubble.`);e.code="PLAN_DELETE_WORKFLOW_CONTEXT_MISSING";throw e;}
    return payload;
  }
  async function deletePlanViaWorkflow(source){
    const endpoint=String(cfg().planDeleteEndpoint||"").trim();
    if(!endpoint){const e=new Error("PLAN_DELETE_WORKFLOW_NOT_CONFIGURED");e.code="PLAN_DELETE_WORKFLOW_NOT_CONFIGURED";throw e;}
    const payload=workflowPlanDeletePayload(source);
    let raw;
    try{raw=await request(endpoint,{method:"POST",body:payload});}
    catch(error){
      const status=Number(error?.status||0),detail=String(error?.message||"").trim();
      let message="تعذر حذف الخطة عبر guidance_delete_plan في Bubble.";
      if(status===401)message="جلسة Bubble غير صالحة أثناء حذف الخطة. سجّل الخروج ثم الدخول مرة أخرى.";
      else if(status===403)message="Bubble رفض تشغيل guidance_delete_plan للمستخدم الحالي. تأكد أن الـAPI Workflow يتطلب مستخدمًا مسجلًا وأنه Exposed.";
      else if(status===404)message="لم يتم العثور على API Workflow باسم guidance_delete_plan في بيئة Development.";
      else if(status===400||status===422)message=`Bubble رفض Parameters المرسلة إلى guidance_delete_plan: ${detail||`HTTP ${status}`}`;
      else if(status>=500)message=`حدث خطأ داخل Backend Workflow guidance_delete_plan (HTTP ${status}).`;
      const e=new Error(message);e.cause=error;e.status=status;e.originalMessage=detail;e.code="PLAN_WORKFLOW_DELETE_FAILED";throw e;
    }
    const out=raw?.response&&typeof raw.response==="object"?raw.response:(raw||{});
    const successValue=out?.success;
    const success=successValue===true||successValue===1||["yes","true","1"].includes(String(successValue||"").toLowerCase());
    if(!success){const e=new Error(String(out?.message||"Bubble لم يؤكد نجاح حذف الخطة عبر guidance_delete_plan."));e.code="PLAN_WORKFLOW_DELETE_NOT_CONFIRMED";e.data=raw;throw e;}
    forgetWorkflowPlan(payload);
    return {success:true,__bubbleVerified:true,__deleteChannel:"workflow",__workflow:"guidance_delete_plan",__message:String(out?.message||"تم حذف الخطة بنجاح")};
  }
  async function savePlanViaWorkflow(plan,existingId=""){
    const payload=workflowPlanPayload(plan);
    const shouldUpdate=Boolean(String(existingId||"").trim())||isWorkflowPlanKnown(payload);
    const endpoint=String(shouldUpdate?(cfg().planUpdateEndpoint||""):(cfg().planSaveEndpoint||"")).trim();
    const workflowName=shouldUpdate?"guidance_update_plan":"guidance_save_plan";
    if(!endpoint){
      const e=new Error(shouldUpdate?"PLAN_UPDATE_WORKFLOW_NOT_CONFIGURED":"PLAN_SAVE_WORKFLOW_NOT_CONFIGURED");
      e.code=shouldUpdate?"PLAN_UPDATE_WORKFLOW_NOT_CONFIGURED":"PLAN_SAVE_WORKFLOW_NOT_CONFIGURED";
      throw e;
    }
    let raw;
    try{raw=await request(endpoint,{method:"POST",body:payload});}
    catch(error){
      const status=Number(error?.status||0),detail=String(error?.message||"").trim();
      let message=`تعذر ${shouldUpdate?"تحديث":"حفظ"} الخطة عبر ${workflowName} في Bubble.`;
      if(status===401)message=`جلسة Bubble غير صالحة أثناء ${shouldUpdate?"تحديث":"حفظ"} الخطة. سجّل الخروج ثم الدخول مرة أخرى.`;
      else if(status===403)message=`Bubble رفض تشغيل ${workflowName} للمستخدم الحالي. تأكد أن الـAPI Workflow يتطلب مستخدمًا مسجلًا وأنه Exposed.`;
      else if(status===404)message=`لم يتم العثور على API Workflow باسم ${workflowName} في بيئة Development.`;
      else if(status===400||status===422)message=`Bubble رفض Parameters المرسلة إلى ${workflowName}: ${detail||`HTTP ${status}`}`;
      else if(status>=500)message=`حدث خطأ داخل Backend Workflow ${workflowName} (HTTP ${status}).`;
      const e=new Error(message);e.cause=error;e.status=status;e.originalMessage=detail;e.code=shouldUpdate?"PLAN_WORKFLOW_UPDATE_FAILED":"PLAN_WORKFLOW_SAVE_FAILED";throw e;
    }
    const out=raw?.response&&typeof raw.response==="object"?raw.response:(raw||{});
    const successValue=out?.success;
    const success=successValue===true||successValue===1||["yes","true","1"].includes(String(successValue||"").toLowerCase());
    if(!success){const e=new Error(String(out?.message||`Bubble لم يؤكد نجاح ${shouldUpdate?"تحديث":"حفظ"} الخطة عبر ${workflowName}.`));e.code=shouldUpdate?"PLAN_WORKFLOW_UPDATE_NOT_CONFIRMED":"PLAN_WORKFLOW_NOT_CONFIRMED";e.data=raw;throw e;}
    rememberWorkflowPlan(payload);
    const rid=String(out?.plan_id||out?.planId||out?.id||out?._id||(existingId&&!String(existingId).startsWith("workflow:")?existingId:"")||"");
    return {
      Title:payload.title,Notes:payload.notes,Status:payload.status,Active:true,
      ...(rid?{_id:rid,id:rid}:{}),
      __bubbleVerified:true,__saveChannel:"workflow",__workflow:workflowName,__workflowMode:shouldUpdate?"update":"create",
      __message:String(out?.message||(shouldUpdate?"تم تحديث الخطة بنجاح":"تم حفظ الخطة بنجاح")),
      __itemSyncOk:null,__existingIdReceived:String(existingId||"")
    };
  }
  async function remoteList(t,constraints=[],sortField="Modified Date",descending=true){
    const all=[];let cursor=0;let remaining=1;let page=0;
    while(remaining>0 && page<100){
      const params=new URLSearchParams();
      if(constraints.length)params.set("constraints",JSON.stringify(constraints));
      if(sortField)params.set("sort_field",sortField);
      if(descending)params.set("descending","true");
      params.set("limit","100");params.set("cursor",String(cursor));
      const url=`${base()}/${escType(apiType(t))}?${params}`;
      const raw=await request(url);
      const payload=raw?.response&&typeof raw.response==="object"?raw.response:raw;
      const rows=Array.isArray(payload?.results)?payload.results:(Array.isArray(payload)?payload:[]);
      all.push(...rows);
      const reportedRemaining=Number(payload?.remaining);
      remaining=Number.isFinite(reportedRemaining)?reportedRemaining:0;
      const reportedCursor=Number(payload?.cursor);
      cursor=(Number.isFinite(reportedCursor)?reportedCursor:cursor)+rows.length;
      if(!rows.length)break;
      page++;
    }
    return all;
  }
  async function remoteGet(t,id){return normalizeResponse(await request(`${base()}/${escType(apiType(t))}/${encodeURIComponent(id)}`));}
  async function remoteCreate(t,body){
    const data=normalizeResponse(await request(`${base()}/${escType(apiType(t))}`,{method:"POST",body}));
    const id=String(data?.id||data?._id||data?.unique_id||data?.["unique id"]||"");
    return {...body,...(typeof data==="object"?data:{}),...(id?{_id:id,id}:{}),"Modified Date":now(),"Created Date":now()};
  }
  async function remoteUpdate(t,id,body){
    const data=normalizeResponse(await request(`${base()}/${escType(apiType(t))}/${encodeURIComponent(id)}`,{method:"PATCH",body}));
    return {...body,...(typeof data==="object"?data:{}),_id:id,id,"Modified Date":now()};
  }
  async function remoteDelete(t,id){await request(`${base()}/${escType(apiType(t))}/${encodeURIComponent(id)}`,{method:"DELETE"});return true;}
  const planStorageTypes=()=>new Set([typeName("guidancePlan"),typeName("guidancePlanItem")]);
  const isPlanStorageType=t=>planStorageTypes().has(String(t||""));
  function planStorageError(error,action="save",resource="Guidance_Plan"){
    const status=Number(error?.status||0),raw=String(error?.message||"").trim();
    let message="تعذر الاتصال بقاعدة بيانات Bubble الخاصة بالمدرسة.";
    if(status===401)message=`انتهت أو رُفضت جلسة Bubble أثناء ${action==="save"?"الحفظ":"قراءة الخطة"}. سجّل الخروج ثم الدخول مرة أخرى.`;
    else if(status===403)message=`Bubble منع ${action==="save"?"الكتابة":"القراءة"} على جدول ${resource}. فعّل صلاحية Data API المناسبة وPrivacy Rule للمستخدم الحالي.`;
    else if(status===404)message=`جدول ${resource} غير متاح عبر Data API في بيئة Development. فعّل هذا الـData Type من Bubble > Settings > API.`;
    else if(status===405)message=`Bubble يسمح بقراءة ${resource} لكنه لا يسمح بإنشاء/تعديل السجلات عبر Data API. فعّل Create/Modify via API لهذا الجدول.`;
    else if(status===400||status===422)message=`Bubble رفض بيانات ${resource}. سيتم استخدام الحقول الأساسية فقط إن أمكن. التفاصيل: ${raw||`HTTP ${status}`}`;
    else if(status===429)message="Bubble استقبل طلبات كثيرة في وقت قصير. أعد المحاولة بعد لحظات.";
    else if(status>=500)message=`خدمة Bubble أعادت خطأ خادم HTTP ${status}. أعد المحاولة بعد لحظات.`;
    else if(String(error?.message||"").includes("bubble_timeout"))message="انتهت مهلة الاتصال بـ Bubble أثناء حفظ الخطة. لم يتم اعتبار الخطة محفوظة.";
    else if(String(error?.message||"").includes("bubble_plan_id_missing"))message="Bubble استقبل طلب الخطة لكنه لم يُرجع Unique ID حقيقيًا؛ لذلك لم يتم اعتماد الحفظ.";
    else if(String(error?.message||"").includes("bubble_plan_verify_failed"))message="تم إرسال الخطة إلى Bubble لكن تعذر التحقق من السجل بعد الحفظ؛ لذلك لم يتم إعلان نجاح العملية.";
    else if(String(error?.message||"").includes("bubble_remote_not_configured"))message="اتصال Bubble غير مهيأ، لذلك لا يمكن حفظ الخطة في قاعدة المدرسة.";
    else if(error?.code==="BUBBLE_NETWORK"||status===0)message=`تعذر الوصول إلى Bubble من المتصفح أثناء ${action==="save"?"الحفظ":"القراءة"}. ${raw&&raw!=="Failed to fetch"?raw:"تحقق من الاتصال ثم أعد المحاولة."}`;
    const e=new Error(message);e.cause=error;e.status=status;e.action=action;e.resource=resource;e.originalMessage=raw;e.code=error?.code||"";return e;
  }
  async function savePlanRemoteOnly(t,body,id=""){
    if(!remoteEnabled())throw planStorageError(new Error("bubble_remote_not_configured"));
    try{
      const row=id?await remoteUpdate(t,id,body):await remoteCreate(t,body);
      const rid=idOf(row)||String(id||"");
      if(!rid||rid.startsWith("local-"))throw new Error("bubble_plan_id_missing");
      return {...row,_id:rid,id:rid};
    }catch(error){throw planStorageError(error,"save",t);}
  }
  async function listPlanRemoteOnly(t,constraints=[],options={}){
    if(!remoteEnabled())throw planStorageError(new Error("bubble_remote_not_configured"),"list");
    try{return await remoteList(t,constraints,options.sortField,options.descending!==false)}catch(error){throw planStorageError(error,"list",t);}
  }
  async function getPlanRemoteOnly(t,id){
    if(!remoteEnabled())throw planStorageError(new Error("bubble_remote_not_configured"),"get");
    try{return await remoteGet(t,id)}catch(error){throw planStorageError(error,"get",t);}
  }
  async function removePlanRemoteOnly(t,id){
    if(!remoteEnabled())throw planStorageError(new Error("bubble_remote_not_configured"),"delete");
    try{return await remoteDelete(t,id)}catch(error){throw planStorageError(error,"delete",t);}
  }
  function localList(t,constraints=[]){
    let rows=localRows(t);
    for(const c of constraints){if(c?.constraint_type!=="equals")continue;rows=rows.filter(r=>String(r?.[c.key]??"")===String(c.value??""));}
    return rows.sort((a,b)=>String(b["Modified Date"]||"").localeCompare(String(a["Modified Date"]||"")));
  }
  function localGet(t,id){return localRows(t).find(r=>idOf(r)===String(id))||null;}
  function localSave(t,body,id=""){
    const rows=localRows(t),stamp=now();let row;
    if(id){const i=rows.findIndex(r=>idOf(r)===String(id));row={...(i>=0?rows[i]:{}),...clone(body),_id:String(id),id:String(id),"Modified Date":stamp};if(i>=0)rows[i]=row;else rows.unshift(row);}else{const rid=randomId();row={...clone(body),_id:rid,id:rid,"Created Date":stamp,"Modified Date":stamp};rows.unshift(row);}
    setLocalRows(t,rows);return row;
  }
  function localDelete(t,id){setLocalRows(t,localRows(t).filter(r=>idOf(r)!==String(id)));return true;}
  async function list(t,constraints=[],options={}){
    if(isPlanStorageType(t))return listPlanRemoteOnly(t,constraints,options);
    if(remoteEnabled())try{return await remoteList(t,constraints,options.sortField,options.descending!==false)}catch(e){console.warn(`Bubble list fallback: ${t}`,e)}
    return localList(t,constraints);
  }
  async function get(t,id){
    if(isPlanStorageType(t))return getPlanRemoteOnly(t,id);
    if(remoteEnabled())try{return await remoteGet(t,id)}catch(e){console.warn(`Bubble get fallback: ${t}`,e)}return localGet(t,id);
  }
  async function save(t,body,id=""){
    if(isPlanStorageType(t))return savePlanRemoteOnly(t,body,id);
    if(remoteEnabled())try{return id?await remoteUpdate(t,id,body):await remoteCreate(t,body)}catch(e){console.warn(`Bubble save fallback: ${t}`,e)}
    return localSave(t,body,id);
  }
  async function remove(t,id){
    if(isPlanStorageType(t))return removePlanRemoteOnly(t,id);
    if(remoteEnabled())try{return await remoteDelete(t,id)}catch(e){console.warn(`Bubble delete fallback: ${t}`,e)}return localDelete(t,id);
  }
  function relation(v){return v||undefined;}
  function compact(obj){const out={};Object.entries(obj||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")out[k]=v});return out;}
  function commonContext(){const c=ctx();return{guide:relation(c.id),grade:relation(c.gradeId||(c.assignedGradeIds||[])[0]),school:relation(c.schoolId),department:relation(c.stageId),academicYear:relation(c.academicYearId),term:relation(c.termId)};}
  function planMetaPayload(plan){
    return JSON.stringify({_mishkatVersion:"1.0.65",form:plan?.form||{},holidays:plan?.holidays||[],introduction:plan?.introduction||"",segments:plan?.segments||[],savedAt:now()});
  }
  function readPlanMeta(row){const raw=row?.Notes??row?.notes??"";return typeof raw==="string"?safeParse(raw,{}):(raw||{});}
  async function savePlanHeadResilient(t,body,existingId,fm){
    try{return {row:await savePlanRemoteOnly(t,body,existingId),warnings:[]};}
    catch(fullError){
      if(![400,422].includes(Number(fullError?.status||0)))throw fullError;
      const minimal=compact({[fm.title||"Title"]:body[fm.title||"Title"],[fm.notes||"Notes"]:body[fm.notes||"Notes"],[fm.active||"Active"]:true});
      let row;
      try{row=await savePlanRemoteOnly(t,minimal,existingId)}catch(minimalError){throw minimalError}
      const rid=idOf(row)||String(existingId||"");
      const warnings=[`تم حفظ رأس الخطة بالحقول الأساسية لأن Bubble رفض حقلًا اختياريًا: ${fullError.originalMessage||fullError.message||""}`];
      if(rid){
        for(const [key,value] of Object.entries(body)){
          if(key in minimal||value===undefined||value===null||value==="")continue;
          try{await remoteUpdate(t,rid,{[key]:value})}catch(err){warnings.push(`${key}: ${err?.message||`HTTP ${err?.status||0}`}`)}
        }
        try{row=await remoteGet(t,rid)}catch(_e){}
      }
      return {row,warnings};
    }
  }
  async function savePlanModel(plan,existingId=""){
    if(planWorkflowEnabled())return savePlanViaWorkflow(plan,existingId);
    const c=ctx(),fm=fieldMap("guidancePlan"),t=typeName("guidancePlan"),cc=commonContext();
    const progress=plan?.progress||{};
    const body=compact({[fm.title||"Title"]:plan?.form?.title||"خطة الموجه الطلابي",[fm.academicYear||"AcademicYear"]:cc.academicYear,[fm.term||"Term"]:cc.term,[fm.guide||"Guide"]:cc.guide,[fm.grade||"Grade"]:cc.grade,[fm.school||"School"]:cc.school,[fm.department||"Department"]:cc.department,[fm.status||"Status"]:progress.percent===100?"completed":"in_progress",[fm.notes||"Notes"]:planMetaPayload(plan),[fm.active||"Active"]:true});
    const headResult=await savePlanHeadResilient(t,body,existingId,fm);
    const head=headResult.row;
    const planWarnings=[...(headResult.warnings||[])];
    const planId=idOf(head);
    if(!planId||planId.startsWith("local-"))throw planStorageError(new Error("bubble_plan_id_missing"));
    // Verify the plan head can be read back from Bubble before reporting success.
    const confirmed=await getPlanRemoteOnly(t,planId);
    if(!confirmed||!idOf(confirmed))throw planStorageError(new Error("bubble_plan_verify_failed"));
    // Normalize every trackable weekly item into Guidance_Plan_Item. The full model remains in Notes for lossless reopening.
    const itemType=typeName("guidancePlanItem"),im=fieldMap("guidancePlanItem");
    const old=await listPlanRemoteOnly(itemType,[{key:im.plan||"Plan",constraint_type:"equals",value:planId}]);
    const segments=(plan?.segments||[]).filter(s=>s?.type==="week");
    const itemBodies=[];
    for(const seg of segments){
      const groups=[["task",seg.tasks||[]],["program",seg.programs||[]],["emerging",seg.emerging||[]]];
      for(const [category,items] of groups){for(const item of items){
        if(!String(item?.text||"").trim())continue;
        const status=item.done?"done":item.notDone?"not_done":"pending";
        itemBodies.push(compact({[im.plan||"Plan"]:planId,[im.title||"Title"]:String(item.text).trim(),[im.description||"Description"]:item.note||seg.weekNote||"",[im.category||"Category"]:category,[im.startDate||"StartDate"]:seg.start,[im.endDate||"EndDate"]:seg.end,[im.targetGroup||"TargetGroup"]:plan?.form?.stage||c.stage||"",[im.responsible||"Responsible"]:cc.guide,[im.executionStatus||"ExecutionStatus"]:status,[im.executionPercent||"ExecutionPercent"]:item.done?100:0,[im.notes||"Notes"]:JSON.stringify({weekNumber:seg.number,fixed:Boolean(item.fixed)}),[im.completed||"Completed"]:Boolean(item.done)}));
      }}
    }
    const created=[];let itemSyncError=null;
    try{
      // Guidance_Plan is authoritative. Item normalization is secondary and must never erase a valid saved plan.
      const queue=itemBodies.slice();
      const workers=Array.from({length:Math.min(4,Math.max(1,queue.length))},async()=>{
        while(queue.length){const ib=queue.shift();const r=await savePlanRemoteOnly(itemType,ib);created.push(idOf(r));}
      });
      await Promise.all(workers);
      for(const r of old){const rid=idOf(r);if(rid)await removePlanRemoteOnly(itemType,rid);}
    }catch(error){
      itemSyncError=error;
      // Remove only partially-created replacement items. Keep the verified Guidance_Plan head intact.
      for(const rid of created){try{await remoteDelete(itemType,rid)}catch(_e){}}
      planWarnings.push(`تعذر مزامنة Guidance_Plan_Item: ${error?.message||String(error)}`);
      console.warn("Mishkat: plan head saved, item normalization pending.",error);
    }
    return {...head,_id:planId,id:planId,__bubbleVerified:true,__itemCount:itemSyncError?0:created.length,__itemSyncOk:!itemSyncError,__itemSyncError:itemSyncError?.message||"",__warnings:planWarnings};
  }
  async function listPlans(){
    const fm=fieldMap("guidancePlan"),cc=commonContext(),t=typeName("guidancePlan");
    if(cc.guide){
      try{const rows=await listPlanRemoteOnly(t,[{key:fm.guide||"Guide",constraint_type:"equals",value:cc.guide}]);if(rows.length){rows.forEach(rememberWorkflowPlanRow);return rows;}}catch(error){console.warn("Mishkat: Guide-filtered plan list failed; trying privacy-scoped list.",error)}
    }
    const rows=await listPlanRemoteOnly(t,[]);
    rows.forEach(rememberWorkflowPlanRow);
    const c=ctx(),schoolId=String(c.schoolId||"");
    return rows.filter(row=>{
      const meta=readPlanMeta(row),form=meta?.form||{};
      const rowGuide=String(row?.[fm.guide||"Guide"]||"");const rowSchool=String(row?.[fm.school||"School"]||"");
      if(cc.guide&&rowGuide===String(cc.guide))return true;
      if(schoolId&&rowSchool===schoolId)return true;
      return String(form.counselorName||"")===String(c.counselorName||"")&&String(form.schoolName||"")===String(c.schoolName||"");
    });
  }
  async function getPlanModel(id){const row=await getPlanRemoteOnly(typeName("guidancePlan"),id);if(!row)return null;const meta=readPlanMeta(row);return{row,model:{id,...meta,form:meta.form||{},holidays:meta.holidays||[],introduction:meta.introduction||"",segments:meta.segments||[]}};}
  async function deletePlanModel(id,hint=null){
    if(planDeleteWorkflowEnabled()){
      let source=hint;
      if(!source&&id){try{source=await getPlanRemoteOnly(typeName("guidancePlan"),id)}catch(_e){source=null}}
      if(!source){const e=new Error("تعذر تحديد بيانات الخطة المطلوب حذفها من Bubble.");e.code="PLAN_DELETE_SOURCE_MISSING";throw e;}
      return deletePlanViaWorkflow(source);
    }
    const im=fieldMap("guidancePlanItem"),it=typeName("guidancePlanItem");
    const items=await listPlanRemoteOnly(it,[{key:im.plan||"Plan",constraint_type:"equals",value:id}]);
    for(const r of items){const rid=idOf(r);if(rid)await removePlanRemoteOnly(it,rid);}
    return removePlanRemoteOnly(typeName("guidancePlan"),id);
  }
  function progressFromMeta(meta){
    let completed=0,notCompleted=0,pending=0,total=0;
    for(const seg of meta?.segments||[]){if(seg?.type!=="week")continue;for(const listName of ["tasks","programs","emerging"]){for(const item of seg?.[listName]||[]){if(!String(item?.text||"").trim())continue;total++;if(item.done)completed++;else if(item.notDone)notCompleted++;else pending++;}}}
    return{completed,notCompleted,pending,total,percent:total?Math.round(completed*100/total):0};
  }
  async function migrateLocalPlans(){
    const t=typeName("guidancePlan"),itemType=typeName("guidancePlanItem"),rows=localRows(t);
    const result={found:rows.length,migrated:0,failed:0,failures:[]};
    if(!rows.length)return result;
    if(!remoteEnabled())throw planStorageError(new Error("bubble_remote_not_configured"),"migrate");
    for(const row of [...rows]){
      const oldId=idOf(row);
      try{
        const meta=readPlanMeta(row);
        if(!meta?.form||!Array.isArray(meta?.segments))throw new Error("local_plan_payload_invalid");
        const saved=await savePlanModel({...meta,progress:progressFromMeta(meta)},"");
        const newId=idOf(saved);
        if(!newId&&saved?.__bubbleVerified!==true)throw new Error("bubble_plan_id_missing");
        setLocalRows(t,localRows(t).filter(r=>idOf(r)!==oldId));
        setLocalRows(itemType,localRows(itemType).filter(r=>String(r?.[fieldMap("guidancePlanItem").plan||"Plan"]||"")!==oldId));
        result.migrated++;
      }catch(error){result.failed++;result.failures.push({id:oldId,message:error?.message||String(error)});}
    }
    return result;
  }
  async function saveEventModel(event,id=""){
    const f=fieldMap("guidanceEvent"),cc=commonContext();const body=compact({[f.title||"Title"]:event.title,[f.eventDate||"EventDate"]:event.event_date||event.date,[f.endDate||"EndDate"]:event.end_date||event.endDate,[f.eventType||"EventType"]:event.category||event.eventType||"custom",[f.description||"Description"]:event.details||event.description||"",[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.student||"Student"]:event.studentId,[f.planItem||"PlanItem"]:event.planItemId,[f.reminder||"Reminder"]:event.reminder!==false,[f.reminderDate||"ReminderDate"]:event.reminderDate,[f.completed||"Completed"]:Boolean(event.completed),[f.notes||"Notes"]:event.priority?JSON.stringify({priority:event.priority}):event.notes||""});return save(typeName("guidanceEvent"),body,id);}
  async function listEvents(){const f=fieldMap("guidanceEvent"),cc=commonContext();const cs=[];if(cc.guide)cs.push({key:f.guide||"Guide",constraint_type:"equals",value:cc.guide});return list(typeName("guidanceEvent"),cs,{sortField:f.eventDate||"EventDate",descending:false});}
  async function deleteEvent(id){return remove(typeName("guidanceEvent"),id);}
  async function logMessage(data){const f=fieldMap("guidanceMessage"),cc=commonContext();const body=compact({[f.messageType||"MessageType"]:data.messageType||data.category||"general",[f.subject||"Subject"]:data.subject||data.topic||"",[f.messageText||"MessageText"]:data.messageText||data.text||"",[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.student||"Student"]:data.studentId,[f.parentPhone||"ParentPhone"]:data.parentPhone,[f.recipientEmployee||"RecipientEmployee"]:data.recipientEmployeeId,[f.recipientType||"RecipientType"]:data.recipientType||"parent",[f.createdDateCustom||"CreatedDateCustom"]:data.createdDate||now(),[f.sent||"Sent"]:Boolean(data.sent),[f.sentDate||"SentDate"]:data.sent?data.sentDate||now():undefined,[f.channel||"Channel"]:data.channel||"copy",[f.notes||"Notes"]:data.notes||""});return save(typeName("guidanceMessage"),body);}
  async function savePresentationModel(data,id=""){const f=fieldMap("guidancePresentation"),cc=commonContext();const payload=compact({[f.title||"Title"]:data.title||data.topic||"عرض تقديمي",[f.topic||"Topic"]:data.topic||data.title||"",[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.targetGroup||"TargetGroup"]:data.targetGroup||ctx().studentsLabel,[f.grade||"Grade"]:data.gradeId,[f.presentationData||"PresentationData"]:typeof data.presentationData==="string"?data.presentationData:JSON.stringify(data.presentationData||data),[f.theme||"Theme"]:data.theme||"default",[f.slidesCount||"SlidesCount"]:Number(data.slidesCount||data.slides?.length||0),[f.createdAt||"CreatedAt"]:data.createdAt||now(),[f.updatedAt||"UpdatedAt"]:now(),[f.status||"Status"]:data.status||"saved"});return save(typeName("guidancePresentation"),payload,id);}
  async function saveCertificateModel(data){const f=fieldMap("guidanceCertificate"),cc=commonContext();const body=compact({[f.student||"Student"]:data.studentId,[f.studentName||"StudentName"]:data.studentName||data.student,[f.certificateType||"CertificateType"]:data.certificateType||data.category,[f.reason||"Reason"]:data.reason||data.achievement||data.body,[f.issueDate||"IssueDate"]:data.issueDate||data.date||now().slice(0,10),[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.schoolManager||"SchoolManager"]:ctx().managerId,[f.certificateNumber||"CertificateNumber"]:data.certificateNumber||data.serial,[f.template||"Template"]:data.templateId,[f.notes||"Notes"]:data.notes||""});return save(typeName("guidanceCertificate"),body);}
  async function listTemplates(templateType=""){const f=fieldMap("guidanceTemplate"),cs=[{key:f.active||"Active",constraint_type:"equals",value:true}];if(templateType)cs.push({key:f.templateType||"TemplateType",constraint_type:"equals",value:templateType});const rows=await list(typeName("guidanceTemplate"),cs,{sortField:f.order||"Order",descending:false});return rows;}
  global.MishkatBubbleStore={schema,remoteEnabled,list,get,save,remove,savePlanModel,listPlans,getPlanModel,deletePlanModel,migrateLocalPlans,saveEventModel,listEvents,deleteEvent,logMessage,savePresentationModel,saveCertificateModel,listTemplates,idOf,ctx};
  global.dispatchEvent(new CustomEvent("mishkat:bubble-store-ready"));
})(window);
