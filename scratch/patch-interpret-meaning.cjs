const fs = require('fs');

let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-interpret-workflow.json';
let d = JSON.parse(fs.readFileSync(p, 'utf8'));

const n = d.nodes.find(n => n.name === 'build interpretation prompt');

let code = n.parameters.jsCode;

const newCardTextLogic = `  const cardsText = cards.map(c => {
      let activeMeaning = c.meaning || 'Chưa có dữ liệu ý nghĩa';
      if (c.meanings && c.meanings[topic]) activeMeaning = c.meanings[topic];
      else if (c.meanings && c.meanings.general) activeMeaning = c.meanings.general;
      
      let info = \`- \${c.name} (\${c.orientation}): \${activeMeaning}\`;
      if (c.keyword && c.keyword[topic]) {
          info += \` (Từ khóa \${topic}: \${c.keyword[topic]})\`;
      } else if (c.keyword && c.keyword.general) {
          info += \` (Từ khóa chung: \${c.keyword.general})\`;
      }
      return info;
  }).join('\\n');`;

// Replace the old map block
code = code.replace(
/  const cardsText = cards\.map\(c => {[\s\S]*?\}\)\.join\('\\n'\);/g,
newCardTextLogic
);

n.parameters.jsCode = code;

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log("Patched interpret workflow meanings");
