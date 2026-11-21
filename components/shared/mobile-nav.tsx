'use client';

import { useState } from 'react';
import { GraduationCap, Menu } from 'lucide-react';
import { LogoutButton } from '@/components/shared/logout-button';
import { NavLinks } from '@/components/shared/nav-links';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-border/70"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col gap-5 p-6">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Fees Tracker</SheetTitle>
              <p className="text-xs text-muted-foreground">Tuition Management</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-2 flex-1">
          <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
        </div>

        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Admin Active</span>
          </div>
          <LogoutButton className="w-full justify-center" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
