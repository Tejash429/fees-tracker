'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { LogoutButton } from '@/components/shared/logout-button';
import { NavLinks } from '@/components/shared/nav-links';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col gap-6">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />

        <div className="mt-auto border-t border-border/70 pt-4">
          <LogoutButton className="w-full justify-start" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
