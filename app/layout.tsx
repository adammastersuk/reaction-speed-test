import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reaction Speed Test',
  description: 'A polished browser-based reaction speed test built with Next.js.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
