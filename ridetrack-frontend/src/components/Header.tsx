import Link from 'next/link';
import { Navigation, Bike, UserCheck } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              RideTrack
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-sky-400">
              Live Logistics
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Customer View</span>
          </Link>

          <Link
            href="/rider"
            className="text-xs font-medium px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Rider Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
