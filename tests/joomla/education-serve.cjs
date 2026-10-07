// Local-only fixture using the real site's captured shell and styles.
// No forms, analytics or chat requests are forwarded to the company.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '../..');
const page = path.join(root, 'joomla/education-centre-2');
const shell = path.join(root, '.local/education-centre-2/host-before.html');
const types = { '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.html': 'text/html; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:3154');
    if (url.pathname === '/education-centr-2') {
      let host = fs.readFileSync(shell, 'utf8');
      const content = fs.readFileSync(path.join(page, 'joomla-ready.html'), 'utf8');
      host = host.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, '<main id="tm-content" class="tm-content">' + content + '</main>')
        .replace(/<base\s+href="[^"]*"\s*\/?\s*>/i, '<base href="http://127.0.0.1:3154/education-centr-2">')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<jdiv\b[^>]*>[\s\S]*?<\/jdiv>/gi, '');
      res.writeHead(200, { 'Content-Type': types['.html'] });
      res.end('<!DOCTYPE html>' + host);
      return;
    }
    if (url.pathname.startsWith('/media/education-centre-2/') || url.pathname.startsWith('/images/education-centre-2/')) {
      const relative = url.pathname.startsWith('/images/') ? '/assets/' + path.basename(url.pathname) : url.pathname.slice('/media/education-centre-2'.length);
      const file = path.resolve(page, '.' + relative);
      if (!file.startsWith(page + path.sep)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
      return;
    }
    if (['/contact', '/education-centr/revit/revit-single', '/education-centr/revit/revit-group',
      '/education-centr/ts/single', '/education-centr/ts/group', '/education-centr/rsa/single',
      '/education-centr/rsa/group', '/education-centr/scad-office/gruppovoj-kurs-scad-office',
      '/education-centr/obuchenie-proectirovaniu'].includes(url.pathname)) {
      res.writeHead(302, { Location: 'https://topengineer.ru' + url.pathname }); res.end(); return;
    }
    if (/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/i.test(url.pathname)) {
      const upstream = await fetch('https://topengineer.ru' + url.pathname);
      res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream' });
      res.end(Buffer.from(await upstream.arrayBuffer()));
      return;
    }
    res.writeHead(404); res.end('Local fixture: this request is not forwarded.');
  } catch (error) { res.writeHead(500); res.end('Fixture unavailable: ' + error.message); }
}).listen(3154, '127.0.0.1', () => console.log('Education fixture: http://127.0.0.1:3154/education-centr-2'));
