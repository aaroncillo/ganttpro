import { format, addDays as addD, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ═══════════════════ ID ═══════════════════

export const uid = (): string => Math.random().toString(36).substr(2, 9);

// ═══════════════════ DATES ═══════════════════

export const todayISO = (): string => formatISO(new Date());

export const formatISO = (d: Date): string => format(d, 'yyyy-MM-dd');

export const addDays = (dateStr: string, n: number): string =>
  formatISO(addD(parseISO(dateStr), n));

export const diffDays = (a: string, b: string): number =>
  differenceInDays(parseISO(b), parseISO(a));

export const formatShort = (dateStr: string): string =>
  format(parseISO(dateStr), 'dd MMM', { locale: es });

export const formatMonthYear = (d: Date): string =>
  format(d, 'MMM yyyy', { locale: es });

// ═══════════════════ MONEY ═══════════════════

export const formatMoney = (value: number): string =>
  '$' + value.toLocaleString('es-CL');

export const parseMoney = (str: string): number =>
  parseInt(str.replace(/[^0-9]/g, '')) || 0;

// ═══════════════════ PROGRESS ═══════════════════

export const calcProjectProgress = (tasks: { progress: number }[]): number =>
  tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
    : 0;

// ═══════════════════ CLASS HELPERS ═══════════════════

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
