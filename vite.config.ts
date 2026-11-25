import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function isSafePublicHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

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
              if (!isSafePublicHttpUrl(decoded)) {
                res.statusCode = 403;
                res.end('Forbidden URL');
                return;
              }
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
    build: {
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/qrcode')) {
              return 'vendor-pdf';
            }
            if (id.includes('node_modules/jszip')) {
              return 'vendor-zip';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
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
