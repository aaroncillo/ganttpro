import type { StatusConfig, SubOCTypeConfig } from '@/types';

// ═══════════════════ COLORS ═══════════════════

export const colors = {
  bg: '#0A0A0B',
  surface: '#141416',
  surfaceHover: '#1A1A1E',
  surfaceActive: '#222228',
  border: '#2A2A30',
  borderLight: '#38383F',
  text: '#F5F5F7',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  accent: '#0A84FF',
  accentGlow: 'rgba(10, 132, 255, 0.15)',
  accentSoft: 'rgba(10, 132, 255, 0.08)',
  green: '#30D158',
  greenSoft: 'rgba(48, 209, 88, 0.12)',
  orange: '#FF9F0A',
  orangeSoft: 'rgba(255, 159, 10, 0.12)',
  red: '#FF453A',
  redSoft: 'rgba(255, 69, 58, 0.12)',
  purple: '#BF5AF2',
  purpleSoft: 'rgba(191, 90, 242, 0.12)',
  cyan: '#64D2FF',
  cyanSoft: 'rgba(100, 210, 255, 0.12)',
  yellow: '#FFD60A',
} as const;

export const GROUP_COLORS = [
  '#0A84FF', '#BF5AF2', '#FF9F0A', '#30D158',
  '#FF453A', '#FFD60A', '#64D2FF', '#FF6482',
] as const;

// ═══════════════════ STATUS MAPS ═══════════════════

export const TASK_STATUS: Record<string, StatusConfig> = {
  pending: { label: 'Pendiente', color: colors.textTertiary, bg: 'rgba(99,99,102,0.12)' },
  in_progress: { label: 'En Progreso', color: colors.accent, bg: colors.accentSoft },
  completed: { label: 'Completado', color: colors.green, bg: colors.greenSoft },
  delayed: { label: 'Retrasado', color: colors.red, bg: colors.redSoft },
  review: { label: 'En Revisión', color: colors.orange, bg: colors.orangeSoft },
};

export const SUB_OC_TYPES: Record<string, SubOCTypeConfig> = {
  subcontrato: { label: 'Subcontrato', color: colors.accent, icon: 'Users' },
  servicio: { label: 'Servicio', color: colors.purple, icon: 'Wrench' },
  equipo: { label: 'Equipo / Material', color: colors.orange, icon: 'Package' },
  otro: { label: 'Otro', color: colors.textSecondary, icon: 'File' },
};

export const SUB_OC_STATUS: Record<string, StatusConfig> = {
  vigente: { label: 'Vigente', color: colors.green, bg: colors.greenSoft },
  en_proceso: { label: 'En Proceso', color: colors.accent, bg: colors.accentSoft },
  por_emitir: { label: 'Por Emitir', color: colors.orange, bg: colors.orangeSoft },
  cerrada: { label: 'Cerrada', color: colors.textTertiary, bg: 'rgba(99,99,102,0.12)' },
  con_observaciones: { label: 'Con Observaciones', color: colors.red, bg: colors.redSoft },
};

// ═══════════════════ GANTT CONFIG ═══════════════════

export const GANTT = {
  ROW_HEIGHT: 42,
  HEADER_HEIGHT: 64,
  BAR_HEIGHT: 26,
  MIN_ZOOM: 3,
  MAX_ZOOM: 16,
  DEFAULT_ZOOM: 7,
  PADDING_DAYS_BEFORE: 14,
  PADDING_DAYS_AFTER: 21,
} as const;
