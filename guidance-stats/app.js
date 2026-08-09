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
    {type:"Guidance_Mettings",label:"المقابلات",group:"individual",date:["Meeting Date"],student:["Student"],school:["School"],dep:["Dep"],year:["Academic Year"],term:["Terms"]},
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
  const $=id=>document.getElementById(id), norm=v=>String(v??"").toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/\s+/g," ").trim();
  const idOf=v=>{if(v==null)return"";if(typeof v==="string"||typeof v==="number")return String(v);return String(v._id||v.id||v.unique_id||v["unique id"]||v["Unique ID"]||"")};
  const labelOf=v=>{if(v==null)return"";if(typeof v==="string"||typeof v==="number")return String(v);return String(v["School Name"]||v["Dep. Name"]||v["Full Name"]||v.title||v.Title||v.name||v.Name||v.label||"")};
  const first=(row,keys)=>{for(const k of keys||[]){const v=row?.[k];if(v!==undefined&&v!==null&&v!=="")return v}return""};
  const relValues=v=>Array.isArray(v)?v:(v?[v]:[]);
  const relationMatches=(v,id,name)=>relValues(v).some(x=>(id&&idOf(x)===String(id))||(name&&norm(labelOf(x)||x)===norm(name)));
  const schoolRows=()=>{const raw=global.MishkatBubbleDirectory?.getSnapshot?.()?.raw||{};return raw.School||raw.schools||raw.Schools||[]};
  const termRows=()=>global.MishkatBubbleDirectory?.getSnapshot?.()?.terms||[];
  const yearRows=()=>global.MishkatBubbleDirectory?.getSnapshot?.()?.academicYears||[];
  function current(){return global.MishkatSchoolContext?.getContext?.()||{}};
  function params(){return new URLSearchParams(location.search)}
  function scopeParam(){return params().get("scope")==="supervision"?"supervision":"school"}
  function previewSupervisor(c){
    if(params().get("preview")!=="general_supervisor")return c;
    return {...c,roleKey:"general_supervisor",counselorRole:"المشرف العام (معاينة)",canViewSupervisionStats:true,supervisionScope:"all"};
  }
  function canAccess(c,scope){return scope==="supervision"?Boolean(c.canViewSupervisionStats):Boolean(c.canViewSchoolStats)}
  function allowedSchoolSet(c,scope){
    if(scope==="school")return{ids:new Set([c.schoolId].filter(Boolean).map(String)),names:new Set([c.schoolName].filter(Boolean).map(norm)),all:false};
    if(c.roleKey==="general_supervisor"||c.roleKey==="complexes_director")return{ids:new Set(),names:new Set(),all:true};
    const ids=new Set((c.assignedSchoolIds||[]).map(String));const names=new Set((c.assignedSchoolNames||[]).map(norm));if(!ids.size&&c.schoolId)ids.add(String(c.schoolId));if(!names.size&&c.schoolName)names.add(norm(c.schoolName));return{ids,names,all:false};
  }
  function schoolMap(){const m=new Map();schoolRows().forEach(r=>{const id=idOf(r);if(id)m.set(id,labelOf(r)||id)});return m}
  function schoolNameOf(v,map){if(Array.isArray(v))v=v[0];const id=idOf(v);return labelOf(v)||(id&&map.get(id))||String(v||"غير محدد")}
  function depMatch(v,c,scope){if(scope!=="school"||c.roleKey!=="counselor"||(!c.stageId&&!c.stage))return true;return relationMatches(v,c.stageId,c.stage)}
  function inAllowedSchool(v,allowed,map){if(allowed.all)return true;const id=idOf(Array.isArray(v)?v[0]:v);const name=schoolNameOf(v,map);return (id&&allowed.ids.has(String(id)))||(name&&allowed.names.has(norm(name)))}
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
  async function loadAll(){const store=global.MishkatBubbleStore;const out=[];for(const item of TYPES){try{const rows=await store.list(item.type,[],{sortField:"Modified Date",descending:true});out.push({item,rows:Array.isArray(rows)?rows:[]})}catch(e){console.warn("Statistics source unavailable",item.type,e);out.push({item,rows:[]})}}return out}
  function option(select,id,name,currentId){const o=document.createElement("option");o.value=id;o.textContent=name;if(String(id)===String(currentId||""))o.selected=true;select.appendChild(o)}
  function setupFilters(c,scope,allowed){
    const yf=$("yearFilter"),tf=$("termFilter"),sf=$("schoolFilter");yearRows().forEach(y=>option(yf,y.id,y.name,c.academicYearId));termRows().forEach(t=>option(tf,t.id,t.name,c.termId));
    if(scope==="supervision"){$("schoolFilterLabel").hidden=false;const sm=schoolMap();schoolRows().forEach(s=>{const id=idOf(s),name=labelOf(s)||id;if(allowed.all||allowed.ids.has(id)||allowed.names.has(norm(name)))option(sf,id,name,"")})}
  }
  function bars(target,rows){const box=$(target);box.innerHTML="";const max=Math.max(1,...rows.map(x=>x.value));if(!rows.length){box.innerHTML='<div class="empty">لا توجد بيانات في النطاق المحدد.</div>';return}rows.forEach(x=>{const el=document.createElement("div");el.className="bar-row";el.innerHTML=`<span>${x.label}</span><div class="bar"><i style="width:${Math.max(2,(x.value/max)*100)}%"></i></div><b>${x.value}</b>`;box.appendChild(el)})}
  function setMetric(id,v){$(id).textContent=String(v||0)}
  function render(data,c,scope,allowed){
    const filters=selectedFilters(),smap=schoolMap();const typeCounts=[],schoolAgg=new Map(),unique=new Set(),latest=[];const groups={individual:0,collective:0,contacts:0,attendance:0,plans:0,certificates:0};let total=0;
    data.forEach(({item,rows})=>{let count=0;rows.forEach(row=>{if(!rowPasses(item,row,c,scope,allowed,smap,filters))return;count++;total++;groups[item.group]=(groups[item.group]||0)+1;studentIds(item,row).forEach(x=>unique.add(x));const school=first(row,item.school),sid=idOf(Array.isArray(school)?school[0]:school)||schoolNameOf(school,smap),sname=schoolNameOf(school,smap);if(!schoolAgg.has(sid))schoolAgg.set(sid,{name:sname,total:0,students:new Set(),individual:0,contacts:0,collective:0});const a=schoolAgg.get(sid);a.total++;studentIds(item,row).forEach(x=>a.students.add(x));if(item.group==="individual")a.individual++;if(item.group==="contacts")a.contacts++;if(item.group==="collective")a.collective++;const d=dateOf(item,row);if(d)latest.push({label:item.label,school:sname,date:d})});if(count)typeCounts.push({label:item.label,value:count})});
    setMetric("mTotal",total);setMetric("mStudents",unique.size);setMetric("mIndividual",groups.individual);setMetric("mCollective",groups.collective);setMetric("mContacts",groups.contacts);setMetric("mAttendance",groups.attendance);setMetric("mPlans",groups.plans);setMetric("mCertificates",groups.certificates);
    bars("typeBars",typeCounts.sort((a,b)=>b.value-a.value).slice(0,12));bars("operationalBars",[{label:"السجلات الفردية",value:groups.individual},{label:"التواصل والمراسلات",value:groups.contacts},{label:"المواظبة والضعف",value:groups.attendance},{label:"البرامج الجماعية",value:groups.collective},{label:"الخطط والأحداث",value:groups.plans},{label:"الشهادات",value:groups.certificates}].filter(x=>x.value));
    const sb=$("schoolsBody");sb.innerHTML="";[...schoolAgg.values()].sort((a,b)=>b.total-a.total).forEach(a=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${a.name}</td><td><b>${a.total}</b></td><td>${a.students.size}</td><td>${a.individual}</td><td>${a.contacts}</td><td>${a.collective}</td>`;sb.appendChild(tr)});if(!sb.children.length)sb.innerHTML='<tr><td colspan="6" class="empty">لا توجد بيانات.</td></tr>';
    const lb=$("latestBody");lb.innerHTML="";latest.sort((a,b)=>b.date-a.date).slice(0,15).forEach(x=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${x.label}</td><td>${x.school}</td><td>${x.date.toLocaleDateString("ar-SA")}</td>`;lb.appendChild(tr)});if(!lb.children.length)lb.innerHTML='<tr><td colspan="3" class="empty">لا توجد نشاطات مؤرخة.</td></tr>';
    $("schoolsPanel").hidden=scope!=="supervision";
  }
  async function boot(){
    const scope=scopeParam();document.body.classList.add("loading");try{await global.MishkatBubbleDirectory?.load?.()}catch(e){console.warn(e)}try{global.MishkatSchoolContext?.build?.()}catch(e){}const c=previewSupervisor(current());
    if(!canAccess(c,scope)){$("denied").hidden=false;$("deniedText").textContent=`المسمى الحالي: ${c.counselorRole||"غير محدد"}. ${scope==="supervision"?"هذه الصفحة للمشرف العام ومشرف/منسق المجمع ومدير المجمعات فقط.":"هذه الصفحة لمدير المدرسة والموجه الطلابي فقط."}`;document.body.classList.remove("loading");return}
    $("app").hidden=false;$("who").textContent=c.counselorName||"—";$("role").textContent=c.counselorRole||"—";$("currentYear").textContent=c.academicYear||"—";$("currentTerm").textContent=c.term||"—";
    const allowed=allowedSchoolSet(c,scope);if(scope==="school"){$("scopeKicker").textContent="إحصائيات المدرسة";$("pageTitle").textContent="إحصائيات التوجيه الطلابي للمدرسة";$("scopeName").textContent=c.schoolName||"—";$("pageSubtitle").textContent=c.roleKey==="counselor"?"إحصائيات المدرسة ضمن مرحلة الموجه الموزع عليها":"إحصائيات التوجيه الطلابي على مستوى المدرسة"}else{$("scopeKicker").textContent="المتابعة الإشرافية";$("pageTitle").textContent="الإحصائيات الإشرافية للتوجيه الطلابي";$("scopeName").textContent=c.roleKey==="complex_supervisor"?(c.assignedSchoolNames||[]).join("، ")||c.campus||"نطاق المجمع":"جميع المدارس";$("pageSubtitle").textContent="مقارنة مباشرة بين المدارس ضمن نطاق الصلاحية";if(!allowed.all&&!allowed.ids.size&&!allowed.names.size){$("warning").hidden=false;$("warning").textContent="لا توجد مدارس موزعة على هذا المستخدم في Users Data؛ لذلك لن تُعرض بيانات مدارس خارج نطاقه."}}
    setupFilters(c,scope,allowed);let data=await loadAll();const rerender=()=>render(data,c,scope,allowed);$("yearFilter").onchange=rerender;$("termFilter").onchange=rerender;$("schoolFilter").onchange=rerender;$("printBtn").onclick=()=>print();$("refreshBtn").onclick=async()=>{document.body.classList.add("loading");data=await loadAll();rerender();document.body.classList.remove("loading")};rerender();document.body.classList.remove("loading");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
