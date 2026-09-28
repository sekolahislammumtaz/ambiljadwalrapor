import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jadwal Pengambilan Rapor - Sekolah Islam Mumtaz',
  description: 'Aplikasi Penjadwalan Pengambilan Rapor Online Sekolah Islam Mumtaz Bandar Lampung',
  icons: {
    icon: '/mumtaz.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        {children}
      </body>
    </html>
  );
}
