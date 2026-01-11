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
            <div className="flex items-center justify-between gap-4">
              <Label>Tags (0..N)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, tags: [] }))}
              >
                Limpiar
              </Button>
            </div>
            <select
              multiple
              className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.tags}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(
                  (o) => o.value
                );
                setForm((f) => ({ ...f, tags: selected }));
              }}
            >
              {PROVIDER_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Tip: mantené presionado Cmd/Ctrl para seleccionar múltiples.
            </p>
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

