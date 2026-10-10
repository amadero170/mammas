import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/footer";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

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
          <DashboardNav />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

