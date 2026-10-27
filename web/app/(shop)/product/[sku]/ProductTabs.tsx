'use client';

import { useState, useTransition } from 'react';
import { postReview } from '@/app/(shop)/actions';
import { toast } from '@/components/Toaster';

type Review = { id: number; name: string; rating: number; text: string; at: string };
type Props = {
  sku: string; fabric: string; work: string; care: string; sizes: string[]; colors: string[];
  reviews: Review[]; signedIn: boolean;
};

export default function ProductTabs(p: Props) {
  const [tab, setTab] = useState<'specs' | 'delivery' | 'reviews'>('specs');
  return <>
    <div className="tabs">
      <button className={`tab ${tab === 'specs' ? 'on' : ''}`} onClick={() => setTab('specs')}>Details &amp; care</button>
      <button className={`tab ${tab === 'delivery' ? 'on' : ''}`} onClick={() => setTab('delivery')}>Delivery &amp; exchange</button>
      <button className={`tab ${tab === 'reviews' ? 'on' : ''}`} onClick={() => setTab('reviews')}>Reviews ({p.reviews.length})</button>
    </div>
    <div>
      {tab === 'specs' && (
        <table className="spec"><tbody>
          <tr><td>Fabric</td><td>{p.fabric}</td></tr>
          <tr><td>Work</td><td>{p.work}</td></tr>
          <tr><td>Care</td><td>{p.care}</td></tr>
          <tr><td>Sizes</td><td>{p.sizes.join(' · ')} — measured on the body, not the garment. Tell us your bust, waist and hip at checkout and we adjust free.</td></tr>
          <tr><td>Colours</td><td>{p.colors.join(' · ')}</td></tr>
          <tr><td>Origin</td><td>Cut, embroidered and finished in Maninagar, Ahmedabad</td></tr>
          <tr><td>SKU</td><td>{p.sku}</td></tr>
        </tbody></table>
      )}
      {tab === 'delivery' && (
        <div className="lede" style={{ maxWidth: '70ch' }}>
          <p style={{ marginBottom: 14 }}><b>Dispatch</b> — ready pieces leave within 2 working days. Made-to-measure and bridal take 3 to 4 weeks; we confirm the date on call before we start.</p>
          <p style={{ marginBottom: 14 }}><b>Delivery</b> — free above ₹2,999, otherwise ₹99. Metro cities in 3–4 days, rest of India in 5–7. You get a tracking link the moment it ships.</p>
          <p style={{ marginBottom: 14 }}><b>Exchange</b> — 7 days from delivery on unworn, untagged pieces. We pay the return pickup once per order.</p>
          <p><b>Bridal</b> — made to your measurements, so not returnable. That is why we do two fittings first.</p>
        </div>
      )}
      {tab === 'reviews' && (
        <div className="rev-layout">
          <div>{p.reviews.length ? p.reviews.map(r => (
            <div key={r.id} className="rev"><div className="rev-top">
              <div className="rev-av">{r.name.slice(0, 2).toUpperCase()}</div>
              <div><b style={{ fontSize: 13.5 }}>{r.name}</b>
                <div className="stars" style={{ fontSize: 11 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div></div>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{r.at}</span>
            </div><p>{r.text}</p></div>
          )) : (
            <div className="empty-state" style={{ textAlign: 'left', padding: '20px 0' }}><h4>No reviews yet</h4>
              <p>Be the first to tell others how this piece fits.</p></div>
          )}</div>
          <ReviewForm sku={p.sku} signedIn={p.signedIn} />
        </div>
      )}
    </div>
  </>;
}

function ReviewForm({ sku, signedIn }: { sku: string; signedIn: boolean }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  const send = () => start(async () => {
    if (!signedIn) { location.assign(`/login?callbackUrl=/product/${sku}`); return; }
    const r = await postReview({ sku, rating, text });
    if (!r.ok) return setErr(r.msg);
    setErr(''); setText(''); toast(r.msg, 'ok');
  });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 26 }}>
      <h4 style={{ fontFamily: 'var(--f-display)', fontSize: 21, marginBottom: 16 }}>Write a review</h4>
      <div className="field"><label>Your rating</label>
        <div className="rate-pick" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map(n => (
            <span key={n} role="radio" aria-checked={n === rating} tabIndex={0} className={n <= rating ? 'on' : ''}
                  onClick={() => setRating(n)} onKeyDown={e => e.key === 'Enter' && setRating(n)}>★</span>
          ))}
        </div></div>
      <div className="field"><label htmlFor="rev-text">Your review</label>
        <textarea className="input" id="rev-text" value={text} onChange={e => setText(e.target.value)}
                  placeholder="How does it fit? How is the fabric after a wash?" /></div>
      <div className="err-msg">{err}</div>
      <button className="btn btn-solid btn-block" onClick={send} disabled={pending}>
        {signedIn ? 'Post review' : 'Sign in to review'}</button>
    </div>
  );
}
