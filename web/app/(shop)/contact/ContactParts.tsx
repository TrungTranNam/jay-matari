'use client';

import { useState, useTransition } from 'react';
import { sendMessage } from '@/app/(shop)/actions';
import { toast } from '@/components/Toaster';

const TOPICS = ['Bridal consultation', 'Sizing & fit', 'An existing order', 'Wholesale enquiry', 'Something else'];

export function ContactForm(u: { name: string; email: string; phone: string }) {
  const [f, setF] = useState({ ...u, subject: TOPICS[0], body: '' });
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const bind = (k: keyof typeof f) => ({
    value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }),
  });

  const send = () => start(async () => {
    const r = await sendMessage(f);
    if (!r.ok) return setErr(r.msg);
    setErr(''); setF({ ...f, body: '' }); toast(r.msg, 'ok');
  });

  return <>
    <div className="two">
      <div className="field"><label htmlFor="c-name">Your name</label><input className="input" id="c-name" placeholder="Riddhi Patel" {...bind('name')} /></div>
      <div className="field"><label htmlFor="c-phone">Mobile number</label><input className="input" id="c-phone" placeholder="98250 00000" {...bind('phone')} /></div>
    </div>
    <div className="two">
      <div className="field"><label htmlFor="c-email">Email address</label><input className="input" type="email" id="c-email" placeholder="you@email.com" {...bind('email')} /></div>
      <div className="field"><label htmlFor="c-topic">What is it about?</label>
        <select className="input" id="c-topic" {...bind('subject')}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></div>
    </div>
    <div className="field"><label htmlFor="c-msg">Your message</label>
      <textarea className="input" id="c-msg" placeholder="Tell us the date you need it by, and we'll tell you straight away if it's possible." {...bind('body')} /></div>
    <div className="err-msg">{err}</div>
    <button className="btn btn-solid" onClick={send} disabled={pending}>
      {pending ? <><span className="spinner" /> Sending</> : 'Send message'}</button>
  </>;
}

export function Faq({ q, a }: { q: string; a: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className={`faq ${on ? 'on' : ''}`}>
      <button className="q" aria-expanded={on} onClick={() => setOn(!on)}>{q} <i className="bx bx-plus" /></button>
      <div className="ans">{a}</div>
    </div>
  );
}
