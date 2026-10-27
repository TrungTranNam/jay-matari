'use client';

import { useActionState, useState } from 'react';
import PasswordInput from '@/components/PasswordInput';
import { signup } from '../actions';
import { keepValues } from '../keepValues';

const LABEL = ['Strength — start typing', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const PCT = [0, 25, 45, 65, 85, 100];
const COL = ['var(--bad)', 'var(--bad)', 'var(--warn)', 'var(--warn)', 'var(--ok)', 'var(--ok)'];

function strength(v: string) {
  return [v.length >= 8, v.length >= 12, /[A-Z]/.test(v) && /[a-z]/.test(v), /\d/.test(v), /[^\w\s]/.test(v)]
    .filter(Boolean).length;
}

export default function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [s, setS] = useState(0);
  return (
    <form onSubmit={keepValues(action)}>
      <input type="hidden" name="next" value={next ?? ''} />
      <div className="field"><label htmlFor="name">Full name</label>
        <input className="input" id="name" name="name" placeholder="Riddhi Patel" autoComplete="name" required /></div>
      <div className="two">
        <div className="field"><label htmlFor="email">Email address</label>
          <input className="input" type="email" id="email" name="email" placeholder="you@email.com" autoComplete="email" required /></div>
        <div className="field"><label htmlFor="phone">Mobile number</label>
          <input className="input" id="phone" name="phone" placeholder="98250 00000" inputMode="tel" autoComplete="tel" required /></div>
      </div>
      <div className="field"><label htmlFor="pw">Password</label>
        <PasswordInput id="pw" name="password" placeholder="At least 8 characters" autoComplete="new-password"
                       onChange={e => setS(strength(e.target.value))} />
        <div className="meter"><i style={{ width: PCT[s] + '%', background: COL[s] }} /></div>
        <div className="meter-txt">{LABEL[s]}</div>
      </div>
      <div className="field"><label htmlFor="pw2">Confirm password</label>
        <input className="input" type="password" id="pw2" name="password2" placeholder="Type it again" autoComplete="new-password" required /></div>
      <label className="check"><input type="checkbox" name="agree" />
        <span>I agree to the <a href="#">terms</a> and <a href="#">privacy policy</a>, and I&apos;m happy to hear about new releases.</span></label>
      <div className="err-msg">{state?.error && <><i className="bx bx-error-circle" /> {state.error}</>}</div>
      <button className="btn btn-solid btn-block" type="submit" disabled={pending}>
        {pending ? <><span className="spinner" /> Creating your account</> : 'Create account'}</button>
    </form>
  );
}
