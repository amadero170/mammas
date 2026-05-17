"use client";

import { useRouter } from "next/navigation";
import { EventForm } from "@/components/forms/event-form";
import { createEventAsMamma } from "@/app/actions/eventos";
import type { EventFormValues } from "@/components/forms/event-form";

export default function AgregarEventoPage() {
  const router = useRouter();

  const handleSubmit = async (values: EventFormValues) => {
    return createEventAsMamma({
      titulo: values.titulo,
      descripcion: values.descripcion,
      fecha_inicio: values.fecha_inicio,
      fecha_fin: values.fecha_fin || null,
      horario_inicio: values.horario_inicio || null,
      horario_fin: values.horario_fin || null,
      zona: values.zona || null,
      ubicacion: values.ubicacion,
      google_maps_link: values.google_maps_link || null,
      telefono: values.telefono || null,
      precios: values.precios || null,
      link_externo: values.link_externo || null,
      imagen_url: values.imagen_url || null,
      imagen_public_id: values.imagen_public_id || null,
    });
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Agregar Evento</h1>
        <p className="text-muted-foreground">
          Completá estos datos y se enviará para que un admin lo publique.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-6">
        <EventForm
          onSubmit={handleSubmit}
          submitLabel="Enviar Evento"
          savingLabel="Enviando..."
          resetOnSuccess
          onCancel={() => router.push("/dashboard/mis-eventos")}
          onSuccess={() => {
            router.push("/dashboard/mis-eventos");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
