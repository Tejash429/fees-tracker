'use server';

import { revalidatePath } from 'next/cache';
import { getFeeSettings, getYearlyFeeMap } from '@/lib/fee-settings';
import { calculateAmount, calculatePeriodEnd } from '@/lib/fees';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizePhone, toISODate } from '@/lib/utils';
import {
  ActionResult,
  ImportReport,
  Payment,
  PaymentFormInput,
  PaymentUpdateInput,
  FeeSetting,
  Student,
  StudentClass,
  StudentFormInput
} from '@/types';

async function ensureAuthenticated() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, error: 'Unauthorized' };
  }

  return { supabase, error: null };
}

function validateStudentInput(input: StudentFormInput) {
  if (!input.name?.trim()) return 'Student name is required.';
  if (input.class !== '9' && input.class !== '10') return 'Class must be 9 or 10.';
  if (!input.enrollment_date) return 'Enrollment date is required.';
  if (Number.isNaN(new Date(input.enrollment_date).getTime())) return 'Enrollment date is invalid.';
  return null;
}

export async function createStudentAction(input: StudentFormInput): Promise<ActionResult<Student>> {
  const validationError = validateStudentInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const payload = {
    name: input.name.trim(),
    class: input.class,
    parent_name: input.parent_name?.trim() || null,
    phone: sanitizePhone(input.phone) || null,
    enrollment_date: input.enrollment_date
  };

  const { data, error } = await supabase.from('students').insert(payload).select('*').single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/students');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  return {
    success: true,
    message: 'Student created successfully.',
    data: data as Student
  };
}

export async function updateStudentAction(input: StudentFormInput): Promise<ActionResult<Student>> {
  if (!input.id) return { success: false, error: 'Student id is required.' };

  const validationError = validateStudentInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const payload = {
    name: input.name.trim(),
    class: input.class,
    parent_name: input.parent_name?.trim() || null,
    phone: sanitizePhone(input.phone) || null,
    enrollment_date: input.enrollment_date
  };

  const { data, error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/students');
  revalidatePath('/pending');
  revalidatePath('/analytics');
  revalidatePath('/payments');

  return {
    success: true,
    message: 'Student updated successfully.',
    data: data as Student
  };
}

export async function deleteStudentAction(studentId: string): Promise<ActionResult> {
  if (!studentId) return { success: false, error: 'Student id is required.' };

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const { error } = await supabase.from('students').delete().eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/students');
  revalidatePath('/pending');
  revalidatePath('/analytics');
  revalidatePath('/payments');

  return {
    success: true,
    message: 'Student deleted successfully.'
  };
}

export async function createPaymentAction(input: PaymentFormInput): Promise<ActionResult<Payment>> {
  if (!input.student_id) return { success: false, error: 'Student is required.' };
  if (!input.period_start) return { success: false, error: 'Period start date is required.' };
  if (!input.payment_date) return { success: false, error: 'Payment date is required.' };
  if (input.payment_type !== 'yearly' && input.payment_type !== 'half_yearly') {
    return { success: false, error: 'Invalid payment type.' };
  }

  if (Number.isNaN(new Date(input.period_start).getTime())) {
    return { success: false, error: 'Invalid period start date.' };
  }

  if (Number.isNaN(new Date(input.payment_date).getTime())) {
    return { success: false, error: 'Invalid payment date.' };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, class')
    .eq('id', input.student_id)
    .single();

  if (studentError || !student) {
    return { success: false, error: studentError?.message || 'Student not found.' };
  }

  if (input.payment_type === 'yearly') {
    const { data: halfYearlyPayments, error: halfYearlyPaymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('student_id', input.student_id)
      .eq('payment_type', 'half_yearly')
      .limit(1);

    if (halfYearlyPaymentsError) {
      return { success: false, error: halfYearlyPaymentsError.message };
    }

    if (halfYearlyPayments.length > 0) {
      return {
        success: false,
        error: 'Yearly payment is not allowed because first half-yearly installment is already recorded.'
      };
    }
  }

  const yearlyFeeMap = await getYearlyFeeMap();

  const amount =
    typeof input.amount === 'number' && !Number.isNaN(input.amount)
      ? input.amount
      : calculateAmount(student.class, input.payment_type, yearlyFeeMap);

  const periodEnd = input.period_end || calculatePeriodEnd(input.period_start, input.payment_type);

  if (Number.isNaN(new Date(periodEnd).getTime())) {
    return { success: false, error: 'Invalid period end date.' };
  }

  if (!amount || amount <= 0) {
    return { success: false, error: 'Amount must be greater than 0.' };
  }

  const payload = {
    student_id: input.student_id,
    payment_type: input.payment_type,
    amount,
    payment_date: input.payment_date,
    period_start: input.period_start,
    period_end: periodEnd,
    notes: input.notes?.trim() || null
  };

  const { data, error } = await supabase.from('payments').insert(payload).select('*').single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/payments');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  return {
    success: true,
    message: 'Payment recorded successfully.',
    data: data as Payment
  };
}

export async function updatePaymentAction(input: PaymentUpdateInput): Promise<ActionResult<Payment>> {
  if (!input.id) return { success: false, error: 'Payment id is required.' };
  if (!input.student_id) return { success: false, error: 'Student is required.' };
  if (!input.period_start) return { success: false, error: 'Period start date is required.' };
  if (!input.payment_date) return { success: false, error: 'Payment date is required.' };
  if (input.payment_type !== 'yearly' && input.payment_type !== 'half_yearly') {
    return { success: false, error: 'Invalid payment type.' };
  }

  if (Number.isNaN(new Date(input.period_start).getTime())) {
    return { success: false, error: 'Invalid period start date.' };
  }

  if (Number.isNaN(new Date(input.payment_date).getTime())) {
    return { success: false, error: 'Invalid payment date.' };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, class')
    .eq('id', input.student_id)
    .single();

  if (studentError || !student) {
    return { success: false, error: studentError?.message || 'Student not found.' };
  }

  if (input.payment_type === 'yearly') {
    const { data: halfYearlyPayments, error: halfYearlyPaymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('student_id', input.student_id)
      .eq('payment_type', 'half_yearly')
      .limit(1);

    if (halfYearlyPaymentsError) {
      return { success: false, error: halfYearlyPaymentsError.message };
    }

    if (halfYearlyPayments.length > 0) {
      return {
        success: false,
        error: 'Yearly payment is not allowed because first half-yearly installment is already recorded.'
      };
    }
  }

  const yearlyFeeMap = await getYearlyFeeMap();

  const amount =
    typeof input.amount === 'number' && !Number.isNaN(input.amount)
      ? input.amount
      : calculateAmount(student.class, input.payment_type, yearlyFeeMap);

  const periodEnd = input.period_end || calculatePeriodEnd(input.period_start, input.payment_type);

  if (Number.isNaN(new Date(periodEnd).getTime())) {
    return { success: false, error: 'Invalid period end date.' };
  }

  if (!amount || amount <= 0) {
    return { success: false, error: 'Amount must be greater than 0.' };
  }

  const payload = {
    student_id: input.student_id,
    payment_type: input.payment_type,
    amount,
    payment_date: input.payment_date,
    period_start: input.period_start,
    period_end: periodEnd,
    notes: input.notes?.trim() || null
  };

  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/payments');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  return {
    success: true,
    message: 'Payment updated successfully.',
    data: data as Payment
  };
}

export async function deletePaymentAction(paymentId: string): Promise<ActionResult> {
  if (!paymentId) return { success: false, error: 'Payment id is required.' };

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const { error } = await supabase.from('payments').delete().eq('id', paymentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/payments');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  return {
    success: true,
    message: 'Payment deleted successfully.'
  };
}

export async function deletePaymentsBulkAction(paymentIds: string[]): Promise<ActionResult<{ deletedCount: number }>> {
  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    return { success: false, error: 'At least one payment id is required.' };
  }

  const uniqueIds = Array.from(new Set(paymentIds.map((id) => String(id).trim()).filter(Boolean)));
  if (!uniqueIds.length) {
    return { success: false, error: 'At least one valid payment id is required.' };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const { error } = await supabase.from('payments').delete().in('id', uniqueIds);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/payments');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  return {
    success: true,
    message: `Deleted ${uniqueIds.length} payment(s) successfully.`,
    data: { deletedCount: uniqueIds.length }
  };
}

interface BulkImportRowInput {
  rowNumber: number;
  name: string;
  class: string;
  parent_name?: string;
  phone?: string;
  enrollment_date?: string;
}

function validateImportRow(row: BulkImportRowInput) {
  const reasons: string[] = [];

  if (!row.name?.trim()) reasons.push('Name is required');
  if (row.class !== '9' && row.class !== '10') reasons.push('Class must be 9 or 10');

  if (row.enrollment_date) {
    const d = new Date(row.enrollment_date);
    if (Number.isNaN(d.getTime())) reasons.push('Invalid enrollment_date');
  }

  return reasons;
}

export async function bulkImportStudentsAction(
  rows: BulkImportRowInput[]
): Promise<ActionResult<ImportReport>> {
  if (!rows?.length) {
    return { success: false, error: 'No rows to import.' };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const phonesToCheck = rows
    .map((row) => sanitizePhone(row.phone))
    .filter((phone): phone is string => Boolean(phone));

  let existingPhonesSet = new Set<string>();

  if (phonesToCheck.length) {
    const { data: existingStudents, error: existingError } = await supabase
      .from('students')
      .select('phone')
      .in('phone', phonesToCheck);

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    existingPhonesSet = new Set(
      (existingStudents || [])
        .map((student) => sanitizePhone(student.phone))
        .filter((phone): phone is string => Boolean(phone))
    );
  }

  const seenBatchPhones = new Set<string>();
  const insertRows: Array<{
    name: string;
    class: '9' | '10';
    parent_name: string | null;
    phone: string | null;
    enrollment_date: string;
  }> = [];

  const report: ImportReport = {
    inserted: 0,
    skippedDuplicates: 0,
    failed: 0,
    skippedRows: [],
    failedRows: []
  };

  rows.forEach((row, index) => {
    const rowNumber = row.rowNumber || index + 1;
    const reasons = validateImportRow(row);

    if (reasons.length) {
      report.failed += 1;
      report.failedRows.push({ rowNumber, reason: reasons.join(', ') });
      return;
    }

    const phone = sanitizePhone(row.phone);

    if (phone && (existingPhonesSet.has(phone) || seenBatchPhones.has(phone))) {
      report.skippedDuplicates += 1;
      report.skippedRows.push({ rowNumber, reason: `Duplicate phone (${phone})` });
      return;
    }

    if (phone) {
      seenBatchPhones.add(phone);
    }

    insertRows.push({
      name: row.name.trim(),
      class: row.class as '9' | '10',
      parent_name: row.parent_name?.trim() || null,
      phone: phone || null,
      enrollment_date: row.enrollment_date || toISODate()
    });
  });

  if (insertRows.length) {
    const { data, error } = await supabase.from('students').insert(insertRows).select('id');

    if (error) {
      return {
        success: false,
        error: error.message,
        data: report
      };
    }

    report.inserted = data?.length || 0;
  }

  revalidatePath('/');
  revalidatePath('/students');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  return {
    success: true,
    message: `Import completed. Inserted ${report.inserted} row(s).`,
    data: report
  };
}

export async function updateFeeSettingsAction(
  input: Record<StudentClass, number>
): Promise<ActionResult<FeeSetting[]>> {
  const class9 = Math.round(Number(input['9']));
  const class10 = Math.round(Number(input['10']));

  if (!Number.isFinite(class9) || class9 <= 0 || !Number.isFinite(class10) || class10 <= 0) {
    return { success: false, error: 'Yearly fee must be a positive number for both classes.' };
  }

  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const payload = [
    { class: '9' as const, yearly_fee: class9 },
    { class: '10' as const, yearly_fee: class10 }
  ];

  const { error } = await supabase.from('fee_settings').upsert(payload, { onConflict: 'class' });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/settings');
  revalidatePath('/payments');
  revalidatePath('/pending');
  revalidatePath('/analytics');

  const settings = await getFeeSettings();

  return {
    success: true,
    message: 'Fee settings updated successfully.',
    data: settings
  };
}

export async function signOutAction(): Promise<ActionResult> {
  const { supabase, error: authError } = await ensureAuthenticated();
  if (!supabase) return { success: false, error: authError || 'Unauthorized' };

  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };

  revalidatePath('/');

  return {
    success: true,
    message: 'Logged out successfully.'
  };
}
