"use client";

import { Button } from "@/components/ui/button";

type Props = {
  /** Ej: "un proveedor" */
  what: string;
  /** Ej: "Ver todo el directorio" */
  viewAllLabel: string;
  onViewAll: () => void;
};

/** Aviso cuando la página se abrió desde un link compartido y solo muestra ese elemento. */
export function SharedItemBanner({ what, viewAllLabel, onViewAll }: Props) {
  return (
    <div className="mx-auto mb-6 flex max-w-6xl flex-col items-center justify-between gap-3 rounded-lg border border-[#4c2f92]/20 bg-[#f5f0ff] px-4 py-3 text-sm text-[#2e1b40] sm:flex-row">
      <span>Te compartieron {what}.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onViewAll}
        className="rounded-full border-[#4c2f92] text-[#4c2f92] hover:bg-[#4c2f92]/10"
      >
        {viewAllLabel}
      </Button>
    </div>
  );
}
