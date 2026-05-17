"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";

import { EVENT_ZONAS } from "@/lib/constants/events";
import type { Evento } from "@/lib/types";

export type EventFormValues = {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  horario_inicio: string;
  horario_fin: string;
  zona: string;
  ubicacion: string;
  google_maps_link: string;
  telefono: string;
  precios: string;
  link_externo: string;
  imagen_url: string;
  imagen_public_id: string;
};

function emptyForm(): EventFormValues {
  return {
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    horario_inicio: "",
    horario_fin: "",
    zona: "",
    ubicacion: "",
    google_maps_link: "",
    telefono: "",
    precios: "",
    link_externo: "",
    imagen_url: "",
    imagen_public_id: "",
  };
}

function fromEvento(event: Evento): EventFormValues {
  return {
    titulo: event.titulo ?? "",
    descripcion: event.descripcion ?? "",
    fecha_inicio: event.fecha_inicio?.split("T")[0] ?? "",
    fecha_fin: event.fecha_fin?.split("T")[0] ?? "",
    horario_inicio: event.horario_inicio ?? "",
    horario_fin: event.horario_fin ?? "",
    zona: event.zona ?? "",
    ubicacion: event.ubicacion ?? "",
    google_maps_link: event.google_maps_link ?? "",
    telefono: event.telefono ?? "",
    precios: event.precios ?? "",
    link_externo: event.link_externo ?? "",
    imagen_url: event.imagen_url ?? "",
    imagen_public_id: event.imagen_public_id ?? "",
  };
}

type Props = {
  /** Pre-fill for editing; omit for create. */
  event?: Evento | null;
  /** Called when the form is successfully submitted. Receives the form values. */
  onSubmit: (values: EventFormValues) => Promise<{ success: true } | { success: false; error: string }>;
  /** Label for the submit button. Default: "Enviar Evento" */
  submitLabel?: string;
  /** Label while saving. Default: "Enviando..." */
  savingLabel?: string;
  /** Called after a successful save. */
  onSuccess?: () => void;
  /** Called when cancel is clicked. If omitted, cancel button is hidden. */
  onCancel?: () => void;
  /** If true, reset the form after success. Useful for "create" flows. */
  resetOnSuccess?: boolean;
};

export function EventForm({
  event,
  onSubmit,
  submitLabel = "Enviar Evento",
  savingLabel = "Enviando...",
  onSuccess,
  onCancel,
  resetOnSuccess = false,
}: Props) {
  const [saving, setSaving] = useState(false);

  const initial = useMemo(
    () => (event ? fromEvento(event) : emptyForm()),
    [event]
  );

  const [form, setForm] = useState<EventFormValues>(initial);

  // Reset when the source event changes (e.g. modal opens with different event)
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const handleSubmit = async () => {
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

    setSaving(true);
    try {
      const res = await onSubmit(form);
      if (!res.success) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }
      toast.success(event ? "Evento actualizado" : "Evento enviado");
      if (resetOnSuccess) setForm(emptyForm());
      onSuccess?.();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof EventFormValues, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="grid gap-6">
      {/* Imagen */}
      <div className="grid gap-2">
        <Label>Imagen del Evento</Label>
        <ImageUpload
          value={form.imagen_url}
          folder="mamas-eventos"
          onChange={(url, publicId) =>
            setForm((f) => ({
              ...f,
              imagen_url: url,
              imagen_public_id: publicId || "",
            }))
          }
          onRemove={() =>
            setForm((f) => ({
              ...f,
              imagen_url: "",
              imagen_public_id: "",
            }))
          }
        />
      </div>

      {/* Título */}
      <div className="grid gap-2">
        <Label>Título *</Label>
        <Input
          value={form.titulo}
          onChange={(e) => set("titulo", e.target.value)}
          placeholder="Ej: Taller de Acuarela para Mamás"
        />
      </div>

      {/* Descripción */}
      <div className="grid gap-2">
        <Label>Descripción *</Label>
        <Textarea
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          placeholder="Describí de qué se trata el evento..."
          rows={4}
        />
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Fecha de inicio *</Label>
          <Input
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => set("fecha_inicio", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Fecha de fin</Label>
          <Input
            type="date"
            value={form.fecha_fin}
            onChange={(e) => set("fecha_fin", e.target.value)}
          />
        </div>
      </div>

      {/* Horarios */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Horario de inicio</Label>
          <Input
            type="time"
            value={form.horario_inicio}
            onChange={(e) => set("horario_inicio", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Horario de fin</Label>
          <Input
            type="time"
            value={form.horario_fin}
            onChange={(e) => set("horario_fin", e.target.value)}
          />
        </div>
      </div>

      {/* Zona */}
      <div className="grid gap-2">
        <Label>Zona</Label>
        <select
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={form.zona}
          onChange={(e) => set("zona", e.target.value)}
        >
          <option value="">Seleccionar zona</option>
          {EVENT_ZONAS.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {/* Ubicación */}
      <div className="grid gap-2">
        <Label>Ubicación *</Label>
        <Input
          value={form.ubicacion}
          onChange={(e) => set("ubicacion", e.target.value)}
          placeholder="Ej: Plaza principal de Bucerías"
        />
      </div>

      {/* Google Maps + Teléfono */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Link Google Maps</Label>
          <Input
            value={form.google_maps_link}
            onChange={(e) => set("google_maps_link", e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>
        <div className="grid gap-2">
          <Label>Teléfono</Label>
          <Input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            placeholder="Ej: 322-..."
          />
        </div>
      </div>

      {/* Precios + Link externo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Precios</Label>
          <Input
            value={form.precios}
            onChange={(e) => set("precios", e.target.value)}
            placeholder="Ej: $350 MXN por persona"
          />
        </div>
        <div className="grid gap-2">
          <Label>Link externo</Label>
          <Input
            value={form.link_externo}
            onChange={(e) => set("link_externo", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}
