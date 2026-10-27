import Link from 'next/link';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { rs, when } from '@/lib/format';

export const metadata = { title: 'Open bags · Admin' };

const IDLE = 864e5; // a bag nobody touched for a day counts as abandoned

export default async function Carts() {
  await requireAdmin();
  const users = await db.user.findMany({
    where: { cart: { some: {} } },
    include: { cart: { include: { product: { select: { name: true, price: true } } } } },
  });
  const rows = users.map(u => ({
    ...u,
    value: u.cart.reduce((n, c) => n + c.product.price * c.qty, 0),
    pieces: u.cart.reduce((n, c) => n + c.qty, 0),
    touched: new Date(Math.max(...u.cart.map(c => c.updatedAt.getTime()))),
  })).sort((a, b) => b.value - a.value);
  const idle = rows.filter(r => Date.now() - r.touched.getTime() > IDLE);

  return (
    <div className="panel">
      <div className="panel-head"><h3>Open bags ({rows.length})</h3>
        <span className="muted">{idle.length} abandoned · {rs(idle.reduce((n, r) => n + r.value, 0))} waiting</span></div>
      <p className="sub">Signed-in customers with pieces in their bag. Guests&apos; bags live in their own browser and are not listed.</p>
      {rows.length ? <div className="table-wrap"><table>
        <thead><tr><th>Customer</th><th>In the bag</th><th>Value</th><th>Last touched</th><th /></tr></thead>
        <tbody>{rows.map(r => {
          const abandoned = Date.now() - r.touched.getTime() > IDLE;
          const nudge = `mailto:${r.email}?subject=${encodeURIComponent('Your Jay Mataji bag is waiting')}&body=${encodeURIComponent(
            `Hi ${r.name.split(' ')[0]},\n\nYou left ${r.cart.map(c => c.product.name).join(', ')} in your bag. Stock is limited, so we wanted to let you know before it goes. Reply here if you have any questions about size or fabric.\n\nJay Mataji Creation`)}`;
          return (
            <tr key={r.id}>
              <td><Link href={`/admin/customers/${r.id}`}><b>{r.name}</b></Link><br /><small className="muted">{r.email}</small></td>
              <td style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.cart.map(c => `${c.product.name} × ${c.qty}`).join(', ')}</td>
              <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{rs(r.value)}</td>
              <td style={{ fontSize: 12 }}>{when(r.touched)}{abandoned && <><br /><span className="badge warn">Abandoned</span></>}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <a className="btn btn-ghost" href={nudge} title="Email a reminder" aria-label={`Email ${r.name} a reminder`}><i className="bx bx-envelope" /></a>
                <Link className="btn btn-ghost" href={`/admin/customers/${r.id}`} title="Edit their bag" aria-label={`Edit ${r.name}'s bag`}><i className="bx bx-edit" /></Link>
              </td>
            </tr>
          );
        })}</tbody></table></div>
      : <div className="empty-state"><i className="bx bx-shopping-bag" /><h4>No open bags</h4><p>Bags customers fill but have not checked out show up here.</p></div>}
    </div>
  );
}
