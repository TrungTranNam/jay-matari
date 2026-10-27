import Link from 'next/link';
import { getContent } from '@/lib/content';
import { BrandLockup } from './Logo';
import ReplayIntro from './ReplayIntro';

export default async function Footer() {
  const f = await getContent('footer');
  return (
    <footer className="site-footer"><div className="wrap"><div className="foot-grid">
      <div className="foot-col foot-brand">
        <BrandLockup style={{ marginBottom: 20 }} />
        <p>{f.about}</p>
        <div className="socials">
          <a href={f.socials.instagram} aria-label="Instagram"><i className="bx bxl-instagram" /></a>
          <a href={f.socials.whatsapp} aria-label="WhatsApp"><i className="bx bxl-whatsapp" /></a>
          <a href={f.socials.facebook} aria-label="Facebook"><i className="bx bxl-facebook" /></a>
          <a href={f.socials.pinterest} aria-label="Pinterest"><i className="bx bxl-pinterest" /></a>
        </div>
      </div>
      <div className="foot-col"><h5>Shop</h5>
        <Link href="/shop?cat=kurta">Kurta sets</Link><Link href="/shop?cat=gown">Gowns</Link>
        <Link href="/shop?cat=set">Co-ord sets</Link><Link href="/shop?cat=bridal">Bridal</Link>
        <Link href="/shop">Everything</Link></div>
      <div className="foot-col"><h5>Account</h5>
        <Link href="/profile">My profile</Link><Link href="/orders">Track an order</Link>
        <Link href="/wishlist">Wishlist</Link><Link href="/cart">My bag</Link><Link href="/login">Sign in</Link></div>
      <div className="foot-col"><h5>Reach us</h5>
        <p><i className="bx bx-map" /> {f.address}</p>
        <p><i className="bx bx-phone" /> {f.phone}</p>
        <p><i className="bx bx-envelope" /> {f.email}</p>
        <p><i className="bx bx-time" /> {f.hours}</p></div>
    </div>
    <div className="foot-bottom">
      <span>© {new Date().getFullYear()} Jay Mataji Creation · Handmade in Gujarat</span>
      <span>Free delivery over ₹2,999 · 7-day exchange · <ReplayIntro /></span>
    </div></div></footer>
  );
}
