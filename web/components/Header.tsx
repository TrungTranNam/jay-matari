import { getCart, getWish, userId } from '@/lib/bag';
import { db } from '@/lib/db';
import CartDrawer from './CartDrawer';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const uid = await userId();
  // read name/email from the DB, not the session, so profile edits show immediately
  const [u, cart, wish, orders] = await Promise.all([
    uid ? db.user.findUnique({ where: { id: uid }, select: { name: true, email: true, role: true } }) : null,
    getCart(),
    getWish(),
    uid ? db.order.count({ where: { userId: uid } }) : 0,
  ]);
  const user = u ? { name: u.name, email: u.email, isAdmin: u.role === 'ADMIN' } : null;
  return <>
    <HeaderClient user={user} counts={{ bag: cart.count, wish: wish.length, orders }} />
    <CartDrawer cart={cart} />
  </>;
}
