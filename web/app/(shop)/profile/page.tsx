import Link from 'next/link';
import { redirect } from 'next/navigation';
import '../../styles/profile.css';
import { logout } from '@/app/(auth)/actions';
import { getCart, getWish, userId } from '@/lib/bag';
import { db } from '@/lib/db';
import { img, rs } from '@/lib/format';
import { STATUS_LABEL, statusTone, type OrderItem } from '@/lib/orders';
import { AddressCard, DeleteAccount, DetailsPanel, PasswordPanel } from './ProfileForms';

export const metadata = { title: 'My profile' };

const date = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-IN', opts);

export default async function Profile() {
  const uid = await userId();
  if (!uid) redirect('/login?callbackUrl=/profile');
  const [u, orders, wish, cart] = await Promise.all([
    db.user.findUnique({ where: { id: uid }, include: { addresses: true } }),
    db.order.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' } }),
    getWish(),
    getCart(),
  ]);
  if (!u) redirect('/login');

  const live = orders.filter(o => o.status !== 'CANCELLED');
  const spent = live.reduce((n, o) => n + o.total, 0);
  const pieces = live.reduce((n, o) => n + (o.items as OrderItem[]).reduce((k, i) => k + i.qty, 0), 0);
  const initials = u.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const isAdmin = u.role === 'ADMIN';

  return (
    <div className="pg-profile">
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link href="/">Home</Link> / My profile</div>
          <h1 className="display-l">My profile</h1>
        </div>
      </section>

      <section className="section tight wrap"><div className="acct">
        <aside className="side">
          <div className="side-top">
            <div className="side-av">{initials}</div>
            <b>{u.name}</b><small>{u.email}</small>
            {isAdmin ? <span className="pm-tag" style={{ marginTop: 10 }}>Admin</span>
                     : <span className="badge" style={{ marginTop: 10 }}>Member since {u.createdAt.getFullYear()}</span>}
          </div>
          <nav className="side-nav">
            <Link href="/profile" className="on"><i className="bx bx-user" /> Profile</Link>
            <Link href="/orders"><i className="bx bx-package" /> My orders <span className="n">{orders.length}</span></Link>
            <Link href="/wishlist"><i className="bx bx-heart" /> Wishlist <span className="n">{wish.length}</span></Link>
            <Link href="/cart"><i className="bx bx-shopping-bag" /> My bag <span className="n">{cart.count}</span></Link>
            {isAdmin && <Link href="/admin"><i className="bx bx-grid-alt" /> Admin dashboard</Link>}
            <div style={{ height: 1, background: 'var(--line)', margin: '8px 6px' }} />
            <form action={logout}><button type="submit" className="danger"><i className="bx bx-log-out" /> Sign out</button></form>
          </nav>
        </aside>

        <div>
          <div className="stat-cards">
            <div className="sc"><i className="bx bx-package" /><b>{orders.length}</b><span>Orders placed</span></div>
            <div className="sc"><i className="bx bx-purchase-tag" /><b>{pieces}</b><span>Pieces bought</span></div>
            <div className="sc"><i className="bx bx-rupee" /><b>{rs(spent)}</b><span>Total spent</span></div>
            <div className="sc"><i className="bx bx-heart" /><b>{wish.length}</b><span>Saved pieces</span></div>
          </div>

          <DetailsPanel name={u.name} email={u.email} phone={u.phone ?? ''}
                        created={date(u.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })} />

          <div className="panel">
            <div className="panel-head"><h3>Saved addresses</h3>
              <span className="mono" style={{ color: 'var(--ink-faint)' }}>{u.addresses.length} saved</span></div>
            {u.addresses.length ? (
              <div className="two">{u.addresses.map(a => <AddressCard key={a.id} a={a} />)}</div>
            ) : <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Addresses you use at checkout are saved here automatically.</p>}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Recent orders</h3><Link href="/orders" className="btn btn-line btn-sm">See all orders</Link></div>
            {orders.length ? orders.slice(0, 4).map(o => {
              const items = o.items as OrderItem[];
              return (
                <div key={o.id} className="mini-order">
                  <img src={img(items[0].img)} alt="" />
                  <div className="m"><b>{items[0].name}{items.length > 1 && ` +${items.length - 1} more`}</b>
                    <small>{o.id} · {date(o.createdAt, { day: 'numeric', month: 'short' })}</small></div>
                  <span className={`badge ${statusTone(o.status)}`}>{STATUS_LABEL[o.status]}</span>
                  <b style={{ fontFamily: 'var(--f-mono)', fontSize: 14 }}>{rs(o.total)}</b>
                </div>
              );
            }) : (
              <div className="empty-state" style={{ padding: '26px 0' }}><h4>No orders yet</h4>
                <p>When you buy something it lands here, and you can follow it right to your door.</p>
                <Link href="/shop" className="btn btn-solid">Browse the collection</Link></div>
            )}
          </div>

          <PasswordPanel />
          {!isAdmin && <DeleteAccount />}
        </div>
      </div></section>
    </div>
  );
}
