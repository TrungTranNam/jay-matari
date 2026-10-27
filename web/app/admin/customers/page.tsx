import Link from 'next/link';
import { requireAdmin } from '@/auth';
import { customerRows } from '@/lib/customers';
import { day, rs } from '@/lib/format';

export const metadata = { title: 'Customers · Admin' };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string; sort?: string }> }) {
  await requireAdmin();
  const { q = '', tag = '', sort = 'new' } = await searchParams;
  const rows = await customerRows(q, tag);
  if (sort === 'spent') rows.sort((a, b) => b.spent - a.spent);
  const allTags = [...new Set(rows.flatMap(r => r.tags))].sort();
  const qs = (patch: Record<string, string>) => '?' + new URLSearchParams({ q, tag, sort, ...patch }).toString();

  return (
    <div className="panel">
      <div className="panel-head"><h3>Customers ({rows.length})</h3>
        <a className="btn btn-line btn-sm" href={`/admin/customers/export${qs({})}`}><i className="bx bx-download" /> Export CSV</a></div>
      <form className="tool-row">
        <input type="hidden" name="tag" value={tag} /><input type="hidden" name="sort" value={sort} />
        <input name="q" defaultValue={q} placeholder="Search by name, email or phone" aria-label="Search customers" />
        <button className="btn btn-line btn-sm">Search</button>
      </form>
      <div className="ftabs">
        <Link href={qs({ sort: 'new' })} className={sort === 'new' ? 'on' : undefined}>Newest</Link>
        <Link href={qs({ sort: 'spent' })} className={sort === 'spent' ? 'on' : undefined}>Top spenders</Link>
        {allTags.length > 0 && <Link href={qs({ tag: '' })} className={!tag ? 'on' : undefined}>Any tag</Link>}
        {allTags.map(t => <Link key={t} href={qs({ tag: t })} className={tag === t ? 'on' : undefined}>{t}</Link>)}
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Contact</th><th>Orders</th><th>Spent</th><th>Last order</th><th>Joined</th><th>Tags</th></tr></thead>
        <tbody>{rows.map(u => (
          <tr key={u.id}>
            <td><Link href={`/admin/customers/${u.id}`}><b>{u.name}</b></Link>
              {u.role === 'ADMIN' && <span className="badge warn" style={{ marginLeft: 8 }}>Admin</span>}</td>
            <td style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{u.email}<br /><span style={{ fontFamily: 'var(--f-mono)' }}>{u.phone ?? '—'}</span></td>
            <td>{u.orders}</td>
            <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{rs(u.spent)}</td>
            <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{u.lastOrder ? day(u.lastOrder) : '—'}</td>
            <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{day(u.createdAt)}</td>
            <td>{u.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}</td>
          </tr>
        ))}</tbody></table></div>
    </div>
  );
}
