'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { removeFromBag, setBagQty } from '@/app/(shop)/actions';
import type { Cart } from '@/lib/bag';
import { img, rs } from '@/lib/format';
import { toast } from './Toaster';

// Slide-out bag. Anything can open it with openBag(); the cart prop refreshes
// itself because every bag action revalidates the layout.
export const openBag = () => dispatchEvent(new Event('jmc:open-bag'));

export default function CartDrawer({ cart }: { cart: Cart }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const show = () => setOpen(true);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('jmc:open-bag', show);
    addEventListener('keydown', esc);
    return () => { removeEventListener('jmc:open-bag', show); removeEventListener('keydown', esc); };
  }, []);

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  const run = (fn: () => Promise<{ ok: boolean; msg: string }>) => start(async () => {
    const r = await fn();
    if (r.msg) toast(r.msg, r.ok ? undefined : 'bad');
  });

  return <>
    <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
    <aside className={`drawer ${open ? 'open' : ''}`} aria-label="Your bag" aria-hidden={!open}>
      <div className="drawer-head">
        <h3>Your bag</h3>
        <button className="tool-btn" onClick={() => setOpen(false)} aria-label="Close bag"><i className="bx bx-x" /></button>
      </div>
      <div className="drawer-body" style={{ opacity: pending ? .6 : 1 }}>
        {!cart.items.length ? (
          <div className="empty-state"><i className="bx bx-shopping-bag" />
            <h4>Your bag is empty</h4><p>Pieces you add will appear here.</p>
            <Link href="/shop" className="btn btn-solid" onClick={() => setOpen(false)}>Browse the collection</Link></div>
        ) : cart.items.map(i => (
          <div className="cart-row" key={i.key}>
            <img src={img(i.img)} alt={i.name} />
            <div className="cart-row-main">
              <h4>{i.name}</h4>
              <div className="sku">{i.sku} · Size {i.size} · {i.color}</div>
              <div className="rs">{rs(i.price)}</div>
              <div className="qty">
                <button onClick={() => run(() => setBagQty(i.key, i.qty - 1))} disabled={pending || i.qty <= 1} aria-label="Decrease">−</button>
                <span>{i.qty}</span>
                <button onClick={() => run(() => setBagQty(i.key, i.qty + 1))} disabled={pending} aria-label="Increase">+</button>
              </div>
            </div>
            <button className="row-x" onClick={() => run(() => removeFromBag(i.key))} disabled={pending} aria-label="Remove"><i className="bx bx-x" /></button>
          </div>
        ))}
      </div>
      {cart.items.length > 0 && (
        <div className="drawer-foot">
          <div className="d-line"><span>Subtotal</span><span>{rs(cart.sub)}</span></div>
          <div className="d-line"><span>Delivery</span><span>{cart.ship ? rs(cart.ship) : 'Free'}</span></div>
          <div className="d-line total"><span>Total</span><b>{rs(cart.total)}</b></div>
          <Link href="/cart" className="btn btn-solid btn-block" onClick={() => setOpen(false)}>Review bag &amp; check out</Link>
        </div>
      )}
    </aside>
  </>;
}
