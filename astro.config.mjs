import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// --- Cấu hình Astro ---

export default defineConfig({
  site: 'https://phogotarot.com',
  output: 'server',
  redirects: {
    '/tarot': '/xem-tarot',
    '/blog/moi-lien-he-giua-than-so-hoc-numerology-va-tarot-khien-ban-thau-hieu-hon-ve-ban-than-va-so-phan-cua-minh': '/blog/moi-lien-he-giua-than-so-hoc-va-tarot'
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    routes: {
      strategy: 'include'
    }
  }),
  integrations: [
    sitemap({
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