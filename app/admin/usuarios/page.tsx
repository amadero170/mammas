import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Obtener todos los usuarios (profiles)
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona los usuarios registrados en la plataforma
        </p>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-mono text-sm">
                    {profile.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {profile.email || "-"}
                  </TableCell>
                  <TableCell>
                    {profile.role === "admin" ? (
                      <Badge variant="default">Admin</Badge>
                    ) : profile.role === "mamma" ? (
                      <Badge variant="secondary">Mamma</Badge>
                    ) : profile.role === "user" ? (
                      <Badge variant="secondary">Usuario</Badge>
                    ) : profile.role ? (
                      <Badge variant="outline">{String(profile.role)}</Badge>
                    ) : (
                      <Badge variant="outline">Sin rol</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(profile.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
