import Link from 'next/link';
import '../../styles/about.css';
import { img, srcSet } from '@/lib/format';

export const metadata = { title: 'Our story' };

const TEAM = [
  ['g6', 'Bhavna Ben at the cutting table', 'Bhavna Ben Prajapati', 'Founder & head cutter', 'Twenty-three years at a machine. Cuts every bridal base herself and refuses to let anything ship that she has not checked.'],
  ['g8', 'Kailash Ben at the aari frame', 'Kailash Ben Solanki', 'Head karigar, embroidery', 'Runs the aari frames. Trained four of our six embroiderers, and has done zardozi since she was fifteen.'],
  ['g12', 'Jignesh in the fabric library', 'Jignesh Prajapati', 'Fabric & orders', 'Buys in Surat and Bhuj, wash-tests every roll, and is the voice on the phone when you call about an order.'],
];

export default function About() {
  return (
    <div className="pg-about">
      <section className="story-hero">
        <img src={img('g11', 1920)} srcSet={srcSet('g11')} sizes="100vw" alt="The Jay Mataji Creation workshop" />
        <div className="wrap"><div className="eyebrow">Since 2016</div><h1 className="display-l">Our story</h1></div>
      </section>

      <section className="section wrap">
        <div className="prose">
          <p className="lead">Jay Mataji Creation started with one sewing machine, a rented room in Maninagar, and an order for eleven kurtas that had to be ready by Navratri.</p>
          <p>Bhavna Ben had been stitching for a wholesaler for nine years. She knew the work was good and she knew she was being paid for a fraction of it. In 2016 she took the order directly, borrowed against her gold, and delivered all eleven pieces two days early. That customer&apos;s sister ordered next, and that is more or less how the business grew for the first three years.</p>
          <p>Today there are fourteen of us. Six karigars on embroidery, four on stitching, two on finishing, one on packing, and Bhavna Ben, who still checks every bridal piece before it leaves. We work out of two floors in the same neighbourhood we started in.</p>
          <div className="pull">“If a customer can&apos;t tell the difference between real zari and the plastic kind, that is not a reason to use the plastic kind.”</div>
          <p>We buy fabric in short lengths, which costs more but means we are not stuck making four hundred of anything. Most pieces run to forty units or fewer. Bridal is made one at a time, to measurement, with two fittings before it ships.</p>
          <p>We are not trying to be the cheapest. Our cotton kurtas start at ₹1,000 and a bridal gown runs to ₹4,500, and both are priced on what the work actually costs. What we do promise is that if the fit is wrong, we will fix it — length, sleeve, waist — at no charge, before or after delivery.</p>
        </div>
      </section>

      <section className="section tight wrap">
        <div className="figures">
          <div className="fig"><b>2016</b><span>Year we started</span></div>
          <div className="fig"><b>14</b><span>People in the workshop</span></div>
          <div className="fig"><b>6,800+</b><span>Pieces delivered</span></div>
          <div className="fig"><b>40</b><span>Units per run, maximum</span></div>
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head"><div className="eyebrow">The people who make it</div>
          <h2 className="display-l">Who is behind the work</h2></div>
        <div className="team">
          {TEAM.map(([pic, alt, name, role, bio]) => (
            <div key={name} className="tm reveal"><div className="tm-img">
              <img src={img(pic)} alt={alt} loading="lazy" /></div>
              <div className="tm-body"><b>{name}</b><div className="role">{role}</div><p>{bio}</p></div></div>
          ))}
        </div>
      </section>

      <section className="section tight wrap">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '56px 40px', textAlign: 'center' }}>
          <div className="eyebrow center">Come and see</div>
          <h2 className="display-m" style={{ margin: '18px 0 14px' }}>Visit the workshop</h2>
          <p className="lede" style={{ margin: '0 auto 28px' }}>We are open Monday to Saturday, 10am to 8pm. Call before you come and we will keep the pieces you want to see ready on the rail.</p>
          <Link href="/contact" className="btn btn-solid">Get in touch</Link>
        </div>
      </section>
    </div>
  );
}
