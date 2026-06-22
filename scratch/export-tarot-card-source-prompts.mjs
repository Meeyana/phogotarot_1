import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'content-plan');
const outFile = join(outDir, 'prompt-source-viet-lai-78-la-bai-tu-d1.md');

const sql = `
SELECT
  id,
  card_name,
  upright_meaning,
  reversed_meaning,
  yes_no_meaning,
  image_description,
  upright_keyword,
  reversed_keyword,
  upright_love_keyword,
  upright_career_keyword,
  upright_finances_keyword,
  reversed_love_keyword,
  reversed_career_keyword,
  reversed_finances_keyword,
  upright_love_meaning,
  upright_career_meaning,
  upright_finances_meaning,
  reversed_love_meaning,
  reversed_career_meaning,
  reversed_finances_meaning
FROM tarot_database
ORDER BY id ASC;
`.trim();

const raw = process.platform === 'win32'
  ? execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `npx wrangler d1 execute phogotarot --remote --json --command '${sql.replace(/\s+/g, ' ')}'`],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    )
  : execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', 'phogotarot', '--remote', '--json', '--command', sql.replace(/\s+/g, ' ')],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    );

const jsonStart = raw.search(/\[\s*\{/);
if (jsonStart === -1) {
  throw new Error(`Cannot find JSON payload in wrangler output:\n${raw.slice(0, 500)}`);
}
const payload = JSON.parse(raw.slice(jsonStart));
const rows = payload?.[0]?.results || [];

const cardFiles = new Map();
for (const fileName of readdirSync(join(root, 'src', 'content', 'cards'))) {
  if (!fileName.endsWith('.md')) continue;
  const text = readFileSync(join(root, 'src', 'content', 'cards', fileName), 'utf8');
  const image = text.match(/^image:\s*"([^"]+)"/m)?.[1] || '';
  const index = text.match(/^index:\s*(\d+)/m)?.[1] || '';
  const title = text.match(/^title:\s*"([^"]+)"/m)?.[1] || '';
  if (index) {
    cardFiles.set(Number(index) + 1, { fileName, image, index, title });
  }
}

const phaseOf = (id) => Math.ceil(id / 6);
const clean = (value) => String(value ?? '').trim();
const bullet = (label, value) => `- ${label}: ${clean(value) || '(trống)'}`;

let md = `# Prompt source viết lại 78 lá bài Tarot từ D1

Nguồn dữ liệu: D1 remote database \`phogotarot\`, bảng \`tarot_database\`.

Mục đích: file này là nguồn tham chiếu trước khi viết lại các bài trong \`src/content/cards/\`. Khi triển khai từng phase, dùng đúng dữ liệu bên dưới làm nền nghĩa lá bài, không tự bịa thêm ý nghĩa trái với source. Có thể diễn giải lại bằng giọng Phở Gõ Tarot, nhưng phải giữ tinh thần cốt lõi của các trường D1.

Quy tắc khi viết bài từ prompt source:
- Giữ đúng nghĩa xuôi/ngược, keyword và ngữ cảnh love/career/finance theo D1.
- Nếu mở rộng ví dụ, chỉ mở rộng từ dữ liệu nguồn, không thêm kết luận tuyệt đối.
- Không biến Tarot thành dự đoán chắc chắn; dùng ngôn ngữ định hướng, phản chiếu, khả năng.
- Các phần tình yêu, công việc, tài chính phải ưu tiên trường chuyên biệt nếu có.
- Phần Yes/No dùng \`yes_no_meaning\` làm tín hiệu gốc, nhưng vẫn giải thích điều kiện và giới hạn.
- Với các lá nặng như Death, The Tower, The Devil, Nine/Ten of Swords, viết có trách nhiệm, không gieo sợ hãi.

Tổng số lá export: ${rows.length}

---
`;

for (const row of rows) {
  const fileMeta = cardFiles.get(row.id) || {};
  md += `
## Phase ${phaseOf(row.id)} - ${row.id}. ${clean(row.card_name)}

Thông tin repo:
- File: \`${fileMeta.fileName || '(chưa map được file)'}\`
- Card index trong content: \`${fileMeta.index || row.id - 1}\`
- Image: \`${fileMeta.image || '(trống)'}\`

Prompt viết lại:
\`\`\`text
Bạn là content strategist và tarot writer cho Phở Gõ Tarot. Hãy viết lại bài ý nghĩa lá bài "${clean(row.card_name)}" bằng tiếng Việt tự nhiên, sâu sắc, dễ hiểu, chuẩn SEO và bám chặt dữ liệu nguồn D1 dưới đây. Không bịa ý nghĩa mới trái với source. Giọng văn ấm, tỉnh táo, chữa lành, không phán quyết tuyệt đối.

DỮ LIỆU NGUỒN D1
${bullet('Ý nghĩa xuôi', row.upright_meaning)}
${bullet('Ý nghĩa ngược', row.reversed_meaning)}
${bullet('Tín hiệu Yes/No', row.yes_no_meaning)}
${bullet('Mô tả hình ảnh/biểu tượng', row.image_description)}

KEYWORD
${bullet('Keyword xuôi', row.upright_keyword)}
${bullet('Keyword ngược', row.reversed_keyword)}

TÌNH YÊU
${bullet('Keyword tình yêu xuôi', row.upright_love_keyword)}
${bullet('Ý nghĩa tình yêu xuôi', row.upright_love_meaning)}
${bullet('Keyword tình yêu ngược', row.reversed_love_keyword)}
${bullet('Ý nghĩa tình yêu ngược', row.reversed_love_meaning)}

CÔNG VIỆC
${bullet('Keyword công việc xuôi', row.upright_career_keyword)}
${bullet('Ý nghĩa công việc xuôi', row.upright_career_meaning)}
${bullet('Keyword công việc ngược', row.reversed_career_keyword)}
${bullet('Ý nghĩa công việc ngược', row.reversed_career_meaning)}

TÀI CHÍNH
${bullet('Keyword tài chính xuôi', row.upright_finances_keyword)}
${bullet('Ý nghĩa tài chính xuôi', row.upright_finances_meaning)}
${bullet('Keyword tài chính ngược', row.reversed_finances_keyword)}
${bullet('Ý nghĩa tài chính ngược', row.reversed_finances_meaning)}

CẤU TRÚC BÀI CẦN VIẾT
1. Mở bài ngắn, nói rõ năng lượng cốt lõi của ${clean(row.card_name)}.
2. Hình ảnh và biểu tượng trên lá bài, diễn giải từ image_description.
3. Ý nghĩa tổng quan.
4. ${clean(row.card_name)} xuôi.
5. ${clean(row.card_name)} ngược.
6. Trong tình yêu: xuôi và ngược.
7. Trong công việc: xuôi và ngược.
8. Trong tài chính: xuôi và ngược.
9. Khi hỏi Yes/No: giải thích từ yes_no_meaning, có điều kiện và lời nhắc tỉnh táo.
10. Câu hỏi tự soi chiếu.
11. Kết luận ngắn, định hướng hành động.
\`\`\`
`;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, md, 'utf8');

console.log(JSON.stringify({ outFile, rows: rows.length }, null, 2));
