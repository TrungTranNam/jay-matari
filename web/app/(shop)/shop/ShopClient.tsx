'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import type { Product } from '@prisma/client';
import ProductCard from '@/components/ProductCard';
import { rs } from '@/lib/format';

// ponytail: filters run in the browser over the whole catalogue (16 pieces);
// move them into the Prisma query once the catalogue reaches a few hundred.

const CATS = { all: 'The Collection', kurta: 'Kurta Sets', gown: 'Gowns', set: 'Co-ord Sets', bridal: 'Bridal' };
type Cat = keyof typeof CATS;
const CAT_LABEL: Record<Cat, string> = { all: 'All pieces', kurta: 'Kurta sets', gown: 'Gowns', set: 'Co-ord sets', bridal: 'Bridal' };
const MAX = 5000;

const SORTS = {
  feat: (a: Product, b: Product) => b.reviewCount - a.reviewCount,
  low: (a: Product, b: Product) => a.price - b.price,
  high: (a: Product, b: Product) => b.price - a.price,
  rate: (a: Product, b: Product) => b.rating - a.rating,
  new: (a: Product, b: Product) => Number(b.badge === 'New') - Number(a.badge === 'New'),
};

export default function ShopClient({ products, wish, initialCat }: { products: Product[]; wish: string[]; initialCat?: string }) {
  const [cat, setCat] = useState<Cat>(initialCat && initialCat in CATS ? (initialCat as Cat) : 'all');
  const [max, setMax] = useState(MAX);
  const [sizes, setSizes] = useState<string[]>([]);
  const [instock, setInstock] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<keyof typeof SORTS>('feat');
  const [showFilters, setShowFilters] = useState(false);
  const query = useDeferredValue(q.trim().toLowerCase());

  const allSizes = useMemo(() => [...new Set(products.flatMap(p => p.sizes as string[]))], [products]);
  const list = products.filter(p =>
    (cat === 'all' || p.cat === cat) &&
    p.price <= max &&
    (!sizes.length || (p.sizes as string[]).some(s => sizes.includes(s))) &&
    (!instock || p.stock > 0) &&
    (!query || `${p.name} ${p.sku} ${p.fabric} ${p.desc}`.toLowerCase().includes(query))
  ).sort(SORTS[sort]);

  const reset = () => { setCat('all'); setMax(MAX); setSizes([]); setInstock(false); setQ(''); setSort('feat'); };
  const chips: [string, () => void][] = [
    ...(cat !== 'all' ? [[CATS[cat], () => setCat('all')] as [string, () => void]] : []),
    ...(max < MAX ? [[`Under ${rs(max)}`, () => setMax(MAX)] as [string, () => void]] : []),
    ...sizes.map(s => [`Size ${s}`, () => setSizes(sizes.filter(x => x !== s))] as [string, () => void]),
    ...(instock ? [['In stock', () => setInstock(false)] as [string, () => void]] : []),
    ...(q.trim() ? [[`“${q.trim()}”`, () => setQ('')] as [string, () => void]] : []),
  ];

  return <>
    <section className="page-hero">
      <div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link> / Collection</div>
        <h1 className="display-l">{CATS[cat]}</h1>
        <p className="lede" style={{ marginTop: 14 }}>Sixteen pieces, each made in a run of forty or fewer. Stock counts below are live.</p>
      </div>
    </section>

    <section className="section tight wrap">
      <div className="shop-layout">
        <aside className={`filters ${showFilters ? 'show' : ''}`}>
          <div className="f-block">
            <h5>Category</h5>
            {(Object.keys(CAT_LABEL) as Cat[]).map(c => (
              <label key={c} className="f-opt">
                <input type="radio" name="cat" checked={cat === c} onChange={() => setCat(c)} /> {CAT_LABEL[c]}
                <span className="n">{c === 'all' ? products.length : products.filter(p => p.cat === c).length}</span>
              </label>
            ))}
          </div>
          <div className="f-block">
            <h5>Maximum price</h5>
            <div className="range-out">Up to {rs(max)}</div>
            <input type="range" min={1000} max={MAX} step={100} value={max} onChange={e => setMax(+e.target.value)} aria-label="Maximum price" />
          </div>
          <div className="f-block">
            <h5>Size</h5>
            {allSizes.map(s => (
              <label key={s} className="f-opt">
                <input type="checkbox" checked={sizes.includes(s)}
                       onChange={e => setSizes(e.target.checked ? [...sizes, s] : sizes.filter(x => x !== s))} /> Size {s}
              </label>
            ))}
          </div>
          <div className="f-block">
            <h5>Availability</h5>
            <label className="f-opt"><input type="checkbox" checked={instock} onChange={e => setInstock(e.target.checked)} /> In stock only</label>
          </div>
          <button className="btn btn-line btn-sm btn-block" onClick={reset} style={{ marginTop: 18 }}>Clear all filters</button>
        </aside>

        <div>
          <div className="shop-bar">
            <button className="btn btn-line btn-sm filter-toggle" onClick={() => setShowFilters(!showFilters)}><i className="bx bx-slider-alt" /> Filters</button>
            <div className="search-box"><i className="bx bx-search" />
              <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, fabric or SKU" aria-label="Search the collection" /></div>
            <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value as keyof typeof SORTS)} aria-label="Sort products">
              <option value="feat">Sort: Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="rate">Highest rated</option>
              <option value="new">Newest first</option>
            </select>
          </div>
          <div className="chips">
            {chips.map(([label, clear]) => <button key={label} className="chip" onClick={clear}>{label} <i className="bx bx-x" /></button>)}
          </div>
          <div className="result-line" style={{ marginBottom: 20 }}>{list.length} piece{list.length === 1 ? '' : 's'}</div>
          {list.length ? (
            <div className="grid grid-4">
              {list.map(p => <ProductCard key={p.sku} p={p} wished={wish.includes(p.sku)} />)}
            </div>
          ) : (
            <div className="empty-state">
              <i className="bx bx-search-alt" /><h4>Nothing matches those filters</h4>
              <p>Try widening the price range or clearing the search.</p>
              <button className="btn btn-solid" onClick={reset}>Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </section>
  </>;
}
