import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/footer";
/* ── Category icon mapping ── */
const CATEGORIES = [
  { label: "Tramites", icon: "/iconos/Home_tramites.png" },
  { label: "Reparaciones", icon: "/iconos/home_reparaciones.png" },
  { label: "Doméstico", icon: "/iconos/home_apoyo domestico.png" },
  { label: "Mecánico", icon: "/iconos/Home_Autos.png" },
  { label: "Fiestas", icon: "/iconos/Home_fiestas.png" },
  { label: "Médicos", icon: "/iconos/Home_medicos.png" },
  { label: "Bienes Raíces", icon: "/iconos/Home_rentas.png" },
  { label: "Transporte", icon: "/iconos/Home_transporte.png" },
  { label: "Educación", icon: "/iconos/Home_Educacion.png" },
];

export default async function Home() {
  /* ── Fetch upcoming events from DB ── */
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("fecha_inicio", new Date().toISOString())
    .order("fecha_inicio", { ascending: true })
    .limit(3);

  const upcomingEvents = events ?? [];

  return (
    <main>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/Imágenes/home_image.jpg"
          alt="Mamás reunidas"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />


        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          {/* Heading — AllerDisplay */}
          <h1 className="font-aller text-3xl leading-tight tracking-wide text-[#9acaaa] sm:text-4xl md:text-5xl lg:text-6xl">
            sabiduría local
            <br />
            colectiva·bahía
          </h1>

          {/* Sub-heading */}
          <p className="mt-4 text-lg font-medium text-white/80 sm:text-xl">
            Las mamás todo lo encuentran
          </p>

          {/* Search */}
          <div className="mt-10 w-full max-w-lg">
            <p className="mb-3 text-xl font-bold text-brand-lime sm:text-2xl">
              ¿Que buscas hoy?
            </p>
            <div className="flex items-center overflow-hidden rounded-full bg-white shadow-lg">
              <input
                type="text"
                placeholder="Buscar servicios, proveedores..."
                className="flex-1 bg-transparent px-6 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none sm:text-base"
              />
              <button
                aria-label="Buscar"
                className="mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-white transition-colors hover:bg-[#3d2575]"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* CTA */}
          {!user && (
            <Link
              href="/solicitar-acceso"
              className="mt-6 rounded-full border border-white/40 px-8 py-2.5 text-sm font-medium text-white transition-all hover:border-brand-lime hover:bg-brand-lime/10 hover:text-brand-lime"
            >
              Solicitar acceso
            </Link>
          )}
        </div>
      </section>

      {/* ═══════════════════════ CATEGORIES ═══════════════════════ */}
      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Busca por categoría
          </h2>

          <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8 md:gap-10">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`/directorio?categoria=${encodeURIComponent(cat.label)}`}
                className="group flex w-20 flex-col items-center gap-2 sm:w-24"
              >
                <div className="relative flex h-14 w-14 items-center justify-center transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
                  <Image
                    src={cat.icon}
                    alt={cat.label}
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <span className="text-center text-xs font-bold text-foreground sm:text-sm">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/directorio"
              className="text-lg font-bold text-brand-purple transition-colors hover:text-brand-purple/70"
            >
              ver más +
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ABOUT / INTRO ═══════════════════════ */}
      <section className="bg-[#4c2f92] py-16 text-white">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          {/* Logo text placeholder */}
          <h2 className="font-aller text-4xl uppercase tracking-wider text-brand-lime sm:text-5xl">
            MAMAS{" "}
            <span className="text-sm font-karla normal-case tracking-normal text-brand-sage sm:text-base">
              mamas
              <br />
              gone
              <br />
              wild
            </span>
          </h2>

          <p className="mt-8 text-base font-semibold leading-relaxed text-white sm:text-lg">
            Mamas Gone Wild es una red de mamás en Bahía de Banderas donde
            compartimos recomendaciones reales de servicios, productos y
            experiencias locales. Aquí encuentras lo que sí funciona, desde la
            experiencia y el cuidado entre mamás. Surge de lo cotidiano: de las
            preguntas que nos hacemos todos los días, de los consejos que se
            comparten entre amigas y de la necesidad de confiar en alguien que ya
            pasó por lo mismo.
          </p>

          <Link
            href="/nosotras"
            className="mt-6 inline-block text-lg font-bold text-[#9acaaa] transition-colors hover:text-[#9acaaa]/80"
          >
            conoce más +
          </Link>
        </div>
      </section>

      {/* ═══════════════════════ PRÓXIMOS EVENTOS ═══════════════════════ */}
      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Próximos
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">
                No hay eventos próximos por el momento.
              </p>
            ) : (
              upcomingEvents.map((evt) => {
                /* Format the date badge */
                const d = new Date(evt.fecha_inicio);
                const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
                const dateBadge = `${dayNames[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCFullYear()).slice(-2)}`;
                const horarioDisplay = evt.horario_inicio
                  ? evt.horario_fin ? `${evt.horario_inicio} - ${evt.horario_fin}` : evt.horario_inicio
                  : null;

                /* Extract domain from link_externo for display */
                let websiteDisplay: string | null = null;
                try {
                  if (evt.link_externo) websiteDisplay = new URL(evt.link_externo).hostname.replace("www.", "");
                } catch { websiteDisplay = evt.link_externo; }

                return (
                  <div key={evt.id} className="flex flex-col">
                    {/* Date badge */}
                    <span className="mb-2 text-sm font-bold tracking-wide text-brand-purple">
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
                      <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-brand-cream/60">
                        <span className="text-sm text-muted-foreground">
                          Imagen del evento
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">
                      {evt.titulo}
                    </h3>

                    {/* Description */}
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
              })
            )}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/eventos"
              className="text-lg font-bold text-brand-purple transition-colors hover:text-brand-purple/70"
            >
              ver más +
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
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
