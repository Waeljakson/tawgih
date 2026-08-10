"use strict";
(function(global){
  const state={mode:"group",selectedEmployee:null,employees:[],allCounselors:[],messages:[],loading:false,poll:null};
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm=s=>String(s??"").trim().toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/\s+/g," ");
  const idOf=v=>String(v?._id||v?.id||v?.unique_id||v?.["unique id"]||v?.["Unique ID"]||v||"");
  const initials=n=>String(n||"م").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("")||"م";
  const counselorRole=r=>{
    const value=norm(r);
    if(!value)return false;
    const arabic=(value.includes("موجه")||value.includes("موجهه")) && (value.includes("طلاب")||value.includes("طلابي"));
    const english=value.includes("student") && (value.includes("counsel")||value.includes("guidance"));
    return arabic||english;
  };

  const fullNameOf=e=>String(
    e?.fullName ||
    e?.raw?.["Full Name"] ||
    e?.raw?.full_name ||
    e?.name ||
    ""
  ).trim();

  const currentJobOf=e=>{
    const raw=e?.raw||{};
    const candidates=[
      e?.currentJobName,
      e?.role,
      raw["Current Job Name"],
      raw.current_job_name,
      raw["Job Title Name"],
      raw.job_title_name,
      raw["Current Job"],
      raw.current_job,
      raw["Job Title"],
      raw.job_title
    ];
    for(const value of candidates){
      if(value===undefined||value===null||value==="")continue;
      if(typeof value==="string"||typeof value==="number"){
        const text=String(value).trim();
        if(text && !/^\d{10,}x\d+$/i.test(text))return text;
      }else if(typeof value==="object"){
        const text=String(
          value["Job Titel"] ||
          value["Job Title"] ||
          value["Titel"] ||
          value["Title"] ||
          value["title"] ||
          value["Name"] ||
          value["name"] ||
          value["Arabic Name"] ||
          ""
        ).trim();
        if(text)return text;
      }
    }
    return "";
  };
  function ctx(){return global.MishkatSchoolContext?.getContext?.()||{};}
  function store(){return global.MishkatBubbleStore;}
  function directory(){return global.MishkatBubbleDirectory;}
  function currentUserId(){const c=ctx();return String(c.id||directory()?.findEmployee?.(c.counselorName)?.id||"school-user");}
  function currentName(){return ctx().counselorName||"المستخدم الحالي";}
  function setConn(text,kind=""){const el=$("connectionState");if(!el)return;el.textContent=text;el.className="connection-state"+(kind?" "+kind:"");}
  function setContext(){const c=ctx();$("ctxUser").textContent=c.counselorName||"—";$("ctxSchool").textContent=c.schoolName||"—";$("ctxStage").textContent=c.stage||"—";}
  function loadEmployees(){
    const snap=directory()?.getSnapshot?.()||{};
    const rows=Array.isArray(snap.employees)?snap.employees:[];
    const me=currentUserId();

    // Users Data -> Current Job = موجه طلابي
    // Display text is always Users Data -> Full Name.
    const counselors=rows
      .map(e=>({
        ...e,
        chatFullName:fullNameOf(e),
        chatCurrentJob:currentJobOf(e)
      }))
      .filter(e=>e.chatFullName && e?.active!==false && counselorRole(e.chatCurrentJob))
      .sort((a,b)=>a.chatFullName.localeCompare(b.chatFullName,"ar"));

    state.allCounselors=counselors;
    state.employees=counselors.filter(e=>String(e.id)!==String(me));

    const total=counselors.length;
    if($("counselorCount"))$("counselorCount").textContent=String(total);
    if($("groupCounselorCount"))$("groupCounselorCount").textContent=String(total);

    console.info("Mishkat counselor chat directory",{
      totalUsersData:rows.length,
      counselors:counselors.length,
      sample:counselors[0]?{
        fullName:counselors[0].chatFullName,
        currentJob:counselors[0].chatCurrentJob
      }:null,
      unresolvedCurrentJobs:rows.filter(e=>e?.currentJobId&&!currentJobOf(e)).length
    });

    renderContacts();
  }

  function renderContacts(){
    const q=norm($("contactSearch")?.value||"");
    const rows=state.employees.filter(e=>
      !q||norm([e.chatFullName,e.chatCurrentJob,e.schoolName,e.stage].join(" ")).includes(q)
    );
    const list=$("contactList");
    if(!list)return;

    $("groupChatItem")?.classList.toggle("active",state.mode==="group");

    if(!rows.length){
      list.innerHTML='<div class="loading-line">لا يوجد موجهون مطابقون للبحث.</div>';
      return;
    }

    list.innerHTML=rows.map(e=>`
      <button class="contact-item ${state.mode==="direct"&&state.selectedEmployee?.id===e.id?"active":""}" type="button" data-id="${esc(e.id)}">
        <span class="contact-avatar">${esc(initials(e.chatFullName))}</span>
        <span class="contact-copy">
          <b>${esc(e.chatFullName)}</b>
          <span>${esc([e.chatCurrentJob,e.schoolName,e.stage].filter(Boolean).join(" · ")||"موجه طلابي")}</span>
        </span>
        <small class="contact-direct-badge">فردي</small>
      </button>`).join("");

    list.querySelectorAll(".contact-item").forEach(btn=>
      btn.addEventListener("click",()=>selectEmployee(btn.dataset.id))
    );
  }

  async function selectGroup(){
    state.mode="group";
    state.selectedEmployee=null;
    renderContacts();
    updateConversationHead();
    await loadMessages();
  }

  async function selectEmployee(id){
    const employee=state.employees.find(e=>e.id===id)||null;
    if(!employee)return;
    state.mode="direct";
    state.selectedEmployee=employee;
    renderContacts();
    updateConversationHead();
    await loadMessages();
  }

  function updateConversationHead(){
    if(state.mode==="group"){
      const count=state.allCounselors.length;
      $("conversationAvatar").textContent="م";
      $("conversationName").textContent="مجموعة الموجهين الطلابيين";
      $("conversationMeta").textContent=`محادثة جماعية · ${count} موجه طلابي`;
      $("messageInput").placeholder="اكتب رسالة لكل الموجهين الطلابيين...";
    }else if(state.selectedEmployee){
      const e=state.selectedEmployee;
      $("conversationAvatar").textContent=initials(e.chatFullName||fullNameOf(e));
      $("conversationName").textContent=e.chatFullName||fullNameOf(e);
      $("conversationMeta").textContent=[e.chatCurrentJob||currentJobOf(e),e.schoolName,e.stage].filter(Boolean).join(" · ")||"محادثة فردية";
      $("messageInput").placeholder=`اكتب رسالة خاصة إلى ${e.chatFullName||fullNameOf(e)}...`;
    }else{
      $("conversationAvatar").textContent="؟";
      $("conversationName").textContent="اختر موجهًا طلابيًا";
      $("conversationMeta").textContent="اضغط على اسم موجه من قائمة المستخدمين";
      $("messageInput").placeholder="اختر موجهًا أولًا...";
    }
    $("sendMessageBtn").disabled=state.mode==="direct"&&!state.selectedEmployee;
  }
  function rowVal(row,key){return row?.[key]??row?.[key.toLowerCase()]??"";}
  function noteMeta(row){const raw=row?.Notes||row?.notes||"";if(typeof raw!=="string")return raw||{};try{return JSON.parse(raw)}catch{return{}}}
  function senderInfo(row){const sid=idOf(row?.Guide||row?.guide);const found=directory()?.findEmployee?.(sid);const meta=noteMeta(row);return{id:sid,name:found?.name||meta.senderName||((sid===currentUserId())?currentName():"مستخدم"),role:found?.role||meta.senderRole||"",school:found?.schoolName||meta.senderSchool||""};}
  function createdAt(row){return row?.CreatedDateCustom||row?.["Created Date"]||row?.SentDate||row?.["Modified Date"]||"";}
  function fmtTime(v){if(!v)return"";const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(d);}
  function renderMessages(){
    const list=$("messageList"),empty=$("chatEmpty");if(!list)return;
    const me=currentUserId();const rows=[...state.messages].sort((a,b)=>new Date(createdAt(a)||0)-new Date(createdAt(b)||0));
    empty.hidden=rows.length>0;list.innerHTML=rows.map(row=>{const sender=senderInfo(row);const mine=sender.id===me;const text=row?.MessageText||row?.messageText||"";return `<div class="message-row ${mine?'mine':'other'}"><div class="message-avatar">${esc(initials(sender.name))}</div><div class="message-bubble"><div class="message-author"><b>${esc(mine?'أنت':sender.name)}</b>${sender.role?`<span>${esc(sender.role)}</span>`:''}</div><div class="message-text">${esc(text)}</div><span class="message-time">${esc(fmtTime(createdAt(row)))}</span></div></div>`}).join("");
    requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight;});
  }
  async function loadMessages({silent=false}={}){
    if(state.loading)return;state.loading=true;if(!silent)setConn("جارٍ التحديث...","loading");
    try{
      const s=store();if(!s)throw new Error("store_not_ready");
      const type="Guidance_Message",field="MessageType",kind=state.mode==="group"?"chat_group":"chat_direct";
      let rows=await s.list(type,[{key:field,constraint_type:"equals",value:kind}],{sortField:"CreatedDateCustom",descending:false});
      rows=Array.isArray(rows)?rows:[];
      if(state.mode==="group"){
        rows=rows.filter(r=>{const meta=noteMeta(r);return !meta.scope||meta.scope==="guidance_all";});
      }else{
        const peer=state.selectedEmployee?.id,me=currentUserId();
        if(!peer){rows=[];}else rows=rows.filter(r=>{const from=idOf(r?.Guide||r?.guide),to=idOf(r?.RecipientEmployee||r?.recipientEmployee);return(from===me&&to===peer)||(from===peer&&to===me);});
      }
      state.messages=rows;renderMessages();setConn(s.remoteEnabled?.()?"متصل":"وضع محلي");
    }catch(err){console.error(err);state.messages=[];renderMessages();setConn("تعذر التحديث","error");}
    finally{state.loading=false;}
  }
  async function sendMessage(){
    const input=$("messageInput");const text=String(input.value||"").trim();if(!text)return;if(state.mode==="direct"&&!state.selectedEmployee)return;
    const btn=$("sendMessageBtn");btn.disabled=true;setConn("جارٍ الإرسال...","loading");
    const c=ctx();const meta={scope:state.mode==="group"?"guidance_all":"direct",senderName:currentName(),senderRole:c.counselorRole||"",senderSchool:c.schoolName||"",senderStage:c.stage||""};
    try{
      await store().logMessage({messageType:state.mode==="group"?"chat_group":"chat_direct",subject:state.mode==="group"?"مجموعة الموجهين الطلابيين":`محادثة مع ${state.selectedEmployee?.name||"مستخدم"}`,messageText:text,recipientEmployeeId:state.mode==="direct"?state.selectedEmployee.id:undefined,recipientType:state.mode==="group"?"student_counselors_group":"internal_employee",sent:true,channel:"internal_chat",notes:JSON.stringify(meta)});
      input.value="";resizeInput();updateCount();await loadMessages({silent:true});setConn(store().remoteEnabled?.()?"تم الإرسال":"تم الحفظ محليًا");
    }catch(err){console.error(err);setConn("تعذر الإرسال","error");}
    finally{updateConversationHead();}
  }
  function resizeInput(){const el=$("messageInput");el.style.height="auto";el.style.height=Math.min(120,Math.max(45,el.scrollHeight))+"px";}
  function updateCount(){$("charCount").textContent=`${$("messageInput").value.length} / 3000`;}
  function bind(){
    $("groupChatItem").addEventListener("click",selectGroup);
    $("contactSearch").addEventListener("input",renderContacts);
    $("refreshChatBtn").addEventListener("click",()=>loadMessages());
    $("sendMessageBtn").addEventListener("click",sendMessage);
    $("messageInput").addEventListener("input",()=>{resizeInput();updateCount();});
    $("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();sendMessage();}});
    global.addEventListener("mishkat:school-context-ready",()=>{setContext();loadEmployees();});
    global.addEventListener("mishkat:school-context-changed",()=>{setContext();loadEmployees();});
  }
  async function boot(){bind();setContext();try{await directory()?.load?.();}catch(_e){}loadEmployees();updateConversationHead();await loadMessages();state.poll=setInterval(()=>{if(!document.hidden)loadMessages({silent:true});},7000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadMessages({silent:true});});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
