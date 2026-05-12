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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

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

      {open ? (
        <div
          role="menu"
          aria-label={label}
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('button,a')) {
              setOpen(false);
            }
          }}
          className={cn(
            'absolute top-12 z-30 min-w-[10rem] rounded-md border border-border bg-popover p-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="flex flex-col gap-1">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
