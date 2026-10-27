import type { Metadata } from 'next';
import './styles/style.css';
import './styles/luxe.css';
import FX from '@/components/FX';
import Intro from '@/components/Intro';
import Toaster from '@/components/Toaster';

export const metadata: Metadata = {
  title: { default: 'Jay Mataji Creation — Hand-embroidered ethnic wear from Ahmedabad', template: '%s · Jay Mataji Creation' },
  description: 'Hand-embroidered kurta sets, gowns and bridal wear made in our Ahmedabad atelier. Free delivery over ₹2,999.',
};

// set the theme before first paint so dark mode never flashes light
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('jmc_theme')||'light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Intro />
        <FX />
        <Toaster />
      </body>
    </html>
  );
}
