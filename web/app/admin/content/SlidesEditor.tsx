'use client';

import { useState, useTransition } from 'react';
import { toast } from '@/components/Toaster';
import type { HeroSlide } from '@/lib/content';
import { img } from '@/lib/format';
import { saveHeroSlides } from '../actions';
import PhotoUpload from '../PhotoUpload';

const BLANK: HeroSlide = { img: '', alt: '', eyebrow: '', title: '', titleEm: '', text: '', ctaHref: '/shop', ctaText: 'Shop the collection', altHref: '', altText: '' };

export default function SlidesEditor({ initial, photos }: { initial: HeroSlide[]; photos: string[] }) {
  const [slides, setSlides] = useState(initial);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  const set = (i: number, patch: Partial<HeroSlide>) => setSlides(s => s.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setSlides(s => {
    const j = i + d;
    if (j < 0 || j >= s.length) return s;
    const c = [...s]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });
  const field = (i: number, k: keyof HeroSlide, label: string, ph = '') => (
    <div className="field"><label htmlFor={`s${i}-${k}`}>{label}</label>
      <input className="input" id={`s${i}-${k}`} value={slides[i][k] ?? ''} placeholder={ph} onChange={e => set(i, { [k]: e.target.value })} /></div>
  );

  return <>
    {slides.map((s, i) => (
      <div key={i} className="slide-card">
        <div className="slide-top">
          {s.img ? <img src={img(s.img)} alt="" /> : <span className="muted">No photo</span>}
          <b>Slide {i + 1}</b>
          <div className="tools">
            <button type="button" className="btn btn-ghost" onClick={() => move(i, -1)} aria-label="Move up"><i className="bx bx-up-arrow-alt" /></button>
            <button type="button" className="btn btn-ghost" onClick={() => move(i, 1)} aria-label="Move down"><i className="bx bx-down-arrow-alt" /></button>
            <button type="button" className="btn btn-ghost" onClick={() => setSlides(slides.filter((_, k) => k !== i))} aria-label="Remove slide"><i className="bx bx-trash" /></button>
          </div>
        </div>
        <div className="two">
          <div className="field"><label htmlFor={`s${i}-img`}>Photo</label>
            <select className="input" id={`s${i}-img`} value={s.img} onChange={e => set(i, { img: e.target.value })}>
              <option value="">Pick a photo…</option>
              {s.img.startsWith('u-') && <option value={s.img}>Uploaded photo</option>}
              {photos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ marginTop: 8 }}><PhotoUpload multiple={false} label="Upload a new photo" onUploaded={id => set(i, { img: id })} /></div></div>
          {field(i, 'alt', 'Photo description (for screen readers)')}
        </div>
        {field(i, 'eyebrow', 'Small line above the title', 'Atelier · Ahmedabad')}
        <div className="two">{field(i, 'title', 'Title')}{field(i, 'titleEm', 'Title, second line (gold italic)')}</div>
        <div className="field"><label htmlFor={`s${i}-text`}>Text</label>
          <textarea className="input" id={`s${i}-text`} value={s.text} onChange={e => set(i, { text: e.target.value })} style={{ minHeight: 70 }} /></div>
        <div className="two">{field(i, 'ctaText', 'Button')}{field(i, 'ctaHref', 'Button goes to', '/shop?cat=gown')}</div>
        <div className="two">{field(i, 'altText', 'Second button (optional)')}{field(i, 'altHref', 'Second button goes to', '/about')}</div>
      </div>
    ))}
    <div className="err-msg">{err}</div>
    <div style={{ display: 'flex', gap: 10 }}>
      <button type="button" className="btn btn-line btn-sm" onClick={() => setSlides([...slides, { ...BLANK }])}><i className="bx bx-plus" /> Add a slide</button>
      <button type="button" className="btn btn-solid btn-sm" disabled={pending} onClick={() => start(async () => {
        const r = await saveHeroSlides(slides.map(s => ({ ...s, titleEm: s.titleEm || undefined, altHref: s.altHref || undefined, altText: s.altText || undefined })));
        if (!r.ok) return setErr(r.msg);
        setErr(''); toast(r.msg, 'ok');
      })}>Save slides</button>
    </div>
  </>;
}
