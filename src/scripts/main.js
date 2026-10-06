/* ============================================================
   BOARELLI AUTOMAZIONI — script
   1. Menu mobile
   2. Header: stato "scrolled"
   3. Reveal allo scroll (a cascata tra fratelli)
   4. Disegno tecnico dell'hero: tracciamento linee
   Nessuna dipendenza. Senza JS il sito resta completo e navigabile.
   ============================================================ */
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. Menu mobile ---------- */
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');

    if (header && toggle && nav) {
        const setOpen = (open) => {
            nav.classList.toggle('is-open', open);
            header.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
        };

        toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
        nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setOpen(false);
                toggle.focus();
            }
        });
        // tornando a desktop il pannello va resettato
        window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    /* ---------- 2. Header: bordo dopo il primo scroll ---------- */
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- 3. Reveal allo scroll ---------- */
    const items = document.querySelectorAll('[data-reveal]');
    if (items.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('is-visible'));
        } else {
            // ritardo progressivo tra fratelli nello stesso contenitore
            const counts = new Map();
            items.forEach((el) => {
                const n = counts.get(el.parentElement) || 0;
                if (n) el.style.setProperty('--reveal-delay', Math.min(n, 5) * 0.07 + 's');
                counts.set(el.parentElement, n + 1);
            });
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
            items.forEach((el) => io.observe(el));
        }
    }

    /* ---------- 4. Disegno tecnico: le linee si tracciano una volta ---------- */
    const drawing = document.querySelector('.cell-drawing');
    if (drawing) {
        if (!reduceMotion) {
            drawing.querySelectorAll('.d-group :is(path, rect, circle, line):not(.d-dash)').forEach((el) => el.setAttribute('pathLength', '1'));
            drawing.classList.add('is-drawing');
        }
        drawing.classList.add('is-ready');
    }
})();
