const fs = require('fs');

function patchReaderAPI(p) {
    let content = fs.readFileSync(p, 'utf8');

    // Update SELECT query to include self_pronoun and user_pronoun
    content = content.replace(
        "SELECT system_prompt FROM tarot_readers",
        "SELECT system_prompt, self_pronoun, user_pronoun FROM tarot_readers"
    );

    // Update the assignment
    content = content.replace(
        "body.reader_prompt = reader.system_prompt;",
        "body.reader_prompt = reader.system_prompt;\n                    body.reader_self_pronoun = reader.self_pronoun || 'mình';\n                    body.reader_user_pronoun = reader.user_pronoun || 'bạn';"
    );

    fs.writeFileSync(p, content);
}

patchReaderAPI('d:/Tuan/phogotarot/src/pages/api/tarot-validate.ts');
patchReaderAPI('d:/Tuan/phogotarot/src/pages/api/tarot-interpret.ts');

console.log("Patched API files to pass reader pronouns");
