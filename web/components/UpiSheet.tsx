'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { payByUtr } from '@/app/(shop)/checkout/actions';
import { svg } from '@/lib/qr.js';
import { toast } from './Toaster';

// UPI pay sheet (from templates/assets/js/payments.js): a real intent QR to the shop's own VPA,
// app deep links, then the customer types the 12-digit UTR for the admin to match.
// Dropped from the template: "collect request to your UPI ID" — that needs a payment gateway.

const APPS = [
  { id: 'gpay', name: 'Google Pay', base: 'tez://upi/pay' },
  { id: 'phonepe', name: 'PhonePe', base: 'phonepe://pay' },
  { id: 'paytm', name: 'Paytm', base: 'paytmmp://pay' },
  { id: 'bhim', name: 'BHIM', base: 'upi://pay' },
];
const rs2 = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = { orderId: string; amount: number; upiId: string; payee: string; onClose: () => void; onPaid: () => void };

export default function UpiSheet({ orderId, amount, upiId, payee, onClose, onPaid }: Props) {
  const [left, setLeft] = useState(300);
  const [round, setRound] = useState(0);
  const [utr, setUtr] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const link = (base: string) => base + '?' + new URLSearchParams({
    pa: upiId, pn: payee, am: amount.toFixed(2), cu: 'INR', tn: `Order ${orderId}`, tr: orderId,
  }).toString().replace(/\+/g, '%20');
  const qr = useMemo(() => svg(link('upi://pay'), { size: 210, quiet: 4, dark: '#1B1020' }), [orderId, amount, upiId, payee]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLeft(300);
    const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [round]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', esc); };
  }, [onClose]);

  const submit = () => start(async () => {
    const r = await payByUtr(orderId, utr);
    if (!r.ok) return setErr(r.msg);
    setDone(true); toast(r.msg, 'ok');
  });

  return (
    <div className="pay-scrim open" onClick={e => e.target === e.currentTarget && onClose()}>
      <section className="pay-sheet" role="dialog" aria-modal="true" aria-label="Pay with UPI">
        <header className="pay-head">
          <div className="pay-head-l">
            <span className="pay-eyebrow">Secure checkout</span>
            <h3>{rs2(amount)}</h3>
            <span className="pay-ref">Ref {orderId}</span>
          </div>
          <div className="pay-head-r">
            <button className="tool-btn" onClick={onClose} aria-label="Close"><i className="bx bx-x" /></button>
          </div>
        </header>

        <div className="pay-body"><div className="pay-pane">
          {done ? (
            <div className="pay-success">
              <svg className="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l8 8 15-16" /></svg>
              <h4>Reference received</h4>
              <p>We&apos;ll confirm it against our bank statement and update your order shortly.</p>
              <div className="succ-lines">
                <div className="d-line"><span>Paid with</span><b>UPI</b></div>
                <div className="d-line"><span>UTR</span><b>{utr.replace(/\D/g, '')}</b></div>
              </div>
              <button className="btn btn-solid btn-block btn-lg" onClick={onPaid}>See your order</button>
            </div>
          ) : (
            <div className="upi-grid">
              <div className="upi-qr-card">
                <div className="qr-frame">
                  <div dangerouslySetInnerHTML={{ __html: qr }} />
                  <div className="qr-badge"><i className="bx bx-shield-quarter" /></div>
                  <div className={`qr-expired ${left ? '' : 'on'}`}>
                    <i className="bx bx-time-five" /><b>Code expired</b>
                    <button className="btn btn-line btn-sm" onClick={() => setRound(round + 1)}>Show a new code</button>
                  </div>
                </div>
                <div className="qr-meta">
                  <div className="qr-count"><i className="bx bx-time-five" /> Valid for{' '}
                    <b>{String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</b></div>
                  <div className="qr-vpa">
                    <span>{upiId}</span>
                    <button className="copy-btn" aria-label="Copy UPI ID" onClick={async () => {
                      try { await navigator.clipboard.writeText(upiId); toast('UPI ID copied'); }
                      catch { toast('Copy it manually: ' + upiId); }
                    }}><i className="bx bx-copy" /></button>
                  </div>
                </div>
              </div>

              <div className="upi-side">
                <h4>Scan with any UPI app</h4>
                <p className="pay-note">Open Google&nbsp;Pay, PhonePe, Paytm or your bank app, scan the code, and approve {rs2(amount)}.</p>
                <div className="upi-apps">
                  {APPS.map(a => (
                    <a key={a.id} className="upi-app" href={link(a.base)}>
                      <span className={`ua-mark ua-${a.id}`} /><b>{a.name}</b><i className="bx bx-right-arrow-alt" />
                    </a>
                  ))}
                </div>
                <p className="pay-hint"><i className="bx bx-mobile-alt" /> On a phone these buttons open the app directly.</p>

                <div className="upi-status manual">
                  <b>Paid already? Add the reference</b>
                  <small>Your UPI app shows a 12-digit UTR / transaction ID once the payment goes through.</small>
                  <div className="utr-row">
                    <input type="text" inputMode="numeric" maxLength={12} placeholder="12-digit UTR" aria-label="12-digit UTR"
                           value={utr} onChange={e => setUtr(e.target.value.replace(/\D/g, ''))} />
                    <button className="btn btn-solid" onClick={submit} disabled={pending}>Submit</button>
                  </div>
                  <div className="field-err">{err}</div>
                </div>
              </div>
            </div>
          )}
        </div></div>

        <footer className="pay-foot">
          <i className="bx bx-lock-alt" />
          <span>You pay straight into our bank account. We never see your UPI PIN.</span>
        </footer>
      </section>
    </div>
  );
}
