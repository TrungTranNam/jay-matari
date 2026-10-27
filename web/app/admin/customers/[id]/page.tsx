import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/auth';
import { tagsOf } from '@/lib/customers';
import { db } from '@/lib/db';
import { day, img, rs, when } from '@/lib/format';
import { PAY_STATUS_LABEL, STATUS_LABEL, statusTone } from '@/lib/orders';
import { cartAdd, cartRemove, cartSetQty, saveCustomerNotes, setRole } from '../../actions';
import { ActBtn, AdminForm, NumberAct } from '../../ui';

export default async function Customer({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const id = Number((await params).id);
  const u = id ? await db.user.findUnique({
    where: { id },
    include: {
      addresses: true, orders: { orderBy: { createdAt: 'desc' } },
      cart: { include: { product: true }, orderBy: { id: 'asc' } }, wishlist: { include: { product: true } },
    },
  }) : null;
  if (!u) notFound();
  const products = await db.product.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { sku: true, name: true, sizes: true, colors: true } });

  const live = u.orders.filter(o => o.status !== 'CANCELLED');
  const spent = live.reduce((n, o) => n + o.total, 0);
  const cartValue = u.cart.reduce((n, c) => n + c.product.price * c.qty, 0);
  const cartAge = u.cart.length ? Math.max(...u.cart.map(c => c.updatedAt.getTime())) : 0;

  return <>
    <div className="panel">
      <div className="panel-head">
        <h3><Link href="/admin/customers" aria-label="Back to customers"><i className="bx bx-left-arrow-alt" /></Link> {u.name}
          {u.role === 'ADMIN' && <span className="badge warn">Admin</span>}</h3>
        {String(u.id) !== me.id && (
          <ActBtn act={setRole.bind(null, u.id, u.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
            confirm={u.role === 'ADMIN' ? `Remove ${u.name}'s admin access?` : `Give ${u.name} full access to this dashboard?`}>
            {u.role === 'ADMIN' ? 'Remove admin access' : 'Make admin'}</ActBtn>)}
      </div>
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="t"><span>Lifetime value</span><i className="bx bx-rupee" /></div><b>{rs(spent)}</b><small>{live.length} order{live.length === 1 ? '' : 's'}</small></div>
        <div className="kpi"><div className="t"><span>Average order</span><i className="bx bx-receipt" /></div><b>{rs(live.length ? Math.round(spent / live.length) : 0)}</b><small>Excluding cancelled</small></div>
        <div className="kpi"><div className="t"><span>In their bag</span><i className="bx bx-shopping-bag" /></div><b>{rs(cartValue)}</b><small>{cartAge ? `Touched ${when(new Date(cartAge))}` : 'Empty'}</small></div>
        <div className="kpi"><div className="t"><span>Wishlist</span><i className="bx bx-heart" /></div><b>{u.wishlist.length}</b><small>Saved pieces</small></div>
      </div>
      <div className="two">
        <div><div className="mono" style={{ color: 'var(--ink-faint)', marginBottom: 5 }}>Contact</div>
          <a href={`mailto:${u.email}`} style={{ color: 'var(--gold)' }}>{u.email}</a><br />
          {u.phone ? <a href={`tel:${u.phone.replace(/[^\d+]/g, '')}`} style={{ color: 'var(--gold)' }}>{u.phone}</a> : <span className="muted">No phone</span>}</div>
        <div><div className="mono" style={{ color: 'var(--ink-faint)', marginBottom: 5 }}>Customer since</div>{day(u.createdAt)}</div>
      </div>
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Notes &amp; tags</h3><span className="muted">Only the shop team sees these</span></div>
      <AdminForm action={saveCustomerNotes.bind(null, u.id)}>
        <div className="field"><label htmlFor="c-tags">Tags <span className="muted">(comma separated, e.g. VIP, bridal, wholesale)</span></label>
          <input className="input" id="c-tags" name="tags" defaultValue={tagsOf(u.tags).join(', ')} /></div>
        <div className="field"><label htmlFor="c-note">Notes</label>
          <textarea className="input" id="c-note" name="note" defaultValue={u.note ?? ''} placeholder="Measurements, preferences, wedding date, how they like to be contacted…" /></div>
        <button className="btn btn-solid btn-sm">Save notes</button>
      </AdminForm>
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Orders ({u.orders.length})</h3></div>
      {u.orders.length ? u.orders.map(o => (
        <Link key={o.id} href={`/admin/orders/${o.id}`} className="mrow">
          <div><b style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, color: 'var(--gold)' }}>{o.id}</b>
            <small>{when(o.createdAt)} · {PAY_STATUS_LABEL[o.paymentStatus]}</small></div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span className={`badge ${statusTone(o.status)}`}>{STATUS_LABEL[o.status]}</span>
            <b style={{ fontFamily: 'var(--f-mono)' }}>{rs(o.total)}</b></div>
        </Link>
      )) : <p className="muted">No orders yet.</p>}
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Their bag</h3><span className="muted">Edit it with them on the phone — they check out as usual</span></div>
      {u.cart.map(c => (
        <div key={c.id} className="feed-item">
          <img className="mini-img" src={img(c.product.img)} alt="" />
          <div style={{ flex: 1 }}><b style={{ fontSize: 13.5, display: 'block' }}>{c.product.name}</b>
            <small style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{c.sku} · Size {c.size} · {c.color} · {rs(c.product.price)} each · {c.product.stock} in stock</small></div>
          <NumberAct value={c.qty} min={1} label={`Quantity of ${c.product.name}`} act={cartSetQty.bind(null, u.id, c.id)} />
          <ActBtn className="btn btn-ghost" title="Remove" act={cartRemove.bind(null, u.id, c.id)}><i className="bx bx-trash" /></ActBtn>
        </div>
      ))}
      {!u.cart.length && <p className="muted" style={{ marginBottom: 14 }}>Their bag is empty.</p>}
      <AdminForm action={cartAdd.bind(null, u.id)} className="tool-row" resetOnSuccess>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <select name="sku" className="input" style={{ flex: 2, minWidth: 180 }} aria-label="Product" defaultValue="">
            <option value="" disabled>Add a product…</option>
            {products.map(p => <option key={p.sku} value={p.sku}>{p.name} — {(p.sizes as string[]).join('/')} — {(p.colors as string[]).join(', ')}</option>)}
          </select>
          <input name="size" className="input" placeholder="Size" style={{ width: 80 }} aria-label="Size" />
          <input name="color" className="input" placeholder="Colour" style={{ width: 130 }} aria-label="Colour" />
          <input name="qty" className="input" type="number" min={1} defaultValue={1} style={{ width: 70 }} aria-label="Quantity" />
          <button className="btn btn-solid btn-sm">Add to bag</button>
        </div>
      </AdminForm>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="ov-grid">
      <div className="panel"><div className="panel-head"><h3>Addresses</h3></div>
        {u.addresses.length ? u.addresses.map(a => (
          <p key={a.id} style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 12 }}>
            <b style={{ color: 'var(--ink)' }}>{a.name}</b> · {a.phone}<br />{a.line}{a.landmark && `, near ${a.landmark}`}<br />{a.city}, {a.state} — {a.pin}</p>
        )) : <p className="muted">None saved.</p>}
      </div>
      <div className="panel"><div className="panel-head"><h3>Wishlist</h3></div>
        {u.wishlist.length ? u.wishlist.map(w => (
          <div key={w.sku} className="feed-item"><img className="mini-img" src={img(w.product.img)} alt="" />
            <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{w.product.name}</b><br />
              <small className="muted">{rs(w.product.price)} · {w.product.stock} in stock</small></div></div>
        )) : <p className="muted">Nothing saved.</p>}
      </div>
    </div>
  </>;
}
