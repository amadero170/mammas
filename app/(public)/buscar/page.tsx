"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowLeft, Globe, Facebook, Instagram, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { Proveedor, Evento } from "@/lib/types";
import { searchAll } from "@/app/actions/search";

/* ── Date helpers (same as eventos page) ── */
const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function formatDateBadge(iso: string): string {
  const d = new Date(iso);
  const day = DAY_NAMES[d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${day} ${dd}/${mm}/${yy}`;
}

/** Ensure URL has https:// */
function ensureProtocol(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function BuscarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [q, setQ] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchAll(trimmed);
      if (!res.success) {
        toast.error("Error al buscar", { description: res.error });
        return;
      }
      setProviders(res.results.providers);
      setEvents(res.results.events);
    } catch {
      toast.error("Error inesperado al buscar");
    } finally {
      setLoading(false);
    }
  };

  // Initial search on mount
  useEffect(() => {
    if (initialQuery.trim()) {
      doSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    // Update URL without full reload
    window.history.replaceState(null, "", `/buscar?q=${encodeURIComponent(trimmed)}`);
    doSearch(trimmed);
  };

  const totalResults = providers.length + events.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header */}
      <div className="bg-[#4c2f92] pb-8 pt-8">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-aller text-2xl font-bold text-white sm:text-3xl">
              Buscar
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center overflow-hidden rounded-full bg-white shadow-lg">
            <input
              type="text"
              placeholder="Buscar proveedores, eventos, servicios..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 bg-transparent px-6 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none sm:text-base"
              autoFocus
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-white transition-colors hover:bg-[#3d2575]"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          {hasSearched && !loading && (
            <p className="mt-3 text-sm text-white/70">
              {totalResults === 0
                ? `No se encontraron resultados para "${initialQuery || q}"`
                : `${totalResults} resultado${totalResults === 1 ? "" : "s"} para "${initialQuery || q}"`}
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="py-20 text-center text-[#2e1b40]/60">
            Buscando...
          </div>
        ) : !hasSearched ? (
          <div className="py-20 text-center text-[#2e1b40]/60">
            Escribí algo para buscar proveedores y eventos.
          </div>
        ) : totalResults === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-[#2e1b40]/60">
              No encontramos resultados.
            </p>
            <p className="mt-2 text-sm text-[#2e1b40]/40">
              Probá con otras palabras o buscá directamente en el{" "}
              <Link href="/directorio" className="text-[#4c2f92] underline">
                directorio
              </Link>{" "}
              o en{" "}
              <Link href="/eventos" className="text-[#4c2f92] underline">
                eventos
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {/* ── Providers Section ── */}
            {providers.length > 0 && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-aller text-xl font-bold text-[#2e1b40] sm:text-2xl">
                    Proveedores ({providers.length})
                  </h2>
                  <Link
                    href={`/directorio?q=${encodeURIComponent(q)}`}
                    className="text-sm font-bold text-[#4c2f92] transition-colors hover:text-[#4c2f92]/70"
                  >
                    ver en directorio →
                  </Link>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {providers.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="relative flex flex-col rounded-none border border-gray-300 bg-white p-6 shadow-sm"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-4">
                        <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 overflow-hidden relative">
                          {p.logo_url ? (
                            <Image
                              src={p.logo_url}
                              alt={p.nombre}
                              fill
                              className="object-cover"
                              sizes="72px"
                            />
                          ) : (
                            <span className="font-aller text-2xl font-bold text-[#4c2f92]">
                              {p.nombre.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-aller text-xl font-bold leading-tight text-[#4c2f92]">
                            {p.nombre}
                          </h3>
                          <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                            {p.categorias?.length
                              ? p.categorias.join(" - ")
                              : "Categoría"}{" "}
                            / {p.zona || "Zona"}
                          </p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="mt-4 flex-1">
                        {p.descripcion && (
                          <p className="text-sm leading-relaxed text-[#2e1b40]/80 line-clamp-3">
                            {p.descripcion}
                          </p>
                        )}
                        {/* Tags */}
                        {p.tags?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {p.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-[#2e1b40] px-2.5 py-0.5 text-[10px] text-[#2e1b40]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="my-4 h-px bg-[#4c2f92]/20" />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {p.sitio_web && (
                            <a
                              href={ensureProtocol(p.sitio_web)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10"
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {p.instagram && (
                            <a
                              href={ensureProtocol(p.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10"
                            >
                              <Instagram className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {p.facebook && (
                            <a
                              href={ensureProtocol(p.facebook)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10"
                            >
                              <Facebook className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <Link href={`/directorio?q=${encodeURIComponent(p.nombre)}`}>
                          <Button
                            size="sm"
                            className="rounded-full bg-[#4c2f92] px-4 font-bold text-white hover:bg-[#3d2575]"
                          >
                            Ver más
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {providers.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link
                      href={`/directorio?q=${encodeURIComponent(q)}`}
                      className="text-sm font-bold text-[#4c2f92] transition-colors hover:text-[#4c2f92]/70"
                    >
                      Ver los {providers.length} proveedores →
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* ── Events Section ── */}
            {events.length > 0 && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-aller text-xl font-bold text-[#2e1b40] sm:text-2xl">
                    Eventos ({events.length})
                  </h2>
                  <Link
                    href="/eventos"
                    className="text-sm font-bold text-[#4c2f92] transition-colors hover:text-[#4c2f92]/70"
                  >
                    ver todos los eventos →
                  </Link>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {events.slice(0, 6).map((evt) => {
                    const dateBadge = formatDateBadge(evt.fecha_inicio);
                    const horarioDisplay = evt.horario_inicio
                      ? evt.horario_fin
                        ? `${evt.horario_inicio} - ${evt.horario_fin}`
                        : evt.horario_inicio
                      : null;

                    let websiteDisplay: string | null = null;
                    try {
                      if (evt.link_externo)
                        websiteDisplay = new URL(evt.link_externo).hostname.replace("www.", "");
                    } catch {
                      websiteDisplay = evt.link_externo;
                    }

                    return (
                      <div key={evt.id} className="flex flex-col">
                        {/* Date badge */}
                        <span className="mb-2 text-sm font-bold tracking-wide text-[#4c2f92]">
                          {dateBadge}
                        </span>

                        {/* Image */}
                        {evt.imagen_url ? (
                          <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                            <Image
                              src={evt.imagen_url}
                              alt={evt.titulo}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-[#f5f0ff]">
                            <span className="text-sm text-[#2e1b40]/40">
                              Imagen del evento
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="mt-3 text-lg font-bold leading-snug text-[#2e1b40]">
                          {evt.titulo}
                        </h3>

                        {/* Description */}
                        <p className="mt-1 text-sm leading-relaxed text-[#2e1b40]/70 line-clamp-3">
                          {evt.descripcion}
                        </p>

                        {/* Metadata rows */}
                        <div className="mt-3 space-y-1.5">
                          {websiteDisplay && (
                            <MetaRow
                              icon="/iconos/Directorio_eventos_website.png"
                              text={websiteDisplay}
                            />
                          )}
                          {horarioDisplay && (
                            <MetaRow
                              icon="/iconos/Eventos_horario.png"
                              text={horarioDisplay}
                            />
                          )}
                          {evt.telefono && (
                            <MetaRow
                              icon="/iconos/Directorio_Eventos_telefono.png"
                              text={evt.telefono}
                            />
                          )}
                          {evt.precios && (
                            <MetaRow
                              icon="/iconos/Directorio_Eventos_tag.png"
                              text={evt.precios}
                            />
                          )}
                          {evt.ubicacion && (
                            <MetaRow
                              icon="/iconos/Directorio_evetos_location.png"
                              text={evt.ubicacion}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {events.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link
                      href="/eventos"
                      className="text-sm font-bold text-[#4c2f92] transition-colors hover:text-[#4c2f92]/70"
                    >
                      Ver los {events.length} eventos →
                    </Link>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small helper for event metadata rows ── */
function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={icon}
        alt=""
        width={16}
        height={16}
        className="shrink-0 object-contain"
      />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted-foreground">
          Cargando...
        </div>
      }
    >
      <BuscarContent />
    </Suspense>
  );
}
