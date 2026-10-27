import Link from 'next/link';
import { img, srcSet } from '@/lib/format';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in' };

export default async function Login({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="auth">
      <div className="auth-art">
        <img src={img('g8', 1920)} srcSet={srcSet('g8')} sizes="50vw" alt="Aari embroidery detail" />
        <div className="auth-quote">
          <div className="eyebrow">Since 2016</div>
          <p>“The stitch you cannot see is the one that holds it together.”</p>
          <small>Kailash Ben · Head karigar, Maninagar</small>
        </div>
      </div>
      <div className="auth-form">
        <div className="auth-box">
          <div className="eyebrow">Welcome back</div>
          <h1>Sign in</h1>
          <p className="lede">Your bag, wishlist and order history are waiting.</p>
          <LoginForm next={callbackUrl} />
          <p className="form-note">New here? <Link href="/signup">Create an account</Link></p>
          <p className="form-note" style={{ marginTop: 10 }}><Link href="/" style={{ color: 'var(--ink-faint)' }}>← Back to the shop</Link></p>
        </div>
      </div>
    </div>
  );
}
