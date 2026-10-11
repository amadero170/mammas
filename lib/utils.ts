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

/** Formato de tag: solo la primera letra en mayúscula. "CLASES PARTICULARES" -> "Clases particulares". */
export function formatTag(tag: string) {
  const cleaned = cleanTag(tag).toLocaleLowerCase("es");
  return cleaned.charAt(0).toLocaleUpperCase("es") + cleaned.slice(1);
}

function levenshtein(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Tag del catálogo que se parece mucho al escrito (posible error de dedo), para preguntar
 * "¿Quisiste decir…?". Devuelve null si ya existe igual o si nada se parece lo suficiente.
 */
export function closestTag(input: string, catalog: readonly string[]) {
  const key = tagKey(input);
  if (key.length < 3) return null;
  const maxDistance = key.length <= 5 ? 1 : key.length <= 10 ? 2 : 3;

  let best: { tag: string; distance: number } | null = null;
  for (const tag of catalog) {
    const other = tagKey(tag);
    if (other === key) return null;
    if (Math.abs(other.length - key.length) > maxDistance) continue;
    const distance = levenshtein(key, other);
    if (distance <= maxDistance && (!best || distance < best.distance)) best = { tag, distance };
  }
  return best?.tag ?? null;
}

/**
 * Limpia una lista de tags: quita espacios, elimina duplicados, usa la escritura
 * del catálogo si existe y deja solo la primera letra en mayúscula.
 */
export function normalizeTags(tags: readonly string[] | null | undefined, catalog: readonly string[] = []) {
  const canonical = new Map(catalog.map((t) => [tagKey(t), cleanTag(t)]));
  const result = new Map<string, string>();
  for (const raw of tags ?? []) {
    const cleaned = cleanTag(raw);
    if (!cleaned) continue;
    const key = tagKey(cleaned);
    if (!result.has(key)) result.set(key, formatTag(canonical.get(key) ?? cleaned));
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

/** true si el texto parece un enlace (para evitar que se pegue un link en un campo de texto). */
export function looksLikeUrl(value: string) {
  return /^\s*(https?:\/\/|www\.)|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(value);
}

/**
 * Extrae el id (uuid) de un parámetro de link compartido. Algunas apps pegan el texto
 * del mensaje al final del link, así que se toma solo el uuid y se ignora lo demás.
 */
export function sharedIdFromParam(value: string | null) {
  return value?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
}
