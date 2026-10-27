'use client';

import { useState } from 'react';
import { AddButton, WishButton } from '@/components/BagButtons';
import { MAX_QTY } from '@/lib/pricing';

type Props = { sku: string; name: string; sizes: string[]; colors: string[]; stock: number; wished: boolean };

export default function BuyBox({ sku, name, sizes, colors, stock, wished }: Props) {
  const [size, setSize] = useState(sizes[0]);
  const [color, setColor] = useState(colors[0]);
  const [qty, setQty] = useState(1);
  const soldOut = stock <= 0;
  const cap = Math.max(1, Math.min(MAX_QTY, stock));

  return <>
    <div className="opt-row"><h5><span>Size</span><span style={{ color: 'var(--gold)' }}>Free adjustment</span></h5>
      <div className="pills">{sizes.map(s =>
        <button key={s} className={`pill ${s === size ? 'on' : ''}`} onClick={() => setSize(s)} aria-pressed={s === size}>{s}</button>)}</div></div>
    <div className="opt-row"><h5>Colour</h5>
      <div className="pills">{colors.map(c =>
        <button key={c} className={`pill ${c === color ? 'on' : ''}`} onClick={() => setColor(c)} aria-pressed={c === color}>{c}</button>)}</div></div>
    <div className="opt-row"><h5>Quantity</h5>
      <div className="qty" style={{ transform: 'scale(1.15)', transformOrigin: 'left' }}>
        <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
        <span>{qty}</span>
        <button onClick={() => setQty(Math.min(cap, qty + 1))} aria-label="Increase">+</button></div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: soldOut ? 'var(--bad)' : 'var(--ok)' }}>
        {soldOut ? '● Sold out — join the waitlist' : stock < 5 ? `● Only ${stock} left in this run` : '● In stock, ships in 2 days'}</div>
    </div>
    <div className="buy-row">
      <AddButton sku={sku} size={size} color={color} qty={qty} soldOut={soldOut}><i className="bx bx-shopping-bag" /> Add to bag</AddButton>
      <AddButton sku={sku} size={size} color={color} qty={qty} soldOut={soldOut} className="btn btn-gold" then="cart"><i className="bx bx-bolt" /> Buy now</AddButton>
      <WishButton sku={sku} on={wished} className="btn btn-line" label={`Save ${name} to wishlist`} style={{ flex: '0 0 56px', minWidth: 56 }} />
    </div>
  </>;
}
