"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Evento } from "@/lib/types";
import { upsertEvent, type EventUpsertInput } from "@/app/actions/eventos";
import { EventForm } from "@/components/forms/event-form";
import type { EventFormValues } from "@/components/forms/event-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Evento | null;
};

export function EventFormDialog({ open, onOpenChange, event }: Props) {
  const isEdit = Boolean(event?.id);

  const handleSubmit = async (values: EventFormValues) => {
    const payload: EventUpsertInput = {
      id: event?.id,
      titulo: values.titulo,
      descripcion: values.descripcion,
      fecha_inicio: values.fecha_inicio,
      fecha_fin: values.fecha_fin || null,
      ubicacion: values.ubicacion,
      direccion: null,
      google_maps_link: values.google_maps_link || null,
      categoria: "",
      imagen_url: values.imagen_url || null,
      imagen_public_id: values.imagen_public_id || null,
      link_externo: values.link_externo || null,
      horario_inicio: values.horario_inicio || null,
      horario_fin: values.horario_fin || null,
      telefono: values.telefono || null,
      precios: values.precios || null,
      zona: values.zona || null,
    };

    return upsertEvent(payload);
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

        <EventForm
          event={event}
          onSubmit={handleSubmit}
          submitLabel="Guardar"
          savingLabel="Guardando..."
          onCancel={() => onOpenChange(false)}
          onSuccess={() => {
            onOpenChange(false);
            window.location.reload();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
