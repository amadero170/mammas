import type { Evento, Proveedor } from "@/lib/types";

/** Qué tan completa está la ficha de un proveedor o evento (0–100) y qué le falta. */
export type Completeness = { pct: number; missing: string[] };

export type CompletenessLevel = "alto" | "medio" | "bajo";

type Check = { label: string; weight: number; ok: boolean };

const filled = (v: string | null | undefined) => !!v?.trim();

function score(checks: Check[]): Completeness {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const got = checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
  return {
    pct: Math.round((got / total) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

export function providerCompleteness(p: Proveedor): Completeness {
  return score([
    { label: "foto o logo", weight: 20, ok: filled(p.logo_url) },
    { label: "descripción", weight: 20, ok: filled(p.descripcion) },
    { label: "teléfono", weight: 20, ok: filled(p.telefono) },
    { label: "dirección o link de Maps", weight: 15, ok: filled(p.direccion) || filled(p.google_maps_link) },
    { label: "categorías", weight: 5, ok: (p.categorias?.length ?? 0) > 0 },
    { label: "zona", weight: 5, ok: filled(p.zona) },
    { label: "tags", weight: 5, ok: (p.tags?.length ?? 0) > 0 },
    { label: "sitio web o redes", weight: 10, ok: filled(p.sitio_web) || filled(p.instagram) || filled(p.facebook) },
  ]);
}

export function eventCompleteness(e: Evento): Completeness {
  return score([
    { label: "imagen", weight: 20, ok: filled(e.imagen_url) },
    { label: "descripción", weight: 20, ok: filled(e.descripcion) },
    { label: "horario", weight: 15, ok: filled(e.horario_inicio) },
    { label: "link de Maps", weight: 15, ok: filled(e.google_maps_link) },
    { label: "precio", weight: 10, ok: filled(e.precios) },
    { label: "teléfono o link", weight: 10, ok: filled(e.telefono) || filled(e.link_externo) },
    { label: "zona", weight: 5, ok: filled(e.zona) },
    { label: "tags", weight: 5, ok: (e.tags?.length ?? 0) > 0 },
  ]);
}

/** Verde ≥ 80%, amarillo 40–79%, rojo < 40%. */
export function completenessLevel(pct: number): CompletenessLevel {
  if (pct >= 80) return "alto";
  if (pct >= 40) return "medio";
  return "bajo";
}
