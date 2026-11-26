(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Навигация и форма записи */
  const initNavAndForm = () => {
    const header = document.querySelector('.header');
    const burger = document.getElementById('burgerBtn');
    const drawer = document.getElementById('mobDrawer');

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
  };

  /* 2. Загрузочный экран */
  const initLoader = () => {
    const loader = document.getElementById('loader');
    const loaderPct = document.getElementById('loaderPct');
    const loaderFill = document.getElementById('loaderFill');

    const setProgress = (val) => {
      if (loaderPct) loaderPct.textContent = `${String(val).padStart(2, '0')}%`;
      if (loaderFill) loaderFill.style.width = `${val}%`;
    };

    const hideLoader = () => {
      if (!loader || loader.dataset.done) return;
      loader.dataset.done = '1';
      setProgress(100);
      document.body.classList.remove('is-loading');

      if (!prefersReducedMotion && typeof gsap !== 'undefined') {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.65,
          delay: 0.15,
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
      return;
    }

    let pct = 15;
    setProgress(pct);
    const pctTimer = setInterval(() => {
      pct = Math.min(96, pct + 15);
      setProgress(pct);
    }, 65);
    const finish = () => { clearInterval(pctTimer); hideLoader(); };
    if (document.readyState === 'complete') setTimeout(finish, 340);
    else window.addEventListener('load', () => setTimeout(finish, 340), { once: true });
    setTimeout(finish, 1200);
  };

  /* 3. Перекраска рамы велосипеда и режимы скорости */
  const applyBikeColor = (hex) => {
    const color = hex || '#38bdf8';
    document.documentElement.style.setProperty('--bike-color', color);
    document.querySelectorAll('.bike-frame, .wind-line').forEach((el) => { el.style.stroke = color; });
    document.querySelectorAll('.bike-hub').forEach((el) => { el.style.fill = color; });
    document.querySelectorAll('.swatch').forEach((s) => {
      s.classList.toggle('is-active', (s.dataset.color || '').toLowerCase() === color.toLowerCase());
    });
  };

  const initBikeControls = () => {
    document.querySelectorAll('.swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyBikeColor(btn.dataset.color);
        if (!prefersReducedMotion && typeof gsap !== 'undefined') {
          gsap.fromTo('.motion-stage', { scale: 0.985 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
        }
      });
    });

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
        if (!prefersReducedMotion && typeof gsap !== 'undefined') {
          gsap.fromTo([telemetryEl, modeBadge], { y: -4, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
        }
      });
    });
  };

  /* 4. Калькулятор ростовки рамы */
  const initSizingCalculator = () => {
    const range = document.getElementById('heightRange');
    const heightVal = document.getElementById('heightValue');
    const frameOut = document.getElementById('frameSizeOut');
    const stemOut = document.getElementById('stemOut');
    const barOut = document.getElementById('barOut');
    let fitMode = 'road';

    const updateSizing = () => {
      const h = Number(range?.value || 178);
      if (heightVal) heightVal.textContent = `${h} см`;

      let size = 'M · 54';
      let stem = 100;
      let bar = 420;
      if (h < 165) { size = 'XS · 49'; stem = 80; bar = 380; }
      else if (h < 173) { size = 'S · 52'; stem = 90; bar = 400; }
      else if (h < 181) { size = 'M · 54'; stem = 100; bar = 420; }
      else if (h < 189) { size = 'L · 56'; stem = 110; bar = 440; }
      else { size = 'XL · 58'; stem = 120; bar = 440; }

      if (fitMode === 'gravel') {
        stem = Math.max(70, stem - 10);
        bar += 20;
      }
      if (frameOut) frameOut.textContent = size;
      if (stemOut) stemOut.textContent = `${stem} мм`;
      if (barOut) barOut.textContent = `${bar} мм`;
    };

    range?.addEventListener('input', updateSizing);
    document.querySelectorAll('.cam-btn[data-fit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        fitMode = btn.dataset.fit || 'road';
        document.querySelectorAll('.cam-btn[data-fit]').forEach((b) => b.classList.toggle('is-active', b === btn));
        updateSizing();
      });
    });
    updateSizing();
  };

  /* 5. Выбор комплектации и FAQ */
  const initBuildsAndFaq = () => {
    document.querySelectorAll('.select-build').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.build-card');
        if (!card) return;
        applyBikeColor(card.dataset.color);
        document.querySelectorAll('.select-build').forEach((b) => b.classList.toggle('is-active', b === btn));
        const st = document.getElementById('driveStatus');
        if (st) st.textContent = `Выбрана сборка: ${card.dataset.build}. Оставьте телефон для бронирования.`;
        document.getElementById('testdrive')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.querySelectorAll('#faqList .faq-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const open = item?.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(!!open));
      });
    });
  };

  /* 6. GSAP Motion-анимации */
  const initMotion = () => {
    if (prefersReducedMotion || typeof gsap === 'undefined') {
      document.querySelectorAll('.counter').forEach((el) => { el.textContent = el.dataset.target || '0'; });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.bike-frame, .bike-accent').forEach((path, idx) => {
      if (typeof path.getTotalLength !== 'function') return;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, { strokeDashoffset: 0, duration: 1.15, delay: 0.75 + idx * 0.1, ease: 'power3.out' });
    });

    gsap.to('.scroll-bar', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: true },
    });

    gsap.fromTo('.title-word', { yPercent: 115 }, { yPercent: 0, duration: 0.95, stagger: 0.1, ease: 'power4.out', delay: 0.25 });

    gsap.to('.hero__ambient', {
      scale: 1.12,
      opacity: 0.75,
      duration: 3.2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });

    gsap.from('.motion-stage', {
      opacity: 0,
      y: 26,
      scale: 0.96,
      duration: 0.85,
      delay: 0.4,
      ease: 'power3.out',
      clearProps: 'transform',
    });

    gsap.utils.toArray('.cards-grid').forEach((grid) => {
      gsap.from(grid.querySelectorAll('.glass-card'), {
        opacity: 0,
        y: 24,
        scale: 0.96,
        duration: 0.65,
        stagger: 0.09,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: grid, start: 'top 92%', once: true },
      });
    });

    gsap.utils.toArray('.reveal').forEach((el) => {
      if (el.classList.contains('glass-card')) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 95%', once: true } }
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
  };

  /* Фолбэк изображений велосипедов */
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.dataset.fb) return;
      img.dataset.fb = '1';
      const label = encodeURIComponent(img.dataset.fallback || 'VELO X7');
      img.src = `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230B0E14"/><circle cx="230" cy="310" r="85" stroke="%2338BDF8" stroke-width="6" fill="none"/><circle cx="570" cy="310" r="85" stroke="%2338BDF8" stroke-width="6" fill="none"/><path d="M230 310 L365 310 L495 190 L330 190 Z M570 310 L495 190" stroke="%23F3F4F6" stroke-width="7" fill="none" stroke-linejoin="round"/><text x="48" y="88" fill="%2338BDF8" font-family="sans-serif" font-size="30" font-weight="700">${label}</text></svg>`;
    });
  });

  initNavAndForm();
  initLoader();
  initBikeControls();
  initSizingCalculator();
  initBuildsAndFaq();
  initMotion();
})();
