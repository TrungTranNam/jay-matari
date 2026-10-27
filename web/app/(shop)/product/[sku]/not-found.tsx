import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <section className="section tight wrap">
      <div className="empty-state"><i className="bx bx-package" />
        <h4>We can&apos;t find that piece</h4><p>It may have been renamed or retired.</p>
        <Link href="/shop" className="btn btn-solid">Back to the collection</Link></div>
    </section>
  );
}
