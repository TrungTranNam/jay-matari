import Link from 'next/link';
import '../../styles/cart.css';
import { getCart } from '@/lib/bag';
import { FREE_SHIP_FROM } from '@/lib/pricing';
import CartView from './CartView';

export const metadata = { title: 'Your bag' };

export default async function CartPage() {
  const cart = await getCart();
  return (
    <div className="pg-cart">
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link href="/">Home</Link> / Your bag</div>
          <h1 className="display-l">Your bag</h1>
        </div>
      </section>
      <section className="section tight wrap">
        {cart.items.length ? <CartView cart={cart} freeFrom={FREE_SHIP_FROM} /> : (
          <div className="empty-state"><i className="bx bx-shopping-bag" />
            <h4>Your bag is empty</h4><p>Once you add a piece it will show up here, and stay here until you check out.</p>
            <Link href="/shop" className="btn btn-solid">Browse the collection</Link></div>
        )}
      </section>
    </div>
  );
}
