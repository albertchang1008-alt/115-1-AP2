import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { sites, miMaterialSlugs, siteId } from './shared/site';
export default defineConfig(({ mode }) => {
  const id = siteId(process.env.VITE_SITE_ID || loadEnv(mode, process.cwd(), '').VITE_SITE_ID || 'ap2');
  const site = sites[id];
  const guide = () => fs.readFileSync('public/guide/index.html', 'utf8').replaceAll('__SITE_TITLE__', site.title).replaceAll('__SITE_URL__', site.url);
  return {
    plugins: [react(), {
      name: 'course-site-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split('?')[0] === '/guide/' || req.url?.split('?')[0] === '/guide/index.html') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(guide()); } else next();
        });
      },
      writeBundle(options) {
        const out = options.dir || 'dist';
        fs.writeFileSync(path.join(out, 'guide/index.html'), guide());
        if (id === 'mi') {
          for (const entry of fs.readdirSync(path.join(out, 'materials'), { withFileTypes: true })) {
            if (entry.isDirectory() && !miMaterialSlugs.includes(entry.name)) fs.rmSync(path.join(out, 'materials', entry.name), { recursive: true });
          }
        }
        if (site.legacyCHP) for (const entry of fs.readdirSync('site-assets/mi')) fs.copyFileSync(path.join('site-assets/mi', entry), path.join(out, entry));
        fs.writeFileSync(path.join(out, 'site.json'), JSON.stringify({ id, ...site }, null, 2));
      },
    }],
    define: { __SITE_ID__: JSON.stringify(id) },
    base: './',
    build: { chunkSizeWarningLimit: 900 },
  };
});
