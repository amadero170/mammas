import Footer from "@/components/footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag, Calendar } from "lucide-react";

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
              Solicitudes
            </Link>
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Link>
            <Link
              href="/admin/proveedores"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" />
              Proveedores
            </Link>
            <Link
              href="/admin/eventos"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              Eventos
            </Link>
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
