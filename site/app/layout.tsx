import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = 'https://tidyroll-legal.vercel.app';
const TITLE = 'Tidy Roll — Swipe your camera roll clean';
const DESCRIPTION =
  'A Tinder-style swipe deck for cleaning up your photos. Right to keep, left to toss — fast, fun, and 100% on your device. Browser extension + Android/iOS app.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: '/assets/logo.svg',
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Tidy Roll',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <div aria-hidden className="bg-glow pointer-events-none fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
