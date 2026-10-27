'use server';

import { Prisma, type OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/auth';
import { restock } from '@/lib/checkout';
import { DEFAULTS, type HeroSlide } from '@/lib/content';
import { db } from '@/lib/db';
import { saveUpload } from '@/lib/images';
import { mailStatusChange } from '@/lib/mail';
import { STATUS_LABEL, type OrderItem } from '@/lib/orders';
import { MAX_QTY } from '@/lib/pricing';
import { razorpayEnabled, refundPayment } from '@/lib/razorpay';
import type { AdminResult } from './ui';

// Every export is a public endpoint: requireAdmin() first, validate everything after.

const ok = (msg: string, redirect?: string): AdminResult => ({ ok: true, msg, redirect });
const fail = (msg: string): AdminResult => ({ ok: false, msg });
const adminId = async () => Number((await requireAdmin()).id);
// storefront pages render from the DB on every request; this refreshes the router cache everywhere
const refreshSite = () => revalidatePath('/', 'layout');
const first = (e: z.ZodError) => e.issues[0].message;
class Nope extends Error {}

/* ═══ ORDERS ═══ */

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export async function setOrderStatus(id: string, status: OrderStatus): Promise<AdminResult> {
  const by = await adminId();
  if (!STATUSES.includes(status)) return fail('Unknown status.');
  try {
    const o = await db.$transaction(async tx => {
      const o = await tx.order.findUnique({ where: { id: String(id) } });
      if (!o) throw new Nope('Order not found.');
      if (o.status === status) return null;
      const items = o.items as OrderItem[];
      if (status === 'CANCELLED') await restock(tx, items);
      if (o.status === 'CANCELLED') {
        // reinstating takes the pieces off the shelf again, only if they are still there
        for (const it of items) {
          const r = await tx.product.updateMany({ where: { sku: it.sku, stock: { gte: it.qty } }, data: { stock: { decrement: it.qty } } });
          if (!r.count) throw new Nope(`Not enough ${it.name} in stock to reinstate this order.`);
        }
      }
      // cash on delivery is collected at the door
      const collected = status === 'DELIVERED' && o.payment === 'cod' && o.paymentStatus === 'PENDING';
      await tx.orderEvent.create({ data: { orderId: o.id, status, by } });
      return tx.order.update({ where: { id: o.id }, data: { status, ...(collected && { paymentStatus: 'PAID' }) }, include: { user: true } });
    });
    if (!o) return ok('No change.');
    after(() => mailStatusChange(o, o.user));
    refreshSite();
    return ok(`${o.id} is now ${STATUS_LABEL[status]} — the customer can see it`);
  } catch (e) {
    if (e instanceof Nope) return fail(e.message);
    throw e;
  }
}

const AddressSchema = z.object({
  name: z.string().trim().min(2, 'Enter the name.'), phone: z.string().trim().regex(/^[\d+\s-]{10,15}$/, 'Enter a 10-digit mobile number.'),
  line: z.string().trim().min(6, 'Enter the flat and street.'), city: z.string().trim().min(2, 'Enter the city.'),
  state: z.string().trim().min(2, 'Enter the state.'), pin: z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits.'),
  landmark: z.string().trim().max(120).optional(),
});

export async function updateOrderAddress(id: string, f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const r = AddressSchema.safeParse(Object.fromEntries(f));
  if (!r.success) return fail(first(r.error));
  const o = await db.order.findUnique({ where: { id: String(id) } });
  if (!o) return fail('Order not found.');
  if (o.status === 'SHIPPED' || o.status === 'DELIVERED') return fail('This order has already left — change the address with the courier.');
  await db.order.update({ where: { id: o.id }, data: { address: { ...r.data, landmark: r.data.landmark || null } } });
  refreshSite();
  return ok('Delivery address updated');
}

export async function setPayment(id: string, action: 'received' | 'reject' | 'refund'): Promise<AdminResult> {
  await requireAdmin();
  const o = await db.order.findUnique({ where: { id: String(id) } });
  if (!o) return fail('Order not found.');

  if (action === 'received') {
    const r = await db.order.updateMany({ where: { id: o.id, paymentStatus: { in: ['PENDING', 'AWAITING_CHECK', 'FAILED'] } }, data: { paymentStatus: 'PAID' } });
    if (!r.count) return fail('This order is not waiting for payment.');
  } else if (action === 'reject') {
    // the UTR did not match: the customer sees "Pay now" again and can send the right one
    const r = await db.order.updateMany({ where: { id: o.id, paymentStatus: 'AWAITING_CHECK' }, data: { paymentStatus: 'FAILED', paymentRef: null } });
    if (!r.count) return fail('There is no reference waiting to be checked on this order.');
  } else if (action === 'refund') {
    if (o.paymentStatus !== 'PAID') return fail('Only paid orders can be refunded.');
    if (o.payment === 'razorpay') {
      if (!razorpayEnabled() || !o.paymentRef) return fail('Razorpay is not configured, so refund it from the Razorpay dashboard.');
      try { await refundPayment(o.paymentRef); }
      catch (e) { console.error(e); return fail('Razorpay refused the refund — check the Razorpay dashboard.'); }
    }
    await db.order.update({ where: { id: o.id }, data: { paymentStatus: 'REFUNDED' } });
  } else return fail('Unknown action.');

  refreshSite();
  return ok({ received: 'Payment marked as received', reject: 'Reference rejected — the customer can send it again', refund: o.payment === 'razorpay' ? 'Refund sent through Razorpay' : 'Marked as refunded — send the money back from your bank or UPI app' }[action]);
}

/* ═══ PRODUCTS ═══ */

const list = (s: unknown) => String(s ?? '').split(',').map(x => x.trim()).filter(Boolean);
const ProductSchema = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,30}$/, 'SKU should look like JMC-XX-020.'),
  name: z.string().trim().min(3, 'Give the product a name.').max(120),
  cat: z.enum(['kurta', 'gown', 'set', 'bridal']),
  price: z.coerce.number().int().positive('Enter a selling price.'),
  mrp: z.coerce.number().int().positive('Enter the M.R.P.'),
  stock: z.coerce.number().int().min(0),
  badge: z.string().trim().max(20).optional(),
  badgeTone: z.enum(['gold', 'teal']).optional(),
  fabric: z.string().trim().max(200).optional(), work: z.string().trim().max(200).optional(), care: z.string().trim().max(200).optional(),
  desc: z.string().trim().min(20, 'Write at least a sentence of description.').max(4000),
  sizes: z.array(z.string().max(10)).min(1, 'Add at least one size.'),
  colors: z.array(z.string().max(40)).min(1, 'Add at least one colour.'),
  gallery: z.array(z.string().regex(/^(u-)?[a-z0-9-]+$/i)).min(1, 'Add at least one photo.'),
  active: z.boolean(),
}).refine(p => p.mrp >= p.price, { message: 'M.R.P. cannot be lower than the selling price.' });

export async function saveProduct(existingSku: string | null, f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const r = ProductSchema.safeParse({
    ...Object.fromEntries(f), sizes: list(f.get('sizes')), colors: list(f.get('colors')),
    gallery: JSON.parse(String(f.get('gallery') || '[]')), active: f.get('active') === 'on',
    sku: existingSku ?? f.get('sku'), badgeTone: f.get('badgeTone') || undefined,
  });
  if (!r.success) return fail(first(r.error));
  const { gallery, ...p } = r.data;
  const data = { ...p, badge: p.badge || null, badgeTone: p.badge ? p.badgeTone ?? 'gold' : null, img: gallery[0], gallery };
  if (existingSku) {
    await db.product.update({ where: { sku: existingSku }, data });
  } else {
    if (await db.product.findUnique({ where: { sku: p.sku } })) return fail('That SKU is already used.');
    await db.product.create({ data });
  }
  refreshSite();
  return existingSku ? ok('Product saved') : ok('Product added — it is live on the shop now', `/admin/products/${p.sku}`);
}

export async function uploadPhoto(f: FormData): Promise<AdminResult & { id?: string }> {
  await requireAdmin();
  try { return { ...ok('Photo uploaded'), id: await saveUpload(f.get('photo') as File) }; }
  catch (e) { return fail((e as Error).message); }
}

export async function setStock(sku: string, stock: number): Promise<AdminResult> {
  await requireAdmin();
  const n = Math.max(0, Math.floor(Number(stock) || 0));
  const p = await db.product.update({ where: { sku: String(sku) }, data: { stock: n } });
  refreshSite();
  return ok(`${p.name} stock set to ${n}`);
}

export async function setActive(sku: string, active: boolean): Promise<AdminResult> {
  await requireAdmin();
  const p = await db.product.update({ where: { sku: String(sku) }, data: { active: !!active } });
  refreshSite();
  return ok(active ? `${p.name} is back in the shop` : `${p.name} is hidden from the shop`);
}

// Past orders keep their own copy of the product, so deleting never touches them.
export async function deleteProduct(sku: string): Promise<AdminResult> {
  await requireAdmin();
  await db.product.delete({ where: { sku: String(sku) } }); // bags, wishlists and reviews of it go too
  refreshSite();
  return ok('Product deleted', '/admin/products');
}

/* ═══ CUSTOMERS ═══ */

export async function saveCustomerNotes(id: number, f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const note = String(f.get('note') ?? '').trim().slice(0, 5000);
  const tags = [...new Set(list(f.get('tags')).map(t => t.slice(0, 30)))];
  await db.user.update({ where: { id: Number(id) }, data: { note: note || null, tags: tags.length ? tags : Prisma.DbNull } });
  revalidatePath('/admin/customers');
  return ok('Notes saved');
}

export async function setRole(id: number, role: 'CUSTOMER' | 'ADMIN'): Promise<AdminResult> {
  const me = await adminId();
  if (Number(id) === me) return fail('You cannot change your own role.');
  if (role !== 'CUSTOMER' && role !== 'ADMIN') return fail('Unknown role.');
  await db.user.update({ where: { id: Number(id) }, data: { role } });
  revalidatePath('/admin/customers');
  return ok(role === 'ADMIN' ? 'Now an admin — they can open the dashboard' : 'Admin access removed');
}

// Editing a customer's bag (e.g. building an order with them on the phone)
export async function cartSetQty(userId: number, itemId: number, qty: number): Promise<AdminResult> {
  await requireAdmin();
  const n = Math.max(1, Math.min(MAX_QTY, Math.floor(Number(qty) || 1)));
  await db.cartItem.updateMany({ where: { id: Number(itemId), userId: Number(userId) }, data: { qty: n } });
  refreshSite();
  return ok(`Quantity set to ${n}`);
}

export async function cartRemove(userId: number, itemId: number): Promise<AdminResult> {
  await requireAdmin();
  await db.cartItem.deleteMany({ where: { id: Number(itemId), userId: Number(userId) } });
  refreshSite();
  return ok('Removed from their bag');
}

export async function cartAdd(userId: number, f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const sku = String(f.get('sku') ?? ''), size = String(f.get('size') ?? '').trim(), color = String(f.get('color') ?? '').trim();
  const qty = Math.max(1, Math.min(MAX_QTY, Number(f.get('qty')) || 1));
  const p = await db.product.findFirst({ where: { sku, active: true } });
  if (!p) return fail('Pick a product.');
  if (!(p.sizes as string[]).includes(size)) return fail(`Size must be one of ${(p.sizes as string[]).join(', ')}.`);
  if (!(p.colors as string[]).includes(color)) return fail(`Colour must be one of ${(p.colors as string[]).join(', ')}.`);
  const where = { userId_sku_size_color: { userId: Number(userId), sku, size, color } };
  await db.cartItem.upsert({ where, update: { qty }, create: { userId: Number(userId), sku, size, color, qty } });
  refreshSite();
  return ok(`${p.name} added to their bag`);
}

/* ═══ INBOX ═══ */

export async function markRead(id: number | 'all'): Promise<AdminResult> {
  await requireAdmin();
  await db.message.updateMany({ where: id === 'all' ? { read: false } : { id: Number(id) }, data: { read: true } });
  revalidatePath('/admin', 'layout');
  return ok(id === 'all' ? 'Inbox cleared' : 'Marked as read');
}

export async function deleteMessage(id: number): Promise<AdminResult> {
  await requireAdmin();
  await db.message.deleteMany({ where: { id: Number(id) } });
  revalidatePath('/admin', 'layout');
  return ok('Message deleted');
}

/* ═══ REVIEWS ═══ */

// Seeded rating/count are a running average, so approving or withdrawing a review folds it in or out.
async function foldRating(tx: Prisma.TransactionClient, sku: string, rating: number, dir: 1 | -1) {
  const p = await tx.product.findUnique({ where: { sku } });
  if (!p) return;
  const n = p.reviewCount + dir;
  const avg = n > 0 ? (p.rating * p.reviewCount + dir * rating) / n : 0;
  await tx.product.update({ where: { sku }, data: { reviewCount: Math.max(0, n), rating: Math.round(Math.min(5, Math.max(0, avg)) * 10) / 10 } });
}

export async function setReviewApproved(id: number, approved: boolean): Promise<AdminResult> {
  await requireAdmin();
  const done = await db.$transaction(async tx => {
    const r = await tx.review.updateMany({ where: { id: Number(id), approved: !approved }, data: { approved: !!approved } });
    if (!r.count) return false;
    const rev = await tx.review.findUniqueOrThrow({ where: { id: Number(id) } });
    await foldRating(tx, rev.sku, rev.rating, approved ? 1 : -1);
    return true;
  });
  if (!done) return ok('No change.');
  refreshSite();
  return ok(approved ? 'Review is live on the product page' : 'Review hidden');
}

export async function deleteReview(id: number): Promise<AdminResult> {
  await requireAdmin();
  await db.$transaction(async tx => {
    const rev = await tx.review.findUnique({ where: { id: Number(id) } });
    if (!rev) return;
    if (rev.approved) await foldRating(tx, rev.sku, rev.rating, -1);
    await tx.review.delete({ where: { id: rev.id } });
  });
  refreshSite();
  return ok('Review removed');
}

/* ═══ SITE CONTENT ═══ */

async function putContent(key: keyof typeof DEFAULTS, value: unknown) {
  const v = value as Prisma.InputJsonValue;
  await db.siteContent.upsert({ where: { key }, update: { value: v }, create: { key, value: v } });
  refreshSite();
}

const SlideSchema = z.object({
  img: z.string().regex(/^(u-)?[a-z0-9-]+$/i, 'Every slide needs a photo.'),
  alt: z.string().trim().max(160), eyebrow: z.string().trim().max(80),
  title: z.string().trim().min(1, 'Every slide needs a title.').max(60), titleEm: z.string().trim().max(60).optional(),
  text: z.string().trim().max(300),
  ctaHref: z.string().trim().regex(/^\//, 'Button links start with / (a page on this site).'), ctaText: z.string().trim().min(1, 'Every slide needs a button label.').max(40),
  altHref: z.string().trim().regex(/^(\/.*)?$/, 'Second-button links start with /.').optional(), altText: z.string().trim().max(40).optional(),
});

export async function saveHeroSlides(slides: HeroSlide[]): Promise<AdminResult> {
  await requireAdmin();
  const r = z.array(SlideSchema).min(1, 'Keep at least one slide.').max(8, 'Eight slides at most.').safeParse(slides);
  if (!r.success) return fail(first(r.error));
  await putContent('hero_slides', r.data);
  return ok('Home page slides saved');
}

export async function saveStrip(f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const lines = String(f.get('lines') ?? '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
  if (!lines.length) return fail('Add at least one line.');
  await putContent('strip', lines);
  return ok('Scrolling strip saved');
}

const FooterSchema = z.object({
  about: z.string().trim().min(10).max(400), address: z.string().trim().min(5).max(200),
  phone: z.string().trim().min(8).max(30), email: z.string().trim().email('Enter a valid email address.'), hours: z.string().trim().max(80),
  instagram: z.string().trim().max(200), whatsapp: z.string().trim().max(200), facebook: z.string().trim().max(200), pinterest: z.string().trim().max(200),
});

export async function saveFooter(f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const r = FooterSchema.safeParse(Object.fromEntries(f));
  if (!r.success) return fail(first(r.error));
  const { instagram, whatsapp, facebook, pinterest, ...rest } = r.data;
  const link = (u: string) => (/^https?:\/\//.test(u) ? u : '#');
  await putContent('footer', { ...rest, socials: { instagram: link(instagram), whatsapp: link(whatsapp), facebook: link(facebook), pinterest: link(pinterest) } });
  return ok('Contact details saved');
}

const PaymentSchema = z.object({
  upiId: z.string().trim().regex(/^([\w.-]{2,}@[a-z]{2,})?$/i, 'Enter a UPI ID like yourname@okaxis, or leave it empty to switch UPI off.'),
  payee: z.string().trim().min(2, 'Enter the name shown in the UPI app.').max(60),
  codFee: z.coerce.number().int().min(0).max(1000), codMax: z.coerce.number().int().min(0).max(500000),
});

export async function savePaymentSettings(f: FormData): Promise<AdminResult> {
  await requireAdmin();
  const r = PaymentSchema.safeParse(Object.fromEntries(f));
  if (!r.success) return fail(first(r.error));
  await putContent('payment', r.data);
  return ok(r.data.upiId ? 'Payment settings saved — UPI is live at checkout' : 'Payment settings saved — UPI is switched off');
}
