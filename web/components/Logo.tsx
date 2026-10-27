import Link from 'next/link';

// The mark: a torana (temple arch) holding a lotus flame, ringed by abhla dots.
// Geometry from templates/assets/js/brand.js; header, footer and intro share it.
const ARCH_OUT = 'M32 3.5C45.2 3.5 55 14 55 27.6V59a4.5 4.5 0 0 1-4.5 4.5h-37A4.5 4.5 0 0 1 9 59V27.6C9 14 18.8 3.5 32 3.5Z';
const ARCH_IN  = 'M32 9.5C42 9.5 49.5 17.4 49.5 28v29.5h-35V28C14.5 17.4 22 9.5 32 9.5Z';
const PETAL_C  = 'M32 18.5c-5.3 7.6-5.3 16.8 0 24.7 5.3-7.9 5.3-17.1 0-24.7Z';
const PETAL_L  = 'M32 43.2c-7.4-1.8-12.5-7.6-13.1-15.2 5.8 1.4 10.3 6.8 13.1 15.2Z';
const PETAL_R  = 'M32 43.2c7.4-1.8 12.5-7.6 13.1-15.2-5.8 1.4-10.3 6.8-13.1 15.2Z';
const DOTS = [[32, 7.4, 1.5], [19.5, 13.5, 1], [44.5, 13.5, 1], [13.6, 23, .85], [50.4, 23, .85]];

export function MarkPaths({ p }: { p: 'm-' | 'i-' }) {
  return <>
    <path className={`${p}arch`} d={ARCH_OUT} />
    <path className={`${p}arch ${p}arch-2`} d={ARCH_IN} />
    <path className={`${p}petal ${p}p1`} d={PETAL_L} />
    <path className={`${p}petal ${p}p2`} d={PETAL_R} />
    <path className={`${p}petal ${p}p3`} d={PETAL_C} />
    <path className={`${p}stem`} d="M32 43.2v9.3" />
    <path className={`${p}stem ${p}base`} d="M22 55h20" />
    {DOTS.map(([cx, cy, r], i) =>
      <circle key={i} className={`${p}dot`} style={{ '--i': i } as React.CSSProperties} cx={cx} cy={cy} r={r} />)}
  </>;
}

export function BrandLockup({ style }: { style?: React.CSSProperties }) {
  return (
    <Link href="/" className="brand-lockup" aria-label="Jay Mataji Creation home" style={style}>
      <svg className="brand-mark" viewBox="0 0 64 68" aria-hidden="true" focusable="false"><MarkPaths p="m-" /></svg>
      <span className="brand-words"><b>Jay Mataji</b><span>Creation</span></span>
    </Link>
  );
}
