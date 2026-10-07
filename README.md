# Boarelli Automazioni — sito

Sito **completamente statico** (HTML/CSS/JS, nessun backend, nessun PHP, nessuna form).
Hosting consigliato: qualsiasi hosting statico / Pages. Contatti via `mailto:` e `tel:`.

## Struttura

```
src/
  layouts/base.html      layout comune (<head>, SEO, header, footer)
  pages/                 index.html, privacy.html (front-matter in commento + contenuto)
  components/            partial: header, footer, hero, sezioni, JSON-LD
  styles/                tokens.css (palette industriale, font, spaziature), base, components, layout/, sections/
  scripts/main.js        menu mobile, sezione attiva, reveal, moduli servizi, pipeline, pannello richiesta
  assets/fonts/          Barlow, Barlow Semi Condensed, JetBrains Mono (self-hosted, woff2, OFL)
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

## Identità visiva

Linguaggio "controllo industriale": nero macchina, grigi acciaio, blu del logo (#2664bb) come
accento di marca (CTA, selezioni, segnali); verde/ambra/rosso solo per gli stati. Il monospace è
riservato ai dati tecnici (codici modulo, I/O, stati). Elementi ricorrenti: pannelli con
barra titolo, indicatori `[ OK ]` / LED, linee di segnale animate, barra di stato sistema.
Il sito non usa fotografie: la hero è uno schema SVG di cella robotizzata (versione estesa
e compatta per mobile), le applicazioni usano simboli tecnici inline.
