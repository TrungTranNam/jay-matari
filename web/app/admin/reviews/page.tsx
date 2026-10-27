import Link from 'next/link';
import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { when } from '@/lib/format';
import { deleteReview, setReviewApproved } from '../actions';
import { ActBtn } from '../ui';

export const metadata = { title: 'Reviews · Admin' };

export default async function Reviews({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const show = (await searchParams).show === 'live' ? 'live' : 'pending';
  const [rows, pending] = await Promise.all([
    db.review.findMany({
      where: { approved: show === 'live' }, orderBy: { createdAt: 'desc' }, take: 200,
      include: { user: { select: { name: true, id: true } }, product: { select: { name: true, sku: true } } },
    }),
    db.review.count({ where: { approved: false } }),
  ]);
  return (
    <div className="panel">
      <div className="panel-head"><h3>Reviews</h3></div>
      <div className="ftabs">
        <Link href="/admin/reviews" className={show === 'pending' ? 'on' : undefined}>Waiting ({pending})</Link>
        <Link href="/admin/reviews?show=live" className={show === 'live' ? 'on' : undefined}>Live</Link>
      </div>
      {rows.length ? rows.map(r => (
        <div key={r.id} className={`msg-card ${r.approved ? '' : 'unread'}`}>
          <div className="msg-top">
            <Link href={`/admin/customers/${r.user.id}`}><b>{r.user.name}</b></Link>
            <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <Link href={`/product/${r.product.sku}`} target="_blank" className="badge">{r.product.name}</Link>
            <small>{when(r.createdAt)}</small></div>
          <p style={{ whiteSpace: 'pre-line' }}>{r.text}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            {r.approved
              ? <ActBtn act={setReviewApproved.bind(null, r.id, false)}>Hide</ActBtn>
              : <ActBtn className="btn btn-solid btn-sm" act={setReviewApproved.bind(null, r.id, true)}>Publish</ActBtn>}
            <ActBtn className="btn btn-ghost" act={deleteReview.bind(null, r.id)} confirm="Delete this review for good?">Delete</ActBtn>
          </div>
        </div>
      )) : <div className="empty-state"><i className="bx bx-star" />
        <h4>{show === 'pending' ? 'Nothing waiting' : 'No live reviews yet'}</h4>
        <p>{show === 'pending' ? 'New reviews from product pages wait here until you publish them.' : 'Published reviews show here.'}</p></div>}
    </div>
  );
}
