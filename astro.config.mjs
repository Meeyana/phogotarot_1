import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

// (MỚI) Import module 'fs' (File System) và 'path' của Node.js
import fs from 'fs';
import path from 'path';

/**
 * (MỚI) Hàm này đọc file từ thư mục content
 * để lấy tất cả các URL động của bạn.
 */
function getDynamicRoutes(collectionPath, urlPrefix) {
  // Tạo đường dẫn tuyệt đối đến thư mục content
  const dirPath = path.resolve(process.cwd(), `src/content/${collectionPath}`);
  
  try {
    // Đọc tất cả file trong thư mục đó
    const files = fs.readdirSync(dirPath);
    
    // Lọc file .md và tạo URL đầy đủ
    return files
      .filter(file => file.endsWith('.md')) // Chỉ lấy file markdown
      .map(file => {
        // Biến '0-the-fool.md' thành slug '0-the-fool'
        const slug = file.replace(/\.md$/, '');
        // Trả về URL đầy đủ, ví dụ: https://phogotarot.com/y-nghia-la-bai/0-the-fool
        return `${urlPrefix}/${slug}`;
      });
  } catch (e) {
    // Báo lỗi nếu không đọc được thư mục
    console.warn(`Lỗi khi đọc thư mục ${dirPath}. Sitemap có thể không đầy đủ.`);
    return [];
  }
}

// (MỚI) Chạy hàm để lấy tất cả URL
const cardUrls = getDynamicRoutes('cards', 'https://phogotarot.com/y-nghia-la-bai');
const blogUrls = getDynamicRoutes('blog', 'https://phogotarot.com/blog');

// (MỚI) Gộp tất cả URL lại
const allCustomPages = [...cardUrls, ...blogUrls];

// --- Cấu hình Astro ---

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'server',
  adapter: netlify(),
  
  integrations: [
    sitemap({
      // (MỚI) Cung cấp danh sách URL động cho sitemap
      customPages: allCustomPages,

      // (MỚI) Lọc bỏ các trang không cần thiết
      filter: (page) => {
        // page là URL đầy đủ, ví dụ: https://phogotarot.com/about-us
        const parsedUrl = new URL(page);
        
        // Loại bỏ các trang phân trang (nếu nó vô tình thấy)
        if (parsedUrl.searchParams.has('page')) {
          return false;
        }
        
        // Loại bỏ các trang admin
        if (parsedUrl.pathname.startsWith('/admin')) {
          return false;
        }
        
        return true;
      }
    })
  ]
});