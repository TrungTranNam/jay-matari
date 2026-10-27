import { randomBytes } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Admin uploads live outside public/ (Next only serves public/ files that existed at build time)
// and are served by app/uploads/[file]/route.ts. Back this folder up with the database.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
export const UPLOAD_NAME = /^u-[a-z0-9]+-(960|1920|4k)\.jpg$/;

const SIZES = [[960, '960'], [1920, '1920'], [3840, '4k']] as const;
const MAX_BYTES = 20 * 1024 * 1024;

// Re-encodes every upload (strips EXIF/GPS, rejects anything that isn't really an image) and
// writes the same three widths the catalogue photos use, so img()/srcSet() work unchanged.
export async function saveUpload(file: File) {
  if (!file.size) throw new Error('Pick a photo to upload.');
  if (file.size > MAX_BYTES) throw new Error('Photos must be under 20 MB.');
  const id = `u-${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  try {
    const src = sharp(Buffer.from(await file.arrayBuffer()), { failOn: 'error' }).rotate();
    for (const [width, suffix] of SIZES)
      await src.clone().resize({ width, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(UPLOAD_DIR, `${id}-${suffix}.jpg`));
  } catch {
    await Promise.all(SIZES.map(([, suffix]) => rm(path.join(UPLOAD_DIR, `${id}-${suffix}.jpg`), { force: true })));
    throw new Error(`${file.name} is not a photo we can read (use JPG, PNG or WebP).`);
  }
  return id;
}
