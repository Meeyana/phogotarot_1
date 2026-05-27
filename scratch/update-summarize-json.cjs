const fs = require('fs');

const path = 'D:\\Tuan\\phogotarot\\summarize.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const node = data.nodes.find(n => n.name === 'build summarize prompt');
if (node) {
  node.parameters.jsCode = `for (const item of $input.all()) {
  const body = item.json.body || {};
  const history = body.history || [];
  const currentPersona = body.currentPersona || '';
  const userProfile = body.userProfile || { name: 'lữ khách', gender: 'Khác' };

  let historyText = 'Chưa có lịch sử';
  if (history.length > 0) {
    historyText = history.map(h => \`- \${h.role === 'assistant' ? 'Tarot Reader' : 'Khách'}: "\${h.content}"\`).join('\\n');
  }

  const systemPrompt = \`Bạn là một AI phân tích tâm lý xuất sắc. Nhiệm vụ của bạn là đọc lịch sử cuộc trò chuyện Tarot và viết MỘT ĐOẠN VĂN DUY NHẤT (khoảng 100 - 150 chữ) tóm tắt lại:
1. Tình trạng cảm xúc hiện tại của khách hàng.
2. Câu chuyện/biến cố mà họ đang gặp phải.

THÔNG TIN KHÁCH HÀNG:
- Tên gọi: \${userProfile.name}
- Giới tính: \${userProfile.gender}

TUYỆT ĐỐI KHÔNG gạch đầu dòng. Viết dưới dạng một đoạn văn liền mạch để lưu làm "chân dung khách hàng" cho lần trò chuyện sau.

Năng lượng cũ của khách (nếu có):
\${currentPersona}\`;

  item.json.bodyPayload = {
    model: "n8n2",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: \`Lịch sử hội thoại mới nhất:\\n\${historyText}\` }
    ],
    temperature: 0.5
  };
}

return $input.all();`;
}

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated summarize.json prompt with userProfile');
