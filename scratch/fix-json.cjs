const fs = require('fs');
let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-yes-no-question.json';
let content = fs.readFileSync(p, 'utf8');

// The faulty string is:
// BẠN BẮT BUỘC PHẢI tự xưng là "mình" và gọi khách hàng là "bạn"
// It should be:
// BẠN BẮT BUỘC PHẢI tự xưng là \\"mình\\" và gọi khách hàng là \\"bạn\\"

content = content.replace('tự xưng là "mình" và gọi khách hàng là "bạn"', 'tự xưng là \\\\\\"mình\\\\\\" và gọi khách hàng là \\\\\\"bạn\\\\\\"');

fs.writeFileSync(p, content);
console.log('Fixed quotes in json');
