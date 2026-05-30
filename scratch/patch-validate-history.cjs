const fs = require('fs');

let p = 'd:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json';
let d = JSON.parse(fs.readFileSync(p, 'utf8'));

const n = d.nodes.find(n => n.name === 'build check question prompt');

// 1. Add history extraction
let code = n.parameters.jsCode;

const historyInjection = `
  const history = $('Check câu hỏi').first().json.body.history || [];
  let historyContext = "";
  if (history && history.length > 0) {
    // Only get user questions before the CURRENT question (the last one in history is usually the current, but let's just get all user questions)
    // Actually the current question is passed as \`question\` parameter, we can just grab all user messages
    const userQs = history.filter(h => h.role === 'user').map(h => h.content);
    if (userQs.length > 0) {
      historyContext = "\\n\\n### [LỊCH SỬ CÂU HỎI TRƯỚC ĐÓ CỦA KHÁCH]\\n- " + userQs.join("\\n- ");
    }
  }
`;

// Insert after cards declaration
code = code.replace(
  "const cards = $('Check câu hỏi').first().json.body.cards || [];",
  "const cards = $('Check câu hỏi').first().json.body.cards || [];\n" + historyInjection
);

// Add historyContext to myUserPrompt
code = code.replace(
  "\"${question}\"${cardsContext}\\n\\nHãy phân tích",
  "\"${question}\"${cardsContext}${historyContext}\\n\\nHãy phân tích"
);

// Update rule 4 in mySystemPrompt
code = code.replace(
  "Nếu không thuộc 3 chủ đề này, gán \\\"topic\\\": \\\"general\\\".",
  "Nếu không thuộc 3 chủ đề này, gán \\\"topic\\\": \\\"general\\\".\\n- [QUAN TRỌNG] Nếu CÂU HỎI ĐẦU VÀO là câu hỏi phụ (VD: \\\"ý nghĩa lá 1\\\", \\\"giải thích thêm\\\"), BẮT BUỘC phải tham chiếu [LỊCH SỬ CÂU HỎI TRƯỚC ĐÓ] để giữ nguyên topic gốc (VD gốc hỏi về công việc thì topic tiếp tục là \\\"career\\\")."
);

n.parameters.jsCode = code;

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log("Patched build check question prompt with history context");
