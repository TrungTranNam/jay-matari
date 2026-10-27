'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { HeroSlide } from '@/lib/content';
import { img, srcSet } from '@/lib/format';
import { useSwipe } from './useSwipe';

const INTERVAL = 6200;
const pad = (n: number) => String(n + 1).padStart(2, '0');

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [[i, prev], set] = useState([0, -1]);
  const paused = useRef(false);
  const el = useRef<HTMLElement>(null);
  const go = (n: number) => set(([cur]) => {
    n = (n + slides.length) % slides.length;
    return n === cur ? [cur, -1] : [n, cur];
  });

  // restarting on every change also resets the timer after a manual click
  useEffect(() => {
    if (slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!paused.current && !document.hidden) go(i + 1); }, INTERVAL);
    return () => clearInterval(t);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useSwipe(el, () => go(i + 1), () => go(i - 1));

  const pause = (v: boolean) => () => { paused.current = v; };
  return (
    <section ref={el} className="hero-carousel" style={{ '--hc-dur': INTERVAL + 'ms' } as React.CSSProperties}
      onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}
      onKeyDown={e => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); }}>
      <div className="hc-stage">
        {slides.map((s, k) => (
          <div key={k} className={`hc-slide ${k === i ? 'on' : ''} ${k === prev ? 'out' : ''}`} aria-hidden={k !== i}>
            <img src={img(s.img, 1920)} srcSet={srcSet(s.img)} sizes="100vw" alt={s.alt} loading={k ? 'lazy' : undefined} />
          </div>
        ))}
        <div className="hc-veil" />
      </div>
      <div className="hc-inner">
        {slides.map((s, k) => (
          <div key={k} className={`hc-copy ${k === i ? 'on' : ''}`}>
            <div className="eyebrow">{s.eyebrow}</div>
            <h1>{s.title}{s.titleEm && <><br /><em>{s.titleEm}</em></>}</h1>
            <p>{s.text}</p>
            <div className="hero-cta">
              <Link href={s.ctaHref} className="btn btn-solid btn-lg">{s.ctaText}</Link>
              {s.altText && s.altHref && <Link href={s.altHref} className="btn btn-line btn-lg">{s.altText}</Link>}
            </div>
          </div>
        ))}
      </div>
      <div className="hc-controls">
        <button className="hc-arrow" onClick={() => go(i - 1)} aria-label="Previous slide"><i className="bx bx-left-arrow-alt" /></button>
        <div className="hc-dots" role="tablist">
          {slides.map((_, k) => (
            <button key={k} className={`hc-dot ${k === i ? 'on' : ''}`} onClick={() => go(k)}
                    role="tab" aria-label={`Slide ${k + 1}`} aria-selected={k === i}>
              <span className="hc-dot-fill" /></button>
          ))}
        </div>
        <button className="hc-arrow" onClick={() => go(i + 1)} aria-label="Next slide"><i className="bx bx-right-arrow-alt" /></button>
        <div className="hc-counter"><b>{pad(i)}</b><span>/ {String(slides.length).padStart(2, '0')}</span></div>
      </div>
    </section>
  );
}
