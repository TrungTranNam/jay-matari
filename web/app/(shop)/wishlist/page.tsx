import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getWish } from '@/lib/bag';
import { db } from '@/lib/db';
import WishTools from './WishTools';

export const metadata = { title: 'Your wishlist' };

export default async function Wishlist() {
  const skus = await getWish();
  const found = await db.product.findMany({ where: { sku: { in: skus }, active: true } });
  const list = skus.flatMap(s => found.filter(p => p.sku === s)); // keep the order they were saved in

  return <>
    <section className="page-hero"><div className="wrap">
      <div className="crumbs"><Link href="/">Home</Link> / Wishlist</div>
      <h1 className="display-l">Your wishlist</h1>
      <p className="lede" style={{ marginTop: 14 }}>Pieces you saved. Stock counts are live, so if something says two left, it means two.</p>
    </div></section>

    <section className="section tight wrap">
      {list.length ? <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 26, flexWrap: 'wrap' }}>
          <span className="mono" style={{ color: 'var(--ink-faint)' }}>{list.length} piece{list.length === 1 ? '' : 's'} saved</span>
          <WishTools />
        </div>
        <div className="grid grid-4">{list.map(p => <ProductCard key={p.sku} p={p} wished />)}</div>
      </> : (
        <div className="empty-state">
          <i className="bx bx-heart" /><h4>Nothing saved yet</h4>
          <p>Tap the heart on any piece and it will wait for you here.</p>
          <Link href="/shop" className="btn btn-solid">Browse the collection</Link>
        </div>
      )}
    </section>
  </>;
}
