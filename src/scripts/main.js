/* ============================================================
   BOARELLI AUTOMAZIONI — script
   1. Menu mobile
   2. Voce di menu della sezione attiva
   3. Reveal allo scroll
   4. Moduli di servizio (elenco + pannello ispettore)
   5. Pipeline di processo
   6. Pannello richiesta: i tipi di progetto compilano la mail
   Nessuna dipendenza. Senza JS il sito resta completo e navigabile.
   ============================================================ */
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 960px)');

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
        window.matchMedia('(min-width: 1080px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    /* ---------- 2. Sezione attiva nel menu ---------- */
    const links = [...document.querySelectorAll('.site-nav__list a[href*="#"]')];
    const sections = [...document.querySelectorAll('main > section[id], main > .hero')];
    if (links.length && sections.length && 'IntersectionObserver' in window) {
        const byId = new Map(links.map((a) => [a.getAttribute('href').split('#')[1], a]));
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((a) => a.removeAttribute('aria-current'));
                const link = byId.get(entry.target.id);
                if (link) link.setAttribute('aria-current', 'true');
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach((sec) => spy.observe(sec));
    }

    /* ---------- 3. Reveal allo scroll ---------- */
    const items = document.querySelectorAll('[data-reveal]');
    if (items.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('is-visible'));
        } else {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
            items.forEach((el) => io.observe(el));
        }
    }

    /* ---------- 4. Moduli di servizio ---------- */
    const mods = document.querySelector('[data-mods]');
    if (mods) {
        const all = [...mods.querySelectorAll('.mod')];
        const setActive = (mod, allowClose) => {
            const wasActive = mod.classList.contains('is-active');
            all.forEach((m) => {
                const on = m === mod && !(wasActive && allowClose && !desktop.matches);
                m.classList.toggle('is-active', on);
                m.querySelector('.mod__btn').setAttribute('aria-expanded', String(on));
            });
        };
        all.forEach((mod, i) => {
            const head = mod.querySelector('.mod__head');
            const panel = mod.querySelector('.mod__panel');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mod__btn';
            btn.id = `mod-btn-${i + 1}`;
            panel.id = `mod-panel-${i + 1}`;
            btn.setAttribute('aria-controls', panel.id);
            btn.append(...head.childNodes);
            head.append(btn);
            panel.setAttribute('role', 'region');
            panel.setAttribute('aria-labelledby', btn.id);
            btn.addEventListener('click', () => setActive(mod, true));
            // su desktop con mouse: l'anteprima segue il puntatore
            btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && desktop.matches) setActive(mod, false); });
        });
        setActive(all[0], false);
    }

    /* ---------- 5. Pipeline di processo ---------- */
    const pipe = document.querySelector('[data-pipe]');
    if (pipe) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            pipe.classList.add('is-live');
        } else {
            const po = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) { pipe.classList.add('is-live'); po.disconnect(); }
            }, { threshold: 0.25 });
            po.observe(pipe);
        }
    }

    /* ---------- 6. Pannello richiesta ---------- */
    const typeList = document.querySelector('[data-types]');
    const cta = document.querySelector('[data-inquiry-cta]');
    if (typeList && cta) {
        const base = new URL(cta.getAttribute('href'));
        const baseBody = base.searchParams.get('body') || '';
        const baseSubject = base.searchParams.get('subject') || '';
        const picked = new Set();
        const update = () => {
            const kinds = [...picked].join(', ');
            const subject = kinds ? `${baseSubject}: ${kinds}` : baseSubject;
            const body = (kinds ? `Tipo di progetto: ${kinds}\r\n` : '') + baseBody;
            cta.setAttribute('href', `${base.protocol}${base.pathname}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
            const state = document.querySelector('.inquiry .state');
            if (state) {
                state.textContent = picked.size ? 'Pronta' : 'In attesa';
                state.classList.toggle('state--warn', !picked.size);
            }
        };
        typeList.querySelectorAll('li').forEach((li) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = li.textContent;
            li.textContent = '';
            li.append(btn);
            btn.addEventListener('click', () => {
                const on = btn.getAttribute('aria-pressed') !== 'true';
                btn.setAttribute('aria-pressed', String(on));
                on ? picked.add(btn.textContent) : picked.delete(btn.textContent);
                update();
            });
        });
    }
})();
