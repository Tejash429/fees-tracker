'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle, CreditCard, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/pending', label: 'Pending Dues', icon: AlertCircle }
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
        'flex items-center gap-1',
        orientation === 'horizontal' ? 'flex-wrap' : 'w-full flex-col items-stretch gap-1.5'
      )}
    >
      {links.map((link) => {
        const Icon = link.icon;
        const isRoot = link.href === '/';
        const isActive = isRoot
          ? pathname === '/'
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              orientation === 'vertical' ? 'w-full py-2.5 text-sm' : undefined,
              isActive
                ? 'bg-foreground/10 text-foreground shadow-xs ring-1 ring-foreground/20'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <span>{link.label}</span>
            {link.href === '/pending' && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
