const fs = require('fs');

const dir = 'd:/Tuan/phogotarot/';

function patchYesNoAPI(filename) {
    let content = fs.readFileSync(dir + 'src/pages/api/' + filename, 'utf8');

    // Add profile extraction logic before "const response = await fetch(webhookUrl"
    const profileInjection = `
    let profile = { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    if (db && queryUserId) {
        try {
            const row = await db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
            if (row) {
                profile.name = row.nickname || row.full_name || 'lữ khách';
                profile.gender = row.gender || 'bạn';
                
                let combinedPersona = [];
                let basicInfo = [];
                if (row.date_of_birth) basicInfo.push(\`Sinh ngày: \${row.date_of_birth}\`);
                if (row.location) basicInfo.push(\`Nơi ở: \${row.location}\`);
                
                if (basicInfo.length > 0) combinedPersona.push(\`- Thông tin cơ bản: \${basicInfo.join(', ')}\`);
                if (row.current_status) combinedPersona.push(\`- Tình trạng hiện tại: \${row.current_status}\`);
                if (row.user_persona) combinedPersona.push(\`- Đánh giá năng lượng từ AI (Lịch sử): \${row.user_persona}\`);
                
                profile.user_persona = combinedPersona.join('\\n');
            }
        } catch (err) {
            console.error("Lỗi lấy user_profiles cho yesno:", err);
        }
    }
    body.userProfile = profile;
`;
    if (!content.includes('body.userProfile = profile;')) {
        content = content.replace("const response = await fetch(webhookUrl", profileInjection + "\n    const response = await fetch(webhookUrl");
        fs.writeFileSync(dir + 'src/pages/api/' + filename, content);
        console.log("Patched API:", filename);
    }
}

patchYesNoAPI('yesno-validate.ts');
patchYesNoAPI('yesno-interpret.ts');

function patchYesNoWorkflow() {
    let p = dir + 'n8n-workflow/tarot-yes-no-question.json';
    let d = JSON.parse(fs.readFileSync(p, 'utf8'));

    // Fix node: "build check question prompt"
    const checkNode = d.nodes.find(n => n.name === 'build check question prompt');
    if (checkNode) {
        let code = checkNode.parameters.jsCode;
        if (!code.includes('userProfile')) {
            const injection = `
  const userProfile = $('Webhook').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;

  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = \`\\n\\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\\n\${recentEvents}\`;
  }
`;
            code = code.replace("const mySystemPrompt = `", injection + "\n  const mySystemPrompt = `");
            // Also inject the pronoun instruction inside the system prompt
            // Currently it says "## ROLE: Tarot Question Linter..."
            // We append the pronoun info:
            code = code.replace("## TASK:", "## USER INFO: Tên: ${userName}, Giới tính: ${userGender}. Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là \"mình\" và gọi khách hàng là \"bạn\" (có thể kết hợp gọi tên ${userName}) một cách tự nhiên.\\n\\n" + "${personaSection}\\n\\n## TASK:");
            checkNode.parameters.jsCode = code;
        }
    }

    // Fix node: "build interpretation prompt"
    const intNode = d.nodes.find(n => n.name === 'build interpretation prompt');
    if (intNode) {
        let code = intNode.parameters.jsCode;
        if (!code.includes('userProfile')) {
            const injection = `
  const userProfile = $('Webhook').first().json.body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
  const userName = userProfile.name;
  const userGender = userProfile.gender;
  const recentEvents = userProfile.user_persona;

  let personaSection = '';
  if (recentEvents && recentEvents.trim() !== '') {
    personaSection = \`\\n\\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\\n\${recentEvents}\`;
  }
`;
            code = code.replace("const defaultSystemPrompt = `", injection + "\n  const defaultSystemPrompt = `");
            code = code.replace(
                "const systemPrompt = narrativeBase + `\\n\\n## QUY TẮC:",
                "const systemPrompt = narrativeBase + `\\n\\n## USER INFO: Tên: ${userName}, Giới tính: ${userGender}. Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là \"mình\" và gọi khách hàng là \"bạn\" (có thể kết hợp gọi tên ${userName}) một cách tự nhiên.\\n\\n` + personaSection + `\\n\\n## QUY TẮC:"
            );
            intNode.parameters.jsCode = code;
        }
    }

    fs.writeFileSync(p, JSON.stringify(d, null, 2));
    console.log("Patched workflow: tarot-yes-no-question.json");
}

patchYesNoWorkflow();

