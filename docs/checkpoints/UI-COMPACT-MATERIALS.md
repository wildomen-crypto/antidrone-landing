# UI-COMPACT-MATERIALS

Статус: VERIFIED. Дата: 5 октября 2026, Europe/Belgrade.
Запрос: удалить обведённые подписи под фото и мелкие строки внизу карточек
материалов, поскольку они занимают лишнее место по вертикали.
База: UI-REMOVE-SECTIONS VERIFIED; локальный ZIP без .git.
Резервная копия: .local/backups/before-compact-materials.
Файлы: Materials.tsx, material-photos.css, README, SPEC, STATUS, BLOCKS.
Результат: в карточках фото, название, короткое описание; компактные отступы.
Источники фото остаются в раскрываемом блоке; alt/названия ссылок сохранены.
Критерии: нет figcaption и small внутри карточек, восемь карточек и девять
фотографий сохранены; высота уменьшена; нет горизонтального переполнения.
Проверки: build/TypeScript, HTTP, Chrome компьютер/390 px.
Проверки выполнены:
- npm run build PASS: Next, TypeScript, worker; главная HTTP 200.
- Chrome 1536 px: высота карточек 357/377 → 278/297 px,
  секции 1134 → 975 px. Сняты figcaption и small, нет пустого места от них.
- Chrome 1536/390 px: восемь карточек, девять загруженных изображений,
  переполнения нет; блок источников, названия/описания/alt сохранены.
- Скриншоты .local/qa/compact-materials-desktop.png и compact-materials-mobile.png.
Preview http://127.0.0.1:3100/#materials, PID 224888.
Внешней публикации нет. Следующий шаг: обратная связь пользователя.
