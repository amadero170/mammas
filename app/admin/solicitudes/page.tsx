import {
  getSolicitudes,
  aprobarSolicitud,
  rechazarSolicitud,
} from "@/app/actions/solicitudes";
import { createClient } from "@/lib/supabase/server";
import { SolicitudesTable } from "@/components/admin/solicitudes-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SolicitudesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [pendientes, aprobadas, rechazadas] = await Promise.all([
    getSolicitudes("pending"),
    getSolicitudes("approved"),
    getSolicitudes("rejected"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Solicitudes de Acceso</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de acceso de las mammas
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes ({pendientes.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprobadas ({aprobadas.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rechazadas ({rechazadas.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <SolicitudesTable
            solicitudes={pendientes.data || []}
            adminId={user.id}
            onAprobar={aprobarSolicitud}
            onRechazar={rechazarSolicitud}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <SolicitudesTable
            solicitudes={aprobadas.data || []}
            adminId={user.id}
            onAprobar={aprobarSolicitud}
            onRechazar={rechazarSolicitud}
            showInviteLink
            readOnly
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <SolicitudesTable
            solicitudes={rechazadas.data || []}
            adminId={user.id}
            onAprobar={aprobarSolicitud}
            onRechazar={rechazarSolicitud}
            readOnly
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
