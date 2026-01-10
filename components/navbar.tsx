"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  LogOut,
  User,
  ShoppingBag,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  role: "admin" | "user" | null;
}

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        // Obtener profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        }
      }
      setLoading(false);
    }

    getUser();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as Profile);
          });
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/directorio", label: "Directorio" },
    { href: "/eventos", label: "Eventos" },
    { href: "/nosotras", label: "Nosotras" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Mammas Bahía
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-accent/50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Section - Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {!mounted || loading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2 shadow-sm transition-all hover:bg-accent/50 hover:shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                      {getInitials(user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium lg:block">
                    {user.email?.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg">
                <DropdownMenuLabel className="font-semibold">
                  Mi Cuenta
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile?.role === "admin" && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin/solicitudes" className="w-full">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/mi-cuenta" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Mi Cuenta
                  </Link>
                </DropdownMenuItem>
                {profile?.role !== "admin" && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/dashboard/mis-proveedores"
                        className="w-full"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Mis Proveedores
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/dashboard/agregar-proveedor"
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Proveedor
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="shadow-sm">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg border border-border/50 shadow-sm hover:bg-accent/50"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader className="border-b pb-4">
              <SheetTitle className="text-2xl font-bold">Menú</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-2">
              {/* Mobile Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-accent/50 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <Separator className="my-4" />
              {/* Mobile Auth Section */}
              {!mounted || loading ? (
                <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-4 shadow-sm">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {user.email?.split("@")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profile?.role === "admin"
                          ? "Administrador"
                          : "Usuario"}
                      </span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  {profile?.role === "admin" && (
                    <>
                      <Link
                        href="/admin/solicitudes"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-accent/50 hover:text-primary"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Panel Admin
                      </Link>
                    </>
                  )}
                  <Link
                    href="/dashboard/mi-cuenta"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-accent/50 hover:text-primary"
                  >
                    <User className="h-5 w-5" />
                    Mi Cuenta
                  </Link>
                  {profile?.role !== "admin" && (
                    <>
                      <Link
                        href="/dashboard/mis-proveedores"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-accent/50 hover:text-primary"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Mis Proveedores
                      </Link>
                      <Link
                        href="/dashboard/agregar-proveedor"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-accent/50 hover:text-primary"
                      >
                        <Plus className="h-5 w-5" />
                        Agregar Proveedor
                      </Link>
                    </>
                  )}
                  <Separator className="my-4" />
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full shadow-sm">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
