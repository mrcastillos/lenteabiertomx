import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'download-proxy-middleware',
        configureServer(server) {
          server.middlewares.use('/api/download', async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            const urlObj = new URL(req.url || '', 'http://localhost:3000');
            const targetUrl = urlObj.searchParams.get('url');
            const filename = urlObj.searchParams.get('filename') || 'LenteAbiertoMX_foto.jpg';

            if (!targetUrl) {
              res.statusCode = 400;
              res.end('Missing url');
              return;
            }

            try {
              const decoded = decodeURIComponent(targetUrl);
              const fetchRes = await fetch(decoded, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                  Accept: 'image/*,*/*;q=0.8',
                },
                redirect: 'follow',
              });

              if (!fetchRes.ok) {
                res.statusCode = fetchRes.status;
                res.end(`Error fetching remote image: ${fetchRes.statusText}`);
                return;
              }

              const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
              const arrayBuffer = await fetchRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const safeFilename = encodeURIComponent(filename);

              res.setHeader('Content-Type', contentType.includes('image') ? contentType : 'image/jpeg');
              res.setHeader('Content-Length', buffer.length);
              res.setHeader(
                'Content-Disposition',
                `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`
              );
              res.statusCode = 200;
              res.end(buffer);
            } catch (err: any) {
              res.statusCode = 500;
              res.end(err?.message || 'Proxy error');
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
