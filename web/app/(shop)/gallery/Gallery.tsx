'use client';

import { useEffect, useState } from 'react';
import { img } from '@/lib/format';

const SHOTS = [
  { f: 'g3-hd', t: 'Zari border, close', c: 'work', s: '3840 × 2560' },
  { f: 'g4', t: 'Bridal panel on the frame', c: 'work', s: '3840 × 3610' },
  { f: 'g15', t: 'Abhla mirrors, hand-set', c: 'work', s: '3840 × 3360' },
  { f: 'g11', t: 'Fitting room, Maninagar', c: 'studio', s: '3840 × 3072' },
  { f: 'g6', t: 'Fabric library', c: 'studio', s: '3840 × 2560' },
  { f: 'g12', t: 'Cutting table, Monday morning', c: 'studio', s: '3840 × 2150' },
  { f: 'g13', t: 'Salwar set, finished', c: 'pieces', s: '3840 × 2743' },
  { f: 'g14', t: 'Co-ord set on the rail', c: 'pieces', s: '3840 × 2880' },
  { f: 'g8', t: 'Aari work on mulberry silk', c: 'work', s: '3840 × 2880' },
  { f: '10', t: 'Morning light on the rail', c: 'studio', s: '3840 × 2161' },
  { f: '27', t: 'Anarkali, full flare', c: 'pieces', s: '3840 × 2980' },
  { f: '11', t: 'Banarasi butis, woven', c: 'pieces', s: '3840 × 2970' },
  { f: '6', t: 'Appliqué shoulder', c: 'work', s: '3840 × 3008' },
  { f: '3', t: 'Zardozi neckline', c: 'work', s: '3840 × 2899' },
  { f: 'g3', t: 'Velvet bodice, stones set', c: 'pieces', s: '3840 × 2560' },
];
const CATS = { all: 'Everything', work: 'Hand work', studio: 'The studio', pieces: 'Finished pieces' };

export default function Gallery() {
  const [cat, setCat] = useState<keyof typeof CATS>('all');
  const [open, setOpen] = useState<number | null>(null);
  const shown = cat === 'all' ? SHOTS : SHOTS.filter(s => s.c === cat);
  const step = (d: number) => setOpen(i => (i === null ? i : (i + d + shown.length) % shown.length));

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    addEventListener('keydown', key);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', key); };
  }); // no deps: re-binds with the current `shown` each render

  const s = open !== null ? shown[open] : null;
  return <>
    <div className="gtabs">
      {(Object.keys(CATS) as (keyof typeof CATS)[]).map(k =>
        <button key={k} className={`gtab ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{CATS[k]}</button>)}
    </div>
    <div className="masonry">
      {shown.map((x, n) => (
        <figure key={x.f} className="mitem" onClick={() => setOpen(n)}>
          <img src={img(x.f)} srcSet={`${img(x.f)} 960w, ${img(x.f, 1920)} 1920w`}
               sizes="(max-width:520px) 100vw, (max-width:900px) 50vw, 33vw" alt={x.t} loading="lazy" />
          <figcaption className="mcap"><b>{x.t}</b><small>{x.s} · 4K</small></figcaption>
        </figure>
      ))}
    </div>

    <div className={`lb ${s ? 'open' : ''}`} role="dialog" aria-label="Photo viewer" onClick={e => e.target === e.currentTarget && setOpen(null)}>
      <button className="lb-x" onClick={() => setOpen(null)} aria-label="Close"><i className="bx bx-x" /></button>
      <button className="lb-prev" onClick={() => step(-1)} aria-label="Previous"><i className="bx bx-chevron-left" /></button>
      {s && <img key={s.f} src={img(s.f, '4k')} alt={s.t} />}
      <button className="lb-next" onClick={() => step(1)} aria-label="Next"><i className="bx bx-chevron-right" /></button>
      {s && <div className="lb-cap"><b>{s.t}</b><small>{s.s} · original 4K file</small></div>}
    </div>
  </>;
}
