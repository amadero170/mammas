"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Plus, Calendar, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard/mis-proveedores", label: "Mis proveedores", icon: ShoppingBag },
  { href: "/dashboard/agregar-proveedor", label: "Nuevo proveedor", icon: Plus },
  { href: "/dashboard/mis-eventos", label: "Mis eventos", icon: Calendar },
  { href: "/dashboard/agregar-evento", label: "Nuevo evento", icon: CalendarPlus },
];

/** Pestañas del dashboard de la mamá, con la sección actual resaltada. */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-6 overflow-x-auto border-b">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-4 text-sm font-medium transition-colors",
              active
                ? "border-[#4c2f92] text-[#4c2f92]"
                : "border-transparent text-gray-600 hover:text-[#4c2f92]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
