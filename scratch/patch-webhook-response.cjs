const fs = require('fs');
let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-yes-no-question.json';
let d = JSON.parse(fs.readFileSync(p, 'utf8'));

let n = d.nodes.find(node => node.name === 'Respond to Webhook1');
n.parameters.responseBody = '={\n' +
  '  "interpretation": {{ JSON.stringify($(\'Luận giải AI API\').item.json.choices[0].message.content) }},\n' +
  '  "usage": {{ JSON.stringify($(\'Luận giải AI API\').item.json.usage) }},\n' +
  '  "model": {{ JSON.stringify($(\'Luận giải AI API\').item.json.model) }}\n' +
  '}';

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('Patched webhook response body');
