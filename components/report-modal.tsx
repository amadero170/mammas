"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createReport } from "@/app/actions/reports";
import type { Proveedor, Evento } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "provider" | "event";
  targetItem: Proveedor | Evento;
};

const MOTIVOS_OPCIONES = [
  "Información falsa o desactualizada",
  "Negocio o lugar cerrado permanentemente",
  "Contenido inapropiado o spam",
  "Mala experiencia o comportamiento abusivo",
  "Otro motivo",
];

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetItem,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_OPCIONES[0]);
  const [detalles, setDetalles] = useState("");

  const name =
    targetType === "provider"
      ? (targetItem as Proveedor).nombre
      : (targetItem as Evento).titulo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await createReport({
        target_type: targetType,
        target_id: targetItem.id,
        motivo,
        detalles,
      });

      if (!res.success) {
        toast.error("No se pudo enviar el reporte", { description: res.error });
        return;
      }

      toast.success("¡Reporte enviado con éxito!", {
        description:
          "Las administradoras revisarán este reporte a la brevedad. Gracias por cuidar la comunidad 💜",
      });
      onOpenChange(false);
      setDetalles("");
    } catch {
      toast.error("Error inesperado al enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">
              Reportar {targetType === "provider" ? "Proveedor" : "Evento"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Estás reportando &quot;{name}&quot;. Las administradoras revisarán esta información.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-2">
            <Label className="font-semibold">Motivo del reporte</Label>
            <div className="space-y-1.5">
              {MOTIVOS_OPCIONES.map((opcion) => (
                <label
                  key={opcion}
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${
                    motivo === opcion
                      ? "border-red-500 bg-red-50 text-red-900 font-medium"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value={opcion}
                    checked={motivo === opcion}
                    onChange={() => setMotivo(opcion)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold">Detalles adicionales (opcional)</Label>
            <Textarea
              placeholder="Explicanos brevemente qué ocurrió o qué información es incorrecta..."
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar reporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
