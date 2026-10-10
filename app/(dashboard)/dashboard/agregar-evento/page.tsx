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
        <h1 className="text-3xl font-bold">Nuevo evento</h1>
        <p className="text-muted-foreground">
          Completa estos datos y lo enviaremos a revisión. Cuando una administradora lo apruebe,
          aparecerá en la página de eventos y te avisaremos por correo.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-6">
        <EventForm
          onSubmit={handleSubmit}
          submitLabel="Enviar Evento"
          savingLabel="Enviando..."
          resetOnSuccess
          successMessage={{
            title: "¡Evento enviado a revisión!",
            description: "Te avisaremos por correo cuando una administradora lo revise. Revisa también tu carpeta de spam.",
          }}
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
