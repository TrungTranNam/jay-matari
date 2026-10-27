import Link from 'next/link';
import '../../styles/gallery.css';
import Gallery from './Gallery';

export const metadata = { title: 'The Atelier' };

export default function GalleryPage() {
  return (
    <div className="pg-gallery">
      <section className="page-hero"><div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link> / The Atelier</div>
        <h1 className="display-l">Inside the atelier</h1>
        <p className="lede" style={{ marginTop: 14 }}>Photographs from our workshop in Maninagar and from customer fittings. Every image here is a 4K original — click to open it full size.</p>
      </div></section>
      <section className="section tight wrap"><Gallery /></section>
    </div>
  );
}
