const fs = require('fs');

let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-yes-no-question.json';
let content = fs.readFileSync(p, 'utf8');

const targetStr = 'Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao.';
const newStr = 'Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là "mình" và gọi khách hàng là "bạn" (có thể kết hợp gọi tên \' + userName + \') một cách tự nhiên.';

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync(p, content);
    console.log('Fixed pronoun in tarot-yes-no-question.json');
} else {
    console.log('Not found');
}
