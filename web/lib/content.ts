import { db } from './db';

// Site copy the admin will edit (phase 4). Defaults are what the templates hard-coded;
// the seed writes them to SiteContent, and reads fall back to them if a row is missing.

export type HeroSlide = {
  img: string; alt: string; eyebrow: string; title: string; titleEm?: string; text: string;
  ctaHref: string; ctaText: string; altHref?: string; altText?: string;
};

export type Footer = {
  about: string; address: string; phone: string; email: string; hours: string;
  socials: { instagram: string; whatsapp: string; facebook: string; pinterest: string };
};

export const DEFAULTS = {
  hero_slides: [
    { img: 'g3-hd', alt: 'Hand-embroidered gown from the atelier',
      eyebrow: 'Atelier · Ahmedabad, est. 2016',
      title: 'Every thread', titleEm: 'placed by hand.',
      text: 'Kurta sets, gowns and bridal wear cut and embroidered in our own workshop in Maninagar. Small runs, real zari, and a fit we will adjust for you before it ships.',
      ctaHref: '/shop', ctaText: 'Shop the collection',
      altHref: '/gallery', altText: 'See the atelier' },
    { img: '27', alt: 'Anarkali gown with zari border',
      eyebrow: 'The gown room',
      title: 'Georgette that', titleEm: 'moves with you.',
      text: 'Floor-length Anarkalis with hand-stitched zari borders and a cotton lining that survives a full evening of dancing.',
      ctaHref: '/shop?cat=gown', ctaText: 'See the gowns',
      altHref: '/product/JMC-AG-002', altText: 'This season’s bestseller' },
    { img: 'g13', alt: 'Bridal lehenga detail',
      eyebrow: 'Bridal · by appointment',
      title: 'Six weeks,', titleEm: 'four fittings.',
      text: 'Bridal pieces are drawn with you, cut for your measurements, and finished by the same karigar from first stitch to last.',
      ctaHref: '/shop?cat=bridal', ctaText: 'Bridal collection',
      altHref: '/contact', altText: 'Book a fitting' },
    { img: 'g11', alt: 'Handloom co-ord set',
      eyebrow: 'Everyday pieces',
      title: 'Handloom cotton', titleEm: 'you can wash at home.',
      text: 'Co-ord sets in slubby cotton silk with real mirror buttons and pockets deep enough to be useful.',
      ctaHref: '/shop?cat=set', ctaText: 'Co-ord sets',
      altHref: '/about', altText: 'Our story' },
  ] as HeroSlide[],
  strip: ['Free delivery over ₹2,999', '7-day easy exchange', 'Real zari & abhla work',
    'Made in Maninagar, Ahmedabad', 'Sizes S to XXL', 'Cash on delivery available'],
  footer: {
    about: 'A small Ahmedabad atelier making hand-embroidered kurtas, gowns and co-ord sets. Every piece is cut, stitched and finished by our own karigars.',
    address: 'Maninagar, Ahmedabad, Gujarat 380008',
    phone: '+91 98250 00000',
    email: 'care@jaymataji.com',
    hours: 'Mon–Sat, 10am–8pm IST',
    socials: { instagram: '#', whatsapp: '#', facebook: '#', pinterest: '#' },
  } as Footer,
  // upiId stays empty until the owner enters their real VPA: an empty id hides the UPI option
  payment: { upiId: '', payee: 'Jay Mataji Creation', codFee: 40, codMax: 20000 } as PaymentSettings,
};

export type PaymentSettings = { upiId: string; payee: string; codFee: number; codMax: number };

type Key = keyof typeof DEFAULTS;

export async function getContent<K extends Key>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const row = await db.siteContent.findUnique({ where: { key } });
  return (row?.value as (typeof DEFAULTS)[K]) ?? DEFAULTS[key];
}
