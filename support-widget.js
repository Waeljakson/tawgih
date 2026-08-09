(() => {
  "use strict";
  if (window.__unifiedSupportWidgetLoaded) return;
  window.__unifiedSupportWidgetLoaded = true;

  const SUPPORT_URL = "https://fpicgtldwfevdvpbxkjf.supabase.co";
  const SUPPORT_KEY = "sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
  const db = window.__UNIFIED_PLATFORM_DB__ || window.supabase?.createClient(SUPPORT_URL, SUPPORT_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  if (!db) return;

  const platformName = document.documentElement.dataset.platformName || document.title || "بوابة المنصات";
  let user = null;
  let thread = null;
  let messages = [];
  let pollingTimer = null;
  let loading = false;

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const formatDateTime = value => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("ar-SA", {dateStyle:"short", timeStyle:"short"});
  };

  function buildWidget(){
    if (document.getElementById("unifiedSupportToggle")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <button id="unifiedSupportToggle" class="unified-support-toggle unified-support-hidden" type="button" aria-controls="unifiedSupportPanel" aria-expanded="false">
        <span class="support-icon" aria-hidden="true">💬</span><span class="support-label">الدعم الفني</span>
        <b id="unifiedSupportUnread" class="support-unread" hidden>0</b>
      </button>
      <aside id="unifiedSupportPanel" class="unified-support-panel" hidden aria-label="محادثة الدعم الفني">
        <header class="unified-support-head">
          <div class="unified-support-head-copy"><div class="unified-support-head-icon">💬</div><div><span>مركز المساعدة</span><strong>تواصل مع الدعم الفني</strong><small>المحادثة موحدة بين جميع المنصات</small></div></div>
          <div class="unified-support-head-actions"><button id="unifiedSupportRefresh" type="button" title="تحديث المحادثة">↻</button><button id="unifiedSupportClose" type="button" aria-label="إغلاق">×</button></div>
        </header>
        <div class="unified-support-context">أنت تتواصل من: <b>${escapeHtml(platformName)}</b>. ستجد المحادثة نفسها عند الانتقال إلى أي منصة أخرى.</div>
        <div id="unifiedSupportMessages" class="unified-support-messages"><div class="unified-support-empty"><b>كيف نساعدك؟</b>اكتب استفسارك وسيظهر رد مدير النظام داخل المحادثة.</div></div>
        <div class="unified-support-compose"><textarea id="unifiedSupportInput" rows="2" maxlength="2000" placeholder="اكتب رسالتك هنا..."></textarea><button id="unifiedSupportSend" class="unified-support-send" type="button">إرسال</button></div>
        <div id="unifiedSupportStatus" class="unified-support-status" hidden></div>
      </aside>`);
  }

  const nodes = () => ({
    toggle: document.getElementById("unifiedSupportToggle"),
    badge: document.getElementById("unifiedSupportUnread"),
    panel: document.getElementById("unifiedSupportPanel"),
    refresh: document.getElementById("unifiedSupportRefresh"),
    close: document.getElementById("unifiedSupportClose"),
    messages: document.getElementById("unifiedSupportMessages"),
    input: document.getElementById("unifiedSupportInput"),
    send: document.getElementById("unifiedSupportSend"),
    status: document.getElementById("unifiedSupportStatus")
  });

  function showStatus(message, isError=false){
    const {status}=nodes(); if(!status) return;
    status.hidden=!message; status.textContent=message||""; status.classList.toggle("error",isError);
  }
  function setLoggedIn(loggedIn){
    const {toggle,panel}=nodes(); if(!toggle) return;
    toggle.classList.toggle("unified-support-hidden",!loggedIn);
    if(!loggedIn && panel) panel.hidden=true;
  }
  function renderMessages(){
    const {messages:box}=nodes(); if(!box) return;
    if(!messages.length){box.innerHTML='<div class="unified-support-empty"><b>كيف نساعدك؟</b>اكتب استفسارك وسيظهر رد مدير النظام داخل المحادثة.</div>';return;}
    box.innerHTML=messages.map(message=>{
      const mine=message.sender_id===user?.id;
      return `<div class="unified-support-message ${mine?"mine":"theirs"}"><div>${escapeHtml(message.message).replaceAll("\n","<br>")}</div><small>${mine?"أنت":"الدعم"} · ${escapeHtml(formatDateTime(message.created_at))}</small></div>`;
    }).join("");
    requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight;});
  }
  function updateUnread(){
    const {badge,panel}=nodes(); if(!badge||!user) return;
    const lastRead=new Date(thread?.last_read_by_user_at||0).getTime();
    const unread=messages.filter(message=>message.sender_id!==user.id && new Date(message.created_at).getTime()>lastRead).length;
    badge.hidden=!unread || !panel?.hidden;
    badge.textContent=String(Math.min(unread,99));
  }

  async function loadChat(markRead=false){
    if(!user||loading)return; loading=true;
    try{
      const {data:threadData,error:threadError}=await db.from("premium_support_threads")
        .select("id,user_id,status,last_message_at,last_read_by_user_at,last_read_by_admin_at,created_at")
        .eq("user_id",user.id).maybeSingle();
      if(threadError)throw threadError;
      thread=threadData||null;
      if(!thread){messages=[];renderMessages();updateUnread();showStatus("");return;}
      const {data,error}=await db.from("premium_support_messages")
        .select("id,thread_id,sender_id,message,created_at")
        .eq("thread_id",thread.id).order("created_at",{ascending:true}).limit(400);
      if(error)throw error;
      messages=data||[];renderMessages();
      if(markRead){
        const {error:readError}=await db.rpc("premium_support_mark_read",{p_thread_id:thread.id});
        if(!readError)thread.last_read_by_user_at=new Date().toISOString();
      }
      updateUnread();showStatus(thread.status==="closed"?"المحادثة مغلقة حاليًا. إرسال رسالة جديدة يعيد فتحها.":"");
    }catch(error){showStatus(error.message||"تعذر تحميل محادثة الدعم.",true);}
    finally{loading=false;}
  }

  async function sendMessage(){
    const {input,send}=nodes(); const message=input?.value.trim();
    if(!user)return showStatus("سجّل الدخول أولًا.",true);
    if(!message)return showStatus("اكتب الرسالة أولًا.",true);
    send.disabled=true;showStatus("جارٍ إرسال الرسالة...");
    try{
      const {error}=await db.rpc("premium_support_send_message",{p_message:message,p_thread_id:null});
      if(error)throw error;
      input.value="";await loadChat(true);showStatus("تم إرسال الرسالة إلى الدعم.");
    }catch(error){showStatus(error.message||"تعذر إرسال الرسالة.",true);}
    finally{send.disabled=false;input?.focus();}
  }

  async function openChat(){
    const {panel,toggle,input}=nodes(); if(!user)return;
    panel.hidden=false;toggle.setAttribute("aria-expanded","true");await loadChat(true);setTimeout(()=>input?.focus(),50);
  }
  function closeChat(){const {panel,toggle}=nodes();panel.hidden=true;toggle.setAttribute("aria-expanded","false");updateUnread();}
  function bind(){
    const {toggle,close,refresh,send,input}=nodes();
    toggle.addEventListener("click",()=>nodes().panel.hidden?openChat():closeChat());
    close.addEventListener("click",closeChat);refresh.addEventListener("click",()=>loadChat(!nodes().panel.hidden));send.addEventListener("click",sendMessage);
    input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendMessage();}});
    document.addEventListener("fullscreenchange",()=>{toggle.classList.toggle("unified-support-hidden",Boolean(document.fullscreenElement)||!user);if(document.fullscreenElement)nodes().panel.hidden=true;});
    const viewer=document.getElementById("viewerModal");
    if(viewer){new MutationObserver(()=>{const active=!viewer.hidden;toggle.classList.toggle("unified-support-hidden",active||!user);if(active)nodes().panel.hidden=true;}).observe(viewer,{attributes:true,attributeFilter:["hidden"]});}
  }
  async function applySession(session){
    user=session?.user||null;setLoggedIn(Boolean(user));
    if(user){await loadChat(false);if(!pollingTimer)pollingTimer=setInterval(()=>loadChat(!nodes().panel.hidden),12000);}
    else{thread=null;messages=[];renderMessages();if(pollingTimer){clearInterval(pollingTimer);pollingTimer=null;}}
  }
  async function init(){
    buildWidget();bind();
    const {data,error}=await db.auth.getSession();if(!error)await applySession(data.session);
    db.auth.onAuthStateChange((_event,session)=>setTimeout(()=>applySession(session),0));
  }
  init();
})();
