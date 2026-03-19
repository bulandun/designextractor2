import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design Extractor MVP',
  description: 'Minimal UI and API wrapper for buildSchema()',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
