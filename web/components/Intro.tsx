'use client';

import { useCallback, useEffect, useState } from 'react';
import { MarkPaths } from './Logo';

// Opening sequence: once per session, skipped for reduced motion.
// Footer's "Play the opening again" fires `jmc:replay-intro`.
const SEEN = 'jmc_intro_seen';

export default function Intro() {
  const [phase, setPhase] = useState<'off' | 'on' | 'playing' | 'parting'>('off');

  const start = useCallback(() => {
    sessionStorage.setItem(SEEN, '1');
    setPhase('on');
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase('playing')));
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem(SEEN)) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) sessionStorage.setItem(SEEN, '1');
      else start();
    }
    addEventListener('jmc:replay-intro', start);
    return () => removeEventListener('jmc:replay-intro', start);
  }, [start]);

  const finish = useCallback(() => setPhase(p => (p === 'on' || p === 'playing' ? 'parting' : p)), []);

  useEffect(() => {
    if (phase === 'off') return;
    document.documentElement.classList.toggle('intro-lock', phase !== 'parting');
    if (phase === 'parting') { const t = setTimeout(() => setPhase('off'), 1200); return () => clearTimeout(t); }
    const t = setTimeout(finish, 4200);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    addEventListener('keydown', esc);
    return () => { clearTimeout(t); removeEventListener('keydown', esc); };
  }, [phase, finish]);

  if (phase === 'off') return null;
  return (
    <div className={`intro-veil ${phase === 'playing' ? 'playing' : ''} ${phase === 'parting' ? 'playing parting' : ''}`} role="presentation">
      <div className="veil-panel veil-l" />
      <div className="veil-panel veil-r" />
      <div className="intro-core">
        <svg className="intro-ring" viewBox="0 0 180 180" aria-hidden="true">
          <circle className="ring-line" cx="90" cy="90" r="80" />
          <g className="ring-ticks">
            {Array.from({ length: 36 }, (_, i) =>
              <line key={i} className="ring-tick" style={{ '--i': i } as React.CSSProperties}
                    x1="90" y1="6" x2="90" y2={i % 3 === 0 ? 14 : 10} transform={`rotate(${i * 10} 90 90)`} />)}
          </g>
        </svg>
        <svg className="intro-mark" viewBox="0 0 64 68" aria-hidden="true">
          <defs>
            <linearGradient id="zari" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--gold)" />
              <stop offset=".45" stopColor="var(--gold-hi)" />
              <stop offset="1" stopColor="var(--gold)" />
            </linearGradient>
          </defs>
          <MarkPaths p="i-" />
        </svg>
        <div className="intro-words">
          <div className="iw-line" aria-hidden="true" />
          <h1 className="iw-name">Jay&nbsp;Mataji</h1>
          <p className="iw-sub">Creation</p>
          <div className="iw-line" aria-hidden="true" />
          <p className="iw-tag">Hand embroidery · Ahmedabad</p>
        </div>
        <div className="intro-bar"><span /></div>
      </div>
      <button className="intro-skip" type="button" onClick={finish}>Skip intro</button>
    </div>
  );
}
