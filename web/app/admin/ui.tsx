'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from '@/components/Toaster';

export type AdminResult = { ok: boolean; msg: string; redirect?: string };

// A button that runs a (bound) server action, with optional confirm and a toast for the result.
export function ActBtn({ act, confirm: ask, className = 'btn btn-line btn-sm', title, children }: {
  act: () => Promise<AdminResult>; confirm?: string; className?: string; title?: string; children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className={className} title={title} aria-label={title} disabled={pending} onClick={() => {
      if (ask && !window.confirm(ask)) return;
      start(async () => {
        const r = await act();
        toast(r.msg, r.ok ? 'ok' : 'bad');
        if (r.redirect) router.push(r.redirect);
      });
    }}>{children}</button>
  );
}

// <form> that posts FormData to a server action without React's post-submit reset,
// so a validation error never wipes what the admin typed.
export function AdminForm({ action, children, className, resetOnSuccess }: {
  action: (f: FormData) => Promise<AdminResult>; children: React.ReactNode; className?: string; resetOnSuccess?: boolean;
}) {
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className={className} onSubmit={e => {
      e.preventDefault();
      const form = e.currentTarget, f = new FormData(form);
      start(async () => {
        const r = await action(f);
        if (!r.ok) return setErr(r.msg);
        setErr(''); toast(r.msg, 'ok');
        if (resetOnSuccess) form.reset();
        if (r.redirect) router.push(r.redirect);
      });
    }}>
      <fieldset disabled={pending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
      <div className="err-msg">{err}</div>
    </form>
  );
}

// select that saves on change
export function SelectAct({ value, options, act, className = 'st-sel' }: {
  value: string; options: [string, string][]; act: (v: string) => Promise<AdminResult>; className?: string;
}) {
  const [pending, start] = useTransition();
  // show the admin's pick right away; snap back only if the server refuses it
  const [shown, setShown] = useState(value);
  useEffect(() => setShown(value), [value]);
  return (
    <select className={className} value={shown} disabled={pending} aria-label="Change"
      onChange={e => {
        const v = e.target.value;
        setShown(v);
        start(async () => {
          const r = await act(v);
          toast(r.msg, r.ok ? 'ok' : 'bad');
          if (!r.ok) setShown(value);
        });
      }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

// number input that saves when you leave it or press Enter (not per keystroke: typing "12" must not save "1" first)
export function NumberAct({ value, min = 0, act, label }: { value: number; min?: number; act: (v: number) => Promise<AdminResult>; label: string }) {
  const [pending, start] = useTransition();
  return (
    <input type="number" className="input" style={{ width: 78, padding: '7px 9px', textAlign: 'center' }} min={min}
      defaultValue={value} key={value} disabled={pending} aria-label={label}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      onBlur={e => {
        const v = Math.max(min, Math.floor(+e.target.value || 0));
        if (v === value) return;
        start(async () => { const r = await act(v); toast(r.msg, r.ok ? 'ok' : 'bad'); });
      }} />
  );
}

// ponytail: the dashboard polls every 20s instead of a push channel; add SSE if the team needs it instant
export function AutoRefresh({ every = 20_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      // don't yank the page while someone is typing
      const el = document.activeElement;
      if (!document.hidden && !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}

export function AdminNav({ items }: { items: [href: string, icon: string, label: string, count: number][] }) {
  const path = usePathname();
  return (
    <nav className="anav">
      {items.map(([href, icon, label, n]) => {
        const on = href === '/admin' ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={on ? 'on' : undefined}>
          <i className={`bx ${icon}`} /> {label}{n > 0 && <span className="n">{n}</span>}</Link>;
      })}
    </nav>
  );
}
