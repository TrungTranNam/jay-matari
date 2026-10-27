import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR, UPLOAD_NAME } from '@/lib/images';

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!UPLOAD_NAME.test(file)) return new Response('Not found', { status: 404 }); // also blocks ../ tricks
  try {
    const body = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
