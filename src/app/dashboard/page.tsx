"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { colors } from "@/lib/constants";
import { formatMoney, calcProjectProgress, todayISO, addDays, uid } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";
import { Plus, Search, Bell, ChevronRight, X } from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_UI: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pendiente",   color: colors.textTertiary, bg: "rgba(99,99,102,0.15)" },
  in_progress: { label: "En Progreso", color: colors.accent,       bg: `${colors.accent}22` },
  completed:   { label: "Completado",  color: colors.green,        bg: `${colors.green}22` },
  delayed:     { label: "Retrasado",   color: colors.red,          bg: `${colors.red}22` },
  review:      { label: "En Revisión", color: colors.orange,       bg: `${colors.orange}22` },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return formatMoney(v);
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ progress, color, size = 52 }: { progress: number; color: string; size?: number }) {
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - progress / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.border} strokeWidth={3.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={3.5}
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── New Project Modal ────────────────────────────────────────────────────────

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { addProject, setActiveProject } = useProjectStore();
  const router = useRouter();
  const today  = todayISO();

  const [name,   setName]   = useState("");
  const [client, setClient] = useState("");
  const [oc,     setOc]     = useState("");
  const [value,  setValue]  = useState("");
  const [start,  setStart]  = useState(today);
  const [end,    setEnd]    = useState(addDays(today, 90));
  const [status, setStatus] = useState<ProjectStatus>("pending");

  const inp   = "w-full rounded-xl px-3 py-2.5 text-sm outline-none border";
  const inpSt = { background: colors.surfaceHover, borderColor: colors.border, color: colors.text, colorScheme: "dark" as const };

  const handleCreate = () => {
    if (!name.trim() || !client.trim() || !oc.trim()) return;
    const newId = uid();
    addProject({
      name:   name.trim(),
      client: client.trim(),
      oc:     oc.trim(),
      value:  parseInt(value.replace(/\D/g, "")) || 0,
      status,
      start,
      end,
      ocDoc: { number: oc.trim(), date: today, payTerms: "", contact: "" },
      subOCs:      [],
      tasks:       [],
      baseTecnica: [],
      propuesta:   [],
    });
    // Navigate to the new project — find it by last added
    onClose();
    // The store addProject generates id internally; navigate to dashboard so user sees it
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl border p-6"
        style={{ background: colors.surface, borderColor: colors.borderLight }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold" style={{ color: colors.text }}>Nuevo Proyecto</h2>
            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>Completa los datos del contrato</p>
          </div>
          <button onClick={onClose} style={{ color: colors.textTertiary }}><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Nombre del proyecto *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inp} style={inpSt} placeholder="BTA-002-26 Decanter GEA" autoFocus />
          </div>

          {/* Client + OC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Cliente *</label>
              <input type="text" value={client} onChange={e => setClient(e.target.value)} className={inp} style={inpSt} placeholder="VOLTIFY" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>N° OC *</label>
              <input type="text" value={oc} onChange={e => setOc(e.target.value)} className={inp} style={inpSt} placeholder="OC-4521" />
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Valor del contrato (CLP)</label>
            <input type="text" value={value} onChange={e => setValue(e.target.value)} className={inp} style={inpSt} placeholder="48500000" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Fecha inicio</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className={inp} style={inpSt} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Fecha fin</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className={inp} style={inpSt} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Estado</label>
            <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className={inp} style={inpSt}>
              {Object.entries(STATUS_UI).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: colors.textSecondary, background: colors.surfaceHover }}>
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !client.trim() || !oc.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{ background: colors.accent, opacity: (!name.trim() || !client.trim() || !oc.trim()) ? 0.4 : 1 }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Crear Proyecto
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const progress = calcProjectProgress(project.tasks);
  const st       = STATUS_UI[project.status];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all group"
      style={{ background: colors.surface, borderColor: colors.border }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = colors.borderLight}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border}
    >
      {/* Progress ring */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: 52, height: 52 }}>
        <ProgressRing progress={progress} color={st.color} size={52} />
        <span className="absolute text-[9px] font-bold" style={{ color: st.color }}>{progress}%</span>
      </div>

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: colors.text }}>{project.name}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: colors.textSecondary }}>
          {project.client}
          <span style={{ color: colors.textTertiary }}> · </span>
          {project.oc}
          {project.subOCs.length > 0 && (
            <>
              <span style={{ color: colors.textTertiary }}> · </span>
              <span style={{ color: colors.accent }}>{project.subOCs.length} sub-OCs</span>
            </>
          )}
        </p>
      </div>

      {/* Value */}
      <div className="hidden sm:block text-sm font-semibold shrink-0" style={{ color: colors.text }}>
        {formatMoney(project.value)}
      </div>

      {/* End date */}
      <div className="hidden md:block text-xs shrink-0" style={{ color: colors.textTertiary }}>
        {project.end}
      </div>

      {/* Status badge */}
      <div
        className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0"
        style={{ color: st.color, background: st.bg, minWidth: 110, justifyContent: "center" }}
      >
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: st.color }} />
        {st.label}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: colors.textSecondary }} strokeWidth={2} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router   = useRouter();
  const { projects } = useProjectStore();
  const [showModal, setShowModal] = useState(false);

  // Stats
  const active      = projects.filter(p => p.status === "in_progress").length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((s, p) => s + calcProjectProgress(p.tasks), 0) / projects.length)
    : 0;
  const totalSubOCs = projects.reduce((s, p) => s + p.subOCs.length, 0);
  const totalValue  = projects.reduce((s, p) => s + p.value, 0);

  const stats = [
    { label: "PROYECTOS ACTIVOS", value: active,           sub: `de ${projects.length}`,          color: colors.accent  },
    { label: "AVANCE PROMEDIO",   value: `${avgProgress}%`, sub: "por tareas",                    color: colors.green   },
    { label: "SUB-OCS TOTAL",     value: totalSubOCs,       sub: "en todos los proyectos",        color: colors.purple  },
    { label: "VALOR TOTAL",       value: fmtM(totalValue),  sub: "CLP en contratos",              color: colors.orange  },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg, color: colors.text }}>

      {/* ── Top bar ── */}
      <div
        className="h-12 flex items-center px-5 gap-3 shrink-0 border-b"
        style={{ background: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-center gap-2 flex-1">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: colors.accent }}
          >
            G
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.text }}>GanttPro</span>
        </div>
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textTertiary, minWidth: 200 }}
        >
          <Search className="h-3 w-3 shrink-0" strokeWidth={2} />
          <span>Buscar...</span>
          <span className="ml-auto opacity-60">⌘K</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="relative p-1.5 rounded-lg" style={{ color: colors.textSecondary }}>
            <Bell className="h-4 w-4" strokeWidth={1.5} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full" style={{ background: colors.red }} />
          </button>
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: `${colors.accent}30`, color: colors.accent, border: `1.5px solid ${colors.accent}40` }}
          >
            AJ
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">

        {/* Title row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Resumen general de proyectos y contratos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: colors.accent }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-2xl border p-5"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.textTertiary }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs mt-1.5" style={{ color: colors.textTertiary }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Project list */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: colors.text }}>Proyectos</h2>
          <div className="space-y-3">
            {projects.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                onClick={() => router.push(`/project/${project.id}/gantt`)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
