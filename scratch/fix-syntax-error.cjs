const fs = require('fs');

let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json';
let d = JSON.parse(fs.readFileSync(p, 'utf8'));

const n = d.nodes.find(n => n.name === 'build conversational prompt');

// Replace the literal \n characters with actual newlines in the string
n.parameters.jsCode = n.parameters.jsCode.replace(/\\n        else if/g, '\n        else if');
n.parameters.jsCode = n.parameters.jsCode.replace(/\\n        if \(needs_image/g, '\n        if (needs_image');

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log("Fixed syntax error in build conversational prompt");
