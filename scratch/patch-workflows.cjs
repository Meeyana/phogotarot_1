const fs = require('fs');
let p = 'n8n-workflow/tarot-validate-workflow.json';
let d = fs.readFileSync(p, 'utf8');

// Update respond to Webhook and Respond to Webhook1
d = d.replace(/"model": \{\{ JSON.stringify\(\$\('Conversational AI API'\).item.json.model\) \}\}/g, 
  '"model": {{ JSON.stringify($(\'Conversational AI API\').item.json.model) }},\n\t"topic": {{ JSON.stringify($(\'Code in JavaScript\').item.json.output.topic || \'general\') }}');

fs.writeFileSync(p, d);
console.log('patched validate');

let p2 = 'n8n-workflow/tarot-interpret-workflow.json';
let d2 = JSON.parse(fs.readFileSync(p2, 'utf8'));

// 1. Remove Tra cứu Ý Nghĩa Bài Node
d2.nodes = d2.nodes.filter(n => n.name !== 'Tra cứu Ý Nghĩa Bài');

// 2. Wire 'Luận giải tarot' directly to 'build interpretation prompt'
d2.connections['Luận giải tarot'] = {
  "main": [
    [
      {
        "node": "build interpretation prompt",
        "type": "main",
        "index": 0
      }
    ]
  ]
};
delete d2.connections['Tra cứu Ý Nghĩa Bài'];

// 3. Update 'build interpretation prompt' jsCode
const buildInterNode = d2.nodes.find(n => n.name === 'build interpretation prompt');
if (buildInterNode) {
    buildInterNode.parameters.jsCode = `for (const item of $input.all()) {
  const question = $('Luận giải tarot').first().json.body.question || "";
  
  // Lấy thẻ bài từ Webhook trực tiếp (đã được Astro backend enrich)
  const cards = $('Luận giải tarot').first().json.body.cards || [];
  const topic = $('Luận giải tarot').first().json.body.topic || 'general';
  
  const userProfile = $('Luận giải tarot').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;
  const readerPrompt = $('Luận giải tarot').first().json.body.reader_prompt || '';
  
  const history = $('Luận giải tarot').first().json.body.history || [];
  let historyText = 'Chưa có câu hỏi nào trước đó trong phiên này.';
  if (history.length > 0) {
    let historyLines = [];
    let turnCount = 1;
    for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (msg.role === 'user') {
            historyLines.push(\`[\${turnCount}] "\${msg.content}"\`);
            turnCount++;
        }
    }
    if (historyLines.length > 0) {
        historyText = historyLines.join('\\n');
    }
  }

  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = \`\\n\\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\\n\${recentEvents}\`;
  }

  const defaultSystemPrompt = \`## ROLE: Master Tarot Reader thấu cảm và sâu sắc\\n## TASK: Khách hàng vừa bốc bài Tarot. Hãy LUẬN GIẢI các lá bài một cách liên kết với câu hỏi của khách hàng.\`;
  const narrativeBase = readerPrompt || defaultSystemPrompt;
  
  const systemPrompt = narrativeBase + \`\\n\\n## USER INFO: Tên: \${userName}, Giới tính: \${userGender}. Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao (không bị phụ thuộc máy móc vào giới tính, tùy theo phong cách của bạn).\` + personaSection + \`\\n\\n## QUY TẮC:\\n1. Không giải thích từng lá rời rạc kiểu "Lá A nghĩa là... Lá B nghĩa là...". Thay vào đó, hãy tổng hợp thông điệp thành một câu chuyện liền mạch.\\n2. Lời khuyên cần thực tế, hướng thiện và tích cực.\\n3. Hãy tham chiếu các câu hỏi trước đó để hiểu mạch bối cảnh, nhưng TẬP TRUNG vào trả lời câu hỏi hiện tại lần bốc bài này.\\n4. KHÔNG nhắc đến AI hay thuật toán.\`;

  const cardsText = cards.map(c => {
      let info = \`- \${c.name} (\${c.orientation}): \${c.meaning || 'Chưa có dữ liệu ý nghĩa'}\`;
      if (c.keyword && c.keyword[topic]) {
          info += \` (Từ khóa \${topic}: \${c.keyword[topic]})\`;
      } else if (c.keyword && c.keyword.general) {
          info += \` (Từ khóa chung: \${c.keyword.general})\`;
      }
      return info;
  }).join('\\n');

  const userPrompt = \`### 🗣️ CÂU HỎI TRỌNG TÂM HIỆN TẠI:\\n"\${question}"\\n\\n---\\n\\n### 🃏 LÁ BÀI VỪA BỐC VÀ Ý NGHĨA GỐC (Dùng làm cơ sở luận giải):\\n\${cardsText}\\n\\n---\\n\\n### 📜 CÁC CÂU HỎI TRƯỚC ĐÓ TRONG PHIÊN NÀY:\\n\${historyText}\\n\\n---\\n\\n-> Dựa vào bối cảnh trên, hãy tiến hành luận giải trải bài này.\`;

  item.json.bodyPayload = {
    model: 'n8n2',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8
  };
}

return $input.all();`;
}

fs.writeFileSync(p2, JSON.stringify(d2, null, 2));
console.log('patched interpret');
