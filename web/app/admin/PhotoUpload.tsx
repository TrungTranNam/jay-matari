'use client';

import { useRef, useTransition } from 'react';
import { toast } from '@/components/Toaster';
import { uploadPhoto } from './actions';

// Uploads straight away (one request per file) and hands back the photo id for the form to keep.
export default function PhotoUpload({ onUploaded, label = 'Upload photos', multiple = true }: {
  onUploaded: (id: string) => void; label?: string; multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} hidden
        onChange={e => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          start(async () => {
            for (const file of files) {
              const f = new FormData();
              f.set('photo', file);
              const r = await uploadPhoto(f);
              if (r.ok && r.id) onUploaded(r.id); else toast(r.msg, 'bad');
            }
          });
        }} />
      <button type="button" className="btn btn-line btn-sm" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? <><span className="spinner" /> Uploading</> : <><i className="bx bx-upload" /> {label}</>}</button>
    </>
  );
}
