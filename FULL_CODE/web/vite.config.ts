import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DJANGO_PROXY_TARGET || 'http://127.0.0.1:8000';
  const port = Number(env.VITE_PORT || 5173);
  const configuredPublicUrl = env.VITE_PUBLIC_SITE_URL?.trim();
  const publicSiteUrl = configuredPublicUrl ? new URL(configuredPublicUrl) : null;

  if (
    publicSiteUrl &&
    (publicSiteUrl.protocol !== 'https:' ||
      publicSiteUrl.pathname !== '/' ||
      publicSiteUrl.search ||
      publicSiteUrl.hash)
  ) {
    throw new Error('VITE_PUBLIC_SITE_URL must be an HTTPS origin without a path or query.');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('VITE_PORT must be an integer between 1 and 65535.');
  }

  const publicSearchFiles: Plugin = {
    name: 'public-search-files',
    apply: 'build',
    transformIndexHtml(html) {
      if (!publicSiteUrl) return html;
      const base = publicSiteUrl.origin;
      const headMetadata = [
        `<link rel="canonical" href="${base}/" />`,
        '<meta property="og:type" content="website" />',
        '<meta property="og:title" content="ArogyaSathi | Primary Healthcare Coordination" />',
        '<meta property="og:description" content="ArogyaSathi helps primary health centres and sub-centres coordinate frontline care, family records, schedules, and reports." />',
        `<meta property="og:url" content="${base}/" />`,
        `<meta property="og:image" content="${base}/og-image.jpg" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:image" content="${base}/og-image.jpg" />`,
      ].join('\n    ');
      return html.replace('</head>', `    ${headMetadata}\n  </head>`);
    },
    closeBundle() {
      if (!publicSiteUrl) {
        console.info('VITE_PUBLIC_SITE_URL is unset; sitemap.xml will be generated at deployment.');
        return;
      }

      const base = publicSiteUrl.origin;
      const publicRoutes = ['/'];
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...publicRoutes.map((route) => `  <url><loc>${base}${route}</loc></url>`),
        '</urlset>',
        '',
      ].join('\n');
      const robots = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /app/',
        'Disallow: /api/',
        'Disallow: /admin/',
        'Disallow: /login',
        'Disallow: /demo',
        'Disallow: /fractal',
        `Sitemap: ${base}/sitemap.xml`,
        '',
      ].join('\n');

      mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true });
      writeFileSync(path.resolve(__dirname, 'dist/sitemap.xml'), sitemap);
      writeFileSync(path.resolve(__dirname, 'dist/robots.txt'), robots);
    },
  };

  return {
    plugins: [react(), publicSearchFiles],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port,
      proxy: Object.fromEntries(
        ['/api', '/logout', '/admin'].map((route) => [
          route,
          {
            target: proxyTarget,
            changeOrigin: true,
          },
        ]),
      ),
    },
  };
});
