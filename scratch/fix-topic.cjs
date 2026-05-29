const fs = require('fs');
const path = 'd:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const buildConvPromptNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (buildConvPromptNode) {
    buildConvPromptNode.parameters.jsCode = buildConvPromptNode.parameters.jsCode.replace(
        "try { needs_image = $('Code in JavaScript').first().json.output.needs_image === true; } catch(e) { console.log(e); }",
        "let topic = 'general';\n  try { \n    needs_image = $('Code in JavaScript').first().json.output.needs_image === true;\n    topic = $('Code in JavaScript').first().json.output.topic || 'general';\n  } catch(e) { console.log(e); }"
    );
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Fixed missing topic declaration in build conversational prompt.');
