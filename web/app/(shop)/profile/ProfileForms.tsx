'use client';

import { useState, useTransition } from 'react';
import type { Address } from '@prisma/client';
import { changePassword, deleteAccount, removeAddress, updateDetails } from '@/app/(shop)/account-actions';
import { toast } from '@/components/Toaster';

const Label = ({ children }: { children: React.ReactNode }) =>
  <div className="mono" style={{ color: 'var(--ink-faint)', marginBottom: 6 }}>{children}</div>;

export function DetailsPanel(u: { name: string; email: string; phone: string; created: string }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(u);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const field = (k: 'name' | 'email' | 'phone') => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });

  const save = () => start(async () => {
    const r = await updateDetails({ name: form.name, email: form.email, phone: form.phone });
    if (!r.ok) return setErr(r.msg);
    setErr(''); setEdit(false); toast(r.msg, 'ok');
  });

  return (
    <div className="panel">
      <div className="panel-head"><h3>Your details</h3>
        <button className="btn btn-line btn-sm" onClick={() => { setForm(u); setEdit(!edit); }}>Edit details</button></div>
      {!edit ? <>
        <div className="two">
          <div><Label>Full name</Label><div style={{ fontSize: 15 }}>{u.name}</div></div>
          <div><Label>Email address</Label><div style={{ fontSize: 15, wordBreak: 'break-all' }}>{u.email}</div></div>
        </div>
        <div className="two" style={{ marginTop: 20 }}>
          <div><Label>Mobile number</Label><div style={{ fontSize: 15 }}>{u.phone || 'Not added'}</div></div>
          <div><Label>Account created</Label><div style={{ fontSize: 15 }}>{u.created}</div></div>
        </div>
      </> : <>
        <div className="two">
          <div className="field"><label htmlFor="e-name">Full name</label><input className="input" id="e-name" {...field('name')} /></div>
          <div className="field"><label htmlFor="e-phone">Mobile number</label><input className="input" id="e-phone" {...field('phone')} /></div>
        </div>
        <div className="field"><label htmlFor="e-email">Email address</label><input className="input" id="e-email" type="email" {...field('email')} /></div>
        <div className="err-msg">{err}</div>
        <div style={{ display: 'flex', gap: 11 }}>
          <button className="btn btn-solid btn-sm" onClick={save} disabled={pending}>Save changes</button>
          <button className="btn btn-line btn-sm" onClick={() => setEdit(false)}>Cancel</button></div>
      </>}
    </div>
  );
}

export function AddressCard({ a }: { a: Address }) {
  const [pending, start] = useTransition();
  return (
    <div className="addr-card" style={{ opacity: pending ? .5 : 1 }}>
      <button className="x" aria-label="Remove address" disabled={pending}
              onClick={() => start(async () => { toast((await removeAddress(a.id)).msg); })}><i className="bx bx-x" /></button>
      <b>{a.name}</b>{a.line}<br />{a.city}, {a.state} — {a.pin}<br />
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>{a.phone}</span>
    </div>
  );
}

export function PasswordPanel() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    const r = await changePassword(cur, next);
    if (!r.ok) return setErr(r.msg);
    setErr(''); setCur(''); setNext(''); toast(r.msg, 'ok');
  });
  return (
    <div className="panel">
      <div className="panel-head"><h3>Change password</h3></div>
      <div className="two">
        <div className="field"><label htmlFor="p-old">Current password</label>
          <input className="input" type="password" id="p-old" value={cur} onChange={e => setCur(e.target.value)} autoComplete="current-password" placeholder="••••••••" /></div>
        <div className="field"><label htmlFor="p-new">New password</label>
          <input className="input" type="password" id="p-new" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" /></div>
      </div>
      <div className="err-msg">{err}</div>
      <button className="btn btn-solid btn-sm" onClick={save} disabled={pending}>Update password</button>
    </div>
  );
}

export function DeleteAccount() {
  const [pending, start] = useTransition();
  return (
    <div className="panel" style={{ borderColor: 'rgba(163,43,54,.35)' }}>
      <div className="panel-head"><h3 style={{ color: 'var(--bad)' }}>Delete account</h3></div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 18, maxWidth: '60ch' }}>
        This removes your profile, addresses, bag and wishlist. Past orders, with their delivery addresses, stay in our records for accounting.</p>
      <button className="btn btn-line btn-sm" disabled={pending} style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }}
        onClick={() => {
          if (!confirm('Delete your account? Your bag and wishlist go too. This cannot be undone.')) return;
          start(async () => { await deleteAccount(); });
        }}>Delete my account</button>
    </div>
  );
}
