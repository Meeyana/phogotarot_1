import fs from 'fs';
const file = 'd:/Tuan/phogotarot/cms-worker/worker.js';
let content = fs.readFileSync(file, 'utf8');

// The backend regex was: rawMarkdown.match(/^---\\n([\\s\\S]*?)\\n---\\n([\\s\\S]*)$/);
content = content.replace(/const match = rawMarkdown\.match\(.*/g, 'const match = rawMarkdown.match(/^---\\\\r?\\\\n([\\\\s\\\\S]*?)\\\\r?\\\\n---\\\\r?\\\\n([\\\\s\\\\S]*)$/);');

fs.writeFileSync(file, content, 'utf8');
