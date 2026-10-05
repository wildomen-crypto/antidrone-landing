# UI-PARAMETER-HEADING

Статус: VERIFIED. База f1cdb01; предыдущий проверенный код 298bcfd.
Ветка ui/plain-parameter-heading. Запрос: убрать разделитель и лишнюю
высоту заголовка параметров, оформить как «Размеры конструкции».
Область: текущий /compact. Файлы: app/responsive.css,
STATUS/BLOCKS/SPEC/QA и эта карточка. Логика и DOM не меняются.
Решение: без нижнего border заголовка, шрифт/line-height как у размеров;
сократить промежуток до полей, сохранив внешние отступы панели.
Критерии: border 0 на большом/среднем/телефоне, видимый заголовок,
меньшая высота, доступные параметры C4/C8, build и браузерный просмотр.
Результат: border-bottom 0; шрифт 11 px/line-height 1,3 как у размеров;
убран верхний padding полей. Заголовок и все настройки сохранены.
Build с типизацией/worker PASS. Браузерные 390/1024/1920: border 0,
шрифты совпадают, paddingTop 0; C4 проём и C8 контуры работают,
нет ошибок JS/overflow. C4 242→226,3 px на 390/1024 и 281→252,3 на 1920.
До/после .local/qa/parameter-heading-before.json и -after.json;
скриншот .local/qa/parameter-heading-1024.png просмотрен.
Полные browser/unit повторно не запускались для CSS заголовка.
HTTP /compact 200; PID 17256, скрытый production-процесс на порту 3100.
Код d0441aef40d2893dd13771e17eeae07a678a61c7 в main (fast-forward).
Ветка сохранена; ZIP/bundle parameter-heading-20261005-d0441ae проверены;
ZIP 154 записи без данных/секретов/runtime, bundle verify PASS.
Каталог C:\taran\artifacts\antidrone-landing-backups.
Следующий шаг: обратная связь заказчика.
