import 'dotenv/config';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'static', // build site tĩnh
  adapter: netlify({
    edge: false,
  }),
});
