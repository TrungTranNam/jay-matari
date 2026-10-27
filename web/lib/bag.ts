import { cookies } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from './db';
import { MAX_QTY, shippingFor } from './pricing';

// Bag + wishlist. Signed in → DB rows. Guest → httpOnly cookie, merged into the DB on sign-in.
// Prices and stock always come from Product, never from the cookie.

export type Line = { sku: string; size: string; color: string; qty: number };
export type CartItem = Line & { key: string; name: string; price: number; img: string; stock: number };
export type Cart = { items: CartItem[]; count: number; sub: number; ship: number; total: number };

const CART = 'jmc_cart', WISH = 'jmc_wish';
const LineSchema = z.object({ sku: z.string(), size: z.string(), color: z.string(), qty: z.number().int().min(1).max(MAX_QTY) });

export const lineKey = (l: Pick<Line, 'sku' | 'size' | 'color'>) => `${l.sku}|${l.size}|${l.color}`;

export async function userId() {
  const s = await auth();
  return s?.user?.id ? Number(s.user.id) : null;
}

async function readCookie<T>(name: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  try {
    const r = schema.safeParse(JSON.parse((await cookies()).get(name)?.value ?? ''));
    return r.success ? r.data : fallback;
  } catch { return fallback; }
}

async function writeCookie(name: string, value: unknown) {
  (await cookies()).set(name, JSON.stringify(value), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production',
  });
}

const guestLines = () => readCookie(CART, z.array(LineSchema), []);
const guestWish = () => readCookie(WISH, z.array(z.string()), []);

/* ── bag ─────────────────────────────── */

export async function getLines(): Promise<Line[]> {
  const uid = await userId();
  if (!uid) return guestLines();
  return db.cartItem.findMany({ where: { userId: uid }, orderBy: { id: 'asc' }, select: { sku: true, size: true, color: true, qty: true } });
}

export async function getCart(): Promise<Cart> {
  const lines = await getLines();
  const products = await db.product.findMany({ where: { sku: { in: lines.map(l => l.sku) }, active: true } });
  const items = lines.flatMap(l => {
    const p = products.find(x => x.sku === l.sku);
    return p ? [{ ...l, key: lineKey(l), name: p.name, price: p.price, img: p.img, stock: p.stock }] : [];
  });
  const sub = items.reduce((n, i) => n + i.price * i.qty, 0);
  const ship = shippingFor(sub);
  return { items, count: items.reduce((n, i) => n + i.qty, 0), sub, ship, total: sub + ship };
}

// Throws a customer-facing message when the piece can't go in the bag.
async function checkProduct(l: Omit<Line, 'qty'>) {
  const p = await db.product.findFirst({ where: { sku: l.sku, active: true } });
  if (!p) throw new Error('This piece is no longer available.');
  if (p.stock <= 0) throw new Error('This piece is sold out.');
  if (!(p.sizes as string[]).includes(l.size)) throw new Error('Pick a size.');
  if (!(p.colors as string[]).includes(l.color)) throw new Error('Pick a colour.');
  return p;
}

export async function addLine(l: Line) {
  const p = await checkProduct(l);
  const cap = Math.min(MAX_QTY, p.stock);
  const uid = await userId();
  if (uid) {
    const where = { userId_sku_size_color: { userId: uid, sku: l.sku, size: l.size, color: l.color } };
    const cur = await db.cartItem.findUnique({ where });
    const qty = Math.min(cap, (cur?.qty ?? 0) + l.qty);
    await db.cartItem.upsert({ where, update: { qty }, create: { userId: uid, ...l, qty } });
  } else {
    const lines = await guestLines();
    const cur = lines.find(x => lineKey(x) === lineKey(l));
    if (cur) cur.qty = Math.min(cap, cur.qty + l.qty); else lines.push({ ...l, qty: Math.min(cap, l.qty) });
    await writeCookie(CART, lines);
  }
  return p;
}

export async function setQty(key: string, qty: number) {
  const [sku, size, color] = key.split('|');
  const p = await db.product.findUnique({ where: { sku }, select: { stock: true } });
  qty = Math.max(1, Math.min(MAX_QTY, p?.stock || 1, qty));
  const uid = await userId();
  if (uid) {
    await db.cartItem.updateMany({ where: { userId: uid, sku, size, color }, data: { qty } });
  } else {
    await writeCookie(CART, (await guestLines()).map(l => (lineKey(l) === key ? { ...l, qty } : l)));
  }
}

export async function removeLine(key: string) {
  const [sku, size, color] = key.split('|');
  const uid = await userId();
  if (uid) await db.cartItem.deleteMany({ where: { userId: uid, sku, size, color } });
  else await writeCookie(CART, (await guestLines()).filter(l => lineKey(l) !== key));
}

/* ── wishlist ────────────────────────── */

export async function getWish(): Promise<string[]> {
  const uid = await userId();
  if (!uid) return guestWish();
  return (await db.wish.findMany({ where: { userId: uid }, select: { sku: true } })).map(w => w.sku);
}

// returns true when the piece is now saved
export async function toggleWish(sku: string) {
  if (!(await db.product.findUnique({ where: { sku }, select: { sku: true } }))) throw new Error('Unknown piece.');
  const uid = await userId();
  if (uid) {
    const where = { userId_sku: { userId: uid, sku } };
    if (await db.wish.findUnique({ where })) { await db.wish.delete({ where }); return false; }
    await db.wish.create({ data: { userId: uid, sku } });
    return true;
  }
  const list = await guestWish();
  const on = !list.includes(sku);
  await writeCookie(WISH, on ? [...list, sku] : list.filter(s => s !== sku));
  return on;
}

export async function clearWish() {
  const uid = await userId();
  if (uid) await db.wish.deleteMany({ where: { userId: uid } });
  else await writeCookie(WISH, []);
}

/* ── sign-in: fold the guest bag + wishlist into the account ── */

export async function mergeGuest(uid: number) {
  const [lines, wish] = await Promise.all([guestLines(), guestWish()]);
  for (const l of lines) {
    const where = { userId_sku_size_color: { userId: uid, sku: l.sku, size: l.size, color: l.color } };
    const cur = await db.cartItem.findUnique({ where });
    const qty = Math.min(MAX_QTY, (cur?.qty ?? 0) + l.qty);
    await db.cartItem.upsert({ where, update: { qty }, create: { userId: uid, ...l, qty } }).catch(() => {}); // sku gone: drop it
  }
  for (const sku of wish) await db.wish.upsert({ where: { userId_sku: { userId: uid, sku } }, update: {}, create: { userId: uid, sku } }).catch(() => {});
  const jar = await cookies();
  jar.delete(CART);
  jar.delete(WISH);
}
