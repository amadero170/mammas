import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Calendar,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">Mammas Bahía</h2>
            <p className="text-sm text-muted-foreground">Panel Admin</p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/admin/solicitudes"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <LayoutDashboard className="h-4 w-4" />
              Solicitudes
            </Link>
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Link>
            <Link
              href="/admin/proveedores"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground"
            >
              <ShoppingBag className="h-4 w-4" />
              Proveedores
            </Link>
            <Link
              href="/admin/eventos"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent text-muted-foreground"
            >
              <Calendar className="h-4 w-4" />
              Eventos
            </Link>
          </nav>

          <div className="border-t p-4">
            <div className="mb-4 px-3">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
