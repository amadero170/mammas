"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { TagAutocomplete } from "@/components/ui/tag-autocomplete";

import { PROVIDER_CATEGORIAS, PROVIDER_ZONAS } from "@/lib/constants/providers";
import { PROVIDER_TAGS } from "@/lib/constants/provider-tags";
import { getTags, getCategories, getZones } from "@/app/actions/configuracion";
import type { Proveedor } from "@/lib/types";

export type ProviderFormValues = {
  nombre: string;
  descripcion: string;
  categorias: string[];
  zona: string;
  telefono: string;
  tags: string[];
  mama_owned: boolean;
  sitio_web: string;
  facebook: string;
  instagram: string;
  direccion: string;
  logo_url: string;
  logo_public_id: string;
};

const MAX_CATEGORIAS = 3;

function emptyForm(): ProviderFormValues {
  return {
    nombre: "",
    descripcion: "",
    categorias: [],
    zona: "",
    telefono: "",
    tags: [],
    mama_owned: false,
    sitio_web: "",
    facebook: "",
    instagram: "",
    direccion: "",
    logo_url: "",
    logo_public_id: "",
  };
}

function fromProveedor(p: Proveedor): ProviderFormValues {
  return {
    nombre: p.nombre ?? "",
    descripcion: p.descripcion ?? "",
    categorias: p.categorias ?? [],
    zona: p.zona ?? "",
    telefono: p.telefono ?? "",
    tags: p.tags ?? [],
    mama_owned: p.mama_owned ?? false,
    sitio_web: p.sitio_web ?? "",
    facebook: p.facebook ?? "",
    instagram: p.instagram ?? "",
    direccion: p.direccion ?? "",
    logo_url: p.logo_url ?? "",
    logo_public_id: p.logo_public_id ?? "",
  };
}

type Props = {
  /** Pre-fill for editing; omit for create. */
  provider?: Proveedor | null;
  /** Called when the form is successfully submitted. */
  onSubmit: (values: ProviderFormValues) => Promise<{ success: true } | { success: false; error: string }>;
  /** Label for the submit button. Default: "Enviar" */
  submitLabel?: string;
  /** Label while saving. Default: "Enviando..." */
  savingLabel?: string;
  /** Called after a successful save. */
  onSuccess?: () => void;
  /** Called when cancel is clicked. If omitted, cancel button is hidden. */
  onCancel?: () => void;
  /** If true, reset the form after success. */
  resetOnSuccess?: boolean;
};

export function ProviderForm({
  provider,
  onSubmit,
  submitLabel = "Enviar",
  savingLabel = "Enviando...",
  onSuccess,
  onCancel,
  resetOnSuccess = false,
}: Props) {
  const [saving, setSaving] = useState(false);

  const initial = useMemo(
    () => (provider ? fromProveedor(provider) : emptyForm()),
    [provider]
  );

  const [form, setForm] = useState<ProviderFormValues>(initial);
  const [categoriesList, setCategoriesList] = useState<string[]>([...PROVIDER_CATEGORIAS]);
  const [zonesList, setZonesList] = useState<string[]>([...PROVIDER_ZONAS]);
  const [tagsList, setTagsList] = useState<string[]>([...PROVIDER_TAGS]);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    async function loadOptions() {
      const [catRes, zoneRes, tagRes] = await Promise.all([
        getCategories("provider"),
        getZones(),
        getTags("provider"),
      ]);

      if (catRes.success && catRes.categories.length > 0) {
        setCategoriesList(catRes.categories.map((c) => c.nombre));
      }
      if (zoneRes.success && zoneRes.zones.length > 0) {
        setZonesList(zoneRes.zones.map((z) => z.nombre));
      }
      if (tagRes.success && tagRes.tags.length > 0) {
        setTagsList(tagRes.tags.map((t) => t.nombre));
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("Falta el nombre");
      return;
    }

    setSaving(true);
    try {
      const res = await onSubmit(form);
      if (!res.success) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }
      toast.success(provider ? "Proveedor actualizado" : "Proveedor enviado");
      if (resetOnSuccess) setForm(emptyForm());
      onSuccess?.();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ProviderFormValues, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="grid gap-6">
      {/* Logo */}
      <div className="grid gap-2">
        <Label>Logo / Imagen de Perfil</Label>
        <ImageUpload
          value={form.logo_url}
          onChange={(url, publicId) =>
            setForm((f) => ({
              ...f,
              logo_url: url,
              logo_public_id: publicId || "",
            }))
          }
          onRemove={() =>
            setForm((f) => ({ ...f, logo_url: "", logo_public_id: "" }))
          }
        />
      </div>

      {/* Nombre */}
      <div className="grid gap-2">
        <Label>Nombre *</Label>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej: Fotitos de Familia"
        />
      </div>

      {/* Mama Owned */}
      <div className="flex items-center gap-3">
        <input
          id="mama_owned"
          type="checkbox"
          checked={form.mama_owned}
          onChange={(e) => setForm((f) => ({ ...f, mama_owned: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-[#4c2f92] focus:ring-[#4c2f92]"
        />
        <Label htmlFor="mama_owned" className="cursor-pointer">
          Negocio de una mamá 💜
        </Label>
      </div>

      {/* Descripción */}
      <div className="grid gap-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          placeholder="Breve descripción del servicio"
        />
      </div>

      {/* Categorías (máx 3) + Zona */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Categorías (máx {MAX_CATEGORIAS})</Label>
          <div className="rounded-md border bg-background p-3 max-h-48 overflow-y-auto space-y-2">
            {categoriesList.map((c) => {
              const checked = form.categorias.includes(c);
              const disabled = !checked && form.categorias.length >= MAX_CATEGORIAS;
              return (
                <label
                  key={c}
                  className={`flex items-center gap-2 text-sm cursor-pointer ${
                    disabled ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      setForm((f) => ({
                        ...f,
                        categorias: checked
                          ? f.categorias.filter((cat) => cat !== c)
                          : [...f.categorias, c],
                      }));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[#4c2f92] focus:ring-[#4c2f92]"
                  />
                  {c}
                </label>
              );
            })}
          </div>
          {form.categorias.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {form.categorias.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-[#4c2f92]/10 px-2.5 py-0.5 text-xs font-medium text-[#4c2f92]"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        categorias: f.categorias.filter((cat) => cat !== c),
                      }))
                    }
                    className="ml-0.5 text-[#4c2f92]/60 hover:text-[#4c2f92]"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Zona</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={form.zona}
            onChange={(e) => set("zona", e.target.value)}
          >
            <option value="">Seleccionar zona</option>
            {zonesList.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teléfono */}
      <div className="grid gap-2">
        <Label>Teléfono</Label>
        <Input
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          placeholder="Ej: 322-..."
        />
      </div>

      {/* Tags */}
      <div className="grid gap-2">
        <Label>Tags</Label>
        <TagAutocomplete
          availableTags={tagsList}
          selectedTags={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          placeholder="Escribí para buscar tags..."
        />
      </div>

      {/* Sitio Web + Instagram */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Sitio Web</Label>
          <Input
            value={form.sitio_web}
            onChange={(e) => set("sitio_web", e.target.value)}
            placeholder="https://ejemplo.com"
          />
        </div>
        <div className="grid gap-2">
          <Label>Instagram</Label>
          <Input
            value={form.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </div>
      </div>

      {/* Facebook + Google Maps */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Facebook</Label>
          <Input
            value={form.facebook}
            onChange={(e) => set("facebook", e.target.value)}
            placeholder="https://facebook.com/..."
          />
        </div>
        <div className="grid gap-2">
          <Label>Link Google Maps</Label>
          <Input
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            placeholder="https://maps.google.com/..."
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
