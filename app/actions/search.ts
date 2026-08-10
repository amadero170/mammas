"use server";

import { listProvidersPublic } from "./proveedores";
import { listEventsPublic } from "./eventos";
import type { Proveedor, Evento } from "@/lib/types";

export type SearchResult = {
  providers: Proveedor[];
  events: Evento[];
};

/**
 * Combined search across providers and events.
 * Used by the home search bar to return results from both entities.
 */
export async function searchAll(
  q: string
): Promise<{ success: true; results: SearchResult } | { success: false; error: string }> {
  const trimmed = q.trim();
  if (!trimmed) {
    return { success: true, results: { providers: [], events: [] } };
  }

  const [provRes, evtRes] = await Promise.all([
    listProvidersPublic({ q: trimmed }),
    listEventsPublic({ q: trimmed }),
  ]);

  return {
    success: true,
    results: {
      providers: provRes.success ? provRes.providers : [],
      events: evtRes.success ? evtRes.events : [],
    },
  };
}
