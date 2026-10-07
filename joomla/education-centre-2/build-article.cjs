// Combine the readable source, scoped styles and two images into one Joomla article.
const fs = require('node:fs');
const path = require('node:path');
const page = __dirname;
let html = fs.readFileSync(path.join(page, 'article.html'), 'utf8');
html = html.replace(/<link[^>]+education\.css[^>]*>/,
  '<style>\n' + fs.readFileSync(path.join(page, 'education.css'), 'utf8') + '</style>');
for (const name of ['classroom', 'mentor']) {
  const image = fs.readFileSync(path.join(page, 'assets', name + '.webp'));
  html = html.replace('/media/education-centre-2/assets/' + name + '.webp',
    'data:image/webp;base64,' + image.toString('base64'));
}
fs.writeFileSync(path.join(page, 'joomla-ready.html'), html);
console.log('Joomla article prepared: ' + Buffer.byteLength(html) + ' bytes.');
