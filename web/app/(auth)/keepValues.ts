import { startTransition } from 'react';

// <form action> resets every field after submit; on a failed sign-in that wipes what the user typed.
export const keepValues = (action: (f: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const f = new FormData(e.currentTarget);
  startTransition(() => action(f));
};
