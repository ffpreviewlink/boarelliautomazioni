/* ============================================================
   Build statica: src/ -> dist/
   - src/pages/*.html        pagine (front-matter in commento + contenuto)
   - src/layouts/base.html   layout comune (<head>, header, footer)
   - src/components/*.html   partial inclusi con <!-- @include ... -->
   - src/styles/index.css    entry CSS (risolve gli @import e minifica)
   - src/scripts/main.js     JS (minificato)
   - src/assets/             font e immagini  -> dist/assets/
   - public/                 file copiati in radice (robots, sitemap)
   Uso:  npm run build
   ============================================================ */
import { readFile, writeFile, rm, mkdir, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const report = [];

/* ---------- template: front-matter, include, variabili ---------- */

// front-matter: primo commento HTML con righe "chiave: valore"
function parseFrontMatter(source) {
    const m = source.match(/^\s*<!--([\s\S]*?)-->\s*/);
    const meta = {};
    if (!m) return { meta, body: source };
    for (const line of m[1].split('\n')) {
        const kv = line.match(/^\s*([\w-]+):\s*(.*?)\s*$/);
        if (kv) meta[kv[1]] = kv[2];
    }
    return { meta, body: source.slice(m[0].length) };
}

// <!-- @include components/x.html chiave="valore" -->  (ricorsivo)
async function resolveIncludes(html, vars, stack = []) {
    const re = /<!--\s*@include\s+(\S+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g;
    let out = '';
    let last = 0;
    for (const m of html.matchAll(re)) {
        const [full, file, attrs] = m;
        const abs = path.join(SRC, file);
        if (stack.includes(abs)) throw new Error(`Include circolare: ${file}`);
        if (!existsSync(abs)) throw new Error(`Include non trovato: ${file}`);
        const local = { ...vars };
        for (const a of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) local[a[1]] = a[2];
        let part = await readFile(abs, 'utf8');
        part = part.replace(/^\s*<!--[\s\S]*?-->\s*/, (c) => (/@include/.test(c) ? c : ''));
        part = await resolveIncludes(part, local, [...stack, abs]);
        out += html.slice(last, m.index) + applyVars(part, local);
        last = m.index + full.length;
    }
    return out + html.slice(last);
}

// {{chiave}} -> valore; i segnaposto sconosciuti vengono lasciati (verificati a fine pagina)
function applyVars(html, vars) {
    return html.replace(/\{\{(\w+)\}\}/g, (all, key) => (key in vars ? vars[key] : all));
}

async function renderPage(file) {
    const { meta, body } = parseFrontMatter(await readFile(path.join(SRC, 'pages', file), 'utf8'));
    const layout = await readFile(path.join(SRC, 'layouts', (meta.layout || 'base') + '.html'), 'utf8');
    const vars = {
        base: '',
        year: String(new Date().getFullYear()),
        ...meta,
    };
    const page = await resolveIncludes(body, vars);
    const head = meta.head ? await resolveIncludes(`<!-- @include ${meta.head} -->`, vars) : '';
    let html = layout.replace('{{content}}', () => page).replace('{{head_extra}}', () => head);
    html = await resolveIncludes(html, vars);
    html = applyVars(html, vars);
    const left = html.match(/\{\{\w+\}\}/);
    if (left) throw new Error(`${file}: segnaposto non risolto ${left[0]}`);
    return html;
}

/* ---------- CSS: risolve @import ricorsivamente e minifica ---------- */
async function inlineCss(file, seen = new Set()) {
    if (seen.has(file)) return '';
    seen.add(file);
    const src = await readFile(file, 'utf8');
    let out = '';
    let last = 0;
    for (const m of src.matchAll(/@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/g)) {
        out += src.slice(last, m.index) + (await inlineCss(path.resolve(path.dirname(file), m[1]), seen));
        last = m.index + m[0].length;
    }
    return out + src.slice(last);
}

// minifica il contenuto degli <script> inline (es. JSON-LD resta intatto: tipo non JS)
async function minifyInlineScripts(html) {
    const re = /(<script(?![^>]*\bsrc\b)(?![^>]*type="application\/ld\+json")[^>]*>)([\s\S]*?)(<\/script>)/gi;
    let out = '';
    let last = 0;
    for (const m of html.matchAll(re)) {
        const [full, open, code, close] = m;
        out += html.slice(last, m.index);
        if (code.trim()) {
            const r = await minifyJs(code, { format: { comments: false } });
            out += open + r.code + close;
        } else {
            out += full;
        }
        last = m.index + full.length;
    }
    return out + html.slice(last);
}

async function run() {
    await rm(DIST, { recursive: true, force: true });
    await mkdir(path.join(DIST, 'assets'), { recursive: true });

    // ---- CSS ----
    {
        const src = await inlineCss(path.join(SRC, 'styles', 'index.css'));
        // level 1: solo ottimizzazioni sicure (nessun riordino di regole)
        const out = new CleanCSS({ level: 1 }).minify(src);
        if (out.errors.length) throw new Error('CSS: ' + out.errors.join(', '));
        if (out.warnings.length) console.warn('CSS warning:\n  ' + out.warnings.join('\n  '));
        await mkdir(path.join(DIST, 'assets', 'css'), { recursive: true });
        await writeFile(path.join(DIST, 'assets', 'css', 'style.css'), out.styles);
        report.push(['style.css', src.length, out.styles.length]);
    }

    // ---- JS ----
    {
        const src = await readFile(path.join(SRC, 'scripts', 'main.js'), 'utf8');
        const out = await minifyJs(src, { compress: { passes: 2 }, format: { comments: false } });
        await mkdir(path.join(DIST, 'assets', 'js'), { recursive: true });
        await writeFile(path.join(DIST, 'assets', 'js', 'main.js'), out.code);
        report.push(['main.js', src.length, out.code.length]);
    }

    // ---- HTML ----
    for (const file of (await readdir(path.join(SRC, 'pages'))).filter((f) => f.endsWith('.html'))) {
        const rendered = await renderPage(file);
        let out = await minifyHtml(rendered, {
            collapseWhitespace: true,
            conservativeCollapse: false,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyCSS: true,
            // gli <script> inline li minifichiamo noi con terser (mantiene il ';' finale)
            minifyJS: false,
            sortAttributes: true,
            sortClassName: true,
        });
        out = await minifyInlineScripts(out);
        await writeFile(path.join(DIST, file), out);
        report.push([file, rendered.length, out.length]);
    }

    // ---- asset e file pubblici ----
    for (const sub of ['fonts', 'img']) {
        await cp(path.join(SRC, 'assets', sub), path.join(DIST, 'assets', sub), { recursive: true });
    }
    await cp(path.join(ROOT, 'public'), DIST, { recursive: true });

    // ---- resoconto ----
    console.log('\n  file            sorgente     minificato    risparmio');
    console.log('  ----------------------------------------------------------');
    for (const [name, a, b] of report) {
        const pct = (100 - (b / a) * 100).toFixed(0);
        console.log('  ' + name.padEnd(15) + kb(a).padStart(9) + '   ' + kb(b).padStart(9) + '   ' + (pct + '%').padStart(8));
    }
    console.log('\n  dist/ pronta da pubblicare.\n');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
