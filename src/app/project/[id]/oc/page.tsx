"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { colors, SUB_OC_STATUS, SUB_OC_TYPES } from "@/lib/constants";
import { formatMoney, formatShort } from "@/lib/utils";
import type { SubOC, SubOCType, SubOCStatus } from "@/types";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  FileText,
  Users,
  Wrench,
  Package,
  File,
  Calendar,
  CreditCard,
  Building2,
} from "lucide-react";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<SubOCType, React.ElementType> = {
  subcontrato: Users,
  servicio: Wrench,
  equipo: Package,
  otro: File,
};

// ─── Sub-OC Modal ─────────────────────────────────────────────────────────────

function SubOCModal({
  mode,
  subOC,
  projectId,
  onClose,
}: {
  mode: "add" | "edit";
  subOC?: SubOC;
  projectId: string;
  onClose: () => void;
}) {
  const { addSubOC, updateSubOC, deleteSubOC } = useProjectStore();
  const isEdit = mode === "edit";

  const [number, setNumber] = useState(subOC?.number ?? "");
  const [desc, setDesc] = useState(subOC?.desc ?? "");
  const [type, setType] = useState<SubOCType>(subOC?.type ?? "subcontrato");
  const [contractor, setContractor] = useState(subOC?.contractor ?? "");
  const [value, setValue] = useState(subOC?.value?.toString() ?? "");
  const [payTerms, setPayTerms] = useState(subOC?.payTerms ?? "");
  const [status, setStatus] = useState<SubOCStatus>(subOC?.status ?? "por_emitir");
  const [start, setStart] = useState(subOC?.start ?? "");
  const [end, setEnd] = useState(subOC?.end ?? "");
  const [progress, setProgress] = useState(subOC?.progress ?? 0);

  const handleSave = () => {
    if (!number.trim() || !desc.trim()) return;
    const payload = {
      number: number.trim(),
      desc: desc.trim(),
      type,
      contractor: contractor.trim(),
      value: parseInt(value.replace(/[^0-9]/g, "")) || 0,
      payTerms: payTerms.trim(),
      status,
      start,
      end,
      progress,
    };
    if (isEdit && subOC) {
      updateSubOC(projectId, subOC.id, payload);
    } else {
      addSubOC(projectId, payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEdit && subOC) {
      deleteSubOC(projectId, subOC.id);
      onClose();
    }
  };

  const fieldStyle = {
    background: colors.surfaceHover,
    borderColor: colors.border,
    color: colors.text,
    colorScheme: "dark" as const,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: colors.text }}>
            {isEdit ? "Editar Sub-OC" : "Nueva Sub-OC"}
          </h2>
          <button onClick={onClose} style={{ color: colors.textTertiary }}>
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Number + type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                Número
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                style={fieldStyle}
                placeholder="OC-XXXX-01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SubOCType)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                style={fieldStyle}
              >
                {Object.entries(SUB_OC_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Descripción
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={fieldStyle}
              placeholder="Descripción del trabajo o suministro..."
            />
          </div>

          {/* Contractor */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Contratista / Proveedor
            </label>
            <input
              type="text"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={fieldStyle}
              placeholder="Nombre empresa..."
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Valor (CLP)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={fieldStyle}
              placeholder="0"
            />
          </div>

          {/* Pay terms */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
              Condiciones de pago
            </label>
            <input
              type="text"
              value={payTerms}
              onChange={(e) => setPayTerms(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
              style={fieldStyle}
              placeholder="50% anticipo, 50% contra entrega..."
            />
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
                style={fieldStyle}
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
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Status + progress */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubOCStatus)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                style={fieldStyle}
              >
                {Object.entries(SUB_OC_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
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
                className="w-full mt-2"
                style={{ accentColor: colors.accent }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
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
            className="px-5 py-2 rounded-xl text-xs font-medium text-white"
            style={{ background: colors.accent }}
          >
            {isEdit ? "Guardar" : "Crear Sub-OC"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OCPage() {
  const params = useParams();
  const id = params?.id as string;

  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === id);

  const [expandedSubOC, setExpandedSubOC] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; subOC?: SubOC } | null>(null);

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

  const { ocDoc, subOCs, value: projectValue } = project;

  const totalSubOCValue = subOCs.reduce((s, o) => s + o.value, 0);
  const allocatedPct = projectValue > 0 ? Math.round((totalSubOCValue / projectValue) * 100) : 0;

  // Value breakdown by type
  const typeBreakdown = Object.keys(SUB_OC_TYPES).map((t) => {
    const typeKey = t as SubOCType;
    const typeValue = subOCs
      .filter((o) => o.type === typeKey)
      .reduce((s, o) => s + o.value, 0);
    return { type: typeKey, value: typeValue, pct: totalSubOCValue > 0 ? Math.round((typeValue / totalSubOCValue) * 100) : 0 };
  }).filter((item) => item.value > 0);

  return (
    <div
      className="p-6 max-w-4xl mx-auto"
      style={{ color: colors.text }}
    >
      {/* ── OC Document card ── */}
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="rounded-xl p-2.5 shrink-0"
            style={{ background: colors.accentSoft }}
          >
            <FileText className="h-5 w-5" style={{ color: colors.accent }} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: colors.text }}>
              Orden de Compra Principal
            </h2>
            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
              {ocDoc.number}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs" style={{ color: colors.textTertiary }}>Valor contrato</p>
            <p className="text-lg font-semibold" style={{ color: colors.text }}>
              {formatMoney(projectValue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: colors.textTertiary }}>
              N° OC
            </p>
            <p className="text-xs font-medium" style={{ color: colors.text }}>{ocDoc.number}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: colors.textTertiary }}>
              Fecha
            </p>
            <p className="text-xs font-medium" style={{ color: colors.text }}>{formatShort(ocDoc.date)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: colors.textTertiary }}>
              Condiciones de pago
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>{ocDoc.payTerms}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: colors.textTertiary }}>
              Contacto
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>{ocDoc.contact}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: colors.textTertiary }}>
              Inicio
            </p>
            <p className="text-xs font-medium" style={{ color: colors.text }}>{formatShort(project.start)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: colors.textTertiary }}>
              Fin
            </p>
            <p className="text-xs font-medium" style={{ color: colors.text }}>{formatShort(project.end)}</p>
          </div>
        </div>
      </div>

      {/* ── Sub-OCs list ── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: colors.text }}>
              Sub-Órdenes de Compra
            </h2>
            <span
              className="text-xs rounded-full px-2 py-0.5"
              style={{ color: colors.textTertiary, background: colors.surfaceHover }}
            >
              {subOCs.length}
            </span>
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: colors.accent }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Nueva Sub-OC
          </button>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {subOCs.length === 0 && (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{ borderColor: colors.border, background: colors.surface }}
            >
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                No hay sub-órdenes de compra todavía.
              </p>
            </div>
          )}

          {subOCs.map((suboc) => {
            const typeCfg = SUB_OC_TYPES[suboc.type];
            const statusCfg = SUB_OC_STATUS[suboc.status];
            const Icon = TYPE_ICON[suboc.type];
            const isExpanded = expandedSubOC === suboc.id;

            return (
              <div
                key={suboc.id}
                className="rounded-2xl border overflow-hidden"
                style={{ background: colors.surface, borderColor: colors.border }}
              >
                {/* Row header (always visible) */}
                <button
                  className="w-full px-5 py-4 text-left"
                  onClick={() => setExpandedSubOC(isExpanded ? null : suboc.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Type badge */}
                    <div
                      className="shrink-0 rounded-lg p-2"
                      style={{ background: `${typeCfg.color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: typeCfg.color }} strokeWidth={1.5} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-mono font-semibold"
                          style={{ color: typeCfg.color }}
                        >
                          {suboc.number}
                        </span>
                        <span
                          className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                          style={{ color: typeCfg.color, background: `${typeCfg.color}15` }}
                        >
                          {typeCfg.label}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: colors.textSecondary }}
                      >
                        {suboc.desc}
                      </p>
                    </div>

                    {/* Value + status */}
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: colors.text }}
                      >
                        {formatMoney(suboc.value)}
                      </span>
                      <span
                        className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                        style={{ color: statusCfg.color, background: statusCfg.bg }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="shrink-0 w-20">
                      <div
                        className="h-1.5 rounded-full overflow-hidden mb-1"
                        style={{ background: colors.border }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${suboc.progress}%`,
                            background: statusCfg.color,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-right" style={{ color: colors.textTertiary }}>
                        {suboc.progress}%
                      </p>
                    </div>

                    {/* Expand icon */}
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" style={{ color: colors.textTertiary }} strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-4 w-4" style={{ color: colors.textTertiary }} strokeWidth={1.5} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    className="px-5 pb-4 border-t"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: colors.textTertiary }} strokeWidth={1.5} />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                            Contratista
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{suboc.contractor}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CreditCard className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: colors.textTertiary }} strokeWidth={1.5} />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                            Cond. de pago
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{suboc.payTerms}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: colors.textTertiary }} strokeWidth={1.5} />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                            Plazo
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                            {formatShort(suboc.start)} → {formatShort(suboc.end)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal({ mode: "edit", subOC: suboc })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ color: colors.accent, background: colors.accentSoft }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          const { deleteSubOC } = useProjectStore.getState();
                          deleteSubOC(id, suboc.id);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ color: colors.red, background: colors.redSoft }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Financial summary bar ── */}
      {subOCs.length > 0 && (
        <div
          className="mt-6 rounded-2xl border p-5"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textTertiary }}>
            Resumen Financiero
          </h3>

          {/* Main bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span style={{ color: colors.textSecondary }}>Sub-OCs emitidas</span>
              <span style={{ color: colors.text }}>
                {formatMoney(totalSubOCValue)} / {formatMoney(projectValue)} ({allocatedPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.border }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(allocatedPct, 100)}%`,
                  background: allocatedPct > 100 ? colors.red : colors.accent,
                }}
              />
            </div>
          </div>

          {/* Type breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {typeBreakdown.map(({ type, value, pct }) => {
              const cfg = SUB_OC_TYPES[type];
              const Icon = TYPE_ICON[type];
              return (
                <div
                  key={type}
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: colors.surfaceHover }}
                >
                  <div
                    className="shrink-0 rounded-lg p-1.5"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium truncate" style={{ color: colors.textTertiary }}>
                      {cfg.label}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: colors.text }}>
                      {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <SubOCModal
          mode={modal.mode}
          subOC={modal.subOC}
          projectId={id}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
