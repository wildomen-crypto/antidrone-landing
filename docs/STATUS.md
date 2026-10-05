# Состояние разработки

Текущая работа: UI-PRIMARY-OVERLAY — VERIFIED; база 6132b99.
Ветка ui/primary-overlay-clean-opening; docs/checkpoints/UI-PRIMARY-OVERLAY.md.
Основная / с принятой overlay-компоновкой, проём без внутренней рамки/заливки.
Build/worker и 5 overlay групп на главной PASS; 390/1024/1920:
граница 0, прозрачный фон, padding 0, ползунки/ведомость работают.
Предыдущие варианты доступны, /classic сохраняет боковой интерфейс.
Ошибок JS нет; панель 1920 просмотрена.
Код 562c23abdce543ffee31aa0cc6d7094d22232c2e в main (fast-forward).
ZIP/bundle primary-overlay-20261005-562c23a проверены: 166 записей,
без данных/секретов/runtime, bundle verify PASS. Сервер PID 26512.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-MEDIUM-OVERLAY — VERIFIED; база a107d34.
Ветка ui/medium-overlay-preview; docs/checkpoints/UI-MEDIUM-OVERLAY.md.
Отдельный /overlay: панели поверх сцены от 768 px, телефон как /compact.
Build/worker PASS; 5 overlay и 8 responsive групп PASS.
Панели 190 px на 768–2560 и 844×390; все C1–C8/камера/JSON работают.
Телефон C3/C4/C6/C8 совпадает с /compact на 320/390/600/767 px.
Нет overflow/ошибок JS; 800/1024 просмотрены, /compact сохранён.
Код 61fb7dbb13099fe05457019b3cd54ed74711af47 в main (fast-forward).
ZIP/bundle medium-overlay-20261005-61fb7db проверены: 163 записи,
без данных/секретов/runtime, bundle verify PASS. Сервер PID 28856, HTTP 200.
Следующий шаг: сравнение вариантов заказчиком.

Предыдущая работа: UI-GALLERY-RADIOS — VERIFIED; база b8f92c4.
Ветка ui/gallery-variant-radios; docs/checkpoints/UI-GALLERY-RADIOS.md.
Варианты галереи радиокнопками, все три подписи сразу видны.
Build/worker и 8 responsive групп PASS на 12 окнах; профильные 5 окон:
выбор/клавиатура, пересчёт ведомости, подъём, resize и JSON работают.
Нет переполнения/ошибок JS, 1920 и мобильная панель просмотрены.
Код 4729b5a4f5a399e14d0c37fb1e1d0e87d8304d3f в main (fast-forward).
ZIP/bundle gallery-radios-20261005-4729b5a проверены: 158 записей,
без данных/секретов/runtime, bundle verify PASS. Сервер PID 29620, HTTP 200.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-NARROW-PARAMETERS — VERIFIED; база 8167569.
Ветка ui/narrow-parameter-panel; docs/checkpoints/UI-NARROW-PARAMETERS.md.
Обе панели ровно 190 px на больших окнах 1280–2560 px.
Build/worker и 8 responsive групп PASS на 12 окнах.
Поля/подписи C1/C2/C4/C5/C6/C8 без переполнения; ползунки проёма/контуров
и дополнительные настройки работают; C4/C8 1920 просмотрены.
Средние/малые/короткие окна сохраняют прежнюю адаптивную ширину.
Код 24995cd340be8d5555f81a5075f2f1f85ee6e95e в main (fast-forward).
ZIP/bundle narrow-parameters-20261005-24995cd проверены, ZIP 157 записей
без данных/секретов/runtime; bundle verify PASS. Сервер PID 28192.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-EMPTY-DIMENSIONS — VERIFIED; база 709f5ff.
Ветка ui/full-width-empty-dimensions; docs/checkpoints/UI-EMPTY-DIMENSIONS.md.
Размеры на свободную ширину без параметров; у навеса скрыть стеновой ряд.
Build с типизацией/worker; 8 responsive групп PASS на 12 окнах.
C3/C7 занимают всю среднюю ширину; высота 232→128 px на 768,
232→85 px на 1024; 316→228 px на телефоне 390. Стены навеса скрыты,
кровля доступна; комбинация возвращает параметры без сброса размеров.
Скриншоты 768/1024 просмотрены. Код fd9f5b880f7e9ebfad7472d0f2a99b93605aa673
в main (fast-forward); ZIP/bundle empty-dimensions-20261005-fd9f5b8 проверены.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-COMPLEX-DENSITY — VERIFIED; база 1adfd86.
Ветка ui/dense-complex-parameters; docs/checkpoints/UI-COMPLEX-DENSITY.md.
Параметры C8 ниже на 29–40%: полная высота 361–364 px вместо 507–606.
Build/worker PASS; browser 320/390/1024/1920, контуры/основания/JSON PASS.
Код 709f5ff в main, включён в общий ZIP/bundle empty-dimensions-20261005-fd9f5b8.

Предыдущая работа: UI-PARAMETER-HEADING — VERIFIED; база f1cdb01.
Ветка ui/plain-parameter-heading; docs/checkpoints/UI-PARAMETER-HEADING.md.
Заголовок параметров без разделителя, компактно как у размеров.
Build с типизацией/worker PASS; браузерные 390/1024/1920 PASS.
Высота C4 242→226,3 px на узком, 281→252,3 px на большом.
Разделитель отсутствует, шрифт как у размеров, C4/C8 работают, ошибок JS нет.
Скриншот 1024 просмотрен. Код d0441aef40d2893dd13771e17eeae07a678a61c7
в main (fast-forward), ZIP/bundle parameter-heading-20261005-d0441ae проверены.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-SCENE-HEIGHT — VERIFIED; база e8c04da.
Ветка ui/scene-height-70pct; docs/checkpoints/UI-SCENE-HEIGHT.md.
Высота 3D /compact 70% прежней во всех компоновках.
Build с типизацией/worker; 8 responsive + 5 compact групп PASS.
12 окон: измеренная высота 70% прежней; 390: 400→280 px,
1024: 384→268,8 px, 1920: 604,8→423,4 px. C1–C8/resize/ракурсы/JSON/SVG
работают; 390/1024/1920 просмотрены.
Код 298bcfd57ac3174803d999829f5741b153cfb3d6 в main (fast-forward).
ZIP/bundle scene-height-20261005-298bcfd проверены.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-REMOVE-SIZING-HINT — VERIFIED; база b858928.
Ветка ui/remove-sizing-hint; docs/checkpoints/UI-REMOVE-SIZING-HINT.md.
Поясняющий абзац удалён из настроек без пустого блока.
Build с типизацией/worker PASS; HTTP 200 и отсутствие текста на /compact,
/wide и /. Код a44b6cb00138e270f91f39848e1e52a0a5e408e1 в main.
ZIP/bundle remove-sizing-hint-20261005-a44b6cb проверены.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-DENSE-OPTIONS — VERIFIED; база e712159.
Ветка ui/dense-options-default-opening; docs/checkpoints/UI-DENSE-OPTIONS.md.
Группы иконок в гибкий ряд, проём по умолчанию, плотные карточки,
несущие выше стен. Build с типизацией/worker PASS; 8 responsive + 5 compact
групп PASS, 12 окон. C4 размеры 232 px средний / 316 px телефон 390.
Default проём 179 м², отключённый 188 м²; JSON сохраняет выбор.
Скриншоты 390/1100/1920 просмотрены.
Код acd79341c1f3273da059c7363d1f590bbe646706 в main (fast-forward).
ZIP/bundle dense-options-20261005-acd7934 проверены.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-ADAPTIVE-SHAPES — VERIFIED; база e37fc1b.
Ветка ui/adaptive-shape-cards; docs/checkpoints/UI-ADAPTIVE-SHAPES.md.
Карточки типов конструкций на узких окнах адаптируются как заполнение стен.
Build с типизацией/worker и 7 responsive групп PASS, 12 окон 320–2560 px.
Рисунки 32 px на узких окнах; все типы видны, сетка как у стен.
Выбор C1–C8, touch, resize, JSON/печать/SVG PASS; 390/1024/1920 просмотрены.
Код ea2871dbc6006af3a835fc6e0e5172f5aeff7907 в main (fast-forward).
ZIP/bundle adaptive-shapes-20261005-ea2871d проверены.
Следующий шаг: обратная связь заказчика.

Предыдущая работа: UI-CONTAINED-SCENE — VERIFIED; база 3960811.
Ветка ui/contained-scene-icons; docs/checkpoints/UI-CONTAINED-SCENE.md.
3D по ширине контейнера сайта, ракурсы и каркас иконками на сцене.
Typecheck/build/worker PASS; responsive 7 + compact 5 групп PASS.
12 размеров 320–2560 px, Canvas/SVG, ракурсы/каркас, touch/клавиатура,
resize/JSON/печать; скриншоты 390/1024/1920 просмотрены.
Код 34ce5b6458e34a78e75811045ebd5ce48e357b56 в main (fast-forward).
ZIP/bundle contained-scene-20261005-34ce5b6 проверены.
Следующий шаг: обратная связь заказчика.


Предыдущая работа: UI-COMPACT-HEIGHTS — VERIFIED; база 17f18aa.
Ветка ui/compact-control-heights; docs/checkpoints/UI-COMPACT-HEIGHTS.md.
Крупные картинки на большом окне, компактная высота настроек на узких.
Typecheck/build PASS; responsive 6 + compact 5 групп PASS, 12 размеров.
Размеры C4: 367 px большой / 285 px средний / 369 px телефон; проём 144 px.
Следующий шаг: обратная связь заказчика.
Код 43a5527 в main; ZIP/bundle compact-heights-20261004-43a5527 проверены.


Предыдущая работа: UI-RESPONSIVE-LAYOUT — VERIFIED; база eff473a.
Ветка ui/responsive-layout; карточка docs/checkpoints/UI-RESPONSIVE-LAYOUT.md.
Три компоновки /compact; 12 размеров 320–2560 px, включая низкое окно.
Typecheck/build/worker PASS; 19 wide + 5 compact + 5 responsive групп PASS.
Все формы, ввод/resize, JSON/печать/SVG, touch-эмуляция, без ошибок JS.
Следующий шаг: обратная связь заказчика по адаптивному варианту.
Код 5a5b0f1 в main, ZIP/bundle responsive-layout-20261004-5a5b0f1 проверены.

Предыдущая работа: UI-COMPACT-MATERIALS — VERIFIED; база eca536b.
Ветка ui/compact-material-layout; карточка docs/checkpoints/UI-COMPACT-MATERIALS.md.
Новый /compact: маленькие карточки, работы ниже кровли, пустая панель скрыта.
Typecheck/build PASS; 19 групп test:wide и 5 test:compact PASS.
Семь ширин; ряды материалов 103,5 px вместо 165–174 px, JSON/печать/SVG.

Предыдущая работа: UI-WALL-MATERIAL — VERIFIED; база 7a32257.
Ветка ui/wall-material-toggle; карточка docs/checkpoints/UI-WALL-MATERIAL.md.
M7 по умолчанию; стены включаются/отключаются выбором материала.
Check: 34 unit, типизация/build; 19 групп browser PASS, семь ширин, JSON/SVG.
Следующий запрос: отдельная компактная версия, работы ниже материалов.

Предыдущая работа: UI-NARROW-DIMENSIONS — VERIFIED; база 6baba4c.
Ветка ui/narrow-dimension-panel; карточка docs/checkpoints/UI-NARROW-DIMENSIONS.md.
Левая панель размеров — 190 px, поля — 32/40 px, как в скриншоте заказчика.
Build и 18 групп browser PASS; семь ширин, ввод/камера/JSON/SVG.

Предыдущая работа: UI-CONTOUR-SLIDERS — VERIFIED; база bb89049.
Ветка ui/contour-dimension-sliders; карточка docs/checkpoints/UI-CONTOUR-SLIDERS.md.
Отступы и высоты контуров C8 на /wide — компактные ползунки с точным вводом.
Typecheck, build, 18 групп browser PASS; семь ширин, пересчёт/JSON/SVG.

Предыдущая работа: UI-ROUND-ROOF — VERIFIED; база 306fc17.
Ветка ui/round-roof-control; карточка docs/checkpoints/UI-ROUND-ROOF.md.
Дублирующий переключатель C7 удалён; форма управляется материалом кровли.
Typecheck, 31 unit, build, 17 групп browser PASS; семь ширин, JSON и SVG.

Предыдущая работа: UI-ROOF-OPENING — VERIFIED; база 1a8858e.
Ветка ui/roof-toggle-opening-sliders; карточка docs/checkpoints/UI-ROOF-OPENING.md.
Обязательная кровля навеса, отключение кровли через карточки материала,
размеры активного проёма ползунками на /wide.
Typecheck, 30 unit, build и 16 групп browser PASS; семь ширин.

Предыдущая работа: UI-CONSTRUCTION-ICONS — VERIFIED; база 540e527.
Ветка ui/compact-construction-icons; карточка docs/checkpoints/UI-CONSTRUCTION-ICONS.md.
Сечение, основания и стороны переносятся иконками под размеры;
опоры и ферма выбираются вместе, сваи без ростверка исключены из выбора/импорта.
Проверки: типизация, 28 unit, сборка и 15 групп browser PASS, семь ширин.

Предыдущая работа: UI-SECTION-LAYERS — VERIFIED; база f213507.
Ветка ui/section-layer-sliders; карточка docs/checkpoints/UI-SECTION-LAYERS.md.
На /wide шаг секции и количество слоёв — ползунки в левой панели размеров.
Справа глобальные поля убраны; независимые слои контуров сохранены.
Типизация, сборка и 11 групп браузерных сценариев PASS; семь ширин.

Предыдущая работа: UI-ROOF-STRUCTURE — VERIFIED; база 6c37af7.
Ветка ui/roof-and-structure-cards; карточка docs/checkpoints/UI-ROOF-STRUCTURE.md.
На /wide под сценой отдельные ряды: стены (8 картинок), кровля (8),
несущие элементы (6). Кровля и стены независимы; остальные настройки справа.
Проверка: типизация, сборка и 10 групп браузерных сценариев, семь ширин.

Предыдущая правка: UI-MATERIAL-SLIDERS — VERIFIED; база 124f369.
Карточка: docs/checkpoints/UI-MATERIAL-SLIDERS.md.
На /wide заполнение стен выбирается по восьми картинкам непосредственно
под 3D. Размеры — ползунки и точный ввод сверху слева поверх сцены.
Остальные настройки постоянно справа. Камера учитывает обе панели.
Высота и ширина сохранены; основной лендинг / сохранён.
Проверка: 7 групп сценариев, семь ширин.

Обновлено: 5 октября 2026 года, Europe/Moscow.
Корень: C:\taran\antidrone-landing.
Локальный выпуск: VERIFIED. Публичное размещение: WAITING_EXTERNAL.
Основная ветка продолжения: main; сохранена delivery/local-site.
Последний проверенный функциональный код: f03a175d1bdd574f708300ca495682f12d1a8a3d.
Рабочие ветки ui/wall-material-toggle и ui/compact-material-layout сохранены;
main обновлён fast-forward.
Базовый проверенный функциональный код: f67f7c9836d1e7a46f4e5926261cfa2d5b9f1914.
Исходный main a3fda4b и промежуточный 487a69e остаются в истории.
Карточка выпуска: docs/checkpoints/LOCAL-DELIVERY.md.

## Результат

Готов локальный лендинг: C1–C8 с вариантами, M1–M8, параметрический
3D/2D, камера и размеры, независимые контуры, пространственные элементы,
основания, стеновые модули, ведомость, ручная стоимость, JSON и печать.
Серверная форма записывает заявку и outbox в SQLite до подтверждения.
Есть idempotency, согласие, origin/honeypot/лимит, CLI и резервирование БД.
Контакты повторно сверены с topengineer.ru/contact. Аналитика выключена.

Реестр: 53 VERIFIED (включая двадцать шесть правок UI и решение не включать upload),
5 WAITING_EXTERNAL. Коммерческая готовность не объявлена.

## Проверки

- npm ci: 48 пакетов по lockfile, успешно.
- npm run check: типизация, 25 unit-тестов, Next build и worker успешно.
- npm run test:browser: 16 сквозных сценариев успешно.
- Ширины 360/390/768/1280/1440: без overflow и ошибок JavaScript.
- Все формы/варианты/материалы, проёмы, слои, контуры, JSON и печать.
- API: сохранение/повтор, конфликт, согласие, ошибочные данные, origin,
  большой запрос, rate limit, отказ БД и публичная блокировка.
- 75 переключений: JS heap после GC 10,59/10,79/11,02 МБ; ошибок нет.
- Без WebGL: SVG, виды, ведомость и запрос предложения работают.
- SQLite backup прочитан отдельно; integrity_check=ok.
- Контакты: источник HTTP 200; телефоны/email/ИНН совпадают.
- Скриншоты просмотрены; источник контрольного примера исправлен 14→12.

Подробности: docs/QA.md; машинный отчёт .local/qa/browser-report.json.
Синтетические QA-заявки удалены по своим ID; в локальной базе 0 заявок.

## Работающий просмотр

http://127.0.0.1:3100 — production build, только этот компьютер.
Новый вариант: http://127.0.0.1:3100/wide#calculator.
Адаптивная версия: http://127.0.0.1:3100/compact#calculator.
PID 29296, скрытый фоновый процесс; логи .local/preview.stdout.log и
.local/preview.stderr.log. Проверять фактический порт и CommandLine
перед остановкой; не останавливать чужие процессы. После перезапуска
компьютера: npm.cmd run start из корня проекта.

Git: локальная настройка Dmitrii Taran,
260888110+wildomen-crypto@users.noreply.github.com. Публикации GitHub,
внешнего хостинга и реальных уведомлений не было.

## Резервные копии

Каталог C:\taran\artifacts\antidrone-landing-backups.
Свободная ширина размеров/плотные контуры: empty-dimensions-20261005-fd9f5b8
-source.zip и .bundle; bundle verify PASS, ZIP 156 записей без данных/
секретов/runtime, .env.example — пустые значения/false. Содержит C8 709f5ff.
Заголовок параметров: parameter-heading-20261005-d0441ae-source.zip и
.bundle; bundle verify PASS, ZIP 154 записи без данных/секретов/runtime.
Шаблон .env.example содержит пустые значения/false.
Высота сцены: scene-height-20261005-298bcfd-source.zip и .bundle;
bundle verify PASS, ZIP 153 записи без данных/секретов/runtime.
Шаблон .env.example содержит пустые значения/false.
Удаление пояснения: remove-sizing-hint-20261005-a44b6cb-source.zip и
.bundle; bundle verify PASS, ZIP 152 записи без данных/секретов/runtime.
Шаблон .env.example содержит пустые значения/false.
Плотные настройки/проём: dense-options-20261005-acd7934-source.zip и
.bundle; bundle verify PASS, ZIP 151 запись без данных/секретов/runtime.
Шаблон .env.example содержит пустые значения/false.
Адаптивные типы: adaptive-shapes-20261005-ea2871d-source.zip и .bundle;
bundle verify PASS, ZIP 150 записей, без данных/секретов/runtime.
Шаблон .env.example содержит пустые значения/false.
Ширина сцены и ракурсы: contained-scene-20261005-34ce5b6-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы;
шаблон .env.example содержит пустые значения/false, без секретов.
Компактные материалы: compact-materials-20261004-f03a175-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP проверен, 143 записи.
Заполнение стен: wall-material-20261004-eca536b-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP проверен, 139 записей.
Оба ZIP — только tracked-файлы, без данных/секретов; пустой .env.example допустим.
Узкая панель: narrow-dimensions-20261004-268edc9-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы,
137 записей; нет данных/секретов, допустим пустой .env.example.
Размеры контуров: contour-sliders-20261004-4b512b3-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы,
136 записей; нет данных/секретов, допустим пустой .env.example.
Круглый контур/купол: round-roof-20261004-5025b7b-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы;
данные/секреты исключены, пустой шаблон .env.example допустим.
Кровля и проём: roof-opening-20261004-74b6808-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы.
Иконки конструкции: construction-icons-20261004-697909a-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы.
Шаг и слои: section-layers-20261004-0d77ea6-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы.
Кровля и каркас: roof-structure-20261004-9bc3eb2-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы.
Материалы и ползунки: material-sliders-20261004-b49e1c3-source.zip
и одноимённый .bundle; bundle verify PASS. ZIP — только tracked-файлы.
Постоянная правая панель: right-panel-20261003-9739aa3-source.zip и
одноимённый .bundle; bundle verify PASS. ZIP содержит только tracked-файлы.
Широкий вариант: wide-configurator-20261003-5f6f35d-source.zip,
одноимённый .bundle и -manifest.json. Bundle проверен; ZIP проверен
на отсутствие данных, секретов и служебных каталогов, SHA256 записаны.
Новый выпуск: local-site-20261003-f67f7c9-source.zip и одноимённый Git bundle.
manifest содержит фактический SHA архива, Git revision и проверку восстановления.
В архивы кода не включены заявки, .env, node_modules и .next.
Данные и секреты резервируются отдельно по docs/OPERATIONS.md.

## Точный следующий шаг

Новый вариант готов для сравнения; следующий шаг по интерфейсу —
обратная связь заказчика. Не переписывать готовый локальный сайт.
Для публичного запуска нужны:

1. Оператор формы и утверждение политики/отдельного согласия.
2. Домен, сервер с Node 24, HTTPS и постоянная частная БД в РФ.
3. Получатель уведомлений и серверный планировщик worker.
4. Утверждённые профили/тарифы для коммерческой калькуляции, если она нужна;
   до этого сохранять корректный режим стоимости по запросу.

Карточки B06.2, B07.3, B12.1–B12.3 подробно фиксируют зависимости.
Локальные инструкции: README.md. Публичное размещение: docs/OPERATIONS.md.
Safari/iOS, Android, Firefox и внешний HTTPS пока не проверены.
Сечения, основания и узлы условны; инженерные расчёты не выполнены.

## После обрыва или лимита

Прочитать этот файл, BLOCKS, LOCAL-DELIVERY, git status и журнал коммитов.
Все завершённые участки сохранены. Не удалять проект и не применять reset --hard.
Запускать имеющуюся версию; продолжать только нужную внешнюю карточку или
явно запрошенную правку. Неподтверждённые данные не заменять вымышленными.
