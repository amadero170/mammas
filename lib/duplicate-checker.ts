import type { Proveedor, Evento } from "@/lib/types";

/**
 * Normalizes phone numbers by keeping only digits.
 * e.g. "+52 (322) 123-4567" -> "523221234567"
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Normalizes strings by removing accents, special characters, and converting to lowercase.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export type DuplicateMatch<T> = {
  item: T;
  reasons: Array<"nombre" | "telefono">;
};

/**
 * Checks a provider against a list of other providers for duplicate name or phone.
 */
export function findProviderDuplicates(
  target: Proveedor,
  allProviders: Proveedor[]
): DuplicateMatch<Proveedor>[] {
  const matches: DuplicateMatch<Proveedor>[] = [];
  const targetName = normalizeText(target.nombre);
  const targetPhone = normalizePhone(target.telefono);

  for (const p of allProviders) {
    if (p.id === target.id) continue;

    const reasons: Array<"nombre" | "telefono"> = [];
    const pName = normalizeText(p.nombre);
    const pPhone = normalizePhone(p.telefono);

    // Check name match (exact or close match)
    if (targetName && pName && (targetName === pName || pName.includes(targetName) || targetName.includes(pName))) {
      reasons.push("nombre");
    }

    // Check phone match (if non-empty and at least 7 digits)
    if (targetPhone && pPhone && targetPhone.length >= 7 && pPhone.length >= 7) {
      if (targetPhone.endsWith(pPhone.slice(-7)) || pPhone.endsWith(targetPhone.slice(-7))) {
        reasons.push("telefono");
      }
    }

    if (reasons.length > 0) {
      matches.push({ item: p, reasons });
    }
  }

  return matches;
}

/**
 * Checks an event against a list of other events for duplicate title or phone.
 */
export function findEventDuplicates(
  target: Evento,
  allEvents: Evento[]
): DuplicateMatch<Evento>[] {
  const matches: DuplicateMatch<Evento>[] = [];
  const targetTitle = normalizeText(target.titulo);
  const targetPhone = normalizePhone(target.telefono);

  for (const e of allEvents) {
    if (e.id === target.id) continue;

    const reasons: Array<"nombre" | "telefono"> = [];
    const eTitle = normalizeText(e.titulo);
    const ePhone = normalizePhone(e.telefono);

    if (targetTitle && eTitle && (targetTitle === eTitle || eTitle.includes(targetTitle) || targetTitle.includes(eTitle))) {
      reasons.push("nombre");
    }

    if (targetPhone && ePhone && targetPhone.length >= 7 && ePhone.length >= 7) {
      if (targetPhone.endsWith(ePhone.slice(-7)) || ePhone.endsWith(targetPhone.slice(-7))) {
        reasons.push("telefono");
      }
    }

    if (reasons.length > 0) {
      matches.push({ item: e, reasons });
    }
  }

  return matches;
}
