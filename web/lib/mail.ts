import nodemailer from 'nodemailer';
import type { Order } from '@prisma/client';
import { getContent } from './content';
import { rs } from './format';
import { PAY_LABEL, type OrderAddress, type OrderItem } from './orders';

// SMTP_URL like smtp://user:pass@smtp.example.com:587 and MAIL_FROM "Jay Mataji <care@…>".
// Without SMTP_URL (local dev) mails are printed to the server log instead of sent.
const transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

async function send(to: string, subject: string, html: string) {
  if (!transport) { console.log(`[mail:dev] to=${to} subject="${subject}"`); return; }
  try { await transport.sendMail({ from: process.env.MAIL_FROM, to, subject, html }); }
  catch (e) { console.error('[mail] failed', to, subject, e); } // never fail an order over email
}

function orderHtml(o: Order, intro: string) {
  const items = o.items as OrderItem[], a = o.address as OrderAddress;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;color:#251A2B">
    <h2 style="font-weight:normal">${intro}</h2>
    <p>Order <b>${esc(o.id)}</b> · ${esc(PAY_LABEL[o.payment] ?? o.payment)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${items.map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.name)}<br>
        <small style="color:#777">${esc(i.sku)} · Size ${esc(i.size)} · ${esc(i.color)} · Qty ${i.qty}</small></td>
        <td style="text-align:right;border-bottom:1px solid #eee">${rs(i.price * i.qty)}</td></tr>`).join('')}
      <tr><td style="padding:6px 0">Subtotal</td><td style="text-align:right">${rs(o.subtotal)}</td></tr>
      <tr><td>Delivery &amp; handling</td><td style="text-align:right">${o.shipping ? rs(o.shipping) : 'Free'}</td></tr>
      <tr><td><b>Total</b></td><td style="text-align:right"><b>${rs(o.total)}</b></td></tr>
    </table>
    <p style="font-size:14px">Delivering to:<br>${esc(a.name)}, ${esc(a.line)}${a.landmark ? `, near ${esc(a.landmark)}` : ''}<br>
      ${esc(a.city)}, ${esc(a.state)} — ${esc(a.pin)} · ${esc(a.phone)}</p>
  </div>`;
}

const INTRO: Record<string, string> = {
  cod: 'Thank you — your order is in. Please keep the total ready for the delivery partner.',
  upi: 'Thank you — we have your UPI reference and will confirm it against our bank statement shortly.',
  razorpay: 'Thank you — your payment went through and we are getting your order ready.',
};

// Sent once the customer has done their part: COD placed, UPI UTR submitted, online payment captured.
export async function mailOrderConfirmed(o: Order, customer: { email: string; name: string }) {
  const f = await getContent('footer');
  await Promise.all([
    send(customer.email, `Your Jay Mataji order ${o.id}`, orderHtml(o, INTRO[o.payment] ?? INTRO.cod)),
    send(process.env.ORDERS_EMAIL || f.email, `New order ${o.id} · ${rs(o.total)} · ${PAY_LABEL[o.payment] ?? o.payment}`,
         orderHtml(o, `New order from ${esc(customer.name)} (${esc(customer.email)})`)),
  ]);
}

const STATUS_MAIL: Partial<Record<Order['status'], [string, string]>> = {
  CONFIRMED: ['is confirmed', 'A karigar has your order and work has started.'],
  SHIPPED: ['is on its way', 'Your order has left our Ahmedabad workshop. Metro cities usually get it in 3–4 days, the rest of India in 5–7.'],
  DELIVERED: ['was delivered', 'We hope you love it. If anything about the fit is off, reply to this email and we will fix it free.'],
  CANCELLED: ['was cancelled', 'If you paid online, the refund goes back to the same account. Questions? Just reply to this email.'],
};

export async function mailStatusChange(o: Order, customer: { email: string }) {
  const m = STATUS_MAIL[o.status];
  if (m) await send(customer.email, `Your order ${o.id} ${m[0]}`, orderHtml(o, m[1]));
}
