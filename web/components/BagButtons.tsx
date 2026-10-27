'use client';

import { useOptimistic, useTransition } from 'react';
import { addToBag, toggleWish } from '@/app/(shop)/actions';
import { openBag } from './CartDrawer';
import { toast } from './Toaster';

type AddProps = { sku: string; size?: string; color?: string; qty?: number; soldOut?: boolean;
  className?: string; children: React.ReactNode; then?: 'drawer' | 'cart' };

export function AddButton({ sku, size, color, qty, soldOut, className = 'btn btn-solid', children, then = 'drawer' }: AddProps) {
  const [pending, start] = useTransition();
  return (
    <button className={className} disabled={pending || soldOut} onClick={e => {
      e.preventDefault();
      start(async () => {
        const r = await addToBag({ sku, size, color, qty });
        if (!r.ok) return toast(r.msg, 'bad');
        if (then === 'cart') location.assign('/cart');
        else { toast(r.msg, 'ok'); openBag(); }
      });
    }}>{children}</button>
  );
}

type WishProps = { sku: string; on: boolean; className?: string; label: string; style?: React.CSSProperties };

export function WishButton({ sku, on, className = 'wish', label, style }: WishProps) {
  const [optimistic, set] = useOptimistic(on);
  const [, start] = useTransition();
  return (
    <button className={`${className} ${optimistic ? 'on' : ''}`} style={style} aria-label={label} aria-pressed={optimistic}
      onClick={e => {
        e.preventDefault();
        start(async () => {
          set(!optimistic);
          const r = await toggleWish(sku);
          toast(r.msg, r.ok && r.on ? 'ok' : r.ok ? undefined : 'bad');
        });
      }}>
      <i className={`bx bx${optimistic ? 's' : ''}-heart`} style={className !== 'wish' ? { fontSize: 19, color: optimistic ? 'var(--bad)' : 'inherit' } : undefined} />
    </button>
  );
}
