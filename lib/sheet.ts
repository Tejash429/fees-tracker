import { StudentClass } from '@/types';
import { toISODate } from '@/lib/utils';

export interface RawImportRow {
  [key: string]: unknown;
}

export interface NormalizedImportRow {
  rowNumber: number;
  name: string;
  class: StudentClass | '';
  parent_name: string;
  phone: string;
  enrollment_date: string;
  errors: string[];
}

const HEADER_MAP = {
  name: ['name', 'student_name', 'student', 'full_name'],
  class: ['class', 'grade', 'std', 'standard'],
  parent_name: ['parent_name', 'parent', 'father_name', 'mother_name', 'guardian_name'],
  phone: ['phone', 'mobile', 'contact', 'phone_number', 'parent_phone'],
  enrollment_date: ['enrollment_date', 'enrolled_on', 'joining_date', 'date']
};

function normalizeHeader(header: string) {
  return header.toLowerCase().trim().replace(/\s+/g, '_');
}

function pickValue(raw: RawImportRow, candidates: string[]) {
  const normalizedEntries = Object.entries(raw).map(([key, value]) => [normalizeHeader(key), value]);
  for (const candidate of candidates) {
    const found = normalizedEntries.find(([key]) => key === candidate);
    if (found) return found[1];
  }
  return undefined;
}

function normalizeClass(value: unknown): StudentClass | '' {
  const text = String(value ?? '').trim();
  if (text === '9' || text.toLowerCase() === 'class 9') return '9';
  if (text === '10' || text.toLowerCase() === 'class 10') return '10';
  return '';
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

  return text;
}

export function normalizeImportRows(rawRows: RawImportRow[]) {
  return rawRows.map((row, index) => {
    const normalized: NormalizedImportRow = {
      rowNumber: index + 1,
      name: String(pickValue(row, HEADER_MAP.name) ?? '').trim(),
      class: normalizeClass(pickValue(row, HEADER_MAP.class)),
      parent_name: String(pickValue(row, HEADER_MAP.parent_name) ?? '').trim(),
      phone: String(pickValue(row, HEADER_MAP.phone) ?? '').trim(),
      enrollment_date: normalizeDate(pickValue(row, HEADER_MAP.enrollment_date)),
      errors: []
    };

    if (!normalized.name) normalized.errors.push('Name is required');
    if (!normalized.class) normalized.errors.push('Class must be 9 or 10');
    if (normalized.enrollment_date) {
      const d = new Date(normalized.enrollment_date);
      if (Number.isNaN(d.getTime())) normalized.errors.push('Invalid enrollment_date');
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
