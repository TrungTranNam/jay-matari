'use server';

import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { signOut } from '@/auth';
import { addLine, userId } from '@/lib/bag';
import { restock } from '@/lib/checkout';
import { db } from '@/lib/db';
import { CANCELLABLE, type OrderItem } from '@/lib/orders';
import type { Result } from './actions';

const SIGN_IN: Result = { ok: false, msg: 'Please sign in again.' };

const Details = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[\d+\s-]{10,15}$/, 'Enter a 10-digit mobile number.').or(z.literal('')),
});

export async function updateDetails(input: z.input<typeof Details>): Promise<Result> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  const r = Details.safeParse(input);
  if (!r.success) return { ok: false, msg: r.error.issues[0].message };
  const clash = await db.user.findFirst({ where: { email: r.data.email, NOT: { id: uid } } });
  if (clash) return { ok: false, msg: 'Another account already uses that email.' };
  await db.user.update({ where: { id: uid }, data: { ...r.data, phone: r.data.phone || null } });
  revalidatePath('/', 'layout');
  return { ok: true, msg: 'Details saved' };
}

export async function changePassword(current: string, next: string): Promise<Result> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  const u = await db.user.findUniqueOrThrow({ where: { id: uid } });
  if (!(await bcrypt.compare(String(current), u.password))) return { ok: false, msg: 'Current password is not right.' };
  if (String(next).length < 8) return { ok: false, msg: 'New password needs at least 8 characters.' };
  await db.user.update({ where: { id: uid }, data: { password: await bcrypt.hash(String(next), 12) } });
  return { ok: true, msg: 'Password updated' };
}

export async function removeAddress(id: number): Promise<Result> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  await db.address.deleteMany({ where: { id: Number(id), userId: uid } });
  revalidatePath('/profile');
  return { ok: true, msg: 'Address removed' };
}

// Orders must stay for accounting, so the account is anonymised rather than deleted.
export async function deleteAccount() {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  await db.$transaction([
    db.cartItem.deleteMany({ where: { userId: uid } }),
    db.wish.deleteMany({ where: { userId: uid } }),
    db.address.deleteMany({ where: { userId: uid } }),
    db.user.update({
      where: { id: uid },
      data: {
        name: 'Deleted customer', email: `deleted-${uid}@deleted.invalid`, phone: null, note: null, tags: Prisma.DbNull,
        password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
      },
    }),
  ]);
  await signOut({ redirectTo: '/' });
}

export async function cancelOrder(id: string): Promise<Result> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  try {
    await db.$transaction(async tx => {
      // status guard in the WHERE: if the team moved it on meanwhile, nothing changes
      const r = await tx.order.updateMany({ where: { id: String(id), userId: uid, status: { in: CANCELLABLE } }, data: { status: 'CANCELLED' } });
      if (!r.count) throw new Error('This order can no longer be cancelled online. Call us and we will help.');
      await tx.orderEvent.create({ data: { orderId: String(id), status: 'CANCELLED', by: uid } });
      const o = await tx.order.findUniqueOrThrow({ where: { id: String(id) } });
      await restock(tx, o.items as OrderItem[]);
      // ponytail: online payments on a cancelled order are refunded by the admin (phase 4 Payments tab)
    });
  } catch (e) { return { ok: false, msg: (e as Error).message }; }
  revalidatePath('/', 'layout');
  return { ok: true, msg: 'Order cancelled' };
}

export async function orderAgain(id: string): Promise<Result> {
  const uid = await userId();
  if (!uid) return SIGN_IN;
  const o = await db.order.findFirst({ where: { id: String(id), userId: uid } });
  if (!o) return { ok: false, msg: 'Order not found.' };
  let added = 0;
  for (const it of o.items as OrderItem[]) {
    try { await addLine({ sku: it.sku, size: it.size, color: it.color, qty: it.qty }); added++; } catch { /* sold out or retired */ }
  }
  revalidatePath('/', 'layout');
  return added ? { ok: true, msg: `${added} piece${added === 1 ? '' : 's'} added to your bag` }
               : { ok: false, msg: 'None of these pieces are available right now.' };
}
