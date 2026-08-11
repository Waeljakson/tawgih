(() => {
  'use strict';
  if (window.__guidanceSmartRemindersLoaded) return;
  window.__guidanceSmartRemindersLoaded = true;

  const SUPABASE_URL='https://fpicgtldwfevdvpbxkjf.supabase.co';
  const SUPABASE_KEY='sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay';
  const PROJECT_REF='fpicgtldwfevdvpbxkjf';
  const SCRIPT_URL=document.currentScript?.src||location.href;
  const ROOT_URL=new URL('./',SCRIPT_URL);
  const CALENDAR_URL=new URL('calendar/index.html?from=portal',ROOT_URL).href;
  const PLAN_URL=new URL('plans/index.html?from=portal',ROOT_URL).href;
  const state={session:null,user:null,access:false,account:{},plans:[],latestPlan:null,customEvents:[],recordSessionEvents:[],reminderStates:[],events:[],reminders:[],loading:false};
  const LATEST_PLAN_CACHE_PREFIX='guidance_latest_plan_v1:';
  let loadPromise=null;
  let refreshTimer=null;
  let visibilityBound=false;
  let reminderChannel=null;
  const REFRESH_MS=120000;

  const safeParse=v=>{try{return JSON.parse(v)}catch(_e){return null}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const timeout=(p,ms=10000)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('network_timeout')),ms))]);
  const isoToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const dateObj=value=>{if(!value)return null;const s=String(value).slice(0,10);const d=new Date(`${s}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dayDiff=(from,to)=>{const a=dateObj(from),b=dateObj(to);if(!a||!b)return 9999;return Math.round((b-a)/86400000)};
  const fmtDate=value=>{const d=dateObj(value);return d?d.toLocaleDateString('ar-SA',{weekday:'short',day:'numeric',month:'short'}):'—'};
  const activeDate=value=>value&&new Date(value).getTime()>Date.now();

  function deepFindSession(value,depth=0){
    if(depth>6||value==null)return null;
    if(typeof value==='string'){
      let text=value;
      if(text.startsWith('base64-')){try{text=decodeURIComponent(escape(atob(text.slice(7).replace(/-/g,'+').replace(/_/g,'/'))))}catch(_e){}}
      const parsed=safeParse(text);return parsed?deepFindSession(parsed,depth+1):null;
    }
    if(Array.isArray(value)){for(const item of value){const found=deepFindSession(item,depth+1);if(found)return found}return null}
    if(typeof value==='object'){
      if(value.access_token&&value.refresh_token)return value;
      for(const key of ['currentSession','session','data','value']){if(value[key]){const found=deepFindSession(value[key],depth+1);if(found)return found}}
      for(const key of Object.keys(value)){const found=deepFindSession(value[key],depth+1);if(found)return found}
    }
    return null;
  }
  function findStoredSession(){
    const preferred=`sb-${PROJECT_REF}-auth-token`;
    for(const store of [localStorage,sessionStorage]){
      let keys=[];try{for(let i=0;i<store.length;i++){const k=store.key(i);if(k)keys.push(k)}}catch(_e){}
      keys.sort((a,b)=>(a===preferred?-1:0)-(b===preferred?-1:0));
      for(const key of keys){if(!key.startsWith('sb-')||!key.includes('auth-token'))continue;try{const found=deepFindSession(store.getItem(key));if(found)return{session:found,store,key}}catch(_e){}}
    }
    return null;
  }
  async function request(path,options={}){
    const headers={apikey:SUPABASE_KEY,Accept:'application/json'};
    if(options.token)headers.Authorization=`Bearer ${options.token}`;
    if(options.body!==undefined)headers['Content-Type']='application/json';
    if(options.prefer)headers.Prefer=options.prefer;
    const response=await timeout(fetch(SUPABASE_URL+path,{method:options.method||'GET',headers,body:options.body===undefined?undefined:JSON.stringify(options.body),cache:'no-store'}));
    const text=await response.text();const data=text?safeParse(text):null;
    if(!response.ok){const err=new Error(data?.message||data?.error_description||`http_${response.status}`);err.status=response.status;err.details=data;throw err}
    return data;
  }
  async function resolveLogin(){
    const found=findStoredSession();if(!found)return null;
    let session=found.session,user;
    try{user=await request('/auth/v1/user',{token:session.access_token})}
    catch(error){if(error.status!==401)throw error;const fresh=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});if(!fresh?.access_token)throw new Error('refresh_failed');session=fresh;try{found.store.setItem(found.key,JSON.stringify(fresh))}catch(_e){}user=await request('/auth/v1/user',{token:session.access_token})}
    state.session=session;state.user=user;return{session,user};
  }

  function normalizePlanData(plan){let pd=plan?.plan_data;if(typeof pd==='string')pd=safeParse(pd);return pd&&typeof pd==='object'?pd:{}}
  const cleanText=value=>String(value??'').trim();
  function sessionEventKey(kind,title,currentDate,nextDate){
    return ['guidance-session',kind,cleanText(title).toLowerCase(),String(currentDate||'').slice(0,10),String(nextDate||'').slice(0,10)].join('|');
  }
  function sessionEventModel({kind='collective',title='',currentDate='',nextDate='',details=''}){
    const date=String(nextDate||'').slice(0,10);if(!date)return null;
    const label=cleanText(title)||'الإرشاد الجمعي';
    const kindLabel=kind==='subcollective'?'جلسة متابعة':(kind==='collective'?'جلسة إرشاد جمعي':'جلسة قادمة');
    const key=sessionEventKey(kind,label,currentDate,date);
    return {id:key,dedupe_key:key,title:`موعد ${kindLabel}: ${label}`,details:details||`موعد الجلسة القادمة المسجل في ${kindLabel}.`,event_date:date,category:'followup',priority:'normal',source:'record'};
  }
  function localRecordSessionEvents(){
    let rows=[];try{const parsed=safeParse(localStorage.getItem('mishkat_school_records_local_v3'));if(Array.isArray(parsed))rows=parsed}catch(_e){}
    return rows.map(row=>{
      const data=row?.form_data||{},next=data.next_session_date;if(!next)return null;
      const kind=row?.record_type==='group_guidance_followup'?'subcollective':(row?.record_type==='group_guidance'?'collective':'session');
      const title=data.session_title||row?.title||'سجل التوجيه الطلابي';
      const seq=data.followup_number?`الجلسة ${data.followup_number}`:'الجلسة الرئيسية';
      return sessionEventModel({kind,title,currentDate:row?.record_date,nextDate:next,details:`${seq} — موعد الجلسة القادمة.`});
    }).filter(Boolean);
  }
  function bubbleRecordSessionEvents(mainRows=[],subRows=[]){
    const schema=window.MishkatBubbleStore?.schema||window.MISHKAT_BUBBLE_SCHEMA||{};
    const mainF=schema?.fields?.guidanceCollective||{},subF=schema?.fields?.guidanceSubCollective||{};
    const make=(row,f,kind)=>sessionEventModel({
      kind,
      title:row?.[f.collectiveName||'Collective name']||'الإرشاد الجمعي',
      currentDate:row?.[f.collectiveDate||'Collective Date'],
      nextDate:row?.[f.nextDate||'next Date'],
      details:kind==='subcollective'?'جلسة متابعة — موعد الجلسة القادمة.':'الجلسة الرئيسية — موعد الجلسة القادمة.'
    });
    return [...(mainRows||[]).map(row=>make(row,mainF,'collective')),...(subRows||[]).map(row=>make(row,subF,'subcollective'))].filter(Boolean);
  }
  function reminderStateMap(){return new Map((state.reminderStates||[]).map(x=>[x.reminder_key,x]))}
  function reminderVisible(rem,map){const s=map.get(rem.key);if(!s)return true;if(s.dismissed_at)return false;if(s.snoozed_until&&new Date(s.snoozed_until).getTime()>Date.now())return false;return true}
  function reminderUnread(rem,map){const s=map.get(rem.key);return !(s&&s.read_at)}

  function derive(){
    const today=isoToday();const events=[];const reminders=[];
    const addReminder=r=>reminders.push({...r,priority:r.priority||'normal'});
    const addUpcomingWorkReminder=({key,text,start,end,kind,label,planId,weekNumber,notDone=false})=>{
      // V19.0.8: all scheduled alerts are generated directly from calendar events.
      // This helper now adds only administrative overdue alerts to avoid duplicates.
      const overdue=dayDiff(end,today);
      if(overdue>0){
        addReminder({key:`${key}:overdue`,title:notDone?`${label} مسجل «لم ينفذ»`:`${label} انتهى ولم يسجل تنفيذه`,message:`${text} — انتهت فترة التنفيذ منذ ${overdue} ${overdue===1?'يوم':'أيام'}. افتح الخطة وحدّث حالة التنفيذ.`,date:end,priority:overdue>=4||notDone?'critical':'high',kind:`${kind}_overdue`,planId});
      }
    };
    const plans=state.latestPlan?[state.latestPlan]:[];
    if(!state.latestPlan){
      addReminder({key:'no-plan',title:'لم تقم بتسجيل خطة',message:'لا توجد خطة محفوظة حتى الآن. افتح منصة خطة الموجه وسجّل خطتك لتظهر مواعيدها تلقائيًا في التقويم.',date:today,priority:'high',kind:'no_plan'});
    }
    for(const plan of plans){
      let pd=plan.plan_data;if(typeof pd==='string')pd=safeParse(pd);pd=pd||{};const segments=Array.isArray(pd.segments)?pd.segments:[];
      const planTitle=plan.title||'خطة الموجه الطلابي';
      if(plan.start_date){
        const d=String(plan.start_date).slice(0,10),key=`plan:${plan.id}:start`;events.push({key,date:d,title:`بداية ${planTitle}`,category:'plan',priority:'normal',source:'plan',planId:plan.id});
      }
      if(plan.end_date){
        const d=String(plan.end_date).slice(0,10),key=`plan:${plan.id}:end`;events.push({key,date:d,title:`نهاية ${planTitle}`,category:'deadline',priority:'high',source:'plan',planId:plan.id});
      }
      const holidays=Array.isArray(plan.holidays)?plan.holidays:(Array.isArray(pd.holidays)?pd.holidays:[]);
      holidays.forEach((h,i)=>{if(!h?.start)return;const key=`plan:${plan.id}:holiday:${h.id||i}:${h.start}`;events.push({key,date:h.start,endDate:h.end||h.start,title:h.title||'مناسبة / إجازة',category:'occasion',priority:'normal',source:'plan',planId:plan.id});});
      segments.filter(s=>s&&s.type==='week').forEach((seg,si)=>{
        const start=seg.start||seg.calendarStart;const end=seg.end||seg.calendarEnd||start;if(!start)return;const weekNumber=seg.number||si+1;
        const groups=[
          {items:Array.isArray(seg.tasks)?seg.tasks:[],kind:'task',category:'task',label:'مهمة'},
          {items:Array.isArray(seg.programs)?seg.programs:[],kind:'program',category:'program',label:'برنامج'},
          {items:Array.isArray(seg.emerging)?seg.emerging:[],kind:'emerging',category:'emerging',label:'عمل مستجد'}
        ];
        groups.forEach(group=>group.items.forEach((item,ii)=>{
          const text=typeof item==='string'?item:String(item?.text||'').trim();if(!text)return;
          const done=typeof item==='object'&&!!item.done;const notDone=typeof item==='object'&&!!item.notDone;
          const key=`plan:${plan.id}:week:${weekNumber}:${group.kind}:${ii}`;
          events.push({key,date:start,endDate:end,title:text,category:group.category,priority:notDone?'high':'normal',source:'plan',planId:plan.id,status:done?'done':notDone?'not_done':'pending',weekNumber});
          if(done)return;
          addUpcomingWorkReminder({key,text,start,end,kind:group.kind,label:group.label,planId:plan.id,weekNumber,notDone});
        }));
      });
      const start=dateObj(plan.start_date),end=dateObj(plan.end_date),now=dateObj(today);const completion=Math.max(0,Math.min(100,Number(plan.completion_rate||0)));
      if(start&&end&&now&&now>=start){
        const span=Math.max(1,end-start),elapsed=Math.max(0,Math.min(1,(now-start)/span));const expected=Math.round(elapsed*100);const lag=expected-completion;
        if(now<=end&&lag>=20){addReminder({key:`plan:${plan.id}:low-progress`,title:lag>=35?'انخفاض حاد في إنجاز الخطة':'معدل الإنجاز أقل من المتوقع',message:`الإنجاز الحالي ${Math.round(completion)}% بينما المتوقع زمنيًا نحو ${expected}%. الفارق ${Math.round(lag)} نقطة.`,date:today,priority:lag>=35?'critical':'high',kind:'low_progress',planId:plan.id});}
        if(now>end&&completion<100){addReminder({key:`plan:${plan.id}:unfinished`,title:'انتهت مدة الخطة ولم يكتمل الإنجاز',message:`الخطة انتهت بنسبة إنجاز ${Math.round(completion)}%، وما زال بها ${Number(plan.pending_items||0)} عنصرًا متبقيًا.`,date:String(plan.end_date).slice(0,10),priority:'critical',kind:'unfinished_plan',planId:plan.id});}
      }
      const last=plan.last_progress_at||plan.updated_at;if(last&&Number(plan.pending_items||0)>0){const idle=Math.floor((Date.now()-new Date(last).getTime())/86400000);if(idle>=7)addReminder({key:`plan:${plan.id}:inactive`,title:'الخطة تحتاج تحديثًا',message:`لم يتم تسجيل تقدم في الخطة منذ ${idle} يومًا، والمتبقي ${Number(plan.pending_items||0)} عنصرًا.`,date:today,priority:idle>=14?'high':'normal',kind:'inactive_plan',planId:plan.id});}
    }
    // Merge server calendar events with locally saved calendar events so a custom event
    // created inside the Smart Calendar becomes an alert on every platform page as well.
    let localCustom=[];
    try{
      const raw=safeParse(localStorage.getItem(`guidance_calendar_custom_v1:${state.user?.id||''}`));
      if(Array.isArray(raw))localCustom=raw;
    }catch(_e){}
    const recordLocal=localRecordSessionEvents();
    const mergedCustom=[...(state.customEvents||[]),...(state.recordSessionEvents||[]),...recordLocal,...localCustom];
    const seenCustom=new Set();
    for(const e of mergedCustom){
      const date=String(e.event_date||e.date||'').slice(0,10);if(!date)continue;
      const dedupe=e.dedupe_key||`${e.source||'custom'}|${e.id||''}|${date}|${e.title||''}`;if(seenCustom.has(dedupe))continue;seenCustom.add(dedupe);
      const id=e.id||`local_${date}_${seenCustom.size}`;
      const source=e.source||'custom';
      events.push({key:`${source}:${id}`,date,title:e.title||'تذكير',category:e.category||'custom',priority:e.priority||'normal',source,details:e.details||'',id});
    }

    // V19.0.8: every event that appears in the calendar is itself a reminder.
    // Events are not limited to a 7-day window; the nearest reminder is simply the first calendar event from today onward.
    const calendarEventReminders=[];
    for(const e of events){
      if(!e?.date)continue;
      const start=String(e.date).slice(0,10),end=String(e.endDate||e.date).slice(0,10);
      if(dayDiff(today,end)<0)continue;
      const ongoing=dayDiff(today,start)<0&&dayDiff(today,end)>=0;
      const alertDate=ongoing?today:start;
      const days=dayDiff(today,alertDate);
      const priority=e.priority==='critical'?'critical':(days<=1||e.priority==='high'?'high':'normal');
      const range=e.endDate&&String(e.endDate).slice(0,10)!==start?` — حتى ${fmtDate(end)}`:'';
      const message=e.details||`${ongoing?'حدث جارٍ في التقويم':'حدث في التقويم'} — ${fmtDate(start)}${range}`;
      calendarEventReminders.push({key:`${e.key}:calendar-event`,title:e.title||'حدث في التقويم',message,date:alertDate,eventDate:start,endDate:end,priority,kind:'calendar_event',category:e.category||'custom',source:e.source||'calendar',eventKey:e.key,planId:e.planId,customEventId:e.id});
    }
    reminders.push(...calendarEventReminders);

    const map=reminderStateMap();
    state.events=events.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    state.reminders=reminders.filter(r=>reminderVisible(r,map)).map(r=>({...r,unread:reminderUnread(r,map)})).sort((a,b)=>{
      const rank={critical:0,high:1,normal:2,low:3};return (rank[a.priority]??9)-(rank[b.priority]??9)||String(a.date).localeCompare(String(b.date));
    });
    return{events:state.events,reminders:state.reminders};
  }

  const schoolReminderKey=()=>`mishkat_reminder_states_v1:${window.MishkatSchoolContext?.getContext?.()?.id||'school-user'}`;
  function loadLocalReminderStates(){try{return safeParse(localStorage.getItem(schoolReminderKey()))||[]}catch(_e){return[]}}
  function saveLocalReminderStates(){try{localStorage.setItem(schoolReminderKey(),JSON.stringify(state.reminderStates||[]))}catch(_e){}}
  function bubblePlanToLegacy(row){let meta={};try{meta=JSON.parse(row?.Notes||'{}')}catch(_e){}const form=meta.form||{};const id=window.MishkatBubbleStore?.idOf?.(row)||row?.id||'';return{id,title:row?.Title||form.title||'خطة الموجه الطلابي',school_stage:form.stage||'',academic_year:form.academicYear||'',term_name:form.termName||'',start_date:form.startDate||'',end_date:form.endDate||'',holidays:meta.holidays||[],plan_data:{segments:meta.segments||[],form},status:row?.Status||'in_progress',updated_at:row?.['Modified Date']||''}}
  function bubbleEventToLegacy(row){const id=window.MishkatBubbleStore?.idOf?.(row)||row?.id||'';let note={};try{note=JSON.parse(row?.Notes||'{}')}catch(_e){}return{id,title:row?.Title||'تذكير',details:row?.Description||'',event_date:String(row?.EventDate||'').slice(0,10),end_date:String(row?.EndDate||'').slice(0,10),category:row?.EventType||'custom',priority:note.priority||'normal',completed:Boolean(row?.Completed)}}
  async function loadContext(force=false){
    if(loadPromise)return loadPromise;
    state.loading=true;
    loadPromise=(async()=>{
      if(window.MishkatBubbleStore&&window.MishkatSchoolContext){
        const c=window.MishkatSchoolContext.getContext();state.user={id:c.id||'school-user'};state.session={schoolEdition:true};state.access=true;state.account={full_name:c.counselorName||'',school_name:c.schoolName||''};
        const schema=window.MishkatBubbleStore.schema||window.MISHKAT_BUBBLE_SCHEMA||{};
        const collectiveType=schema?.dataTypes?.guidanceCollective||'Guidance_Collective';
        const subCollectiveType=schema?.dataTypes?.guidanceSubCollective||'Guidance_SubCollective';
        const mainF=schema?.fields?.guidanceCollective||{},subF=schema?.fields?.guidanceSubCollective||{};
        const constraintsFor=f=>{const out=[];if(c.schoolId)out.push({key:f.school||'School',constraint_type:'equals',value:c.schoolId});if(c.stageId)out.push({key:f.dep||'Dep',constraint_type:'equals',value:c.stageId});if(c.academicYearId)out.push({key:f.academicYear||'Academic year',constraint_type:'equals',value:c.academicYearId});if(c.termId)out.push({key:f.term||'Term',constraint_type:'equals',value:c.termId});return out};
        const [planRows,eventRows,collectiveRows,subCollectiveRows]=await Promise.all([
          window.MishkatBubbleStore.listPlans().catch(()=>[]),
          window.MishkatBubbleStore.listEvents().catch(()=>[]),
          window.MishkatBubbleStore.list(collectiveType,constraintsFor(mainF)).catch(()=>[]),
          window.MishkatBubbleStore.list(subCollectiveType,constraintsFor(subF)).catch(()=>[])
        ]);
        state.plans=(planRows||[]).map(bubblePlanToLegacy);state.latestPlan=state.plans[0]||null;state.customEvents=(eventRows||[]).map(bubbleEventToLegacy);state.recordSessionEvents=bubbleRecordSessionEvents(collectiveRows,subCollectiveRows);state.reminderStates=loadLocalReminderStates();derive();return state;
      }
      const login=state.user&&state.session?{user:state.user,session:state.session}:await resolveLogin();
      if(!login){state.access=false;state.plans=[];state.latestPlan=null;state.recordSessionEvents=[];state.reminders=[];state.events=[];return state}
      const token=login.session.access_token;
      const access=await request('/rest/v1/rpc/premium_has_all_access',{method:'POST',token,body:{p_user_id:login.user.id}}).catch(()=>null);
      // If the entitlement RPC is temporarily unavailable, keep the reminder center usable
      // for the authenticated user instead of silently hiding it on every platform page.
      state.access=access!==false;
      if(!state.access)return state;
      const uid=encodeURIComponent(login.user.id);
      const cacheKey=LATEST_PLAN_CACHE_PREFIX+login.user.id;
      const [account,plansResult,events,states]=await Promise.all([
        request(`/rest/v1/premium_accounts?select=full_name,school_name,is_system_admin&user_id=eq.${uid}&limit=1`,{token}).catch(()=>[]),
        request(`/rest/v1/counselor_plans?select=id,title,school_stage,academic_year,term_name,start_date,end_date,completion_rate,completed_items,not_completed_items,pending_items,total_items,last_progress_at,status,holidays,plan_data,updated_at&user_id=eq.${uid}&order=updated_at.desc&limit=1`,{token}).catch(()=>null),
        request(`/rest/v1/premium_calendar_events?select=id,title,details,event_date,event_time,category,priority,created_at,updated_at&user_id=eq.${uid}&order=event_date.asc`,{token}).catch(()=>[]),
        request(`/rest/v1/premium_reminder_states?select=user_id,reminder_key,read_at,snoozed_until,dismissed_at,updated_at&user_id=eq.${uid}`,{token}).catch(()=>[])
      ]);
      state.account=Array.isArray(account)?(account[0]||{}):{};
      let plans=Array.isArray(plansResult)?plansResult.slice(0,1):[];
      if(Array.isArray(plansResult)&&plansResult.length===0){
        // A successful empty response means there is genuinely no saved plan.
        // Remove stale cache instead of resurrecting an old/deleted plan.
        try{localStorage.removeItem(cacheKey)}catch(_e){}
      }else if(plansResult===null&&!plans.length){
        // Only fall back to cache when the remote plans request itself failed.
        try{
          const cached=safeParse(localStorage.getItem(cacheKey));
          if(cached&&cached.id)plans=[cached];
        }catch(_e){}
      }
      state.plans=plans;
      state.latestPlan=plans[0]||null;
      if(state.latestPlan){try{localStorage.setItem(cacheKey,JSON.stringify({...state.latestPlan,__cached_at:new Date().toISOString()}))}catch(_e){}}
      state.customEvents=Array.isArray(events)?events:[];
      state.reminderStates=Array.isArray(states)?states:[];
      derive();
      return state;
    })();
    try{return await loadPromise}finally{state.loading=false;loadPromise=null}
  }

  async function setReminderState(key,patch){
    if(!state.access||!state.user||!state.session)return;
    const body={user_id:state.user.id,reminder_key:key,...patch,updated_at:new Date().toISOString()};
    if(state.session.schoolEdition){const idx=state.reminderStates.findIndex(x=>x.reminder_key===key);if(idx>=0)state.reminderStates[idx]={...state.reminderStates[idx],...body};else state.reminderStates.push(body);saveLocalReminderStates();derive();return}
    await request('/rest/v1/premium_reminder_states?on_conflict=user_id,reminder_key',{method:'POST',token:state.session.access_token,prefer:'resolution=merge-duplicates,return=representation',body:[body]});
    const idx=state.reminderStates.findIndex(x=>x.reminder_key===key);if(idx>=0)state.reminderStates[idx]={...state.reminderStates[idx],...body};else state.reminderStates.push(body);derive();try{reminderChannel?.postMessage({type:'state-changed',key})}catch(_e){}
  }
  async function markRead(key){return setReminderState(key,{read_at:new Date().toISOString(),snoozed_until:null,dismissed_at:null})}
  async function snooze(key,hours=24){return setReminderState(key,{read_at:new Date().toISOString(),snoozed_until:new Date(Date.now()+hours*3600000).toISOString(),dismissed_at:null})}
  async function dismiss(key){return setReminderState(key,{read_at:new Date().toISOString(),dismissed_at:new Date().toISOString(),snoozed_until:null})}
  async function createCustomEvent(payload){
    if(!state.access||!state.user||!state.session)throw new Error('access_required');
    if(state.session.schoolEdition){const saved=await window.MishkatBubbleStore.saveEventModel(payload);const row=bubbleEventToLegacy(saved);state.customEvents.push(row);derive();return row}
    const body={user_id:state.user.id,title:String(payload.title||'').trim(),details:String(payload.details||'').trim()||null,event_date:payload.event_date,event_time:payload.event_time||null,category:payload.category||'custom',priority:payload.priority||'normal',updated_at:new Date().toISOString()};
    const rows=await request('/rest/v1/premium_calendar_events',{method:'POST',token:state.session.access_token,prefer:'return=representation',body});const row=Array.isArray(rows)?rows[0]:rows;if(row)state.customEvents.push(row);derive();return row;
  }
  async function deleteCustomEvent(id){if(!state.session)return;if(state.session.schoolEdition){await window.MishkatBubbleStore.deleteEvent(id);state.customEvents=state.customEvents.filter(x=>x.id!==id);derive();return}await request(`/rest/v1/premium_calendar_events?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',token:state.session.access_token,prefer:'return=minimal'});state.customEvents=state.customEvents.filter(x=>x.id!==id);derive()}

  function daysUntilLabel(value){
    const days=dayDiff(isoToday(),value);
    if(days===0)return 'اليوم';
    if(days===1)return 'غدًا';
    if(days===2)return 'بعد يومين';
    if(days>2&&days<=10)return `بعد ${days} أيام`;
    if(days>10)return fmtDate(value);
    if(days===-1)return 'متأخر يومًا';
    if(days===-2)return 'متأخر يومين';
    return days<0?`متأخر ${Math.abs(days)} أيام`:fmtDate(value);
  }
  function nearestReminder(){
    const today=isoToday();
    const future=(state.events||[]).filter(e=>e?.date&&dayDiff(today,String(e.endDate||e.date).slice(0,10))>=0).slice().sort((a,b)=>{
      const ad=dayDiff(today,a.date)<0?today:String(a.date).slice(0,10);
      const bd=dayDiff(today,b.date)<0?today:String(b.date).slice(0,10);
      return String(ad).localeCompare(String(bd));
    });
    const e=future[0];
    if(!e)return null;
    const ongoing=dayDiff(today,e.date)<0&&dayDiff(today,String(e.endDate||e.date).slice(0,10))>=0;
    const date=ongoing?today:String(e.date).slice(0,10);
    return {key:`${e.key}:calendar-event`,title:e.title||'حدث في التقويم',message:e.details||`${ongoing?'حدث جارٍ في التقويم':'حدث في التقويم'} — ${fmtDate(e.date)}${e.endDate&&e.endDate!==e.date?' — حتى '+fmtDate(e.endDate):''}`,date,eventDate:e.date,endDate:e.endDate,priority:e.priority||'normal',kind:'calendar_event',category:e.category,eventKey:e.key};
  }
  function firstUpcomingOccasion(){
    const today=isoToday();
    const occasions=(state.events||[]).filter(e=>e?.date&&dayDiff(today,e.date)>=0&&e.category==='occasion').slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    return occasions[0]||null;
  }

  function maybeBrowserNotify(){
    if(!('Notification'in window)||Notification.permission!=='granted')return;
    const today=isoToday();const candidates=state.reminders.filter(r=>r.unread&&(r.priority==='critical'||r.priority==='high')).slice(0,3);
    const occasion=firstUpcomingOccasion();
    candidates.forEach(r=>{const k=`guidance_notify:${today}:${r.key}`;if(localStorage.getItem(k))return;try{const extra=occasion?`\nأول مناسبة: ${occasion.title} — ${fmtDate(occasion.date)}`:'';new Notification(r.title,{body:r.message+extra,tag:r.key,renotify:false});localStorage.setItem(k,'1')}catch(_e){}});
  }

  function toastCandidates(){
    return state.reminders.filter(r=>r.unread&&(r.priority==='critical'||r.priority==='high'||(['program_upcoming','task_upcoming','emerging_upcoming','plan_start','plan_deadline'].includes(r.kind)&&dayDiff(isoToday(),r.date)<=1))).slice(0,3);
  }

  function showInAppToasts(){
    const host=node('smartReminderToastHost');
    if(!host||!state.access)return;
    const today=isoToday();
    const occasion=firstUpcomingOccasion();
    toastCandidates().forEach((r,i)=>{
      const seenKey=`guidance_inapp_toast:${today}:${r.key}`;
      try{if(localStorage.getItem(seenKey))return;localStorage.setItem(seenKey,'1')}catch(_e){}
      const el=document.createElement('article');
      el.className=`smart-reminder-toast ${r.priority||'normal'}`;
      el.innerHTML=`<button class="smart-reminder-toast-close" type="button" aria-label="إغلاق">×</button><div class="smart-reminder-toast-icon">🔔</div><div><strong>${esc(r.title)}</strong><p>${esc(r.message)}</p>${occasion?`<small class="smart-reminder-toast-occasion">أول مناسبة: ${esc(occasion.title)} — ${esc(fmtDate(occasion.date))}</small>`:''}<div><button class="smart-reminder-toast-open" type="button">عرض التنبيهات</button><a href="${esc(CALENDAR_URL)}">فتح التقويم</a></div></div>`;
      el.querySelector('.smart-reminder-toast-close').onclick=()=>el.remove();
      el.querySelector('.smart-reminder-toast-open').onclick=()=>{openReminderPanel();el.remove()};
      host.appendChild(el);
      setTimeout(()=>el.classList.add('show'),40+i*120);
      setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),260)},12000+i*800);
    });
  }

  async function refreshEverywhere(){
    try{await loadContext(true);renderWidget();maybeBrowserNotify();showInAppToasts()}catch(error){console.warn('Smart reminders refresh unavailable',error)}
  }

  function startGlobalRefresh(){
    if(refreshTimer)clearInterval(refreshTimer);
    refreshTimer=setInterval(()=>{if(!document.hidden)refreshEverywhere()},REFRESH_MS);
    if(!visibilityBound){
      visibilityBound=true;
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshEverywhere()});
      window.addEventListener('focus',()=>refreshEverywhere());
      window.addEventListener('storage',event=>{if(event.key&&(event.key.startsWith(LATEST_PLAN_CACHE_PREFIX)||event.key.startsWith('guidance_calendar_custom_v1:')))refreshEverywhere()});
      window.addEventListener('guidance-plan-updated',()=>refreshEverywhere());
      window.addEventListener('guidance-calendar-updated',()=>refreshEverywhere());
      try{
        reminderChannel=new BroadcastChannel('guidance-smart-reminders');
        reminderChannel.onmessage=()=>refreshEverywhere();
      }catch(_e){}
    }
  }

  function buildWidget(){
    if(document.getElementById('smartReminderToggle'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <button id="smartReminderToggle" class="smart-reminder-toggle smart-reminder-hidden" type="button" aria-controls="smartReminderPanel" aria-expanded="false" title="التقويم والتنبيهات">
        <span class="smart-reminder-bell" aria-hidden="true">🔔</span><span class="smart-reminder-label">التنبيهات</span><b id="smartReminderBadge" hidden>0</b>
      </button>
      <aside id="smartReminderPanel" class="smart-reminder-panel" hidden aria-label="التنبيهات الذكية">
        <header><div><span>منصة المدرسة</span><strong>التقويم والتنبيهات الذكية</strong><small>متابعة كل مهام الخطة والبرامج والأعمال والمواعيد المهمة</small></div><button id="smartReminderClose" type="button">×</button></header>
        <div id="smartReminderSummary" class="smart-reminder-summary"></div>
        <section id="smartReminderNext" class="smart-reminder-next" aria-live="polite"></section>
        <div id="smartReminderList" class="smart-reminder-list"></div>
        <footer><a href="${esc(CALENDAR_URL)}">فتح التقويم الكامل</a><button id="smartReminderRefresh" type="button">تحديث</button><button id="smartReminderBrowserNotify" type="button" title="إشعارات الجهاز">إشعارات الجهاز</button></footer>
      </aside>
      <div id="smartReminderToastHost" class="smart-reminder-toast-host" aria-live="polite" aria-atomic="false"></div>`);
  }
  const node=id=>document.getElementById(id);
  function renderWidget(){
    const toggle=node('smartReminderToggle'),panel=node('smartReminderPanel'),badge=node('smartReminderBadge'),list=node('smartReminderList'),summary=node('smartReminderSummary'),next=node('smartReminderNext');if(!toggle)return;
    toggle.classList.toggle('smart-reminder-hidden',!state.access);if(!state.access){if(panel)panel.hidden=true;return}
    const unread=state.reminders.filter(r=>r.unread).length;badge.hidden=!unread;badge.textContent=String(Math.min(99,unread));
    const critical=state.reminders.filter(r=>r.priority==='critical').length,upcoming=state.reminders.filter(r=>r?.date&&dayDiff(isoToday(),r.date)>=0&&dayDiff(isoToday(),r.date)<=7).length;
    summary.innerHTML=`<span><b>${state.reminders.length}</b> تنبيه</span><span><b>${critical}</b> عاجل</span><span><b>${upcoming}</b> موعد قريب</span>`;

    const nearest=nearestReminder(),occasion=firstUpcomingOccasion();
    if(next){
      next.innerHTML=`<div class="smart-reminder-next-block"><span>أقرب تنبيه = أول حدث قادم في التقويم</span><strong>${esc(nearest?.title||'لا يوجد حدث قادم')}</strong><p>${nearest?esc(nearest.message):'لا توجد أحداث قادمة في التقويم حاليًا.'}</p><small>${nearest?esc(daysUntilLabel(nearest.date)+' · '+fmtDate(nearest.date)):'—'}</small></div><div class="smart-reminder-next-block occasion"><span>أول مناسبة قادمة</span><strong>${esc(occasion?.title||'لا توجد مناسبة قادمة')}</strong><p>${occasion?`موعد المناسبة: ${esc(fmtDate(occasion.date))}`:'ستظهر هنا أول مناسبة أو إجازة قادمة من آخر خطة محفوظة.'}</p><small>${occasion?esc(daysUntilLabel(occasion.date)):'—'}</small></div>`;
    }
    list.innerHTML=state.reminders.length?state.reminders.slice(0,12).map(r=>`<article class="smart-reminder-item ${esc(r.priority)} ${r.unread?'unread':''}" data-reminder-key="${esc(r.key)}"><div class="smart-reminder-priority"></div><div><span>${esc(r.title)}</span><p>${esc(r.message)}</p><small>${esc(fmtDate(r.date))}</small><div class="smart-reminder-actions"><button data-read="${esc(r.key)}">تم الاطلاع</button><button data-snooze="${esc(r.key)}">ذكرني غدًا</button></div></div></article>`).join(''):`<div class="smart-reminder-empty"><b>لا توجد تنبيهات حالية</b><span>أي حدث موجود في التقويم يُعامل تلقائيًا كتنبيه، بالإضافة إلى تنبيهات التأخر وانخفاض الإنجاز.</span></div>`;
    list.querySelectorAll('[data-read]').forEach(b=>b.onclick=async()=>{await markRead(b.dataset.read);renderWidget()});
    list.querySelectorAll('[data-snooze]').forEach(b=>b.onclick=async()=>{await snooze(b.dataset.snooze,24);renderWidget()});
  }
  function openReminderPanel(){
    const p=node('smartReminderPanel');if(!p)return;p.hidden=false;node('smartReminderToggle')?.setAttribute('aria-expanded','true');
  }
  function closeReminderPanel(){
    const p=node('smartReminderPanel');if(p)p.hidden=true;node('smartReminderToggle')?.setAttribute('aria-expanded','false');renderWidget();
  }
  function bindWidget(){
    node('smartReminderToggle').onclick=()=>{const p=node('smartReminderPanel');if(p.hidden)openReminderPanel();else closeReminderPanel()};
    node('smartReminderClose').onclick=()=>closeReminderPanel();
    node('smartReminderRefresh').onclick=async()=>{await refreshEverywhere()};
    const browserBtn=node('smartReminderBrowserNotify');if(browserBtn)browserBtn.onclick=async()=>{const result=await window.GuidanceReminderAPI.requestBrowserPermission();browserBtn.textContent=result==='granted'?'تم التفعيل':'إشعارات الجهاز';if(result==='granted')maybeBrowserNotify()};
  }
  async function initWidget(){buildWidget();bindWidget();try{await loadContext();renderWidget();maybeBrowserNotify();showInAppToasts();startGlobalRefresh()}catch(error){console.warn('Smart reminders unavailable',error);startGlobalRefresh()}}

  window.GuidanceReminderAPI={state,loadContext,derive,markRead,snooze,dismiss,createCustomEvent,deleteCustomEvent,requestBrowserPermission:async()=>{if(!('Notification'in window))return'unsupported';return Notification.requestPermission()},refreshEverywhere,showInAppToasts,fmtDate,isoToday,dateObj,dayDiff,nearestReminder,firstUpcomingOccasion,CALENDAR_URL,PLAN_URL};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWidget);else initWidget()
})();
