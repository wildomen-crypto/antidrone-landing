(function () {
  'use strict';
  var assetRoot = new URL('.', document.currentScript.src).href;
  var paths = [
    ['calculator', '3D-конструктор'], ['solutions', 'Решения'], ['portfolio', 'Примеры'],
    ['materials', 'Материалы'], ['documents', 'Документация'], ['process', 'Этапы'], ['contacts', 'Заявка']
  ];
  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function start(shell) {
    var variant = shell.getAttribute('data-design-variant');
    if (!['navigation', 'examples', 'workspace'].includes(variant)) return;
    var frame = shell.querySelector('iframe[data-antidrone-frame]');
    if (!frame || new URL(frame.src, location.href).origin !== location.origin) return;
    var installed = null, stop = null;
    function jump(id) {
      var target = frame.contentDocument && frame.contentDocument.getElementById(id);
      if (!target) return;
      window.scrollTo({top: Math.max(0, frame.getBoundingClientRect().top + window.scrollY + target.getBoundingClientRect().top + frame.contentWindow.scrollY - 90), behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
    }
    function link(id, text, className) {
      var a = node('a', className, text); a.href = '#' + id;
      a.addEventListener('click', function (event) {event.preventDefault(); jump(id);}); return a;
    }
    function rail(side) {
      var aside = node('aside', 'variant-rail variant-rail-' + side);
      aside.setAttribute('aria-label', side === 'left' ? 'Навигация и примеры решений' : 'Проект и дополнительные сведения');
      if (side === 'left') shell.prepend(aside); else shell.append(aside);
      return aside;
    }
    function box(title) {
      var el = node('section', 'variant-box'); el.append(node('h2', '', title)); return el;
    }
    function install() {
      var doc = frame.contentDocument;
      if (!doc || doc === installed) return;
      var root = doc.querySelector('.joomla-content'), calculator = doc.querySelector('.calculator');
      // Wait for the application's effect to finish hydration before enhancing it.
      if (!root || !calculator || !doc.querySelector('.project-price') || !doc.querySelector('canvas,.scene-fallback')) return;
      if (stop) stop();
      installed = doc;
      shell.querySelectorAll('.variant-rail').forEach(function (el) {el.remove();});
      doc.body.setAttribute('data-design-variant', variant);
      var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = assetRoot + 'frame.css'; doc.head.append(css);
      var documents = root.querySelector('.documents-section'); if (documents) documents.id = 'documents';
      var left = variant !== 'workspace' ? rail('left') : null;
      var right = variant !== 'workspace' ? rail('right') : null;
      var updateSummary = function () {};
      var groups = [];
      if (variant === 'navigation') {
        var sticky = node('div','variant-sticky'), nav = node('nav','variant-nav');
        nav.setAttribute('aria-label','Разделы страницы');
        paths.forEach(function (p) {nav.append(link(p[0],p[1]));}); sticky.append(nav); left.append(sticky);
        var rightSticky = node('div','variant-sticky'), summary = box('Ваш проект');
        var shapeText = node('div','variant-summary-title'), dims = node('div','variant-summary-dimensions');
        summary.append(shapeText,dims,node('h3','','Разделы документации'));
        var serviceButtons = [];
        ['Разработка КМ','Разработка КМД','Разработка КЖ'].forEach(function (name, i) {
          var b = node('button','variant-service-proxy',name); b.type = 'button';
          b.addEventListener('click',function () {var input=doc.querySelectorAll('.service-picker input[type=checkbox]')[i];if(input&&!input.disabled)input.click();});
          summary.append(b); serviceButtons.push(b);
        });
        var price = node('strong','variant-price'), note = node('p','','Черновая оценка трудоёмкости. Стоимость уточняется после проверки схемы.');
        price.setAttribute('aria-live','polite'); summary.append(price,note,link('quote-request','Получить проект','variant-cta'));
        var prepare = box('Что подготовить');
        var list = node('ul','variant-list'); ['Размеры объекта','План площадки','Нужные разделы проекта'].forEach(function (t) {list.append(node('li','',t));}); prepare.append(list);
        rightSticky.append(summary,prepare); right.append(rightSticky);
        updateSummary = function () {
          var selected = doc.querySelector('.shape-choice[aria-pressed=true] .shape-choice-name');
          var next = selected ? selected.textContent.trim() : 'Предварительная схема'; if(shapeText.textContent!==next)shapeText.textContent=next;
          var d = Array.from(doc.querySelectorAll('.dimension-panel .dimension-slider')).slice(0,3).map(function (el) {var input=el.querySelector('input[type=text],input[type=number]');var label=el.querySelector('label');return label&&input ? label.textContent.replace(/,?\s*м\s*$/,'')+': '+input.value+' м' : '';}).filter(Boolean).join(' · ');
          if(dims.textContent!==d)dims.textContent=d;
          var p = doc.querySelector('.project-price strong'); var value=p?p.textContent:'Выберите разделы';if(price.textContent!==value)price.textContent=value;
          serviceButtons.forEach(function (b,i) {var input=doc.querySelectorAll('.service-picker input[type=checkbox]')[i];b.setAttribute('aria-pressed',String(!!(input&&input.checked)));b.disabled=!input;});
        };
      }
      if (variant === 'examples') {
        function group(side, sectionId) {var el=node('div','variant-context-group');side.append(el);groups.push({el:el,id:sectionId});return el;}
        function photo(parent,shapeId,title,image) {
          var el=box(title);el.classList.add('variant-photo');el.append(node('small','','Визуальная концепция'));
          var img=node('img');img.src=new URL(image,frame.src).href;img.alt=title;img.loading='lazy';el.append(img);
          var button=node('button','','Выбрать в 3D');button.type='button';
          button.addEventListener('click',function(){frame.contentWindow.dispatchEvent(new frame.contentWindow.CustomEvent('choose-shape',{detail:shapeId}));jump('calculator');});el.append(button);parent.append(el);
        }
        var firstLeft=group(left,'calculator'),firstRight=group(right,'calculator');
        photo(firstLeft,'C1','Линейный экран','../images/portfolio/linear-screen.png');
        photo(firstLeft,'C3','Навес','../images/portfolio/canopy.png');
        photo(firstRight,'C7','Укрытие резервуара','../images/portfolio/round-dome.png');
        photo(firstRight,'C8','Комплексное укрытие','../images/portfolio/complex-enclosure.png');
        var solutionsLeft=group(left,'solutions'),solutionsRight=group(right,'solutions');
        var types=box('Быстрый переход');paths.slice(0,4).forEach(function(p){types.append(link(p[0],p[1],'variant-cta'));});solutionsLeft.append(types);
        var steps=box('Состав проекта');steps.append(link('documents','КМ, КМД, КЖ'),node('p','','Разделы выбираются в зависимости от вашей задачи.'),link('process','Как мы работаем'));solutionsRight.append(steps);
        var portfolioLeft=group(left,'portfolio'),portfolioRight=group(right,'portfolio');
        photo(portfolioLeft,'C2','Ограждение по периметру','../images/portfolio/perimeter.png');
        photo(portfolioRight,'C5','Пристенный козырёк','../images/portfolio/facade-canopy.png');
        var materialsLeft=group(left,'materials'),materialsRight=group(right,'materials');
        var materialSources=Array.from(doc.querySelectorAll('#materials img')).slice(0,2);
        [materialsLeft,materialsRight].forEach(function(parent,i){if(!materialSources[i])return;var el=box(i===0?'Сетчатое полотно':'Стальное заполнение');el.classList.add('variant-photo');var image=node('img');image.src=materialSources[i].src;image.alt=materialSources[i].alt;el.append(image,link('materials','Все материалы'));parent.append(el);});
        var endLeft=group(left,'documents'),endRight=group(right,'documents');
        var dataBox=box('Исходные данные');dataBox.append(node('p','','Габариты, схема площадки и требования к документации.'),link('contacts','Обсудить задачу','variant-cta'));endLeft.append(dataBox);
        var order=box('Заказать проект');order.append(node('p','','Оставьте телефон или email и краткое описание задачи.'),link('quote-request','Перейти к заявке','variant-cta'));endRight.append(order);
      }
      var pending = false;
      function refresh() {
        pending = false;updateSummary();
        groups.forEach(function(g){var target=doc.getElementById(g.id);if(target)g.el.style.top=Math.max(0,target.getBoundingClientRect().top+frame.contentWindow.scrollY)+'px';});
        if(variant==='workspace'){
          var quote=doc.querySelector('.quote-result'),form=doc.querySelector('.quote-form'),output=doc.querySelector('.calculator-output');
          if(quote&&form&&output){output.style.setProperty('--variant-quote-height',Math.ceil(quote.getBoundingClientRect().height)+'px');
            var wide=frame.clientWidth>=1280;output.style.minHeight=wide?Math.max(720,quote.getBoundingClientRect().height+form.getBoundingClientRect().height)+'px':'';}
        }
        if(left&&variant==='navigation'){
          var active='calculator';paths.forEach(function(p){var target=doc.getElementById(p[0]);if(target&&frame.getBoundingClientRect().top+target.getBoundingClientRect().top<180)active=p[0];});
          left.querySelectorAll('.variant-nav a').forEach(function(a){a.setAttribute('aria-current',String(a.hash==='#'+active));});
        }
      }
      function schedule(){if(!pending){pending=true;requestAnimationFrame(refresh);}}
      var mutation = new MutationObserver(schedule);mutation.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','data-shape']});
      var resize = new ResizeObserver(schedule);resize.observe(root);var quote=doc.querySelector('.quote-result'),form=doc.querySelector('.quote-form');if(quote)resize.observe(quote);if(form)resize.observe(form);
      doc.addEventListener('input',schedule);doc.addEventListener('change',schedule);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
      stop=function(){mutation.disconnect();resize.disconnect();doc.removeEventListener('input',schedule);doc.removeEventListener('change',schedule);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
      css.addEventListener('load',schedule);refresh();shell.setAttribute('data-design-ready','true');
    }
    frame.addEventListener('load',install);
    var timer=setInterval(function(){install();if(installed)clearInterval(timer);},100);
    setTimeout(function(){clearInterval(timer);},30000);
    window.addEventListener('message',function(event){if(event.source===frame.contentWindow&&event.origin===location.origin&&event.data&&event.data.type==='antidrone:ready')install();});
    install();
  }
  function ready(){document.querySelectorAll('.antidrone-variant-shell[data-design-variant]').forEach(start);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
