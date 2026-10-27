import Link from 'next/link';
import '../styles/admin.css';
import { requireAdmin } from '@/auth';
import Header from '@/components/Header';
import { db } from '@/lib/db';
import { AdminNav, AutoRefresh } from './ui';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [open, low, unread, pendingReviews, toCheck, idleCarts] = await Promise.all([
    db.order.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
    db.product.count({ where: { active: true, stock: { lt: 5 } } }),
    db.message.count({ where: { read: false } }),
    db.review.count({ where: { approved: false } }),
    db.order.count({ where: { paymentStatus: 'AWAITING_CHECK' } }),
    db.user.count({ where: { cart: { some: { updatedAt: { lt: new Date(Date.now() - 864e5) } } } } }),
  ]);
  return <>
    <Header />
    <div className="pg-admin">
      <section className="page-hero"><div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link> / Admin</div>
        <h1 className="display-l">Admin dashboard</h1>
        <p className="lede" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="live-dot" /> Changes here reach the shop straight away. This page refreshes itself every 20 seconds.</p>
      </div></section>
      <section className="section tight wrap">
        <div className="admin">
          <AdminNav items={[
            ['/admin', 'bx-grid-alt', 'Overview', 0],
            ['/admin/orders', 'bx-package', 'Orders', open],
            ['/admin/payments', 'bx-credit-card', 'Payments', toCheck],
            ['/admin/products', 'bx-purchase-tag', 'Products', low],
            ['/admin/customers', 'bx-group', 'Customers', 0],
            ['/admin/carts', 'bx-shopping-bag', 'Open bags', idleCarts],
            ['/admin/inbox', 'bx-envelope', 'Inbox', unread],
            ['/admin/reviews', 'bx-star', 'Reviews', pendingReviews],
            ['/admin/content', 'bx-edit-alt', 'Site content', 0],
          ]} />
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </section>
    </div>
    <AutoRefresh />
  </>;
}
