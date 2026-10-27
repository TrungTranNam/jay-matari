'use client';

import { useRef, useState } from 'react';
import { img, srcSet } from '@/lib/format';
import { useSwipe } from './useSwipe';

// Product photo carousel: thumbs, pips, arrows, swipe, click-to-zoom that follows the cursor.
export default function Shots({ imgs, alt }: { imgs: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const go = (n: number) => { setI((n + imgs.length) % imgs.length); setZoom(false); };
  useSwipe(stage, () => go(i + 1), () => go(i - 1));

  return (
    <div className="shots">
      <div ref={stage} className={`shots-stage ${zoom ? 'zoomed' : ''}`} tabIndex={0} aria-roledescription="carousel"
        onClick={e => { if (!(e.target as HTMLElement).closest('.shots-arrow, .pip')) setZoom(!zoom); }}
        onMouseMove={e => {
          if (!zoom) return;
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--ox', ((e.clientX - r.left) / r.width) * 100 + '%');
          e.currentTarget.style.setProperty('--oy', ((e.clientY - r.top) / r.height) * 100 + '%');
        }}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
        }}>
        <div className="shots-track" style={{ transform: `translate3d(${-i * 100}%,0,0)` }}>
          {imgs.map((g, k) => (
            <figure key={k} className={`shot ${k === i ? 'on' : ''}`}>
              <img src={img(g, 1920)} srcSet={srcSet(g)} sizes="(max-width:900px) 100vw, 46vw"
                   alt={imgs.length > 1 ? `${alt} — view ${k + 1}` : alt} loading={k ? 'lazy' : undefined} />
            </figure>
          ))}
        </div>
        {imgs.length > 1 && <>
          <button className="shots-arrow left" onClick={() => go(i - 1)} aria-label="Previous photo"><i className="bx bx-chevron-left" /></button>
          <button className="shots-arrow right" onClick={() => go(i + 1)} aria-label="Next photo"><i className="bx bx-chevron-right" /></button>
        </>}
        <span className="res-tag">4K · tap to zoom</span>
        <div className="shots-pips">
          {imgs.map((_, k) => <button key={k} className={`pip ${k === i ? 'on' : ''}`} onClick={() => go(k)} aria-label={`Photo ${k + 1}`} />)}
        </div>
      </div>
      <div className="shots-thumbs">
        {imgs.map((g, k) => (
          <button key={k} className={`s-thumb ${k === i ? 'on' : ''}`} onClick={() => go(k)} aria-label={`Photo ${k + 1}`}>
            <img src={img(g)} alt="" loading="lazy" /></button>
        ))}
      </div>
    </div>
  );
}
