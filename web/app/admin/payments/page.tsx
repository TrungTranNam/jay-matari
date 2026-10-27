import Link from 'next/link';
import { requireAdmin } from '@/auth';
import { getContent } from '@/lib/content';
import { db } from '@/lib/db';
import { rs, when } from '@/lib/format';
import { PAY_LABEL } from '@/lib/orders';
import { razorpayEnabled } from '@/lib/razorpay';
import { savePaymentSettings, setPayment } from '../actions';
import { ActBtn, AdminForm } from '../ui';

export const metadata = { title: 'Payments · Admin' };

export default async function Payments() {
  await requireAdmin();
  const [pay, toCheck, toRefund, byMethod] = await Promise.all([
    getContent('payment'),
    db.order.findMany({ where: { paymentStatus: 'AWAITING_CHECK' }, orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } }),
    db.order.findMany({ where: { status: 'CANCELLED', paymentStatus: 'PAID' }, include: { user: { select: { name: true } } } }),
    db.order.groupBy({ by: ['payment'], where: { paymentStatus: 'PAID' }, _sum: { total: true }, _count: true }),
  ]);

  return <>
    {toCheck.length > 0 && (
      <div className="panel">
        <div className="panel-head"><h3>Waiting on your check <span className="badge warn">{toCheck.length}</span></h3></div>
        <p className="sub">The customer paid by UPI and sent a UTR. Find it in your bank statement, then confirm.</p>
        {toCheck.map(o => (
          <div key={o.id} className="mrow">
            <div><Link href={`/admin/orders/${o.id}`}><b>{o.id}</b></Link>
              <small>{o.user.name} · {rs(o.total)} · UTR <b style={{ fontFamily: 'var(--f-mono)' }}>{o.paymentRef}</b> · {when(o.createdAt)}</small></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ActBtn className="btn btn-solid btn-sm" act={setPayment.bind(null, o.id, 'received')}>Mark as received</ActBtn>
              <ActBtn act={setPayment.bind(null, o.id, 'reject')} confirm="Reject this UTR? The customer will be asked to pay again.">Reject</ActBtn>
            </div>
          </div>
        ))}
      </div>
    )}

    {toRefund.length > 0 && (
      <div className="panel">
        <div className="panel-head"><h3>Refunds to send <span className="badge bad">{toRefund.length}</span></h3></div>
        <p className="sub">These orders were cancelled after the money came in.</p>
        {toRefund.map(o => (
          <div key={o.id} className="mrow">
            <div><Link href={`/admin/orders/${o.id}`}><b>{o.id}</b></Link>
              <small>{o.user.name} · {rs(o.total)} · {PAY_LABEL[o.payment] ?? o.payment}{o.paymentRef && ` · ${o.paymentRef}`}</small></div>
            <ActBtn act={setPayment.bind(null, o.id, 'refund')} confirm={o.payment === 'razorpay' ? 'Refund the full amount through Razorpay?' : 'Mark as refunded? Send the money back yourself first.'}>
              {o.payment === 'razorpay' ? 'Refund via Razorpay' : 'Mark refunded'}</ActBtn>
          </div>
        ))}
      </div>
    )}

    <div className="panel">
      <div className="panel-head"><h3>How money reaches you</h3></div>
      <p className="sub">The UPI code customers scan at checkout pays straight into this UPI ID. Leave it empty to switch UPI off.</p>
      <AdminForm action={savePaymentSettings}>
        <div className="two">
          <div className="field"><label htmlFor="s-upi">Your UPI ID</label>
            <input className="input" id="s-upi" name="upiId" defaultValue={pay.upiId} placeholder="yourname@okaxis" /></div>
          <div className="field"><label htmlFor="s-payee">Name shown in the UPI app</label>
            <input className="input" id="s-payee" name="payee" defaultValue={pay.payee} /></div>
        </div>
        <div className="two">
          <div className="field"><label htmlFor="s-fee">Cash handling fee under ₹2,999 (₹)</label>
            <input className="input" id="s-fee" name="codFee" type="number" min={0} defaultValue={pay.codFee} /></div>
          <div className="field"><label htmlFor="s-max">Largest cash-on-delivery order (₹)</label>
            <input className="input" id="s-max" name="codMax" type="number" min={0} defaultValue={pay.codMax} /></div>
        </div>
        <p className="muted" style={{ margin: '4px 0 16px' }}>
          Card, netbanking &amp; wallet (Razorpay): <b style={{ color: razorpayEnabled() ? 'var(--ok)' : 'var(--warn)' }}>
            {razorpayEnabled() ? 'switched on' : 'off — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server .env'}</b></p>
        <button className="btn btn-solid">Save payment settings</button>
      </AdminForm>
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Received, by method</h3></div>
      {byMethod.length ? <div className="table-wrap"><table>
        <thead><tr><th>Method</th><th>Orders</th><th style={{ textAlign: 'right' }}>Value</th></tr></thead>
        <tbody>{byMethod.map(m => (
          <tr key={m.payment}><td>{PAY_LABEL[m.payment] ?? m.payment}</td><td>{m._count}</td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--f-mono)' }}>{rs(m._sum.total ?? 0)}</td></tr>
        ))}</tbody></table></div>
      : <div className="empty-state"><i className="bx bx-credit-card" /><h4>No payments yet</h4><p>Once money comes in, the split by method shows here.</p></div>}
    </div>
  </>;
}
