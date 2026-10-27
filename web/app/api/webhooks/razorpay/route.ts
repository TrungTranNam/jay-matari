import { after } from 'next/server';
import { markPaid } from '@/lib/checkout';
import { mailOrderConfirmed } from '@/lib/mail';
import { verifyWebhookSignature } from '@/lib/razorpay';

// Razorpay → us, for payments whose browser tab closed before our callback ran.
// Dashboard: Settings → Webhooks → this URL, events payment.captured + order.paid, secret = RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const body = await req.text(); // signature covers the exact raw bytes
  if (!verifyWebhookSignature(body, req.headers.get('x-razorpay-signature') ?? ''))
    return new Response('bad signature', { status: 400 });

  const evt = JSON.parse(body);
  if (evt.event === 'payment.captured' || evt.event === 'order.paid') {
    const p = evt.payload?.payment?.entity;
    if (p?.order_id && p?.id) {
      const paid = await markPaid(p.order_id, p.id, p.amount);
      if (paid) after(() => mailOrderConfirmed(paid, paid.user));
    }
  }
  return new Response('ok'); // 2xx for everything verified, or Razorpay keeps retrying
}
