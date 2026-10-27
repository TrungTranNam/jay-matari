// Post-login redirect target. Keep only path + query, so "https://evil.com/x" or "//evil.com"
// can't send users off-site. Middleware hands us an absolute URL of our own host; that becomes its path.
export function safeNext(v: unknown) {
  const s = String(v ?? '');
  if (!s) return '';
  const u = new URL(s, 'http://local');
  return u.pathname.startsWith('/') ? u.pathname + u.search : '';
}
