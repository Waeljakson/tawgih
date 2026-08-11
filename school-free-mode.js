(function(){
  'use strict';
  window.MISHKAT_SCHOOL_EDITION=true;
  window.MISHKAT_FREE_SCHOOL_EDITION=true;
  function enforce(){
    document.documentElement.setAttribute('data-school-free','true');
    document.body?.setAttribute('data-school-free','true');
    ['subscriptionModal','promoModal','paymentModal'].forEach(function(id){var n=document.getElementById(id);if(n){n.hidden=true;n.style.setProperty('display','none','important')}});
    document.querySelectorAll('.subscription-box,.subscription-card,.plans-overview,.price-note,#openPromoButton,#requestPremiumButton,[data-quick-plan]').forEach(function(n){n.hidden=true;n.style.setProperty('display','none','important')});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforce,{once:true});else enforce();
  window.addEventListener('mishkat:school-context-ready',enforce);
})();
