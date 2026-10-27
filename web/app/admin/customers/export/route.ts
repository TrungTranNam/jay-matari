import { requireAdmin } from '@/auth';
import { customerRows } from '@/lib/customers';

// Quote every cell, and defuse values Excel would run as a formula (=, +, -, @).
const cell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  await requireAdmin();
  const p = new URL(req.url).searchParams;
  const rows = await customerRows(p.get('q') ?? '', p.get('tag') ?? '');
  const lines = [
    ['Name', 'Email', 'Phone', 'Orders', 'Spent (INR)', 'Last order', 'Joined', 'Tags', 'Note'],
    ...rows.map(u => [u.name, u.email, u.phone, u.orders, u.spent, u.lastOrder?.toISOString().slice(0, 10) ?? '',
      u.createdAt.toISOString().slice(0, 10), u.tags.join(', '), u.note ?? '']),
  ].map(r => r.map(cell).join(','));
  return new Response('﻿' + lines.join('\r\n'), { // BOM so Excel reads ₹ and Gujarati names as UTF-8
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
