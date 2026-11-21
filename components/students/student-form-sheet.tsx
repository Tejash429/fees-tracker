'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus } from 'lucide-react';
import { createStudentAction, updateStudentAction } from '@/lib/actions';
import { queryKeys } from '@/lib/query-keys';
import { toISODate } from '@/lib/utils';
import { Student, StudentClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

interface StudentFormSheetProps {
  mode: 'create' | 'edit';
  student?: Student;
  trigger?: React.ReactNode;
}

interface StudentFormErrors {
  name?: string;
  studentClass?: string;
  enrollmentDate?: string;
  form?: string;
}

export function StudentFormSheet({ mode, student, trigger }: StudentFormSheetProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState<StudentClass>('9');
  const [phone, setPhone] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(toISODate());
  const [errors, setErrors] = useState<StudentFormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && student && open) {
      setName(student.name || '');
      setStudentClass(student.class || '9');
      setPhone(student.phone || '');
      setEnrollmentDate(student.enrollment_date || toISODate());
      setErrors({});
    }

    if (mode === 'create' && open) {
      setName('');
      setStudentClass('9');
      setPhone('');
      setEnrollmentDate(toISODate());
      setErrors({});
    }
  }, [mode, open, student]);

  const validateForm = () => {
    const nextErrors: StudentFormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Student name is required.';
    }

    if (studentClass !== '9' && studentClass !== '10') {
      nextErrors.studentClass = 'Class must be 9 or 10.';
    }

    if (!enrollmentDate) {
      nextErrors.enrollmentDate = 'Enrollment date is required.';
    } else if (Number.isNaN(new Date(enrollmentDate).getTime())) {
      nextErrors.enrollmentDate = 'Enrollment date is invalid.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    startTransition(async () => {
      const payload = {
        id: student?.id,
        name,
        class: studentClass,
        phone,
        enrollment_date: enrollmentDate
      };

      const result = mode === 'create' ? await createStudentAction(payload) : await updateStudentAction(payload);

      if (!result.success) {
        setErrors((prev) => ({ ...prev, form: result.error || 'Failed to save student' }));
        return;
      }

      const invalidations = [
        queryClient.invalidateQueries({ queryKey: queryKeys.students }),
        queryClient.invalidateQueries({ queryKey: queryKeys.studentsTableRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ];

      if (mode === 'edit') {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
          queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
          queryClient.invalidateQueries({ queryKey: queryKeys.paymentsTableRoot })
        );
      }

      await Promise.all(invalidations);

      toast.success(result.message || 'Student saved');
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Add Student' : 'Edit Student'}</SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Create a new student profile for fee tracking.'
              : 'Update student details and save changes.'}
          </SheetDescription>
        </SheetHeader>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          {errors.form ? (
            <p role="alert" aria-live="polite" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="student-name">Name</Label>
            <Input
              id="student-name"
              placeholder="Student name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((prev) => ({ ...prev, name: undefined, form: undefined }));
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'student-name-error' : undefined}
            />
            {errors.name ? (
              <p id="student-name-error" role="alert" className="text-xs text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-class">Class</Label>
            <Select
              value={studentClass}
              onValueChange={(value) => {
                setStudentClass(value as StudentClass);
                setErrors((prev) => ({ ...prev, studentClass: undefined, form: undefined }));
              }}
            >
              <SelectTrigger
                id="student-class"
                aria-invalid={Boolean(errors.studentClass)}
                aria-describedby={errors.studentClass ? 'student-class-error' : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
              </SelectContent>
            </Select>
            {errors.studentClass ? (
              <p id="student-class-error" role="alert" className="text-xs text-destructive">
                {errors.studentClass}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-phone">Phone</Label>
            <Input
              id="student-phone"
              placeholder="Phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enrollment-date">Enrollment Date</Label>
            <Input
              id="enrollment-date"
              type="date"
              value={enrollmentDate}
              onChange={(event) => {
                setEnrollmentDate(event.target.value);
                setErrors((prev) => ({ ...prev, enrollmentDate: undefined, form: undefined }));
              }}
              aria-invalid={Boolean(errors.enrollmentDate)}
              aria-describedby={errors.enrollmentDate ? 'enrollment-date-error' : undefined}
            />
            {errors.enrollmentDate ? (
              <p id="enrollment-date-error" role="alert" className="text-xs text-destructive">
                {errors.enrollmentDate}
              </p>
            ) : null}
          </div>

          <SheetFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {mode === 'edit' ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isPending ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
