import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { OrderStatus } from '@prisma/client';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { img, rs, when } from '@/lib/format';
import { PAY_LABEL, PAY_STATUS_LABEL, STATUS_LABEL, statusTone, type OrderAddress, type OrderItem } from '@/lib/orders';
import { setOrderStatus, setPayment, updateOrderAddress } from '../../actions';
import { ActBtn, AdminForm, SelectAct } from '../../ui';

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: { user: true, events: { orderBy: { at: 'asc' } } } });
  if (!o) notFound();
  const admins = await db.user.findMany({ where: { id: { in: o.events.flatMap(e => (e.by ? [e.by] : [])) } }, select: { id: true, name: true } });
  const items = o.items as OrderItem[], a = o.address as OrderAddress;
  const canEditAddress = o.status !== 'SHIPPED' && o.status !== 'DELIVERED';

  return <>
    <div className="panel">
      <div className="panel-head">
        <h3><Link href="/admin/orders" aria-label="Back to orders"><i className="bx bx-left-arrow-alt" /></Link> {o.id}
          <span className={`badge ${statusTone(o.status)}`}>{STATUS_LABEL[o.status]}</span></h3>
        <SelectAct className="input" value={o.status} options={Object.entries(STATUS_LABEL) as [OrderStatus, string][]}
          act={setOrderStatus.bind(null, o.id) as (v: string) => ReturnType<typeof setOrderStatus>} />
      </div>
      <div className="two" style={{ marginBottom: 22 }}>
        <div><div className="mono" style={{ color: 'var(--ink-faint)', marginBottom: 5 }}>Customer</div>
          <Link href={`/admin/customers/${o.userId}`}><b>{o.user.name}</b></Link><br />
          <small style={{ color: 'var(--ink-soft)' }}>{o.user.email}<br />{a.phone}</small></div>
        <div><div className="mono" style={{ color: 'var(--ink-faint)', marginBottom: 5 }}>Deliver to</div>
          <small style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>{a.name}<br />{a.line}<br />{a.city}, {a.state} — {a.pin}
            {a.landmark && <><br />Near {a.landmark}</>}</small></div>
      </div>
      {items.map(i => (
        <div key={`${i.sku}|${i.size}|${i.color}`} className="feed-item">
          <img className="mini-img" src={img(i.img)} alt="" />
          <div style={{ flex: 1 }}><b style={{ fontSize: 13.5, display: 'block' }}>{i.name}</b>
            <small style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{i.sku} · Size {i.size} · {i.color} · Qty {i.qty} · {rs(i.price)} each</small></div>
          <b style={{ fontFamily: 'var(--f-mono)' }}>{rs(i.price * i.qty)}</b></div>
      ))}
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="d-line"><span>Subtotal</span><span>{rs(o.subtotal)}</span></div>
        <div className="d-line"><span>Delivery &amp; handling</span><span>{o.shipping ? rs(o.shipping) : 'Free'}</span></div>
        <div className="d-line total"><span>Total</span><b>{rs(o.total)}</b></div>
      </div>
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Payment</h3>
        <span className={`badge ${o.paymentStatus === 'PAID' ? 'ok' : o.paymentStatus === 'AWAITING_CHECK' ? 'warn' : ''}`}>{PAY_STATUS_LABEL[o.paymentStatus]}</span></div>
      <div className="d-line"><span>Method</span><span>{PAY_LABEL[o.payment] ?? o.payment}</span></div>
      {o.paymentRef && <div className="d-line"><span>{o.payment === 'upi' ? 'UTR' : 'Payment id'}</span><b style={{ fontFamily: 'var(--f-mono)' }}>{o.paymentRef}</b></div>}
      {o.gatewayOrderId && <div className="d-line"><span>Razorpay order</span><span style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>{o.gatewayOrderId}</span></div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        {o.paymentStatus === 'AWAITING_CHECK' && <>
          <ActBtn className="btn btn-solid btn-sm" act={setPayment.bind(null, o.id, 'received')}>UTR matches — mark received</ActBtn>
          <ActBtn act={setPayment.bind(null, o.id, 'reject')} confirm="Reject this UTR? The customer will be asked to pay again.">Reject UTR</ActBtn>
        </>}
        {(o.paymentStatus === 'PENDING' || o.paymentStatus === 'FAILED') && o.status !== 'CANCELLED' &&
          <ActBtn act={setPayment.bind(null, o.id, 'received')} confirm="Mark this order as paid? Only do this once the money is in your account.">Mark as paid</ActBtn>}
        {o.paymentStatus === 'PAID' &&
          <ActBtn act={setPayment.bind(null, o.id, 'refund')} confirm={o.payment === 'razorpay' ? 'Refund the full amount through Razorpay?' : 'Mark as refunded? Send the money back yourself first.'}>Refund</ActBtn>}
      </div>
    </div>

    {canEditAddress && (
      <div className="panel">
        <div className="panel-head"><h3>Change delivery address</h3></div>
        <AdminForm action={updateOrderAddress.bind(null, o.id)}>
          <div className="two">
            <div className="field"><label htmlFor="ad-name">Name</label><input className="input" id="ad-name" name="name" defaultValue={a.name} /></div>
            <div className="field"><label htmlFor="ad-phone">Phone</label><input className="input" id="ad-phone" name="phone" defaultValue={a.phone} /></div>
          </div>
          <div className="field"><label htmlFor="ad-line">Flat, building, street</label><input className="input" id="ad-line" name="line" defaultValue={a.line} /></div>
          <div className="two">
            <div className="field"><label htmlFor="ad-city">City</label><input className="input" id="ad-city" name="city" defaultValue={a.city} /></div>
            <div className="field"><label htmlFor="ad-state">State</label><input className="input" id="ad-state" name="state" defaultValue={a.state} /></div>
          </div>
          <div className="two">
            <div className="field"><label htmlFor="ad-pin">PIN</label><input className="input" id="ad-pin" name="pin" defaultValue={a.pin} /></div>
            <div className="field"><label htmlFor="ad-land">Landmark</label><input className="input" id="ad-land" name="landmark" defaultValue={a.landmark ?? ''} /></div>
          </div>
          <button className="btn btn-solid btn-sm">Save address</button>
        </AdminForm>
      </div>
    )}

    <div className="panel">
      <div className="panel-head"><h3>Status history</h3></div>
      {o.events.map(e => (
        <div key={e.id} style={{ display: 'flex', gap: 12, fontSize: 12.5, color: 'var(--ink-soft)', padding: '6px 0', alignItems: 'center' }}>
          <span className={`badge ${statusTone(e.status)}`}>{STATUS_LABEL[e.status]}</span>
          <span>{e.by === o.userId ? 'by the customer' : e.by ? `by ${admins.find(x => x.id === e.by)?.name ?? 'staff'}` : 'automatic'}</span>
          <span style={{ marginLeft: 'auto' }}>{when(e.at)}</span></div>
      ))}
    </div>
  </>;
}
