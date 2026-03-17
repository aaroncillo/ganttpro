"use client";

import { useState, useRef } from "react";
import { colors } from "@/lib/constants";
import { Upload, FileType, Clock } from "lucide-react";

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  title: string;
  description: string;
  accepts: string;
  exts: string;
  icon?: React.ElementType;
}

function DropZone({ title, description, accepts, exts }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setDroppedFile(file.name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDroppedFile(file.name);
  };

  return (
    <div
      className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-colors cursor-pointer"
      style={{
        borderColor: isDragOver ? colors.accent : colors.border,
        background: isDragOver ? colors.accentSoft : colors.surface,
        minHeight: 260,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accepts}
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: isDragOver ? colors.accentGlow : colors.surfaceHover }}
      >
        <Upload
          className="h-8 w-8"
          style={{ color: isDragOver ? colors.accent : colors.textTertiary }}
          strokeWidth={1.5}
        />
      </div>

      {droppedFile ? (
        <>
          <p className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            {droppedFile}
          </p>
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            Archivo listo (procesamiento en Fase 3)
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            {description}
          </p>
          <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
            o haz clic para seleccionar
          </p>
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: colors.surfaceActive }}
          >
            <FileType className="h-3 w-3" style={{ color: colors.textTertiary }} strokeWidth={1.5} />
            <span className="text-[10px] font-mono" style={{ color: colors.textTertiary }}>
              {exts}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Phase 3 banner */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6 border"
        style={{
          background: colors.orangeSoft,
          borderColor: `${colors.orange}30`,
        }}
      >
        <Clock className="h-4 w-4 shrink-0" style={{ color: colors.orange }} strokeWidth={2} />
        <p className="text-xs font-medium" style={{ color: colors.orange }}>
          Función disponible en Fase 3 — La importación automática de archivos estará disponible próximamente.
        </p>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-base font-semibold" style={{ color: colors.text }}>
          Importar Archivos
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textTertiary }}>
          Arrastra o selecciona los archivos del proyecto para integrarlos automáticamente.
        </p>
      </div>

      {/* Drop zones grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Carta Gantt */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="rounded-lg p-1.5"
              style={{ background: colors.accentSoft }}
            >
              <Upload className="h-3.5 w-3.5" style={{ color: colors.accent }} strokeWidth={2} />
            </div>
            <h2 className="text-xs font-semibold" style={{ color: colors.text }}>
              Carta Gantt
            </h2>
          </div>
          <DropZone
            title="Carta Gantt"
            description="Arrastra un archivo MS Project (.mpp, .xml)"
            accepts=".mpp,.xml"
            exts=".mpp  .xml"
          />
          <p className="text-[10px] mt-2 text-center" style={{ color: colors.textTertiary }}>
            Importará tareas, fechas y dependencias automáticamente
          </p>
        </div>

        {/* Propuesta Técnica */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="rounded-lg p-1.5"
              style={{ background: colors.purpleSoft }}
            >
              <Upload className="h-3.5 w-3.5" style={{ color: colors.purple }} strokeWidth={2} />
            </div>
            <h2 className="text-xs font-semibold" style={{ color: colors.text }}>
              Propuesta Técnica
            </h2>
          </div>
          <DropZone
            title="Propuesta Técnica"
            description="Arrastra la propuesta técnico-económica"
            accepts=".pdf,.xlsx,.docx"
            exts=".pdf  .xlsx  .docx"
          />
          <p className="text-[10px] mt-2 text-center" style={{ color: colors.textTertiary }}>
            Extraerá ítems de la propuesta para el comparador
          </p>
        </div>

        {/* Base Técnica */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="rounded-lg p-1.5"
              style={{ background: colors.greenSoft }}
            >
              <Upload className="h-3.5 w-3.5" style={{ color: colors.green }} strokeWidth={2} />
            </div>
            <h2 className="text-xs font-semibold" style={{ color: colors.text }}>
              Base Técnica
            </h2>
          </div>
          <DropZone
            title="Base Técnica"
            description="Arrastra las bases técnicas de licitación"
            accepts=".pdf,.docx"
            exts=".pdf  .docx"
          />
          <p className="text-[10px] mt-2 text-center" style={{ color: colors.textTertiary }}>
            Extraerá requisitos técnicos para comparación
          </p>
        </div>
      </div>

      {/* Phase 3 features list */}
      <div
        className="mt-8 rounded-2xl border p-5"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textTertiary }}>
          Capacidades de la Fase 3
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Importar cronograma desde MS Project (.mpp, .xml)",
            "Extracción automática de ítems técnicos con OCR/IA",
            "Matching automático entre propuesta y base técnica",
            "Detección de diferencias y observaciones",
            "Exportar Gantt actualizado a PDF / Excel",
            "Sincronización bidireccional con MS Project",
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: colors.borderLight }}
              />
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
