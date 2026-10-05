(function () {
  'use strict';
  function start() {
    var frames = Array.prototype.slice.call(document.querySelectorAll('iframe[data-antidrone-frame]'));
    var requests = new WeakMap();
    function canSend(frame) {
      var endpoint = new URL(frame.getAttribute('data-endpoint'), location.href);
      return frame.getAttribute('data-requests') === '1' && endpoint.origin === location.origin && endpoint.pathname === '/upload.php' && window.jQuery && typeof window.jQuery.ajax === 'function';
    }
    function configure(frame) {
      var context = frame.closest('article,main,.uk-panel') || frame.parentElement;
      var heading = context.querySelector('h1,h2,h3'), button = document.querySelector('.main_form .button,.main_form .uk-button,.uk-button-primary'), text = getComputedStyle(context);
      var styles = Array.prototype.map.call(document.querySelectorAll('link[rel=stylesheet]'), function (link) { return link.href; }).filter(function (value) { var url = new URL(value, location.href); return url.origin === location.origin && url.pathname.indexOf('/templates/') !== -1; });
      var siteForm = frame.getAttribute('data-transport') === 'site-form';
      frame.contentWindow.postMessage({ type: 'antidrone:host', theme: { font: text.fontFamily, text: text.color, muted: text.color, heading: heading ? getComputedStyle(heading).color : '#5c5c5c', accent: button ? getComputedStyle(button).backgroundColor : '#ff5000' }, styles: styles, host: { transport: siteForm ? 'site-form' : undefined, endpoint: frame.getAttribute('data-endpoint'), tokenName: frame.getAttribute('data-token'), moduleId: Number(frame.getAttribute('data-module-id')), enabled: siteForm ? !!canSend(frame) : frame.getAttribute('data-requests') === '1' } }, location.origin);
    }
    function submit(frame, data) {
      if (frame.getAttribute('data-transport') !== 'site-form' || typeof data.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.requestId)) return;
      var reply = function (success, message) { frame.contentWindow.postMessage({ type: 'antidrone:result', requestId: data.requestId, success: success, message: message }, location.origin); };
      if (!canSend(frame)) { reply(false, 'Не найден работающий скрипт формы сайта. Свяжитесь с компанией по телефону или email.'); return; }
      var fields = data.fields, keys = ['DATA[NAME]', 'DATA[PHONE_WORK]', 'DATA[EMAIL_WORK]', 'DATA[COMMENTS]'];
      if (!fields || Object.keys(fields).length !== keys.length || keys.some(function (key) { return typeof fields[key] !== 'string' || fields[key].length > (key === 'DATA[COMMENTS]' ? 10000 : 120); }) || (!fields[keys[1]].trim() && !fields[keys[2]].trim())) { reply(false, 'Проверьте поля заявки.'); return; }
      var query = new URLSearchParams(fields).toString() + '&files_data=&submit';
      var endpoint = new URL(frame.getAttribute('data-endpoint'), location.href);
      // The original handler uses GET. Do not truncate a request or lose parameters.
      if (endpoint.href.length + query.length + 1 > 7800) { reply(false, 'Описание слишком длинное для формы сайта. Сократите его или свяжитесь с нами по email.'); return; }
      var entries = requests.get(frame);
      if (!entries) { entries = new Map(); requests.set(frame, entries); }
      var previous = entries.get(data.requestId);
      if (previous) {
        if (previous.query !== query) reply(false, 'Параметры заявки изменились. Повторите отправку.');
        else if (previous.result) reply(previous.result.success, previous.result.message);
        return; // A repeated pending request must not send a second message.
      }
      var entry = { query: query }; entries.set(data.requestId, entry);
      function finish(success, message, retryable) {
        entry.result = { success: success, message: message };
        if (retryable) entries.delete(data.requestId);
        // Keep uncertain network results: automatic retries could duplicate a lead.
        if (entries.size > 20) entries.forEach(function (value, key) { if (entries.size > 20 && value.result && key !== data.requestId) entries.delete(key); });
        reply(success, message);
      }
      try {
        // Use the host's existing jQuery and the exact custom.js field protocol.
        window.jQuery.ajax({ type: 'GET', url: endpoint.href, data: query, timeout: 30000, cache: false })
          .done(function (result) {
            var response = result;
            if (typeof response === 'string') { try { response = JSON.parse(response); } catch (_) {} }
            if (response && (response.success === false || response.status === 'error' || response.error) || response === 'error') finish(false, 'Форма сайта отклонила заявку. Проверьте данные и попробуйте ещё раз.', true);
            else finish(true); // Same acknowledgment as the original form; no invented receipt number.
          })
          .fail(function (xhr) {
            finish(false, xhr.status ? 'Форма сайта недоступна. Попробуйте ещё раз.' : 'Не удалось подтвердить отправку. Свяжитесь с компанией по телефону или email.', !!xhr.status);
          });
      } catch (_) { finish(false, 'Не удалось вызвать скрипт формы сайта.', true); }
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== location.origin || !event.data) return;
      frames.forEach(function (frame) {
        if (event.source !== frame.contentWindow) return;
        if (event.data.type === 'antidrone:ready') configure(frame);
        if (event.data.type === 'antidrone:submit') submit(frame, event.data);
        if (event.data.type === 'antidrone:size' && Number.isFinite(event.data.height) && event.data.height >= 300 && event.data.height <= 50000) frame.style.height = Math.ceil(event.data.height) + 'px';
        if (event.data.type === 'antidrone:scroll' && Number.isFinite(event.data.offset) && event.data.offset >= 0 && event.data.offset <= frame.clientHeight) window.scrollTo({ top: frame.getBoundingClientRect().top + window.scrollY + event.data.offset - 12, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
    });
    frames.forEach(function (frame) { frame.addEventListener('load', function () { configure(frame); }); configure(frame); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
