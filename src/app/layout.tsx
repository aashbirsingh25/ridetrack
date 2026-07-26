import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'RideTrack - Realtime Delivery Tracking',
  description: 'Live delivery order placement and real-time rider tracking powered by Socket.io and Redis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RideTrack Microservices Demo. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
