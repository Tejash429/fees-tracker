import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { DEFAULT_YEARLY_FEE_MAP, deriveHalfYearlyFee } from '@/lib/fees';
import { FeeSetting, StudentClass } from '@/types';

const SUPPORTED_CLASSES: StudentClass[] = ['9', '10'];

function normalizeYearlyFee(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

export function getDefaultFeeSettings(): FeeSetting[] {
  return SUPPORTED_CLASSES.map((studentClass) => {
    const yearlyFee = DEFAULT_YEARLY_FEE_MAP[studentClass];
    return {
      class: studentClass,
      yearlyFee,
      halfYearlyFee: deriveHalfYearlyFee(yearlyFee)
    };
  });
}

export function toYearlyFeeMap(settings: FeeSetting[]): Record<StudentClass, number> {
  const fallback = DEFAULT_YEARLY_FEE_MAP;

  return {
    '9': settings.find((setting) => setting.class === '9')?.yearlyFee ?? fallback['9'],
    '10': settings.find((setting) => setting.class === '10')?.yearlyFee ?? fallback['10']
  };
}

export const getFeeSettings = cache(async (): Promise<FeeSetting[]> => {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.from('fee_settings').select('class, yearly_fee');

  if (error || !data) {
    return getDefaultFeeSettings();
  }

  const rowsByClass = new Map<string, number>();
  data.forEach((row: any) => {
    const cls = String(row.class) as StudentClass;
    const fallback = cls === '10' ? DEFAULT_YEARLY_FEE_MAP['10'] : DEFAULT_YEARLY_FEE_MAP['9'];
    rowsByClass.set(String(row.class), normalizeYearlyFee(row.yearly_fee, fallback));
  });

  return SUPPORTED_CLASSES.map((studentClass) => {
    const fallback = DEFAULT_YEARLY_FEE_MAP[studentClass];
    const yearlyFee = normalizeYearlyFee(rowsByClass.get(studentClass), fallback);

    return {
      class: studentClass,
      yearlyFee,
      halfYearlyFee: deriveHalfYearlyFee(yearlyFee)
    };
  });
});

export const getYearlyFeeMap = cache(async (): Promise<Record<StudentClass, number>> => {
  const settings = await getFeeSettings();
  return toYearlyFeeMap(settings);
});
