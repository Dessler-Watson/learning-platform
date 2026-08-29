import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduPlay',
  description: 'Plataforma educativa interactiva',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
