'use client';

import { ReactNode, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteStudentAction } from '@/lib/actions';
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

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
  trigger?: ReactNode;
}

export function DeleteStudentButton({ studentId, studentName, trigger }: DeleteStudentButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteStudentAction(studentId);
      if (!result.success) {
        toast.error(result.error || 'Unable to delete student');
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.students }),
        queryClient.invalidateQueries({ queryKey: queryKeys.studentsTableRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsTableRoot })
      ]);

      setOpen(false);
      toast.success(result.message || 'Student deleted');
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" size="sm" variant="destructive" disabled={isPending}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete student</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete student?</DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-medium text-foreground">{studentName}</span> and remove all
            related payment records.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
