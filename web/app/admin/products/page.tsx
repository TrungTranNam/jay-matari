import Link from 'next/link';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { img, rs } from '@/lib/format';
import { deleteProduct, setActive, setStock } from '../actions';
import { ActBtn, NumberAct } from '../ui';

export const metadata = { title: 'Products · Admin' };

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = '' } = await searchParams;
  const list = await db.product.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { cat: { contains: q } }] } : {},
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  });
  return (
    <div className="panel">
      <div className="panel-head"><h3>Products ({list.length})</h3>
        <Link className="btn btn-solid btn-sm" href="/admin/products/new"><i className="bx bx-plus" /> Add a product</Link></div>
      <form className="tool-row">
        <input name="q" defaultValue={q} placeholder="Search by name, SKU or category" aria-label="Search products" />
        <button className="btn btn-line btn-sm">Search</button>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th /><th>Product</th><th>Category</th><th>Price</th><th>M.R.P.</th><th>Stock</th><th>Rating</th><th /></tr></thead>
        <tbody>{list.map(p => (
          <tr key={p.sku} style={{ opacity: p.active ? 1 : .55 }}>
            <td><img className="mini-img" src={img(p.img)} alt="" /></td>
            <td><Link href={`/admin/products/${p.sku}`}><b>{p.name}</b></Link>{!p.active && <span className="badge" style={{ marginLeft: 8 }}>Hidden</span>}
              <br /><small style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{p.sku}</small></td>
            <td style={{ textTransform: 'capitalize' }}>{p.cat}</td>
            <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{rs(p.price)}</td>
            <td style={{ fontFamily: 'var(--f-mono)', color: 'var(--ink-faint)' }}>{rs(p.mrp)}</td>
            <td><NumberAct value={p.stock} label={`Stock of ${p.name}`} act={setStock.bind(null, p.sku)} /></td>
            <td><span className="stars" style={{ fontSize: 11 }}>{'★'.repeat(Math.round(p.rating))}</span>
              <small style={{ color: 'var(--ink-faint)' }}> {p.rating} ({p.reviewCount})</small></td>
            <td style={{ whiteSpace: 'nowrap' }}>
              <Link className="btn btn-ghost" href={`/admin/products/${p.sku}`} title="Edit" aria-label={`Edit ${p.name}`}><i className="bx bx-edit" /></Link>
              <ActBtn className="btn btn-ghost" title={p.active ? 'Hide from shop' : 'Show in shop'} act={setActive.bind(null, p.sku, !p.active)}>
                <i className={`bx ${p.active ? 'bx-hide' : 'bx-show'}`} /></ActBtn>
              <ActBtn className="btn btn-ghost" title="Delete" act={deleteProduct.bind(null, p.sku)}
                confirm={`Delete "${p.name}"? It leaves the shop and every bag and wishlist. Past orders keep their copy. Hiding it is usually better.`}>
                <i className="bx bx-trash" /></ActBtn>
            </td>
          </tr>
        ))}</tbody></table></div>
      <p className="muted" style={{ marginTop: 14 }}>Change a stock number and the shop shows it on the next page load.</p>
    </div>
  );
}
