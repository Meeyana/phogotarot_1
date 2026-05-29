const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/xem-tarot.astro';
let content = fs.readFileSync(p, 'utf8');

// Update xem-tarot.astro to save pending_topic
content = content.replace(
    "lastValidationModel = result.model || null;",
    "lastValidationModel = result.model || null;\n                        localStorage.setItem('pending_topic', result.topic || 'general');"
);

// Update requestInterpretation payload to include topic
content = content.replace(
    "const response = await fetch(N8N_WEBHOOK_URL, {",
    "const topic = localStorage.getItem('pending_topic') || 'general';\n                const response = await fetch(N8N_WEBHOOK_URL, {"
);

content = content.replace(
    "body: JSON.stringify({ question: userQuestion, readingId: currentReadingId, userId: currentUserId, cards: selectedCards, reader_id: currentReaderId })",
    "body: JSON.stringify({ question: userQuestion, readingId: currentReadingId, userId: currentUserId, cards: selectedCards, reader_id: currentReaderId, topic: topic })"
);

fs.writeFileSync(p, content);
console.log('patched xem-tarot');
