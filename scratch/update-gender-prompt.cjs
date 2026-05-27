const fs = require('fs');

const tarotPath = 'D:\\Tuan\\phogotarot\\tarot.json';
const data = JSON.parse(fs.readFileSync(tarotPath, 'utf8'));

// Cập nhật node conversational
const convNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (convNode) {
  convNode.parameters.jsCode = `for (const item of $input.all()) {
  const userMsg = $('Conversational tarot').first().json.body.message || "";
  const userProfile = $('Conversational tarot').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;
  const readerPrompt = $('Conversational tarot').first().json.body.reader_prompt || '';
  
  // Xây dựng lịch sử hội thoại dạng cặp đôi, ĐÁNH DẤU TURN
  const history = $('Conversational tarot').first().json.body.history || [];
  let historyText = 'Chưa có lịch sử. Đây là tin nhắn đầu tiên.';
  if (history.length > 0) {
    let turnCount = 1;
    let historyLines = [];
    
    for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (msg.role === 'user') {
            historyLines.push(\`[Turn \${turnCount}] - Khách hàng: "\${msg.content}"\`);
        } else {
            historyLines.push(\`[Turn \${turnCount}] - Tarot Reader: "\${msg.content}"\`);
            turnCount++; 
        }
    }
    historyText = historyLines.join('\\n');
  }

  // Chèn Chân dung năng lượng
  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = \`\\n\\n### [CHÂN DUNG NĂNG LƯỢNG KHÁCH HÀNG (Do AI đúc kết từ các phiên trước)]\\n\${recentEvents}\`;
  }

  const defaultSystemPrompt = \`## ROLE: Master Tarot Reader thấu cảm và sâu sắc\\n## TASK: Khách hàng đang trò chuyện hoặc hỏi thêm. Hãy trả lời sâu sắc, giữ đúng vai Tarot Reader.\`;
  const narrativeBase = readerPrompt || defaultSystemPrompt;
  const systemPrompt = narrativeBase + \`\\n\\n## USER INFO: Tên: \${userName}, Giới tính: \${userGender}. Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao (không bị phụ thuộc máy móc vào giới tính, tùy theo phong cách của bạn).\` + personaSection + \`\\n\\n## QUY TẮC:\\n1. Lời khuyên cần thực tế, hướng thiện và tích cực.\\n2. Nếu có lịch sử, hãy tham chiếu để hiểu bối cảnh, nhưng TẬP TRUNG vào tin nhắn mới nhất.\\n3. KHÔNG nhắc đến AI hay thuật toán.\`;

  const userPrompt = \`### 🗣️ TIN NHẮN MỚI NHẤT CỦA KHÁCH HÀNG:\\n"\${userMsg}"\\n\\n---\\n\\n### 📜 LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ (Sắp xếp từ cũ đến mới):\\n\${historyText}\\n\\n---\\n\\n-> Dựa vào bối cảnh trên, hãy trả lời tin nhắn mới nhất của khách hàng.\`;

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

// Cập nhật node interpretation
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
  
  let isFollowUp = false;
  if ($('Luận giải tarot').first().json.body.isFollowUp) {
    isFollowUp = true;
  }
  
  const cardMeaningsStr = $('Tra cứu Ý Nghĩa Bài').first().json.cards_str || "";

  // Xây dựng lịch sử hội thoại dạng cặp đôi, ĐÁNH DẤU TURN
  const history = $('Luận giải tarot').first().json.body.history || [];
  let historyText = 'Đây là tin nhắn đầu tiên của phiên.';
  if (history.length > 0) {
    let turnCount = 1;
    let historyLines = [];
    
    for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (msg.role === 'user') {
            historyLines.push(\`[Turn \${turnCount}] - Khách hàng: "\${msg.content}"\`);
        } else {
            historyLines.push(\`[Turn \${turnCount}] - Tarot Reader: "\${msg.content}"\`);
            turnCount++; 
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
  const defaultSystemPrompt = \`## ROLE: Master Tarot Reader thấu cảm và sâu sắc\\n## TASK: Khách hàng vừa bốc bài Tarot. Hãy LUẬN GIẢI các lá bài một cách liên kết với câu hỏi của khách hàng.\`;
  const narrativeBase = readerPrompt || defaultSystemPrompt;
  const systemPrompt = narrativeBase + \`\\n\\n## USER INFO: Tên: \${userName}, Giới tính: \${userGender}. Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao (không bị phụ thuộc máy móc vào giới tính, tùy theo phong cách của bạn).\` + personaSection + \`\\n\\n## QUY TẮC:\\n1. Không giải thích từng lá rời rạc kiểu "Lá A nghĩa là... Lá B nghĩa là...". Thay vào đó, hãy tổng hợp thông điệp thành một câu chuyện liền mạch.\\n2. Lời khuyên cần thực tế, hướng thiện và tích cực.\\n3. Nếu có lịch sử, hãy tham chiếu để hiểu bối cảnh, nhưng TẬP TRUNG vào lần bốc bài này.\\n4. KHÔNG nhắc đến AI hay thuật toán.\`;

  // CẤU TRÚC PROMPT: Câu hỏi -> Bài bốc -> Ý nghĩa tra cứu -> Lịch sử
  const userPrompt = \`### 🗣️ CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG:\\n"\${question}"\\n\\n---\\n\\n### 🃏 LÁ BÀI VỪA BỐC (CẦN LUẬN GIẢI):\\n\${cards.map(c => \`- \${c.name} (\${c.orientation})\`).join('\\n')}\\n\\n### 📚 Ý NGHĨA GỐC CỦA LÁ BÀI (Dùng làm cơ sở luận giải):\\n\${cardMeaningsStr}\\n\\n---\\n\\n### 📜 LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ (Sắp xếp từ cũ đến mới):\\n\${historyText}\\n\\n---\\n\\n-> Hãy tiến hành luận giải trải bài này.\`;

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
console.log('Successfully updated prompt structures for gender narrative');
