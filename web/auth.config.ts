import type { NextAuthConfig } from 'next-auth';

// Edge-safe part (no Prisma, no bcrypt) so middleware can import it.
export default {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as 'CUSTOMER' | 'ADMIN';
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const p = nextUrl.pathname;
      // admin role is checked against the DB by requireAdmin(); here just require a session
      if (/^\/(admin|profile|orders|checkout)/.test(p)) return !!auth?.user;
      if (/^\/(login|signup)/.test(p) && auth?.user) return Response.redirect(new URL('/', nextUrl));
      return true;
    },
  },
} satisfies NextAuthConfig;
