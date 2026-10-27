import Link from 'next/link';
import type { OrderStatus, Prisma } from '@prisma/client';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { rs, when } from '@/lib/format';
import { PAY_LABEL, PAY_STATUS_LABEL, STATUS_LABEL, type OrderItem } from '@/lib/orders';
import { setOrderStatus } from '../actions';
import { SelectAct } from '../ui';

export const metadata = { title: 'Orders · Admin' };

const STATUS_OPTIONS = Object.entries(STATUS_LABEL) as [OrderStatus, string][];
const LIMIT = 100;

export default async function Orders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const { q = '', status = 'open' } = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(status === 'open' ? { status: { notIn: ['DELIVERED', 'CANCELLED'] } } : status in STATUS_LABEL ? { status: status as OrderStatus } : {}),
    ...(q && { OR: [{ id: { contains: q } }, { user: { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } }] }),
  };
  const [orders, total] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: LIMIT, include: { user: { select: { name: true, email: true } } } }),
    db.order.count({ where }),
  ]);
  const tab = (s: string, label: string) =>
    <Link href={`/admin/orders?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={status === s ? 'on' : undefined}>{label}</Link>;

  return (
    <div className="panel">
      <div className="panel-head"><h3><span className="live-dot" /> Orders ({total})</h3></div>
      <div className="ftabs">{tab('open', 'Open')}{STATUS_OPTIONS.map(([s, l]) => <span key={s}>{tab(s, l)}</span>)}{tab('all', 'All')}</div>
      <form className="tool-row">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} placeholder="Search order number, customer, email or phone" aria-label="Search orders" />
        <button className="btn btn-line btn-sm">Search</button>
      </form>
      {orders.length ? <div className="table-wrap"><table>
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Placed</th><th>Status</th><th /></tr></thead>
        <tbody>{orders.map(o => (
          <tr key={o.id}>
            <td><Link href={`/admin/orders/${o.id}`} style={{ fontFamily: 'var(--f-mono)', fontSize: 11.5, color: 'var(--gold)' }}>{o.id}</Link></td>
            <td><b>{o.user.name}</b><br /><small style={{ color: 'var(--ink-faint)', fontSize: 11 }}>{o.user.email}</small></td>
            <td>{(o.items as OrderItem[]).reduce((n, i) => n + i.qty, 0)}</td>
            <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{rs(o.total)}</td>
            <td style={{ fontSize: 12 }}>{PAY_LABEL[o.payment] ?? o.payment}<br />
              <span className={`badge ${o.paymentStatus === 'PAID' ? 'ok' : o.paymentStatus === 'AWAITING_CHECK' ? 'warn' : ''}`}>{PAY_STATUS_LABEL[o.paymentStatus]}</span></td>
            <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{when(o.createdAt)}</td>
            <td><SelectAct value={o.status} options={STATUS_OPTIONS} act={setOrderStatus.bind(null, o.id) as (v: string) => ReturnType<typeof setOrderStatus>} /></td>
            <td><Link className="btn btn-ghost" href={`/admin/orders/${o.id}`} aria-label={`Open ${o.id}`}><i className="bx bx-show" /></Link></td>
          </tr>
        ))}</tbody></table></div>
      : <div className="empty-state"><i className="bx bx-package" /><h4>No orders match</h4><p>Clear the search or pick another status.</p></div>}
      {total > LIMIT && <p className="muted" style={{ marginTop: 12 }}>Showing the latest {LIMIT} of {total}. Search to narrow it down.</p>}
    </div>
  );
}
