"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { createProviderAsMamma } from "@/app/actions/proveedores";
import { PROVIDER_CATEGORIAS, PROVIDER_ZONAS } from "@/lib/constants/providers";
import { PROVIDER_TAGS } from "@/lib/constants/provider-tags";
import { TagAutocomplete } from "@/components/ui/tag-autocomplete";

export default function AgregarProveedorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    zona: "",
    telefono: "",
    tags: [] as string[],
    sitio_web: "",
    facebook: "",
    instagram: "",
    direccion: "",
  });

  const onSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("Falta el nombre");
      return;
    }

    setSaving(true);
    try {
      const res = await createProviderAsMamma({
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
      });

      if (!res.success) {
        toast.error("No se pudo enviar", { description: res.error });
        return;
      }

      toast.success("Proveedor enviado", {
        description: "Quedó inactivo hasta que un admin lo active.",
      });
      router.push("/dashboard/mis-proveedores");
      router.refresh();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
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
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Ej: Fotitos de Familia"
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
              value={form.telefono}
              onChange={(e) =>
                setForm((f) => ({ ...f, telefono: e.target.value }))
              }
              placeholder="Ej: 322-..."
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/mis-proveedores")}
            >
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
