"use strict";
/*
 * Records -> Bubble adapter V1.0.76 — SubCollective Save/Update/Delete via authenticated Workflow API
 * Writes only to Data Types whose fields were confirmed from the supplied Bubble screenshots.
 * Rich form data that has no direct Bubble field remains preserved in the local archive mirror.
 */
(function(global){
  if(global.MishkatRecordsBubbleAdapter)return;
  const schema=global.MISHKAT_BUBBLE_SCHEMA||{dataTypes:{},fields:{}};
  const store=()=>global.MishkatBubbleStore;
  const cfg=()=>global.MISHKAT_BUBBLE_CONFIG||{};
  const dir=()=>global.MishkatBubbleDirectory;
  const ctx=()=>global.MishkatSchoolContext?.getContext?.()||{};
  const type=k=>schema.dataTypes?.[k]||k;
  const fields=k=>schema.fields?.[k]||{};
  const compact=o=>{const r={};Object.entries(o||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!==""&&!(Array.isArray(v)&&!v.length))r[k]=v});return r};
  const arr=v=>Array.isArray(v)?v:(v?[v]:[]);
  const clean=v=>String(v??"").trim();
  const stripCode=v=>clean(v).replace(/^\\d+\\s*[—-]\\s*/,"");
  const fmt=v=>Array.isArray(v)?v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join("، "):typeof v==='object'&&v?JSON.stringify(v):clean(v);
  const block=(pairs)=>pairs.filter(([,v])=>v!==undefined&&v!==null&&fmt(v)!=="").map(([k,v])=>`${k}: ${fmt(v)}`).join("\n");
  function common(form={}){
    const c=ctx(),d=dir();
    const student=d?.findStudent?.(form.student_name_id||form.student_name||form.person_name_id||form.person_name||"")||null;
    return {c,student,academicYear:c.academicYearId||d?.currentAcademicYear?.()?.id||"",term:c.termId||d?.currentTerm?.()?.id||"",school:student?.schoolId||c.schoolId||"",dep:student?.stageId||c.stageId||"",grade:student?.gradeId||form.grade_id||"",phone:form.guardian_phone||form.contact_numbers||student?.guardianPhone||form.Phone||""};
  }
  const lookup=(source,label)=>dir()?.findLookup?.(source,label)?.id||"";
  const firstLookup=(source,values)=>{for(const v of arr(values)){const id=lookup(source,stripCode(v));if(id)return id}return ""};
  const lookupIds=(source,values)=>arr(values).map(v=>lookup(source,stripCode(v))).filter(Boolean);
  const studentIds=(rows)=>arr(rows).map(r=>r?.student_name_id||r?.student_id||"").filter(Boolean);
  const firstStudent=(rows)=>{for(const r of arr(rows)){const s=dir()?.findStudent?.(r?.student_name_id||r?.student_name||"");if(s)return s}return null};
  const firstDate=(rows,key)=>arr(rows).map(r=>r?.[key]).find(Boolean)||"";
  const daysText=rows=>arr(rows).filter(r=>r&&Object.values(r).some(Boolean)).map(r=>r.days?`${r.days} أيام`:"").filter(Boolean).join("، ");

  function workflowOutput(raw){
    return raw?.response&&typeof raw.response==="object"?raw.response:(raw||{});
  }
  function workflowSucceeded(raw){
    const out=workflowOutput(raw);
    const value=out?.success;
    if(value===true||value===1||["yes","true","1"].includes(String(value||"").toLowerCase()))return true;
    // Bubble may return its standard successful Workflow API wrapper even when
    // Return data from API does not include a custom `success` key.
    const statuses=[raw?.status,out?.status].map(v=>String(v||"").trim().toLowerCase()).filter(Boolean);
    return statuses.includes("success");
  }
  async function postWorkflow(endpoint,payload,workflowName){
    endpoint=String(endpoint||"").trim();
    if(!endpoint){const e=new Error(`API Workflow ${workflowName} غير مضاف في إعدادات المنصة.`);e.code="WORKFLOW_NOT_CONFIGURED";throw e;}
    const token=global.MishkatBubbleAuth?.getToken?.()||"";
    if(!token){const e=new Error("جلسة Bubble غير متاحة. سجّل الدخول مرة أخرى.");e.code="BUBBLE_AUTH_MISSING";throw e;}
    let response,text="",raw={};
    try{
      response=await fetch(endpoint,{method:"POST",credentials:"omit",cache:"no-store",headers:{Accept:"application/json","Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(payload||{})});
      text=await response.text();
      try{raw=text?JSON.parse(text):{}}catch(_e){raw={message:text}}
    }catch(error){
      const e=new Error(`تعذر الاتصال بـ Bubble أثناء تشغيل ${workflowName}.`);e.cause=error;e.code="WORKFLOW_NETWORK_ERROR";throw e;
    }
    if(!response.ok){
      const detail=String(workflowOutput(raw)?.message||raw?.message||raw?.error||text||`HTTP ${response.status}`).trim();
      let message=`فشل ${workflowName} في Bubble (${response.status}).`;
      if(response.status===401)message="جلسة Bubble انتهت. سجّل الخروج ثم الدخول مرة أخرى.";
      else if(response.status===403)message=`Bubble رفض تشغيل ${workflowName} للمستخدم الحالي.`;
      else if(response.status===404)message=`لم يتم العثور على API Workflow باسم ${workflowName} في بيئة Development.`;
      else if(response.status===400||response.status===422)message=`Bubble رفض بيانات ${workflowName}: ${detail}`;
      else if(response.status>=500)message=`حدث خطأ داخل Backend Workflow ${workflowName} (HTTP ${response.status}).`;
      const e=new Error(message);e.status=response.status;e.detail=detail;e.code="WORKFLOW_HTTP_ERROR";throw e;
    }
    if(!workflowSucceeded(raw)){
      const out=workflowOutput(raw);const e=new Error(String(out?.message||`Bubble لم يؤكد نجاح ${workflowName}.`));e.code="WORKFLOW_NOT_CONFIRMED";e.data=raw;throw e;
    }
    return raw;
  }
  function snapshotId(source,label,fallback=""){
    const rows=dir()?.getSnapshot?.()?.[source]||[];
    const wanted=clean(label).toLowerCase();
    const row=rows.find(x=>String(x?.id||"")===String(label||""))||rows.find(x=>clean(x?.name).toLowerCase()===wanted);
    return String(row?.id||fallback||"");
  }
  const normalizeTime=v=>clean(v).toLowerCase().replace(/[أإآ]/g,"ا").replace(/دقيقه|دقيقة|دقائق|minutes?|mins?/gi,"").replace(/\s+/g," ").trim();
  function rawGuidanceTimeLabel(row){
    if(!row||typeof row!=="object")return "";
    for(const key of ["Display","display","Title","title","Name","name","Time","time","Duration","duration","Minutes","minutes","Guidance Time","Guidance_Time"]){
      const v=clean(row?.[key]);if(v)return v;
    }
    return "";
  }
  function guidanceTimeMatch(rows,value){
    const raw=clean(value);if(!raw)return null;
    const direct=arr(rows).find(x=>String(x?.id||x?._id||x?.["unique id"]||x?.["Unique ID"]||"")===raw);if(direct)return direct;
    const wanted=normalizeTime(raw),wantedNum=(raw.match(/\d+(?:[.,]\d+)?/)||[])[0]?.replace(",",".")||"";
    return arr(rows).find(x=>normalizeTime(x?.name||rawGuidanceTimeLabel(x))===wanted)||arr(rows).find(x=>{
      const label=clean(x?.name||rawGuidanceTimeLabel(x));const n=(label.match(/\d+(?:[.,]\d+)?/)||[])[0]?.replace(",",".")||"";
      return wantedNum&&n&&Number(n)===Number(wantedNum);
    })||null;
  }
  function guidanceTimeId(value){
    const row=guidanceTimeMatch(dir()?.getSnapshot?.()?.guidanceTimes||[],value);
    return String(row?.id||row?._id||row?.["unique id"]||row?.["Unique ID"]||"");
  }
  function explicitThingId(row){
    if(!row||typeof row!=="object")return "";
    return clean(row?._id||row?.id||row?.unique_id||row?.["unique id"]||row?.["Unique ID"]||"");
  }
  async function resolveGuidanceTimeValue(value){
    // Guidance_Time is a Bubble Option Set. The Workflow API expects the option's Display value,
    // not a Data API Thing id. The UI dropdown stores the normalized option name/display.
    const raw=clean(value);if(!raw)return "";
    const localRows=dir()?.getSnapshot?.()?.guidanceTimes||[];
    const local=guidanceTimeMatch(localRows,raw);
    const label=clean(local?.name||rawGuidanceTimeLabel(local?.raw??local)||raw);
    return label;
  }
  function collectiveRefs(form={},record=null){
    const c=ctx(),d=dir(),first=firstStudent(form.participants);
    const academicYear=snapshotId("academicYears",record?.academic_year||c.academicYear,c.academicYearId||d?.currentAcademicYear?.()?.id||"");
    const term=snapshotId("terms",record?.academic_term||c.term,c.termId||d?.currentTerm?.()?.id||"");
    return {
      academicYear,
      term,
      school:String(first?.schoolId||c.schoolId||(c.assignedSchoolIds||[])[0]||""),
      dep:String(first?.stageId||c.stageId||(c.assignedStageIds||[])[0]||""),
      grade:String(first?.gradeId||c.gradeId||(c.assignedGradeIds||[])[0]||"")
    };
  }
  async function collectiveWorkflowPayload(form={},meta={},record=null,{forDelete=false}={}){
    const refs=collectiveRefs(form,record),ids=studentIds(form.participants);
    const payload={
      academic_year:refs.academicYear,
      collective_date:String((forDelete?record?.record_date:meta?.recordDate)||record?.record_date||"").slice(0,10),
      collective_name:clean(form.session_title),
      grade:refs.grade,
      school:refs.school,
      dep:refs.dep,
      term:refs.term
    };
    if(!forDelete){
      Object.assign(payload,{
        collective_target:clean(form.objectives),
        students:ids
      });
      if(clean(form.duration)){
        const durationValue=await resolveGuidanceTimeValue(form.duration);
        if(!durationValue){const e=new Error(`تعذر مطابقة الزمن ${clean(form.duration)} مع Guidance_Time في Bubble. تأكد أن قيمة المدة موجودة في Guidance_Time.`);e.code="COLLECTIVE_DURATION_NOT_FOUND";throw e;}
        payload.duration=durationValue;
      }
      if(clean(form.evaluation))payload.evaluation=clean(form.evaluation);
      if(clean(form.next_session_date))payload.next_date=clean(form.next_session_date);
      if(clean(form.student_tasks))payload.orders=clean(form.student_tasks);
      if(clean(form.procedures))payload.procedures=clean(form.procedures);
      if(clean(form.session_flow))payload.process=clean(form.session_flow);
      if(clean(form.tools))payload.tools=clean(form.tools);
    }
    const required=forDelete
      ? [["academic_year",payload.academic_year,"العام الدراسي"],["grade",payload.grade,"المدرسة"],["school",payload.school,"المجمع"],["dep",payload.dep,"المرحلة"],["term",payload.term,"الفصل الدراسي"],["collective_date",payload.collective_date,"تاريخ الإرشاد"],["collective_name",payload.collective_name,"عنوان الإرشاد"]]
      : [["academic_year",payload.academic_year,"العام الدراسي"],["collective_date",payload.collective_date,"تاريخ الإرشاد"],["collective_name",payload.collective_name,"عنوان الإرشاد"],["collective_target",payload.collective_target,"المستهدفون"],["dep",payload.dep,"المرحلة"],["grade",payload.grade,"المدرسة"],["school",payload.school,"المجمع"],["students",payload.students,"الطلاب"],["term",payload.term,"الفصل الدراسي"]];
    const missing=required.filter(([k,v])=>Array.isArray(v)?!v.length:!String(v||"").trim()).map(([, ,label])=>label);
    if(missing.length){const e=new Error(`أكمل/تحقق من بيانات ${missing.join("، ")} قبل حفظ الإرشاد الجمعي.`);e.code="COLLECTIVE_CONTEXT_MISSING";throw e;}
    return payload;
  }
  async function saveCollectiveViaWorkflow(form={},meta={},existing={}){
    const previous=existing?.record||null;
    const isUpdate=Boolean(previous);
    const payload=await collectiveWorkflowPayload(form,meta,previous);
    let workflowName="guidance_save_collective";
    let endpoint=cfg().collectiveSaveEndpoint;
    if(isUpdate){
      workflowName="guidance_update_collective";endpoint=cfg().collectiveUpdateEndpoint;
      payload.original_collective_date=String(previous?.record_date||"").slice(0,10);
      payload.original_collective_name=clean(previous?.form_data?.session_title||previous?.collective_name||"");
      if(!payload.original_collective_date||!payload.original_collective_name){const e=new Error("تعذر تحديد بيانات السجل الأصلية اللازمة للتعديل.");e.code="COLLECTIVE_ORIGINAL_IDENTITY_MISSING";throw e;}
    }
    const raw=await postWorkflow(endpoint,payload,workflowName);const out=workflowOutput(raw);
    return {supported:true,type:type("guidanceCollective"),id:"",row:null,remote:true,workflow:workflowName,workflowMode:isUpdate?"update":"create",message:String(out?.message||""),body:payload};
  }
  async function deleteCollectiveViaWorkflow(record={}){
    const form=record?.form_data||{};const payload=await collectiveWorkflowPayload(form,{recordDate:record?.record_date},record,{forDelete:true});
    const raw=await postWorkflow(cfg().collectiveDeleteEndpoint,payload,"guidance_delete_collective");
    return {success:true,workflow:"guidance_delete_collective",payload,message:String(workflowOutput(raw)?.message||"")};
  }

  const FOLLOWUP_MARKER="متابعة الإرشاد الجمعي";
  function followupTarget(rootDate,sequence,grade=""){
    return `${FOLLOWUP_MARKER} | رقم الجلسة: ${Number(sequence||2)} | تاريخ الجلسة الرئيسية: ${String(rootDate||"").slice(0,10)}${clean(grade)?` | الصف: ${clean(grade)}`:""}`;
  }
  function parseFollowupTarget(value){
    const text=clean(value);if(!text.startsWith(FOLLOWUP_MARKER))return null;
    const seq=Number((text.match(/رقم الجلسة\s*:\s*(\d+)/)||[])[1]||2);
    const root=(text.match(/تاريخ الجلسة الرئيسية\s*:\s*(\d{4}-\d{2}-\d{2})/)||[])[1]||"";
    const grade=clean((text.match(/\|\s*الصف\s*:\s*([^|]+)$/)||[])[1]||"");
    if(!root)return null;
    return {sequence:Number.isFinite(seq)&&seq>=2?seq:2,rootDate:root,grade};
  }
  async function strictDataApi(method,typeName,id="",body=null){
    const base=String(cfg().dataApiBase||cfg().objectApiBase||"").replace(/\/$/,"");
    if(!base){const e=new Error("Bubble Data API غير مضبوط في المنصة.");e.code="BUBBLE_DATA_API_MISSING";throw e;}
    const token=global.MishkatBubbleAuth?.getToken?.()||"";
    if(!token){const e=new Error("جلسة Bubble غير متاحة. سجّل الدخول مرة أخرى.");e.code="BUBBLE_AUTH_MISSING";throw e;}
    const apiName=cfg()?.typeApiNames?.[typeName]||typeName;
    const url=`${base}/${encodeURIComponent(apiName)}${id?`/${encodeURIComponent(id)}`:""}`;
    const headers={Accept:"application/json",Authorization:`Bearer ${token}`};
    const options={method,credentials:"omit",cache:"no-store",headers};
    if(body!==null){headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}
    let response,text="",raw={};
    try{response=await fetch(url,options);text=await response.text();try{raw=text?JSON.parse(text):{}}catch(_e){raw={message:text}}}
    catch(error){const e=new Error(`تعذر الاتصال بـ Bubble أثناء حفظ جلسة المتابعة.`);e.cause=error;e.code="FOLLOWUP_NETWORK_ERROR";throw e;}
    if(!response.ok){const detail=String(raw?.response?.message||raw?.message||raw?.body?.message||text||`HTTP ${response.status}`).trim();const e=new Error(`Bubble رفض جلسة المتابعة (${response.status}): ${detail}`);e.status=response.status;e.detail=detail;e.code="FOLLOWUP_DATA_API_ERROR";throw e;}
    return raw;
  }
  function followupRefs(form={},meta={}){
    const c=ctx(),d=dir();
    return {
      academicYear:snapshotId("academicYears",meta.academicYear||c.academicYear,c.academicYearId||d?.currentAcademicYear?.()?.id||""),
      term:snapshotId("terms",meta.academicTerm||c.term,c.termId||d?.currentTerm?.()?.id||""),
      school:snapshotId("campuses",meta.campus||c.campus||c.schoolName,c.schoolId||(c.assignedSchoolIds||[])[0]||""),
      dep:snapshotId("stages",meta.stage||c.stage,c.stageId||(c.assignedStageIds||[])[0]||"")
    };
  }
  async function followupBody(form={},meta={}){
    const f=fields("guidanceSubCollective"),refs=followupRefs(form,meta);
    const rootDate=String(form.root_session_date||"").slice(0,10),sequence=Number(form.followup_number||2),recordDate=String(meta.recordDate||"").slice(0,10);
    const body=compact({
      [f.academicYear]:refs.academicYear,
      [f.collectiveDate]:recordDate,
      [f.collectiveName]:clean(form.session_title),
      [f.collectiveTarget]:clean(form.objectives),
      [f.dep]:refs.dep,
      [f.evaluation]:clean(form.evaluation),
      [f.nextDate]:clean(form.next_session_date),
      [f.orders]:clean(form.student_tasks),
      [f.procedures]:clean(form.procedures),
      [f.process]:clean(form.session_flow),
      [f.school]:refs.school,
      [f.target]:followupTarget(rootDate,sequence,form.parent_grade),
      [f.term]:refs.term,
      [f.tools]:clean(form.tools)
    });
    if(clean(form.duration))body[f.duration]=await resolveGuidanceTimeValue(form.duration);
    const required=[[refs.academicYear,"العام الدراسي"],[recordDate,"موعد الجلسة"],[clean(form.session_title),"عنوان الجلسة"],[refs.school,"المجمع"],[refs.dep,"المرحلة"],[refs.term,"الفصل الدراسي"],[rootDate,"تاريخ الجلسة الرئيسية"],[String(sequence||""),"تسلسل الجلسة"]];
    const missing=required.filter(([v])=>!clean(v)).map(([,label])=>label);
    if(missing.length){const e=new Error(`تعذر حفظ جلسة المتابعة: بيانات ${missing.join("، ")} غير مكتملة.`);e.code="FOLLOWUP_CONTEXT_MISSING";throw e;}
    return body;
  }
  async function followupWorkflowPayload(form={},meta={},record=null,{forDelete=false}={}){
    const refs=followupRefs(form,meta);
    const rootDate=String(form.root_session_date||record?.form_data?.root_session_date||"").slice(0,10);
    const sequence=Number(form.followup_number||record?.form_data?.followup_number||2);
    const parentGrade=clean(form.parent_grade||record?.form_data?.parent_grade);
    const recordDate=String((forDelete?record?.record_date:meta?.recordDate)||record?.record_date||"").slice(0,10);
    const title=clean(form.session_title||record?.form_data?.session_title);
    const target=followupTarget(rootDate,sequence,parentGrade);
    const payload={
      academic_year:refs.academicYear,
      collective_date:recordDate,
      collective_name:title,
      dep:refs.dep,
      school:refs.school,
      target,
      term:refs.term
    };
    if(!forDelete){
      if(clean(form.objectives))payload.collective_target=clean(form.objectives);
      if(clean(form.duration))payload.duration=await resolveGuidanceTimeValue(form.duration);
      if(clean(form.evaluation))payload.evaluation=clean(form.evaluation);
      if(clean(form.next_session_date))payload.next_date=clean(form.next_session_date);
      if(clean(form.student_tasks))payload.orders=clean(form.student_tasks);
      if(clean(form.procedures))payload.procedures=clean(form.procedures);
      if(clean(form.session_flow))payload.process=clean(form.session_flow);
      if(clean(form.tools))payload.tools=clean(form.tools);
    }
    const required=[
      [payload.academic_year,"العام الدراسي"],[payload.collective_date,"موعد الجلسة"],[payload.collective_name,"عنوان الجلسة"],
      [payload.dep,"المرحلة"],[payload.school,"المجمع"],[payload.target,"ارتباط الجلسة"],[payload.term,"الفصل الدراسي"]
    ];
    const missing=required.filter(([v])=>!clean(v)).map(([,label])=>label);
    if(missing.length){const e=new Error(`تعذر ${forDelete?"حذف":"حفظ"} جلسة المتابعة: بيانات ${missing.join("، ")} غير مكتملة.`);e.code="FOLLOWUP_CONTEXT_MISSING";throw e;}
    return payload;
  }
  async function saveFollowupViaWorkflow(form={},meta={},existing={}){
    const previous=existing?.record||null;
    const isUpdate=Boolean(previous);
    const payload=await followupWorkflowPayload(form,meta,previous);
    let workflowName="guidance_save_subcollective";
    let endpoint=cfg().subCollectiveSaveEndpoint;
    if(isUpdate){
      workflowName="guidance_update_subcollective";
      endpoint=cfg().subCollectiveUpdateEndpoint;
      const oldForm=previous?.form_data||{};
      const oldRootDate=String(oldForm.root_session_date||"").slice(0,10);
      const oldSequence=Number(oldForm.followup_number||2);
      payload.original_collective_date=String(previous?.record_date||"").slice(0,10);
      payload.original_collective_name=clean(oldForm.session_title||previous?.collective_name||"");
      payload.original_target=followupTarget(oldRootDate,oldSequence,oldForm.parent_grade);
      if(!payload.original_collective_date||!payload.original_collective_name||!payload.original_target){
        const e=new Error("تعذر تحديد بيانات جلسة المتابعة الأصلية اللازمة للتعديل.");e.code="FOLLOWUP_ORIGINAL_IDENTITY_MISSING";throw e;
      }
    }
    const raw=await postWorkflow(endpoint,payload,workflowName);
    const out=workflowOutput(raw);
    return {supported:true,type:type("guidanceSubCollective"),id:"",row:null,remote:true,workflow:workflowName,workflowMode:isUpdate?"update":"create",message:String(out?.message||""),body:payload};
  }
  async function deleteFollowupViaWorkflow(record={}){
    const form=record?.form_data||{};
    const payload=await followupWorkflowPayload(form,{recordDate:record?.record_date,academicYear:record?.academic_year,academicTerm:record?.academic_term,campus:record?.campus,stage:record?.stage},record,{forDelete:true});
    const raw=await postWorkflow(cfg().subCollectiveDeleteEndpoint,payload,"guidance_delete_subcollective");
    return {success:true,workflow:"guidance_delete_subcollective",payload,message:String(workflowOutput(raw)?.message||"")};
  }

  function thingId(value){
    if(value==null)return "";
    if(typeof value==="string"||typeof value==="number")return String(value);
    return String(value?._id||value?.id||value?.unique_id||value?.["unique id"]||value?.["Unique ID"]||"");
  }
  function relationId(value){
    if(Array.isArray(value))return relationId(value[0]);
    return thingId(value);
  }
  function relationLabel(source,value){
    if(value==null)return "";
    if(typeof value==="object"&&!Array.isArray(value)){
      for(const key of ["Full Name","Titel","Title","Name","name","title","label","Label","Time","Duration","Minutes"]){
        const text=clean(value?.[key]);if(text)return text;
      }
    }
    const id=relationId(value),rows=dir()?.getSnapshot?.()?.[source]||[];
    const match=rows.find(x=>String(x?.id||"")===String(id||""));
    if(match?.name)return clean(match.name);
    const raw=clean(value);
    return /^\d{10,}x\d+$/i.test(raw)||/^\d{13,}$/.test(raw)?"":raw;
  }
  function collectiveScopeAllows(row){
    const f=fields("guidanceCollective"),c=ctx();
    const scopeValues=(many,one)=>Array.isArray(many)&&many.length?many:(one?[one]:[]);
    const checks=[
      [relationId(row?.[f.school]),scopeValues(c.assignedSchoolIds,c.schoolId)],
      [relationId(row?.[f.dep]),scopeValues(c.assignedStageIds,c.stageId)],
      [relationId(row?.[f.grade]),scopeValues(c.assignedGradeIds,c.gradeId)]
    ];
    return checks.every(([value,allowed])=>{
      const ids=allowed.map(String).filter(Boolean);return !ids.length||Boolean(value&&ids.includes(String(value)));
    });
  }
  function collectiveWeekday(dateValue){
    const raw=String(dateValue||"").slice(0,10);if(!raw)return "";
    const d=new Date(`${raw}T12:00:00`);if(Number.isNaN(d.getTime()))return "";
    return ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][d.getDay()]||"";
  }
  function collectiveRowToRecord(row,timeLookup=new Map()){
    const f=fields("guidanceCollective"),rid=thingId(row);
    const studentRefs=arr(row?.[f.student]);
    const participants=studentRefs.map(ref=>{
      const sid=relationId(ref);const student=dir()?.findStudent?.(sid)||null;
      return {student_name_id:sid,student_name:student?.name||relationLabel("students",ref)||"طالب",class_name:student?.className||""};
    });
    const recordDate=String(row?.[f.collectiveDate]||"").slice(0,10);
    const durationRef=relationId(row?.[f.duration]);
    const durationLabel=relationLabel("guidanceTimes",row?.[f.duration])||clean(timeLookup.get(String(durationRef||""))||"");
    const formData={
      session_title:clean(row?.[f.collectiveName]),
      day:collectiveWeekday(recordDate),
      stage:relationLabel("stages",row?.[f.dep]),
      complex:relationLabel("campuses",row?.[f.school]),
      participants,
      objectives:clean(row?.[f.collectiveTarget]),
      procedures:clean(row?.[f.procedures]),
      tools:clean(row?.[f.tools]),
      duration:durationLabel,
      session_flow:clean(row?.[f.process]),
      student_tasks:clean(row?.[f.orders]),
      evaluation:clean(row?.[f.evaluation]),
      next_session_date:String(row?.[f.nextDate]||"").slice(0,10),
      grade_label:relationLabel("grades",row?.[f.grade])
    };
    return {
      id:rid?`bubble-collective-${rid}`:`bubble-collective-${recordDate}-${clean(formData.session_title)}`,
      record_type:"group_guidance",title:"الإرشاد الجمعي",student_name:null,class_name:null,
      record_date:recordDate,
      academic_year:relationLabel("academicYears",row?.[f.academicYear]),
      academic_term:relationLabel("terms",row?.[f.term]),
      campus:relationLabel("campuses",row?.[f.school]),
      stage:relationLabel("stages",row?.[f.dep]),
      status:"completed",is_confidential:false,form_data:formData,
      bubble_type:type("guidanceCollective"),bubble_id:rid,bubble_remote:true,bubble_workflow:"guidance_save_collective",bubble_workflow_saved:true,
      created_at:row?.["Created Date"]||row?.created_at||"",updated_at:row?.["Modified Date"]||row?.updated_at||"",__bubble_row:row
    };
  }
  function subCollectiveScopeAllows(row){
    const f=fields("guidanceSubCollective"),c=ctx();
    const scopeValues=(many,one)=>Array.isArray(many)&&many.length?many:(one?[one]:[]);
    const checks=[
      [relationId(row?.[f.school]),scopeValues(c.assignedSchoolIds,c.schoolId)],
      [relationId(row?.[f.dep]),scopeValues(c.assignedStageIds,c.stageId)]
    ];
    return checks.every(([value,allowed])=>{const ids=allowed.map(String).filter(Boolean);return !ids.length||Boolean(value&&ids.includes(String(value)));});
  }
  function subCollectiveRowToRecord(row){
    const f=fields("guidanceSubCollective"),rid=thingId(row),meta=parseFollowupTarget(row?.[f.target]);if(!meta)return null;
    const recordDate=String(row?.[f.collectiveDate]||"").slice(0,10);
    const durationLabel=relationLabel("guidanceTimes",row?.[f.duration]);
    const formData={
      session_title:clean(row?.[f.collectiveName]),day:collectiveWeekday(recordDate),followup_label:({2:"الجلسة الثانية",3:"الجلسة الثالثة",4:"الجلسة الرابعة"}[meta.sequence]||`الجلسة ${meta.sequence}`),
      stage:relationLabel("stages",row?.[f.dep]),complex:relationLabel("campuses",row?.[f.school]),
      root_session_date:meta.rootDate,followup_number:String(meta.sequence),parent_grade:meta.grade,
      objectives:clean(row?.[f.collectiveTarget]),procedures:clean(row?.[f.procedures]),tools:clean(row?.[f.tools]),duration:durationLabel,
      session_flow:clean(row?.[f.process]),student_tasks:clean(row?.[f.orders]),evaluation:clean(row?.[f.evaluation]),next_session_date:String(row?.[f.nextDate]||"").slice(0,10)
    };
    return {
      id:rid?`bubble-subcollective-${rid}`:`bubble-subcollective-${recordDate}-${clean(formData.session_title)}-${meta.sequence}`,
      record_type:"group_guidance_followup",title:"جلسة متابعة للإرشاد الجمعي",student_name:null,class_name:null,record_date:recordDate,
      academic_year:relationLabel("academicYears",row?.[f.academicYear]),academic_term:relationLabel("terms",row?.[f.term]),campus:relationLabel("campuses",row?.[f.school]),stage:relationLabel("stages",row?.[f.dep]),
      status:"completed",is_confidential:false,form_data:formData,bubble_type:type("guidanceSubCollective"),bubble_id:rid,bubble_remote:true,bubble_workflow:"data_api_subcollective",bubble_workflow_saved:true,
      created_at:row?.["Created Date"]||row?.created_at||"",updated_at:row?.["Modified Date"]||row?.updated_at||"",__bubble_row:row
    };
  }

  async function fetchDataRows(typeName){
    const base=String(cfg().dataApiBase||cfg().objectApiBase||"").replace(/\/$/,"");
    if(!base){const e=new Error("Bubble Data API غير مضبوط في المنصة.");e.code="BUBBLE_DATA_API_MISSING";throw e;}
    const token=global.MishkatBubbleAuth?.getToken?.()||"";
    if(!token){const e=new Error("جلسة Bubble غير متاحة. سجّل الدخول مرة أخرى.");e.code="BUBBLE_AUTH_MISSING";throw e;}
    const apiName=cfg()?.typeApiNames?.[typeName]||typeName;
    const all=[];let cursor=0,page=0,remaining=1;
    while(remaining>0&&page<100){
      const params=new URLSearchParams({limit:"100",cursor:String(cursor),sort_field:"Modified Date",descending:"true"});
      const response=await fetch(`${base}/${encodeURIComponent(apiName)}?${params.toString()}`,{method:"GET",credentials:"omit",cache:"no-store",headers:{Accept:"application/json",Authorization:`Bearer ${token}`}});
      const text=await response.text();let raw={};try{raw=text?JSON.parse(text):{}}catch(_e){raw={message:text};}
      if(!response.ok){const detail=String(raw?.response?.message||raw?.message||text||`HTTP ${response.status}`);const e=new Error(`تعذر تحميل ${apiName} من Bubble: ${detail}`);e.status=response.status;e.code="BUBBLE_REPORT_LOAD_FAILED";throw e;}
      const payload=raw?.response&&typeof raw.response==="object"?raw.response:raw;
      const rows=Array.isArray(payload?.results)?payload.results:(Array.isArray(payload)?payload:[]);all.push(...rows);
      const rem=Number(payload?.remaining);remaining=Number.isFinite(rem)?rem:0;
      const next=Number(payload?.cursor);cursor=(Number.isFinite(next)?next:cursor)+rows.length;
      if(!rows.length)break;page++;
    }
    return all;
  }
  async function listRemoteRecords(recordType){
    if(recordType!=="group_guidance")return [];
    const [rows,subRows]=await Promise.all([
      fetchDataRows(type("guidanceCollective")),
      fetchDataRows(type("guidanceSubCollective")).catch(()=>[])
    ]);
    const main=rows.filter(collectiveScopeAllows).map(row=>collectiveRowToRecord(row,new Map()));
    const followups=subRows.filter(subCollectiveScopeAllows).map(subCollectiveRowToRecord).filter(Boolean);
    return [...main,...followups];
  }

  const specs={
    group_guidance:{key:"guidanceCollective",async body(form,meta){const f=fields("guidanceCollective"),x=common(form),first=firstStudent(form.participants),ids=studentIds(form.participants);return compact({[f.academicYear]:x.academicYear,[f.collectiveDate]:meta.recordDate,[f.collectiveName]:form.session_title,[f.collectiveTarget]:form.objectives,[f.dep]:x.dep,[f.evaluation]:form.evaluation,[f.grade]:first?.gradeId||x.grade,[f.nextDate]:form.next_session_date,[f.orders]:form.student_tasks,[f.procedures]:form.procedures,[f.process]:form.session_flow,[f.school]:x.school,[f.student]:ids,[f.term]:x.term,[f.tools]:form.tools});}},
    group_guidance_followup:{key:"guidanceSubCollective",async body(form,meta){return followupBody(form,meta);}},
    academic_weakness_guidance:{key:"guidanceFail",async body(form,meta){const f=fields("guidanceFail"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["وصف المشكلة",form.problem_description],["تفاصيل الجلسة",form.session_content],["التزام الطالب",form.student_commitment],["نسبة التحصيل",form.score_percent],["أيام الغياب",form.absence_days]]),[f.failDate]:form.session_date||meta.recordDate,[f.failType]:lookup("guidanceFailTypes",form.fail_type||""),[f.grade]:x.grade,[f.phone]:x.phone,[f.school]:x.school,[f.student]:x.student?.id,[f.term]:x.term});}},
    educational_guidance:{key:"guidanceLog",async body(form,meta){const f=fields("guidanceLog"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["نوع السجل","إرشاد فردي لمشكلة تعليمية"],["المشكلات",form.problems],["وصف إضافي",form.problem_notes],["محتوى الجلسة",form.session_content],["حالة الجلسة",form.case_status],["موعد الجلسة القادمة",form.next_session_date],["الحصة",form.period]]),[f.grade]:x.grade,[f.school]:x.school,[f.setDate]:form.session_date||meta.recordDate,[f.skills]:lookupIds("guidanceSkills",form.skills),[f.student]:x.student?.id});}},
    behavioral_guidance:{key:"guidanceLog",async body(form,meta){const f=fields("guidanceLog"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["نوع السجل","إرشاد فردي لمشكلة سلوكية"],["المشكلات",form.problems],["وصف إضافي",form.problem_notes],["محتوى الجلسة",form.session_content],["حالة الجلسة",form.case_status],["موعد الجلسة القادمة",form.next_session_date],["الحصة",form.period]]),[f.grade]:x.grade,[f.problemBehav]:firstLookup("guidanceProblemBehav",form.problems),[f.school]:x.school,[f.setDate]:form.session_date||meta.recordDate,[f.skills]:lookupIds("guidanceSkills",form.skills),[f.student]:x.student?.id});}},
    lateness_guidance:{key:"guidanceLate",async body(form,meta){const f=fields("guidanceLate"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.days]:daysText(form.thresholds),[f.dep]:x.dep,[f.grade]:x.grade,[f.lateDetails]:block([["الأسباب",form.causes],["الحلول",form.solutions],["نتيجة التواصل",form.parent_contact],["التزام الطالب",form.student_commitment]]),[f.meetingDate]:form.session_date||meta.recordDate,[f.msgDate]:firstDate(form.thresholds,"message_date"),[f.phone]:x.phone,[f.school]:x.school,[f.student]:x.student?.id,[f.term]:x.term});}},
    absence_guidance:{key:"guidanceAttandance",async body(form,meta){const f=fields("guidanceAttandance"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.attDays]:daysText(form.thresholds),[f.attDetails]:block([["الأسباب",form.causes],["الحلول",form.solutions],["نتيجة التواصل",form.parent_contact],["التزام الطالب",form.student_commitment]]),[f.dep]:x.dep,[f.grade]:x.grade,[f.meetingDate]:form.session_date||meta.recordDate,[f.msgDate]:firstDate(form.thresholds,"message_date"),[f.phone]:x.phone,[f.school]:x.school,[f.student]:x.student?.id,[f.term]:x.term});}},
    guardian_contact:{key:"guidanceContact",async body(form,meta){const f=fields("guidanceContact"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.contactDate]:form.contact_date||meta.recordDate,[f.dep]:x.dep,[f.details]:block([["غرض الاتصال",form.purpose],["ملخص التواصل",form.communication_details],["النتيجة",form.outcome],["ملاحظات",form.notes],["يحتاج متابعة",form.follow_up_needed],["تاريخ المتابعة",form.follow_up_date]]),[f.grade]:x.grade,[f.phone]:x.phone,[f.reason]:lookup("guidanceReasons",form.purpose),[f.school]:x.school,[f.student]:x.student?.id,[f.terms]:x.term,[f.way]:lookup("guidanceWays",form.contact_method)});}},
    case_study:{key:"guidanceCases",async body(form,meta){const f=fields("guidanceCases"),x=common(form),src=dir()?.findEmployee?.(form.referrer_name_id||form.referrer_name||"");return compact({[f.academicYear]:x.academicYear,[f.category]:lookup("guidanceCategories",form.classification),[f.dep]:x.dep,[f.discoverDate]:form.discovery_date||meta.recordDate,[f.grade]:x.grade,[f.phone]:x.phone,[f.plan]:block([["الخطة البيئية",form.environmental_plan],["الخطة الذاتية",form.self_plan],["المهارات",form.skills]]),[f.problem]:form.problem_summary,[f.problemBasic]:fmt(form.preliminary_diagnosis),[f.problemConc]:form.final_diagnosis,[f.reasonTrans]:form.referral_reason,[f.school]:x.school,[f.sourceTrans]:src?.id,[f.student]:x.student?.id,[f.symbol]:[form.case_code,form.case_number].filter(Boolean).join(" / "),[f.terms]:x.term});}},
    guardian_invitation:{key:"guidanceMettings",async body(form,meta){const f=fields("guidanceMettings"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["سبب الدعوة",form.invitation_reason],["المطلوب مقابلته",form.meeting_with],["نص الدعوة",form.invitation_text],["استجابة ولي الأمر",form.response],["الموعد البديل",[form.alternative_date,form.alternative_time].filter(Boolean).join(" ")]]),[f.grade]:x.grade,[f.meetingDate]:form.appointment_date||meta.recordDate,[f.phone]:x.phone,[f.school]:x.school,[f.terms]:x.term,[f.student]:x.student?.id});}},
    new_student_interview:{key:"guidanceMettings",async body(form,meta){const f=fields("guidanceMettings"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["نوع السجل","مقابلة طالب مستجد"],["المدرسة السابقة",form.previous_school],["الاهتمامات والهوايات",form.interests],["محاور المقابلة",form.axes],["مشاعر الطالب",form.student_feelings],["المستوى السابق والصعوبات",form.academic_background],["ملاحظات وتوصيات",form.counselor_notes],["يحتاج متابعة",form.follow_up_needed],["موعد المتابعة",form.follow_up_date]]),[f.grade]:x.grade,[f.meetingDate]:form.interview_date||meta.recordDate,[f.phone]:x.phone,[f.school]:x.school,[f.terms]:x.term,[f.student]:x.student?.id});}},
    individual_interview:{key:"guidanceMettings",async body(form,meta){const f=fields("guidanceMettings"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["نوع السجل","مقابلة فردية"],["الاسم",form.person_name],["الصفة",form.relationship],["الأهداف",form.objectives],["المحتوى",form.content],["النتائج",form.outcomes],["الموعد القادم",form.next_date]]),[f.grade]:x.grade,[f.meetingDate]:form.interview_date||meta.recordDate,[f.phone]:x.phone,[f.school]:x.school,[f.terms]:x.term,[f.student]:x.student?.id});}},
    observation_visit:{key:"guidanceObservation",async body(form,meta){const f=fields("guidanceObservation"),x=common(form),st=store();const noteText=block([["التركيز",form.focus],["النظافة",form.hygiene],["المشاركة",form.participation],["الأدوات",form.tools],["انتظام الجلسة",form.seating],["الحاجة لزيارة توجيهية",form.needs_guidance_visit],["الملاحظات",form.observation_notes],["الأهداف",form.goals],["طلاب المتابعة",form.follow_up_students]]);let notes=[];if(noteText&&st){const nf=fields("guidanceObserv");const nr=await st.save(type("guidanceObserv"),{[nf.title||"Title"]:noteText});const nid=st.idOf(nr);if(nid)notes=[nid]}const first=firstStudent(form.follow_up_students);return compact({[f.academicYear]:x.academicYear,[f.class]:first?.classId||"",[f.dep]:x.dep,[f.grade]:first?.gradeId||x.grade,[f.obserNotes]:notes,[f.observDate]:form.visit_date||meta.recordDate,[f.school]:x.school,[f.student]:studentIds(form.follow_up_students),[f.term]:x.term});}},
    daily_incident:{key:"guidanceSituation",async body(form,meta){const f=fields("guidanceSituation"),x=common(form),src=dir()?.findEmployee?.(form.referral_source_id||form.referral_source||"");return compact({[f.academicYear]:x.academicYear,[f.action]:firstLookup("guidanceActions",form.action_codes)||lookup("guidanceActions",form.action_details),[f.department]:x.dep,[f.detail]:block([["الموقف",form.incident_details],["الإجراء",form.action_details],["الإجراءات",form.action_codes],["ملاحظات",form.notes],["المتابعة",form.follow_up_notes],["الحالة",form.case_status],["عدد التكرار",form.repeat_count],["رقم الجلسة",form.session_number]]),[f.grade]:x.grade,[f.phone]:x.phone,[f.school]:x.school,[f.situ]:lookup("guidanceSitu",stripCode(form.behavior_code||form.education_code||form.incident_details)),[f.situationDate]:form.incident_date||meta.recordDate,[f.source]:src?.id,[f.student]:x.student?.id,[f.terms]:x.term});}},
    guidance_visit:{key:"guidanceSubCollective",async body(form,meta){const f=fields("guidanceSubCollective"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.collectiveDate]:form.visit_date||meta.recordDate,[f.collectiveName]:form.visit_type||"زيارة توجيهية",[f.collectiveTarget]:fmt(form.topics),[f.dep]:x.dep,[f.evaluation]:block([["فرص التحسين",form.improvements],["تفاصيل التحسين",form.improvement_notes]]),[f.procedures]:fmt(form.goals),[f.process]:form.visit_notes,[f.school]:x.school,[f.target]:ctx().studentsLabel,[f.term]:x.term,[f.tools]:""});}},
    lateness_tracking:{key:"guidanceLog",async body(form,meta){const f=fields("guidanceLog"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["نوع السجل","حصر تحويل حالات التأخر"],["بداية المتابعة",form.tracking_start],["نهاية المتابعة",form.tracking_end],["المتابعة الأسبوعية",form.lateness_weekly_tracking],["ملاحظات",form.notes]]),[f.school]:x.school,[f.setDate]:form.tracking_start||meta.recordDate});}},
    absence_tracking:{key:"guidanceLog",async body(form,meta){const f=fields("guidanceLog"),x=common(form);return compact({[f.academicYear]:x.academicYear,[f.dep]:x.dep,[f.details]:block([["نوع السجل","حصر تحويل حالات الغياب"],["بداية المتابعة",form.tracking_start],["نهاية المتابعة",form.tracking_end],["المتابعة الأسبوعية",form.absence_weekly_tracking],["ملاحظات",form.notes]]),[f.school]:x.school,[f.setDate]:form.tracking_start||meta.recordDate});}}
  };
  function supported(recordType){return Boolean(specs[recordType]);}
  async function saveRecord(recordType,form={},meta={},existing={}){
    const spec=specs[recordType];if(!spec)return{supported:false};
    if(recordType==="group_guidance")return saveCollectiveViaWorkflow(form,meta,existing);
    if(recordType==="group_guidance_followup")return saveFollowupViaWorkflow(form,meta,existing);
    const st=store();if(!st)return{supported:false};
    const t=type(spec.key),body=await spec.body(form,meta);const existingId=existing?.type===t?existing.id||"":"";
    const row=await st.save(t,body,existingId);return{supported:true,type:t,id:st.idOf(row),row,remote:st.remoteEnabled(),body};
  }
  async function deleteRecord(typeName,id,record=null){
    if(record?.record_type==="group_guidance_followup")return deleteFollowupViaWorkflow(record||{});
    if(record?.record_type==="group_guidance")return deleteCollectiveViaWorkflow(record||{});
    if(!typeName||!id||!store())return false;return store().remove(typeName,id);
  }
  global.MishkatRecordsBubbleAdapter={schema,specs,supported,saveRecord,deleteRecord,listRemoteRecords};
})(window);
