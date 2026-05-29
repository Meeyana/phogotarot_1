const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/api/tarot-interpret.ts';
let c = fs.readFileSync(p, 'utf8');

const targetStr = `const cardInfo = await db.prepare('SELECT upright_meaning, reversed_meaning FROM tarot_database WHERE card_name = ?').bind(card.name).first();
              if (cardInfo) {
                  card.meaning = card.isReversed ? cardInfo.reversed_meaning : cardInfo.upright_meaning;
              }`;

const replacementStr = `const cardInfo = await db.prepare(\`SELECT 
                    upright_meaning, reversed_meaning, image_description,
                    upright_keyword, reversed_keyword,
                    upright_love_keyword, reversed_love_keyword,
                    upright_career_keyword, reversed_career_keyword,
                    upright_finances_keyword, reversed_finances_keyword
                    FROM tarot_database WHERE card_name = ?\`).bind(card.name).first();
              if (cardInfo) {
                  card.meaning = card.isReversed ? cardInfo.reversed_meaning : cardInfo.upright_meaning;
                  if (cardInfo.image_description) {
                      card.description = cardInfo.image_description;
                  }
                  card.keyword = {
                      general: card.isReversed ? cardInfo.reversed_keyword : cardInfo.upright_keyword,
                      love: card.isReversed ? cardInfo.reversed_love_keyword : cardInfo.upright_love_keyword,
                      career: card.isReversed ? cardInfo.reversed_career_keyword : cardInfo.upright_career_keyword,
                      finances: card.isReversed ? cardInfo.reversed_finances_keyword : cardInfo.upright_finances_keyword
                  };
              }`;

c = c.replace(targetStr, replacementStr);
fs.writeFileSync(p, c);
console.log('patched interpret api');
