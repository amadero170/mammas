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
import type { Proveedor } from "@/lib/types";
import { upsertProvider, type ProviderUpsertInput } from "@/app/actions/proveedores";
import { PROVIDER_CATEGORIAS, PROVIDER_ZONAS } from "@/lib/constants/providers";
import { PROVIDER_TAGS } from "@/lib/constants/provider-tags";
import { TagAutocomplete } from "@/components/ui/tag-autocomplete";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: Proveedor | null;
};

export function ProviderFormDialog({ open, onOpenChange, provider }: Props) {
  const isEdit = Boolean(provider?.id);
  const [saving, setSaving] = useState(false);

  const initial = useMemo(
    () => ({
      nombre: provider?.nombre ?? "",
      descripcion: provider?.descripcion ?? "",
      categoria: provider?.categoria ?? "",
      zona: provider?.zona ?? "",
      telefono: provider?.telefono ?? "",
      tags: provider?.tags ?? [],
      sitio_web: provider?.sitio_web ?? "",
      facebook: provider?.facebook ?? "",
      instagram: provider?.instagram ?? "",
      direccion: provider?.direccion ?? "",
    }),
    [provider]
  );

  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const onSave = async () => {
    if (!form.nombre.trim()) {
      toast.error("Falta el nombre");
      return;
    }

    setSaving(true);
    try {
      const payload: ProviderUpsertInput = {
        id: provider?.id,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        categoria: form.categoria || null,
        zona: form.zona || null,
        telefono: form.telefono || null,
        tags: form.tags,
        sitio_web: form.sitio_web || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        direccion: form.direccion || null,
      };

      const res = await upsertProvider(payload);
      if (!res.success) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }

      toast.success(isEdit ? "Proveedor actualizado" : "Proveedor creado");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          <DialogDescription>
            MVP: completá lo mínimo (nombre + categoría/zona) y listo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Lactancia Bahía"
            />
          </div>

          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              placeholder="Breve descripción del servicio"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value }))
                }
              >
                <option value="">Seleccionar categoría</option>
                {PROVIDER_CATEGORIAS.map((c) => (
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
                {PROVIDER_ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Teléfono</Label>
            <Input
              onChange={(e) =>
                setForm((f) => ({ ...f, telefono: e.target.value }))
              }
              value={form.telefono}
              placeholder="Ej: 291-..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <TagAutocomplete
              availableTags={PROVIDER_TAGS}
              selectedTags={form.tags}
              onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              placeholder="Escribí para buscar tags..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Sitio Web</Label>
              <Input
                value={form.sitio_web}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sitio_web: e.target.value }))
                }
                placeholder="https://ejemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Instagram</Label>
              <Input
                value={form.instagram}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instagram: e.target.value }))
                }
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Facebook</Label>
              <Input
                value={form.facebook}
                onChange={(e) =>
                  setForm((f) => ({ ...f, facebook: e.target.value }))
                }
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Link Google Maps</Label>
              <Input
                value={form.direccion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, direccion: e.target.value }))
                }
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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

