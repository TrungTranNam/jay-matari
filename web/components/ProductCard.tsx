import Link from 'next/link';
import type { Product } from '@prisma/client';
import { img, rs, srcSet } from '@/lib/format';
import { AddButton, WishButton } from './BagButtons';

export default function ProductCard({ p, wished = false }: { p: Product; wished?: boolean }) {
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const r = Math.round(p.rating);
  const href = `/product/${p.sku}`;
  return (
    <article className="card reveal">
      <div className="card-media">
        <Link href={href}>
          <img src={img(p.img)} srcSet={srcSet(p.img)} sizes="(max-width:900px) 50vw, 25vw" alt={p.name} loading="lazy" />
        </Link>
        {p.badge && <span className={`tag ${p.badgeTone ?? ''}`}>{p.badge}</span>}
        {off > 0 && <span className="off-pill">−{off}%</span>}
        <WishButton sku={p.sku} on={wished} label={`Save ${p.name}`} />
        <div className="card-actions">
          <AddButton sku={p.sku} soldOut={p.stock <= 0}>{p.stock > 0 ? 'Add to bag' : 'Sold out'}</AddButton>
          <Link className="btn btn-line" href={href}>View</Link>
        </div>
      </div>
      <div className="card-body">
        <h3>{p.name}</h3>
        <div className="card-sku">{p.sku}</div>
        <div className="rating-line"><span className="stars">{'★'.repeat(r) + '☆'.repeat(5 - r)}</span><span>{p.reviewCount} ratings</span></div>
        <div className="price-line">
          <span className="price">{rs(p.price)}</span>
          {p.mrp > p.price && <><span className="mrp">{rs(p.mrp)}</span><span className="save">Save {rs(p.mrp - p.price)}</span></>}
        </div>
        <div style={{ marginTop: 8, fontSize: 11.5, color: p.stock > 0 ? 'var(--ok)' : 'var(--bad)' }}>
          {p.stock > 0 ? (p.stock < 5 ? `Only ${p.stock} left` : 'In stock') : 'Sold out'}</div>
      </div>
    </article>
  );
}
