import { ReactNode } from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { MobileNav } from '@/components/shared/mobile-nav';
import { NavLinks } from '@/components/shared/nav-links';
import { LogoutButton } from '@/components/shared/logout-button';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Sleek App Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          {/* Brand Emblem & Title */}
          <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-xs transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                  Fees Tracker
                </span>
                <span className="rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Tuition Management</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:gap-1">
            <div className="rounded-xl border border-border/50 bg-card/40 p-1 backdrop-blur-xs">
              <NavLinks />
            </div>
          </div>

          {/* Right Header Area */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Admin Active</span>
            </div>
            <LogoutButton />
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        {children}
      </main>
    </div>
  );
}
