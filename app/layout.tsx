import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Reaction Speed Test',
  description: 'Measure your reaction speed with a clean interface built with Next.js.',
};

const themeInitScript = `
(function() {
  const key = 'rst-theme';
  const saved = localStorage.getItem(key);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved === 'dark' || saved === 'light' ? saved : (systemDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
