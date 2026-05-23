import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function Footer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <footer className="mt-auto bg-[#2e1b40] py-16 text-white">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="font-aller text-4xl leading-none md:text-6xl tracking-wide">
          Somos una <span className="text-[#e5f34a]">red viva</span> de<br />
          <span className="text-[#e5f34a]">recomendaciones reales</span>
        </h2>
        <p className="mt-6 max-w-lg text-lg text-white/90">
          Si no haces parte de nuestra comunidad pero quieres
          compartirnos un evento, negocio o colaboración
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/nosotras"
            className="rounded-full border border-[#e5f34a] bg-transparent px-8 py-5 text-base font-bold text-[#e5f34a] hover:bg-[#e5f34a] hover:text-[#2e1b40]"
          >
            contáctanos
          </Link>
          {!user && (
            <Link
              href="/solicitar-acceso"
              className="rounded-full border border-[#e5f34a] bg-transparent px-8 py-5 text-base font-bold text-[#e5f34a] hover:bg-[#e5f34a] hover:text-[#2e1b40]"
            >
              solicitar acceso
            </Link>
          )}
        </div>

        <div className="my-12 h-px w-full bg-white/20" />

        <div className="flex flex-col gap-8 text-sm font-semibold md:flex-row md:items-start md:gap-16">
          <Image
            src="/iconos/LOGOS-34.png"
            alt="Mamás Gone Wild"
            width={200}
            height={50}
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col gap-2">
            <Link href="/" className="transition-colors hover:text-[#e5f34a]">
              inicio
            </Link>
            <Link href="/directorio" className="transition-colors hover:text-[#e5f34a]">
              directorio
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/eventos" className="transition-colors hover:text-[#e5f34a]">
              eventos
            </Link>
            <Link href="/nosotras" className="transition-colors hover:text-[#e5f34a]">
              contáctanos
            </Link>
          </div>
          <div className="flex flex-col justify-end md:ml-auto">
            <Link href="/privacidad" className="text-xs text-white/60 transition-colors hover:text-[#e5f34a]">
              políticas de privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
