// run: npm test — a forged or altered signature must never mark an order paid
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { verifyPaymentSignature, verifyWebhookSignature } from './razorpay';

const sign = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex');

test('payment signature: accepts only HMAC(order|payment) with our secret', () => {
  const good = sign('s3cret', 'order_A|pay_B');
  assert.equal(verifyPaymentSignature('order_A', 'pay_B', good, 's3cret'), true);
  assert.equal(verifyPaymentSignature('order_A', 'pay_C', good, 's3cret'), false); // swapped payment
  assert.equal(verifyPaymentSignature('order_A', 'pay_B', sign('other', 'order_A|pay_B'), 's3cret'), false);
  assert.equal(verifyPaymentSignature('order_A', 'pay_B', 'short', 's3cret'), false);
  assert.equal(verifyPaymentSignature('order_A', 'pay_B', good, ''), false);          // unset secret
});

test('webhook signature: tied to the exact raw body', () => {
  const body = '{"event":"payment.captured"}';
  assert.equal(verifyWebhookSignature(body, sign('wh', body), 'wh'), true);
  assert.equal(verifyWebhookSignature(body + ' ', sign('wh', body), 'wh'), false);
  assert.equal(verifyWebhookSignature(body, sign('wh', body), ''), false);
});
