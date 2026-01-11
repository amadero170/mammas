import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proteger todas las rutas bajo /dashboard/*
  // (El segmento /dashboard está en app/(dashboard)/dashboard/*)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
