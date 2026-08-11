"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Proveedor } from "@/lib/types";
import { listMyProviders, updateMyProvider } from "@/app/actions/proveedores";
import { PROVIDER_CATEGORIAS, PROVIDER_ZONAS } from "@/lib/constants/providers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProviderForm } from "@/components/forms/provider-form";

export default function MisProveedoresPage() {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [zona, setZona] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [editingProvider, setEditingProvider] = useState<Proveedor | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await listMyProviders({
        q,
        categoria: categoria || undefined,
        zona: zona || undefined,
      });
      if (!res.success) {
        toast.error("No se pudo cargar el directorio", {
          description: res.error,
        });
        return;
      }
      setProviders(res.providers);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProviders();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoria, zona]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Proveedores</h1>
        <p className="text-muted-foreground">
          Tus proveedores (MVP): solo los cargados por tu cuenta.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
          />
        </div>
        <div>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {PROVIDER_CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
          >
            <option value="">Todas las zonas</option>
            {PROVIDER_ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4">
          <div className="text-sm text-muted-foreground">
            Tip: nuevos proveedores quedan{" "}
            <span className="font-medium">inactivos</span> y no aparecen aquí
            hasta que un admin los active.
          </div>
        </div>

        <div className="sm:col-span-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setQ("");
              setCategoria("");
              setZona("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no cargaste proveedores
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Podés crear uno desde “Agregar Proveedor”.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{p.nombre}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {p.categorias?.map((cat) => (
                    <Badge key={cat} className="bg-[#4c2f92] text-white">
                      {cat}
                    </Badge>
                  ))}
                  {p.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-purple-200 text-[#4c2f92] bg-purple-50">
                      {tag}
                    </Badge>
                  ))}
                  {p.zona ? <Badge variant="secondary">{p.zona}</Badge> : null}
                  <Badge variant={p.is_active ? "default" : "outline"}>
                    {p.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.descripcion ? (
                  <p className="text-sm text-muted-foreground">
                    {p.descripcion}
                  </p>
                ) : null}

                <div className="space-y-1 text-sm">
                  {p.telefono ? (
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>{" "}
                      {p.telefono}
                    </div>
                  ) : null}
                </div>
              </CardContent>
              {!p.is_active && (
                <div className="px-6 pb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProvider(p)}
                  >
                    Editar borrador
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {editingProvider && (
        <Dialog open={!!editingProvider} onOpenChange={(open) => !open && setEditingProvider(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Proveedor</DialogTitle>
              <DialogDescription>
                Modificá los datos del proveedor seleccionado. Los cambios requerirán aprobación.
              </DialogDescription>
            </DialogHeader>
            <ProviderForm
              provider={editingProvider}
              onSubmit={(values) => updateMyProvider(editingProvider.id, values)}
              submitLabel="Guardar Cambios"
              savingLabel="Guardando..."
              onCancel={() => setEditingProvider(null)}
              onSuccess={() => {
                setEditingProvider(null);
                fetchProviders();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
