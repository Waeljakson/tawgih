"use strict";
(function(global){
  const state={mode:"group",selectedEmployee:null,employees:[],messages:[],loading:false,poll:null};
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm=s=>String(s??"").trim().toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/\s+/g," ");
  const idOf=v=>String(v?._id||v?.id||v?.unique_id||v?.["unique id"]||v?.["Unique ID"]||v||"");
  const initials=n=>String(n||"م").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("")||"م";
  const guidanceRole=r=>/موجه|توجيه|ارشاد|مرشد|مشرف|منسق|مدير|guidance|counsel|supervisor|coordinator|principal|manager/.test(norm(r));
  function ctx(){return global.MishkatSchoolContext?.getContext?.()||{};}
  function store(){return global.MishkatBubbleStore;}
  function directory(){return global.MishkatBubbleDirectory;}
  function currentUserId(){const c=ctx();return String(c.id||directory()?.findEmployee?.(c.counselorName)?.id||"school-user");}
  function currentName(){return ctx().counselorName||"المستخدم الحالي";}
  function setConn(text,kind=""){const el=$("connectionState");if(!el)return;el.textContent=text;el.className="connection-state"+(kind?" "+kind:"");}
  function setContext(){const c=ctx();$("ctxUser").textContent=c.counselorName||"—";$("ctxSchool").textContent=c.schoolName||"—";$("ctxStage").textContent=c.stage||"—";}
  function loadEmployees(){
    const snap=directory()?.getSnapshot?.()||{};let rows=Array.isArray(snap.employees)?snap.employees:[];
    const me=currentUserId();const guidance=rows.filter(x=>guidanceRole(x.role));
    rows=(guidance.length?guidance:rows).filter(x=>x.id!==me&&x.name);
    rows.sort((a,b)=>String(a.name).localeCompare(String(b.name),"ar"));state.employees=rows;renderContacts();
  }
  function renderContacts(){
    const q=norm($("contactSearch")?.value||"");const rows=state.employees.filter(e=>!q||norm([e.name,e.role,e.schoolName,e.stage].join(" ")).includes(q));
    const list=$("contactList");if(!list)return;
    if(!rows.length){list.innerHTML='<div class="loading-line">لا يوجد مستخدمون مطابقون.</div>';return;}
    list.innerHTML=rows.map(e=>`<button class="contact-item ${state.selectedEmployee?.id===e.id?'active':''}" type="button" data-id="${esc(e.id)}"><span class="contact-avatar">${esc(initials(e.name))}</span><span class="contact-copy"><b>${esc(e.name)}</b><span>${esc([e.role,e.schoolName].filter(Boolean).join(" · ")||"مستخدم المنصة")}</span></span></button>`).join("");
    list.querySelectorAll(".contact-item").forEach(btn=>btn.addEventListener("click",()=>selectEmployee(btn.dataset.id)));
  }
  async function selectEmployee(id){state.selectedEmployee=state.employees.find(e=>e.id===id)||null;renderContacts();updateConversationHead();await loadMessages();}
  function updateConversationHead(){
    if(state.mode==="group"){$("conversationAvatar").textContent="ت";$("conversationName").textContent="مجموعة التوجيه الطلابي";$("conversationMeta").textContent="الشات الجماعي للموجهين والمشرفين";$("messageInput").placeholder="اكتب رسالة للمجموعة...";}
    else if(state.selectedEmployee){const e=state.selectedEmployee;$("conversationAvatar").textContent=initials(e.name);$("conversationName").textContent=e.name;$("conversationMeta").textContent=[e.role,e.schoolName,e.stage].filter(Boolean).join(" · ")||"محادثة فردية";$("messageInput").placeholder=`اكتب رسالة إلى ${e.name}...`;}
    else{$("conversationAvatar").textContent="؟";$("conversationName").textContent="اختر مستخدمًا";$("conversationMeta").textContent="اختر مستخدمًا من القائمة لبدء محادثة فردية";$("messageInput").placeholder="اختر مستخدمًا أولًا...";}
    $("sendMessageBtn").disabled=state.mode==="direct"&&!state.selectedEmployee;
  }
  async function setMode(mode){state.mode=mode;$("groupModeBtn").classList.toggle("active",mode==="group");$("directModeBtn").classList.toggle("active",mode==="direct");$("groupInfo").hidden=mode!=="group";$("directPicker").hidden=mode!=="direct";updateConversationHead();await loadMessages();}
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
        rows=rows.filter(r=>{const meta=noteMeta(r);const sender=senderInfo(r);return (!meta.scope||meta.scope==="guidance_all")&&(guidanceRole(sender.role)||sender.id===currentUserId()||!sender.role);});
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
      await store().logMessage({messageType:state.mode==="group"?"chat_group":"chat_direct",subject:state.mode==="group"?"شات التوجيه الطلابي":`محادثة مع ${state.selectedEmployee?.name||"مستخدم"}`,messageText:text,recipientEmployeeId:state.mode==="direct"?state.selectedEmployee.id:undefined,recipientType:state.mode==="group"?"guidance_group":"internal_employee",sent:true,channel:"internal_chat",notes:JSON.stringify(meta)});
      input.value="";resizeInput();updateCount();await loadMessages({silent:true});setConn(store().remoteEnabled?.()?"تم الإرسال":"تم الحفظ محليًا");
    }catch(err){console.error(err);setConn("تعذر الإرسال","error");}
    finally{updateConversationHead();}
  }
  function resizeInput(){const el=$("messageInput");el.style.height="auto";el.style.height=Math.min(120,Math.max(45,el.scrollHeight))+"px";}
  function updateCount(){$("charCount").textContent=`${$("messageInput").value.length} / 3000`;}
  function bind(){
    $("groupModeBtn").addEventListener("click",()=>setMode("group"));$("directModeBtn").addEventListener("click",()=>setMode("direct"));$("contactSearch").addEventListener("input",renderContacts);$("refreshChatBtn").addEventListener("click",()=>loadMessages());$("sendMessageBtn").addEventListener("click",sendMessage);
    $("messageInput").addEventListener("input",()=>{resizeInput();updateCount();});$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();sendMessage();}});
    global.addEventListener("mishkat:school-context-ready",()=>{setContext();loadEmployees();});global.addEventListener("mishkat:school-context-changed",()=>{setContext();loadEmployees();});
  }
  async function boot(){bind();setContext();try{await directory()?.load?.();}catch(_e){}loadEmployees();updateConversationHead();await loadMessages();state.poll=setInterval(()=>{if(!document.hidden)loadMessages({silent:true});},7000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadMessages({silent:true});});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
