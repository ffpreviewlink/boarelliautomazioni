# Boarelli Automazioni — sito

Sito **completamente statico** (HTML/CSS/JS, nessun backend, nessun PHP, nessuna form).
Hosting consigliato: qualsiasi hosting statico / Pages. Contatti via `mailto:` e `tel:`.

## Struttura

```
src/
  layouts/base.html      layout comune (<head>, SEO, header, footer)
  pages/                 index.html, privacy.html (front-matter in commento + contenuto)
  components/            partial: header, footer, hero, sezioni, JSON-LD
  styles/                tokens.css (design system), base, components, layout/, sections/
  scripts/main.js        menu mobile, reveal allo scroll, tracciamento disegno hero
  assets/fonts/          IBM Plex Sans/Mono (self-hosted, woff2)
  assets/img/            logo, favicon, apple-touch-icon, og-image
public/                  robots.txt, sitemap.xml (copiati in radice)
build.mjs                src/ -> dist/ (include, @import CSS, minificazione)
preview.mjs              server statico locale su dist/
```

## Comandi

```bash
npm install        # solo la prima volta
npm run build      # genera dist/ (da pubblicare)
npm run preview    # http://localhost:8080 (serve dist/)
```

`dist/` e `node_modules/` sono esclusi da git.

## Come si modifica

- **Testi e sezioni**: `src/components/*.html`. Le intestazioni usano `components/section-head.html`.
- **Colori, font, spaziature**: solo in `src/styles/tokens.css`.
- **Meta/SEO di pagina**: front-matter in cima a `src/pages/*.html` (title, description, path).
- **Aggiornare sitemap**: `public/sitemap.xml` (cambiare `lastmod` a ogni modifica rilevante).

## Immagini hero da produrre

Vedere il report di restyle: il sito funziona senza fotografie (la hero usa un disegno
tecnico SVG). Quando saranno disponibili `hero-industrial.webp` ecc. vanno messe in
`src/assets/img/` e inserite nei componenti `hero.html` / `services.html`.
# boarelliautomazioni
# boarelliautomazioni
