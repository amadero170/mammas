"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Globe, Facebook, Instagram, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Proveedor } from "@/lib/types";
import { listProvidersPublic } from "@/app/actions/proveedores";
import { PROVIDER_CATEGORIAS, PROVIDER_ZONAS } from "@/lib/constants/providers";
import { PROVIDER_TAGS } from "@/lib/constants/provider-tags";

/** Asegura que la URL tenga protocolo https:// */
function ensureProtocol(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

export default function DirectorioPage() {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [zona, setZona] = useState<string>("");
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Proveedor[]>([]);

  const filteredTagOptions = useMemo(() => {
    const s = tagSearch.trim().toLowerCase();
    if (!s) return PROVIDER_TAGS;
    return PROVIDER_TAGS.filter((t) => t.toLowerCase().includes(s));
  }, [tagSearch]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await listProvidersPublic({
        q,
        categoria: categoria || undefined,
        zona: zona || undefined,
        tags: selectedTags.length ? selectedTags : undefined,
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
    const t = setTimeout(() => fetchProviders(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoria, zona, selectedTags.join("|")]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Directorio</h1>
        <p className="text-muted-foreground">
          Proveedores activos de Mammas Bahía. Filtros por categoría, zona y
          tags.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-4">
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
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Buscar tag…"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {selectedTags.length ? (
              selectedTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className="rounded-full"
                  title="Quitar tag"
                >
                  <Badge variant="secondary">{t}</Badge>
                </button>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Sin tags seleccionados
              </span>
            )}
          </div>
        </div>

        <div className="max-h-48 overflow-auto rounded-md border bg-background p-3">
          <div className="flex flex-wrap gap-2">
            {filteredTagOptions.slice(0, 120).map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className="rounded-full"
                >
                  <Badge variant={active ? "default" : "outline"}>{t}</Badge>
                </button>
              );
            })}
          </div>
          {filteredTagOptions.length > 120 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Mostrando 120 tags (filtrá con el buscador de tags).
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setQ("");
              setCategoria("");
              setZona("");
              setTagSearch("");
              setSelectedTags([]);
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
          <p className="text-muted-foreground">No hay resultados</p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Probá con otros filtros o limpiá la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{p.nombre}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {p.categoria ? <Badge>{p.categoria}</Badge> : null}
                  {p.zona ? <Badge variant="secondary">{p.zona}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.descripcion ? (
                  <p className="text-sm text-muted-foreground">
                    {p.descripcion}
                  </p>
                ) : null}

                <div className="text-sm">
                  <span className="text-muted-foreground">Tags:</span>{" "}
                  {p.tags?.length ? (
                    <span className="inline-flex flex-wrap gap-1">
                      {p.tags.slice(0, 8).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                      {p.tags.length > 8 ? (
                        <span className="text-xs text-muted-foreground">
                          +{p.tags.length - 8}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Teléfono:</span>{" "}
                  {p.telefono || (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex h-14 items-center justify-center gap-4 border-t">
                {/* Sitio Web */}
                {p.sitio_web ? (
                  <a
                    href={ensureProtocol(p.sitio_web)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-foreground transition-colors hover:bg-accent"
                    title="Sitio web"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="cursor-not-allowed rounded-full p-2 text-muted-foreground/40">
                    <Globe className="h-5 w-5" />
                  </span>
                )}
                {/* Facebook */}
                {p.facebook ? (
                  <a
                    href={ensureProtocol(p.facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-foreground transition-colors hover:bg-accent"
                    title="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="cursor-not-allowed rounded-full p-2 text-muted-foreground/40">
                    <Facebook className="h-5 w-5" />
                  </span>
                )}
                {/* Instagram */}
                {p.instagram ? (
                  <a
                    href={ensureProtocol(p.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-foreground transition-colors hover:bg-accent"
                    title="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="cursor-not-allowed rounded-full p-2 text-muted-foreground/40">
                    <Instagram className="h-5 w-5" />
                  </span>
                )}
                {/* Google Maps (direccion) */}
                {p.direccion ? (
                  <a
                    href={ensureProtocol(p.direccion)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-foreground transition-colors hover:bg-accent"
                    title="Google Maps"
                  >
                    <MapPin className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="cursor-not-allowed rounded-full p-2 text-muted-foreground/40">
                    <MapPin className="h-5 w-5" />
                  </span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
