import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kept — The Personal Household Care Layer for Alexa+',
  description:
    'Big AI knows the world. Kept knows your home. The private memory brain for Alexa+ that protects children’s allergies, nurtures their learning, and guards family spend.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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
