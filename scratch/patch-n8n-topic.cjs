const fs = require('fs');
const path = 'd:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Update 'build check question prompt'
const buildCheckPromptNode = data.nodes.find(n => n.name === 'build check question prompt');
if (buildCheckPromptNode) {
    buildCheckPromptNode.parameters.jsCode = buildCheckPromptNode.parameters.jsCode.replace(
        '4. ĐÁNH GIÁ INTENT HÌNH ẢNH (needs_image):',
        '4. ĐÁNH GIÁ INTENT CHỦ ĐỀ (topic):\\n- Phân loại câu hỏi thuộc chủ đề nào: "love" (tình cảm, người yêu, hôn nhân), "career" (công việc, học tập), "finances" (tiền bạc, đầu tư). Nếu không thuộc 3 chủ đề này, gán "topic": "general".\\n\\n5. ĐÁNH GIÁ INTENT HÌNH ẢNH (needs_image):'
    ).replace(
        '"needs_image": false, "reason": "ok"}`',
        '"topic": "love", "needs_image": false, "reason": "ok"}`'
    );
}

// 2. Update 'Code in JavaScript'
const codeInJsNode = data.nodes.find(n => n.name === 'Code in JavaScript');
if (codeInJsNode) {
    codeInJsNode.parameters.jsCode = `const items = $input.all();
const results = [];

for (const item of items) {
  const data = item.json;
  let isValid = false;
  let pick_card = false;
  let numbercard = 3;
  let needs_image = false;
  let topic = "general";
  let reason = "Câu hỏi chưa rõ ràng hoặc không liên quan đến Tarot.";

  let rawText = "";
  if (data.choices && data.choices[0] && data.choices[0].message) {
    rawText = data.choices[0].message.content || "";
  } else {
    rawText = data.output || data.text || "";
  }

  if (typeof rawText === 'object') {
    rawText = JSON.stringify(rawText);
  }
  rawText = rawText.trim();

  if (rawText.includes('\`\`\`')) {
    rawText = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
  }

  try {
    const parsed = JSON.parse(rawText);
    isValid = parsed.isValid;
    pick_card = parsed.pick_card;
    if (parsed.numbercard !== undefined) numbercard = parseInt(parsed.numbercard) || 3;
    if (parsed.needs_image !== undefined) needs_image = Boolean(parsed.needs_image);
    if (parsed.topic) topic = parsed.topic;
    reason = parsed.reason || "ok";
  } catch (e) {
    const lowerText = rawText.toLowerCase();
    if (lowerText.includes('"isvalid": true') || lowerText.includes('isvalid: true')) {
      isValid = true;
      if (lowerText.includes('"pick_card": true') || lowerText.includes('pick_card: true')) pick_card = true;
      if (lowerText.includes('"needs_image": true') || lowerText.includes('needs_image: true')) needs_image = true;
      
      if (lowerText.includes('"topic": "love"') || lowerText.includes('topic: "love"')) topic = "love";
      else if (lowerText.includes('"topic": "career"') || lowerText.includes('topic: "career"')) topic = "career";
      else if (lowerText.includes('"topic": "finances"') || lowerText.includes('topic: "finances"')) topic = "finances";

      const matchNum = rawText.match(/"numbercard"\\s*:\\s*(\\d+)/i) || rawText.match(/numbercard\\s*:\\s*(\\d+)/i);
      if (matchNum && matchNum[1]) numbercard = parseInt(matchNum[1]) || 3;
      reason = "ok";
    } else {
      isValid = false;
      const match = rawText.match(/"reason"\\s*:\\s*"([^"]+)"/i);
      if (match && match[1]) reason = match[1];
    }
  }

  if (typeof isValid === 'string') isValid = (isValid.toLowerCase() === 'true');
  else isValid = Boolean(isValid);

  if (typeof pick_card === 'string') pick_card = (pick_card.toLowerCase() === 'true');
  else pick_card = Boolean(pick_card);

  if (isValid && pick_card) {
    reason = "ok";
  } else if (!isValid && (!reason || reason === "ok" || reason === "undefined")) {
    reason = "Câu hỏi không phù hợp. Vui lòng đặt câu hỏi liên quan đến chủ đề Tarot.";
  }

  results.push({
    json: {
      output: {
        isValid: isValid,
        pick_card: pick_card,
        numbercard: numbercard,
        needs_image: needs_image,
        topic: topic,
        reason: reason,
        usage: data.usage || null,
        model: data.model || null
      }
    }
  });
}

return results;`;
}

// 3. Update 'build conversational prompt'
const buildConvPromptNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (buildConvPromptNode) {
    buildConvPromptNode.parameters.jsCode = buildConvPromptNode.parameters.jsCode.replace(
        "const cards = $('Check câu hỏi').first().json.body.cards || [];\\n  let needs_image = false;\\n  try { needs_image = $('Code in JavaScript').first().json.output.needs_image === true; } catch(e) { console.log(e); }\\n  let cardsSection = '';",
        "const cards = $('Check câu hỏi').first().json.body.cards || [];\\n  let needs_image = false;\\n  let topic = 'general';\\n  try { \\n    needs_image = $('Code in JavaScript').first().json.output.needs_image === true;\\n    topic = $('Code in JavaScript').first().json.output.topic || 'general';\\n  } catch(e) { console.log(e); }\\n  let cardsSection = '';"
    ).replace(
        "if (needs_image && c.description) info += ` (Hình ảnh: ${c.description})`;",
        "if (c.keyword && c.keyword[topic]) info += ` (Từ khóa ${topic}: ${c.keyword[topic]})`;\\n        else if (c.keyword && c.keyword.general) info += ` (Từ khóa chung: ${c.keyword.general})`;\\n        if (needs_image && c.description) info += ` (Hình ảnh: ${c.description})`;"
    );
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Patched tarot-validate-workflow.json with Topic Intent successfully.');
