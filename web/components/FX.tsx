'use client';

import { useEffect } from 'react';

// Motion layer from templates/assets/js/fx.js: scroll progress, reveals, counters,
// magnetic buttons, card tilt. A MutationObserver arms anything React renders later
// (route changes, filtered grids, drawers); reduced motion = still page.
// Dropped: page fade-out on link click (Next navigates client-side).

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const noHover = () => matchMedia('(hover: none)').matches;

function once(sel: string, flag: string, fn: (el: HTMLElement) => void) {
  document.querySelectorAll<HTMLElement>(sel).forEach(el => {
    if (el.dataset[flag]) return;
    el.dataset[flag] = '1';
    fn(el);
  });
}

function countUp(el: HTMLElement) {
  const end = parseFloat(el.dataset.count!), suffix = el.dataset.suffix || '';
  el.dataset.counted = '1';
  const t0 = performance.now();
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / 1400);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function magnetic() {
  once('[data-magnetic], .btn-solid.btn-lg', 'mag', el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

function tilt() {
  once('[data-tilt], .card .card-media', 'tilt', el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      el.style.setProperty('--gx', ((px + .5) * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', ((py + .5) * 100).toFixed(1) + '%');
      el.classList.add('tilting');
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    });
  });
}

export default function FX() {
  useEffect(() => {
    const fill = document.querySelector<HTMLElement>('.scroll-progress span')!;
    const paint = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      fill.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    };
    addEventListener('scroll', paint, { passive: true });
    addEventListener('resize', paint);

    const reduced = still(), hover = !noHover();
    const seen = (cb: (el: HTMLElement) => void, threshold: number, rootMargin = '0px') =>
      new IntersectionObserver(en => en.forEach(e => {
        if (!e.isIntersecting) return;
        cb(e.target as HTMLElement);
        revealIO.unobserve(e.target); countIO.unobserve(e.target);
      }), { threshold, rootMargin });
    const revealIO = seen(el => el.classList.add('in'), .12, '0px 0px -50px');
    const countIO = seen(countUp, .4);

    // observe() on an already-watched element is a no-op, so arming repeatedly is safe
    const arm = () => {
      paint();
      const hidden = document.querySelectorAll<HTMLElement>('.reveal:not(.in), .reveal-words:not(.in)');
      const counts = document.querySelectorAll<HTMLElement>('[data-count]:not([data-counted])');
      if (reduced) {
        hidden.forEach(e => e.classList.add('in'));
        counts.forEach(e => { e.dataset.counted = '1'; e.textContent = e.dataset.count! + (e.dataset.suffix || ''); });
        return;
      }
      once('.reveal-words', 'split', el => {
        el.innerHTML = el.textContent!.trim().split(/\s+/)
          .map((w, i) => `<span class="rw"><span style="--d:${i * 55}ms">${w}</span></span>`).join(' ');
      });
      hidden.forEach(el => revealIO.observe(el));
      counts.forEach(el => countIO.observe(el));
      if (hover) { magnetic(); tilt(); }
    };
    arm();

    let raf = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(arm); });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect(); revealIO.disconnect(); countIO.disconnect(); cancelAnimationFrame(raf);
      removeEventListener('scroll', paint); removeEventListener('resize', paint);
    };
  }, []);

  return <div className="scroll-progress"><span /></div>;
}
