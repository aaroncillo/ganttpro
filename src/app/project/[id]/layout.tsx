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
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ─── Status config ───────────────────────────────────────────────────────────

const PROJECT_STATUS_UI: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pendiente", color: colors.textTertiary, bg: "rgba(99,99,102,0.12)" },
  in_progress: { label: "En Progreso", color: colors.accent, bg: colors.accentSoft },
  completed: { label: "Completado", color: colors.green, bg: colors.greenSoft },
  delayed: { label: "Retrasado", color: colors.red, bg: colors.redSoft },
  review: { label: "En Revisión", color: colors.orange, bg: colors.orangeSoft },
};

const STATUS_ICON: Record<ProjectStatus, React.ElementType> = {
  in_progress: Clock,
  completed: CheckCircle2,
  delayed: AlertTriangle,
  pending: Clock,
  review: Clock,
};

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "gantt", label: "Carta Gantt", icon: BarChart3, path: "gantt" },
  { key: "oc", label: "OC y Sub-OCs", icon: FileText, path: "oc" },
  { key: "import", label: "Importar", icon: Upload, path: "import" },
  { key: "compare", label: "Comparador", icon: SlidersHorizontal, path: "compare" },
];

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;

  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === id);

  const progress = project ? calcProjectProgress(project.tasks) : 0;

  const statusUI = project ? PROJECT_STATUS_UI[project.status] : null;
  const StatusIcon = project ? STATUS_ICON[project.status] : Clock;

  // Determine active tab from pathname
  const activeTab = TABS.find((t) => pathname?.endsWith(`/${t.path}`))?.key ?? "gantt";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: colors.bg, color: colors.text }}
    >
      {/* ── Top header bar ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: colors.bg + "F0",
          borderColor: colors.border,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Main header row */}
        <div className="h-14 flex items-center justify-between px-4 gap-4">
          {/* Left: back + project name + status */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
              style={{
                color: colors.textSecondary,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = colors.surfaceHover;
                (e.currentTarget as HTMLButtonElement).style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = colors.textSecondary;
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Proyectos
            </button>

            {/* Separator */}
            <span style={{ color: colors.borderLight }}>/</span>

            {/* Project name */}
            <span
              className="text-sm font-semibold truncate max-w-[200px] md:max-w-xs"
              style={{ color: colors.text }}
            >
              {project?.name ?? "Proyecto"}
            </span>

            {/* Status badge */}
            {statusUI && (
              <span
                className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ color: statusUI.color, background: statusUI.bg }}
              >
                <StatusIcon className="h-3 w-3" strokeWidth={2} />
                {statusUI.label}
              </span>
            )}
          </div>

          {/* Right: meta */}
          {project && (
            <div className="hidden md:flex items-center gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                  Contrato
                </p>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  {formatMoney(project.value)}
                </p>
              </div>
              <div
                className="w-px h-8"
                style={{ background: colors.border }}
              />
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                  Avance
                </p>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  {progress}%
                </p>
              </div>
              <div
                className="w-px h-8"
                style={{ background: colors.border }}
              />
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                  Sub-OCs
                </p>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  {project.subOCs.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <nav
          className="flex items-end px-4 gap-0"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          {TABS.map(({ key, label, icon: Icon, path }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => router.push(`/project/${id}/${path}`)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors relative"
                style={{
                  color: isActive ? colors.accent : colors.textSecondary,
                  borderBottom: isActive ? `2px solid ${colors.accent}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = colors.textSecondary;
                  }
                }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2 : 1.5} />
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  );
}
