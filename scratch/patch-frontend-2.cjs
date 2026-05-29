const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/xem-tarot.astro';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/lastValidationModel = result\.model \|\| null;/g, 
  "lastValidationModel = result.model || null;\n                        localStorage.setItem('pending_topic', result.topic || 'general');");

// Clean up duplicate pending_topic if we accidentally double-replaced
c = c.replace(/(localStorage\.setItem\('pending_topic', result\.topic \|\| 'general'\);\s*){2,}/g, 
  "localStorage.setItem('pending_topic', result.topic || 'general');\n                        ");

fs.writeFileSync(p, c);
console.log('patched all occurrences');
