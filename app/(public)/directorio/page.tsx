"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Globe, Facebook, Instagram, MapPin, Star, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Proveedor } from "@/lib/types";
import { listProvidersPublic } from "@/app/actions/proveedores";
import { getProviderRatingsSummary, getMyRatings, type RatingSummary } from "@/app/actions/ratings";
import { PROVIDER_CATEGORIAS, PROVIDER_ZONAS } from "@/lib/constants/providers";
import { PROVIDER_TAGS } from "@/lib/constants/provider-tags";
import { getCategories, getZones, getTags } from "@/app/actions/configuracion";
import { createClient } from "@/lib/supabase/client";
import { RatingModal } from "@/components/rating-modal";
import { LoginModal } from "@/components/login-modal";

/** Asegura que la URL tenga protocolo https:// */
function ensureProtocol(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

function DirectorioContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [categoria, setCategoria] = useState<string>(searchParams.get("categoria") ?? "");
  const [zona, setZona] = useState<string>("");
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Rating state
  const [ratingsSummary, setRatingsSummary] = useState<Record<string, RatingSummary>>({});
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setUserRole(profile?.role ?? null);
      }
    });
  }, []);

  const [allCategories, setAllCategories] = useState<string[]>([...PROVIDER_CATEGORIAS]);
  const [allZones, setAllZones] = useState<string[]>([...PROVIDER_ZONAS]);
  const [allTags, setAllTags] = useState<string[]>([...PROVIDER_TAGS]);

  useEffect(() => {
    async function loadDynamicOptions() {
      const [catRes, zoneRes, tagRes] = await Promise.all([
        getCategories("provider"),
        getZones(),
        getTags("provider"),
      ]);
      if (catRes.success && catRes.categories.length > 0) {
        setAllCategories(catRes.categories.map((c) => c.nombre));
      }
      if (zoneRes.success && zoneRes.zones.length > 0) {
        setAllZones(zoneRes.zones.map((z) => z.nombre));
      }
      if (tagRes.success && tagRes.tags.length > 0) {
        setAllTags(tagRes.tags.map((t) => t.nombre));
      }
    }
    loadDynamicOptions();
  }, []);

  const filteredTagOptions = useMemo(() => {
    const s = tagSearch.trim().toLowerCase();
    if (!s) return allTags;
    return allTags.filter((t) => t.toLowerCase().includes(s));
  }, [tagSearch, allTags]);

  const fetchRatings = useCallback(async (providerIds: string[]) => {
    if (!providerIds.length) return;
    try {
      const [summaryData, myData] = await Promise.all([
        getProviderRatingsSummary(providerIds),
        getMyRatings(providerIds),
      ]);
      setRatingsSummary(summaryData);
      setMyRatings(myData);
    } catch {
      // Silent fail — ratings are non-critical
    }
  }, []);

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
      // Fetch ratings for loaded providers
      const ids = res.providers.map((p) => p.id);
      fetchRatings(ids);
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
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]">
      {/* Header Banner */}
      <div className="container mx-auto px-4 py-12 text-center md:py-20">
        <h1 className="font-aller text-4xl leading-[1.1] tracking-wider text-[#2e1b40] uppercase md:text-6xl">
          Sabiduría Local<br />Colectiva·Bahía
        </h1>
        <p className="mt-6 text-lg text-[#2e1b40]/80 md:text-xl">
          Las mamás todo lo encuentran
        </p>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 md:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Descripción"
            className="h-12 w-full rounded-full border border-[#4c2f92] px-6 text-[#2e1b40] placeholder:text-gray-400 focus-visible:ring-[#4c2f92] md:w-auto md:flex-1"
          />
          <select
            className="h-12 w-full cursor-pointer appearance-none rounded-full border border-[#4c2f92] bg-white px-6 text-[#2e1b40] focus:outline-none focus:ring-2 focus:ring-[#4c2f92] md:w-48"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Categorías ⌄</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="h-12 w-full cursor-pointer appearance-none rounded-full border border-[#4c2f92] bg-white px-6 text-[#2e1b40] focus:outline-none focus:ring-2 focus:ring-[#4c2f92] md:w-48"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
          >
            <option value="">Zona ⌄</option>
            {allZones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          <div className="relative w-full md:w-64">
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Buscar tag..."
              className="h-12 w-full rounded-full border border-[#4c2f92] px-6 pr-12 text-[#2e1b40] placeholder:text-gray-400 focus-visible:ring-[#4c2f92]"
            />
            <div
              onClick={() => setTagsModalOpen(true)}
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#9acaaa] text-xs font-bold text-white cursor-pointer hover:bg-[#86b595] transition-colors"
            >
              ?
            </div>
          </div>

          <button
            onClick={() => {
              setQ("");
              setCategoria("");
              setZona("");
              setTagSearch("");
              setSelectedTags([]);
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-white transition-colors hover:bg-[#3d2575]"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {selectedTags.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-5xl flex-wrap gap-2 justify-center">
            {selectedTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className="rounded-full border border-[#2e1b40] bg-[#2e1b40] px-3 py-1 text-xs text-white hover:bg-opacity-80"
              >
                {t} ✕
              </button>
            ))}
          </div>
        )}

        {/* Selected Tags list below search if search active */}
        {tagSearch.trim() && (
          <div className="mx-auto mt-2 max-w-5xl flex flex-wrap gap-2 justify-center">
             {filteredTagOptions.slice(0, 20).map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`rounded-full border border-[#2e1b40] px-3 py-1 text-xs transition-colors ${active ? "bg-[#2e1b40] text-white" : "bg-white text-[#2e1b40] hover:bg-gray-100"}`}
                  >
                    {t}
                  </button>
                );
              })}
          </div>
        )}

        {/* Tags browser modal */}
        <Dialog open={tagsModalOpen} onOpenChange={setTagsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lista de Tags Disponibles</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5 pt-4">
              {[...allTags].sort((a, b) => a.localeCompare(b)).map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`rounded-full border border-[#2e1b40] px-3 py-1 text-xs transition-colors ${
                      active ? "bg-[#2e1b40] text-white" : "bg-white text-[#2e1b40] hover:bg-gray-100"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setTagsModalOpen(false)}>Listo</Button>
            </div>
          </DialogContent>
        </Dialog>

        {user && (
          <div className="mx-auto mt-6 flex max-w-5xl justify-end">
            <Link href="/dashboard/agregar-proveedor">
              <Button
                variant="outline"
                className="rounded-full border border-[#4c2f92] px-6 font-bold text-[#4c2f92] hover:bg-[#4c2f92]/5"
              >
                agregar +
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="py-20 text-center text-[#2e1b40]/60">
            Cargando proveedores...
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center text-[#2e1b40]/60">
            No se encontraron resultados.
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
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
                      {(p.categorias?.length ? p.categorias.join(" - ") : "Categoría")} / {p.zona || "Zona"}
                    </p>
                    {(() => {
                      const summary = ratingsSummary[p.id];
                      const avg = summary?.avg_rating ?? 0;
                      const total = summary?.total_ratings ?? 0;
                      return (
                        <div className="mt-2 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i <= Math.round(avg)
                                  ? "fill-[#e5f34a] text-[#e5f34a]"
                                  : "fill-gray-300 text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-xs font-bold text-gray-600">
                            {total > 0 ? `${avg} (${total})` : "Sin calificaciones"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>



                {/* Body */}
                <div className="mt-6 flex-1 space-y-4">
                  {p.descripcion && (
                    <p className="text-sm leading-relaxed text-[#2e1b40]/80">
                      {p.descripcion}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-semibold text-[#2e1b40]">
                        Teléfono:
                      </span>{" "}
                      <span className="text-[#2e1b40]/80">
                        {p.telefono || "—"}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-[#2e1b40]">
                        Dirección:
                      </span>{" "}
                      {p.direccion ? (
                        <a
                          href={ensureProtocol(p.direccion)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4c2f92] underline underline-offset-2 hover:text-[#3d2575] inline-block max-w-[70%] truncate align-bottom"
                        >
                          {p.direccion}
                        </a>
                      ) : (
                        <span className="text-[#2e1b40]/80">—</span>
                      )}
                    </div>
                    
                    {/* Tags & Badge */}
                    <div className="relative mt-4 flex pt-1">
                      <span className="mr-2 text-xs font-semibold text-[#2e1b40] pt-0.5">
                        Tags:
                      </span>
                      <div className="flex flex-wrap gap-1 pr-16">
                        {p.tags?.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-[#2e1b40] px-2.5 py-0.5 text-[10px] text-[#2e1b40]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      {p.mama_owned && (
                        <div className="absolute -right-2 -top-4">
                          <Image
                            src="/iconos/Badge_negocio_de_mama.png"
                            alt="Mama Owned Business"
                            width={46}
                            height={46}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Divider line */}
                <div className="my-5 h-px bg-[#4c2f92]/20" />

                {/* Footer Icons & CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <a
                      href={ensureProtocol(p.sitio_web || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center h-9 w-9 rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10 ${
                        !p.sitio_web && "cursor-not-allowed opacity-30"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                    <a
                      href={ensureProtocol(p.facebook || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center h-9 w-9 rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10 ${
                        !p.facebook && "cursor-not-allowed opacity-30"
                      }`}
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                    <a
                      href={ensureProtocol(p.instagram || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center h-9 w-9 rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10 ${
                        !p.instagram && "cursor-not-allowed opacity-30"
                      }`}
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a
                      href={ensureProtocol(p.direccion || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center h-9 w-9 rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10 ${
                        !p.direccion && "cursor-not-allowed opacity-30"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </a>
                  </div>
                  <Button
                    className="rounded-full bg-[#4c2f92] px-6 py-4 font-bold text-white hover:bg-[#3d2575]"
                    onClick={() => {
                      if (!user) {
                        setLoginModalOpen(true);
                        return;
                      }
                      if (userRole !== "mamma" && userRole !== "admin") {
                        toast.error("Solo mamás pueden calificar");
                        return;
                      }
                      setRatingTarget({ id: p.id, name: p.nombre });
                      setRatingModalOpen(true);
                    }}
                  >
                    {myRatings[p.id] ? "Editar calificación" : "Calificar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingTarget && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          providerId={ratingTarget.id}
          providerName={ratingTarget.name}
          currentRating={myRatings[ratingTarget.id] ?? null}
          onRated={(providerId, score) => {
            // Update local state immediately
            setMyRatings((prev) => ({ ...prev, [providerId]: score }));
            // Recalculate summary optimistically
            setRatingsSummary((prev) => {
              const existing = prev[providerId];
              const hadPrevious = myRatings[providerId] != null;
              if (existing) {
                const newTotal = hadPrevious ? existing.total_ratings : existing.total_ratings + 1;
                const oldSum = existing.avg_rating * existing.total_ratings;
                const newSum = hadPrevious
                  ? oldSum - (myRatings[providerId] ?? 0) + score
                  : oldSum + score;
                return {
                  ...prev,
                  [providerId]: {
                    avg_rating: Math.round((newSum / newTotal) * 10) / 10,
                    total_ratings: newTotal,
                  },
                };
              }
              return {
                ...prev,
                [providerId]: { avg_rating: score, total_ratings: 1 },
              };
            });
          }}
        />
      )}

      {/* Login Modal */}
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
}

export default function DirectorioPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando directorio...</div>}>
      <DirectorioContent />
    </Suspense>
  );
}
