(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  const burger = document.getElementById('burgerBtn');
  const drawer = document.getElementById('mobDrawer');
  const loader = document.getElementById('loader');
  const loaderPct = document.getElementById('loaderPct');
  const loaderFill = document.getElementById('loaderFill');
  const inIframe = window.self !== window.top;

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
  window.addEventListener('load', () => setTimeout(finishLoading, 380), { once: true });
  setTimeout(finishLoading, 1300);

  gsap.registerPlugin(ScrollTrigger);

  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

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
      duration: 1.1,
      delay: 0.2 + idx * 0.1,
      ease: 'power3.out',
    });
  });

  /* Бесконечное вращение колёс и шатунов с регулируемой скоростью */
  const wheelAnim = gsap.to('.wheel-spokes', {
    rotation: 360,
    transformOrigin: 'center center',
    duration: 1.2,
    repeat: -1,
    ease: 'none',
  });

  const crankAnim = gsap.to('.crank-spin', {
    rotation: 360,
    transformOrigin: 'center center',
    duration: 1.6,
    repeat: -1,
    ease: 'none',
  });

  const windAnim = gsap.to('.wind-line', {
    x: -90,
    opacity: 0,
    duration: 1.0,
    stagger: 0.2,
    repeat: -1,
    ease: 'power1.in',
  });

  const roadAnim = gsap.to('.road-dash', {
    x: -75,
    opacity: 0.1,
    duration: 0.9,
    stagger: 0.15,
    repeat: -1,
    ease: 'none',
  });

  gsap.to('.bike-chassis', {
    y: -3,
    duration: 1.1,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  });

  /* Бегущая строка Motion-тикера */
  gsap.to('.marquee__track', {
    xPercent: -50,
    duration: 16,
    repeat: -1,
    ease: 'none',
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
    sprint: { scale: 1.5, telemetry: '48 КМ/Ч · 310 ВТ', label: 'РЕЖИМ: СПРИНТ' },
    cruise: { scale: 1.0, telemetry: '30 КМ/Ч · 185 ВТ', label: 'РЕЖИМ: КРУИЗ' },
    climb: { scale: 0.55, telemetry: '18 КМ/Ч · 260 ВТ', label: 'РЕЖИМ: ПОДЪЁМ' },
  };
  const telemetryEl = document.getElementById('telemetryReadout');
  const modeBadge = document.getElementById('modeBadge');

  document.querySelectorAll('.cam-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = modeSpecs[btn.dataset.mode];
      if (!m) return;
      document.querySelectorAll('.cam-btn[data-mode]').forEach((b) => b.classList.toggle('is-active', b === btn));
      [wheelAnim, crankAnim, windAnim, roadAnim].forEach((tw) => {
        gsap.to(tw, { timeScale: m.scale, duration: 0.6, ease: 'power2.out' });
      });
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
      { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }
    );
  });

  document.querySelectorAll('.counter').forEach((el) => {
    const target = Number(el.dataset.target || 0);
    const st = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(st, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(st.v)); } });
      },
    });
  });

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cursor = document.querySelector('.aura-cursor');
  const cursorLabel = document.querySelector('.aura-cursor__label');

  /* Внутри iframe портфолио отключаем кастомный курсор, чтобы он не залагивал */
  if (inIframe && cursor) cursor.remove();

  if (canHover && cursor && !inIframe) {
    let targetX = -100, targetY = -100, curX = -100, curY = -100, rafId = 0;
    const stepCursor = () => {
      curX += (targetX - curX) * 0.36;
      curY += (targetY - curY) * 0.36;
      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      if (Math.abs(targetX - curX) > 0.4 || Math.abs(targetY - curY) > 0.4) {
        rafId = requestAnimationFrame(stepCursor);
      } else {
        rafId = 0;
      }
    };
    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(stepCursor);
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('a, button, .glass-card');
      if (!t) return;
      cursor.classList.add('is-hover');
      const lbl = t.getAttribute('data-cursor');
      if (lbl && cursorLabel) { cursorLabel.textContent = lbl; cursor.classList.add('has-label'); }
    });
    document.addEventListener('mouseout', (e) => {
      const t = e.target.closest('a, button, .glass-card');
      if (!t || t.contains(e.relatedTarget)) return;
      cursor.classList.remove('is-hover', 'has-label');
    });

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
