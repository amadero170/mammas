"use client";

import { useRouter } from "next/navigation";
import { ProviderForm } from "@/components/forms/provider-form";
import { createProviderAsMamma } from "@/app/actions/proveedores";
import type { ProviderFormValues } from "@/components/forms/provider-form";

export default function AgregarProveedorPage() {
  const router = useRouter();

  const handleSubmit = async (values: ProviderFormValues) => {
    return createProviderAsMamma({
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      categorias: values.categorias.length ? values.categorias : [],
      zona: values.zona || null,
      telefono: values.telefono || null,
      tags: values.tags,
      mama_owned: values.mama_owned,
      sitio_web: values.sitio_web || null,
      facebook: values.facebook || null,
      instagram: values.instagram || null,
      direccion: values.direccion || null,
      logo_url: values.logo_url || null,
      logo_public_id: values.logo_public_id || null,
    });
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Agregar Proveedor</h1>
        <p className="text-muted-foreground">
          Completá estos datos y se enviará para que un admin lo active.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-6">
        <ProviderForm
          onSubmit={handleSubmit}
          submitLabel="Enviar"
          savingLabel="Enviando..."
          resetOnSuccess
          onCancel={() => router.push("/dashboard/mis-proveedores")}
          onSuccess={() => {
            router.push("/dashboard/mis-proveedores");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
