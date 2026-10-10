"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "proveedor" | "evento" — solo para los textos */
  targetType: string;
  targetName: string;
  loading?: boolean;
  onConfirm: (motivo: string) => void;
};

/** Diálogo para rechazar una aportación indicando el motivo (se envía por correo a quien la cargó). */
export function RejectDialog({
  open,
  onOpenChange,
  targetType,
  targetName,
  loading = false,
  onConfirm,
}: Props) {
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open) setMotivo("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar {targetType}</DialogTitle>
          <DialogDescription>
            Vas a rechazar <strong>{targetName}</strong>. El motivo se enviará por correo a quien lo
            cargó, y podrá corregirlo y volver a enviarlo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="motivo-rechazo">Motivo del rechazo</Label>
          <Textarea
            id="motivo-rechazo"
            placeholder="Ej: Falta el teléfono de contacto, o ya existe en el directorio..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(motivo)}
            disabled={loading || !motivo.trim()}
          >
            {loading ? "Rechazando..." : "Rechazar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
