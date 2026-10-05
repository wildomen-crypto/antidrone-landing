# Реестр блоков разработки

Рабочий реестр проекта C:\taran\antidrone-landing.
Состояния обновляются по результатам проверки каждого блока.
Выполнять в указанном порядке; сложные блоки делить с сохранением ID.
Незавершённый предыдущий блок восстановить до начала следующего.
Статусы: TODO, IN_PROGRESS, PAUSED, WAITING_EXTERNAL, VERIFIED.
B10.2 необязателен: решение об объёме записывается отдельно.

| ID | Статус | Результат | Проверка | Карточка |
| --- | --- | --- | --- | --- |
| PUBLIC-PAGES-20261005 | VERIFIED | Public GitHub + HTTPS Pages для оценки 3D/цены; формы демонстрационные | Check 43 unit/build, 30 HTTP 200, Chrome 2560/1536/390, GitHub built/public PASS | docs/checkpoints/PUBLIC-PAGES-20261005.md |
| PORTABLE-WINDOWS-20261005 | VERIFIED | Архив Windows x64: сайт, официальный Node, исходники/лицензии, START/LEADS | Standalone/build/worker, SHA 3602 файлов, PATH без Node, Chrome 1665/390, формы/цена/перезапуск PASS | docs/checkpoints/PORTABLE-WINDOWS-20261005.md |
| GITHUB-SAVE-20261005 | VERIFIED | Весь текущий сайт/изображения сохранены в private main; история восстановлена | Check 43 unit/build/worker, секреты/remote SHA/history PASS | docs/checkpoints/GITHUB-SAVE-20261005.md |
| UI-REMOVE-CONTACT-LINK | VERIFIED | Ссылка контактов основного сайта удалена | Build/типизация/worker, HTTP/контакты PASS | docs/checkpoints/UI-REMOVE-CONTACT-LINK.md |
| UI-RUBLE-PRICES | VERIFIED | Цена/ставка/серверная оценка RUB, фиксированная ставка 1250 ₽/ч | Check 43 unit/build/worker, Chrome четырёх ширин/пересчёт PASS | docs/checkpoints/UI-RUBLE-PRICES.md |
| UI-COMPACT-CONTACT-FIELDS | VERIFIED | Обе формы без видимых подписей/города, отдельные телефон/email | Check 43 unit/build/worker; Chrome пяти ширин, ошибка контакта и две заявки PASS | docs/checkpoints/UI-COMPACT-CONTACT-FIELDS.md |
| UI-PROJECT-PRICE | VERIFIED | Черновая цена по 15 $/ч, геометрия и выбранные разделы; Получить проект | Check: 41 unit/build/typecheck/worker; Chrome восьми ширин/пересчёт/серверная цена PASS | docs/checkpoints/UI-PROJECT-PRICE.md |
| UI-RESTORE-BOTTOM-FORM | VERIFIED | Прежние нижние контакты/форма, форма 3D сохранена | Check: 37 unit/build/typecheck/worker; Chrome шести ширин, раздельное согласие, обычная заявка PASS | docs/checkpoints/UI-RESTORE-BOTTOM-FORM.md |
| UI-INLINE-QUOTE-FORM | VERIFIED | Верхний блок удалён; 4/2/1 поля и одна кнопка отправки с текущей схемой | Check 37 unit/build/typecheck/worker; Chrome десяти ширин/варианты/валидация/синтетическая заявка PASS | docs/checkpoints/UI-INLINE-QUOTE-FORM.md |
| UI-SECTION-SPACING | VERIFIED | Вертикальные поля 32/24 px, промежутки 64/48 px | Build/TypeScript/worker, HTTP, Chrome шести ширин без overflow PASS | docs/checkpoints/UI-SECTION-SPACING.md |
| UI-UNIFORM-SOLUTIONS | VERIFIED | Одинаковые рамки C1–C8, меньше полей; блок −148 px на 1280 | Build/TypeScript/worker, HTTP, Chrome пяти ширин, целые схемы/без overflow/выбор C1 PASS | docs/checkpoints/UI-UNIFORM-SOLUTIONS.md |
| UI-COMPACT-ORDER-SOLUTIONS | VERIFIED | Компактная форма заказа первой; пояснения выбирают формы вместо отдельной строки кнопки | Build/TypeScript/worker, 37 unit, Chrome 390/900/1536, C1–C8, согласие/валидация/две локальные тестовые заявки/вложение PASS | docs/checkpoints/UI-COMPACT-ORDER-SOLUTIONS.md |
| UI-MOVE-PROCESS | VERIFIED | Процесс перенесён между составом документации и контактами | Build/TypeScript/worker, HTTP 200, Chrome 1536/390: порядок, один блок/четыре шага, overflow нет | docs/checkpoints/UI-MOVE-PROCESS.md |
| UI-GENERATED-MATERIALS | VERIFIED | Восемь собственных фотореалистичных генераций, блок авторов удалён | Визуальный просмотр, build/TypeScript/worker, HTTP главной/восьми PNG, SHA, Chrome 1536/390 без overflow | docs/checkpoints/UI-GENERATED-MATERIALS.md |
| UI-COMPACT-PORTFOLIO | VERIFIED | В портфолио под изображениями только названия и описания; убраны типы/номера/кнопки | Build/TypeScript/worker, HTTP 200, Chrome 1536/390: восемь карточек/изображений, текст 227 → 117 px, overflow нет | docs/checkpoints/UI-COMPACT-PORTFOLIO.md |
| UI-COMPACT-MATERIALS | VERIFIED | Убраны подписи фото/мелкие строки материалов, компактные отступы | Build/TypeScript/worker, HTTP 200, Chrome 1536/390: восемь карточек/девять фото, высота −80 px, overflow нет | docs/checkpoints/UI-COMPACT-MATERIALS.md |
| UI-REMOVE-SECTIONS | VERIFIED | Удалены услуги, инженерный подход, FAQ и пункт меню «Услуги» | Build/TypeScript/worker, HTTP 200, Chrome 1536/390: блоков нет, якоря корректны, overflow нет | docs/checkpoints/UI-REMOVE-SECTIONS.md |
| UI-MATERIAL-PHOTOS | VERIFIED | Настоящие фотографии во всех восьми карточках материалов, источники/лицензии | Build/TypeScript/worker, HTTP главной/семи JPEG, Chrome 390/1536: девять изображений, без overflow | docs/checkpoints/UI-MATERIAL-PHOTOS.md |
| UI-REMOVE-INTRO | VERIFIED | Удалён повторный вводный блок после 3D | Build/TypeScript/worker, HTTP 200, Chrome порядок разделов/390 px PASS | docs/checkpoints/UI-REMOVE-INTRO.md |
| UI-DESIGN-ONLY | VERIFIED | Сайт только о проектировании; выбор КМ, КМД, КЖ | check: 37 unit, TypeScript, build/worker; Chrome 390/900/1344, JSON/черновик/вложение/карточка PASS | docs/checkpoints/UI-DESIGN-ONLY.md |
| UI-PORTFOLIO-CONCEPTS | VERIFIED | Восемь концепций возможной реализации C1–C8 на сайте | Восемь PNG; build/TypeScript/worker; Chrome 390/900/1344, выбор C1–C8/изображения PASS | docs/checkpoints/UI-PORTFOLIO-CONCEPTS.md |
| UI-CALCULATOR-FIRST | VERIFIED | Конфигуратор первым под шапкой, новые заголовок/описание | Build/TypeScript/worker; Chrome 390/1024/1480, порядок/тексты/ввод/canvas PASS | docs/checkpoints/UI-CALCULATOR-FIRST.md |
| GITHUB-DELIVERY | VERIFIED | Исходники и история в GitHub private | History audit; push/main SHA; API visibility/default branch | docs/checkpoints/GITHUB-DELIVERY.md |
| UI-PRIMARY-ONLY | VERIFIED | Основная компоновка без ссылок сравнения | Build/worker; browser 390/1024/1920 без ссылок/overflow/pageerror | docs/checkpoints/UI-PRIMARY-ONLY.md |
| UI-SIMPLE-QUOTE | VERIFIED | Основная версия без деталей; запрос сохраняет конфигурацию | Build/worker; 5 quote + 5 overlay групп; JSON/draft/SQLite/CLI, 320–1920 | docs/checkpoints/UI-SIMPLE-QUOTE.md |
| UI-SERVICES-QUOTE | VERIFIED | Основная версия: работы рядом с получением расчёта | Build/worker; 5 overlay групп; 320/390/1024/1920, выбор/JSON/печать/ошибки | docs/checkpoints/UI-SERVICES-QUOTE.md |
| UI-PRIMARY-OVERLAY | VERIFIED | Основная / с overlay; проём без внутренней рамки/заливки | Build/worker; 5 overlay групп на /; стили/пересчёт 390/1024/1920, варианты HTTP 200 | docs/checkpoints/UI-PRIMARY-OVERLAY.md |
| UI-MEDIUM-OVERLAY | VERIFIED | /overlay: отдельная версия с панелями на 3D от 768 px | Build/worker; 5 overlay + 8 responsive групп; телефон идентичен /compact, Canvas/SVG/JSON/resize | docs/checkpoints/UI-MEDIUM-OVERLAY.md |
| UI-GALLERY-RADIOS | VERIFIED | /compact: варианты галереи радиокнопками | Build/worker; 8 responsive групп, 12 окон; C6 варианты/ведомость/клавиатура/JSON | docs/checkpoints/UI-GALLERY-RADIOS.md |
| UI-NARROW-PARAMETERS | VERIFIED | /compact: равная ширина накладных панелей 190 px | Build/worker; 8 responsive групп, 12 окон; C4/C8 ползунки/контуры и ширина 1280–2560 | docs/checkpoints/UI-NARROW-PARAMETERS.md |
| UI-EMPTY-DIMENSIONS | VERIFIED | /compact: размеры на свободную ширину, навес без стенового селектора | Build/worker; 8 responsive групп, 12 окон; C3/C7 232→128/85 px, возврат параметров без сброса | docs/checkpoints/UI-EMPTY-DIMENSIONS.md |
| UI-COMPLEX-DENSITY | VERIFIED | /compact: параметры C8 ниже на 29–40%, ползунки сохранены | Build/worker; browser 320/390/1024/1920, контуры/основания/JSON | docs/checkpoints/UI-COMPLEX-DENSITY.md |
| UI-PARAMETER-HEADING | VERIFIED | /compact: компактный заголовок параметров без разделителя | Build/worker; browser 390/1024/1920, C4/C8; высота C4 226/252 px | docs/checkpoints/UI-PARAMETER-HEADING.md |
| UI-SCENE-HEIGHT | VERIFIED | /compact: зона 3D ниже на 30% | Build/worker; 8 responsive + 5 compact групп, 12 окон с измерением 70%, C1–C8/resize/ракурсы/JSON/SVG | docs/checkpoints/UI-SCENE-HEIGHT.md |
| UI-REMOVE-SIZING-HINT | VERIFIED | Поясняющий абзац удалён из настроек | Build/worker; HTTP 200 и отсутствие текста на трёх вариантах | docs/checkpoints/UI-REMOVE-SIZING-HINT.md |
| UI-DENSE-OPTIONS | VERIFIED | /compact: гибкий ряд иконок, проём по умолчанию, плотные карточки и новый порядок | Build/worker; 8 responsive + 5 compact групп, 12 окон, default 179/188 м², JSON/resize/touch/SVG | docs/checkpoints/UI-DENSE-OPTIONS.md |
| UI-ADAPTIVE-SHAPES | VERIFIED | /compact: адаптивные карточки типов как у стен | Build/worker; 7 responsive групп, 12 окон, все типы/подписи видны, выбор C1–C8/touch/resize/JSON/SVG | docs/checkpoints/UI-ADAPTIVE-SHAPES.md |
| UI-CONTAINED-SCENE | VERIFIED | /compact в ширине сайта, ракурсы и каркас иконками на 3D | Typecheck/build; 7 responsive + 5 compact групп, 12 размеров, Canvas/SVG, клавиатура/touch/JSON/печать | docs/checkpoints/UI-CONTAINED-SCENE.md |
| UI-COMPACT-HEIGHTS | VERIFIED | /compact: крупные изображения на большом окне и плотные настройки на узких | Typecheck/build, 6 responsive + 5 compact групп; высоты C4 367/285/369 px, проём 144 px | docs/checkpoints/UI-COMPACT-HEIGHTS.md |
| UI-RESPONSIVE-LAYOUT | VERIFIED | Три компоновки /compact, свободная мобильная 3D, настройки под сценой и адаптация лендинга | Typecheck/build; 19 wide + 5 compact + 5 responsive групп, 12 размеров 320–2560 px, touch/resize/JSON/печать/SVG | docs/checkpoints/UI-RESPONSIVE-LAYOUT.md |
| UI-COMPACT-MATERIALS | VERIFIED | Отдельный /compact: маленькие карточки, работы под кровлей, пустая панель скрыта, непустая по содержимому | Typecheck/build; 19 групп wide + 5 compact, семь ширин, JSON/печать/SVG | docs/checkpoints/UI-COMPACT-MATERIALS.md |
| UI-WALL-MATERIAL | VERIFIED | M7 по умолчанию; стены через материал, каркас сохраняется; пункт C7 удалён, JSON совместим | Check: 34 unit/build; 19 групп browser, семь ширин, формы/JSON/SVG/API | docs/checkpoints/UI-WALL-MATERIAL.md |
| UI-NARROW-DIMENSIONS | VERIFIED | /wide: левая панель 190 px и компактные числовые поля по скриншоту | Build; 18 групп browser, семь ширин, ввод/иконки/камера/JSON/SVG | docs/checkpoints/UI-NARROW-DIMENSIONS.md |
| UI-CONTOUR-SLIDERS | VERIFIED | /wide: отступы и высоты трёх контуров C8 компактными ползунками с точным вводом | Typecheck/build; 18 групп browser, семь ширин, компактность/пересчёт/JSON/SVG | docs/checkpoints/UI-CONTOUR-SLIDERS.md |
| UI-ROUND-ROOF | VERIFIED | C7: купол/открытый контур через материал кровли, отдельный вариант удалён; совместимость JSON | Typecheck, 31 unit, build; 17 групп browser, семь ширин, старый/новый JSON, основной / и SVG | docs/checkpoints/UI-ROUND-ROOF.md |
| UI-ROOF-OPENING | VERIFIED | Кровля через карточки материала, обязательный навес без checkbox, проём ползунками на /wide | Typecheck, 30 unit, build; 16 групп browser, семь ширин, пересчёт/JSON/API/печать/2D | docs/checkpoints/UI-ROOF-OPENING.md |
| UI-CONSTRUCTION-ICONS | VERIFIED | /wide: сечение, два основания и стороны иконками 20×20; совместный выбор опоры и фермы; pile исключён | Типизация, 28 unit, сборка; 15 групп browser, семь ширин, JSON/API/печать/2D | docs/checkpoints/UI-CONSTRUCTION-ICONS.md |
| UI-SECTION-LAYERS | VERIFIED | /wide: шаг секций и целые слои ползунками рядом с размерами сверху слева | Типизация, сборка; 11 групп браузерных сценариев, семь ширин, пересчёт/JSON/печать/2D | docs/checkpoints/UI-SECTION-LAYERS.md |
| UI-ROOF-STRUCTURE | VERIFIED | /wide: отдельные ряды восьми материалов кровли и шести несущих систем под 3D | Типизация, сборка; 10 групп браузерных сценариев, семь ширин, JSON/печать/2D | docs/checkpoints/UI-ROOF-STRUCTURE.md |
| UI-MATERIAL-SLIDERS | VERIFIED | /wide: восемь картинок заполнения снизу, ползунки и точный ввод размеров сверху слева | Сборка; 7 групп браузерных сценариев, семь ширин, SVG/JSON/печать | docs/checkpoints/UI-MATERIAL-SLIDERS.md |
| UI-RIGHT-PANEL | VERIFIED | /wide без строки над сценой, постоянные настройки справа поверх 3D | Типизация, сборка, 6 групп браузерных сценариев и визуальный просмотр | docs/checkpoints/UI-RIGHT-PANEL.md |
| UI-FULL-WIDTH | VERIFIED | Дополнительный вариант /wide: карточки форм, полноширинная сцена прежней высоты, настройки поверх 3D | Сборка; 6 групп браузерных сценариев, пять ширин, JSON/печать/2D | docs/checkpoints/UI-FULL-WIDTH.md |
| B01.1 | VERIFIED | Отдельный проект, Git, lockfile, команды запуска, документация прогресса | Базовая страница собирается; корень проекта и команды записаны | docs/checkpoints/B01.1.md |
| B01.2 | VERIFIED | Типы конфигурации, каталог форм/материалов, данные topengineer.ru | Типизация; единый источник контактов и версия конфигурации | docs/checkpoints/B01.2.md |
| B02.1 | VERIFIED | Лендинг: первый экран, 8 карточек, материалы, услуги, процесс, FAQ, контакты | Браузерный SSR и якоря, визуальный просмотр | docs/checkpoints/B02.1.md |
| B02.2 | VERIFIED | Адаптивная форма и конфигуратор | 360/390/768/1280/1440, клавиатура, честные сообщения | docs/checkpoints/B02.2.md |
| B03.1 | VERIFIED | Runtime JSON-контракт, размеры, слои, проёмы | Unit: невалидные числа/версии/поля отклоняются | docs/checkpoints/B03.1.md |
| B03.2 | VERIFIED | C1–C2, секции и уникальные опоры | Unit: 12 секций/опор, переход 6→6,1 | docs/checkpoints/B03.2.md |
| B03.3 | VERIFIED | C3–C4, проёмы и отдельные слои | Unit: 188/179/376; проём свободен от стоек покрытия | docs/checkpoints/B03.3.md |
| B04.1 | VERIFIED | Lazy 3D, камера/виды, fallback | Браузер с отключённым WebGL сохраняет 2D и объёмы | docs/checkpoints/B04.1.md |
| B04.2 | VERIFIED | Элементы и рисунки заполнения C1–C4 | Три размера в unit-матрице, все материалы в браузере | docs/checkpoints/B04.2.md |
| B04.3 | VERIFIED | Пространственные опоры/фермы и крупный типовой вид | Четыре пояса и раскосы на гранях; сверка листов 7–8 портального PDF | docs/checkpoints/B04.3.md |
| B05.1 | VERIFIED | Пристенный экран и козырёк C5 | Независимые площади, варианты и примыкание к условной стене | docs/checkpoints/B05.1.md |
| B05.2 | VERIFIED | C8: объект и три независимых контура | Отступы от объекта, высоты, материалы, системы и основания | docs/checkpoints/B05.2.md |
| B05.3 | VERIFIED | C8: видимость, слои, размеры и ведомость | Скрытие не меняет заказ; исключение и отдельные слои меняют объёмы | docs/checkpoints/B05.3.md |
| B06.1 | VERIFIED | Контракт тарифов и чистый бюджетный движок без реальных ставок | Unit: версии, единицы, НДС, отсутствие обязательных ставок | docs/checkpoints/B06.1.md |
| B06.2 | WAITING_EXTERNAL | Коммерческое сопоставление ведомости и тарифов | Движок проверен; нужны утверждённые профили/массы/ставки и включённые работы | docs/checkpoints/B06.2.md |
| B06.3 | VERIFIED | Ручная оценка при отсутствии тарифов | Сумма null; в интерфейсе стоимость по запросу | docs/checkpoints/B06.3.md |
| B07.1 | VERIFIED | API, серверная проверка и SQLite | Сохранение до успеха; отказ БД даёт 503; сервер сам считает ведомость | docs/checkpoints/B07.1.md |
| B07.2 | VERIFIED | Согласие, idempotency, honeypot, origin и rate limit | 201/200/409/400/403/413/429; без согласия UI не отправляет | docs/checkpoints/B07.2.md |
| B07.3 | WAITING_EXTERNAL | Очередь и повторные попытки реализованы; получатель не подключён | Unit: сбой не теряет заявку; нужны утверждённый адрес/секрет и планировщик сервера | docs/checkpoints/B07.3.md |
| B08.1 | VERIFIED | Строгий JSON-импорт/экспорт без контактов | Браузерный roundtrip и отказ неизвестной версии | docs/checkpoints/B08.1.md |
| B08.2 | VERIFIED | Печатная карточка с контактом, датой, схемой и ведомостью | Визуальный просмотр и print-media; PDF через печать браузера | docs/checkpoints/B08.2.md |
| B08.3 | VERIFIED | Контент, локальные metadata и отключённый адаптер событий | Нет выдуманных кейсов, внешнего трекинга и ПД в событиях; noindex | docs/checkpoints/B08.3.md |
| B09.1 | VERIFIED | C6: портал, арка и канатный вариант | Площади по поверхности; условный свободный габарит проверен | docs/checkpoints/B09.1.md |
| B09.2 | VERIFIED | C7: круглый периметр и секторное шатровое покрытие | Три размера; независимая формула по граням, не сфера | docs/checkpoints/B09.2.md |
| B10.1 | VERIFIED | W1–W3 и крупные типовые схемы | Разные модули, количества/объёмы; детали явно условные | docs/checkpoints/B10.1.md |
| B10.2 | VERIFIED | Не включено в первый выпуск: загрузка файлов | Решение об объёме: нет upload endpoint; передача по корпоративному email | docs/checkpoints/B10.2.md |
| B11.1 | VERIFIED | Адаптация и доступность локального интерфейса | Пять ширин, ru, подписанные поля, keyboard, запятая и ошибки | docs/checkpoints/B11.1.md |
| B11.2 | VERIFIED | Инстансинг, demand-render, lazy и очистка ресурсов | 75 переключений; heap после GC: 10,59/10,79/11,02 МБ; GPU отдельно не измерен | docs/checkpoints/B11.2.md |
| B11.3 | VERIFIED | Отчёт A01–A24 и протокол восстановления | docs/QA.md фиксирует PASS и внешние ограничения; Git/backup проверяются отдельно | docs/checkpoints/B11.3.md |
| B12.1 | WAITING_EXTERNAL | Контакты сверены; оператор и правовые тексты не утверждены | HTTP 200; проекты документов; публичная форма заблокирована | docs/checkpoints/B12.1.md |
| B12.2 | WAITING_EXTERNAL | Инструкция размещения готова, сервер не предоставлен | Нужны домен, HTTPS, постоянная БД в РФ и служба/планировщик | docs/checkpoints/B12.2.md |
| B12.3 | WAITING_EXTERNAL | Локальный сайт передан; публичного размещения нет | Внешняя сквозная заявка возможна после B12.1–B12.2 | docs/checkpoints/B12.3.md |
