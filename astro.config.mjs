import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'static',
  adapter: netlify({ edge: false }),
});
