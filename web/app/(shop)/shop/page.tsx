import '../../styles/shop.css';
import { getWish } from '@/lib/bag';
import { db } from '@/lib/db';
import ShopClient from './ShopClient';

export const metadata = { title: 'The Collection' };

export default async function Shop({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const [{ cat }, products, wish] = await Promise.all([
    searchParams,
    db.product.findMany({ where: { active: true } }),
    getWish(),
  ]);
  return (
    <div className="pg-shop">
      {/* key: footer links to ?cat=… re-mount with fresh filters */}
      <ShopClient key={cat ?? 'all'} products={products} wish={wish} initialCat={cat} />
    </div>
  );
}
