'use client';

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateFeeSettingsAction } from '@/lib/actions';
import { fetchFeeSettingsClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FeeSetting } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FeeSettingsFormProps {
  initialSettings: FeeSetting[];
}

interface FeeSettingsErrors {
  class9?: string;
  class10?: string;
  form?: string;
}

function getYearly(settings: FeeSetting[], studentClass: '9' | '10') {
  return settings.find((setting) => setting.class === studentClass)?.yearlyFee ?? 0;
}

export function FeeSettingsForm({ initialSettings }: FeeSettingsFormProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [class9YearlyFee, setClass9YearlyFee] = useState(String(getYearly(initialSettings, '9')));
  const [class10YearlyFee, setClass10YearlyFee] = useState(String(getYearly(initialSettings, '10')));
  const [errors, setErrors] = useState<FeeSettingsErrors>({});

  const { data: settings = initialSettings, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.feeSettings,
    queryFn: fetchFeeSettingsClient,
    initialData: initialSettings
  });

  useEffect(() => {
    setClass9YearlyFee(String(getYearly(settings, '9')));
    setClass10YearlyFee(String(getYearly(settings, '10')));
    setErrors({});
  }, [settings]);

  const parsedClass9 = Number(class9YearlyFee);
  const parsedClass10 = Number(class10YearlyFee);

  const class9HalfYearly = Number.isFinite(parsedClass9) && parsedClass9 > 0 ? Math.round(parsedClass9 / 2) : 0;
  const class10HalfYearly = Number.isFinite(parsedClass10) && parsedClass10 > 0 ? Math.round(parsedClass10 / 2) : 0;

  const hasUnsavedChanges = useMemo(() => {
    return (
      String(getYearly(settings, '9')) !== class9YearlyFee.trim() ||
      String(getYearly(settings, '10')) !== class10YearlyFee.trim()
    );
  }, [class10YearlyFee, class9YearlyFee, settings]);

  const validate = () => {
    const nextErrors: FeeSettingsErrors = {};

    if (!Number.isFinite(parsedClass9) || parsedClass9 <= 0) {
      nextErrors.class9 = 'Enter a valid yearly fee for Class 9.';
    }

    if (!Number.isFinite(parsedClass10) || parsedClass10 <= 0) {
      nextErrors.class10 = 'Enter a valid yearly fee for Class 10.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    startTransition(async () => {
      const result = await updateFeeSettingsAction({
        '9': parsedClass9,
        '10': parsedClass10
      });

      if (!result.success) {
        setErrors((prev) => ({ ...prev, form: result.error || 'Failed to update fee settings.' }));
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.feeSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending })
      ]);

      toast.success(result.message || 'Fee settings saved');
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class-wise Fee Rules</CardTitle>
        <CardDescription>
          Set yearly fee per class. Half-yearly amount is always auto-derived at 50%.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          {errors.form ? (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errors.form}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="class-9-yearly">Class 9 yearly fee (₹)</Label>
                <Badge variant="outline">Half-yearly: {formatCurrency(class9HalfYearly)}</Badge>
              </div>
              <Input
                id="class-9-yearly"
                type="number"
                min={1}
                inputMode="numeric"
                value={class9YearlyFee}
                onChange={(event) => {
                  setClass9YearlyFee(event.target.value);
                  setErrors((prev) => ({ ...prev, class9: undefined, form: undefined }));
                }}
                aria-invalid={Boolean(errors.class9)}
                aria-describedby={errors.class9 ? 'class-9-yearly-error' : undefined}
              />
              {errors.class9 ? (
                <p id="class-9-yearly-error" role="alert" className="text-xs text-destructive">
                  {errors.class9}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="class-10-yearly">Class 10 yearly fee (₹)</Label>
                <Badge variant="outline">Half-yearly: {formatCurrency(class10HalfYearly)}</Badge>
              </div>
              <Input
                id="class-10-yearly"
                type="number"
                min={1}
                inputMode="numeric"
                value={class10YearlyFee}
                onChange={(event) => {
                  setClass10YearlyFee(event.target.value);
                  setErrors((prev) => ({ ...prev, class10: undefined, form: undefined }));
                }}
                aria-invalid={Boolean(errors.class10)}
                aria-describedby={errors.class10 ? 'class-10-yearly-error' : undefined}
              />
              {errors.class10 ? (
                <p id="class-10-yearly-error" role="alert" className="text-xs text-destructive">
                  {errors.class10}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <p>
                Last synced:{' '}
                <span className="font-medium text-foreground">{formatDate(new Date(dataUpdatedAt || Date.now()))}</span>
              </p>
              <p>Tip: Use whole numbers for consistent auto-calculations.</p>
            </div>

            <Button type="submit" disabled={isPending || !hasUnsavedChanges}>
              {isPending ? 'Saving...' : hasUnsavedChanges ? 'Save Fee Settings' : 'Saved'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
