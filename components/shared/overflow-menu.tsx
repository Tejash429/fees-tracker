'use client';

import { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface OverflowMenuProps {
  label: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}

export function OverflowMenu({ label, children, align = 'end' }: OverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={label}
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={6}
        collisionPadding={16}
        className="w-44 p-1.5"
      >
        <div className="flex flex-col gap-1">{children}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
