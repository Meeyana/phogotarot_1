import fs from 'fs';
const file = 'd:/Tuan/phogotarot/cms-worker/worker.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('const { files, message } = body;', 'const { entries } = body;');
content = content.replace('for (const file of files) {', 'for (const entry of entries) {');
content = content.replace('const key = file.path;', 'const key = entry.key;');
content = content.replace('const rawMarkdown = file.content;', 'const rawMarkdown = entry.rawMarkdown;');

fs.writeFileSync(file, content, 'utf8');
console.log('Backend endpoint fixed to use entries');
