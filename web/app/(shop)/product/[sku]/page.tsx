import Link from 'next/link';
import { notFound } from 'next/navigation';
import '../../../styles/product.css';
import ProductCard from '@/components/ProductCard';
import Shots from '@/components/Shots';
import { getWish, userId } from '@/lib/bag';
import { db } from '@/lib/db';
import { rs } from '@/lib/format';
import BuyBox from './BuyBox';
import ProductTabs from './ProductTabs';

type Params = { params: Promise<{ sku: string }> };

const findProduct = (sku: string) => db.product.findFirst({ where: { sku, active: true } });

export async function generateMetadata({ params }: Params) {
  const p = await findProduct((await params).sku);
  return p ? { title: p.name, description: p.desc.slice(0, 155) } : { title: 'Not found' };
}

export default async function ProductPage({ params }: Params) {
  const { sku } = await params;
  const p = await findProduct(sku);
  if (!p) notFound();

  const [wish, uid, reviews, sameCat] = await Promise.all([
    getWish(),
    userId(),
    db.review.findMany({ where: { sku, approved: true }, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
    db.product.findMany({ where: { cat: p.cat, active: true, NOT: { sku } }, take: 4 }),
  ]);
  const related = sameCat.length >= 4 ? sameCat : [...sameCat,
    ...await db.product.findMany({ where: { active: true, sku: { notIn: [sku, ...sameCat.map(x => x.sku)] } }, take: 4 - sameCat.length })];

  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const r = Math.round(p.rating);
  const sizes = p.sizes as string[], colors = p.colors as string[];

  return (
    <div className="pg-product">
      <section className="section tight wrap" style={{ paddingTop: 34 }}>
        <div className="crumbs">
          <Link href="/">Home</Link> / <Link href="/shop">Collection</Link> / <Link href={`/shop?cat=${p.cat}`}>{p.cat}</Link> / {p.name}
        </div>
        <div className="pd">
          <div className="pd-media"><Shots imgs={p.gallery as string[]} alt={p.name} /></div>
          <div className="pd-info">
            <div className="eyebrow">{p.sku} · {p.cat}</div>
            <h1>{p.name}</h1>
            <div className="rating-line"><span className="stars">{'★'.repeat(r) + '☆'.repeat(5 - r)}</span>
              <span>{p.rating} · {p.reviewCount} ratings</span></div>
            <div className="pd-price">
              <span className="price">{rs(p.price)}</span>
              {off > 0 && <><span className="mrp">{rs(p.mrp)}</span>
                <span className="badge ok">Save {rs(p.mrp - p.price)} · {off}% off</span></>}
            </div>
            <p className="pd-desc">{p.desc}</p>
            <BuyBox sku={p.sku} name={p.name} sizes={sizes} colors={colors} stock={p.stock} wished={wish.includes(p.sku)} />
            <div className="trust">
              <div><i className="bx bx-package" /><span>Free delivery over ₹2,999, dispatched from Ahmedabad</span></div>
              <div><i className="bx bx-refresh" /><span>7-day exchange on unworn pieces</span></div>
              <div><i className="bx bx-ruler" /><span>Free length &amp; sleeve adjustment before dispatch</span></div>
              <div><i className="bx bx-rupee" /><span>Cash on delivery available across India</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight wrap">
        <ProductTabs sku={p.sku} fabric={p.fabric ?? ''} work={p.work ?? ''} care={p.care ?? ''} sizes={sizes} colors={colors}
          signedIn={!!uid}
          reviews={reviews.map(x => ({
            id: x.id, name: x.user.name, rating: x.rating, text: x.text,
            at: x.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          }))} />
      </section>

      <section className="section tight wrap">
        <div className="section-head"><div className="eyebrow">You may also like</div>
          <h2 className="display-m">From the same collection</h2></div>
        <div className="grid grid-4">
          {related.map(x => <ProductCard key={x.sku} p={x} wished={wish.includes(x.sku)} />)}
        </div>
      </section>
    </div>
  );
}
