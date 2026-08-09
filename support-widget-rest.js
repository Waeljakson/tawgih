(() => {
  "use strict";
  if (window.__unifiedSupportWidgetLoaded) return;
  window.__unifiedSupportWidgetLoaded = true;

  const SUPPORT_URL = "https://fpicgtldwfevdvpbxkjf.supabase.co";
  const SUPPORT_KEY = "sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
  const PROJECT_REF = "fpicgtldwfevdvpbxkjf";
  const platformName = document.documentElement.dataset.platformName || document.title || "بوابة المنصات";

  let session = null;
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
  const safeParse = raw => { try { return JSON.parse(raw); } catch (_e) { return null; } };
  const timeout = (promise, ms=12000) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("network_timeout")), ms))
  ]);

  function deepFindSession(value, depth=0){
    if (depth > 6 || value == null) return null;
    if (typeof value === "string") {
      let text = value;
      if (text.startsWith("base64-")) {
        try { text = decodeURIComponent(escape(atob(text.slice(7).replace(/-/g,"+").replace(/_/g,"/")))); } catch (_e) {}
      }
      const parsed = safeParse(text);
      return parsed ? deepFindSession(parsed, depth+1) : null;
    }
    if (Array.isArray(value)) {
      for (const item of value) { const found = deepFindSession(item, depth+1); if (found) return found; }
      return null;
    }
    if (typeof value === "object") {
      if (value.access_token && value.refresh_token) return value;
      for (const key of ["currentSession","session","data","value"]) {
        if (value[key]) { const found = deepFindSession(value[key], depth+1); if (found) return found; }
      }
      for (const key of Object.keys(value)) { const found = deepFindSession(value[key], depth+1); if (found) return found; }
    }
    return null;
  }

  function findStoredSession(){
    const preferred = `sb-${PROJECT_REF}-auth-token`;
    for (const store of [localStorage, sessionStorage]) {
      let keys = [];
      try { for (let i=0;i<store.length;i++) { const k=store.key(i); if(k) keys.push(k); } } catch (_e) {}
      keys.sort((a,b)=>(a===preferred?-1:0)-(b===preferred?-1:0));
      for (const key of keys) {
        if (!key.startsWith("sb-") || !key.includes("auth-token")) continue;
        try {
          const found = deepFindSession(store.getItem(key));
          if (found) return {session:found,store,key};
        } catch (_e) {}
      }
    }
    return null;
  }

  async function request(path, options={}){
    const headers = {apikey:SUPPORT_KEY, Accept:"application/json"};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.prefer) headers.Prefer = options.prefer;
    const response = await timeout(fetch(SUPPORT_URL + path, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store"
    }));
    const text = await response.text();
    const data = text ? safeParse(text) : null;
    if (!response.ok) {
      const err = new Error(data?.message || data?.error_description || `http_${response.status}`);
      err.status = response.status;
      throw err;
    }
    return data;
  }

  async function refreshSession(found){
    if (!found?.session?.refresh_token) throw new Error("no_refresh_token");
    const fresh = await request("/auth/v1/token?grant_type=refresh_token", {
      method:"POST",
      body:{refresh_token:found.session.refresh_token}
    });
    if (!fresh?.access_token) throw new Error("refresh_failed");
    try { found.store.setItem(found.key, JSON.stringify(fresh)); } catch (_e) {}
    return fresh;
  }

  async function resolveLogin(){
    const found = findStoredSession();
    if (!found) return null;
    let active = found.session;
    try {
      user = await request("/auth/v1/user", {token:active.access_token});
    } catch (error) {
      if (error.status !== 401) throw error;
      active = await refreshSession(found);
      user = await request("/auth/v1/user", {token:active.access_token});
    }
    session = active;
    return {session,user};
  }

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
    if(!user||!session||loading)return; loading=true;
    try{
      const token=session.access_token;
      const threadRows=await request(`/rest/v1/premium_support_threads?select=id,user_id,status,last_message_at,last_read_by_user_at,last_read_by_admin_at,created_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,{token});
      thread=Array.isArray(threadRows)?(threadRows[0]||null):null;
      if(!thread){messages=[];renderMessages();updateUnread();showStatus("");return;}
      const rows=await request(`/rest/v1/premium_support_messages?select=id,thread_id,sender_id,message,created_at&thread_id=eq.${encodeURIComponent(thread.id)}&order=created_at.asc&limit=400`,{token});
      messages=Array.isArray(rows)?rows:[];renderMessages();
      if(markRead){
        try {
          await request("/rest/v1/rpc/premium_support_mark_read",{method:"POST",token,body:{p_thread_id:thread.id}});
          thread.last_read_by_user_at=new Date().toISOString();
        } catch (_e) {}
      }
      updateUnread();showStatus(thread.status==="closed"?"المحادثة مغلقة حاليًا. إرسال رسالة جديدة يعيد فتحها.":"");
    }catch(error){showStatus(error.message==="network_timeout"?"تعذر الوصول إلى الدعم حاليًا. حاول مرة أخرى.":(error.message||"تعذر تحميل محادثة الدعم."),true);}
    finally{loading=false;}
  }

  async function sendMessage(){
    const {input,send}=nodes(); const message=input?.value.trim();
    if(!user||!session)return showStatus("سجّل الدخول أولًا.",true);
    if(!message)return showStatus("اكتب الرسالة أولًا.",true);
    send.disabled=true;showStatus("جارٍ إرسال الرسالة...");
    try{
      await request("/rest/v1/rpc/premium_support_send_message",{method:"POST",token:session.access_token,body:{p_message:message,p_thread_id:null}});
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
  }

  async function init(){
    buildWidget();bind();
    try {
      const resolved=await resolveLogin();
      setLoggedIn(Boolean(resolved?.user));
      if(resolved?.user){await loadChat(false);pollingTimer=setInterval(()=>loadChat(!nodes().panel.hidden),12000);}
    } catch (error) {
      setLoggedIn(false);
      console.warn("Support widget login check failed",error);
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
