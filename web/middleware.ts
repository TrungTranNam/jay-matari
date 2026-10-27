import NextAuth from 'next-auth';
import authConfig from './auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = { matcher: ['/admin/:path*', '/profile/:path*', '/orders/:path*', '/checkout/:path*', '/login', '/signup'] };
