'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
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
    <html>
      <body className="dark">
        <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <div className="max-w-md rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Application Error</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please check environment variables and retry.</p>
            <Button onClick={reset} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
