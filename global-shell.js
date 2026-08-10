"use strict";
(function(global){
  if(global.__MishkatGlobalShellV1200)return;global.__MishkatGlobalShellV1200=true;
  const script=document.currentScript;const baseHref=script?.src||((location.href&&!location.href.startsWith('about:'))?location.href:'http://localhost/global-shell.js');const ROOT=new URL('./',baseHref);
  const A=(p)=>new URL(p,ROOT).href;
  const platforms=[
    {key:'records',icon:'▤',title:'السجلات الرقمية',href:'records/index.html?from=global'},
    {key:'plans',icon:'▦',title:'خطة الموجه',href:'plans/index.html?from=global'},
    {key:'calendar',icon:'▣',title:'التقويم والتنبيهات',href:'calendar/index.html?from=global'},
    {key:'messages',icon:'✉',title:'المراسلات',href:'messages/index.html?from=global'},
    {key:'analysis',icon:'▥',title:'تحليل النتائج',href:'analysis/index.html?from=global'},
    {key:'reports',icon:'▧',title:'تقارير الإنجاز',href:'reports/index.html?from=global'},
    {key:'certificates',icon:'★',title:'شهادات التقدير',href:'certificates/index.html?from=global'},
    {key:'presentations',icon:'▰',title:'العروض التقديمية',href:'presentations/index.html?from=global'}
  ];
  const pageMeta={
    records:{icon:'▤',title:'السجلات الرقمية',desc:'السجلات الإرشادية والمتابعة اليومية'},
    plans:{icon:'▦',title:'خطة الموجه',desc:'الخطة الأسبوعية والبرامج التنفيذية'},
    calendar:{icon:'▣',title:'التقويم والتنبيهات',desc:'المواعيد والأحداث والتنبيهات الذكية'},
    messages:{icon:'✉',title:'المراسلات',desc:'مراسلات أولياء الأمور والتواصل المدرسي'},
    analysis:{icon:'▥',title:'تحليل النتائج',desc:'تحليل التحصيل ومؤشرات النتائج'},
    reports:{icon:'▧',title:'تقارير الإنجاز',desc:'التقارير والشواهد ومتابعة التنفيذ'},
    certificates:{icon:'★',title:'شهادات التقدير',desc:'إنشاء وطباعة شهادات التقدير'},
    presentations:{icon:'▰',title:'العروض التقديمية',desc:'العروض والبرامج التوجيهية'},
    'guidance-stats':{icon:'◫',title:'إحصائيات التوجيه الطلابي',desc:'لوحة المؤشرات والمتابعة الإشرافية'},
    chat:{icon:'💬',title:'شات التوجيه الطلابي',desc:'المحادثات الجماعية والفردية بين فريق التوجيه'}
  };
  function currentKey(){const p=location.pathname.toLowerCase();return platforms.find(x=>p.includes('/'+x.key+'/'))?.key||''}
  function currentPageKey(){const p=location.pathname.toLowerCase();const k=currentKey();if(k)return k;if(p.includes('/guidance-stats/'))return 'guidance-stats';if(p.includes('/chat/'))return 'chat';return ''}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function link(x){return `<a class="mgs-link ${currentKey()===x.key?'active':''}" href="${A(x.href)}"><i>${x.icon}</i><strong>${esc(x.title)}</strong></a>`}
  function ensureCss(href,id){if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  function loadScript(src,id){return new Promise(resolve=>{if(global[id])return resolve();const exists=[...document.scripts].find(s=>s.src===src);if(exists){exists.addEventListener('load',resolve,{once:true});return resolve()}const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)})}
  function build(){
    if(document.getElementById('mishkatGlobalShell'))return;
    ensureCss(A('global-shell.css?v=1.0.24'),'mgsGlobalCss');
    const pageKey=currentPageKey();
    document.body.classList.add('mishkat-global-shell-loaded');
    document.body.classList.add(pageKey?'mishkat-inner-shell':'mishkat-home-shell');
    const shell=document.createElement('header');shell.id='mishkatGlobalShell';shell.innerHTML=`
      <div class="mgs-bar">
        <a class="mgs-brand" href="${A('index.html')}"><img src="${A('assets/school-logo.png')}" alt="شعار مدارس المشكاة"><span class="mgs-brand-copy"><b id="mgsBrandTitle">بوابة التوجيه الطلابي</b><span id="mgsContextLine">مدارس المشكاة الأهلية · جميع الخدمات في مكان واحد</span></span></a>
        <div class="mgs-gateway"><button id="mgsGatewayBtn" class="mgs-gateway-button" type="button" aria-expanded="false"><span class="mgs-grid-icon">▦</span><span class="txt">بوابة المنصات</span><b>⌄</b></button>
          <div id="mgsMenu" class="mgs-menu"><div class="mgs-menu-head"><b>خدمات التوجيه الطلابي</b><span>انتقل لأي خدمة بدون الرجوع للرئيسية</span></div><div class="mgs-menu-groups">
            <section class="mgs-menu-group"><span>الإدارة والمتابعة اليومية</span><div class="mgs-links">${platforms.slice(0,4).map(link).join('')}</div></section>
            <section class="mgs-menu-group"><span>التحليل والمخرجات</span><div class="mgs-links">${platforms.slice(4).map(link).join('')}</div></section>
          </div></div>
        </div>
        <nav id="mgsActions" class="mgs-actions" aria-label="أدوات المنصة">
          <a class="mgs-action" href="${A('index.html')}" title="الرئيسية"><span class="ico">⌂</span><span class="label">الرئيسية</span></a>
          <button id="mgsNotifyBtn" class="mgs-action" type="button"><span class="ico">🔔</span><span class="label">التنبيهات</span><b id="mgsNotifyBadge" class="mgs-badge" hidden>0</b></button>
          <button id="mgsSupportBtn" class="mgs-action" type="button"><span class="ico">◉</span><span class="label">الدعم</span></button>
        </nav>
        <div id="mgsSupportPop" class="mgs-support-pop"><h3>الدعم الفني</h3><p>استخدم المحادثة المباشرة إن كانت جلسة الدعم مفعّلة، أو تواصل عبر واتساب.</p><div class="mgs-support-actions"><button id="mgsOpenChat" class="mgs-support-chat" type="button">المحادثة المباشرة</button><a class="mgs-support-whatsapp" href="https://wa.me/966582712620" target="_blank" rel="noopener">واتساب الدعم</a></div></div>
      </div>
      <div id="mgsPageStrip" class="mgs-page-strip" hidden><div class="mgs-page-title"><span id="mgsPageIcon" class="mgs-page-icon"></span><div><strong id="mgsPageTitle"></strong><small id="mgsPageDesc"></small></div></div><div id="mgsPageActions" class="mgs-page-actions"></div></div>`;
    document.body.insertBefore(shell,document.body.firstChild);
    const floatingChat=document.createElement('a');
    floatingChat.id='mgsFloatingChat';
    floatingChat.className='mgs-floating-chat';
    floatingChat.href=A('chat/index.html');
    floatingChat.title='شات التوجيه الطلابي';
    floatingChat.setAttribute('aria-label','فتح شات التوجيه الطلابي');
    floatingChat.innerHTML='<span class="mgs-floating-chat-icon">💬</span><span class="mgs-floating-chat-label">الشات</span>';
    document.body.appendChild(floatingChat);
    bind();updateContext();
  }
  function setShellHeight(){const shell=document.getElementById('mishkatGlobalShell');if(!shell)return;document.documentElement.style.setProperty('--mgs-shell-height',Math.ceil(shell.getBoundingClientRect().height)+'px')}
  function nativePageHeaders(){const key=currentPageKey();if(!key)return[];const selectors={records:['header.app-header'],analysis:['header.app-header'],messages:['header.app-header'],plans:['header.plan-header'],presentations:['header.presentation-header'],reports:['header.app-header'],certificates:['header.hero'],calendar:['header.hero'],'guidance-stats':['header.top'],chat:['section.chat-hero']};return (selectors[key]||[]).flatMap(sel=>[...document.querySelectorAll(sel)]).filter(h=>h.id!=='mishkatGlobalShell'&&!h.closest('#mishkatGlobalShell'))}
  function mirrorImportantHeaderActions(headers){
    const host=document.getElementById('mgsPageActions');if(!host)return;host.innerHTML='';const seen=new Set();
    headers.forEach(h=>h.querySelectorAll('.header-actions button[id],.hero-actions button[id]').forEach(btn=>{
      if(!btn.id||seen.has(btn.id))return;seen.add(btn.id);const proxy=document.createElement('button');proxy.type='button';proxy.className='mgs-page-action';
      proxy.textContent=(btn.textContent||'إجراء').trim();proxy.addEventListener('click',()=>btn.click());host.appendChild(proxy)
    }));
    if(currentPageKey()){const actions=document.getElementById('mgsActions');if(actions&&host.parentElement!==actions)actions.appendChild(host)}
    host.hidden=!host.children.length
  }
  function normalizePageChrome(){
    document.querySelectorAll('#unifiedPlatformBar').forEach(h=>{h.hidden=true;h.classList.add('mgs-legacy-header-hidden')});
    const key=currentPageKey(),meta=pageMeta[key],strip=document.getElementById('mgsPageStrip');
    const brandTitle=document.getElementById('mgsBrandTitle');
    if(key&&meta){
      if(strip)strip.hidden=true;
      if(brandTitle)brandTitle.textContent=meta.icon+'  '+meta.title;
      document.body.dataset.mishkatPage=key;
    }else if(strip){strip.hidden=true}
    const headers=nativePageHeaders();mirrorImportantHeaderActions(headers);headers.forEach(h=>h.classList.add('mgs-native-header-suppressed'));
    setShellHeight();
  }
  function closePops(){document.getElementById('mgsMenu')?.classList.remove('open');document.getElementById('mgsGatewayBtn')?.setAttribute('aria-expanded','false');document.getElementById('mgsSupportPop')?.classList.remove('open')}
  function bind(){
    const g=document.getElementById('mgsGatewayBtn'),menu=document.getElementById('mgsMenu'),support=document.getElementById('mgsSupportBtn'),sp=document.getElementById('mgsSupportPop');
    g?.addEventListener('click',e=>{e.stopPropagation();const open=!menu.classList.contains('open');closePops();menu.classList.toggle('open',open);g.setAttribute('aria-expanded',String(open))});
    support?.addEventListener('click',e=>{e.stopPropagation();const open=!sp.classList.contains('open');closePops();sp.classList.toggle('open',open)});
    document.addEventListener('click',e=>{if(!e.target.closest('#mishkatGlobalShell'))closePops()});
    document.getElementById('mgsNotifyBtn')?.addEventListener('click',()=>{const t=document.getElementById('smartReminderToggle');if(t){t.click()}else if(global.GuidanceReminderAPI){global.GuidanceReminderAPI.refreshEverywhere?.()}});
    document.getElementById('mgsOpenChat')?.addEventListener('click',()=>{const t=document.getElementById('unifiedSupportToggle');if(t&&!t.classList.contains('unified-support-hidden')){t.click();sp.classList.remove('open')}else{window.open('https://wa.me/966582712620','_blank')}});
    global.addEventListener('mishkat:school-context-ready',updateContext);global.addEventListener('mishkat:school-context-changed',updateContext);
  }
  function updateContext(){const c=global.MishkatSchoolContext?.getContext?.()||{};const line=document.getElementById('mgsContextLine');if(line){const bits=[c.schoolName||'مدارس المشكاة الأهلية',c.stageName||c.departmentName,c.counselorName].filter(Boolean);line.textContent=bits.join(' · ')||'مدارس المشكاة الأهلية · جميع الخدمات في مكان واحد'}}
  function syncBadge(){const src=document.getElementById('smartReminderBadge'),dst=document.getElementById('mgsNotifyBadge');if(!dst)return;const n=Number(src?.textContent||0);dst.hidden=!n;dst.textContent=String(Math.min(99,n))}
  async function loadServices(){
    ensureCss(A('smart-reminders.css?v=1.0.24'),'mgsReminderCss');ensureCss(A('support-widget.css?v=1.0.24'),'mgsSupportCss');
    await loadScript(A('bubble-schema.js?v=1.0.24'),'MISHKAT_BUBBLE_SCHEMA');
    await loadScript(A('bubble-config.js?v=1.0.24'),'MISHKAT_BUBBLE_CONFIG');
    await loadScript(A('school-context.js?v=1.0.24'),'MishkatSchoolContext');
    await loadScript(A('bubble-persistence.js?v=1.0.24'),'MishkatBubbleStore');
    await loadScript(A('school-directory.js?v=1.0.24'),'MishkatBubbleDirectory');
    if(!global.__guidanceSmartRemindersLoaded)await loadScript(A('smart-reminders.js?v=1.0.24'),'__guidanceSmartRemindersLoaded');
    if(!global.__unifiedSupportWidgetLoaded)await loadScript(A('support-widget-rest.js?v=1.0.24'),'__unifiedSupportWidgetLoaded');
    setTimeout(syncBadge,500);setInterval(syncBadge,1200);
  }
  function reorderHome(){if(!/\/index\.html$|\/$/.test(location.pathname))return;const grid=document.getElementById('activePlatformGrid');if(!grid)return;const order=['records','counselor-plan','smart-calendar','messages','analysis','reports','certificates','presentations'];order.forEach((cls,i)=>{const card=grid.querySelector('.'+cls);if(card){grid.appendChild(card);const n=card.querySelector('.platform-number');if(n)n.textContent=String(i+1).padStart(2,'0')}})}
  async function init(){build();normalizePageChrome();reorderHome();loadServices().catch(()=>{});const shell=document.getElementById('mishkatGlobalShell');if(shell&&'ResizeObserver'in window)new ResizeObserver(setShellHeight).observe(shell);addEventListener('resize',setShellHeight,{passive:true});setTimeout(setShellHeight,120);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
