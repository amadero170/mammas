"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DuplicateMatch } from "@/lib/duplicate-checker";

type DuplicateConfirmModalProps<T extends { id: string; nombre?: string; titulo?: string; telefono?: string | null }> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName: string;
  targetType: "proveedor" | "evento";
  matches: DuplicateMatch<T>[];
  onConfirm: () => void;
};

export function DuplicateConfirmModal<T extends { id: string; nombre?: string; titulo?: string; telefono?: string | null }>({
  open,
  onOpenChange,
  targetName,
  targetType,
  matches,
  onConfirm,
}: DuplicateConfirmModalProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                ⚠️ Posible duplicado detectado
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Revisá los registros coincidentes antes de proceder
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <p className="text-sm text-foreground">
            Estás a punto de activar <strong>&quot;{targetName}&quot;</strong>, pero se encontraron coincidencias con los siguientes {targetType}s existentes:
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border bg-muted/40 p-3">
            {matches.map((m) => {
              const name = m.item.nombre || m.item.titulo || "Sin nombre";
              const reasonText = m.reasons
                .map((r) => (r === "nombre" ? "nombre similar" : "mismo teléfono"))
                .join(" y ");

              return (
                <div key={m.item.id} className="rounded border bg-white p-2 text-xs">
                  <div className="font-bold text-[#4c2f92]">{name}</div>
                  <div className="text-muted-foreground">
                    Teléfono: {m.item.telefono || "Sin teléfono"}
                  </div>
                  <div className="mt-1 font-semibold text-amber-700">
                    Coincidencia: {reasonText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-[#4c2f92] hover:bg-[#3d2575] text-white"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Activar de todos modos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
