"use client";

import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { colors, TASK_STATUS } from "@/lib/constants";
import { formatShort, formatMoney, calcProjectProgress } from "@/lib/utils";
import type { Project } from "@/types";
import {
  BarChart3,
  FolderOpen,
  LayoutGrid,
  Settings,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  DollarSign,
  Plus,
  Zap,
} from "lucide-react";

// ─── Status config (UI español) ────────────────────────────────────────────

const PROJECT_STATUS_UI: Record<
  Project["status"],
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pendiente",
    color: colors.textTertiary,
    bg: "rgba(99,99,102,0.12)",
  },
  in_progress: {
    label: "En Progreso",
    color: colors.accent,
    bg: colors.accentSoft,
  },
  completed: {
    label: "Completado",
    color: colors.green,
    bg: colors.greenSoft,
  },
  delayed: { label: "Retrasado", color: colors.red, bg: colors.redSoft },
  review: {
    label: "En Revisión",
    color: colors.orange,
    bg: colors.orangeSoft,
  },
};

const STATUS_ICON: Record<Project["status"], React.ElementType> = {
  in_progress: Clock,
  completed: CheckCircle2,
  delayed: AlertTriangle,
  pending: Clock,
  review: Clock,
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 transition-colors"
      style={{
        background: colors.surface,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: colors.textTertiary }}
          >
            {label}
          </p>
          <p
            className="mt-2 text-3xl font-semibold tracking-tight"
            style={{ color: colors.text }}
          >
            {value}
          </p>
          <p className="mt-1 text-xs" style={{ color: colors.textTertiary }}>
            {sub}
          </p>
        </div>
        <div
          className="shrink-0 rounded-xl p-2.5"
          style={{ background: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  isActive,
  onClick,
}: {
  project: Project;
  isActive: boolean;
  onClick: () => void;
}) {
  const statusUI = PROJECT_STATUS_UI[project.status];
  const StatusIcon = STATUS_ICON[project.status];
  const progress = calcProjectProgress(project.tasks);
  const doneTasks = project.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  const inProgressTasks = project.tasks.filter(
    (t) => t.status === "in_progress"
  ).length;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border p-5 text-left transition-all"
      style={{
        background: isActive ? colors.surfaceActive : colors.surface,
        borderColor: isActive ? colors.borderLight : colors.border,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: colors.text }}
            >
              {project.name}
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{ color: statusUI.color, background: statusUI.bg }}
            >
              <StatusIcon className="h-3 w-3" strokeWidth={2} />
              {statusUI.label}
            </span>
          </div>
          <p
            className="mt-0.5 text-xs"
            style={{ color: colors.textTertiary }}
          >
            {project.client} &middot; {project.oc}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-sm font-semibold" style={{ color: colors.text }}>
            {formatMoney(project.value)}
          </span>
          <ChevronRight
            className="h-4 w-4 transition-transform"
            style={{
              color: isActive ? colors.text : colors.textTertiary,
              transform: isActive ? "rotate(90deg)" : "rotate(0)",
            }}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 rounded-full overflow-hidden"
          style={{ background: colors.border }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background:
                project.status === "delayed"
                  ? colors.red
                  : project.status === "completed"
                  ? colors.green
                  : colors.accent,
            }}
          />
        </div>
        <span
          className="text-xs font-semibold w-8 text-right"
          style={{ color: colors.text }}
        >
          {progress}%
        </span>
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: colors.textTertiary }}>
        <div className="flex items-center gap-3">
          <span>{formatShort(project.start)} → {formatShort(project.end)}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            {doneTasks}/{project.tasks.length} tareas
          </span>
          {inProgressTasks > 0 && (
            <span
              className="hidden sm:inline-flex items-center gap-1"
              style={{ color: colors.accent }}
            >
              <Zap className="h-3 w-3" />
              {inProgressTasks} activas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {project.subOCs.slice(0, 4).map((s) => (
            <div
              key={s.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  s.status === "cerrada"
                    ? colors.green
                    : s.status === "vigente"
                    ? colors.accent
                    : s.status === "con_observaciones"
                    ? colors.red
                    : colors.orange,
              }}
              title={`${s.number}: ${s.status}`}
            />
          ))}
          {project.subOCs.length > 0 && (
            <span className="ml-1">{project.subOCs.length} sub-OC{project.subOCs.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Expanded: task breakdown */}
      {isActive && (
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: colors.textTertiary }}
          >
            Tareas
          </p>
          <div className="space-y-1.5">
            {project.tasks.map((task) => {
              const taskSt = TASK_STATUS[task.status];
              return (
                <div key={task.id} className="flex items-center gap-3">
                  <div
                    className="h-1 w-1 rounded-full shrink-0"
                    style={{ background: taskSt?.color ?? colors.textTertiary }}
                  />
                  <span
                    className="flex-1 text-xs truncate"
                    style={{ color: colors.textSecondary }}
                  >
                    {task.name}
                  </span>
                  <div
                    className="h-1 w-14 rounded-full overflow-hidden"
                    style={{ background: colors.border }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${task.progress}%`,
                        background: taskSt?.color ?? colors.textTertiary,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] w-7 text-right shrink-0"
                    style={{ color: colors.textTertiary }}
                  >
                    {task.progress}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { projects, activeProjectId, setActiveProject } = useProjectStore();

  // Computed stats
  const totalValue = projects.reduce((s, p) => s + p.value, 0);
  const inProgress = projects.filter((p) => p.status === "in_progress").length;
  const delayed = projects.filter((p) => p.status === "delayed").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const avgProgress = Math.round(
    projects.reduce((s, p) => s + calcProjectProgress(p.tasks), 0) /
      (projects.length || 1)
  );

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: true },
    { icon: FolderOpen, label: "Proyectos" },
    { icon: BarChart3, label: "Reportes" },
    { icon: Users, label: "Equipo" },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ background: colors.bg, color: colors.text }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 w-56 flex flex-col z-20 border-r"
        style={{ background: colors.bg, borderColor: colors.border }}
      >
        {/* Logo */}
        <div
          className="h-14 flex items-center px-5 border-b"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: colors.accent }}
            >
              <BarChart3 className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: colors.text }}
            >
              GanttPro
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors"
              style={{
                background: active ? colors.surfaceActive : "transparent",
                color: active ? colors.text : colors.textSecondary,
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div
          className="px-3 pb-4 pt-3 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: colors.textSecondary }}
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
            Configuración
          </button>
          <div className="mt-2 flex items-center gap-3 px-3 py-1">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: colors.surfaceActive,
                color: colors.textSecondary,
              }}
            >
              AD
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: colors.text }}
              >
                Aaron Deik
              </p>
              <p className="text-[10px]" style={{ color: colors.textTertiary }}>
                Administrador
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="pl-56 flex-1">
        {/* Header */}
        <header
          className="sticky top-0 z-10 h-14 flex items-center justify-between px-7 border-b backdrop-blur-md"
          style={{
            background: colors.bg + "E6",
            borderColor: colors.border,
          }}
        >
          <div>
            <h1
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              Dashboard
            </h1>
            <p className="text-xs" style={{ color: colors.textTertiary }}>
              {new Date().toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: colors.accent }}
            onClick={() => router.push("/project/new")}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Nuevo Proyecto
          </button>
        </header>

        {/* Content */}
        <main className="px-7 py-7 max-w-5xl">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Proyectos"
              value={projects.length}
              sub={`${inProgress} en progreso`}
              icon={FolderOpen}
              iconColor={colors.accent}
              iconBg={colors.accentSoft}
            />
            <StatCard
              label="Valor Total"
              value={formatMoney(totalValue)}
              sub={`${completed} completado${completed !== 1 ? "s" : ""}`}
              icon={DollarSign}
              iconColor={colors.green}
              iconBg={colors.greenSoft}
            />
            <StatCard
              label="Avance Promedio"
              value={`${avgProgress}%`}
              sub="sobre todas las tareas"
              icon={TrendingUp}
              iconColor={colors.purple}
              iconBg={colors.purpleSoft}
            />
            <StatCard
              label="Retrasados"
              value={delayed}
              sub={delayed > 0 ? "requieren atención" : "todo en plazo"}
              icon={AlertTriangle}
              iconColor={delayed > 0 ? colors.red : colors.green}
              iconBg={delayed > 0 ? colors.redSoft : colors.greenSoft}
            />
          </div>

          {/* Project list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: colors.text }}>
                Contratos
                <span
                  className="ml-2 font-normal"
                  style={{ color: colors.textTertiary }}
                >
                  {projects.length}
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={activeProjectId === project.id}
                  onClick={() =>
                    setActiveProject(
                      activeProjectId === project.id ? null : project.id
                    )
                  }
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
