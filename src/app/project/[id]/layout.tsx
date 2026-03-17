"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { colors } from "@/lib/constants";
import { formatMoney, calcProjectProgress } from "@/lib/utils";
import type { ProjectStatus } from "@/types";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Upload,
  SlidersHorizontal,
  Search,
  Bell,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const PROJECT_STATUS_UI: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pendiente",   color: colors.textTertiary, bg: "rgba(99,99,102,0.15)" },
  in_progress: { label: "En Progreso", color: colors.accent,       bg: colors.accentSoft },
  completed:   { label: "Completado",  color: colors.green,        bg: colors.greenSoft },
  delayed:     { label: "Retrasado",   color: colors.red,          bg: colors.redSoft },
  review:      { label: "En Revisión", color: colors.orange,       bg: colors.orangeSoft },
};

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ progress, size = 72 }: { progress: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - progress / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.border} strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={colors.accent}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={fill}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

// ─── Tabs config ─────────────────────────────────────────────────────────────

const TABS = [
  { key: "gantt",   label: "Carta Gantt",    icon: BarChart3,        path: "gantt" },
  { key: "oc",      label: "OC y Sub-OCs",   icon: FileText,         path: "oc" },
  { key: "import",  label: "Importar",        icon: Upload,           path: "import" },
  { key: "compare", label: "Comparador",      icon: SlidersHorizontal, path: "compare" },
];

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useParams();
  const id       = params?.id as string;

  const { projects } = useProjectStore();
  const project  = projects.find((p) => p.id === id);
  const progress = project ? calcProjectProgress(project.tasks) : 0;
  const statusUI = project ? PROJECT_STATUS_UI[project.status] : null;
  const activeTab = TABS.find((t) => pathname?.endsWith(`/${t.path}`))?.key ?? "gantt";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg, color: colors.text }}>

      {/* ── Row 1: Global top bar ── */}
      <div
        className="h-12 flex items-center px-4 gap-3 shrink-0 border-b"
        style={{ background: colors.bg, borderColor: colors.border }}
      >
        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: colors.accent }}
          >
            G
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.text }}>GanttPro</span>
          <span className="text-sm" style={{ color: colors.borderLight }}>/</span>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm truncate max-w-[280px] transition-opacity hover:opacity-70"
            style={{ color: colors.textSecondary }}
          >
            {project?.name ?? "Proyecto"}
          </button>
        </div>

        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
          style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textTertiary, minWidth: 200 }}
        >
          <Search className="h-3 w-3 shrink-0" strokeWidth={2} />
          <span>Buscar...</span>
          <span className="ml-auto opacity-60">⌘K</span>
        </div>

        {/* Bell + avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="relative p-1.5 rounded-lg" style={{ color: colors.textSecondary }}>
            <Bell className="h-4 w-4" strokeWidth={1.5} />
            <span
              className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
              style={{ background: colors.red }}
            />
          </button>
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: `${colors.accent}30`, color: colors.accent, border: `1.5px solid ${colors.accent}40` }}
          >
            AJ
          </div>
        </div>
      </div>

      {/* ── Row 2: Project header ── */}
      {project && (
        <div
          className="px-5 pt-4 pb-0 shrink-0 border-b"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-start gap-4">
            {/* Back button */}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: colors.surfaceHover, color: colors.textSecondary }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </button>

            {/* Title + subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
                  {project.name}
                </h1>
                {statusUI && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ color: statusUI.color, background: statusUI.bg }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusUI.color }}
                    />
                    {statusUI.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                {project.client}
                <span style={{ color: colors.textTertiary }}> · </span>
                {project.oc}
                <span style={{ color: colors.textTertiary }}> · </span>
                {formatMoney(project.value)}
                <span style={{ color: colors.textTertiary }}> · </span>
                {project.subOCs.length} sub-OCs
                <span style={{ color: colors.textTertiary }}> · </span>
                Avance: <span style={{ color: colors.text, fontWeight: 600 }}>{progress}%</span>
              </p>
            </div>

            {/* Progress ring */}
            <div className="shrink-0 relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
              <ProgressRing progress={progress} size={72} />
              <span
                className="absolute text-xs font-bold"
                style={{ color: colors.accent }}
              >
                {progress}%
              </span>
            </div>
          </div>

          {/* ── Tabs ── */}
          <nav className="flex items-end gap-0 mt-3">
            {TABS.map(({ key, label, icon: Icon, path }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => router.push(`/project/${id}/${path}`)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all relative"
                  style={{
                    color: isActive ? colors.accent : colors.textSecondary,
                    borderBottom: isActive ? `2px solid ${colors.accent}` : "2px solid transparent",
                    background: isActive ? `${colors.accent}08` : "transparent",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2 : 1.5} />
                  {label}
                  {key === "oc" && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold ml-0.5"
                      style={{
                        background: isActive ? colors.accent : colors.surfaceActive,
                        color: isActive ? "#fff" : colors.textSecondary,
                      }}
                    >
                      {project.subOCs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
