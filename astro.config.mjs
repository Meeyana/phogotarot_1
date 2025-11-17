import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'server', // ✅ build toàn site thành HTML
  adapter: netlify(), // ✅ vẫn giữ để dùng function
});
