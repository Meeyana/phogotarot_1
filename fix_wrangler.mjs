import fs from 'fs';
const file = 'd:/Tuan/phogotarot/wrangler.toml';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('binding = "NUMEROLOGY_KV"')) {
    content += '\n\n[[kv_namespaces]]\nbinding = "NUMEROLOGY_KV"\nid = "11ae330d2f9640359ed2bcd45c28ebfe"\n';
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added NUMEROLOGY_KV to wrangler.toml');
}
