import { createClient } from "@/lib/supabase/server";
import { ProvidersTable } from "@/components/admin/providers-table";
import { getUserDetailsMap } from "@/lib/user-utils";

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[ADMIN/PROVEEDORES] auth user:", {
    id: user?.id,
    email: user?.email,
  });

  if (!user) {
    console.log("[ADMIN/PROVEEDORES] no user -> return null");
    return null;
  }

  const { data: providers, error } = await supabase
    .from("providers")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching providers:", error);
  }

  const userIds = (providers || [])
    .map((p) => p.creado_por)
    .filter(Boolean) as string[];
  const usersMap = await getUserDetailsMap(userIds);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <p className="text-muted-foreground">
          Gestiona los proveedores del directorio
        </p>
      </div>

      {!providers || providers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No hay proveedores todavía</p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Cargá dummy data desde Supabase o agregá uno nuevo.
          </p>
        </div>
      ) : (
        <ProvidersTable providers={providers} usersMap={usersMap} />
      )}
    </div>
  );
}
