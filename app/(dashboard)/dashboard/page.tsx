import { redirect } from "next/navigation";

// El dashboard de la mamá abre en "Mis Proveedores"; las demás secciones están en las pestañas de arriba.
export default function DashboardPage() {
  redirect("/dashboard/mis-proveedores");
}
