"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginModal } from "@/components/login-modal";
import { AccountDialog } from "@/components/account-dialog";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Menu,
  LogOut,
  User,
  ShoppingBag,
  Plus,
  LayoutDashboard,
  ChevronDown,
  Calendar,
  CalendarPlus,

} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  role: "admin" | "user" | null;
}

function LoginQueryListener({ setLoginModalOpen }: { setLoginModalOpen: (v: boolean) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("error") === "Invalid_Token") {
      toast.error("Enlace no válido o expirado", {
        description: "El enlace de recuperación ya venció o fue utilizado. Por favor solicita uno nuevo.",
      });
      // Clean up error param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    if (searchParams.get("login") === "true") {
      setLoginModalOpen(true);
      // Clean up login param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, setLoginModalOpen]);
  return null;
}

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  /* ── Scroll listener for navbar background ── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll(); // check on mount
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { href: "/", label: "inicio" },
    { href: "/directorio", label: "directorio" },
    { href: "/eventos", label: "eventos" },
    { href: "/nosotras", label: "contáctanos" },
  ];

  const isLightTheme =
    pathname === "/directorio" ||
    pathname === "/eventos" ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname === "/solicitar-acceso" ||
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname === "/recuperar" ||
    pathname === "/actualizar-contrasena";
  const themeColor = isLightTheme ? "text-[#4c2f92]" : "text-[#e5f34a]";
  const themeColorHover = isLightTheme ? "hover:text-[#4c2f92]" : "hover:text-[#e5f34a]";
  const themeColor80 = isLightTheme ? "text-[#4c2f92]/80" : "text-[#e5f34a]/80";
  const themeBorder = isLightTheme ? "border-[#4c2f92]/60" : "border-[#e5f34a]/60";
  const navBg = isLightTheme
    ? `bg-white/95 backdrop-blur-md ${scrolled ? "shadow-lg" : ""}`
    : scrolled
    ? "bg-[#2e1b40]/85 backdrop-blur-md shadow-lg"
    : "bg-transparent";

  return (
    <>
      <Suspense fallback={null}>
        <LoginQueryListener setLoginModalOpen={setLoginModalOpen} />
      </Suspense>
      <nav className={`fixed top-0 z-50 w-full transition-colors duration-300 ${navBg}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo — image-based */}
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          <Image
            src={isLightTheme ? "/iconos/LOGOS-33.png" : "/iconos/LOGOS-32.png"}
            alt="Mamás Gone Wild"
            width={100}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? `border ${themeBorder} ${themeColor}`
                    : `${themeColor80} ${themeColorHover}`
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right section: Language selector + Auth */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Language Selector (decorative — no-op for now) */}
          <button
            className={`flex items-center gap-1 text-sm font-bold ${themeColor} transition-opacity hover:opacity-80`}
            aria-label="Selector de idioma"
          >
            ESP
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Auth */}
          {!mounted || loading ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            /* ── Logged-in: avatar pill ── */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full bg-[#9acaaa] px-4 py-2 shadow transition-all hover:bg-[#9acaaa]/90 focus:outline-none focus:ring-2 focus:ring-[#9acaaa]/50 focus:ring-offset-2 focus:ring-offset-transparent">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-[#4c2f92] text-xs font-bold text-white capitalize font-aller">
                      {getInitials(user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-[#2e1b40] capitalize tracking-wide">
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
                <DropdownMenuItem
                  onClick={() => setAccountDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi Cuenta
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/dashboard/mis-eventos"
                        className="w-full"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Mis Eventos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/dashboard/agregar-evento"
                        className="w-full"
                      >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Agregar Evento
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
            /* ── Logged-out: large purple pill button ── */
            <button
              onClick={() => setLoginModalOpen(true)}
              className="rounded-full bg-[#4c2f92] px-8 py-2.5 text-sm font-bold text-[#e5f34a] shadow transition-all hover:bg-[#4c2f92]/90 hover:shadow-lg"
            >
              Iniciar sesión
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${themeColor} transition-colors hover:bg-white/10`}
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
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

              {/* Mobile Language selector */}
              <div className="flex items-center gap-1 rounded-lg px-4 py-3 text-base font-medium text-muted-foreground">
                ESP
                <ChevronDown className="h-4 w-4" />
              </div>

              <Separator className="my-4" />
              {/* Mobile Auth Section */}
              {!mounted || loading ? (
                <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-4 shadow-sm">
                    <Avatar className="h-12 w-12 shadow-sm">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold capitalize font-aller">
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold capitalize tracking-wide">
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
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAccountDialogOpen(true);
                    }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-accent/50 hover:text-primary"
                  >
                    <User className="h-5 w-5" />
                    Mi Cuenta
                  </button>
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
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full rounded-full bg-[#4c2f92] px-6 py-3 text-center text-sm font-bold text-[#e5f34a] shadow transition-all hover:bg-[#4c2f92]/90"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Login Modal */}
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      {/* Account Modal */}
      {user && <AccountDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} user={user} role={profile?.role ?? null} />}
      </nav>
    </>
  );
}
