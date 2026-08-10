"use strict";
/*
 * Mishkat School Platform — Bubble persistence bridge V1.0.15
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
    const c=cfg();
    const r=await timeout(fetch(url,{method:options.method||"GET",credentials:c.credentials||"include",headers:await headers(options.headers),body:options.body===undefined?undefined:JSON.stringify(options.body),cache:"no-store"}),Number(c.timeoutMs)||12000);
    const txt=await r.text();const data=txt?safeParse(txt,txt):null;
    if(!r.ok){const e=new Error(data?.message||data?.error||`HTTP ${r.status}`);e.status=r.status;e.data=data;throw e}
    return data;
  }
  function normalizeResponse(data){
    if(Array.isArray(data))return data;
    if(Array.isArray(data?.response?.results))return data.response.results;
    if(Array.isArray(data?.response))return data.response;
    if(Array.isArray(data?.results))return data.results;
    return data?.response||data;
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
    if(remoteEnabled())try{return await remoteList(t,constraints,options.sortField,options.descending!==false)}catch(e){console.warn(`Bubble list fallback: ${t}`,e)}
    return localList(t,constraints);
  }
  async function get(t,id){if(remoteEnabled())try{return await remoteGet(t,id)}catch(e){console.warn(`Bubble get fallback: ${t}`,e)}return localGet(t,id);}
  async function save(t,body,id=""){
    if(remoteEnabled())try{return id?await remoteUpdate(t,id,body):await remoteCreate(t,body)}catch(e){console.warn(`Bubble save fallback: ${t}`,e)}
    return localSave(t,body,id);
  }
  async function remove(t,id){if(remoteEnabled())try{return await remoteDelete(t,id)}catch(e){console.warn(`Bubble delete fallback: ${t}`,e)}return localDelete(t,id);}
  function relation(v){return v||undefined;}
  function compact(obj){const out={};Object.entries(obj||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")out[k]=v});return out;}
  function commonContext(){const c=ctx();return{guide:relation(c.id),school:relation(c.schoolId),department:relation(c.stageId),academicYear:relation(c.academicYearId),term:relation(c.termId)};}
  function planMetaPayload(plan){
    return JSON.stringify({_mishkatVersion:"1.0.15",form:plan?.form||{},holidays:plan?.holidays||[],introduction:plan?.introduction||"",segments:plan?.segments||[],savedAt:now()});
  }
  function readPlanMeta(row){const raw=row?.Notes??row?.notes??"";return typeof raw==="string"?safeParse(raw,{}):(raw||{});}
  async function savePlanModel(plan,existingId=""){
    const c=ctx(),fm=fieldMap("guidancePlan"),t=typeName("guidancePlan"),cc=commonContext();
    const progress=plan?.progress||{};
    const body=compact({[fm.title||"Title"]:plan?.form?.title||"خطة الموجه الطلابي",[fm.academicYear||"AcademicYear"]:cc.academicYear,[fm.term||"Term"]:cc.term,[fm.guide||"Guide"]:cc.guide,[fm.school||"School"]:cc.school,[fm.department||"Department"]:cc.department,[fm.status||"Status"]:progress.percent===100?"completed":"in_progress",[fm.notes||"Notes"]:planMetaPayload(plan),[fm.active||"Active"]:true});
    const head=await save(t,body,existingId);
    const planId=idOf(head);
    // Normalize every trackable weekly item into Guidance_Plan_Item. The full model remains in Notes for lossless reopening.
    const itemType=typeName("guidancePlanItem"),im=fieldMap("guidancePlanItem");
    const old=await list(itemType,[{key:im.plan||"Plan",constraint_type:"equals",value:planId}]).catch(()=>[]);
    for(const r of old)await remove(itemType,idOf(r));
    const segments=(plan?.segments||[]).filter(s=>s?.type==="week");
    const savedIds=[];
    for(const seg of segments){
      const groups=[["task",seg.tasks||[]],["program",seg.programs||[]],["emerging",seg.emerging||[]]];
      for(const [category,items] of groups){for(const item of items){if(!String(item?.text||"").trim())continue;const status=item.done?"done":item.notDone?"not_done":"pending";const ib=compact({[im.plan||"Plan"]:planId,[im.title||"Title"]:String(item.text).trim(),[im.description||"Description"]:item.note||seg.weekNote||"",[im.category||"Category"]:category,[im.startDate||"StartDate"]:seg.start,[im.endDate||"EndDate"]:seg.end,[im.targetGroup||"TargetGroup"]:plan?.form?.stage||c.stage||"",[im.responsible||"Responsible"]:cc.guide,[im.executionStatus||"ExecutionStatus"]:status,[im.executionPercent||"ExecutionPercent"]:item.done?100:0,[im.notes||"Notes"]:JSON.stringify({weekNumber:seg.number,fixed:Boolean(item.fixed)}),[im.completed||"Completed"]:Boolean(item.done)});const r=await save(itemType,ib);savedIds.push(idOf(r));}}
    }
    // The authoritative relation is Guidance_Plan_Item.Plan. We intentionally do not require writing the reverse Items list,
    // because Bubble Data API list-field formats can differ by deployment/privacy setup.
    return head;
  }
  async function listPlans(){const fm=fieldMap("guidancePlan"),cc=commonContext();const cs=[];if(cc.guide)cs.push({key:fm.guide||"Guide",constraint_type:"equals",value:cc.guide});return list(typeName("guidancePlan"),cs);}
  async function getPlanModel(id){const row=await get(typeName("guidancePlan"),id);if(!row)return null;const meta=readPlanMeta(row);return{row,model:{id,...meta,form:meta.form||{},holidays:meta.holidays||[],introduction:meta.introduction||"",segments:meta.segments||[]}};}
  async function deletePlanModel(id){const im=fieldMap("guidancePlanItem"),it=typeName("guidancePlanItem");const items=await list(it,[{key:im.plan||"Plan",constraint_type:"equals",value:id}]).catch(()=>[]);for(const r of items)await remove(it,idOf(r));return remove(typeName("guidancePlan"),id);}
  async function saveEventModel(event,id=""){
    const f=fieldMap("guidanceEvent"),cc=commonContext();const body=compact({[f.title||"Title"]:event.title,[f.eventDate||"EventDate"]:event.event_date||event.date,[f.endDate||"EndDate"]:event.end_date||event.endDate,[f.eventType||"EventType"]:event.category||event.eventType||"custom",[f.description||"Description"]:event.details||event.description||"",[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.student||"Student"]:event.studentId,[f.planItem||"PlanItem"]:event.planItemId,[f.reminder||"Reminder"]:event.reminder!==false,[f.reminderDate||"ReminderDate"]:event.reminderDate,[f.completed||"Completed"]:Boolean(event.completed),[f.notes||"Notes"]:event.priority?JSON.stringify({priority:event.priority}):event.notes||""});return save(typeName("guidanceEvent"),body,id);}
  async function listEvents(){const f=fieldMap("guidanceEvent"),cc=commonContext();const cs=[];if(cc.guide)cs.push({key:f.guide||"Guide",constraint_type:"equals",value:cc.guide});return list(typeName("guidanceEvent"),cs,{sortField:f.eventDate||"EventDate",descending:false});}
  async function deleteEvent(id){return remove(typeName("guidanceEvent"),id);}
  async function logMessage(data){const f=fieldMap("guidanceMessage"),cc=commonContext();const body=compact({[f.messageType||"MessageType"]:data.messageType||data.category||"general",[f.subject||"Subject"]:data.subject||data.topic||"",[f.messageText||"MessageText"]:data.messageText||data.text||"",[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.student||"Student"]:data.studentId,[f.parentPhone||"ParentPhone"]:data.parentPhone,[f.recipientEmployee||"RecipientEmployee"]:data.recipientEmployeeId,[f.recipientType||"RecipientType"]:data.recipientType||"parent",[f.createdDateCustom||"CreatedDateCustom"]:data.createdDate||now(),[f.sent||"Sent"]:Boolean(data.sent),[f.sentDate||"SentDate"]:data.sent?data.sentDate||now():undefined,[f.channel||"Channel"]:data.channel||"copy",[f.notes||"Notes"]:data.notes||""});return save(typeName("guidanceMessage"),body);}
  async function savePresentationModel(data,id=""){const f=fieldMap("guidancePresentation"),cc=commonContext();const payload=compact({[f.title||"Title"]:data.title||data.topic||"عرض تقديمي",[f.topic||"Topic"]:data.topic||data.title||"",[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.targetGroup||"TargetGroup"]:data.targetGroup||ctx().studentsLabel,[f.grade||"Grade"]:data.gradeId,[f.presentationData||"PresentationData"]:typeof data.presentationData==="string"?data.presentationData:JSON.stringify(data.presentationData||data),[f.theme||"Theme"]:data.theme||"default",[f.slidesCount||"SlidesCount"]:Number(data.slidesCount||data.slides?.length||0),[f.createdAt||"CreatedAt"]:data.createdAt||now(),[f.updatedAt||"UpdatedAt"]:now(),[f.status||"Status"]:data.status||"saved"});return save(typeName("guidancePresentation"),payload,id);}
  async function saveCertificateModel(data){const f=fieldMap("guidanceCertificate"),cc=commonContext();const body=compact({[f.student||"Student"]:data.studentId,[f.studentName||"StudentName"]:data.studentName||data.student,[f.certificateType||"CertificateType"]:data.certificateType||data.category,[f.reason||"Reason"]:data.reason||data.achievement||data.body,[f.issueDate||"IssueDate"]:data.issueDate||data.date||now().slice(0,10),[f.guide||"Guide"]:cc.guide,[f.school||"School"]:cc.school,[f.department||"Department"]:cc.department,[f.academicYear||"AcademicYear"]:cc.academicYear,[f.term||"Term"]:cc.term,[f.schoolManager||"SchoolManager"]:ctx().managerId,[f.certificateNumber||"CertificateNumber"]:data.certificateNumber||data.serial,[f.template||"Template"]:data.templateId,[f.notes||"Notes"]:data.notes||""});return save(typeName("guidanceCertificate"),body);}
  async function listTemplates(templateType=""){const f=fieldMap("guidanceTemplate"),cs=[{key:f.active||"Active",constraint_type:"equals",value:true}];if(templateType)cs.push({key:f.templateType||"TemplateType",constraint_type:"equals",value:templateType});const rows=await list(typeName("guidanceTemplate"),cs,{sortField:f.order||"Order",descending:false});return rows;}
  global.MishkatBubbleStore={schema,remoteEnabled,list,get,save,remove,savePlanModel,listPlans,getPlanModel,deletePlanModel,saveEventModel,listEvents,deleteEvent,logMessage,savePresentationModel,saveCertificateModel,listTemplates,idOf,ctx};
  global.dispatchEvent(new CustomEvent("mishkat:bubble-store-ready"));
})(window);
