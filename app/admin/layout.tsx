import Footer from "@/components/footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag, Calendar, Settings, FileEdit, Flag } from "lucide-react";

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
    redirect("/?login=true");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  // Fetch pending count badges in parallel
  const [
    { count: pendingSolicitudesCount },
    { count: pendingSuggestionsCount },
    { count: pendingReportsCount },
  ] = await Promise.all([
    supabase
      .from("mammas_autorizadas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pending"),
    supabase
      .from("suggestions")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pending"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pending"),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-24 pb-16 flex flex-col items-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 mb-8 border-b pb-4 overflow-x-auto">
            <Link
              href="/admin/solicitudes"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Solicitudes</span>
              {!!pendingSolicitudesCount && pendingSolicitudesCount > 0 && (
                <span className="rounded-full bg-[#4c2f92] text-white px-2 py-0.5 text-[11px] font-bold">
                  {pendingSolicitudesCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              <span>Usuarios</span>
            </Link>
            <Link
              href="/admin/proveedores"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Proveedores</span>
            </Link>
            <Link
              href="/admin/eventos"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
            </Link>
            <Link
              href="/admin/sugerencias"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <FileEdit className="h-4 w-4" />
              <span>Sugerencias</span>
              {!!pendingSuggestionsCount && pendingSuggestionsCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[11px] font-bold">
                  {pendingSuggestionsCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/reportes"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors whitespace-nowrap"
            >
              <Flag className="h-4 w-4" />
              <span>Reportes</span>
              {!!pendingReportsCount && pendingReportsCount > 0 && (
                <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[11px] font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/configuracion"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </Link>
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
