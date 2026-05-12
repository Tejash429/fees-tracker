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
    <Button type="button" variant="outline" onClick={onLogout} className={cn('gap-2', className)}>
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
