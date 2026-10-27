'use client';

import { useEffect, useState } from 'react';

type T = { id: number; msg: string; kind?: 'ok' | 'bad'; out?: boolean };

export function toast(msg: string, kind?: 'ok' | 'bad') {
  dispatchEvent(new CustomEvent('jmc:toast', { detail: { msg, kind } }));
}

const ICON = { ok: 'bx-check-circle', bad: 'bx-error-circle' };

export default function Toaster() {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = { id: Date.now() + Math.random(), ...(e as CustomEvent).detail } as T;
      setList(l => [...l, t]);
      setTimeout(() => setList(l => l.map(x => x.id === t.id ? { ...x, out: true } : x)), 2800);
      setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), 3100);
    };
    addEventListener('jmc:toast', on);
    return () => removeEventListener('jmc:toast', on);
  }, []);
  return (
    <div id="toast-stack" aria-live="polite">
      {list.map(t => (
        <div key={t.id} className={`toast ${t.kind ?? ''} ${t.out ? 'out' : ''}`}>
          <i className={`bx ${t.kind ? ICON[t.kind] : 'bx-info-circle'}`} /><span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
