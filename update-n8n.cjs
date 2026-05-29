const fs = require('fs');
const file = 'd:/Tuan/phogotarot/n8n-workflow/tarot-yes-no-question.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const node = data.nodes.find(n => n.name === 'build interpretation prompt');
let code = node.parameters.jsCode;

const injection = `
  // Lấy thông tin userProfile
  const userProfile = $('Luận giải tarot').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;
  
  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = '\\n\\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\\n' + recentEvents;
  }
  
  const userInfoPrompt = '\\n\\n## USER INFO: Tên: ' + userName + ', Giới tính: ' + userGender + '. Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao.' + personaSection;
`;

code = code.replace('let mySystemPrompt = "";', injection + '\n  let mySystemPrompt = "";');
code = code.replace('### 3. Lời khuyên từ trái tim (2-3 câu)\\n→ Kết thúc bằng 1–2 câu hỏi tự vấn`;', '### 3. Lời khuyên từ trái tim (2-3 câu)\\n→ Kết thúc bằng 1–2 câu hỏi tự vấn` + userInfoPrompt;');
code = code.replace('TUYỆT ĐỐI KHÔNG nhắc đến các từ liên quan đến AI, thuật toán.`;', 'TUYỆT ĐỐI KHÔNG nhắc đến các từ liên quan đến AI, thuật toán.` + userInfoPrompt;');

node.parameters.jsCode = code;

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Updated tarot-yes-no-question.json');
