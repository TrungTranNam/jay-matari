import Link from 'next/link';
import { img, srcSet } from '@/lib/format';
import SignupForm from './SignupForm';

export const metadata = { title: 'Create your account' };

export default async function Signup({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="auth">
      <div className="auth-art teal">
        <img src={img('g15', 1920)} srcSet={srcSet('g15')} sizes="50vw" alt="Mirror work sharara detail" />
        <div className="auth-perks">
          <div className="eyebrow">What an account gets you</div>
          <ul>
            <li><i className="bx bx-package" /><span>Track every order from stitching to your door</span></li>
            <li><i className="bx bx-heart" /><span>A wishlist that stays put between visits</span></li>
            <li><i className="bx bx-time-five" /><span>Early access to the monthly release, a day before everyone</span></li>
            <li><i className="bx bx-ruler" /><span>We keep your measurements, so the next piece fits first time</span></li>
          </ul>
        </div>
      </div>
      <div className="auth-form">
        <div className="auth-box">
          <div className="eyebrow">Join us</div>
          <h1>Create your account</h1>
          <p className="lede">Takes about thirty seconds.</p>
          <SignupForm next={callbackUrl} />
          <p className="form-note">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="form-note" style={{ marginTop: 10 }}><Link href="/" style={{ color: 'var(--ink-faint)' }}>← Back to the shop</Link></p>
        </div>
      </div>
    </div>
  );
}
