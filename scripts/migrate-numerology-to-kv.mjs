/**
 * Script Migration: Upload tất cả numerology markdown files lên Cloudflare KV
 * 
 * Cách dùng:
 *   1. npm install gray-matter marked  (nếu chưa có)
 *   2. node scripts/migrate-numerology-to-kv.mjs
 *   3. Kết quả: tạo file scripts/kv-bulk-data.json
 *   4. Upload lên KV:
 *      npx wrangler kv:bulk put --namespace-id=<SESSION_KV_ID> scripts/kv-bulk-data.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUMEROLOGY_DIR = path.join(__dirname, '..', 'src', 'content', 'numerology');
const OUTPUT_FILE = path.join(__dirname, 'kv-bulk-data.json');

/**
 * Đệ quy quét tất cả file .md trong thư mục
 */
function getAllMarkdownFiles(dir, basePath = '') {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
            results.push(...getAllMarkdownFiles(fullPath, relativePath));
        } else if (entry.name.endsWith('.md')) {
            results.push({ fullPath, relativePath });
        }
    }
    
    return results;
}

/**
 * Chuyển đường dẫn file thành KV key
 * Ví dụ:
 *   lifePath/1.md                     → numerology:lifePath:1
 *   arrows/strength_present/1-2-3.md  → numerology:arrows:strength_present:1-2-3
 *   pyramid/peaks/0.md                → numerology:pyramid:peaks:0
 */
function filePathToKVKey(relativePath) {
    // Bỏ đuôi .md
    const withoutExt = relativePath.replace(/\.md$/, '');
    // Thay / bằng :
    const parts = withoutExt.split(/[/\\]/);
    return `numerology:${parts.join(':')}`;
}

/**
 * Main migration
 */
function migrate() {
    console.log('🔮 Bắt đầu migration Numerology → KV...\n');
    
    const files = getAllMarkdownFiles(NUMEROLOGY_DIR);
    console.log(`📁 Tìm thấy ${files.length} file markdown\n`);
    
    const bulkData = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
        try {
            const rawContent = fs.readFileSync(file.fullPath, 'utf-8');
            const { data: frontmatter, content: markdownBody } = matter(rawContent);
            
            // Compile markdown → HTML
            const htmlContent = marked.parse(markdownBody);
            
            const kvKey = filePathToKVKey(file.relativePath);
            
            const kvValue = {
                frontmatter,
                content: htmlContent,
                rawMarkdown: rawContent
            };
            
            bulkData.push({
                key: kvKey,
                value: JSON.stringify(kvValue)
            });
            
            successCount++;
            console.log(`  ✅ ${kvKey}`);
        } catch (err) {
            errorCount++;
            console.error(`  ❌ ${file.relativePath}: ${err.message}`);
        }
    }
    
    // Thêm 1 key index chứa danh sách tất cả categories và keys
    const index = {};
    for (const item of bulkData) {
        const parts = item.key.split(':');
        // numerology:category[:subcat]:filename
        const category = parts[1];
        if (!index[category]) index[category] = [];
        index[category].push(item.key);
    }
    
    bulkData.push({
        key: 'numerology:_index',
        value: JSON.stringify(index)
    });
    
    // Ghi file JSON output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bulkData, null, 2), 'utf-8');
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Thành công: ${successCount} files`);
    console.log(`❌ Lỗi: ${errorCount} files`);
    console.log(`📦 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Tổng keys (bao gồm index): ${bulkData.length}`);
    console.log(`\n💡 Bước tiếp theo:`);
    console.log(`   npx wrangler kv:bulk put --namespace-id=<SESSION_KV_ID> scripts/kv-bulk-data.json`);
}

migrate();
