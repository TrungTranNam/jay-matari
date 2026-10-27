import Link from 'next/link';
import { redirect } from 'next/navigation';
import '../../styles/orders.css';
import { userId } from '@/lib/bag';
import { paymentOptions } from '@/lib/checkout';
import { db } from '@/lib/db';
import type { OrderAddress, OrderItem } from '@/lib/orders';
import OrdersView, { type OrderRow } from './OrdersView';

export const metadata = { title: 'My orders' };

const day = (d: Date, year = false) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(year && { year: 'numeric' }) });

export default async function Orders() {
  const uid = await userId();
  if (!uid) redirect('/login?callbackUrl=/orders');
  const orders = await db.order.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, include: { events: { orderBy: { at: 'asc' } } } });

  const rows: OrderRow[] = orders.map(o => ({
    id: o.id, status: o.status, payment: o.payment, paymentStatus: o.paymentStatus, total: o.total,
    placed: day(o.createdAt, true),
    items: o.items as OrderItem[], address: o.address as OrderAddress,
    when: Object.fromEntries(o.events.map(e => [e.status, day(e.at)])),
  }));

  return (
    <div className="pg-orders">
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link href="/">Home</Link> / <Link href="/profile">Profile</Link> / My orders</div>
          <h1 className="display-l">My orders</h1>
          <p className="lede" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot" /> Status updates appear here within a minute of our team changing them.</p>
        </div>
      </section>
      <section className="section tight wrap"><OrdersView orders={rows} upi={(await paymentOptions(0)).upi} /></section>
    </div>
  );
}
