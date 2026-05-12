'use client';

import { ReactNode, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deletePaymentAction } from '@/lib/actions';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface DeletePaymentButtonProps {
  paymentId: string;
  trigger?: ReactNode;
}

export function DeletePaymentButton({ paymentId, trigger }: DeletePaymentButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePaymentAction(paymentId);

      if (!result.success) {
        toast.error(result.error || 'Unable to delete payment');
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsTableRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      ]);

      setOpen(false);
      toast.success(result.message || 'Payment deleted');
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            className="h-11 gap-1"
            aria-label="Delete payment"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sr-only">Delete payment</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete payment record?</DialogTitle>
          <DialogDescription>
            This action is permanent and will remove the selected payment from reports and pending calculations.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
