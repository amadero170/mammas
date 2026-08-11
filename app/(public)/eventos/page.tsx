"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { RefreshCw, FileEdit, Flag, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { Evento } from "@/lib/types";
import { listEventsPublic } from "@/app/actions/eventos";
import { EVENT_ZONAS } from "@/lib/constants/events";
import { EVENT_TAGS } from "@/lib/constants/event-tags";
import { getCategories, getZones, getTags } from "@/app/actions/configuracion";
import { createClient } from "@/lib/supabase/client";
import { LoginModal } from "@/components/login-modal";
import { SuggestChangeModal } from "@/components/suggest-change-modal";
import { ReportModal } from "@/components/report-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Date helpers ── */
const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTH_NAMES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

const MONTH_OPTIONS = MONTH_NAMES.map((label, i) => ({
  label,
  value: String(i + 1).padStart(2, "0"),
}));

function formatDateBadge(iso: string): string {
  const d = new Date(iso);
  const day = DAY_NAMES[d.getUTCDay()];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${day} ${dd}/${mm}/${yy}`;
}

function formatDateBadgeRange(inicio: string, fin: string | null): string {
  if (!fin) return formatDateBadge(inicio);
  const s = new Date(inicio);
  const e = new Date(fin);
  if (s.toDateString() === e.toDateString()) return formatDateBadge(inicio);

  const sDay = DAY_NAMES[s.getUTCDay()];
  const eDay = DAY_NAMES[e.getUTCDay()];
  const sDd = String(s.getUTCDate()).padStart(2, "0");
  const eDd = String(e.getUTCDate()).padStart(2, "0");
  const mm = String(s.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(s.getUTCFullYear()).slice(-2);
  return `${sDay}·${eDay} ${sDd}, ${eDd}/${mm}/${yy}`;
}

/* ── Group events by month ── */
function groupByMonth(events: Evento[]): [string, Evento[]][] {
  const map = new Map<string, Evento[]>();
  for (const evt of events) {
    const d = new Date(evt.fecha_inicio);
    const key = MONTH_NAMES[d.getUTCMonth()];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(evt);
  }
  return Array.from(map.entries());
}

/* ── MetaRow helper ── */
function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src={icon} alt="" width={16} height={16} className="shrink-0 object-contain" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

export default function EventosPage() {
  const [q, setQ] = useState("");
  const [mes, setMes] = useState("");
  const [zona, setZona] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Evento[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [suggestTarget, setSuggestTarget] = useState<Evento | null>(null);
  const [reportTarget, setReportTarget] = useState<Evento | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await listEventsPublic({
        q,
        zona: zona || undefined,
      });
      if (!res.success) {
        toast.error("No se pudo cargar los eventos", { description: res.error });
        return;
      }
      setEvents(res.events);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchEvents(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, zona]);

  const [allZones, setAllZones] = useState<string[]>([...EVENT_ZONAS]);
  const [allTags, setAllTags] = useState<string[]>([...EVENT_TAGS]);

  useEffect(() => {
    async function loadDynamicOptions() {
      const [zoneRes, tagRes] = await Promise.all([
        getZones(),
        getTags("event"),
      ]);
      if (zoneRes.success && zoneRes.zones.length > 0) {
        setAllZones(zoneRes.zones.map((z) => z.nombre));
      }
      if (tagRes.success && tagRes.tags.length > 0) {
        setAllTags(tagRes.tags.map((t) => t.nombre));
      }
    }
    loadDynamicOptions();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTagOptions = useMemo(() => {
    const s = tagSearch.trim().toLowerCase();
    if (!s) return allTags;
    return allTags.filter((t) => t.toLowerCase().includes(s));
  }, [tagSearch, allTags]);

  /* Client-side month + tag filter */
  const filtered = useMemo(() => {
    let result = events;
    if (mes) {
      result = result.filter((evt) => {
        const d = new Date(evt.fecha_inicio);
        return String(d.getUTCMonth() + 1).padStart(2, "0") === mes;
      });
    }
    if (selectedTags.length) {
      result = result.filter((evt) =>
        selectedTags.every(
          (tag) =>
            evt.tags?.includes(tag) ||
            evt.titulo.toLowerCase().includes(tag.toLowerCase()) ||
            evt.descripcion?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }
    return result;
  }, [events, mes, selectedTags]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]">
      {/* ── Header Banner (same as /directorio) ── */}
      <div className="container mx-auto px-4 py-12 text-center md:py-20">
        <h1 className="font-aller text-4xl leading-[1.1] tracking-wider text-[#2e1b40] uppercase md:text-6xl">
          Sabiduría Local<br />Colectiva·Bahía
        </h1>
        <p className="mt-6 text-lg text-[#2e1b40]/80 md:text-xl">
          Las mamás todo lo encuentran
        </p>
      </div>

      {/* ── Filters Section ── */}
      <div className="container mx-auto px-4 pb-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 md:flex-row">
          {/* Descripción */}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Descripción"
            className="h-12 w-full rounded-full border border-[#4c2f92] px-6 text-[#2e1b40] placeholder:text-gray-400 focus-visible:ring-[#4c2f92] md:w-auto md:flex-1"
          />

          {/* Mes */}
          <select
            className="h-12 w-full cursor-pointer appearance-none rounded-full border border-[#4c2f92] bg-white px-6 text-[#2e1b40] focus:outline-none focus:ring-2 focus:ring-[#4c2f92] md:w-48"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          >
            <option value="">Mes ⌄</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Zona */}
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

          {/* Buscar tag */}
          <div className="relative w-full md:w-64">
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Buscar tag..."
              className="h-12 w-full rounded-full border border-[#4c2f92] px-6 pr-12 text-[#2e1b40] placeholder:text-gray-400 focus-visible:ring-[#4c2f92]"
            />
            <div className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#9acaaa] text-xs font-bold text-white cursor-pointer hover:bg-[#86b595] transition-colors">
              ?
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              setQ("");
              setMes("");
              setZona("");
              setTagSearch("");
              setSelectedTags([]);
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-white transition-colors hover:bg-[#3d2575]"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Selected tags chips */}
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

        {/* Tag suggestions dropdown */}
        {tagSearch.trim() && (
          <div className="mx-auto mt-2 max-w-5xl flex flex-wrap gap-2 justify-center">
            {filteredTagOptions.slice(0, 20).map((t) => {
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
        )}

        {/* agregar + button */}
        {user && (
          <div className="mx-auto mt-6 flex max-w-5xl justify-end">
            <Link href="/dashboard/agregar-evento">
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

      {/* ── Events Body ── */}
      <div className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="py-20 text-center text-[#2e1b40]/60">Cargando eventos...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[#2e1b40]/60">
            No se encontraron eventos.
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-14">
            {grouped.map(([month, evts]) => (
              <section key={month}>
                {/* Month heading */}
                <h2 className="mb-6 font-aller text-2xl font-extrabold uppercase tracking-widest text-[#2e1b40]">
                  {month}
                </h2>

                {/* Events grid — same layout as Home "Próximos" */}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {evts.map((evt) => {
                    const dateBadge = formatDateBadgeRange(evt.fecha_inicio, evt.fecha_fin);
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
                            <span className="text-sm text-[#2e1b40]/40">Imagen del evento</span>
                          </div>
                        )}

                        {/* Title & 3-dots menu */}
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold leading-snug text-[#2e1b40]">
                            {evt.titulo}
                          </h3>

                          {/* 3-dots Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-gray-500 hover:text-[#4c2f92] hover:bg-purple-50 shrink-0"
                                title="Opciones"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (!user) {
                                    setLoginModalOpen(true);
                                    return;
                                  }
                                  setSuggestTarget(evt);
                                }}
                                className="cursor-pointer"
                              >
                                <FileEdit className="mr-2 h-4 w-4 text-[#4c2f92]" />
                                Sugerir cambio
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (!user) {
                                    setLoginModalOpen(true);
                                    return;
                                  }
                                  setReportTarget(evt);
                                }}
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Flag className="mr-2 h-4 w-4" />
                                Reportar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Description */}
                        <p className="mt-1 text-sm leading-relaxed text-[#2e1b40]/70">
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
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Suggest Change Modal */}
      {suggestTarget && (
        <SuggestChangeModal
          open={!!suggestTarget}
          onOpenChange={(open) => {
            if (!open) setSuggestTarget(null);
          }}
          targetType="event"
          targetItem={suggestTarget}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          open={!!reportTarget}
          onOpenChange={(open) => {
            if (!open) setReportTarget(null);
          }}
          targetType="event"
          targetItem={reportTarget}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </div>
  );
}
