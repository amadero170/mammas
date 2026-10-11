"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completenessLevel, type Completeness, type CompletenessLevel } from "@/lib/completeness";

export type LevelFilter = CompletenessLevel | "all";
export type SortMode = "default" | "llenado";

const LEVEL_STYLES: Record<CompletenessLevel, { dot: string; badge: string; label: string }> = {
  alto: { dot: "bg-green-500", badge: "border-green-300 bg-green-50 text-green-700", label: "Completos" },
  medio: { dot: "bg-amber-400", badge: "border-amber-300 bg-amber-50 text-amber-700", label: "A medias" },
  bajo: { dot: "bg-red-500", badge: "border-red-300 bg-red-50 text-red-700", label: "Incompletos" },
};

/** Porcentaje de llenado con color; al pasar el mouse muestra qué falta. */
export function CompletenessBadge({ value }: { value: Completeness }) {
  const style = LEVEL_STYLES[completenessLevel(value.pct)];
  const title = value.missing.length ? `Falta: ${value.missing.join(", ")}` : "Ficha completa";

  return (
    <div className="flex flex-col gap-0.5" title={title}>
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
          style.badge
        )}
      >
        {value.pct}%
      </span>
      {value.missing.length > 0 && (
        <span className="max-w-[12rem] text-[11px] leading-tight text-muted-foreground">
          Falta: {value.missing.join(", ")}
        </span>
      )}
    </div>
  );
}

type FilterProps = {
  level: LevelFilter;
  onLevelChange: (level: LevelFilter) => void;
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  counts: Record<CompletenessLevel, number>;
  /** Texto del orden por defecto de la tabla. */
  defaultSortLabel?: string;
};

/** Filtro por nivel de llenado (verde / amarillo / rojo) y orden. */
export function CompletenessFilter({
  level,
  onLevelChange,
  sort,
  onSortChange,
  counts,
  defaultSortLabel = "Orden alfabético",
}: FilterProps) {
  const levels: CompletenessLevel[] = ["bajo", "medio", "alto"];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Llenado:</span>
      <Button
        variant={level === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onLevelChange("all")}
        className={level === "all" ? "bg-[#4c2f92]" : ""}
      >
        Todos
      </Button>
      {levels.map((l) => (
        <Button
          key={l}
          variant={level === l ? "default" : "outline"}
          size="sm"
          onClick={() => onLevelChange(l)}
          className={cn("gap-1.5", level === l && "bg-[#4c2f92]")}
        >
          <span className={cn("h-2 w-2 rounded-full", LEVEL_STYLES[l].dot)} />
          {LEVEL_STYLES[l].label} ({counts[l]})
        </Button>
      ))}
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortMode)}
        aria-label="Ordenar"
      >
        <option value="default">{defaultSortLabel}</option>
        <option value="llenado">Menos completos primero</option>
      </select>
    </div>
  );
}

/** Aplica filtro de nivel y orden a una lista ya filtrada por estado. */
export function applyCompleteness<T extends { id: string }>(
  items: T[],
  scores: Record<string, Completeness>,
  level: LevelFilter,
  sort: SortMode
) {
  const counts: Record<CompletenessLevel, number> = { alto: 0, medio: 0, bajo: 0 };
  for (const item of items) counts[completenessLevel(scores[item.id].pct)]++;

  let result = level === "all" ? items : items.filter((i) => completenessLevel(scores[i.id].pct) === level);
  if (sort === "llenado") {
    result = [...result].sort((a, b) => scores[a.id].pct - scores[b.id].pct);
  }
  return { items: result, counts };
}
