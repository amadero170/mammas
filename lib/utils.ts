import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const esCollator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/** Compara dos textos en orden alfabético español (acentos y ñ correctos). */
export function compareEs(a: string | null | undefined, b: string | null | undefined) {
  return esCollator.compare(a ?? "", b ?? "");
}

/** Devuelve una copia ordenada alfabéticamente. */
export function sortEs<T>(items: readonly T[], getKey?: (item: T) => string | null | undefined): T[] {
  const key = getKey ?? ((item: T) => String(item));
  return [...items].sort((a, b) => compareEs(key(a), key(b)));
}

/** Limpia espacios sobrantes de un tag: "  yoga   prenatal " -> "yoga prenatal". */
export function cleanTag(tag: string) {
  return tag.replace(/\s+/g, " ").trim();
}

/** Clave para comparar tags sin importar mayúsculas, acentos ni espacios. */
export function tagKey(tag: string) {
  return cleanTag(tag)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Limpia una lista de tags: quita espacios, elimina duplicados
 * y, si existe en el catálogo, usa la escritura del catálogo.
 */
export function normalizeTags(tags: readonly string[] | null | undefined, catalog: readonly string[] = []) {
  const canonical = new Map(catalog.map((t) => [tagKey(t), cleanTag(t)]));
  const result = new Map<string, string>();
  for (const raw of tags ?? []) {
    const cleaned = cleanTag(raw);
    if (!cleaned) continue;
    const key = tagKey(cleaned);
    if (!result.has(key)) result.set(key, canonical.get(key) ?? cleaned);
  }
  return Array.from(result.values());
}

/** Lista de tags única (sin variantes de mayúsculas/acentos), ordenada alfabéticamente. */
export function uniqueTags(tags: readonly string[]) {
  return sortEs(normalizeTags(tags));
}

/** true si la URL parece un enlace de Google Maps. */
export function isGoogleMapsUrl(value: string) {
  const v = value.trim();
  if (!v) return true;
  return /^(https?:\/\/)?((www\.|maps\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(v);
}
