import Link from 'next/link';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { TZ, img, rs, when } from '@/lib/format';
import { STATUS_LABEL, statusTone, type OrderItem } from '@/lib/orders';

export const metadata = { title: 'Admin' };

const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });

export default async function Overview() {
  await requireAdmin();
  const since = new Date(Date.now() - 7 * 864e5);
  const [live, recent, customers, low, products] = await Promise.all([
    // ponytail: totals and best sellers are summed in JS over every live order; switch to SQL aggregates past ~10k orders
    db.order.findMany({ where: { status: { not: 'CANCELLED' } }, select: { total: true, createdAt: true, items: true, paymentStatus: true } }),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true } } } }),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.product.findMany({ where: { active: true, stock: { lt: 5 } }, orderBy: { stock: 'asc' } }),
    db.product.findMany({ select: { sku: true, name: true, img: true } }),
  ]);

  const revenue = live.reduce((n, o) => n + o.total, 0);
  const collected = live.filter(o => o.paymentStatus === 'PAID').reduce((n, o) => n + o.total, 0);
  const open = await db.order.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } });

  const days = [...Array(7)].map((_, i) => new Date(Date.now() - (6 - i) * 864e5));
  const buckets = days.map(d => live.filter(o => o.createdAt >= since && dayKey(o.createdAt) === dayKey(d)).reduce((n, o) => n + o.total, 0));
  const peak = Math.max(...buckets, 1);

  const sold = new Map<string, number>();
  live.forEach(o => (o.items as OrderItem[]).forEach(i => sold.set(i.sku, (sold.get(i.sku) ?? 0) + i.qty)));
  const top = [...sold].sort((a, b) => b[1] - a[1]).slice(0, 5).flatMap(([sku, n]) => {
    const p = products.find(x => x.sku === sku);
    return p ? [{ ...p, n }] : [];
  });

  return <>
    <div className="kpis">
      <div className="kpi"><div className="t"><span>Revenue</span><i className="bx bx-rupee" /></div>
        <b>{rs(revenue)}</b><small>{rs(collected)} collected · {live.length} order{live.length === 1 ? '' : 's'}</small></div>
      <div className="kpi"><div className="t"><span>Open orders</span><i className="bx bx-package" /></div>
        <b>{open}</b><small>Awaiting dispatch or delivery</small></div>
      <div className="kpi"><div className="t"><span>Customers</span><i className="bx bx-group" /></div>
        <b>{customers}</b><small>Registered accounts</small></div>
      <div className="kpi"><div className="t"><span>Low stock</span><i className="bx bx-error" /></div>
        <b>{low.length}</b><small>Under 5 pieces left</small></div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }} className="ov-grid">
      <div className="panel">
        <div className="panel-head"><h3>Revenue, last 7 days</h3>
          <span className="mono" style={{ color: 'var(--ink-faint)' }}>Peak {rs(peak)}</span></div>
        <div className="chart">{buckets.map((v, i) => (
          <div key={i} className="bar-col">
            <div className="bar" style={{ height: `${Math.max(3, (v / peak) * 100)}%` }} data-v={rs(v)} />
            <span>{days[i].toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short' })}</span>
          </div>))}</div>
      </div>
      <div className="panel">
        <div className="panel-head"><h3><span className="live-dot" /> Latest activity</h3></div>
        {recent.length ? recent.map(o => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="feed-item"><span className="feed-dot" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13, display: 'block' }}>{o.user.name} · {rs(o.total)}</b>
              <small style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{o.id} · {when(o.createdAt)}</small>
            </div><span className={`badge ${statusTone(o.status)}`}>{STATUS_LABEL[o.status]}</span>
          </Link>
        )) : <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>No orders yet. They appear here the moment one is placed.</p>}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }} className="ov-grid">
      <div className="panel"><div className="panel-head"><h3>Best sellers</h3></div>
        {top.length ? top.map(p => (
          <div key={p.sku} className="feed-item">
            <img className="mini-img" src={img(p.img)} alt="" />
            <div style={{ flex: 1 }}><b style={{ fontSize: 13.5, display: 'block' }}>{p.name}</b>
              <small style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{p.sku}</small></div>
            <b style={{ fontFamily: 'var(--f-mono)' }}>{p.n} sold</b></div>
        )) : <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Nothing sold yet.</p>}
      </div>
      <div className="panel"><div className="panel-head"><h3>Needs restocking</h3>
        <Link className="btn btn-line btn-sm" href="/admin/products">Manage products</Link></div>
        {low.length ? low.map(p => (
          <Link key={p.sku} href={`/admin/products/${p.sku}`} className="feed-item">
            <img className="mini-img" src={img(p.img)} alt="" />
            <div style={{ flex: 1 }}><b style={{ fontSize: 13.5, display: 'block' }}>{p.name}</b>
              <small style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{p.sku}</small></div>
            <span className={`badge ${p.stock === 0 ? 'bad' : 'warn'}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span></Link>
        )) : <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Everything is comfortably in stock.</p>}
      </div>
    </div>
  </>;
}
