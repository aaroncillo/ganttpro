"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  colors,
  GROUP_COLORS,
  TASK_STATUS,
  GANTT,
} from "@/lib/constants";
import {
  formatISO,
  addDays,
  diffDays,
  formatShort,
  formatMonthYear,
  todayISO,
  uid,
} from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import { parseISO, startOfMonth, endOfMonth, addMonths, getDaysInMonth } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DragState {
  type: "move" | "resize-left" | "resize-right";
  taskId: string;
  startX: number;
  origStart: string;
  origEnd: string;
}

interface ModalState {
  mode: "add" | "edit";
  task?: Task;
}

interface GanttRange {
  start: string;
  end: string;
  days: number;
}

interface GanttMonth {
  label: string;
  startOff: number;
  days: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRange(tasks: Task[]): GanttRange {
  if (tasks.length === 0) {
    const today = todayISO();
    return {
      start: addDays(today, -GANTT.PADDING_DAYS_BEFORE),
      end: addDays(today, GANTT.PADDING_DAYS_AFTER + 60),
      days: GANTT.PADDING_DAYS_BEFORE + GANTT.PADDING_DAYS_AFTER + 60,
    };
  }
  const starts = tasks.map((t) => t.start).sort();
  const ends = tasks.map((t) => t.end).sort();
  const minStart = starts[0];
  const maxEnd = ends[ends.length - 1];
  const rangeStart = addDays(minStart, -GANTT.PADDING_DAYS_BEFORE);
  const rangeEnd = addDays(maxEnd, GANTT.PADDING_DAYS_AFTER);
  const days = diffDays(rangeStart, rangeEnd);
  return { start: rangeStart, end: rangeEnd, days };
}

function buildMonths(range: GanttRange): GanttMonth[] {
  const months: GanttMonth[] = [];
  const rangeStart = parseISO(range.start);
  let cursor = startOfMonth(rangeStart);

  while (formatISO(cursor) <= range.end) {
    const monthEnd = endOfMonth(cursor);
    const visStart = cursor < rangeStart ? rangeStart : cursor;
    const visEnd = monthEnd > parseISO(range.end) ? parseISO(range.end) : monthEnd;

    const startOff = Math.max(0, diffDays(range.start, formatISO(visStart)));
    const daysInMonth = diffDays(formatISO(visStart), formatISO(visEnd)) + 1;

    months.push({
      label: formatMonthYear(cursor),
      startOff,
      days: daysInMonth,
    });

    cursor = addMonths(cursor, 1);
  }
  return months;
}

function getGroups(tasks: Task[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tasks) {
    if (!seen.has(t.group)) {
      seen.add(t.group);
      result.push(t.group);
    }
  }
  return result;
}

function getGroupColor(groups: string[], groupName: string): string {
  const idx = groups.indexOf(groupName);
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({
  modalState,
  projectId,
  existingGroups,
  onClose,
}: {
  modalState: ModalState;
  projectId: string;
  existingGroups: string[];
  onClose: () => void;
}) {
  const { addTask, updateTask, deleteTask } = useProjectStore();
  const today = todayISO();
  const isEdit = modalState.mode === "edit";
  const initial = modalState.task;

  const [name, setName] = useState(initial?.name ?? "");
  const [group, setGroup] = useState(initial?.group ?? existingGroups[0] ?? "");
  const [start, setStart] = useState(initial?.start ?? today);
  const [end, setEnd] = useState(initial?.end ?? addDays(today, 7));
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "pending");

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), group: group || "General", start, end, progress, status };
    if (isEdit && initial) {
      updateTask(projectId, initial.id, payload);
    } else {
      addTask(projectId, payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEdit && initial) {
      deleteTask(projectId, initial.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl border p-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: colors.text }}>
            {isEdit ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button onClick={onClose} style={{ color: colors.textTertiary }}>
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={{
                background: colors.surfaceHover,
                borderColor: colors.border,
                color: colors.text,
              }}
              placeholder="Nombre de la tarea..."
              autoFocus
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Grupo / Fase
            </label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              list="group-options"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={{
                background: colors.surfaceHover,
                borderColor: colors.border,
                color: colors.text,
              }}
              placeholder="Ingeniería, Procura, Montaje..."
            />
            <datalist id="group-options">
              {existingGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                Inicio
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                style={{
                  background: colors.surfaceHover,
                  borderColor: colors.border,
                  color: colors.text,
                  colorScheme: "dark",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                Fin
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                style={{
                  background: colors.surfaceHover,
                  borderColor: colors.border,
                  color: colors.text,
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                Avance
              </label>
              <span className="text-xs font-semibold" style={{ color: colors.text }}>
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: colors.accent }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={{
                background: colors.surfaceHover,
                borderColor: colors.border,
                color: colors.text,
                colorScheme: "dark",
              }}
            >
              {Object.entries(TASK_STATUS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: colors.red, background: colors.redSoft }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Eliminar
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-medium"
              style={{ color: colors.textSecondary, background: colors.surfaceHover }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: colors.accent }}
          >
            {isEdit ? "Guardar" : "Crear Tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GanttPage() {
  const params = useParams();
  const id = params?.id as string;

  const { projects, updateTask } = useProjectStore();
  const project = projects.find((p) => p.id === id);
  const tasks = project?.tasks ?? [];

  const [zoom, setZoom] = useState<number>(GANTT.DEFAULT_ZOOM);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState | null>(null);

  const rightPanelRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const syncingRef = useRef(false);

  // Build derived data
  const range = buildRange(tasks);
  const months = buildMonths(range);
  const groups = getGroups(tasks);
  const today = todayISO();
  const todayOff = diffDays(range.start, today);

  // ── Scroll sync ────────────────────────────────────────────────────────────

  const handleRightScroll = useCallback(() => {
    if (syncingRef.current) return;
    const right = rightPanelRef.current;
    const left = leftPanelRef.current;
    if (!right || !left) return;
    syncingRef.current = true;
    left.scrollTop = right.scrollTop;
    syncingRef.current = false;
  }, []);

  // ── Auto-scroll to today ──────────────────────────────────────────────────

  useEffect(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    const offset = todayOff * zoom - panel.clientWidth / 2 + 100;
    panel.scrollLeft = Math.max(0, offset);
  }, [todayOff, zoom]);

  // ── Drag / Resize ─────────────────────────────────────────────────────────

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !project) return;
      const rawDelta = e.clientX - drag.startX;
      const delta = Math.round(rawDelta / zoom);
      if (delta === 0) return;

      let newStart = drag.origStart;
      let newEnd = drag.origEnd;

      if (drag.type === "move") {
        newStart = addDays(drag.origStart, delta);
        newEnd = addDays(drag.origEnd, delta);
      } else if (drag.type === "resize-left") {
        newStart = addDays(drag.origStart, delta);
        // Ensure at least 1 day
        if (newStart >= drag.origEnd) newStart = addDays(drag.origEnd, -1);
      } else if (drag.type === "resize-right") {
        newEnd = addDays(drag.origEnd, delta);
        if (newEnd <= drag.origStart) newEnd = addDays(drag.origStart, 1);
      }

      updateTask(project.id, drag.taskId, { start: newStart, end: newEnd });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [zoom, project, updateTask]);

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      type: DragState["type"],
      task: Task
    ) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        type,
        taskId: task.id,
        startX: e.clientX,
        origStart: task.start,
        origEnd: task.end,
      };
      document.body.style.userSelect = "none";
      if (type === "move") document.body.style.cursor = "grabbing";
      else document.body.style.cursor = "ew-resize";
    },
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (!project) {
    return (
      <div
        className="flex items-center justify-center h-64 text-sm"
        style={{ color: colors.textTertiary }}
      >
        Proyecto no encontrado
      </div>
    );
  }

  const totalWidth = range.days * zoom;

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  // Build flat row list for synchronized scrolling
  interface RowItem {
    type: "group" | "task";
    groupName?: string;
    task?: Task;
    groupColor?: string;
  }

  const rows: RowItem[] = [];
  for (const groupName of groups) {
    const groupColor = getGroupColor(groups, groupName);
    const groupTasks = tasks.filter((t) => t.group === groupName);
    rows.push({ type: "group", groupName, groupColor });
    if (!collapsedGroups.has(groupName)) {
      for (const task of groupTasks) {
        rows.push({ type: "task", task, groupColor });
      }
    }
  }

  const bodyHeight = rows.length * GANTT.ROW_HEIGHT;

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100vh - 110px)",
        background: colors.bg,
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(GANTT.MIN_ZOOM, z - 1))}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: colors.textSecondary, background: colors.surfaceHover }}
            title="Alejar"
          >
            <ZoomOut className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <span
            className="text-xs font-mono w-16 text-center"
            style={{ color: colors.textTertiary }}
          >
            {zoom}px/día
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(GANTT.MAX_ZOOM, z + 1))}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: colors.textSecondary, background: colors.surfaceHover }}
            title="Acercar"
          >
            <ZoomIn className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        {/* Today button */}
        <button
          onClick={() => {
            const panel = rightPanelRef.current;
            if (!panel) return;
            const offset = todayOff * zoom - panel.clientWidth / 2 + 100;
            panel.scrollLeft = Math.max(0, offset);
          }}
          className="text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
          style={{ color: colors.accent, background: colors.accentSoft }}
        >
          Hoy
        </button>

        <div className="flex-1" />

        {/* New task */}
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
          style={{ background: colors.accent }}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Nueva Tarea
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left panel (task list) ── */}
        <div
          className="shrink-0 flex flex-col border-r"
          style={{
            width: 240,
            borderColor: colors.border,
            background: colors.bg,
          }}
        >
          {/* Header */}
          <div
            className="shrink-0 flex items-end px-4 pb-2 border-b"
            style={{
              height: GANTT.HEADER_HEIGHT,
              borderColor: colors.border,
              background: colors.surface,
            }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: colors.textTertiary }}
            >
              Tarea
            </span>
          </div>

          {/* Rows */}
          <div
            ref={leftPanelRef}
            className="flex-1 overflow-hidden"
            style={{ overflowY: "hidden" }}
          >
            <div style={{ height: bodyHeight }}>
              {rows.map((row, i) => {
                if (row.type === "group") {
                  const groupTasks = tasks.filter((t) => t.group === row.groupName);
                  const isCollapsed = collapsedGroups.has(row.groupName!);
                  return (
                    <div
                      key={`group-${row.groupName}`}
                      className="flex items-center gap-2 px-4 cursor-pointer select-none"
                      style={{
                        height: GANTT.ROW_HEIGHT,
                        background: colors.surfaceHover,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                      onClick={() => toggleGroup(row.groupName!)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 shrink-0" style={{ color: colors.textTertiary }} strokeWidth={2} />
                      ) : (
                        <ChevronDown className="h-3 w-3 shrink-0" style={{ color: colors.textTertiary }} strokeWidth={2} />
                      )}
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: row.groupColor }}
                      />
                      <span
                        className="text-xs font-semibold flex-1 truncate"
                        style={{ color: colors.text }}
                      >
                        {row.groupName}
                      </span>
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: colors.textTertiary }}
                      >
                        {groupTasks.length}
                      </span>
                    </div>
                  );
                }

                const task = row.task!;
                const statusCfg = TASK_STATUS[task.status];
                return (
                  <div
                    key={`task-${task.id}`}
                    className="flex items-center gap-2 px-4 cursor-pointer transition-colors"
                    style={{
                      height: GANTT.ROW_HEIGHT,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                    onClick={() => setModal({ mode: "edit", task })}
                  >
                    <div className="w-3 shrink-0" />
                    <span
                      className="flex-1 text-xs truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      {task.name}
                    </span>
                    <span
                      className="shrink-0 text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                      style={{ color: statusCfg.color, background: statusCfg.bg }}
                    >
                      {task.progress}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right panel (timeline) ── */}
        <div
          ref={rightPanelRef}
          className="flex-1 overflow-auto"
          onScroll={handleRightScroll}
        >
          <div style={{ width: totalWidth, minWidth: totalWidth }}>
            {/* Timeline header */}
            <div
              className="sticky top-0 z-10 border-b"
              style={{
                height: GANTT.HEADER_HEIGHT,
                borderColor: colors.border,
                background: colors.surface,
                position: "sticky",
              }}
            >
              {/* Month labels */}
              <div className="relative" style={{ height: 32 }}>
                {months.map((month, i) => (
                  <div
                    key={i}
                    className="absolute top-0 flex items-center px-2"
                    style={{
                      left: month.startOff * zoom,
                      width: month.days * zoom,
                      height: 32,
                      borderLeft: `1px solid ${colors.border}`,
                    }}
                  >
                    <span
                      className="text-[11px] font-semibold capitalize truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day numbers row */}
              <div
                className="relative flex items-center"
                style={{ height: 32, overflowX: "hidden" }}
              >
                {Array.from({ length: range.days }).map((_, dayIdx) => {
                  const date = parseISO(addDays(range.start, dayIdx));
                  const dom = date.getDate();
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  // Show label only for multiples of 7 or when zoom is big
                  const showLabel = zoom >= 6 ? true : dom === 1 || dom % 7 === 1;
                  if (!showLabel) return null;
                  return (
                    <span
                      key={dayIdx}
                      className="absolute text-[9px] text-center"
                      style={{
                        left: dayIdx * zoom,
                        width: zoom * (zoom >= 6 ? 1 : 7),
                        color: isWeekend ? colors.textTertiary : colors.textTertiary,
                        opacity: isWeekend ? 0.5 : 0.8,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      {dom}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Rows body */}
            <div style={{ height: bodyHeight, position: "relative" }}>
              {/* Month boundary lines */}
              {months.map((month, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 pointer-events-none"
                  style={{
                    left: month.startOff * zoom,
                    width: 1,
                    background: colors.border,
                    opacity: 0.5,
                  }}
                />
              ))}

              {/* Today line */}
              {todayOff >= 0 && todayOff <= range.days && (
                <div
                  className="absolute inset-y-0 pointer-events-none z-20"
                  style={{
                    left: todayOff * zoom,
                    width: 2,
                    background: colors.accent,
                    opacity: 0.7,
                  }}
                />
              )}

              {/* Rows */}
              {rows.map((row, rowIdx) => {
                const top = rowIdx * GANTT.ROW_HEIGHT;

                if (row.type === "group") {
                  return (
                    <div
                      key={`grow-${row.groupName}`}
                      className="absolute w-full"
                      style={{
                        top,
                        height: GANTT.ROW_HEIGHT,
                        background: colors.surfaceHover,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    />
                  );
                }

                const task = row.task!;
                const statusCfg = TASK_STATUS[task.status];
                const barLeft = diffDays(range.start, task.start) * zoom;
                const barWidth = Math.max(diffDays(task.start, task.end) * zoom, 4);
                const barTop = top + (GANTT.ROW_HEIGHT - GANTT.BAR_HEIGHT) / 2;

                return (
                  <div
                    key={`trow-${task.id}`}
                    className="absolute w-full"
                    style={{
                      top,
                      height: GANTT.ROW_HEIGHT,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    {/* Task bar */}
                    <div
                      className="absolute rounded-lg overflow-hidden select-none"
                      style={{
                        left: barLeft,
                        top: barTop - top,
                        width: barWidth,
                        height: GANTT.BAR_HEIGHT,
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.color}40`,
                        cursor: "grab",
                      }}
                      onMouseDown={(e) => startDrag(e, "move", task)}
                      onDoubleClick={() => setModal({ mode: "edit", task })}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${task.progress}%`,
                          background: `${statusCfg.color}70`,
                          borderRadius: "inherit",
                        }}
                      />

                      {/* Label */}
                      {barWidth > 40 && (
                        <span
                          className="absolute inset-0 flex items-center px-2 text-[10px] font-medium truncate pointer-events-none"
                          style={{ color: statusCfg.color, zIndex: 1 }}
                        >
                          {task.name}
                        </span>
                      )}

                      {/* Left resize handle */}
                      <div
                        className="absolute inset-y-0 left-0 z-10"
                        style={{ width: 8, cursor: "ew-resize" }}
                        onMouseDown={(e) => startDrag(e, "resize-left", task)}
                      />

                      {/* Right resize handle */}
                      <div
                        className="absolute inset-y-0 right-0 z-10"
                        style={{ width: 8, cursor: "ew-resize" }}
                        onMouseDown={(e) => startDrag(e, "resize-right", task)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <TaskModal
          modalState={modal}
          projectId={id}
          existingGroups={groups}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
