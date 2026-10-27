import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getContent } from './content';
import { db } from './db';
import type { OrderAddress, OrderItem } from './orders';
import { FREE_SHIP_FROM, shippingFor } from './pricing';
import { razorpayEnabled } from './razorpay';

export type Method = 'cod' | 'upi' | 'razorpay';

// message is safe to show the customer
export class CheckoutError extends Error {}

const newOrderId = () => `JMC-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;

export async function paymentOptions(sub: number) {
  const pay = await getContent('payment');
  const codFee = sub >= FREE_SHIP_FROM ? 0 : pay.codFee;
  return {
    upi: pay.upiId ? { upiId: pay.upiId, payee: pay.payee } : null,
    razorpay: razorpayEnabled(),
    cod: sub + shippingFor(sub) + codFee <= pay.codMax,
    codFee, codMax: pay.codMax,
  };
}

export async function restock(tx: Prisma.TransactionClient, items: OrderItem[]) {
  for (const it of items) await tx.product.updateMany({ where: { sku: it.sku }, data: { stock: { increment: it.qty } } });
}

// Prices, totals and stock come from the DB inside one transaction; any shortfall rolls everything back.
export async function placeOrder(userId: number, address: OrderAddress, method: Method) {
  await releaseStale().catch(e => console.error('[checkout] releaseStale', e));
  const lines = await db.cartItem.findMany({ where: { userId }, orderBy: { id: 'asc' } });
  if (!lines.length) throw new CheckoutError('Your bag is empty.');

  return db.$transaction(async tx => {
    const items: OrderItem[] = [];
    for (const l of lines) {
      const p = await tx.product.findFirst({ where: { sku: l.sku, active: true } });
      if (!p) throw new CheckoutError(`${l.sku} is no longer available — remove it from your bag.`);
      // conditional decrement: two buyers can never take the same last piece
      const r = await tx.product.updateMany({ where: { sku: l.sku, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
      if (!r.count) throw new CheckoutError(p.stock
        ? `Only ${p.stock} left of ${p.name} — lower the quantity in your bag.`
        : `${p.name} just sold out — remove it from your bag.`);
      items.push({ sku: p.sku, name: p.name, price: p.price, img: p.img, size: l.size, color: l.color, qty: l.qty });
    }

    const sub = items.reduce((n, i) => n + i.price * i.qty, 0);
    const opts = await paymentOptions(sub);
    if (method === 'upi' && !opts.upi) throw new CheckoutError('UPI is not available right now. Pick another way to pay.');
    if (method === 'razorpay' && !opts.razorpay) throw new CheckoutError('Online payment is not available right now. Pick another way to pay.');
    if (method === 'cod' && !opts.cod) throw new CheckoutError(`Cash on delivery is available on orders up to ₹${opts.codMax.toLocaleString('en-IN')}.`);

    const shipping = shippingFor(sub) + (method === 'cod' ? opts.codFee : 0);
    const order = await tx.order.create({
      data: {
        id: newOrderId(), userId, items, address, subtotal: sub, shipping, total: sub + shipping,
        payment: method, paymentStatus: 'PENDING',
        events: { create: { status: 'PLACED', by: userId } },
      },
    });
    await tx.cartItem.deleteMany({ where: { userId } });
    return order;
  });
}

// Customer typed the 12-digit UTR from their UPI app; the admin matches it to the bank statement.
export async function submitUtr(userId: number, orderId: string, utr: string) {
  if (!/^\d{12}$/.test(utr)) throw new CheckoutError('The UTR is exactly 12 digits.');
  if (await db.order.findFirst({ where: { payment: 'upi', paymentRef: utr, NOT: { id: orderId } } }))
    throw new CheckoutError('That UTR is already used on another order. Check the number in your UPI app.');
  const r = await db.order.updateMany({
    where: { id: orderId, userId, payment: 'upi', status: 'PLACED', paymentStatus: { in: ['PENDING', 'FAILED'] } },
    data: { paymentStatus: 'AWAITING_CHECK', paymentRef: utr },
  });
  if (!r.count) throw new CheckoutError('This order is not waiting for a UPI payment.');
  return db.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: true } });
}

// Idempotent: the checkout callback and the webhook may both arrive. Returns the order only
// the first time it flips to PAID, so the confirmation mail goes out once.
export async function markPaid(gatewayOrderId: string, paymentId: string, amountPaise?: number) {
  const o = await db.order.findUnique({ where: { gatewayOrderId } });
  if (!o) return null;
  if (amountPaise !== undefined && amountPaise !== o.total * 100) {
    console.error(`[razorpay] amount mismatch on ${o.id}: paid ${amountPaise} paise, order ${o.total * 100}`);
    return null;
  }
  const r = await db.order.updateMany({ where: { id: o.id, paymentStatus: { not: 'PAID' } }, data: { paymentStatus: 'PAID', paymentRef: paymentId } });
  // a payment landing on an auto-cancelled order stays CANCELLED + PAID: the admin refunds or reinstates it
  return r.count ? db.order.findUniqueOrThrow({ where: { id: o.id }, include: { user: true } }) : null;
}

// Online orders never paid within a day go back on the shelf.
// ponytail: runs opportunistically on each checkout; move to a cron if checkouts get rare.
export async function releaseStale() {
  const stale = await db.order.findMany({
    where: { status: 'PLACED', payment: { not: 'cod' }, paymentStatus: 'PENDING', createdAt: { lt: new Date(Date.now() - 864e5) } },
    take: 50,
  });
  for (const o of stale) {
    await db.$transaction(async tx => {
      const r = await tx.order.updateMany({ where: { id: o.id, status: 'PLACED', paymentStatus: 'PENDING' }, data: { status: 'CANCELLED' } });
      if (!r.count) return;
      await tx.orderEvent.create({ data: { orderId: o.id, status: 'CANCELLED' } });
      await restock(tx, o.items as OrderItem[]);
    });
  }
}
