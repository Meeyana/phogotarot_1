import fs from 'fs';
const file = 'd:/Tuan/phogotarot/cms-worker/worker.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if \(!env\.SESSION\) throw new Error\("Chua c?u hình KV namespace SESSION"\);/g, 'if (!env.NUMEROLOGY_KV) throw new Error("Chua c?u hình KV namespace NUMEROLOGY_KV");');
// Also catch the ones without "KV namespace " or misspelled
content = content.replace(/if \(!env\.SESSION\)/g, 'if (!env.NUMEROLOGY_KV)');
content = content.replace(/KV namespace SESSION/g, 'KV namespace NUMEROLOGY_KV');

fs.writeFileSync(file, content, 'utf8');
