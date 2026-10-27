'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { OrderStatus, PayStatus } from '@prisma/client';
import { cancelOrder, orderAgain } from '@/app/(shop)/account-actions';
import { openBag } from '@/components/CartDrawer';
import { payWithRazorpay } from '@/components/razorpay';
import { toast } from '@/components/Toaster';
import UpiSheet from '@/components/UpiSheet';
import { img, rs } from '@/lib/format';
import { CANCELLABLE, FLOW, PAY_LABEL, PAY_STATUS_LABEL, STATUS_LABEL, needsPayment, statusTone, type OrderAddress, type OrderItem } from '@/lib/orders';

export type OrderRow = {
  id: string; status: OrderStatus; payment: string; paymentStatus: PayStatus; total: number; placed: string;
  items: OrderItem[]; address: OrderAddress; when: Partial<Record<OrderStatus, string>>;
};

const NOTE: Partial<Record<OrderStatus, string>> = {
  PLACED: 'We have your order', CONFIRMED: 'Karigar assigned', PACKED: 'Boxed and labelled', SHIPPED: 'On the way', DELIVERED: 'Handed to you',
};
const active = (o: OrderRow) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
const FILTERS = {
  all: ['All orders', () => true],
  active: ['In progress', active],
  DELIVERED: ['Delivered', (o: OrderRow) => o.status === 'DELIVERED'],
  CANCELLED: ['Cancelled', (o: OrderRow) => o.status === 'CANCELLED'],
} as const;

export default function OrdersView({ orders, upi }: { orders: OrderRow[]; upi: { upiId: string; payee: string } | null }) {
  const [filter, setFilter] = useState<keyof typeof FILTERS>('all');
  const [upiFor, setUpiFor] = useState<OrderRow | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const list = orders.filter(FILTERS[filter][1]);

  // ponytail: 30s polling; switch to SSE if near-instant status matters
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) router.refresh(); }, 30_000);
    return () => clearInterval(t);
  }, [router]);

  const cancel = (id: string) => {
    if (!confirm('Cancel this order? If it is already with the karigar we will call you.')) return;
    start(async () => { const r = await cancelOrder(id); toast(r.msg, r.ok ? undefined : 'bad'); });
  };
  const pay = (o: OrderRow) => {
    if (o.payment === 'upi') return upi ? setUpiFor(o) : toast('UPI is not available right now — call us to pay.', 'bad');
    start(async () => {
      const r = await payWithRazorpay(o.id);
      if (r === 'paid') { toast('Payment received — thank you', 'ok'); router.refresh(); }
      else if (r !== 'dismissed') toast(r.error, 'bad');
    });
  };
  const again = (id: string) => start(async () => {
    const r = await orderAgain(id);
    toast(r.msg, r.ok ? 'ok' : 'bad');
    if (r.ok) openBag();
  });

  return <>
    <div className="tabs">
      {(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map(k => (
        <button key={k} className={`ftab ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
          {FILTERS[k][0]} ({orders.filter(FILTERS[k][1]).length})</button>
      ))}
    </div>

    {!list.length ? (
      <div className="empty-state"><i className="bx bx-package" />
        <h4>{filter === 'all' ? 'No orders yet' : 'Nothing in this list'}</h4>
        <p>{filter === 'all' ? 'Everything you buy shows up here, with its status all the way to your door.' : 'Try another tab above.'}</p>
        <Link href="/shop" className="btn btn-solid">Browse the collection</Link></div>
    ) : list.map(o => {
      const cancelled = o.status === 'CANCELLED';
      const idx = FLOW.indexOf(o.status);
      return (
        <article key={o.id} className={`order ${cancelled ? 'cancelled' : ''}`} style={{ opacity: pending ? .7 : undefined }}>
          <div className="o-head">
            <div className="o-meta"><span className="k">Order</span><span className="v id">{o.id}</span></div>
            <div className="o-meta"><span className="k">Placed on</span><span className="v">{o.placed}</span></div>
            <div className="o-meta"><span className="k">Total</span><span className="v">{rs(o.total)}</span></div>
            <div className="o-meta"><span className="k">Payment</span><span className="v">{PAY_LABEL[o.payment] ?? o.payment}
              {o.payment !== 'cod' && <small style={{ display: 'block', fontWeight: 400, fontSize: 11.5, color: o.paymentStatus === 'PAID' ? 'var(--ok)' : 'var(--warn)' }}>
                {PAY_STATUS_LABEL[o.paymentStatus]}</small>}</span></div>
            <div className="o-right">
              <span className={`badge ${statusTone(o.status)}`}>{active(o) && <span className="live-dot" />} {STATUS_LABEL[o.status]}</span>
            </div>
          </div>
          <div className="o-body">
            {o.items.map(i => (
              <div key={`${i.sku}|${i.size}|${i.color}`} className="o-item">
                <img src={img(i.img)} alt={i.name} />
                <div className="t"><b><Link href={`/product/${i.sku}`}>{i.name}</Link></b>
                  <small>{i.sku} · Size {i.size} · {i.color} · Qty {i.qty}</small></div>
                <b style={{ fontFamily: 'var(--f-mono)', fontSize: 14 }}>{rs(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          {cancelled ? (
            <div className="track" style={{ justifyContent: 'center', padding: 22 }}>
              <span className="badge bad"><i className="bx bx-x-circle" /> This order was cancelled on {o.when.CANCELLED}</span></div>
          ) : (
            <div className="track">{FLOW.map((s, k) => (
              <div key={s} className={`tstep ${k < idx ? 'done' : k === idx ? 'now' : ''}`}>
                <span className="dot" /><b>{STATUS_LABEL[s]}</b><small>{o.when[s] || NOTE[s]}</small></div>
            ))}</div>
          )}
          <div className="o-foot">
            <div className="o-addr"><i className="bx bx-map" style={{ color: 'var(--gold)' }} />{' '}
              {o.address.name}, {o.address.line}, {o.address.city}, {o.address.state} — {o.address.pin} · {o.address.phone}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {needsPayment(o) && <button className="btn btn-gold btn-sm" disabled={pending} onClick={() => pay(o)}>Pay {rs(o.total)} now</button>}
              {CANCELLABLE.includes(o.status) && (
                <button className="btn btn-line btn-sm" disabled={pending} onClick={() => cancel(o.id)}
                        style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }}>Cancel order</button>)}
              {o.status === 'DELIVERED' && <Link href={`/product/${o.items[0].sku}`} className="btn btn-line btn-sm">Write a review</Link>}
              <button className="btn btn-solid btn-sm" disabled={pending} onClick={() => again(o.id)}>Order again</button>
            </div>
          </div>
        </article>
      );
    })}
    {upiFor && upi && <UpiSheet orderId={upiFor.id} amount={upiFor.total} upiId={upi.upiId} payee={upi.payee}
      onClose={() => setUpiFor(null)} onPaid={() => { setUpiFor(null); router.refresh(); }} />}
  </>;
}
