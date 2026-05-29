const fs = require('fs');

function patchFile(p) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Add isRev computation
    content = content.replace(
        "const cardInfo = await",
        "const isRev = card.isReversed !== undefined ? card.isReversed : (card.orientation === 'Ngược' || card.orientation === 'ngược');\n              const cardInfo = await"
    );
    
    // Replace card.isReversed with isRev in assignment
    content = content.replace(/card\.isReversed \? cardInfo\.reversed_meaning/g, "isRev ? cardInfo.reversed_meaning");
    content = content.replace(/card\.isReversed \? cardInfo\.reversed_keyword/g, "isRev ? cardInfo.reversed_keyword");
    content = content.replace(/card\.isReversed \? cardInfo\.reversed_love_keyword/g, "isRev ? cardInfo.reversed_love_keyword");
    content = content.replace(/card\.isReversed \? cardInfo\.reversed_career_keyword/g, "isRev ? cardInfo.reversed_career_keyword");
    content = content.replace(/card\.isReversed \? cardInfo\.reversed_finances_keyword/g, "isRev ? cardInfo.reversed_finances_keyword");
    
    // update the original card object so the downstream payload has the correct flag
    content = content.replace(
        "card.meaning =",
        "card.isReversed = isRev;\n                  card.meaning ="
    );

    fs.writeFileSync(p, content);
}

patchFile('d:/Tuan/phogotarot/src/pages/api/tarot-validate.ts');
patchFile('d:/Tuan/phogotarot/src/pages/api/tarot-interpret.ts');

console.log('Backend patched to robustly handle missing isReversed');
