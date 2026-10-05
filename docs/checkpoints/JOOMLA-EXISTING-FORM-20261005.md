# JOOMLA-EXISTING-FORM-20261005 — VERIFIED

Исходная проверенная версия: main 5b6d237; ветка codex/joomla-existing-form.
Запрос: обе новые формы используют существующие скрипты и обработчик Joomla.
Прочитаны AGENTS, STATUS, BLOCKS, SPEC и docs/joomla.md.
Проверен публичный HTML и templates/yoo_monday/js/custom.js: jQuery.ajax GET
/upload.php, DATA[NAME], DATA[PHONE_WORK], DATA[EMAIL_WORK], DATA[COMMENTS],
files_data и submit. Настоящие заявки при исследовании не отправлялись.

Файлы: транспорт/мост Joomla, общая форма, PHP-вход/manifest/шаблон модуля,
документация, локальные проверки. Прежний com_ajax сохраняется для совместимости
со старым архивом; новый модуль по умолчанию использует существующую форму.
Критерии: поля/конфигурация/цена переданы без потерь, обе формы, отказ сервера,
повторы, same-origin, обычный Next API и GitHub demo сохранены. Check, PHP lint,
локальный браузер без отправки в компанию, новый ZIP, GitHub сохранение.
Результат: модуль 1.1.0 по умолчанию использует jQuery родительского сайта
и его /upload.php. Обе формы передают точные DATA[...] поля, параметризованную
схему JSON и рублёвую оценку; нижняя — контакты/описание без схемы.
Исходные формы не меняются; повтор custom.js и отдельные SMTP не требуются.

Выполнено: npm run check — 54 unit, типизация, production build/worker PASS.
PHP 7.4.33: lint трёх файлов; 17 контрольных примеров включая рендер нового
модуля без почтовых параметров и прежний официальный dispatcher 3.10.12 PASS.
Chrome локально: верхняя заявка email-only, длина 12/цена ≈ 55 058 ₽/JSON
в /upload.php; нижняя phone-only, HTTP 503, сохранение полей, успешный повтор,
сброс полей/согласия; мобильная отправка 390, overflow отсутствует PASS.
Реальные письма не отправлялись. Локальная имитация не гарантирует доставку
на живом хостинге: серверный PHP /upload.php и панель недоступны.

ZIP: C:\Users\student\Downloads\mod_antidrone_design-joomla-3.10.12-20261005-173520.zip.
94 файла, версия 1.1.0, 82 статических ресурса HTTP 200, закрытых данных 0.
SHA256 d430c4b9afd89201dd8d0fd9968116a3def2ddee4ec24ff9ddb728f7acaa6843.
Screenshot: .local/joomla-reference/existing-form-mobile.jpg — локальный стенд.
Обычный preview 3100 перезапущен, PID 292928; стенд 3152 PID 258456.
Следующий шаг: сохранить source/main и обновить демонстрацию GitHub Pages.
