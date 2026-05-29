const fs = require('fs');
const path = 'd:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const buildConvPromptNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (buildConvPromptNode) {
    buildConvPromptNode.parameters.jsCode = buildConvPromptNode.parameters.jsCode.replace(
        "const cards = $('Check câu hỏi').first().json.body.cards || [];\n  let cardsSection = '';",
        "const cards = $('Check câu hỏi').first().json.body.cards || [];\n  let needs_image = false;\n  try { needs_image = $('Code in JavaScript').first().json.output.needs_image === true; } catch(e) { console.log(e); }\n  let cardsSection = '';"
    );
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Fixed tarot-validate-workflow.json successfully.');
