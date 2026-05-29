const fs = require('fs');
const path = 'd:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Update 'build check question prompt'
const buildCheckPromptNode = data.nodes.find(n => n.name === 'build check question prompt');
if (buildCheckPromptNode) {
    buildCheckPromptNode.parameters.jsCode = buildCheckPromptNode.parameters.jsCode.replace(
        'KHÔNG ĐƯỢC THIẾU PHẦN NÀY.\\n\\n## OUTPUT FORMAT (JSON ONLY - KHÔNG bọc block code):\\n{"isValid": true, "pick_card": true, "numbercard": 3, "reason": "ok"}`',
        'KHÔNG ĐƯỢC THIẾU PHẦN NÀY.\\n\\n4. ĐÁNH GIÁ INTENT HÌNH ẢNH (needs_image):\\n- Nếu người dùng trong tin nhắn mới nhất HỎI CỤ THỂ về "hình ảnh", "minh họa", "vẽ gì", "nhìn như thế nào", "ẩn dụ thị giác" của lá bài, hãy set "needs_image": true. Ngược lại set "needs_image": false.\\n\\n## OUTPUT FORMAT (JSON ONLY - KHÔNG bọc block code):\\n{"isValid": true, "pick_card": true, "numbercard": 3, "needs_image": false, "reason": "ok"}`'
    );
}

// 2. Update 'Code in JavaScript'
const codeInJsNode = data.nodes.find(n => n.name === 'Code in JavaScript');
if (codeInJsNode) {
    // Needs full replacement
    codeInJsNode.parameters.jsCode = `const items = $input.all();
const results = [];

for (const item of items) {
  const data = item.json;
  let isValid = false;
  let pick_card = false;
  let numbercard = 3;
  let needs_image = false;
  let reason = "Câu hỏi chưa rõ ràng hoặc không liên quan đến Tarot.";

  // 1. Trích xuất kết quả từ API
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

  // Loại bỏ markdown code block nếu có
  if (rawText.includes('\`\`\`')) {
    rawText = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
  }

  try {
    const parsed = JSON.parse(rawText);
    isValid = parsed.isValid;
    pick_card = parsed.pick_card;
    if (parsed.numbercard !== undefined) {
      numbercard = parseInt(parsed.numbercard) || 3;
    }
    if (parsed.needs_image !== undefined) {
      needs_image = Boolean(parsed.needs_image);
    }
    reason = parsed.reason || "ok";
  } catch (e) {
    // Fallback bằng Regex
    const lowerText = rawText.toLowerCase();
    if (lowerText.includes('"isvalid": true') || lowerText.includes('isvalid: true')) {
      isValid = true;
      if (lowerText.includes('"pick_card": true') || lowerText.includes('pick_card: true')) {
        pick_card = true;
      }
      if (lowerText.includes('"needs_image": true') || lowerText.includes('needs_image: true')) {
        needs_image = true;
      }
      const matchNum = rawText.match(/"numbercard"\\s*:\\s*(\\d+)/i) || rawText.match(/numbercard\\s*:\\s*(\\d+)/i);
      if (matchNum && matchNum[1]) {
        numbercard = parseInt(matchNum[1]) || 3;
      }
      reason = "ok";
    } else {
      isValid = false;
      const match = rawText.match(/"reason"\\s*:\\s*"([^"]+)"/i);
      if (match && match[1]) {
        reason = match[1];
      }
    }
  }

  // 2. Ép kiểu chuẩn
  if (typeof isValid === 'string') {
    isValid = (isValid.toLowerCase() === 'true');
  } else {
    isValid = Boolean(isValid);
  }

  if (typeof pick_card === 'string') {
    pick_card = (pick_card.toLowerCase() === 'true');
  } else {
    pick_card = Boolean(pick_card);
  }

  // 3. Chuẩn hóa giá trị
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
        "const cards = $('Check câu hỏi').first().json.body.cards || [];\\n  let cardsSection = '';",
        "const cards = $('Check câu hỏi').first().json.body.cards || [];\\n  const needs_image = $('Code in JavaScript').first().json.output.needs_image || false;\\n  let cardsSection = '';"
    ).replace(
        "if (c.description) info += ` (Hình ảnh: ${c.description})`;",
        "if (needs_image && c.description) info += ` (Hình ảnh: ${c.description})`;"
    );
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Patched tarot-validate-workflow.json successfully.');
