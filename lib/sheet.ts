import { StudentClass } from '@/types';
import { toISODate } from '@/lib/utils';

export interface RawImportRow {
  [key: string]: unknown;
}

export interface NormalizedImportRow {
  rowNumber: number;
  name: string;
  class: StudentClass | '';
  parent_name?: string;
  phone: string;
  enrollment_date: string;
  errors: string[];
}

const HEADER_MAP = {
  name: [
    'name',
    'student_name',
    'student',
    'full_name',
    'students',
    'student_names',
    'names',
    'candidate_name',
    'student_fullname',
    'first_name'
  ],
  class: [
    'class',
    'grade',
    'std',
    'standard',
    'classroom',
    'batch',
    'section'
  ],
  parent_name: [
    'parent_name',
    'parent',
    'father_name',
    'mother_name',
    'guardian_name'
  ],
  phone: [
    'phone',
    'number',
    'numbers',
    'phone_number',
    'phone_no',
    'phoneno',
    'mobile',
    'mobile_number',
    'mobile_no',
    'mobileno',
    'contact',
    'contact_number',
    'contact_no',
    'contactno',
    'parent_phone',
    'parent_mobile',
    'student_phone',
    'student_mobile',
    'cell',
    'cell_no',
    'tel',
    'telephone',
    'whatsapp',
    'wa',
    'no'
  ],
  enrollment_date: [
    'enrollment_date',
    'enrolled_on',
    'joining_date',
    'admission_date',
    'date'
  ]
};

function normalizeHeader(header: string) {
  return header.toLowerCase().trim().replace(/[\s._-]+/g, '_');
}

function pickValue(raw: RawImportRow, candidates: string[]) {
  const normalizedEntries = Object.entries(raw).map(([key, value]) => [normalizeHeader(key), value]);
  for (const candidate of candidates) {
    const found = normalizedEntries.find(([key]) => key === candidate);
    if (found && found[1] !== undefined && found[1] !== null && String(found[1]).trim() !== '') {
      return found[1];
    }
  }
  return undefined;
}

function normalizeClass(value: unknown, defaultClass: StudentClass = '10'): StudentClass {
  const text = String(value ?? '').trim();
  if (text === '9' || text.toLowerCase() === 'class 9' || text.toLowerCase() === '9th') return '9';
  if (text === '10' || text.toLowerCase() === 'class 10' || text.toLowerCase() === '10th') return '10';
  return defaultClass;
}

function normalizeDate(value: unknown) {
  if (!value) return toISODate();

  if (typeof value === 'number') {
    // Excel serial date support.
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const result = new Date(excelEpoch.getTime() + value * 86400000);
    return result.toISOString().split('T')[0];
  }

  const text = String(value).trim();
  if (!text) return toISODate();

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  return toISODate();
}

/**
 * Checks if a string looks like a telephone / mobile number.
 */
function isPhoneNumberLike(val: unknown): boolean {
  if (typeof val === 'number') {
    const numStr = String(val);
    return numStr.length >= 7 && numStr.length <= 15;
  }
  if (typeof val !== 'string') return false;
  const digits = val.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function normalizeImportRows(rawRows: RawImportRow[], defaultClass: StudentClass = '10') {
  return rawRows.map((row, index) => {
    let name = String(pickValue(row, HEADER_MAP.name) ?? '').trim();
    let phone = String(pickValue(row, HEADER_MAP.phone) ?? '').trim();
    const rawClass = pickValue(row, HEADER_MAP.class);
    const parentName = String(pickValue(row, HEADER_MAP.parent_name) ?? '').trim();
    const enrollmentDate = normalizeDate(pickValue(row, HEADER_MAP.enrollment_date));

    // Fallback heuristic: If name or phone wasn't detected by header, inspect row values
    if (!name || !phone) {
      const entries = Object.entries(row).filter(
        ([_, v]) => v !== undefined && v !== null && String(v).trim() !== ''
      );

      for (const [_, val] of entries) {
        if (!phone && isPhoneNumberLike(val)) {
          phone = String(val).trim();
        } else if (!name && typeof val === 'string' && val.trim().length > 1 && !isPhoneNumberLike(val)) {
          name = val.trim();
        }
      }
    }

    // Default class to 10 if missing
    const studentClass = normalizeClass(rawClass, defaultClass);

    const normalized: NormalizedImportRow = {
      rowNumber: index + 1,
      name,
      class: studentClass,
      parent_name: parentName,
      phone,
      enrollment_date: enrollmentDate,
      errors: []
    };

    if (!normalized.name) normalized.errors.push('Name is required');
    if (!normalized.class || (normalized.class !== '9' && normalized.class !== '10')) {
      normalized.errors.push('Class must be 9 or 10');
    }

    return normalized;
  });
}

export function normalizeSheetUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname;

    if (host.includes('docs.google.com') && parsed.pathname.includes('/spreadsheets/d/')) {
      const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return trimmed;

      const sheetId = match[1];
      const gid = parsed.searchParams.get('gid') || parsed.hash.match(/gid=(\d+)/)?.[1] || '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
}
