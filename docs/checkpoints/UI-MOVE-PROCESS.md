# UI-MOVE-PROCESS

Статус: VERIFIED. Дата: 5 октября 2026, Europe/Belgrade.
Запрос: перенести «Четыре шага к готовому проекту» между «Понятный состав
проекта» и «Обсудим конструкцию и состав работ».
База: UI-GENERATED-MATERIALS VERIFIED; локальный ZIP без .git.
Резервная копия: .local/backups/before-move-process.
Файлы: LandingPage.tsx, README, SPEC, STATUS, BLOCKS.
Критерий: materials → documents-section → process → contacts;
единственный блок процесса с четырьмя шагами, якоря сохранены.
Проверки: build/TypeScript, HTTP, Chrome 1536/390 px.
Выполненные проверки:
- npm run build PASS: Next, TypeScript и worker; главная HTTP 200.
- Chrome 1536/390 px: перед #process — «Понятный состав проекта»,
  после — #contacts; один блок процесса, четыре шага, overflow нет.
- Визуальный просмотр обеих ширин; скриншоты
  .local/qa/process-moved-desktop.png и process-moved-mobile.png.
Перестановка в общем шаблоне страницы; содержимое/якоря сохранены.
Preview http://127.0.0.1:3100/#process, PID 251392.
Внешней публикации нет. Следующий шаг: обратная связь пользователя.
