'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logout } from '@/app/(auth)/actions';
import { openBag } from './CartDrawer';
import { BrandLockup } from './Logo';

const NAV = [['/', 'Home'], ['/shop', 'Collection'], ['/gallery', 'Atelier'], ['/about', 'Our Story'], ['/contact', 'Contact']];

type Props = {
  user: { name: string; email: string; isAdmin: boolean } | null;
  counts: { bag: number; wish: number; orders: number };
};

export default function HeaderClient({ user, counts }: Props) {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shrunk, setShrunk] = useState(false);
  const [dark, setDark] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
    const onScroll = () => setShrunk(scrollY > 30);
    const onClick = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { removeEventListener('scroll', onScroll); document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => { setNavOpen(false); setMenuOpen(false); }, [path]);

  const toggleTheme = () => {
    const t = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('jmc_theme', t); } catch {}
    setDark(!dark);
  };

  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <header className={`site-header ${shrunk ? 'shrunk' : ''}`}>
      <div className="header-inner">
        <BrandLockup />
        <nav className={`main-nav ${navOpen ? 'open' : ''}`}>
          {NAV.map(([h, l]) => <Link key={h} href={h} className={path === h || (h === '/shop' && /^\/(product|cart)/.test(path)) ? 'active' : undefined}>{l}</Link>)}
        </nav>
        <div className="header-tools">
          <button className="tool-btn" onClick={toggleTheme} title="Switch theme" aria-label="Switch theme">
            <i className={`bx ${dark ? 'bx-sun' : 'bx-moon'}`} /></button>
          <Link href="/wishlist" className="tool-btn" title="Wishlist" aria-label="Wishlist">
            <i className="bx bx-heart" /><span className={`count-badge ${counts.wish ? '' : 'hide'}`}>{counts.wish}</span></Link>
          <button className="tool-btn" onClick={openBag} title="Your bag" aria-label="Your bag">
            <i className="bx bx-shopping-bag" /><span className={`count-badge ${counts.bag ? '' : 'hide'}`}>{counts.bag}</span></button>
          <div className="profile-zone" ref={menu}>
            {user ? <>
              <div className="avatar" tabIndex={0} role="button" aria-label="Your account" aria-expanded={menuOpen}
                   onClick={() => setMenuOpen(!menuOpen)}
                   onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setMenuOpen(!menuOpen)}>{initials}</div>
              <div className={`profile-menu ${menuOpen ? 'open' : ''}`}>
                <div className="pm-head">
                  <div className="avatar">{initials}</div>
                  <div className="pm-id">
                    <b>{user.name}</b><small>{user.email}</small>
                    {user.isAdmin && <span className="pm-tag">Admin</span>}
                  </div>
                </div>
                <div className="pm-links">
                  <Link href="/profile"><i className="bx bx-user" /> My profile</Link>
                  <Link href="/orders"><i className="bx bx-package" /> My orders <span className="pm-stat">{counts.orders || ''}</span></Link>
                  <Link href="/wishlist"><i className="bx bx-heart" /> Wishlist <span className="pm-stat">{counts.wish || ''}</span></Link>
                  <Link href="/cart"><i className="bx bx-shopping-bag" /> My bag <span className="pm-stat">{counts.bag || ''}</span></Link>
                  {user.isAdmin && <><div className="divider" /><Link href="/admin"><i className="bx bx-grid-alt" /> Admin dashboard</Link></>}
                  <div className="divider" />
                  <form action={logout}>
                    <button type="submit" className="danger"><i className="bx bx-log-out" /> Sign out</button>
                  </form>
                </div>
              </div>
            </> : <Link href="/login" className="btn btn-line btn-sm" style={{ marginLeft: 8 }}><i className="bx bx-user" /> Sign in</Link>}
          </div>
          <button className="burger" aria-label="Menu" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>
            <i className={`bx bx-${navOpen ? 'x' : 'menu'}`} /></button>
        </div>
      </div>
      <div className="zari-thread" />
    </header>
  );
}
