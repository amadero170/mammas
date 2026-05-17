"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Proveedor } from "@/lib/types";
import { upsertProvider, type ProviderUpsertInput } from "@/app/actions/proveedores";
import { ProviderForm } from "@/components/forms/provider-form";
import type { ProviderFormValues } from "@/components/forms/provider-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: Proveedor | null;
};

export function ProviderFormDialog({ open, onOpenChange, provider }: Props) {
  const isEdit = Boolean(provider?.id);

  const handleSubmit = async (values: ProviderFormValues) => {
    const payload: ProviderUpsertInput = {
      id: provider?.id,
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      categoria: values.categoria || null,
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
    };

    return upsertProvider(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
          <DialogDescription>
            Completá los datos del proveedor. El nombre es obligatorio.
          </DialogDescription>
        </DialogHeader>

        <ProviderForm
          provider={provider}
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
