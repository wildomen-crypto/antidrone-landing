(function () {
  'use strict';
  function start() {
    var frames = Array.prototype.slice.call(document.querySelectorAll('iframe[data-antidrone-frame]'));
    function configure(frame) {
      var context = frame.closest('article,main,.uk-panel') || frame.parentElement;
      var heading = context.querySelector('h1,h2,h3'), button = document.querySelector('.main_form .button,.main_form .uk-button,.uk-button-primary'), text = getComputedStyle(context);
      var styles = Array.prototype.map.call(document.querySelectorAll('link[rel=stylesheet]'), function (link) { return link.href; }).filter(function (value) { var url = new URL(value, location.href); return url.origin === location.origin && url.pathname.indexOf('/templates/') !== -1; });
      frame.contentWindow.postMessage({ type: 'antidrone:host', theme: { font: text.fontFamily, text: text.color, muted: text.color, heading: heading ? getComputedStyle(heading).color : '#5c5c5c', accent: button ? getComputedStyle(button).backgroundColor : '#ff5000' }, styles: styles, host: { endpoint: frame.getAttribute('data-endpoint'), tokenName: frame.getAttribute('data-token'), moduleId: Number(frame.getAttribute('data-module-id')), enabled: frame.getAttribute('data-requests') === '1' } }, location.origin);
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== location.origin || !event.data) return;
      frames.forEach(function (frame) {
        if (event.source !== frame.contentWindow) return;
        if (event.data.type === 'antidrone:ready') configure(frame);
        if (event.data.type === 'antidrone:size' && Number.isFinite(event.data.height) && event.data.height >= 300 && event.data.height <= 50000) frame.style.height = Math.ceil(event.data.height) + 'px';
        if (event.data.type === 'antidrone:scroll' && Number.isFinite(event.data.offset) && event.data.offset >= 0 && event.data.offset <= frame.clientHeight) window.scrollTo({ top: frame.getBoundingClientRect().top + window.scrollY + event.data.offset - 12, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
    });
    frames.forEach(function (frame) { frame.addEventListener('load', function () { configure(frame); }); configure(frame); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
