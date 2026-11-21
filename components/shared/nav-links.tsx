'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/payments', label: 'Payments' },
  { href: '/pending', label: 'Pending' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' }
];

interface NavLinksProps {
  orientation?: 'horizontal' | 'vertical';
  onNavigate?: () => void;
}

export function NavLinks({ orientation = 'horizontal', onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'flex items-center gap-2',
        orientation === 'horizontal' ? 'flex-wrap' : 'w-full flex-col items-stretch'
      )}
    >
      {links.map((link) => {
        const isRoot = link.href === '/';
        const isActive = isRoot ? pathname === '/' : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              orientation === 'vertical' ? 'w-full' : undefined,
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
