const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/xem-tarot.astro';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
    'validationModel: lastValidationModel\n                      })',
    'validationModel: lastValidationModel,\n                          topic: topic\n                      })'
);

// We also need to get the topic from localStorage inside requestInterpretation
c = c.replace(
    'const response = await fetch(N8N_WEBHOOK_URL, {',
    "const topic = localStorage.getItem('pending_topic') || 'general';\n                  const response = await fetch(N8N_WEBHOOK_URL, {"
);

fs.writeFileSync(p, c);
console.log('Successfully patched UI payload');
