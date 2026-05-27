const fs = require('fs');

const tarotPath = 'D:\\Tuan\\phogotarot\\tarot.json';
const data = JSON.parse(fs.readFileSync(tarotPath, 'utf8'));

const convNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (convNode) {
  convNode.parameters.jsCode = `for (const item of $input.all()) {
  const question = $('Check câu hỏi').first().json.body.question || '';
  const history = $('Check câu hỏi').first().json.body.history || [];
  const cards = $('Check câu hỏi').first().json.body.cards || [];
  const userProfile = $('Check câu hỏi').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;
  const readerPrompt = $('Check câu hỏi').first().json.body.reader_prompt || '';

  // Xây dựng bối cảnh các lá bài đã bốc
  let cardsSection = '';
  if (cards.length >= 3) {
    cardsSection = \`### 🃏 CÁC LÁ BÀI ĐÃ BỐC TRONG PHIÊN:\\n- Lá 1 (Quá khứ): \${cards[0].name || '?'} (\${cards[0].orientation || 'Xuôi'}) - \${cards[0].meaning || '?'}\\n- Lá 2 (Hiện tại): \${cards[1].name || '?'} (\${cards[1].orientation || 'Xuôi'}) - \${cards[1].meaning || '?'}\\n- Lá 3 (Tương lai): \${cards[2].name || '?'} (\${cards[2].orientation || 'Xuôi'}) - \${cards[2].meaning || '?'}\`;
  } else if (cards.length > 0) {
    const cardLines = cards.map((c, i) => \`- Lá \${i+1}: \${c.name || '?'} (\${c.orientation || 'Xuôi'}) - \${c.meaning || '?'}\`).join('\\n');
    cardsSection = \`### 🃏 CÁC LÁ BÀI ĐÃ BỐC TRONG PHIÊN:\\n\${cardLines}\`;
  } else {
    cardsSection = \`### 🃏 CÁC LÁ BÀI ĐÃ BỐC TRONG PHIÊN:\\nChưa có lá bài nào được bốc.\`;
  }

  // Xây dựng lịch sử hội thoại dạng cặp đôi, ĐÁNH DẤU TURN
  let historyText = 'Đây là tin nhắn đầu tiên của phiên.';
  if (history.length > 0) {
    // Nhóm thành các Turn (1 cặp Khách - Tarot Reader là 1 Turn)
    // Lưu ý: Lịch sử có thể kết thúc bằng tin nhắn của Khách hoặc Tarot Reader
    let turnCount = 1;
    let historyLines = [];
    
    for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (msg.role === 'user') {
            historyLines.push(\`[Turn \${turnCount}] - Khách hàng: "\${msg.content}"\`);
        } else {
            historyLines.push(\`[Turn \${turnCount}] - Tarot Reader: "\${msg.content}"\`);
            turnCount++; // Tăng turn sau khi AI trả lời xong
        }
    }
    historyText = historyLines.join('\\n');
  }

  // Chèn Chân dung năng lượng
  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = \`\\n\\n### [CHÂN DUNG NĂNG LƯỢNG KHÁCH HÀNG (Do AI đúc kết từ các phiên trước)]\\n\${recentEvents}\`;
  }

  // Dùng reader_prompt nếu có, fallback về default
  const defaultSystemPrompt = \`## ROLE: Master Tarot Reader ấm áp, thân thiện, thấu cảm\\n## TASK: Lữ khách nhắn tiếp nối sau khi xem trải bài Tarot. Hãy phản hồi tự nhiên, phù hợp câu hỏi và lá bài.\`;
  const narrativeBase = readerPrompt || defaultSystemPrompt;
  const systemPrompt = narrativeBase + \`\\n\\n## USER INFO: Tên: \${userName}, Xưng hô: \${userGender}. Hãy gọi tên và xưng hô tự nhiên như một người bạn tâm giao.\` + personaSection + \`\\n\\n## QUY TẮC:\\n1. Phản hồi tự nhiên, đi thẳng vào trọng tâm (2-5 câu).\\n2. CHỈ DỰA VÀO ý nghĩa lá bài và bối cảnh các câu trả lời trước đó của bạn trong lịch sử (ưu tiên Turn gần nhất). KHÔNG tự mâu thuẫn với chính mình.\\n3. Nếu hỏi thêm về bài, giải thích sâu hơn dựa trên lá đó.\\n4. KHÔNG nhắc đến AI, thuật toán, hay Turn.\`;

  // CẤU TRÚC PROMPT MỚI: Câu hỏi đưa lên đầu, tách bạch rõ ràng
  const userPrompt = \`### 🗣️ CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG:\\n"\${question}"\\n\\n---\\n\\n\${cardsSection}\\n\\n---\\n\\n### 📜 LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ (Sắp xếp từ cũ đến mới):\\n\${historyText}\\n\\n---\\n\\n-> Hãy phản hồi câu hỏi hiện tại của khách hàng.\`;

  item.json.conversationalPayload = {
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

fs.writeFileSync(tarotPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated prompt structure');
