/* ============================================================
   Anteprima locale: serve la cartella dist/ (il sito che pubblicherai).
   Uso:  npm run build && npm run preview   ->  http://localhost:8080
   ============================================================ */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = new URL('./dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = path.join(DIST, path.normalize(urlPath));
    if (!filePath.startsWith(DIST)) { res.writeHead(403); res.end('403'); return; }

    readFile(filePath)
        .then((buf) => {
            res.writeHead(200, { 'content-type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
            res.end(buf);
        })
        .catch(() => { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404 - ' + urlPath); });
}).listen(PORT, () => console.log(`\n  Anteprima:  http://localhost:${PORT}\n`));
