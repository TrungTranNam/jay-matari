'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { removeFromBag, setBagQty, toggleWish } from '@/app/(shop)/actions';
import { toast } from '@/components/Toaster';
import type { Cart } from '@/lib/bag';
import { img, rs } from '@/lib/format';

export default function CartView({ cart, freeFrom }: { cart: Cart; freeFrom: number }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; msg: string }>) => start(async () => {
    const r = await fn();
    if (r.msg) toast(r.msg, r.ok ? undefined : 'bad');
  });

  return <>
    <div className="steps-bar">
      <div className="sbar on">1 · Your bag</div>
      <div className="sbar">2 · Delivery address</div>
      <div className="sbar">3 · Payment</div>
    </div>
    <div className="checkout">
      <div className="panel" style={{ opacity: pending ? .7 : 1 }}>
        <h3>Review your pieces</h3>
        <p className="sub">Change size or quantity here before you check out.</p>
        {cart.items.map(i => (
          <div className="big-row" key={i.key}>
            <img src={img(i.img)} alt={i.name} />
            <div className="info">
              <h4><Link href={`/product/${i.sku}`}>{i.name}</Link></h4>
              <div className="meta">{i.sku} · Size {i.size} · {i.color}</div>
              <div style={{ fontFamily: 'var(--f-mono)', color: 'var(--gold)', fontSize: 14 }}>{rs(i.price)} each</div>
              {i.qty > i.stock && <div className="err-msg">Only {i.stock} left — lower the quantity to check out.</div>}
              <div className="row-tools">
                <div className="qty">
                  <button onClick={() => run(() => setBagQty(i.key, i.qty - 1))} disabled={pending || i.qty <= 1} aria-label="Decrease">−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => run(() => setBagQty(i.key, i.qty + 1))} disabled={pending} aria-label="Increase">+</button>
                </div>
                <button className="link-x" onClick={() => run(() => removeFromBag(i.key))} disabled={pending}>Remove</button>
                <button className="link-x" onClick={() => run(() => toggleWish(i.sku))} disabled={pending}>Save for later</button>
              </div>
            </div>
            <div className="amt">{rs(i.price * i.qty)}</div>
          </div>
        ))}
        <div style={{ marginTop: 24 }}><Link href="/shop" className="btn btn-line btn-sm">
          <i className="bx bx-left-arrow-alt" /> Keep shopping</Link></div>
      </div>

      <aside className="panel summary">
        <h3>Order summary</h3>
        <p className="sub">{cart.count} item{cart.count === 1 ? '' : 's'} in your bag</p>
        <div className="d-line"><span>Subtotal</span><span>{rs(cart.sub)}</span></div>
        <div className="d-line"><span>Delivery</span><span>{cart.ship ? rs(cart.ship) : 'Free'}</span></div>
        {cart.ship > 0 && <div style={{ fontSize: 11.5, color: 'var(--gold)', margin: '-2px 0 8px' }}>
          Add {rs(freeFrom - cart.sub)} more for free delivery</div>}
        <div className="d-line total"><span>Total</span><b>{rs(cart.total)}</b></div>
        {/* /checkout is phase 3; middleware sends guests to sign in first */}
        <Link href="/checkout" className="btn btn-solid btn-block">Continue to address</Link>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--ink-soft)' }}>
          <span><i className="bx bx-lock-alt" style={{ color: 'var(--gold)' }} /> Secure checkout</span>
          <span><i className="bx bx-refresh" style={{ color: 'var(--gold)' }} /> 7-day exchange on unworn pieces</span>
          <span><i className="bx bx-ruler" style={{ color: 'var(--gold)' }} /> Free fit adjustment before dispatch</span>
        </div>
      </aside>
    </div>
  </>;
}
