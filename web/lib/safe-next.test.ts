// run: npm test
import assert from 'node:assert/strict';
import test from 'node:test';
import { safeNext } from './safe-next';

test('safeNext keeps same-site paths and strips foreign hosts', () => {
  assert.equal(safeNext(null), '');
  assert.equal(safeNext('/orders?id=1'), '/orders?id=1');
  assert.equal(safeNext('http://localhost:3100/admin'), '/admin');
  assert.equal(safeNext('https://evil.com/steal'), '/steal');
  assert.equal(safeNext('//evil.com'), '/');
  assert.equal(safeNext('javascript:alert(1)'), '');
});
