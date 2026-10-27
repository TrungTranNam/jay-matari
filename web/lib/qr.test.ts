// run: npm test — the UPI QR must decode to exactly the link we encoded
import assert from 'node:assert/strict';
import test from 'node:test';
import jsQR from 'jsqr';
import { encode } from './qr.js';

function decode(text: string) {
  const m = encode(text) as number[][], q = 4, s = 4, n = (m.length + 2 * q) * s;
  const px = new Uint8ClampedArray(n * n * 4).fill(255);
  m.forEach((row, r) => row.forEach((on, c) => {
    if (!on) return;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const i = (((r + q) * s + y) * n + (c + q) * s + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = 0;
    }
  }));
  return jsQR(px, n, n)?.data;
}

test('QR round-trips UPI links of every size we use', () => {
  const p = new URLSearchParams({ pa: 'jaymatajicreation@okaxis', pn: 'Jay Mataji Creation', am: '4599.00', cu: 'INR', tn: 'Order JMC-MH8Z2K1A4F3B', tr: 'JMC-MH8Z2K1A4F3B' });
  for (const t of ['upi://pay?pa=a@b', 'upi://pay?' + p.toString().replace(/\+/g, '%20')]) assert.equal(decode(t), t);
});
