import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';
// https://astro.build/config
export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'hybrid',
  adapter: netlify(),
});
