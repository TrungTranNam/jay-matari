'use client';

import { confirmRazorpay, startRazorpay } from '@/app/(shop)/checkout/actions';

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global { interface Window { Razorpay?: new (o: object) => { open(): void; on(e: string, f: (r: { error?: { description?: string } }) => void): void } } }

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => ok();
    s.onerror = () => fail(new Error('Could not load the payment window. Check your connection and try again.'));
    document.body.appendChild(s);
  });
}

// Opens Razorpay's own window. Resolves to 'paid' (verified on our server), 'dismissed', or an error message.
export async function payWithRazorpay(orderId: string): Promise<'paid' | 'dismissed' | { error: string }> {
  const s = await startRazorpay(orderId);
  if (!s.ok) return { error: s.msg };
  try { await loadCheckout(); } catch (e) { return { error: (e as Error).message }; }

  return new Promise(resolve => {
    const rzp = new window.Razorpay!({
      key: s.key, order_id: s.gatewayOrderId, amount: s.amount, currency: 'INR',
      name: 'Jay Mataji Creation', description: `Order ${s.orderId}`,
      prefill: s.prefill, theme: { color: '#4A1F3D' },
      handler: async (r: RzpResponse) => {
        const v = await confirmRazorpay({ orderId: s.orderId, ...r });
        resolve(v.ok ? 'paid' : { error: v.msg });
      },
      modal: { ondismiss: () => resolve('dismissed') },
    });
    rzp.on('payment.failed', r => console.warn('[razorpay] attempt failed', r.error?.description)); // window stays open for a retry
    rzp.open();
  });
}
