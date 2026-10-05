# Реестр блоков разработки

Рабочий реестр проекта C:\taran\antidrone-landing.
Состояния обновляются по результатам проверки каждого блока.
Выполнять в указанном порядке; сложные блоки делить с сохранением ID.
Незавершённый предыдущий блок восстановить до начала следующего.
Статусы: TODO, IN_PROGRESS, PAUSED, WAITING_EXTERNAL, VERIFIED.
B10.2 необязателен: решение об объёме записывается отдельно.

| ID | Статус | Результат | Проверка | Карточка |
| --- | --- | --- | --- | --- |
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
