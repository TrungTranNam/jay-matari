import { createHmac, timingSafeEqual } from 'node:crypto';

// Razorpay over plain REST (no SDK). Card, netbanking and wallet details are typed into
// Razorpay's own checkout window, never into our pages — that keeps us out of PCI scope.
// Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET.

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID!;

function hmac(secret: string, data: string) {
  return createHmac('sha256', secret).update(data).digest('hex');
}
function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Checkout handler result: signature = HMAC(order_id|payment_id, key secret)
export function verifyPaymentSignature(gatewayOrderId: string, paymentId: string, signature: string,
                                       secret = process.env.RAZORPAY_KEY_SECRET ?? '') {
  return !!secret && same(hmac(secret, `${gatewayOrderId}|${paymentId}`), String(signature));
}

// Webhook: signature = HMAC(raw body, webhook secret)
export function verifyWebhookSignature(rawBody: string, signature: string,
                                       secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '') {
  return !!secret && same(hmac(secret, rawBody), String(signature));
}

export async function createGatewayOrder(receipt: string, rupees: number) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: rupees * 100, currency: 'INR', receipt }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  return (await res.json()).id as string;
}

// Full refund of a captured payment; Razorpay sends it back to the customer's card/bank in 5–7 days.
export async function refundPayment(paymentId: string) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: '{}',
  });
  if (!res.ok) throw new Error(`Razorpay refund failed: ${res.status} ${await res.text()}`);
  return (await res.json()).id as string;
}
