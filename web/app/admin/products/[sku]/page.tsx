import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { saveProduct } from '../../actions';
import ProductForm from './ProductForm';

export default async function EditProduct({ params }: { params: Promise<{ sku: string }> }) {
  await requireAdmin();
  const { sku } = await params;
  const isNew = sku === 'new';
  const p = isNew ? null : await db.product.findUnique({ where: { sku } });
  if (!isNew && !p) notFound();

  return (
    <div className="panel">
      <div className="panel-head"><h3><Link href="/admin/products" aria-label="Back to products"><i className="bx bx-left-arrow-alt" /></Link>
        {p ? p.name : 'Add a product'}</h3>
        {p && <Link className="btn btn-line btn-sm" href={`/product/${p.sku}`} target="_blank">View in shop</Link>}</div>
      <ProductForm save={saveProduct.bind(null, p?.sku ?? null)} p={p && {
        sku: p.sku, name: p.name, cat: p.cat, price: p.price, mrp: p.mrp, stock: p.stock, badge: p.badge ?? '', badgeTone: p.badgeTone ?? 'gold',
        fabric: p.fabric ?? '', work: p.work ?? '', care: p.care ?? '', desc: p.desc, active: p.active,
        sizes: (p.sizes as string[]).join(', '), colors: (p.colors as string[]).join(', '), gallery: p.gallery as string[],
      }} />
    </div>
  );
}
