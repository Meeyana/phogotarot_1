const fs = require('fs');
let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-yes-no-question.json';
let d = JSON.parse(fs.readFileSync(p, 'utf8'));

// 1. Remove nodes
d.nodes = d.nodes.filter(n => n.name !== 'Lấy Lịch Sử D1' && n.name !== 'Lưu Nhật Ký Chi Tiết');

// 2. Fix connections
// "Luận giải tarot" used to go to "Lấy Lịch Sử D1", now it should go to "Tra cứu Ý Nghĩa Bài"
if (d.connections['Luận giải tarot']) {
    d.connections['Luận giải tarot'] = {
        main: [
            [
                { node: 'Tra cứu Ý Nghĩa Bài', type: 'main', index: 0 }
            ]
        ]
    };
}
// Delete "Lấy Lịch Sử D1" connections
delete d.connections['Lấy Lịch Sử D1'];

// "Luận giải AI API" used to go to "Lưu Nhật Ký Chi Tiết" and "Respond to Webhook1".
if (d.connections['Luận giải AI API']) {
    d.connections['Luận giải AI API'].main[0] = d.connections['Luận giải AI API'].main[0].filter(c => c.node !== 'Lưu Nhật Ký Chi Tiết');
}

// 3. Fix "build interpretation prompt" to remove history parsing logic
let intNode = d.nodes.find(n => n.name === 'build interpretation prompt');
if (intNode) {
    let code = intNode.parameters.jsCode;
    // Remove history logic. We'll just replace the entire logic with a simpler one that doesn't reference history.
    // Replace the block of history parsing:
    const regexHistory = /let isFollowUp = false;[\s\S]*?\} catch \(e\) \{\}/;
    code = code.replace(regexHistory, `let isFollowUp = false;\n  let historyText = "Chưa có cuộc trò chuyện nào trước đó.";\n  let cardsListText = "";`);
    
    intNode.parameters.jsCode = code;
}

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('Patched tarot-yes-no-question.json');
