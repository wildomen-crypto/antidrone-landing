# Продолжение работы с другого компьютера

Все исходники, изображения, история изменений и инструкции находятся здесь:
https://github.com/wildomen-crypto/antidrone-landing

Готовый модуль Joomla 1.1.0 и его контрольная сумма:
https://github.com/wildomen-crypto/antidrone-landing/releases/tag/joomla-v1.1.0

Для просмотра без установки:
- обычная версия: https://wildomen-crypto.github.io/antidrone-landing/
- оформление Joomla: https://wildomen-crypto.github.io/antidrone-landing/joomla/

## Открыть исходники дома

На GitHub нажмите Code → Download ZIP, распакуйте архив и откройте папку
в Codex. Либо используйте Git:

```powershell
git clone https://github.com/wildomen-crypto/antidrone-landing.git
cd antidrone-landing
```

Если проект уже загружен на другом компьютере, сначала проверьте локальные
изменения и получите актуальную ветку main. Не перезаписывайте незавершённую работу.

Для локальной разработки нужен Node.js 24 или новее: https://nodejs.org/en/download.
В терминале из папки проекта выполните:

```powershell
npm.cmd ci
npm.cmd run dev
```

Откройте http://127.0.0.1:3100/. Вариант оформления Joomla доступен по
http://127.0.0.1:3100/joomla. Отправка через существующий сайт работает после
встраивания модуля на том же домене, где установлен его /upload.php.
Публичные GitHub Pages — демонстрация, их формы ничего не отправляют.

На macOS/Linux используйте npm вместо npm.cmd. Сборка установочного ZIP Joomla
пока рассчитана на Windows; готовый ZIP из Releases пересобирать для установки
не требуется. Полные команды проверки — README.md, `npm.cmd run check`.

## Установить версию Joomla

В Releases скачайте файл mod_antidrone_design-joomla-3.10.12-v1.1.0.zip.
Это готовый установочный пакет, его не нужно распаковывать перед загрузкой
в менеджер расширений Joomla. Не путайте с автоматически созданным Source code ZIP.
Инструкция внутри пакета: README.txt; подробности: docs/joomla.md.

Модуль рассчитан на Joomla 3.10.12 / yoo_monday, CMS в корне домена.
Существующий jQuery и /upload.php сайта отправляют заявки компании;
новый SMTP/получатель в модуле не нужны. Установка и фактическая доставка
на живом хостинге остаются проверкой администратора после установки.

## Что сообщить Codex дома

«Продолжаем проект antidrone-landing из этого репозитория. Прочитай AGENTS.md,
README.md, docs/STATUS.md, docs/HOME.md и docs/joomla.md. Проверь текущую ветку
и изменения. Последняя версия Joomla — 1.1.0, обе формы используют существующий
обработчик /upload.php сайта topengineer.ru. GitHub Pages — только демонстрация».

Локальные .env и настоящие заявки/БД не входят в публичный репозиторий.
Для собственной локальной настройки есть безопасный шаблон .env.example.
Последние выполненные проверки и ограничения записаны в docs/checkpoints.
