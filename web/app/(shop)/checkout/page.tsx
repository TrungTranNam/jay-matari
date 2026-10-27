import Link from 'next/link';
import { redirect } from 'next/navigation';
import '../../styles/cart.css';
import { getCart, userId } from '@/lib/bag';
import { paymentOptions } from '@/lib/checkout';
import { db } from '@/lib/db';
import CheckoutFlow from './CheckoutFlow';

export const metadata = { title: 'Checkout' };

export default async function Checkout() {
  const uid = await userId();
  if (!uid) redirect('/login?callbackUrl=/checkout');
  const [cart, user] = await Promise.all([
    getCart(),
    db.user.findUniqueOrThrow({ where: { id: uid }, include: { addresses: true } }),
  ]);
  // no redirect on an empty bag: placing the order empties it, and the done screen must survive that refresh
  return (
    <div className="pg-cart">
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link href="/">Home</Link> / <Link href="/cart">Your bag</Link> / Checkout</div>
          <h1 className="display-l">Checkout</h1>
        </div>
      </section>
      <section className="section tight wrap">
        <CheckoutFlow cart={cart} options={await paymentOptions(cart.sub)}
          me={{ name: user.name, phone: user.phone ?? '' }}
          saved={user.addresses.map(a => ({ id: a.id, name: a.name, phone: a.phone, line: a.line, city: a.city, state: a.state, pin: a.pin, landmark: a.landmark ?? '' }))} />
      </section>
    </div>
  );
}
