'use client';

import { useActionState } from 'react';
import PasswordInput from '@/components/PasswordInput';
import { toast } from '@/components/Toaster';
import { login } from '../actions';
import { keepValues } from '../keepValues';

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form onSubmit={keepValues(action)}>
      <input type="hidden" name="next" value={next ?? ''} />
      <div className="field"><label htmlFor="email">Email address</label>
        <input className="input" type="email" id="email" name="email" placeholder="you@email.com" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="pw">Password</label>
        <PasswordInput id="pw" name="password" placeholder="••••••••" autoComplete="current-password" /></div>
      <div className="row-between">
        {/* ponytail: no reset-by-email yet; add with the mailer in phase 3 */}
        <a href="#" style={{ color: 'var(--gold)' }}
           onClick={e => { e.preventDefault(); toast('Call us on +91 98250 00000 and we will reset it for you'); }}>Forgot password?</a>
      </div>
      <div className="err-msg">{state?.error && <><i className="bx bx-error-circle" /> {state.error}</>}</div>
      <button className="btn btn-solid btn-block" type="submit" disabled={pending}>
        {pending ? <><span className="spinner" /> Signing in</> : 'Sign in'}</button>
    </form>
  );
}
