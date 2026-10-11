"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  /** Ruta con la que se abre el elemento, ej: /directorio?q=Florentino */
  path: string;
  title: string;
  text: string;
  className?: string;
};

/** Comparte con el menú nativo del celular (WhatsApp, etc.); en compu copia el link. */
export function ShareButton({ path, title, text, className }: Props) {
  const handleShare = async () => {
    const url = `${window.location.origin}${path}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // La persona cerró el menú de compartir
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copiado", { description: "Pégalo donde quieras compartirlo." });
    } catch {
      toast.error("No se pudo copiar el link", { description: url });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Compartir"
      aria-label="Compartir"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-[#4c2f92] text-[#4c2f92] transition-colors hover:bg-[#4c2f92]/10",
        className
      )}
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
