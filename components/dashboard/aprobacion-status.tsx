import { Badge } from "@/components/ui/badge";
import type { Aprobacion } from "@/lib/types";

/** Estado de una aportación, visto por la mamá que la cargó. */
export function AprobacionBadge({ aprobacion, visible }: { aprobacion: Aprobacion; visible: boolean }) {
  if (aprobacion === "pendiente") {
    return (
      <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
        En revisión
      </Badge>
    );
  }
  if (aprobacion === "rechazado") {
    return (
      <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
        Rechazado
      </Badge>
    );
  }
  return visible ? <Badge variant="default">Publicado</Badge> : <Badge variant="outline">No visible</Badge>;
}

/** Motivo del rechazo y cómo seguir. */
export function MotivoRechazo({ motivo }: { motivo?: string | null }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <p className="font-semibold">No fue aprobado</p>
      {motivo ? <p className="mt-1">Motivo: {motivo}</p> : null}
      <p className="mt-1 text-red-700/80">Puedes corregirlo y volver a enviarlo para revisión.</p>
    </div>
  );
}
