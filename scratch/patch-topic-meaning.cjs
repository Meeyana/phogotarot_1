const fs = require('fs');

// Patch API files
function patchAPI(p) {
    let content = fs.readFileSync(p, 'utf8');

    // 1. Add fields to SELECT
    content = content.replace(
        "upright_finances_keyword, reversed_finances_keyword",
        "upright_finances_keyword, reversed_finances_keyword,\n                      upright_love_meaning, reversed_love_meaning,\n                      upright_career_meaning, reversed_career_meaning,\n                      upright_finances_meaning, reversed_finances_meaning"
    );

    // 2. Add card.meanings assignment
    const meaningAssignment = `card.meanings = {
                        general: isRev ? cardInfo.reversed_meaning : cardInfo.upright_meaning,
                        love: isRev ? cardInfo.reversed_love_meaning : cardInfo.upright_love_meaning,
                        career: isRev ? cardInfo.reversed_career_meaning : cardInfo.upright_career_meaning,
                        finances: isRev ? cardInfo.reversed_finances_meaning : cardInfo.upright_finances_meaning
                    };`;
                    
    content = content.replace(
        "card.meaning = isRev ? cardInfo.reversed_meaning : cardInfo.upright_meaning;",
        "card.meaning = isRev ? cardInfo.reversed_meaning : cardInfo.upright_meaning;\n                    " + meaningAssignment
    );

    fs.writeFileSync(p, content);
}

patchAPI('d:/Tuan/phogotarot/src/pages/api/tarot-validate.ts');
patchAPI('d:/Tuan/phogotarot/src/pages/api/tarot-interpret.ts');


// Patch workflow files
function patchWorkflow(p, nodeName) {
    let d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const n = d.nodes.find(n => n.name === nodeName);
    
    if (n) {
        let code = n.parameters.jsCode;
        
        // Find: if (c.meaning) info += `: ${c.meaning}`;
        // Replace with: if (c.meanings && c.meanings[topic]) info += `: ${c.meanings[topic]}`; else if (c.meanings && c.meanings.general) info += `: ${c.meanings.general}`; else if (c.meaning) info += `: ${c.meaning}`;
        
        code = code.replace(
            /if \(c\.meaning\) info \+= `:\s*\$\{c\.meaning\}`;/g,
            "if (c.meanings && c.meanings[topic]) info += `: ${c.meanings[topic]}`;\n        else if (c.meanings && c.meanings.general) info += `: ${c.meanings.general}`;\n        else if (c.meaning) info += `: ${c.meaning}`;"
        );
        
        n.parameters.jsCode = code;
        fs.writeFileSync(p, JSON.stringify(d, null, 2));
    }
}

patchWorkflow('d:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json', 'build conversational prompt');
patchWorkflow('d:/Tuan/phogotarot/n8n-workflow/tarot-interpret-workflow.json', 'build interpretation prompt');

console.log("Patched meaning extraction for all APIs and Workflows");
