const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const {spawn} = require('node:child_process');
const root = __dirname;
const data = path.join(root, 'data');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;
function openBrowser(url) {
  // The URL is generated here from a checked numeric port, never user shell input.
  spawn(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', ['/d', '/c', 'start', '', url], {windowsHide:true, stdio:'ignore'}).on('error', () => console.log('Откройте этот адрес в браузере: ' + url));
}
async function available(port) {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}
async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Этот архив предназначен для Windows 64-бит.');
  fs.mkdirSync(data, {recursive:true});
  if (process.argv.includes('--leads')) {
    const file = path.join(data, 'leads.sqlite');
    if (!fs.existsSync(file)) { console.log('Заявок пока нет.'); return; }
    const {DatabaseSync} = require('node:sqlite');
    const db = new DatabaseSync(file, {readOnly:true});
    const rows = db.prepare('SELECT id,created_at,payload FROM leads ORDER BY created_at DESC').all();
    db.close();
    if (!rows.length) { console.log('Заявок пока нет.'); return; }
    const out = path.join(data, 'leads-' + new Date().toISOString().replace(/[:.]/g,'-') + '.json');
    fs.writeFileSync(out, JSON.stringify(rows.map(row=>({...row,payload:JSON.parse(row.payload)})),null,2), {flag:'wx'});
    console.table(rows.map(row=>{const value=JSON.parse(row.payload);return {Дата:row.created_at,Имя:value.name,Контакт:value.contact,Цена:value.summary?.amount == null ? '' : value.summary.amount + ' ' + value.summary.currency};}));
    console.log('Полные заявки и схемы сохранены в: ' + out);
    return;
  }
  const option = process.argv.find(arg=>arg.startsWith('--port='));
  const start = option ? Number(option.slice(7)) : 3100;
  if (!Number.isInteger(start) || start < 1024 || start > 65515) throw new Error('Неверный номер порта.');
  let port = start;
  while (!(await available(port))) { if (option || ++port >= start + 20) throw new Error('Не найден свободный порт. Закройте другую копию сайта и попробуйте снова.'); }
  const url = 'http://127.0.0.1:' + port;
  const env = {...process.env, NODE_ENV:'production', DATA_DIR:data, SITE_PUBLIC:'false', SITE_ORIGIN:url, TRUST_PROXY:'false', NOTIFICATION_WEBHOOK_URL:'', NOTIFICATION_WEBHOOK_TOKEN:'', NEXT_TELEMETRY_DISABLED:'1', NODE_OPTIONS:'', NODE_PATH:''};
  delete env.BUILD_PORTABLE;
  child = spawn(process.execPath, [path.join(root,'app','server.js')], {cwd:path.join(root,'app'),env:{...env,HOSTNAME:'127.0.0.1',PORT:String(port)},stdio:'inherit',windowsHide:true});
  child.once('error', error=>{console.error('Не удалось запустить сайт: ' + error.message);process.exitCode=1;});
  child.once('exit', code=>{process.exitCode=code || 0;});
  process.on('SIGINT', ()=>{child.kill();});
  process.on('SIGTERM', ()=>{child.kill();});
  for (let attempt=0;attempt<100;attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Сервер завершился. Проверьте сообщения выше.');
    try {
      if ((await fetch(url, {signal:AbortSignal.timeout(1000)})).ok) {
        console.log('\nСайт готов: ' + url + '\nОставьте это окно открытым. Для остановки нажмите Ctrl+C.\nЗаявки сохраняются в папке data. LEADS.cmd выгружает их в JSON.');
        if (!process.argv.includes('--no-browser')) openBrowser(url);
        return;
      }
    } catch {}
    await delay(200);
  }
  child.kill();
  throw new Error('Сайт не успел запуститься. Проверьте сообщения выше.');
}
main().catch(error=>{console.error(error.message);if(child)child.kill();process.exitCode=1;});
