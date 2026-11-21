'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Logged out successfully');
    router.push('/login');
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onLogout}
      className={cn(
        'h-8 gap-1.5 rounded-lg border-border/70 px-2.5 text-xs text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive',
        className
      )}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Logout</span>
    </Button>
  );
}
