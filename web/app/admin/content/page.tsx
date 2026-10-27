import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/auth';
import { getContent } from '@/lib/content';
import { saveFooter, saveStrip } from '../actions';
import { AdminForm } from '../ui';
import SlidesEditor from './SlidesEditor';

export const metadata = { title: 'Site content · Admin' };

export default async function Content() {
  await requireAdmin();
  const [slides, strip, f, files] = await Promise.all([
    getContent('hero_slides'), getContent('strip'), getContent('footer'),
    readdir(path.join(process.cwd(), 'public/img')),
  ]);
  const photos = [...new Set(files.filter(n => n.endsWith('-960.jpg')).map(n => n.replace(/-960\.jpg$/, '')))].sort();
  const text = (name: string, label: string, value: string, type = 'text') => (
    <div className="field"><label htmlFor={`ft-${name}`}>{label}</label><input className="input" id={`ft-${name}`} name={name} type={type} defaultValue={value} /></div>
  );

  return <>
    <div className="panel">
      <div className="panel-head"><h3>Home page slides</h3><span className="muted">The big carousel at the top of the home page</span></div>
      <SlidesEditor initial={slides} photos={photos} />
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Scrolling strip</h3><span className="muted">One line per message</span></div>
      <AdminForm action={saveStrip}>
        <div className="field"><textarea className="input" name="lines" aria-label="Strip lines" defaultValue={strip.join('\n')} /></div>
        <button className="btn btn-solid btn-sm">Save strip</button>
      </AdminForm>
    </div>

    <div className="panel">
      <div className="panel-head"><h3>Contact details</h3><span className="muted">Footer on every page, contact page and order emails</span></div>
      <AdminForm action={saveFooter}>
        <div className="field"><label htmlFor="ft-about">About the shop</label><textarea className="input" id="ft-about" name="about" defaultValue={f.about} /></div>
        {text('address', 'Address', f.address)}
        <div className="two">{text('phone', 'Phone & WhatsApp', f.phone)}{text('email', 'Email', f.email, 'email')}</div>
        {text('hours', 'Opening hours', f.hours)}
        <div className="two">{text('instagram', 'Instagram link', f.socials.instagram === '#' ? '' : f.socials.instagram, 'url')}
          {text('whatsapp', 'WhatsApp link (https://wa.me/91…)', f.socials.whatsapp === '#' ? '' : f.socials.whatsapp, 'url')}</div>
        <div className="two">{text('facebook', 'Facebook link', f.socials.facebook === '#' ? '' : f.socials.facebook, 'url')}
          {text('pinterest', 'Pinterest link', f.socials.pinterest === '#' ? '' : f.socials.pinterest, 'url')}</div>
        <button className="btn btn-solid btn-sm">Save contact details</button>
      </AdminForm>
    </div>
  </>;
}
