'use client';

import { useState } from 'react';

export default function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input className="input" type={show ? 'text' : 'password'} required {...props} />
      <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        <i className={`bx bx-${show ? 'hide' : 'show'}`} /></button>
    </div>
  );
}
