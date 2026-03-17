"use client";

import { useParams } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { colors } from "@/lib/constants";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({
  pct,
  size = 80,
  stroke = 6,
  color,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colors.border}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const params = useParams();
  const id = params?.id as string;

  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === id);

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

  const { baseTecnica, propuesta } = project;

  const matchCount = propuesta.filter((p) => p.match).length;
  const noMatchCount = propuesta.filter((p) => !p.match).length;
  const matchPct = propuesta.length > 0 ? Math.round((matchCount / propuesta.length) * 100) : 0;

  // Ring color based on match %
  const ringColor =
    matchPct >= 90 ? colors.green : matchPct >= 70 ? colors.orange : colors.red;

  // Group BT items by category
  const btCategories = [...new Set(baseTecnica.map((b) => b.cat))];

  // Group propuesta items (pair with BT if same index)
  const maxLen = Math.max(baseTecnica.length, propuesta.length);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ── Summary header ── */}
      <div
        className="rounded-2xl border p-5 mb-6 flex items-center gap-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Ring */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: 80, height: 80 }}>
          <ProgressRing pct={matchPct} color={ringColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none" style={{ color: ringColor }}>
              {matchPct}%
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h2 className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            Comparación Técnica
          </h2>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {matchCount} de {propuesta.length} ítems cumplen con la base técnica
            {noMatchCount > 0 && (
              <span style={{ color: colors.red }}>
                {" "}— {noMatchCount} observación{noMatchCount !== 1 ? "es" : ""} encontrada{noMatchCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Stat chips */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: colors.greenSoft }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: colors.green }} strokeWidth={2} />
            <span className="text-xs font-semibold" style={{ color: colors.green }}>
              {matchCount} conforme{matchCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: colors.redSoft }}
          >
            <XCircle className="h-3.5 w-3.5" style={{ color: colors.red }} strokeWidth={2} />
            <span className="text-xs font-semibold" style={{ color: colors.red }}>
              {noMatchCount} diferencia{noMatchCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {/* Column headers */}
        <div
          className="grid grid-cols-2 border-b"
          style={{ borderColor: colors.border }}
        >
          <div
            className="px-5 py-3 border-r"
            style={{ borderColor: colors.border, background: colors.surfaceHover }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: colors.textTertiary }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: colors.textTertiary }}
              >
                Base Técnica
              </span>
              <span
                className="ml-auto text-[10px] rounded-full px-2 py-0.5"
                style={{ color: colors.textTertiary, background: colors.surfaceActive }}
              >
                {baseTecnica.length} ítems
              </span>
            </div>
          </div>
          <div
            className="px-5 py-3"
            style={{ background: colors.surfaceHover }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: colors.accent }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: colors.textTertiary }}
              >
                Propuesta
              </span>
              <span
                className="ml-auto text-[10px] rounded-full px-2 py-0.5"
                style={{ color: colors.textTertiary, background: colors.surfaceActive }}
              >
                {propuesta.length} ítems
              </span>
            </div>
          </div>
        </div>

        {/* Category sections */}
        {btCategories.map((cat) => {
          const btItems = baseTecnica.filter((b) => b.cat === cat);

          return (
            <div key={cat}>
              {/* Category header */}
              <div
                className="px-5 py-2 border-b border-t"
                style={{
                  background: colors.surfaceActive,
                  borderColor: colors.border,
                }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: colors.textTertiary }}
                >
                  {cat}
                </span>
              </div>

              {/* Items in this category */}
              {btItems.map((btItem, catIdx) => {
                // Find corresponding propuesta item by global index
                const btGlobalIdx = baseTecnica.findIndex(
                  (b) => b.item === btItem.item && b.cat === btItem.cat
                );
                const propItem = propuesta[btGlobalIdx];

                return (
                  <div
                    key={btGlobalIdx}
                    className="grid grid-cols-2 border-b last:border-b-0"
                    style={{ borderColor: colors.border }}
                  >
                    {/* BT item */}
                    <div
                      className="px-5 py-3.5 border-r"
                      style={{ borderColor: colors.border }}
                    >
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {btItem.item}
                      </p>
                    </div>

                    {/* Propuesta item */}
                    <div className="px-5 py-3.5">
                      {propItem ? (
                        <div>
                          <div className="flex items-start gap-2">
                            {propItem.match ? (
                              <CheckCircle2
                                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                                style={{ color: colors.green }}
                                strokeWidth={2}
                              />
                            ) : (
                              <XCircle
                                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                                style={{ color: colors.red }}
                                strokeWidth={2}
                              />
                            )}
                            <p
                              className="text-xs"
                              style={{
                                color: propItem.match ? colors.textSecondary : colors.text,
                                fontWeight: propItem.match ? 400 : 500,
                              }}
                            >
                              {propItem.item}
                            </p>
                          </div>
                          {!propItem.match && propItem.note && (
                            <div
                              className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2"
                              style={{ background: colors.orangeSoft }}
                            >
                              <AlertTriangle
                                className="h-3 w-3 mt-0.5 shrink-0"
                                style={{ color: colors.orange }}
                                strokeWidth={2}
                              />
                              <p className="text-[10px]" style={{ color: colors.orange }}>
                                {propItem.note}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs italic" style={{ color: colors.textTertiary }}>
                          Sin ítem correspondiente
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Extra propuesta items (no BT counterpart) */}
        {propuesta.length > baseTecnica.length && (
          <div>
            <div
              className="px-5 py-2 border-b border-t"
              style={{ background: colors.surfaceActive, borderColor: colors.border }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: colors.textTertiary }}
              >
                Ítems adicionales en propuesta
              </span>
            </div>
            {propuesta.slice(baseTecnica.length).map((propItem, i) => (
              <div
                key={i}
                className="grid grid-cols-2 border-b last:border-b-0"
                style={{ borderColor: colors.border }}
              >
                <div
                  className="px-5 py-3.5 border-r"
                  style={{ borderColor: colors.border }}
                >
                  <p className="text-xs italic" style={{ color: colors.textTertiary }}>
                    —
                  </p>
                </div>
                <div className="px-5 py-3.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: colors.accent }}
                      strokeWidth={2}
                    />
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {propItem.item}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
