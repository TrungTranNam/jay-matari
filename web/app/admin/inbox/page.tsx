import { requireAdmin } from '@/auth';
import { db } from '@/lib/db';
import { when } from '@/lib/format';
import { deleteMessage, markRead } from '../actions';
import { ActBtn } from '../ui';

export const metadata = { title: 'Inbox · Admin' };

export default async function Inbox() {
  await requireAdmin();
  const list = await db.message.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  const unread = list.filter(m => !m.read).length;
  return (
    <div className="panel">
      <div className="panel-head"><h3>Inbox ({list.length})</h3>
        {unread > 0 && <ActBtn act={markRead.bind(null, 'all')}>Mark all as read</ActBtn>}</div>
      {list.length ? list.map(m => (
        <div key={m.id} className={`msg-card ${m.read ? '' : 'unread'}`}>
          <div className="msg-top"><b>{m.name}</b>
            <span className="badge info">{m.subject}</span>
            <small>{when(m.createdAt)}</small></div>
          <p style={{ whiteSpace: 'pre-line' }}>{m.body}</p>
          <div style={{ marginTop: 13, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-soft)', alignItems: 'center' }}>
            <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`} style={{ color: 'var(--gold)' }}><i className="bx bx-envelope" /> {m.email}</a>
            {m.phone && <a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`} style={{ color: 'var(--gold)' }}><i className="bx bx-phone" /> {m.phone}</a>}
            {!m.read && <ActBtn className="btn btn-ghost" act={markRead.bind(null, m.id)}>Mark as read</ActBtn>}
            <ActBtn className="btn btn-ghost" act={deleteMessage.bind(null, m.id)} confirm="Delete this message?">Delete</ActBtn>
          </div>
        </div>
      )) : <div className="empty-state"><i className="bx bx-envelope" /><h4>Inbox is empty</h4><p>Messages from the contact form and newsletter sign-ups land here.</p></div>}
    </div>
  );
}
