'use client';

import { useState } from 'react';
import { img } from '@/lib/format';
import { AdminForm, type AdminResult } from '../../ui';
import PhotoUpload from '../../PhotoUpload';

type P = {
  sku: string; name: string; cat: string; price: number; mrp: number; stock: number; badge: string; badgeTone: string;
  fabric: string; work: string; care: string; desc: string; active: boolean; sizes: string; colors: string; gallery: string[];
};

export default function ProductForm({ p, save }: { p: P | null; save: (f: FormData) => Promise<AdminResult> }) {
  const [gallery, setGallery] = useState<string[]>(p?.gallery ?? []);
  const move = (i: number, d: number) => {
    const g = [...gallery], j = i + d;
    if (j < 0 || j >= g.length) return;
    [g[i], g[j]] = [g[j], g[i]];
    setGallery(g);
  };

  return (
    <AdminForm action={save}>
      <input type="hidden" name="gallery" value={JSON.stringify(gallery)} />
      <div className="field"><label>Photos <span className="muted">— the first one is the cover</span></label>
        <div className="thumbs-edit">
          {gallery.map((g, i) => (
            <figure key={`${g}-${i}`} className={i === 0 ? 'cover' : undefined}>
              <img src={img(g)} alt="" />
              <figcaption>
                <button type="button" onClick={() => move(i, -1)} aria-label="Move left"><i className="bx bx-chevron-left" /></button>
                <button type="button" onClick={() => setGallery(gallery.filter((_, k) => k !== i))} aria-label="Remove photo"><i className="bx bx-x" /></button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Move right"><i className="bx bx-chevron-right" /></button>
              </figcaption>
            </figure>
          ))}
        </div>
        <PhotoUpload onUploaded={id => setGallery(g => [...g, id])} />
      </div>

      <div className="two">
        <div className="field"><label htmlFor="f-name">Product name</label><input className="input" id="f-name" name="name" defaultValue={p?.name} placeholder="Zari Work Kurta Set" /></div>
        <div className="field"><label htmlFor="f-sku">SKU</label><input className="input" id="f-sku" name="sku" defaultValue={p?.sku} disabled={!!p} placeholder="JMC-XX-020" /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="f-cat">Category</label>
          <select className="input" id="f-cat" name="cat" defaultValue={p?.cat ?? 'kurta'}>
            {[['kurta', 'Kurta sets'], ['gown', 'Gowns'], ['set', 'Co-ord sets'], ['bridal', 'Bridal']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div className="field"><label htmlFor="f-stock">Stock</label><input className="input" id="f-stock" name="stock" type="number" min={0} defaultValue={p?.stock ?? 10} /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="f-price">Selling price (₹)</label><input className="input" id="f-price" name="price" type="number" min={1} defaultValue={p?.price} /></div>
        <div className="field"><label htmlFor="f-mrp">M.R.P. (₹)</label><input className="input" id="f-mrp" name="mrp" type="number" min={1} defaultValue={p?.mrp} /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="f-sizes">Sizes <span className="muted">(comma separated)</span></label><input className="input" id="f-sizes" name="sizes" defaultValue={p?.sizes ?? 'S, M, L, XL'} /></div>
        <div className="field"><label htmlFor="f-colors">Colours <span className="muted">(comma separated)</span></label><input className="input" id="f-colors" name="colors" defaultValue={p?.colors} placeholder="Ivory, Wine, Emerald" /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="f-badge">Badge (optional)</label><input className="input" id="f-badge" name="badge" defaultValue={p?.badge} placeholder="New / Bestseller / Limited" /></div>
        <div className="field"><label htmlFor="f-tone">Badge colour</label>
          <select className="input" id="f-tone" name="badgeTone" defaultValue={p?.badgeTone ?? 'gold'}><option value="gold">Gold</option><option value="teal">Teal</option></select></div>
      </div>
      <div className="field"><label htmlFor="f-fabric">Fabric</label><input className="input" id="f-fabric" name="fabric" defaultValue={p?.fabric} placeholder="Cotton silk" /></div>
      <div className="two">
        <div className="field"><label htmlFor="f-work">Work</label><input className="input" id="f-work" name="work" defaultValue={p?.work} placeholder="Hand zari on yoke" /></div>
        <div className="field"><label htmlFor="f-care">Care</label><input className="input" id="f-care" name="care" defaultValue={p?.care} placeholder="Dry clean only" /></div>
      </div>
      <div className="field"><label htmlFor="f-desc">Description</label>
        <textarea className="input" id="f-desc" name="desc" defaultValue={p?.desc} placeholder="What is it, how is it made, how does it wear?" /></div>
      <label className="f-opt" style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '4px 0 18px', fontSize: 13.5 }}>
        <input type="checkbox" name="active" defaultChecked={p?.active ?? true} style={{ accentColor: 'var(--gold)' }} /> Show in the shop</label>
      <button className="btn btn-solid">{p ? 'Save changes' : 'Add product'}</button>
    </AdminForm>
  );
}
