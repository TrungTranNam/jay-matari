'use client';

import { useEffect, useRef, useState } from 'react';

// snap-scrolling row with arrows and a progress bar
export default function Rail({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [s, setS] = useState({ pct: .08, atStart: true, atEnd: false, idle: false });

  useEffect(() => {
    const el = track.current!;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pct = max > 4 ? el.scrollLeft / max : 0;
      setS({ pct: Math.max(.08, Math.min(1, pct || .08)), atStart: el.scrollLeft < 6, atEnd: el.scrollLeft > max - 6, idle: max <= 4 });
    };
    el.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    return () => { el.removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, []);

  const scroll = (dir: number) => {
    const el = track.current!;
    const card = el.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 22 : el.clientWidth * .8;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * step * 2, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="rail-wrap">
      <div className="rail-track" ref={track}>{children}</div>
      <div className={`rail-nav ${s.idle ? 'idle' : ''}`}>
        <button className="rail-btn" onClick={() => scroll(-1)} disabled={s.atStart} aria-label="Scroll left"><i className="bx bx-chevron-left" /></button>
        <div className="rail-progress"><span style={{ transform: `scaleX(${s.pct})` }} /></div>
        <button className="rail-btn" onClick={() => scroll(1)} disabled={s.atEnd} aria-label="Scroll right"><i className="bx bx-chevron-right" /></button>
      </div>
    </div>
  );
}
