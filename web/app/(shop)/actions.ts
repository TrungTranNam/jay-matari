'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as bag from '@/lib/bag';
import { db } from '@/lib/db';

// Every export here is a public endpoint: validate input, never trust prices or ids from the client.

export type Result = { ok: boolean; msg: string; on?: boolean };

// header badges + drawer live in the root layout, so refresh it after any bag/wishlist change
const refresh = () => revalidatePath('/', 'layout');

async function attempt(fn: () => Promise<string>): Promise<Result> {
  try { const msg = await fn(); refresh(); return { ok: true, msg }; }
  catch (e) { return { ok: false, msg: e instanceof Error ? e.message : 'Something went wrong.' }; }
}

const AddSchema = z.object({
  sku: z.string(), size: z.string().optional(), color: z.string().optional(),
  qty: z.number().int().min(1).max(20).default(1),
});

// size/colour omitted (quick add from a card) → the first option, as the template did
export async function addToBag(input: z.input<typeof AddSchema>) {
  return attempt(async () => {
    const r = AddSchema.parse(input);
    const p = await db.product.findUnique({ where: { sku: r.sku } });
    if (!p) throw new Error('This piece is no longer available.');
    await bag.addLine({
      sku: r.sku, qty: r.qty,
      size: r.size ?? (p.sizes as string[])[0],
      color: r.color ?? (p.colors as string[])[0],
    });
    return `${p.name} added to your bag`;
  });
}

export async function setBagQty(key: string, qty: number) {
  return attempt(async () => { await bag.setQty(String(key), Number(qty) || 1); return ''; });
}

export async function removeFromBag(key: string) {
  return attempt(async () => { await bag.removeLine(String(key)); return 'Removed from bag'; });
}

export async function toggleWish(sku: string): Promise<Result> {
  try {
    const on = await bag.toggleWish(String(sku));
    refresh();
    return { ok: true, on, msg: on ? 'Saved to wishlist' : 'Removed from wishlist' };
  } catch (e) { return { ok: false, msg: (e as Error).message }; }
}

export async function clearWish() {
  return attempt(async () => { await bag.clearWish(); return 'Wishlist cleared'; });
}

export async function moveWishToBag() {
  return attempt(async () => {
    const skus = await bag.getWish();
    let n = 0;
    for (const sku of skus) {
      const r = await addToBag({ sku });
      if (r.ok) n++;
    }
    return n ? `${n} piece${n === 1 ? '' : 's'} moved to your bag` : 'Nothing in stock to move';
  });
}

const ReviewSchema = z.object({
  sku: z.string(), rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10, 'Write at least a line or two.').max(2000),
});

export async function postReview(input: z.input<typeof ReviewSchema>): Promise<Result> {
  const uid = await bag.userId();
  if (!uid) return { ok: false, msg: 'Sign in to post a review.' };
  const r = ReviewSchema.safeParse(input);
  if (!r.success) return { ok: false, msg: r.error.issues[0].message };
  await db.review.create({ data: { ...r.data, userId: uid } });
  // ponytail: reviews wait for admin approval (phase 4 Reviews tab) before they show
  return { ok: true, msg: 'Thank you — your review will appear once we have read it' };
}

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name so we know who is writing.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(80),
  body: z.string().trim().min(10, 'Tell us a little more so we can help properly.').max(5000),
});

export async function sendMessage(input: z.input<typeof ContactSchema>): Promise<Result> {
  const r = ContactSchema.safeParse(input);
  if (!r.success) return { ok: false, msg: r.error.issues[0].message };
  await db.message.create({ data: r.data });
  return { ok: true, msg: 'Message sent — we usually reply the same day' };
}

export async function subscribe(_: unknown, f: FormData) {
  const email = z.string().trim().email().safeParse(f.get('email'));
  if (!email.success) return { ok: false, msg: 'Enter a valid email address.' };
  await db.message.create({
    data: { name: 'Newsletter', email: email.data, subject: 'Newsletter signup', body: 'Wants the monthly release list.' },
  });
  return { ok: true, msg: 'You are on the list — see you on the first Saturday' };
}
