const fs = require('fs');
const file = 'd:/Tuan/phogotarot/n8n-workflow/tarot-yes-no-question.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const node = data.nodes.find(n => n.name === 'build interpretation prompt');
let code = node.parameters.jsCode;

code = code.replace('→ Kết thúc bằng 1–2 câu hỏi tự vấn`;', '→ Kết thúc bằng 1–2 câu hỏi tự vấn` + userInfoPrompt;');

node.parameters.jsCode = code;

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Fixed tarot-yes-no-question.json');
