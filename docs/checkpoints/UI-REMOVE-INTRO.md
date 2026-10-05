# UI-REMOVE-INTRO

Статус: VERIFIED. Дата: 5 октября 2026, Europe/Belgrade.
Запрос: удалить выделенный на скриншоте вводный блок после конфигуратора.
База: UI-DESIGN-ONLY VERIFIED, локальный ZIP GitHub f447b0d без .git.
Резервная копия: .local/backups/before-remove-intro.
Файлы: components/landing/LandingPage.tsx; README, SPEC, STATUS, BLOCKS.
Критерии: секция hero с текстом/навесом удалена; #solutions сразу после
#calculator; единственный h1, конфигуратор, каталог и галерея сохранены.
Проверки: сборка/TypeScript, запуск и фактический порядок разделов в Chrome.
Следующий шаг: обратная связь пользователя.

Удалены только секция hero и создание её модели; compare с резервной
копией подтверждает две удалённые строки исходника, без иных правок.
README/SPEC отражают порядок #calculator → #solutions → #portfolio.
Проверки: npm.cmd run build exit 0, включая TypeScript/Next/worker;
HTTP главной 200; Chrome heroCount=0, один h1, восемь карточек решений,
правильный порядок трёх первых разделов, без overflow на компьютере/390 px.
Скриншот .local/qa/remove-intro.png. Размер окна Chrome восстановлен.
Сайт открыт; локальный preview PID 244664, http://127.0.0.1:3100.
