'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { payWithRazorpay } from '@/components/razorpay';
import { toast } from '@/components/Toaster';
import UpiSheet from '@/components/UpiSheet';
import type { Cart } from '@/lib/bag';
import type { Method, paymentOptions } from '@/lib/checkout';
import { rs } from '@/lib/format';
import { PAY_LABEL } from '@/lib/orders';
import { FREE_SHIP_FROM } from '@/lib/pricing';
import { checkout, type Placed } from './actions';

type Addr = { name: string; phone: string; line: string; city: string; state: string; pin: string; landmark: string };
type Props = {
  cart: Cart; options: Awaited<ReturnType<typeof paymentOptions>>;
  me: { name: string; phone: string }; saved: (Addr & { id: number })[];
};

export default function CheckoutFlow({ cart, options, me, saved }: Props) {
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [addr, setAddr] = useState<Addr>(saved[0] ?? { name: me.name, phone: me.phone, line: '', city: '', state: 'Gujarat', pin: '', landmark: '' });
  const [savedId, setSavedId] = useState<number | undefined>(saved[0]?.id);
  const methods = ([options.upi && 'upi', options.razorpay && 'razorpay', options.cod && 'cod'].filter(Boolean)) as Method[];
  const [method, setMethod] = useState<Method | undefined>(methods[0]);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [paid, setPaid] = useState<'paid' | 'verifying' | 'unpaid' | null>(null);
  const [upiOpen, setUpiOpen] = useState(false);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  const codFee = method === 'cod' ? options.codFee : 0;
  const total = cart.total + codFee;

  if (step === 4 && placed) return <Done o={placed} paid={paid} onPay={() => pay(placed)} upi={upiOpen && options.upi ? (
    <UpiSheet orderId={placed.id} amount={placed.total} upiId={options.upi.upiId} payee={options.upi.payee}
      onClose={() => setUpiOpen(false)} onPaid={() => { setUpiOpen(false); setPaid('verifying'); }} />) : null} />;

  if (!cart.items.length) return (
    <div className="empty-state"><i className="bx bx-shopping-bag" />
      <h4>Your bag is empty</h4><p>Add a piece to your bag, then come back here to check out.</p>
      <Link href="/shop" className="btn btn-solid">Browse the collection</Link></div>
  );

  const field = (k: keyof Addr) => ({ value: addr[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setSavedId(undefined); setAddr({ ...addr, [k]: e.target.value }); } });

  // mirrors the server checks so most mistakes never leave the browser; the server still re-checks
  const toPayment = () => {
    const bad = addr.name.trim().length < 2 ? 'Enter the name for the delivery.'
      : !/^[\d+\s-]{10,15}$/.test(addr.phone.trim()) ? 'Enter a 10-digit mobile number.'
      : addr.line.trim().length < 6 ? 'Enter the flat and street.'
      : !addr.city.trim() ? 'Enter the city.'
      : !/^\d{6}$/.test(addr.pin.trim()) ? 'PIN code must be 6 digits.' : '';
    setErr(bad);
    if (!bad) { setStep(3); scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  function pay(o: Placed) {
    if (o.payment === 'upi') return setUpiOpen(true);
    if (o.payment === 'razorpay') start(async () => {
      const r = await payWithRazorpay(o.id);
      if (r === 'paid') { setPaid('paid'); toast('Payment received — thank you', 'ok'); }
      else if (r === 'dismissed') setPaid('unpaid');
      else { setPaid('unpaid'); toast(r.error, 'bad'); }
    });
  }

  const place = () => start(async () => {
    if (!method) return;
    const r = await checkout({ method, ...(savedId ? { addressId: savedId } : { address: addr }) });
    if (!r.ok) return setErr(r.msg);
    setErr(''); setPlaced(r.order); setStep(4); scrollTo({ top: 0, behavior: 'smooth' });
    if (method === 'cod') { setPaid(null); toast('Order placed — thank you', 'ok'); }
    else { setPaid('unpaid'); pay(r.order); }
  });

  const bar = (
    <div className="steps-bar">
      <div className="sbar done">1 · Your bag</div>
      <div className={`sbar ${step === 2 ? 'on' : 'done'}`}>2 · Delivery address</div>
      <div className={`sbar ${step === 3 ? 'on' : ''}`}>3 · Payment</div>
    </div>
  );

  const summary = (
    <aside className="panel summary">
      <h3>Order summary</h3>
      <p className="sub">{cart.count} item{cart.count === 1 ? '' : 's'} in your bag</p>
      <div className="d-line"><span>Subtotal</span><span>{rs(cart.sub)}</span></div>
      <div className="d-line"><span>Delivery</span><span>{cart.ship ? rs(cart.ship) : 'Free'}</span></div>
      {codFee > 0 && <div className="d-line"><span>Cash handling</span><span>{rs(codFee)}</span></div>}
      <div className="d-line total"><span>Total</span><b>{rs(total)}</b></div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--ink-soft)' }}>
        <span><i className="bx bx-lock-alt" style={{ color: 'var(--gold)' }} /> Secure checkout</span>
        <span><i className="bx bx-refresh" style={{ color: 'var(--gold)' }} /> 7-day exchange on unworn pieces</span>
        <span><i className="bx bx-ruler" style={{ color: 'var(--gold)' }} /> Free fit adjustment before dispatch</span>
      </div>
    </aside>
  );

  if (step === 2) return <>
    {bar}
    <div className="checkout">
      <div className="panel">
        <h3>Where should it go?</h3>
        <p className="sub">We ship across India. Bridal orders get a call before dispatch.</p>
        {saved.length > 0 && (
          <div className="field"><label htmlFor="saved-pick">Use a saved address</label>
            <select className="input" id="saved-pick" value={savedId ?? ''} onChange={e => {
              const a = saved.find(x => x.id === Number(e.target.value));
              setSavedId(a?.id);
              setAddr(a ?? { name: me.name, phone: me.phone, line: '', city: '', state: 'Gujarat', pin: '', landmark: '' });
            }}>
              <option value="">Enter a new address</option>
              {saved.map(a => <option key={a.id} value={a.id}>{a.line}, {a.city} — {a.pin}</option>)}
            </select></div>
        )}
        <div className="two">
          <div className="field"><label htmlFor="a-name">Full name</label><input className="input" id="a-name" placeholder="Riddhi Patel" autoComplete="name" {...field('name')} /></div>
          <div className="field"><label htmlFor="a-phone">Mobile number</label><input className="input" id="a-phone" placeholder="98250 00000" inputMode="tel" autoComplete="tel" {...field('phone')} /></div>
        </div>
        <div className="field"><label htmlFor="a-line">Flat, building, street</label>
          <input className="input" id="a-line" placeholder="B-402, Shreeji Residency, Bhairavnath Road" autoComplete="street-address" {...field('line')} /></div>
        <div className="two">
          <div className="field"><label htmlFor="a-city">City</label><input className="input" id="a-city" placeholder="Ahmedabad" autoComplete="address-level2" {...field('city')} /></div>
          <div className="field"><label htmlFor="a-state">State</label><input className="input" id="a-state" autoComplete="address-level1" {...field('state')} /></div>
        </div>
        <div className="two">
          <div className="field"><label htmlFor="a-pin">PIN code</label><input className="input" id="a-pin" placeholder="380008" inputMode="numeric" maxLength={6} autoComplete="postal-code" {...field('pin')} /></div>
          <div className="field"><label htmlFor="a-land">Landmark (optional)</label><input className="input" id="a-land" placeholder="Near Jain temple" {...field('landmark')} /></div>
        </div>
        <div className="err-msg">{err}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/cart" className="btn btn-line"><i className="bx bx-left-arrow-alt" /> Back to bag</Link>
          <button className="btn btn-solid" onClick={toPayment} style={{ flex: 1 }}>Continue to payment</button>
        </div>
      </div>
      {summary}
    </div>
  </>;

  const OPTION: Record<Method, [string, string, string]> = {
    upi: ['bx-qr-scan', 'UPI', 'Scan a code with Google Pay, PhonePe, Paytm or your bank app. Paid straight to our account.'],
    razorpay: ['bx-credit-card-front', 'Card, netbanking or wallet', 'Visa, Mastercard, RuPay, 50+ banks and wallets, in Razorpay’s secure window.'],
    cod: ['bx-money', 'Cash on delivery', options.codFee && cart.sub < FREE_SHIP_FROM ? `Pay the delivery partner. ${rs(options.codFee)} cash handling below ${rs(FREE_SHIP_FROM)}.` : 'Pay the delivery partner in cash or UPI at the door.'],
  };

  return <>
    {bar}
    <div className="checkout">
      <div className="panel">
        <h3>How would you like to pay?</h3>
        <p className="sub">Shipping to {addr.line}, {addr.city} — {addr.pin}</p>
        {methods.length ? methods.map(m => (
          <label key={m} className="pay-choice" style={{ cursor: 'pointer', borderColor: method === m ? 'var(--gold)' : undefined }}>
            <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} style={{ accentColor: 'var(--gold)' }} />
            <div className="pc-mark"><i className={`bx ${OPTION[m][0]}`} /></div>
            <div className="pc-copy"><b>{OPTION[m][1]}</b><small>{OPTION[m][2]}</small></div>
          </label>
        )) : <p className="err-msg">No payment method is available for this order. Call us and we will sort it out.</p>}
        <div className="err-msg">{err}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <button className="btn btn-line" onClick={() => { setErr(''); setStep(2); }}><i className="bx bx-left-arrow-alt" /> Back</button>
          <button className="btn btn-gold" onClick={place} disabled={pending || !method} style={{ flex: 1 }}>
            {pending ? <><span className="spinner" /> Placing your order</> : method === 'cod' ? `Place order · ${rs(total)}` : `Pay ${rs(total)}`}</button>
        </div>
      </div>
      {summary}
    </div>
  </>;
}

function Done({ o, paid, onPay, upi }: { o: Placed; paid: 'paid' | 'verifying' | 'unpaid' | null; onPay: () => void; upi: React.ReactNode }) {
  const unpaid = paid === 'unpaid';
  return <>
    <div className="panel done-card">
      <div className="done-tick" style={unpaid ? { background: 'var(--warn)' } : undefined}><i className={`bx ${unpaid ? 'bx-time-five' : 'bx-check'}`} /></div>
      <h2 className="display-m">{unpaid ? 'Payment pending' : 'Order placed'}</h2>
      <p className="lede" style={{ margin: '14px auto 26px' }}>
        {unpaid
          ? `We are holding your pieces for 24 hours. Finish paying here or from My orders.`
          : `Thank you, ${o.firstName}. We have your order and will confirm it on ${o.address.phone} within a few hours.`}</p>
      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 22, textAlign: 'left', marginBottom: 26 }}>
        <div className="d-line"><span>Order number</span><b style={{ fontFamily: 'var(--f-mono)', color: 'var(--gold)' }}>{o.id}</b></div>
        <div className="d-line"><span>Items</span><span>{o.pieces}</span></div>
        <div className="d-line"><span>Payment</span><span>{PAY_LABEL[o.payment]}</span></div>
        {paid === 'verifying' && <div className="d-line"><span>Status</span><span style={{ color: 'var(--warn)' }}>Verifying your payment</span></div>}
        {paid === 'paid' && <div className="d-line"><span>Status</span><span style={{ color: 'var(--ok)' }}>Paid</span></div>}
        <div className="d-line"><span>Delivering to</span><span style={{ textAlign: 'right', maxWidth: '60%' }}>{o.address.line}, {o.address.city} — {o.address.pin}</span></div>
        <div className="d-line total"><span>{o.payment === 'cod' ? 'Due on delivery' : 'Total'}</span><b>{rs(o.total)}</b></div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {unpaid && <button className="btn btn-gold" onClick={onPay}>Pay {rs(o.total)} now</button>}
        <Link href="/orders" className="btn btn-solid">Track this order</Link>
        <Link href="/shop" className="btn btn-line">Keep shopping</Link>
      </div>
    </div>
    {upi}
  </>;
}
