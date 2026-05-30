const fs = require('fs');

function patchWorkflowPronouns(p, nodeName) {
    let d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const n = d.nodes.find(n => n.name === nodeName);
    
    if (n) {
        let code = n.parameters.jsCode;

        // Add pronoun extraction
        const oldExtract = "const readerPrompt = $('Luận giải tarot').first().json.body.reader_prompt || '';";
        const oldExtractValidate = "const readerPrompt = $('Check câu hỏi').first().json.body.reader_prompt || '';";
        
        let targetExtract = oldExtract;
        let isValidate = false;
        if (code.includes(oldExtractValidate)) {
            targetExtract = oldExtractValidate;
            isValidate = true;
        }

        const injectSource = isValidate ? "$('Check câu hỏi')" : "$('Luận giải tarot')";
        
        const pronounExtract = `
  const selfPronoun = ${injectSource}.first().json.body.reader_self_pronoun || 'mình';
  const userPronoun = ${injectSource}.first().json.body.reader_user_pronoun || 'bạn';`;

        code = code.replace(targetExtract, targetExtract + "\n" + pronounExtract);

        // Replace the "xưng hô linh hoạt" text
        const oldInstruction = "Hãy gọi tên và chủ động xưng hô một cách linh hoạt, tự nhiên như một người bạn tâm giao (không bị phụ thuộc máy móc vào giới tính, tùy theo phong cách của bạn).";
        const newInstruction = "Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là \\\"${selfPronoun}\\\" và gọi khách hàng là \\\"${userPronoun}\\\" (có thể kết hợp gọi tên ${userName}) một cách nhất quán trong mọi câu trả lời.";

        code = code.replace(oldInstruction, newInstruction);
        
        n.parameters.jsCode = code;
        fs.writeFileSync(p, JSON.stringify(d, null, 2));
    }
}

patchWorkflowPronouns('d:/Tuan/phogotarot/n8n-workflow/tarot-validate-workflow.json', 'build conversational prompt');
patchWorkflowPronouns('d:/Tuan/phogotarot/n8n-workflow/tarot-interpret-workflow.json', 'build interpretation prompt');

console.log("Patched n8n workflows with pronouns logic");
