import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify'; // ✅ đúng cho Astro v5

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'server', // ✅ chỉ còn static hoặc server
  adapter: netlify(), // ✅ dùng gói mới
});
