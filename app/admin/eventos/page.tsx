import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function EventosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Por ahora, mostrar mensaje placeholder ya que la tabla de eventos aún no está implementada
  // TODO: Implementar tabla de eventos en Supabase y reemplazar este contenido

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Eventos</h1>
        <p className="text-muted-foreground">
          Gestiona los eventos de la plataforma
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          La gestión de eventos estará disponible próximamente
        </p>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Esta sección se implementará en la siguiente fase del proyecto
        </p>
      </div>
    </div>
  );
}

