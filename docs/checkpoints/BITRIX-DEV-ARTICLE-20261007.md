# BITRIX-DEV-ARTICLE-20261007 — VERIFIED

База c9e074a, ветка codex/bitrix-dev-article-20261007.
Поручение: разместить текущую промышленную статью на dev.topengineer.ru,
/proektirovanie/antidronovaya-zashchita/ через /local/include_dynamic/antidrin.php.
Шапку/подвал/шаблон/движок не менять, CSS изолирован в статье.
План: read-only аудит страницы/целевого include/форм, резерв целевого файла
вне webroot; отдельные ресурсы приложения и адаптер Битрикс. Локальная
проверка, PHP lint, публикация, Chrome desktop/mobile, валидация без реальных
заявок. Проверить hashes защищённых файлов до/после. Никаких изменений БД.
Найден корень /var/www/clients/client1/web1/web, PHP 8.3.35.
Include выполняется при замене ##ANTIDRIN## в OnEndBufferContent.
Native topengineer:request.form/send с signed MODE/CSRF и Service::validate.
Версия /app/bitrix не загружает Joomla CSS; родительский CSS только под
#te-antidrone-article. Боковая колонка сайта сохранена.
Typecheck и 61 unit PASS; build:bitrix 139 ресурсов. Локальный Chrome:
2560 и фактические 390, overflow 0; поля обязательны по native контракту;
белая сцена/возврат, длина 10→12 меняет 53 193→55 058 ₽. Обе формы
отправлены только в локальный mock; JSON/КМ/КМД/цена сохранены.
CLI Service::validate на сервере принял обе локальные формы без submit/CRM.
Опубликованы 139 ресурсов с проверкой SHA256 и атомарная замена include;
PHP lint PASS, права include web1/client1 0644 сохранены.
Backup: /var/www/clients/client1/web1/private/antidrone-backups/20261007-110334/antidrin-before.php.
Откат: вернуть этот файл в /var/www/clients/client1/web1/web/local/include_dynamic/antidrin.php
с владельцем web1/client1 и правами 0644. Статические ресурсы можно оставить:
без include они не подключаются. Не удалять другие каталоги сайта.
Live HTTP 200 без review-параметров; 76 HTML/CSS/JS/WebP ресурсов HTTP 200.
SHA256 всех 2401 защищённых файлов полностью совпадают до/после.
DOM-содержимое, атрибуты и ссылки header/footer совпали после нормализации
пробелов (до публикации HTML отдавался минифицированным).
Live IAB 2560/390: canvas работает при попадании сцены в область просмотра,
overflow статьи 0, формы с обязательными name/phone/email, без города.
Размер 10→12: 53 193→55 058 ₽; добавление КЖ: 72 763 ₽.
Переключение белого фона и возврат к непрозрачному графитовому градиенту PASS.
Портфолио и материалы открываются в штатном Magnific Popup родителя,
закрытие возвращает фокус. Проверки не отправляли реальные заявки в CRM.
Снимки и receipts: .local/bitrix-dev/live-desktop.png, live-mobile.png,
live-verification.txt, deployment.json, native-validation.txt.
Chrome использован локально; завершающие live проверки в IAB после
отключения соединения Chrome. Полный цикл CRM остаётся непроверенным.
