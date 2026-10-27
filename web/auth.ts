import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import authConfig from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(c) {
        const email = String(c.email ?? '').trim().toLowerCase();
        const u = await db.user.findUnique({ where: { email } });
        if (!u || !(await bcrypt.compare(String(c.password ?? ''), u.password))) return null;
        return { id: String(u.id), name: u.name, email: u.email, role: u.role };
      },
    }),
  ],
});

// Middleware only routes; every admin page and action must still call this.
// Role is re-read from the DB so removing someone's admin access takes effect immediately.
export async function requireAdmin() {
  const s = await auth();
  const id = Number(s?.user?.id);
  const u = id ? await db.user.findUnique({ where: { id }, select: { role: true } }) : null;
  if (u?.role !== 'ADMIN') redirect('/login?callbackUrl=/admin');
  return s!.user;
}
