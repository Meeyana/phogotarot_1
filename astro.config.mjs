import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'static', // ✅ build toàn site thành HTML
  adapter: netlify(), // ✅ vẫn giữ để dùng function
});
