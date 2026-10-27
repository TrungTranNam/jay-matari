import type { Prisma } from '@prisma/client';
import { db } from './db';

export const tagsOf = (t: Prisma.JsonValue) => (Array.isArray(t) ? (t as string[]) : []);

// Customers with lifetime value (non-cancelled orders), shared by the CRM table and its CSV export.
export async function customerRows(q = '', tag = '') {
  const users = await db.user.findMany({
    where: {
      ...(q && { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }),
      NOT: { email: { endsWith: '@deleted.invalid' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const stats = await db.order.groupBy({
    by: ['userId'], where: { status: { not: 'CANCELLED' }, userId: { in: users.map(u => u.id) } },
    _sum: { total: true }, _count: true, _max: { createdAt: true },
  });
  return users
    .map(u => {
      const s = stats.find(x => x.userId === u.id);
      return { ...u, tags: tagsOf(u.tags), orders: s?._count ?? 0, spent: s?._sum.total ?? 0, lastOrder: s?._max.createdAt ?? null };
    })
    // ponytail: tags are a JSON column, so the tag filter runs here; give tags their own table if the list grows large
    .filter(u => !tag || u.tags.includes(tag));
}
