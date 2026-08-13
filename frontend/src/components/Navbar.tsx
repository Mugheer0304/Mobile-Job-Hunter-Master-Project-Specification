'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/feed', label: 'Feed' },
  { href: '/network', label: 'Network' },
  { href: '/messages', label: 'Messages' },
  { href: '/notifications', label: 'Notifications' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand">
          MJH
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive(item.href) ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive('/admin') ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {user.fullName}
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Join now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
