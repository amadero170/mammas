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
  title: string;
  /** Qué pasa al confirmar, ej: "dejará de verse en el directorio". */
  description: string;
  confirmText: string;
  loading?: boolean;
  onConfirm: (motivo: string) => void;
};

/** Confirmación para desactivar/despublicar con motivo opcional (se envía por correo a quien lo cargó). */
export function DeactivateDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} Se avisará por correo a quien lo cargó.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="motivo-desactivar">Motivo (opcional, se incluye en el correo)</Label>
          <Textarea
            id="motivo-desactivar"
            placeholder="Ej: El negocio cerró temporalmente, o recibimos reportes de la comunidad..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(motivo)} disabled={loading}>
            {loading ? "Procesando..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
