import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
import { ShoppingBag, Plus, Calendar, CalendarPlus } from "lucide-react";

export default async function DashboardLayout({
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-24 pb-16 flex flex-col items-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 mb-8 border-b pb-4 overflow-x-auto">
            <Link
              href="/dashboard/mis-proveedores"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4" />
              Mis Proveedores
            </Link>
            <Link
              href="/dashboard/agregar-proveedor"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Agregar Proveedor
            </Link>
            <Link
              href="/dashboard/mis-eventos"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              Mis Eventos
            </Link>
            <Link
              href="/dashboard/agregar-evento"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4c2f92] transition-colors whitespace-nowrap"
            >
              <CalendarPlus className="h-4 w-4" />
              Agregar Evento
            </Link>
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

