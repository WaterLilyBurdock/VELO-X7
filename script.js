(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  const burger = document.getElementById('burgerBtn');
  const drawer = document.getElementById('mobDrawer');
  const loader = document.getElementById('loader');
  const loaderPct = document.getElementById('loaderPct');
  const loaderFill = document.getElementById('loaderFill');

  burger?.addEventListener('click', () => {
    const open = drawer?.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(!!open));
  });
  drawer?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => drawer.classList.remove('is-open'));
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 36);
  }, { passive: true });

  document.getElementById('driveForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const st = document.getElementById('driveStatus');
    if (st) st.textContent = 'Заявка отправлена! Мастер свяжется с вами для записи на тест-райд VELO X7.';
    e.target.reset();
  });

  /* Загрузочный экран */
  const setLoaderProgress = (val) => {
    if (loaderPct) loaderPct.textContent = `${String(val).padStart(2, '0')}%`;
    if (loaderFill) loaderFill.style.width = `${val}%`;
  };

  const hideLoader = () => {
    if (!loader || loader.dataset.done) return;
    loader.dataset.done = '1';
    setLoaderProgress(100);
    document.body.classList.remove('is-loading');

    if (!prefersReducedMotion && typeof gsap !== 'undefined') {
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.65,
        delay: 0.18,
        ease: 'power4.inOut',
        onComplete: () => {
          loader.remove();
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        },
      });
    } else {
      loader.remove();
    }
  };

  if (prefersReducedMotion || typeof gsap === 'undefined') {
    hideLoader();
    document.querySelectorAll('.counter').forEach((el) => {
      el.textContent = el.dataset.target || '0';
    });
    return;
  }

  let pct = 12;
  setLoaderProgress(pct);
  const pctTimer = setInterval(() => {
    pct = Math.min(96, pct + 14);
    setLoaderProgress(pct);
  }, 70);
  const finishLoading = () => { clearInterval(pctTimer); hideLoader(); };
  if (document.readyState === 'complete') {
    setTimeout(finishLoading, 380);
  } else {
    window.addEventListener('load', () => setTimeout(finishLoading, 380), { once: true });
  }
  setTimeout(finishLoading, 1300);

  gsap.registerPlugin(ScrollTrigger);

  /* --------------------------------------------------------------------------
     2D Motion-графика велосипеда VELO X7 (GSAP)
     -------------------------------------------------------------------------- */
  /* Отрисовка рамы велосипеда (draw-in) */
  document.querySelectorAll('.bike-frame, .bike-accent').forEach((path, idx) => {
    if (typeof path.getTotalLength !== 'function') return;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.15,
      delay: 0.75 + idx * 0.1,
      ease: 'power3.out',
    });
  });

  /* Переключение цвета рамы */
  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('is-active', s === btn));
      const col = btn.dataset.color || '#38bdf8';
      document.documentElement.style.setProperty('--bike-color', col);
    });
  });

  /* Переключение режимов скорости (Спринт / Круиз / Подъём) */
  const modeSpecs = {
    sprint: { wheel: '0.65s', crank: '0.95s', wind: '0.75s', road: '0.6s', telemetry: '48 КМ/Ч · 310 ВТ', label: 'РЕЖИМ: СПРИНТ' },
    cruise: { wheel: '1.15s', crank: '1.65s', wind: '1.25s', road: '1.05s', telemetry: '30 КМ/Ч · 185 ВТ', label: 'РЕЖИМ: КРУИЗ' },
    climb: { wheel: '1.9s', crank: '2.4s', wind: '2.0s', road: '1.75s', telemetry: '18 КМ/Ч · 260 ВТ', label: 'РЕЖИМ: ПОДЪЁМ' },
  };
  const telemetryEl = document.getElementById('telemetryReadout');
  const modeBadge = document.getElementById('modeBadge');

  document.querySelectorAll('.cam-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = modeSpecs[btn.dataset.mode];
      if (!m) return;
      document.querySelectorAll('.cam-btn[data-mode]').forEach((b) => b.classList.toggle('is-active', b === btn));
      const root = document.documentElement.style;
      root.setProperty('--wheel-dur', m.wheel);
      root.setProperty('--crank-dur', m.crank);
      root.setProperty('--wind-dur', m.wind);
      root.setProperty('--road-dur', m.road);
      if (telemetryEl) telemetryEl.textContent = m.telemetry;
      if (modeBadge) modeBadge.textContent = m.label;
    });
  });

  /* Motion-дизайн интерфейса и скролл-анимации */
  gsap.to('.scroll-bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: true },
  });

  gsap.fromTo('.title-word', { yPercent: 115 }, { yPercent: 0, duration: 0.95, stagger: 0.1, ease: 'power4.out', delay: 0.15 });

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 96%', once: true } }
    );
  });

  document.querySelectorAll('.counter').forEach((el) => {
    const target = Number(el.dataset.target || 0);
    const st = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 96%',
      once: true,
      onEnter: () => {
        gsap.to(st, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(st.v)); } });
      },
    });
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.24);
        yTo((e.clientY - r.top - r.height / 2) * 0.24);
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }
})();
