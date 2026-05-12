import { ReactNode } from 'react';
import { MobileNav } from '@/components/shared/mobile-nav';
import { NavLinks } from '@/components/shared/nav-links';
import { LogoutButton } from '@/components/shared/logout-button';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fee Tracker</p>
            <p className="text-lg font-semibold">Admin Dashboard</p>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <NavLinks />
            <LogoutButton />
          </div>

          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
