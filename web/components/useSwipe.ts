import { RefObject, useEffect, useRef } from 'react';

// horizontal swipe on touch screens; ignores mostly-vertical drags so page scroll still works
export function useSwipe(ref: RefObject<HTMLElement | null>, left: () => void, right: () => void, threshold = 45) {
  const cb = useRef({ left, right });
  cb.current = { left, right };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x0: number | null = null, y0 = 0, locked = false;
    const start = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; locked = false; };
    const move = (e: TouchEvent) => {
      if (x0 == null) return;
      const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
      if (!locked && Math.abs(dx) > Math.abs(dy) + 6) locked = true;
    };
    const end = (e: TouchEvent) => {
      if (x0 != null && locked) {
        const dx = e.changedTouches[0].clientX - x0;
        if (dx < -threshold) cb.current.left();
        if (dx > threshold) cb.current.right();
      }
      x0 = null;
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('touchend', end, { passive: true });
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); };
  }, [ref, threshold]);
}
