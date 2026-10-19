import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kept • Alexa+ Commerce Guard',
  description:
    'Zero-Regret Orders. Zero-Friction Returns. Unified household memory preventing incompatible purchases and automating single-trip returns.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-obsidian-900 text-slate-100 antialiased selection:bg-accent-cyan/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
