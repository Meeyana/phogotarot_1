import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

// Import module 'fs' và 'path'
import fs from 'fs';
import path from 'path';

/**
 * Hàm đọc file từ thư mục content để lấy URL động
 */
function getDynamicRoutes(collectionPath, urlPrefix) {
  const dirPath = path.resolve(process.cwd(), `src/content/${collectionPath}`);
  
  try {
    const files = fs.readdirSync(dirPath);
    
    return files
      .filter(file => file.endsWith('.md')) 
      .map(file => {
        const slug = file.replace(/\.md$/, '');
        // Trả về URL đầy đủ
        return `${urlPrefix}/${slug}`;
      });
  } catch (e) {
    console.warn(`Lỗi khi đọc thư mục ${dirPath}. Sitemap có thể không đầy đủ.`);
    return [];
  }
}

// (QUAN TRỌNG) CẬP NHẬT URL PREFIX TẠI ĐÂY:
// Đổi từ '.../y-nghia-la-bai' sang '.../cards' để khớp với cấu trúc trang mới
const cardUrls = getDynamicRoutes('cards', 'https://phogotarot.com/cards'); 

// Blog vẫn giữ nguyên
const blogUrls = getDynamicRoutes('blog', 'https://phogotarot.com/blog');

// Gộp tất cả URL lại
const allCustomPages = [...cardUrls, ...blogUrls];

// --- Cấu hình Astro ---

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'server',
  adapter: netlify(),
  integrations: [
    sitemap({
      customPages: allCustomPages, // Sitemap sẽ chứa link mới (/cards/...)

      filter: (page) => {
        const parsedUrl = new URL(page);
        
        // Loại bỏ phân trang và admin
        if (parsedUrl.searchParams.has('page')) return false;
        if (parsedUrl.pathname.startsWith('/admin')) return false;
        
        return true;
      }
    })
  ]
});