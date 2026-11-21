'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OverflowMenuProps {
  label: string;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function OverflowMenu({ label, children, align = 'right' }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If there's less than 220px below, pop above instead
      setOpenAbove(spaceBelow < 220);
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <div
        role="menu"
        aria-label={label}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          // Close menu if a link or button was clicked, but keep component mounted
          if (target.closest('button,a')) {
            setOpen(false);
          }
        }}
        className={cn(
          'absolute z-50 min-w-[11rem] rounded-md border border-border bg-popover p-1 shadow-xl transition-all duration-150',
          align === 'right' ? 'right-0' : 'left-0',
          openAbove ? 'bottom-full mb-2 top-auto' : 'top-full mt-2',
          open ? 'opacity-100 scale-100 pointer-events-auto visible' : 'opacity-0 scale-95 pointer-events-none invisible'
        )}
      >
        <div className="flex flex-col gap-1">{children}</div>
      </div>
    </div>
  );
}
