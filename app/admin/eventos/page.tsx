import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EventsTable } from "@/components/admin/events-table";
import type { Evento } from "@/lib/types";
import { getUserDetailsMap } from "@/lib/user-utils";

export default async function EventosAdminPage() {
  // Auth check with normal client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch ALL events (draft + publicado) using service role to bypass RLS
  const adminSupabase = createAdminClient();
  const { data: events, error } = await adminSupabase
    .from("events")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  if (error) {
    console.error("Error fetching events:", error);
  }

  const userIds = (events || [])
    .map((e) => e.creado_por)
    .filter(Boolean) as string[];
  const usersMap = await getUserDetailsMap(userIds);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Eventos</h1>
        <p className="text-muted-foreground">
          Gestiona los eventos de la plataforma
        </p>
      </div>

      {!events || events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No hay eventos todavía</p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Creá un nuevo evento con el botón de arriba.
          </p>
          <EventsTable events={[]} usersMap={usersMap} />
        </div>
      ) : (
        <EventsTable events={(events || []) as Evento[]} usersMap={usersMap} />
      )}
    </div>
  );
}
