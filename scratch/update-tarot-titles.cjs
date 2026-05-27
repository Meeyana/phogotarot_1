const fs = require('fs');

const tarotPath = 'D:\\Tuan\\phogotarot\\tarot.json';
const data = JSON.parse(fs.readFileSync(tarotPath, 'utf8'));

// 1. Cập nhật node "build interpretation prompt"
const interpNode = data.nodes.find(n => n.name === 'build interpretation prompt');
if (interpNode) {
  interpNode.parameters.jsCode = interpNode.parameters.jsCode.replace(
    '### [CHÂN DUNG NĂNG LƯỢNG KHÁCH HÀNG (Do AI đúc kết từ các phiên trước)]',
    '### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]'
  );
}

// 2. Cập nhật node "build conversational prompt"
const convNode = data.nodes.find(n => n.name === 'build conversational prompt');
if (convNode) {
  convNode.parameters.jsCode = convNode.parameters.jsCode.replace(
    '### [CHÂN DUNG NĂNG LƯỢNG KHÁCH HÀNG (Do AI đúc kết từ các phiên trước)]',
    '### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]'
  );
}

fs.writeFileSync(tarotPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated prompt titles in tarot.json');
