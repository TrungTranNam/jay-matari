export const rs = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

// every photo ships in three widths: -960, -1920, -4k. Catalogue photos are in public/img;
// admin uploads ("u-…") are served by app/uploads.
export const img = (name: string, size: 960 | 1920 | '4k' = 960) =>
  `/${name.startsWith('u-') ? 'uploads' : 'img'}/${name}-${size}.jpg`;
export const srcSet = (name: string) =>
  `${img(name, 960)} 960w, ${img(name, 1920)} 1920w, ${img(name, '4k')} 3840w`;

// shop runs on Indian time whatever the server's timezone
export const TZ = 'Asia/Kolkata';
export const when = (d: Date) => d.toLocaleString('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const day = (d: Date) => d.toLocaleDateString('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
