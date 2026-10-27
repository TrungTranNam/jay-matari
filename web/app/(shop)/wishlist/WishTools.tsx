'use client';

import { useTransition } from 'react';
import { clearWish, moveWishToBag } from '@/app/(shop)/actions';
import { openBag } from '@/components/CartDrawer';
import { toast } from '@/components/Toaster';

export default function WishTools() {
  const [pending, start] = useTransition();
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button className="btn btn-line btn-sm" disabled={pending} onClick={() => {
        if (!confirm('Clear everything from your wishlist?')) return;
        start(async () => { toast((await clearWish()).msg); });
      }}>Clear wishlist</button>
      <button className="btn btn-solid btn-sm" disabled={pending} onClick={() => start(async () => {
        const r = await moveWishToBag();
        toast(r.msg, r.ok ? 'ok' : 'bad');
        if (r.ok) openBag();
      })}>Move everything to bag</button>
    </div>
  );
}
