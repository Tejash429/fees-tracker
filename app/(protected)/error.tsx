'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ProtectedError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We could not load this page. Please retry or check your Supabase configuration.
      </p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
