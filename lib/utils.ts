import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(value: string | number | Date | null | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function toISODate(value: Date = new Date()) {
  return value.toISOString().split('T')[0];
}

export function sanitizePhone(phone?: string | null) {
  return (phone || '').replace(/\s+/g, '').trim();
}

export const AVATAR_COLORS = [
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'bg-teal-500/15 text-teal-400 border-teal-500/30',
];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name || '').slice(0, 2).toUpperCase() || 'ST';
}
