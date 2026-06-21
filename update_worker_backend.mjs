import fs from 'fs';
const file = 'd:/Tuan/phogotarot/cms-worker/worker.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add simpleMarkdownToHtml
const markdownFunc = `
function simpleMarkdownToHtml(md) {
  let html = md
    .replace(/^######\\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    .replace(/^[-*]\\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>');
  
  html = html.replace(/(<li>.*<\\/li>\\n?)+/g, (match) => '<ul>' + match + '</ul>');
  
  html = html.split(/\\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<hr') || block.startsWith('<blockquote') || block.startsWith('<li')) return block;
    return '<p>' + block.replace(/\\n/g, '<br>') + '</p>';
  }).join('\\n');
  
  return html;
}
`;

if (!content.includes('function simpleMarkdownToHtml')) {
  content = content.replace('export default {', markdownFunc + '\\nexport default {');
}

// 2. Add POST kv_save
const kvSaveEndpoint = `
        if (urlParams.searchParams.get('action') === 'kv_save') {
          const body = await request.json();
          const { files, message } = body;
          if (!env.SESSION) throw new Error("Chưa cấu hình SESSION KV");
          
          let saved = 0;
          let indexStr = await env.SESSION.get('numerology:_index');
          let indexObj = indexStr ? JSON.parse(indexStr) : {};

          for (const file of files) {
            // file.path here is the KV key
            const key = file.path;
            const rawMarkdown = file.content;
            
            // basic frontmatter parsing
            let frontmatter = {};
            let bodyContent = rawMarkdown;
            const match = rawMarkdown.match(/^---\\n([\\s\\S]*?)\\n---\\n([\\s\\S]*)$/);
            if (match) {
              try {
                const lines = match[1].split('\\n');
                for (const line of lines) {
                  const colonIdx = line.indexOf(':');
                  if (colonIdx > -1) {
                    const k = line.substring(0, colonIdx).trim();
                    const v = line.substring(colonIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
                    frontmatter[k] = v;
                  }
                }
                bodyContent = match[2].trimStart();
              } catch(e) {}
            }
            
            const htmlContent = simpleMarkdownToHtml(bodyContent);
            await env.SESSION.put(key, JSON.stringify({
              frontmatter,
              content: htmlContent,
              rawMarkdown
            }));
            
            // update index
            const parts = key.split(':');
            const category = parts[1];
            if (category) {
              if (!indexObj[category]) indexObj[category] = [];
              if (!indexObj[category].includes(key)) indexObj[category].push(key);
            }
            
            saved++;
          }
          
          await env.SESSION.put('numerology:_index', JSON.stringify(indexObj));
          
          return new Response(JSON.stringify({ success: true, saved }), { headers: { "Content-Type": "application/json" } });
        }
`;

if (!content.includes("=== 'kv_save'")) {
  content = content.replace("if (urlParams.searchParams.get('action') === 'github_push')", kvSaveEndpoint + "\\n        if (urlParams.searchParams.get('action') === 'github_push')");
}

// 3. Add GET kv_list / kv_get
const kvGetEndpoints = `
    if (action === 'kv_list' || action === 'kv_get') {
        try {
            if (!env.SESSION) throw new Error("Chưa cấu hình SESSION KV");
            
            if (action === 'kv_list') {
                const prefix = url.searchParams.get('prefix');
                const listRes = await env.SESSION.list({ prefix, limit: 1000 });
                const filtered = listRes.keys.map(k => ({ key: k.name, name: k.name }));
                return new Response(JSON.stringify({ success: true, data: filtered }), { headers: { "Content-Type": "application/json" } });
            } else {
                const key = url.searchParams.get('key');
                const dataStr = await env.SESSION.get(key);
                if (!dataStr) throw new Error("Key not found");
                return new Response(JSON.stringify({ success: true, data: JSON.parse(dataStr) }), { headers: { "Content-Type": "application/json" } });
            }
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
    }
`;

if (!content.includes("=== 'kv_list'")) {
  content = content.replace("if (action === 'github_list' || action === 'github_file')", kvGetEndpoints + "\\n    if (action === 'github_list' || action === 'github_file')");
}

fs.writeFileSync(file, content, 'utf8');
console.log('Backend endpoints updated');
