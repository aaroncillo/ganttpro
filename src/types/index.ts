// ═══════════════════ STATUS TYPES ═══════════════════

export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'review';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'review';
export type SubOCType = 'subcontrato' | 'servicio' | 'equipo' | 'otro';
export type SubOCStatus = 'vigente' | 'en_proceso' | 'por_emitir' | 'cerrada' | 'con_observaciones';

// ═══════════════════ CORE MODELS ═══════════════════

export interface Task {
  id: string;
  name: string;
  start: string; // ISO date string YYYY-MM-DD
  end: string;
  progress: number; // 0-100
  status: TaskStatus;
  group: string; // Fase: Ingeniería, Procura, Montaje, Commissioning
}

export interface OCDocument {
  number: string;
  date: string;
  payTerms: string;
  contact: string;
}

export interface SubOC {
  id: string;
  number: string; // e.g. OC-4521-01
  desc: string;
  type: SubOCType;
  contractor: string;
  value: number; // CLP
  status: SubOCStatus;
  start: string;
  end: string;
  payTerms: string;
  progress: number; // 0-100
}

export interface BTItem {
  item: string;
  cat: string;
}

export interface PropuestaItem {
  item: string;
  match: boolean;
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  oc: string;
  value: number; // CLP
  status: ProjectStatus;
  start: string;
  end: string;
  ocDoc: OCDocument;
  subOCs: SubOC[];
  tasks: Task[];
  baseTecnica: BTItem[];
  propuesta: PropuestaItem[];
}

// ═══════════════════ UI HELPERS ═══════════════════

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

export interface SubOCTypeConfig {
  label: string;
  color: string;
  icon: string;
}

// ═══════════════════ GANTT HELPERS ═══════════════════

export interface GanttDateRange {
  start: string;
  end: string;
  days: number;
}

export interface GanttMonth {
  label: string;
  startOff: number;
  days: number;
}

export interface GanttWeek {
  date: string;
  offset: number;
}

export interface GroupedItem {
  _type: 'group' | 'task';
  name?: string; // for groups
  id?: string;
  // ...task fields spread when _type === 'task'
  [key: string]: unknown;
}
