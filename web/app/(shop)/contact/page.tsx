import Link from 'next/link';
import '../../styles/contact.css';
import { userId } from '@/lib/bag';
import { getContent } from '@/lib/content';
import { db } from '@/lib/db';
import { img } from '@/lib/format';
import { ContactForm, Faq } from './ContactParts';

export const metadata = { title: 'Contact' };

const FAQ: [string, string][] = [
  ['How long does a bridal order take?', 'Three to four weeks from the day we take measurements, and we will not accept an order we cannot finish in time. If your date is closer than that, call us — sometimes we can move things around, and we will tell you honestly if we cannot.'],
  ['What if the size is wrong?', 'Send us a photo and your measurements. We adjust length, sleeve and waist free of charge and pay the return pickup once per order. If the piece is unworn and untagged you can also exchange it outright within 7 days.'],
  ['Is the zari real?', 'On anything labelled zari or zardozi, yes — metal thread, not metallic plastic. It is why those pieces cost more and why they must be dry cleaned rather than washed.'],
  ['Do you ship outside India?', 'Not through the website yet. Message us with your city and we will quote a courier rate. Several customers in the UK and UAE order this way.'],
  ['Can I buy wholesale?', 'Yes, from twenty pieces upward on non-bridal styles. Pick the topic “Wholesale enquiry” above and tell us quantity and delivery date.'],
];

export default async function Contact() {
  const uid = await userId();
  const [u, f] = await Promise.all([
    uid ? db.user.findUnique({ where: { id: uid }, select: { name: true, email: true, phone: true } }) : null,
    getContent('footer'),
  ]);
  const tel = f.phone.replace(/[^\d+]/g, '');

  return (
    <div className="pg-contact">
      <section className="page-hero"><div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link> / Contact</div>
        <h1 className="display-l">Talk to us</h1>
        <p className="lede" style={{ marginTop: 14 }}>A real person answers, usually within a few hours during shop hours.</p>
      </div></section>

      <section className="section tight wrap">
        <div className="c-grid">
          <div className="panel">
            <h3>Send us a message</h3>
            <p className="sub">Bridal enquiry, sizing question, or an order that needs chasing — all of it comes to the same inbox.</p>
            <ContactForm name={u?.name ?? ''} email={u?.email ?? ''} phone={u?.phone ?? ''} />
          </div>

          <div>
            <div className="panel" style={{ marginBottom: 24 }}>
              <h3>Reach us directly</h3><p className="sub">{f.hours}</p>
              <div className="ci"><div className="ci-ic"><i className="bx bx-map" /></div>
                <div><b>The workshop</b><p>2nd floor, Shreeji Complex,<br />Bhairavnath Road, Maninagar,<br />Ahmedabad, Gujarat 380008</p></div></div>
              <div className="ci"><div className="ci-ic"><i className="bx bx-phone" /></div>
                <div><b>Phone &amp; WhatsApp</b><a href={`tel:${tel}`}>{f.phone}</a></div></div>
              <div className="ci"><div className="ci-ic"><i className="bx bx-envelope" /></div>
                <div><b>Email</b><a href={`mailto:${f.email}`}>{f.email}</a></div></div>
              <div className="ci"><div className="ci-ic"><i className="bx bx-time-five" /></div>
                <div><b>Bridal fittings</b><p>By appointment, including Sundays.<br />Call at least two days ahead.</p></div></div>
            </div>
            <div className="map">
              <img src={img('contact1', 1920)} alt="Maninagar, Ahmedabad" loading="lazy" />
              <div className="map-pin"><div><i className="bx bx-map-pin" />
                <b>Maninagar, Ahmedabad</b><small>10 min from Kankaria Lake</small></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight wrap">
        <div className="section-head"><div className="eyebrow">Before you write in</div>
          <h2 className="display-m">Questions we get most</h2></div>
        <div style={{ maxWidth: 820 }}>{FAQ.map(([q, a]) => <Faq key={q} q={q} a={a} />)}</div>
      </section>
    </div>
  );
}
