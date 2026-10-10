import Link from "next/link";
import { Plus } from "lucide-react";

/** Botón "Agregar" fijo en la esquina inferior, visible mientras se desplaza la página. */
export function FloatingAddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#4c2f92] px-5 font-bold text-white shadow-lg shadow-[#4c2f92]/30 transition-colors hover:bg-[#3d2575] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4c2f92] focus-visible:ring-offset-2 sm:right-6"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      <Plus className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
