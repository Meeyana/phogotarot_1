const fs = require('fs');

const tarotPath = 'D:\\Tuan\\phogotarot\\tarot.json';
const data = JSON.parse(fs.readFileSync(tarotPath, 'utf8'));

const convNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (convNode) {
  convNode.parameters.jsCode = convNode.parameters.jsCode.replace("item.json.bodyPayload = {", "item.json.conversationalPayload = {");
}

fs.writeFileSync(tarotPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully fixed conversationalPayload variable name');
