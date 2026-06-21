import fs from 'fs';
const file = 'd:/Tuan/phogotarot/src/utils/numerology-data.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\(env\.SESSION\)/g, '(env.NUMEROLOGY_KV)');

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced env.SESSION in numerology-data.ts');
