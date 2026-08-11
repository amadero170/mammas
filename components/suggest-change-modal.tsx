"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileEdit, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSuggestion } from "@/app/actions/suggestions";
import type { Proveedor, Evento } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "provider" | "event";
  targetItem: Proveedor | Evento;
};

export function SuggestChangeModal({
  open,
  onOpenChange,
  targetType,
  targetItem,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [comentario, setComentario] = useState("");

  // Form states based on targetType
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (targetType === "provider") {
      const p = targetItem as Proveedor;
      setForm({
        nombre: p.nombre ?? "",
        descripcion: p.descripcion ?? "",
        telefono: p.telefono ?? "",
        zona: p.zona ?? "",
        sitio_web: p.sitio_web ?? "",
        instagram: p.instagram ?? "",
        facebook: p.facebook ?? "",
        direccion: p.direccion ?? "",
      });
    } else {
      const e = targetItem as Evento;
      setForm({
        titulo: e.titulo ?? "",
        descripcion: e.descripcion ?? "",
        ubicacion: e.ubicacion ?? "",
        direccion: e.direccion ?? "",
        telefono: e.telefono ?? "",
        precios: e.precios ?? "",
        zona: e.zona ?? "",
        link_externo: e.link_externo ?? "",
      });
    }
  }, [targetType, targetItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await createSuggestion({
        target_type: targetType,
        target_id: targetItem.id,
        datos_sugeridos: form,
        comentario,
      });

      if (!res.success) {
        toast.error("No se pudo enviar la sugerencia", { description: res.error });
        return;
      }

      toast.success("¡Sugerencia enviada con éxito!", {
        description: "Un administrador la revisará a la brevedad. ¡Gracias por contribuir! 💜",
      });
      onOpenChange(false);
      setComentario("");
    } catch {
      toast.error("Error inesperado al enviar sugerencia");
    } finally {
      setSubmitting(false);
    }
  };

  const name = targetType === "provider" ? (targetItem as Proveedor).nombre : (targetItem as Evento).titulo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#4c2f92]">
            <FileEdit className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">
              Sugerir un cambio
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Editá la información de &quot;{name}&quot; que desees corregir y agregá un comentario explicativo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {targetType === "provider" ? (
            <>
              <div className="grid gap-2">
                <Label>Nombre del Proveedor</Label>
                <Input
                  value={form.nombre || ""}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.descripcion || ""}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.telefono || ""}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Zona</Label>
                  <Input
                    value={form.zona || ""}
                    onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Dirección</Label>
                <Input
                  value={form.direccion || ""}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Sitio Web</Label>
                  <Input
                    value={form.sitio_web || ""}
                    onChange={(e) => setForm((f) => ({ ...f, sitio_web: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Instagram</Label>
                  <Input
                    value={form.instagram || ""}
                    onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Facebook</Label>
                  <Input
                    value={form.facebook || ""}
                    onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>Título del Evento</Label>
                <Input
                  value={form.titulo || ""}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.descripcion || ""}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Ubicación</Label>
                  <Input
                    value={form.ubicacion || ""}
                    onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dirección</Label>
                  <Input
                    value={form.direccion || ""}
                    onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.telefono || ""}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Precios</Label>
                  <Input
                    value={form.precios || ""}
                    onChange={(e) => setForm((f) => ({ ...f, precios: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Zona</Label>
                  <Input
                    value={form.zona || ""}
                    onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t pt-3 grid gap-2">
            <Label className="font-bold text-[#4c2f92]">
              Comentario para la Administradora
            </Label>
            <Textarea
              placeholder="Ej: Cambio el número de teléfono porque me dijeron que cambió..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
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
              className="bg-[#4c2f92] hover:bg-[#3d2575] text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar sugerencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
