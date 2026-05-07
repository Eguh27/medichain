'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/blockchain', label: 'Blockchain' },
  { href: '/patients', label: 'Patients' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/payment', label: 'Payment' },
  { href: '/contracts', label: 'Contracts' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-8 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-lg font-bold text-cyan-400">
          MedChain
        </Link>
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-800 hover:text-cyan-300 ${isActive ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
