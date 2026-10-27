'use client';

export default function ReplayIntro() {
  return (
    <a href="#" style={{ color: 'var(--gold)' }}
       onClick={e => { e.preventDefault(); dispatchEvent(new Event('jmc:replay-intro')); }}>
      Play the opening again</a>
  );
}
