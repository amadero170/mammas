"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Evento } from "@/lib/types";
import { upsertEvent, type EventUpsertInput } from "@/app/actions/eventos";
import { EVENT_CATEGORIAS, EVENT_ZONAS } from "@/lib/constants/events";
import { ImageUpload } from "@/components/ui/image-upload";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Evento | null;
};

/** Convert ISO string to local datetime-local input value */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // Format: YYYY-MM-DDTHH:MM
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function EventFormDialog({ open, onOpenChange, event }: Props) {
  const isEdit = Boolean(event?.id);
  const [saving, setSaving] = useState(false);

  const initial = useMemo(
    () => ({
      titulo: event?.titulo ?? "",
      descripcion: event?.descripcion ?? "",
      fecha_inicio: toDatetimeLocal(event?.fecha_inicio),
      fecha_fin: toDatetimeLocal(event?.fecha_fin),
      ubicacion: event?.ubicacion ?? "",
      direccion: event?.direccion ?? "",
      google_maps_link: event?.google_maps_link ?? "",
      categoria: event?.categoria ?? "",
      imagen_url: event?.imagen_url ?? "",
      imagen_public_id: event?.imagen_public_id ?? "",
      link_externo: event?.link_externo ?? "",
      horario_inicio: event?.horario_inicio ?? "",
      horario_fin: event?.horario_fin ?? "",
      telefono: event?.telefono ?? "",
      precios: event?.precios ?? "",
      zona: event?.zona ?? "",
    }),
    [event]
  );

  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const onSave = async () => {
    if (!form.titulo.trim()) {
      toast.error("Falta el título");
      return;
    }
    if (!form.descripcion.trim()) {
      toast.error("Falta la descripción");
      return;
    }
    if (!form.fecha_inicio) {
      toast.error("Falta la fecha de inicio");
      return;
    }
    if (!form.ubicacion.trim()) {
      toast.error("Falta la ubicación");
      return;
    }
    if (!form.categoria) {
      toast.error("Falta la categoría");
      return;
    }

    setSaving(true);
    try {
      const payload: EventUpsertInput = {
        id: event?.id,
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin: form.fecha_fin
          ? new Date(form.fecha_fin).toISOString()
          : null,
        ubicacion: form.ubicacion,
        direccion: form.direccion || null,
        google_maps_link: form.google_maps_link || null,
        categoria: form.categoria,
        imagen_url: form.imagen_url || null,
        imagen_public_id: form.imagen_public_id || null,
        link_externo: form.link_externo || null,
        horario_inicio: form.horario_inicio || null,
        horario_fin: form.horario_fin || null,
        telefono: form.telefono || null,
        precios: form.precios || null,
        zona: form.zona || null,
      };

      const res = await upsertEvent(payload);
      if (!res.success) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }

      toast.success(isEdit ? "Evento actualizado" : "Evento creado");
      onOpenChange(false);
      window.location.reload();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
          <DialogDescription>
            Completá los datos del evento. Los campos con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Título */}
          <div className="grid gap-2">
            <Label>Título *</Label>
            <Input
              value={form.titulo}
              onChange={(e) =>
                setForm((f) => ({ ...f, titulo: e.target.value }))
              }
              placeholder="Ej: Ceremonia Infinity con Cacao"
            />
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <Label>Descripción *</Label>
            <Textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              placeholder="Breve descripción del evento"
              rows={3}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Fecha inicio *</Label>
              <Input
                type="datetime-local"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fecha_inicio: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Fecha fin (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fecha_fin: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Horario inicio</Label>
              <Input
                value={form.horario_inicio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, horario_inicio: e.target.value }))
                }
                placeholder="Ej: 7:00 pm"
              />
            </div>
            <div className="grid gap-2">
              <Label>Horario fin</Label>
              <Input
                value={form.horario_fin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, horario_fin: e.target.value }))
                }
                placeholder="Ej: 8:00 pm"
              />
            </div>
          </div>

          {/* Categoría y Zona */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Categoría *</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value }))
                }
              >
                <option value="">Seleccionar categoría</option>
                {EVENT_CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Zona</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.zona}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zona: e.target.value }))
                }
              >
                <option value="">Seleccionar zona</option>
                {EVENT_ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid gap-2">
            <Label>Ubicación *</Label>
            <Input
              value={form.ubicacion}
              onChange={(e) =>
                setForm((f) => ({ ...f, ubicacion: e.target.value }))
              }
              placeholder="Ej: Av. Mexico 1234, Nvo Nayarit"
            />
          </div>

          {/* Teléfono y Precios */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input
                value={form.telefono}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefono: e.target.value }))
                }
                placeholder="Ej: +52 (322) 100 22 33"
              />
            </div>
            <div className="grid gap-2">
              <Label>Precios</Label>
              <Input
                value={form.precios}
                onChange={(e) =>
                  setForm((f) => ({ ...f, precios: e.target.value }))
                }
                placeholder="Ej: 200 MXN"
              />
            </div>
          </div>

          {/* Imagen */}
          <div className="grid gap-2">
            <Label>Imagen del Evento</Label>
            <ImageUpload
              value={form.imagen_url}
              onChange={(url, publicId) =>
                setForm((f) => ({ ...f, imagen_url: url, imagen_public_id: publicId || "" }))
              }
              onRemove={() => setForm((f) => ({ ...f, imagen_url: "", imagen_public_id: "" }))}
            />
          </div>

          {/* Link externo */}
          <div className="grid gap-2">
            <Label>URL de información (sitio web, FB, IG)</Label>
            <Input
              value={form.link_externo}
              onChange={(e) =>
                setForm((f) => ({ ...f, link_externo: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          {/* Dirección y Google Maps */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Dirección</Label>
              <Input
                value={form.direccion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, direccion: e.target.value }))
                }
                placeholder="Dirección física"
              />
            </div>
            <div className="grid gap-2">
              <Label>Link Google Maps</Label>
              <Input
                value={form.google_maps_link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, google_maps_link: e.target.value }))
                }
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
