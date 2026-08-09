"use strict";
/* Role-scoped statistics — homepage insight zone V1.0.17 */
(function(global){
  if(global.MishkatGuidanceAccess)return;
  const SUPERVISOR_PREVIEW=true;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  function context(){return global.MishkatSchoolContext?.getContext?.()||{};}
  function insight({kind,title,desc,href,scope,pills}){
    return `<article class="guidance-insight-card ${kind==='school'?'guidance-school-insight':''}" data-guidance-insight="${kind}">
      <div class="guidance-insight-copy"><span class="guidance-insight-kicker">${kind==='school'?'لوحة المدرسة':'لوحة إشرافية حسب الصلاحية'}</span><h2>${esc(title)}</h2><p>${esc(desc)}</p><div class="guidance-insight-pills">${pills.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
      <div class="guidance-insight-actions"><a class="guidance-insight-open" href="${href}"><span>عرض لوحة الإحصائيات</span><b>←</b></a><div class="guidance-insight-scope">${esc(scope)}</div></div>
    </article>`;
  }
  function render(){
    const main=$('.dashboard-layout');if(!main)return;
    main.querySelector('#guidanceInsightZone')?.remove();
    const c=context();const items=[];
    if(c.canViewSupervisionStats||SUPERVISOR_PREVIEW){
      items.push(insight({kind:'supervision',title:'لوحة الإشراف والمتابعة للتوجيه الطلابي',desc:'نظرة تنفيذية على أداء المدارس: النشاط الإرشادي، الحالات والمواقف، البرامج الجماعية، التواصل، المواظبة، الخطط، التقويم والشهادات — مع مقارنة المدارس داخل نطاق الإشراف.',href:'guidance-stats/index.html?scope=supervision&from=home&preview=general_supervisor',scope:c.canViewSupervisionStats?(c.roleKey==='complex_supervisor'?'نطاق المجمع الموزع عليك':'نطاق الإشراف المصرح به'):'معاينة حالية بصلاحية المشرف العام',pills:['مقارنة المدارس','مؤشرات الطلاب','المواقف والحالات','البرامج والخطط']}));
    } else if(c.canViewSchoolStats){
      items.push(insight({kind:'school',title:'إحصائيات التوجيه الطلابي للمدرسة',desc:'متابعة مؤشرات المدرسة والسجلات والطلاب المستفيدين والبرامج والمراسلات والخطط حسب العام الأكاديمي والفصل الدراسي.',href:'guidance-stats/index.html?scope=school&from=home',scope:c.roleKey==='counselor'?'مدرستك ومرحلتك':'نطاق المدرسة بالكامل',pills:['مؤشرات السجلات','الطلاب المستفيدون','التواصل','الخطط والتنفيذ']}));
    }
    if(!items.length)return;
    const section=document.createElement('section');section.id='guidanceInsightZone';section.className='guidance-insight-zone';section.innerHTML=items.join('');
    const anchor=$('.dashboard-summary')||$('.platforms-section');anchor?.parentNode?.insertBefore(section,anchor);
    document.getElementById('activePlatformCount')&&(document.getElementById('activePlatformCount').textContent='8');
    document.getElementById('activePlatformCountBadge')&&(document.getElementById('activePlatformCountBadge').textContent='8');
  }
  let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;render()},0)}
  async function boot(){render();global.addEventListener('mishkat:school-context-ready',schedule);global.addEventListener('mishkat:school-context-changed',schedule);try{await global.MishkatBubbleDirectory?.load?.();global.MishkatSchoolContext?.build?.();global.MishkatSchoolContext?.applyDocument?.(document)}catch(_e){}render();setTimeout(render,600)}
  global.MishkatGuidanceAccess={render,context};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
