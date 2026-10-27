'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signIn, signOut } from '@/auth';
import { mergeGuest } from '@/lib/bag';
import { db } from '@/lib/db';
import { safeNext } from '@/lib/safe-next';

export type FormState = { error?: string } | undefined;

async function signInAndGo(email: string, password: string, next: string) {
  await signIn('credentials', { email, password, redirect: false });
  const u = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true, role: true } });
  await mergeGuest(u.id);
  redirect(next || (u.role === 'ADMIN' ? '/admin' : '/profile'));
}

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const email = String(f.get('email') ?? '').trim().toLowerCase();
  try {
    await signInAndGo(email, String(f.get('password') ?? ''), safeNext(f.get('next')));
  } catch (e) {
    if (e instanceof AuthError) return { error: 'Email or password is incorrect.' };
    throw e; // includes Next's redirect
  }
}

const Signup = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[\d+\s-]{10,15}$/, 'Enter a 10-digit mobile number.'),
  password: z.string().min(8, 'Password needs at least 8 characters.'),
});

export async function signup(_: FormState, f: FormData): Promise<FormState> {
  const r = Signup.safeParse(Object.fromEntries(f));
  if (!r.success) return { error: r.error.issues[0].message };
  if (f.get('password') !== f.get('password2')) return { error: 'The two passwords do not match.' };
  if (!f.get('agree')) return { error: 'Tick the box to accept the terms.' };

  const { name, email, phone, password } = r.data;
  if (await db.user.findUnique({ where: { email } }))
    return { error: 'This email is already registered. Sign in instead.' };
  await db.user.create({ data: { name, email, phone, password: await bcrypt.hash(password, 12) } });
  await signInAndGo(email, password, safeNext(f.get('next')));
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}
