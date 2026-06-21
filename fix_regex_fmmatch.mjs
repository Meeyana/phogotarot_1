import fs from 'fs';
const file = 'd:/Tuan/phogotarot/cms-worker/worker.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const fmMatch = rawMarkdown\.match\(\/\^---\\n\(\[\\s\\S\]\*\?\)\\n---\\n\(\[\\s\\S\]\*\)\$\/\);/g, 'const fmMatch = rawMarkdown.match(/^---\\\\r?\\\\n([\\\\s\\\\S]*?)\\\\r?\\\\n---\\\\r?\\\\n([\\\\s\\\\S]*)$/);');

fs.writeFileSync(file, content, 'utf8');
