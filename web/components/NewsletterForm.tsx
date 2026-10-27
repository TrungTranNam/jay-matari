'use client';

import { useActionState, useEffect, useRef } from 'react';
import { subscribe } from '@/app/(shop)/actions';
import { toast } from './Toaster';

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribe, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state) return;
    toast(state.msg, state.ok ? 'ok' : 'bad');
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form className="news-form" action={action} ref={form}>
      <input type="email" name="email" placeholder="you@email.com" required aria-label="Email address" />
      <button className="btn btn-gold" type="submit" disabled={pending}>Notify me</button>
    </form>
  );
}
