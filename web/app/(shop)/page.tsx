import Link from 'next/link';
import '../styles/home.css';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterForm from '@/components/NewsletterForm';
import ProductCard from '@/components/ProductCard';
import Rail from '@/components/Rail';
import { getWish } from '@/lib/bag';
import { getContent } from '@/lib/content';
import { db } from '@/lib/db';
import { img, srcSet } from '@/lib/format';


const CATS = [
  ['kurta', '3', 'Kurta sets', 'Everyday to festive'],
  ['gown', '27', 'Gowns', 'Anarkali & floor-length'],
  ['set', 'g11', 'Co-ord sets', 'Matched top & bottom'],
  ['bridal', 'g15', 'Bridal', 'Made to your measure'],
];

const STEPS = [
  ['Week 01', 'Fabric & cut', 'We buy in short lengths from mills in Surat and Bhuj, wash-test every roll for colour bleed, then cut to your size chart.'],
  ['Week 02', 'Frame & embroider', 'Panels go onto the aari frame. Zari, dabka and mirror work are done here — by hand, one motif at a time.'],
  ['Week 03', 'Stitch & line', 'Embroidered panels are joined, lined in soft cotton, and every edge is rolled rather than overlocked.'],
  ['Week 04', 'Finish & check', "Pressed, measured against the original spec, photographed, and packed in a cotton bag with the karigar's name inside."],
];

const QUOTES = [
  ['★★★★★', "Ordered the zari kurta set for my sister's engagement. The zari is actual metal thread, not the plastic kind — you can tell the moment you hold it. They also let out the sleeve by an inch without charging me.", 'RP', 'Riddhi Patel', 'Ahmedabad'],
  ['★★★★★', 'I was nervous ordering a bridal gown online. They called me twice, sent a swatch, and the second fitting photo matched exactly what arrived. Delivered nine days before the date.', 'SM', 'Sneha Mehta', 'Surat'],
  ['★★★★☆', "The cotton kurtas have survived a full summer of daily wear and the embroidery hasn't pulled once. Sizing runs a little generous, so I went one down on my second order.", 'AJ', 'Anjali Joshi', 'Vadodara'],
];

export default async function Home() {
  const [slides, strip, featured, wish] = await Promise.all([
    getContent('hero_slides'),
    getContent('strip'),
    db.product.findMany({ where: { active: true }, orderBy: { rating: 'desc' }, take: 8 }),
    getWish(),
  ]);

  return <div className="pg-home">
    <HeroCarousel slides={slides} />

    <div className="strip">
      <div className="strip-track">
        {[...strip, ...strip].map((t, i) => <span key={i}><i className="bx bx-diamond" />{t}</span>)}
      </div>
    </div>

    <section className="section wrap">
      <div className="section-head">
        <div className="eyebrow">What we make</div>
        <h2 className="display-l">Four things, done properly</h2>
      </div>
      <div className="cat-grid">
        {CATS.map(([cat, pic, title, sub]) => (
          <Link key={cat} href={`/shop?cat=${cat}`} className="cat reveal">
            <img src={img(pic)} srcSet={srcSet(pic)} sizes="(max-width:1000px) 50vw, 25vw" alt={title} loading="lazy" />
            <div className="cat-label"><b>{title}</b><small>{sub} <i className="bx bx-right-arrow-alt" /></small></div>
          </Link>
        ))}
      </div>
    </section>

    <section className="section tight wrap">
      <div className="section-head">
        <div className="eyebrow">Most ordered this season</div>
        <h2 className="display-l">Pieces people come back for</h2>
      </div>
      <Rail>{featured.map(p => <ProductCard key={p.sku} p={p} wished={wish.includes(p.sku)} />)}</Rail>
      <div className="center" style={{ marginTop: 46 }}>
        <Link href="/shop" className="btn btn-line">View the whole collection</Link>
      </div>
    </section>

    <section className="section tight wrap">
      <div className="stat-strip reveal">
        <div className="stat-cell"><b data-count="9">0</b><span>Years stitching</span></div>
        <div className="stat-cell"><b data-count="14">0</b><span>Karigars on the floor</span></div>
        <div className="stat-cell"><b data-count="6200" data-suffix="+">0</b><span>Pieces delivered</span></div>
        <div className="stat-cell"><b data-count="7" data-suffix=" days">0</b><span>Exchange window</span></div>
      </div>
    </section>

    <section className="section process">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">How a piece is made</div>
          <h2 className="display-l">Four weeks, four hands</h2>
          <p className="lede">These steps run in order. Nothing moves forward until the previous stage is signed off by the karigar who did it.</p>
        </div>
        <div className="steps">
          {STEPS.map(([n, h, p]) => <div key={n} className="step reveal"><span className="n">{n}</span><h4>{h}</h4><p>{p}</p></div>)}
        </div>
      </div>
    </section>

    <section className="section wrap">
      <div className="split reveal">
        <div className="split-img">
          <img src={img('g4', 1920)} srcSet={srcSet('g4')} sizes="(max-width:1000px) 100vw, 52vw" alt="Bridal zardozi work in progress" loading="lazy" />
        </div>
        <div className="split-copy">
          <div className="eyebrow">Bridal, made to measure</div>
          <h2 className="display-m">Book a fitting before you buy</h2>
          <p className="lede">Bridal orders start with a call. We take fourteen measurements, agree the work, and send a fabric swatch before a single stitch goes in. You approve two fittings — one at the base stage, one after embroidery.</p>
          <div className="stat-row">
            <div className="stat"><b>200+</b><span>Hours per gown</span></div>
            <div className="stat"><b>14</b><span>Measurements taken</span></div>
            <div className="stat"><b>2</b><span>Fittings included</span></div>
          </div>
          <Link href="/contact" className="btn btn-solid">Book a bridal consultation</Link>
        </div>
      </div>
    </section>

    <section className="section tight wrap">
      <div className="section-head center">
        <div className="eyebrow center">In their words</div>
        <h2 className="display-l">What customers tell us</h2>
      </div>
      <div className="quote-grid">
        {QUOTES.map(([stars, text, av, name, city]) => (
          <div key={av} className="quote reveal"><span className="stars">{stars}</span>
            <p>{text}</p>
            <div className="quote-by"><div className="quote-av">{av}</div><div><b>{name}</b><small>{city} · verified order</small></div></div>
          </div>
        ))}
      </div>
    </section>

    <section className="section tight wrap">
      <div className="news reveal">
        <div className="eyebrow center">Once a month, no more</div>
        <h2 className="display-m">New pieces, before they go live</h2>
        <p>We release a small batch on the first Saturday of every month. Subscribers see it a day early, which matters when there are only forty of something.</p>
        <NewsletterForm />
      </div>
    </section>
  </div>;
}
