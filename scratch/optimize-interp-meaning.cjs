const fs = require('fs');

const tarotPath = 'D:\\Tuan\\phogotarot\\tarot.json';
const data = JSON.parse(fs.readFileSync(tarotPath, 'utf8'));

const interpNode = data.nodes.find(n => n.name === 'build interpretation prompt');
if (interpNode) {
  interpNode.parameters.jsCode = `for (const item of $input.all()) {
  const question = $('Luận giải tarot').first().json.body.question || "";
  const cards = $('Luận giải tarot').first().json.body.cards || [];
  const userProfile = $('Luận giải tarot').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;
  const readerPrompt = $('Luận giải tarot').first().json.body.reader_prompt || '';
  
  // Xây dựng lịch sử hội thoại: CHỈ LẤY CÂU HỎI CỦA KHÁCH, RÚT GỌN PREFIX
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

  // Chèn Chân dung năng lượng
  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = \`\\n\\n### [CHÂN DUNG NĂNG LƯỢNG KHÁCH HÀNG (Do AI đúc kết từ các phiên trước)]\\n\${recentEvents}\`;
  }

  // Dùng reader_prompt nếu có, fallback về default
  const defaultSystemPrompt = \`## ROLE: Master Tarot Reader thấu cảm và sâu sắc\\n## TASK: Khách hàng vừa bốc bài Tarot. Hãy LUẬN GIẢI các lá bài một cách liên kết với câu hỏi của khách hàng.\`;
  const narrativeBase = readerPrompt || defaultSystemPrompt;
  
  const systemPrompt = narrativeBase + \`\\n\\n## USER INFO: Tên: \${userName}, Giới tính: \${userGender}. Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao (không bị phụ thuộc máy móc vào giới tính, tùy theo phong cách của bạn).\` + personaSection + \`\\n\\n## QUY TẮC:\\n1. Không giải thích từng lá rời rạc kiểu "Lá A nghĩa là... Lá B nghĩa là...". Thay vào đó, hãy tổng hợp thông điệp thành một câu chuyện liền mạch.\\n2. Lời khuyên cần thực tế, hướng thiện và tích cực.\\n3. Hãy tham chiếu các câu hỏi trước đó để hiểu mạch bối cảnh, nhưng TẬP TRUNG vào trả lời câu hỏi hiện tại lần bốc bài này.\\n4. KHÔNG nhắc đến AI hay thuật toán.\`;

  // Tích hợp ngay ý nghĩa (được gửi từ Backend API) vào phần Lá bài
  const cardsText = cards.map(c => \`- \${c.name} (\${c.orientation}): \${c.meaning || 'Chưa có dữ liệu ý nghĩa'}\`).join('\\n');

  // CẤU TRÚC PROMPT: Câu hỏi -> Bài bốc (kèm ý nghĩa) -> Lịch sử (chỉ user)
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

fs.writeFileSync(tarotPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully optimized interpretation prompt meaning and history prefix');
