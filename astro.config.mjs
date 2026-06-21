import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

const noIndexPaths = [
  '/admin',
  '/api',
  '/auth',
  '/forgot-password',
  '/history',
  '/login',
  '/nap-credit',
  '/profile',
  '/register',
  '/reset-password'
];

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

        if (parsedUrl.searchParams.has('page')) return false;
        if (noIndexPaths.some(path => parsedUrl.pathname === path || parsedUrl.pathname.startsWith(`${path}/`))) {
          return false;
        }

        return true;
      }
    })
  ]
});
