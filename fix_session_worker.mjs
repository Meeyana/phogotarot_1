import fs from 'fs';
const file = 'd:/Tuan/phogotarot/cms-worker/worker.js';
let content = fs.readFileSync(file, 'utf8');

// Replace env.SESSION with env.NUMEROLOGY_KV for numerology endpoints
content = content.replace(/if \(!env\.SESSION\) throw new Error\("Chua c?u hình (KV namespace |)SESSION( KV)?"\);/g, 'if (!env.NUMEROLOGY_KV) throw new Error("Chua c?u hình KV namespace NUMEROLOGY_KV");');
content = content.replace(/env\.SESSION\.put\(key,/g, 'env.NUMEROLOGY_KV.put(key,');
content = content.replace(/env\.SESSION\.get\('numerology:_index'/g, 'env.NUMEROLOGY_KV.get(\'numerology:_index\'');
content = content.replace(/env\.SESSION\.put\('numerology:_index'/g, 'env.NUMEROLOGY_KV.put(\'numerology:_index\'');
content = content.replace(/env\.SESSION\.list\(/g, 'env.NUMEROLOGY_KV.list(');
content = content.replace(/env\.SESSION\.get\(key,/g, 'env.NUMEROLOGY_KV.get(key,');

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced env.SESSION with env.NUMEROLOGY_KV in worker.js');
