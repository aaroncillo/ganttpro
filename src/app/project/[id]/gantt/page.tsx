"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { colors, GROUP_COLORS, TASK_STATUS, GANTT } from "@/lib/constants";
import { formatISO, addDays, diffDays, todayISO, uid } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { Plus, ZoomIn, ZoomOut, Clock, X, Trash2 } from "lucide-react";
import { parseISO, startOfMonth, endOfMonth, addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_PANEL_W = 330;   // total left panel width
const COL_NAME_W   = 170;   // TAREA column
const COL_DATE_W   = 80;    // Inicio / Fin columns
const HDR_MONTH_H  = 28;    // month header row height
const HDR_WEEK_H   = 26;    // week header row height
const HDR_H        = HDR_MONTH_H + HDR_WEEK_H;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtD = (d: string) => format(parseISO(d), "dd-MMM.", { locale: es });

interface GanttRange { start: string; end: string; days: number }
interface GanttMonth { label: string; startOff: number; days: number }
interface WeekTick   { label: string; offset: number }

function buildRange(tasks: Task[]): GanttRange {
  if (!tasks.length) {
    const t = todayISO();
    return { start: addDays(t, -30), end: addDays(t, 90), days: 120 };
  }
  const s = tasks.map(t => t.start).sort()[0];
  const e = tasks.map(t => t.end).sort().at(-1)!;
  const start = addDays(s, -GANTT.PADDING_DAYS_BEFORE);
  const end   = addDays(e, GANTT.PADDING_DAYS_AFTER);
  return { start, end, days: diffDays(start, end) };
}

function buildMonths(r: GanttRange): GanttMonth[] {
  const result: GanttMonth[] = [];
  const rs = parseISO(r.start);
  const re = parseISO(r.end);
  let cur = startOfMonth(rs);
  while (cur <= re) {
    const mEnd   = endOfMonth(cur);
    const visS   = cur < rs ? rs : cur;
    const visE   = mEnd > re ? re : mEnd;
    result.push({
      label:    format(cur, "MMM. yyyy", { locale: es }),
      startOff: Math.max(0, diffDays(r.start, formatISO(visS))),
      days:     diffDays(formatISO(visS), formatISO(visE)) + 1,
    });
    cur = addMonths(cur, 1);
  }
  return result;
}

function buildWeeks(r: GanttRange): WeekTick[] {
  const ticks: WeekTick[] = [];
  for (let i = 0; i < r.days; i += 7) {
    const d = parseISO(addDays(r.start, i));
    ticks.push({ label: format(d, "dd-MMM.", { locale: es }), offset: i });
  }
  return ticks;
}

function getGroups(tasks: Task[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tasks) if (!seen.has(t.group)) { seen.add(t.group); result.push(t.group); }
  return result;
}

function groupColor(groups: string[], g: string) {
  return GROUP_COLORS[groups.indexOf(g) % GROUP_COLORS.length];
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({
  mode, task, projectId, existingGroups, onClose,
}: {
  mode: "add" | "edit";
  task?: Task;
  projectId: string;
  existingGroups: string[];
  onClose: () => void;
}) {
  const { addTask, updateTask, deleteTask } = useProjectStore();
  const today = todayISO();
  const [name,     setName]     = useState(task?.name     ?? "");
  const [group,    setGroup]    = useState(task?.group    ?? existingGroups[0] ?? "");
  const [start,    setStart]    = useState(task?.start    ?? today);
  const [end,      setEnd]      = useState(task?.end      ?? addDays(today, 7));
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [status,   setStatus]   = useState<TaskStatus>(task?.status ?? "pending");

  const save = () => {
    if (!name.trim()) return;
    const p = { name: name.trim(), group: group || "General", start, end, progress, status };
    if (mode === "edit" && task) updateTask(projectId, task.id, p);
    else addTask(projectId, p);
    onClose();
  };

  const inp = "w-full rounded-xl px-3 py-2 text-sm outline-none border";
  const inpStyle = { background: colors.surfaceHover, borderColor: colors.border, color: colors.text };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[460px] rounded-2xl border p-6" style={{ background: colors.surface, borderColor: colors.borderLight }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: colors.text }}>
            {mode === "edit" ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button onClick={onClose} style={{ color: colors.textTertiary }}><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inp} style={inpStyle} placeholder="Nombre de la tarea..." autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>Grupo / Fase</label>
            <input type="text" value={group} onChange={e => setGroup(e.target.value)} list="grp" className={inp} style={inpStyle} placeholder="Ingeniería, Procura, Montaje..." />
            <datalist id="grp">{existingGroups.map(g => <option key={g} value={g} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["Inicio", start, setStart], ["Fin", end, setEnd]].map(([lbl, val, set]) => (
              <div key={lbl as string}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{lbl as string}</label>
                <input type="date" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: colors.textSecondary }}>Avance</label>
              <span className="text-xs font-semibold" style={{ color: colors.text }}>{progress}%</span>
            </div>
            <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(+e.target.value)} className="w-full" style={{ accentColor: colors.accent }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>Estado</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className={inp} style={{ ...inpStyle, colorScheme: "dark" }}>
              {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          {mode === "edit" && task ? (
            <button onClick={() => { deleteTask(projectId, task.id); onClose(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium" style={{ color: colors.red, background: colors.redSoft }}>
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          ) : (
            <button onClick={onClose} className="px-3 py-2 rounded-xl text-xs" style={{ color: colors.textSecondary, background: colors.surfaceHover }}>Cancelar</button>
          )}
          <button onClick={save} className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: colors.accent }}>
            {mode === "edit" ? "Guardar" : "Crear Tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface DragState { type: "move" | "resize-left" | "resize-right"; taskId: string; startX: number; origStart: string; origEnd: string }
interface ModalState { mode: "add" | "edit"; task?: Task }
interface Row { type: "group" | "task"; groupName?: string; task?: Task; color?: string }

export default function GanttPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const { projects, updateTask } = useProjectStore();
  const project = projects.find(p => p.id === id);
  const tasks   = project?.tasks ?? [];

  const [zoom,      setZoom]      = useState<number>(GANTT.DEFAULT_ZOOM);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [modal,     setModal]     = useState<ModalState | null>(null);

  const rightRef  = useRef<HTMLDivElement>(null);
  const leftRef   = useRef<HTMLDivElement>(null);
  const dragRef   = useRef<DragState | null>(null);
  const syncing   = useRef(false);

  const range  = buildRange(tasks);
  const months = buildMonths(range);
  const weeks  = buildWeeks(range);
  const groups = getGroups(tasks);
  const today  = todayISO();
  const todayOff = diffDays(range.start, today);
  const totalW   = range.days * zoom;

  // ── Rows ────────────────────────────────────────────────────────────────────

  const rows: Row[] = [];
  for (const g of groups) {
    const c = groupColor(groups, g);
    rows.push({ type: "group", groupName: g, color: c });
    if (!collapsed.has(g)) {
      for (const t of tasks.filter(t => t.group === g)) {
        rows.push({ type: "task", task: t, color: c, groupName: g });
      }
    }
  }
  const bodyH = rows.length * GANTT.ROW_HEIGHT;

  // ── Scroll sync ─────────────────────────────────────────────────────────────

  const onRightScroll = useCallback(() => {
    if (syncing.current) return;
    const r = rightRef.current; const l = leftRef.current;
    if (!r || !l) return;
    syncing.current = true; l.scrollTop = r.scrollTop; syncing.current = false;
  }, []);

  // ── Scroll to today ─────────────────────────────────────────────────────────

  useEffect(() => {
    const p = rightRef.current;
    if (!p) return;
    p.scrollLeft = Math.max(0, todayOff * zoom - p.clientWidth / 2 + 80);
  }, [todayOff, zoom]);

  // ── Drag ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d || !project) return;
      const delta = Math.round((e.clientX - d.startX) / zoom);
      if (!delta) return;
      let s = d.origStart, e2 = d.origEnd;
      if (d.type === "move")         { s = addDays(d.origStart, delta); e2 = addDays(d.origEnd, delta); }
      else if (d.type === "resize-left")  { s = addDays(d.origStart, delta); if (s >= d.origEnd) s = addDays(d.origEnd, -1); }
      else if (d.type === "resize-right") { e2 = addDays(d.origEnd, delta); if (e2 <= d.origStart) e2 = addDays(d.origStart, 1); }
      updateTask(project.id, d.taskId, { start: s, end: e2 });
    };
    const up = () => { dragRef.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, [zoom, project, updateTask]);

  const startDrag = useCallback((e: React.MouseEvent, type: DragState["type"], task: Task) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { type, taskId: task.id, startX: e.clientX, origStart: task.start, origEnd: task.end };
    document.body.style.userSelect = "none";
    document.body.style.cursor = type === "move" ? "grabbing" : "ew-resize";
  }, []);

  if (!project) return null;

  // ── Group span helpers ───────────────────────────────────────────────────────

  const groupSpan = (g: string) => {
    const ts = tasks.filter(t => t.group === g);
    if (!ts.length) return null;
    const s = ts.map(t => t.start).sort()[0];
    const e = ts.map(t => t.end).sort().at(-1)!;
    return { start: s, end: e };
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 192px)", background: colors.bg, overflow: "hidden" }}
    >
      {/* ── Toolbar ── */}
      <div
        className="h-14 flex items-center gap-2 px-4 shrink-0 border-b"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Zoom out */}
        <button
          onClick={() => setZoom(z => Math.max(GANTT.MIN_ZOOM, z - 1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: colors.surfaceHover, color: colors.textSecondary }}
        >
          <ZoomOut className="h-4 w-4" strokeWidth={2} />
        </button>
        {/* Zoom in */}
        <button
          onClick={() => setZoom(z => Math.min(GANTT.MAX_ZOOM, z + 1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: colors.surfaceHover, color: colors.textSecondary }}
        >
          <ZoomIn className="h-4 w-4" strokeWidth={2} />
        </button>

        {/* Today */}
        <button
          onClick={() => { const p = rightRef.current; if (p) p.scrollLeft = Math.max(0, todayOff * zoom - p.clientWidth / 2 + 80); }}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium transition-colors"
          style={{ background: colors.surfaceHover, color: colors.textSecondary }}
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          Hoy
        </button>

        <div className="flex-1" />

        {/* Nueva Tarea */}
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: colors.accent }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nueva Tarea
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left panel ── */}
        <div
          className="shrink-0 flex flex-col border-r"
          style={{ width: TASK_PANEL_W, borderColor: colors.border, background: colors.bg }}
        >
          {/* Column headers */}
          <div
            className="shrink-0 flex items-end border-b"
            style={{ height: HDR_H, borderColor: colors.border, background: colors.surface }}
          >
            <div
              className="flex items-center pb-2 px-3 gap-0 w-full"
              style={{ color: colors.textTertiary, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <span style={{ width: COL_NAME_W }}>Tarea</span>
              <span style={{ width: COL_DATE_W }}>Inicio</span>
              <span style={{ width: COL_DATE_W }}>Fin</span>
            </div>
          </div>

          {/* Rows */}
          <div ref={leftRef} className="flex-1 overflow-hidden">
            <div style={{ height: bodyH }}>
              {rows.map((row, i) => {
                if (row.type === "group") {
                  const gt = tasks.filter(t => t.group === row.groupName);
                  const isC = collapsed.has(row.groupName!);
                  return (
                    <div
                      key={`gl-${row.groupName}`}
                      className="flex items-center cursor-pointer select-none"
                      style={{
                        height: GANTT.ROW_HEIGHT,
                        background: colors.surfaceHover,
                        borderBottom: `1px solid ${colors.border}`,
                        borderLeft: `3px solid ${row.color}`,
                      }}
                      onClick={() => setCollapsed(p => { const n = new Set(p); n.has(row.groupName!) ? n.delete(row.groupName!) : n.add(row.groupName!); return n; })}
                    >
                      <span className="px-2" style={{ color: colors.textTertiary, fontSize: 11 }}>
                        {isC ? "›" : "⌄"}
                      </span>
                      <span className="text-xs font-bold flex-1 truncate" style={{ color: colors.text }}>
                        {row.groupName}
                      </span>
                      <span className="text-xs pr-3" style={{ color: colors.textTertiary }}>
                        {gt.length}
                      </span>
                    </div>
                  );
                }

                const task = row.task!;
                const st   = TASK_STATUS[task.status];
                return (
                  <div
                    key={`tl-${task.id}`}
                    className="flex items-center cursor-pointer transition-colors"
                    style={{
                      height: GANTT.ROW_HEIGHT,
                      borderBottom: `1px solid ${colors.border}`,
                      paddingLeft: 12,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = colors.surfaceHover}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                    onClick={() => setModal({ mode: "edit", task })}
                  >
                    <div style={{ width: COL_NAME_W - 12 }}>
                      <p className="text-xs font-medium truncate" style={{ color: colors.text }}>
                        {task.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.label}
                        </span>
                        <span className="text-[10px]" style={{ color: colors.textTertiary }}>
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px]" style={{ width: COL_DATE_W, color: colors.textSecondary }}>{fmtD(task.start)}</span>
                    <span className="text-[10px]" style={{ width: COL_DATE_W, color: colors.textSecondary }}>{fmtD(task.end)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right panel (timeline) ── */}
        <div
          ref={rightRef}
          className="flex-1 overflow-auto"
          onScroll={onRightScroll}
        >
          <div style={{ width: totalW, minWidth: totalW }}>

            {/* Timeline header */}
            <div
              className="sticky top-0 z-10 border-b"
              style={{ height: HDR_H, background: colors.surface, borderColor: colors.border }}
            >
              {/* Month row */}
              <div className="relative" style={{ height: HDR_MONTH_H }}>
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute flex items-center px-3"
                    style={{
                      left: m.startOff * zoom,
                      width: m.days * zoom,
                      height: HDR_MONTH_H,
                      borderLeft: `1px solid ${colors.border}`,
                    }}
                  >
                    <span className="text-xs font-bold capitalize truncate" style={{ color: colors.textSecondary }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Week row */}
              <div className="relative" style={{ height: HDR_WEEK_H }}>
                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="absolute flex items-center px-1"
                    style={{
                      left: w.offset * zoom,
                      height: HDR_WEEK_H,
                      borderLeft: `1px solid ${colors.border}`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: colors.textTertiary, whiteSpace: "nowrap" }}>
                      {w.label}
                    </span>
                  </div>
                ))}

                {/* HOY pill */}
                {todayOff >= 0 && todayOff <= range.days && (
                  <div
                    className="absolute flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white z-20"
                    style={{
                      left: todayOff * zoom - 18,
                      top: 4,
                      background: colors.red,
                      whiteSpace: "nowrap",
                    }}
                  >
                    HOY
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div style={{ height: bodyH, position: "relative" }}>

              {/* Month vertical lines */}
              {months.map((m, i) => (
                <div key={i} className="absolute inset-y-0 pointer-events-none"
                  style={{ left: m.startOff * zoom, width: 1, background: colors.border, opacity: 0.4 }} />
              ))}

              {/* Today vertical line (red) */}
              {todayOff >= 0 && todayOff <= range.days && (
                <div
                  className="absolute inset-y-0 pointer-events-none z-20"
                  style={{ left: todayOff * zoom, width: 2, background: colors.red, opacity: 0.8 }}
                />
              )}

              {/* Rows */}
              {rows.map((row, rowIdx) => {
                const top = rowIdx * GANTT.ROW_HEIGHT;

                if (row.type === "group") {
                  const span = groupSpan(row.groupName!);
                  const spanLeft = span ? diffDays(range.start, span.start) * zoom : 0;
                  const spanW    = span ? Math.max(diffDays(span.start, span.end) * zoom, 8) : 0;
                  const cy       = top + GANTT.ROW_HEIGHT / 2;

                  return (
                    <div
                      key={`gr-${row.groupName}`}
                      className="absolute w-full"
                      style={{ top, height: GANTT.ROW_HEIGHT, background: colors.surfaceHover, borderBottom: `1px solid ${colors.border}` }}
                    >
                      {span && (
                        <>
                          {/* Thin group summary bar */}
                          <div
                            className="absolute rounded-full"
                            style={{
                              left:   spanLeft,
                              width:  spanW,
                              top:    GANTT.ROW_HEIGHT / 2 - 3,
                              height: 6,
                              background: `${row.color}50`,
                              border: `1px solid ${row.color}80`,
                            }}
                          />
                          {/* Diamond at end */}
                          <div
                            className="absolute"
                            style={{
                              left:      spanLeft + spanW - 7,
                              top:       cy - 7,
                              width:     14,
                              height:    14,
                              background: row.color,
                              transform: "rotate(45deg)",
                              borderRadius: 2,
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                }

                // Task row
                const task     = row.task!;
                const gc       = row.color!;
                const barLeft  = diffDays(range.start, task.start) * zoom;
                const barW     = Math.max(diffDays(task.start, task.end) * zoom, 8);
                const barTop   = top + (GANTT.ROW_HEIGHT - GANTT.BAR_HEIGHT) / 2;

                return (
                  <div
                    key={`tr-${task.id}`}
                    className="absolute w-full"
                    style={{ top, height: GANTT.ROW_HEIGHT, borderBottom: `1px solid ${colors.border}` }}
                  >
                    {/* Bar */}
                    <div
                      className="absolute rounded-md select-none overflow-hidden"
                      style={{
                        left:   barLeft,
                        top:    barTop - top,
                        width:  barW,
                        height: GANTT.BAR_HEIGHT,
                        background: `${gc}28`,
                        border: `1.5px solid ${gc}60`,
                        cursor: "grab",
                      }}
                      onMouseDown={e => startDrag(e, "move", task)}
                      onDoubleClick={() => setModal({ mode: "edit", task })}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-md"
                        style={{ width: `${task.progress}%`, background: `${gc}90` }}
                      />
                      {/* Task name */}
                      {barW > 36 && (
                        <span
                          className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold truncate pointer-events-none z-10"
                          style={{ color: "#fff" }}
                        >
                          {task.name}
                        </span>
                      )}
                      {/* Progress % */}
                      {barW > 60 && (
                        <span
                          className="absolute right-1.5 inset-y-0 flex items-center text-[10px] font-bold pointer-events-none z-10"
                          style={{ color: "#fff" }}
                        >
                          {task.progress}%
                        </span>
                      )}
                      {/* Left resize */}
                      <div
                        className="absolute inset-y-0 left-0 z-20"
                        style={{ width: 8, cursor: "ew-resize" }}
                        onMouseDown={e => startDrag(e, "resize-left", task)}
                      />
                      {/* Right resize */}
                      <div
                        className="absolute inset-y-0 right-0 z-20"
                        style={{ width: 8, cursor: "ew-resize" }}
                        onMouseDown={e => startDrag(e, "resize-right", task)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task}
          projectId={id}
          existingGroups={groups}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
