'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import type { Order } from '@prisma/client';
import { userId } from '@/lib/bag';
import { CheckoutError, markPaid, placeOrder, submitUtr, type Method } from '@/lib/checkout';
import { db } from '@/lib/db';
import { mailOrderConfirmed } from '@/lib/mail';
import { needsPayment, type OrderAddress, type OrderItem } from '@/lib/orders';
import { createGatewayOrder, razorpayKeyId, verifyPaymentSignature } from '@/lib/razorpay';

type Fail = { ok: false; msg: string };
const SIGN_IN: Fail = { ok: false, msg: 'Please sign in again.' };

const AddressSchema = z.object({
  name: z.string().trim().min(2, 'Enter the name for the delivery.').max(80),
  phone: z.string().trim().regex(/^[\d+\s-]{10,15}$/, 'Enter a 10-digit mobile number.'),
  line: z.string().trim().min(6, 'Enter the flat and street.').max(200),
  city: z.string().trim().min(2, 'Enter the city.').max(60),
  state: z.string().trim().min(2, 'Enter the state.').max(60),
  pin: z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits.'),
  landmark: z.string().trim().max(120).optional(),
});

export type Placed = { id: string; total: number; payment: string; pieces: number; address: OrderAddress; firstName: string };

const summary = (o: Order, name: string): Placed => ({
  id: o.id, total: o.total, payment: o.payment, address: o.address as OrderAddress, firstName: name.split(' ')[0],
  pieces: (o.items as OrderItem[]).reduce((n, i) => n + i.qty, 0),
});

export async function checkout(input: { addressId?: number; address?: z.input<typeof AddressSchema>; method: Method }): Promise<Fail | { ok: true; order: Placed }> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  if (!['cod', 'upi', 'razorpay'].includes(input.method)) return { ok: false, msg: 'Pick a way to pay.' };
  const user = await db.user.findUniqueOrThrow({ where: { id: uid } });

  let address: OrderAddress;
  if (input.addressId) {
    const a = await db.address.findFirst({ where: { id: Number(input.addressId), userId: uid } });
    if (!a) return { ok: false, msg: 'That saved address is gone — enter it again.' };
    address = { name: a.name, phone: a.phone, line: a.line, city: a.city, state: a.state, pin: a.pin, landmark: a.landmark };
  } else {
    const r = AddressSchema.safeParse(input.address ?? {});
    if (!r.success) return { ok: false, msg: r.error.issues[0].message };
    address = { ...r.data, landmark: r.data.landmark || null };
    // remember it for next time, once
    if (!(await db.address.findFirst({ where: { userId: uid, line: address.line, pin: address.pin } })))
      await db.address.create({ data: { userId: uid, ...address } });
  }

  try {
    const order = await placeOrder(uid, address, input.method);
    revalidatePath('/', 'layout');
    if (order.payment === 'cod') after(() => mailOrderConfirmed(order, user));
    return { ok: true, order: summary(order, user.name) };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, msg: e.message };
    throw e;
  }
}

export async function payByUtr(orderId: string, utr: string): Promise<Fail | { ok: true; msg: string }> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  try {
    const o = await submitUtr(uid, String(orderId), String(utr).replace(/\D/g, ''));
    after(() => mailOrderConfirmed(o, o.user));
    revalidatePath('/', 'layout');
    return { ok: true, msg: 'Reference received — we will confirm it shortly' };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, msg: e.message };
    throw e;
  }
}

async function payableOrder(uid: number, orderId: string) {
  const o = await db.order.findFirst({ where: { id: String(orderId), userId: uid, payment: 'razorpay' }, include: { user: true } });
  return o && needsPayment(o) ? o : null;
}

export async function startRazorpay(orderId: string) {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  const o = await payableOrder(uid, orderId);
  if (!o) return { ok: false as const, msg: 'This order is not waiting for payment.' };
  // a Razorpay order can take several attempts, so reuse it after a failed or abandoned try
  let gatewayOrderId = o.gatewayOrderId;
  if (!gatewayOrderId) {
    try { gatewayOrderId = await createGatewayOrder(o.id, o.total); }
    catch (e) { console.error(e); return { ok: false as const, msg: 'Online payment is not reachable right now. Try again in a minute.' }; }
    await db.order.update({ where: { id: o.id }, data: { gatewayOrderId } });
  }
  return {
    ok: true as const, key: razorpayKeyId(), gatewayOrderId, amount: o.total * 100, orderId: o.id,
    prefill: { name: o.user.name, email: o.user.email, contact: o.user.phone ?? '' },
  };
}

export async function confirmRazorpay(r: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  const o = await db.order.findFirst({ where: { id: String(r.orderId), userId: uid } });
  if (!o?.gatewayOrderId || o.gatewayOrderId !== r.razorpay_order_id ||
      !verifyPaymentSignature(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature))
    return { ok: false as const, msg: 'We could not verify this payment. If money left your account, contact us with your order number.' };
  const paid = await markPaid(o.gatewayOrderId, r.razorpay_payment_id);
  if (paid) after(() => mailOrderConfirmed(paid, paid.user));
  revalidatePath('/', 'layout');
  return { ok: true as const, msg: 'Payment received — thank you' };
}
