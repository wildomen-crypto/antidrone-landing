(function () {
  'use strict';
  function start() {
    var article = document.getElementById('te-antidrone-article');
    if (!article) return;
    var frame = article.querySelector('iframe[data-antidrone-frame]');
    if (!frame || new URL(frame.src, location.href).origin !== location.origin) return;
    var requests = new Map();
    function contract() { return article.querySelector('[data-antidrone-bitrix-contract] form[data-request-form]'); }
    function available() { return !!(contract() && contract().dataset.signedParameters && window.BX && window.BX.ajax && typeof window.BX.ajax.runComponentAction === 'function'); }
    function configure() {
      frame.contentWindow.postMessage({type:'antidrone:host', styles:[],
        theme:{font:getComputedStyle(article).fontFamily,text:'#f0f5fa',muted:'#c4d0d9',heading:'#f0f5fa',accent:'#ff641a'},
        host:{transport:'site-form',endpoint:'/local/ajax/send.form_default.php',moduleId:1,enabled:available(),requiresAllContacts:true}},location.origin);
    }
    function reply(id, success, message) { frame.contentWindow.postMessage({type:'antidrone:result',requestId:id,success:success,message:message},location.origin); }
    function submit(data) {
      var id=data.requestId, fields=data.fields;
      if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
      if (!available()) {reply(id,false,'Форма сайта недоступна. Обновите страницу или свяжитесь с компанией.');return;}
      var keys=['DATA[NAME]','DATA[PHONE_WORK]','DATA[EMAIL_WORK]','DATA[COMMENTS]'];
      if (!fields || Object.keys(fields).length!==keys.length || keys.some(function(k){return typeof fields[k]!=='string' || fields[k].length>(k==='DATA[COMMENTS]'?10000:120);})) {reply(id,false,'Проверьте поля заявки.');return;}
      var name=fields[keys[0]].trim(), phone=fields[keys[1]].trim(), email=fields[keys[2]].trim(), message=fields[keys[3]].trim();
      if(name.length<2 || /https?:|www\./i.test(name)) {reply(id,false,'Укажите имя: не менее двух символов.');return;}
      if(!/^[78]\d{10}$/.test(phone.replace(/\D/g,''))) {reply(id,false,'Укажите телефон в формате +7 (999) 123-45-67.');return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {reply(id,false,'Укажите корректный email.');return;}
      if(message.length<3) {reply(id,false,'Опишите задачу.');return;}
      var signature=JSON.stringify(keys.map(function(k){return fields[k];})), previous=requests.get(id);
      if(previous) {
        if(previous.signature!==signature) {reply(id,false,'Параметры заявки изменились. Повторите отправку.');return;}
        if(previous.pending) return;
        if(previous.success) {reply(id,true);return;}
      }
      // Reuse the existing component, its CSRF filter, signed MODE and CRM/idempotency service.
      var body=new FormData();
      var values={name:name,phone:phone,email:email,message:message,personal_data:'1',website:'',request_id:id,
        page_url:location.href,referrer:document.referrer,service:'Проектирование антидроновой защиты',lead_title:'Оценка проекта'};
      Object.keys(values).forEach(function(k){body.set(k,values[k]);});
      var params=new URLSearchParams(location.search);
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){body.set(k,(params.get(k)||'').slice(0,300));});
      var entry={signature:signature,pending:true,success:false};requests.set(id,entry);
      Promise.resolve().then(function(){return window.BX.ajax.runComponentAction('topengineer:request.form','send',{
        mode:'class',signedParameters:contract().dataset.signedParameters,data:body
      });}).then(function(response){
        var result=response && response.data;
        entry.pending=false;entry.success=!!(result && result.success===true);
        reply(id,entry.success,entry.success?undefined:(result && typeof result.message==='string'?result.message:'Сайт не подтвердил отправку заявки.'));
      }).catch(function(){
        entry.pending=false;
        // Preserve request ID. A retry is checked by the existing server's receipt.
        reply(id,false,'Не удалось подтвердить отправку. Повторите с теми же данными или свяжитесь с компанией.');
      });
    }
    function gallery() {
      var doc=frame.contentDocument;
      if (!doc || doc.documentElement.dataset.bitrixGalleryBound==='1') return;
      doc.documentElement.dataset.bitrixGalleryBound='1';
      doc.addEventListener('click',function(event){
        if(event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        var link=event.target.closest && event.target.closest('a[data-gallery-photo]');
        if(!link || !window.jQuery || !window.jQuery.magnificPopup || typeof window.jQuery.magnificPopup.open!=='function') return;
        var group=link.closest('.portfolio-grid,.material-grid');if(!group)return;
        var links=Array.from(group.querySelectorAll('a[data-gallery-photo]'));
        var items=links.map(function(a){return {src:a.href,type:'image'};});
        if(items.some(function(item){return new URL(item.src).origin!==location.origin;}))return;
        event.preventDefault();event.stopPropagation();
        window.jQuery.magnificPopup.open({items:items,type:'image',closeBtnInside:false,mainClass:'mfp-img-mobile',
          gallery:{enabled:true,preload:[0,1]},image:{titleSrc:function(item){var index=items.findIndex(function(i){return i.src===item.src;});var title=links[index] && links[index].getAttribute('data-photo-title');return title?window.jQuery('<span>').text(title).html():'';}},
          callbacks:{close:function(){link.focus({preventScroll:true});}}},links.indexOf(link));
      },true);
    }
    window.addEventListener('message',function(event){
      if(event.origin!==location.origin || event.source!==frame.contentWindow || !event.data)return;
      var data=event.data;
      if(data.type==='antidrone:ready') {configure();gallery();}
      if(data.type==='antidrone:submit')submit(data);
      if(data.type==='antidrone:size' && Number.isFinite(data.height) && data.height>=300 && data.height<=50000)frame.style.height=Math.ceil(data.height)+'px';
      if(data.type==='antidrone:scroll' && Number.isFinite(data.offset) && data.offset>=0 && data.offset<=frame.clientHeight)window.scrollTo({top:Math.max(0,frame.getBoundingClientRect().top+window.scrollY+data.offset-100),behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    });
    frame.addEventListener('load',function(){configure();gallery();});configure();gallery();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
