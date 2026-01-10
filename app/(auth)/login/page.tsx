"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Verificar si el usuario ya está autenticado y redirigir según su rol
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin/solicitudes");
        } else {
          router.push("/");
        }
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    console.log("[LOGIN PAGE] Starting login with email:", data.email);
    try {
      const result = await login(data.email, data.password);
      console.log("[LOGIN PAGE] Login result:", result);
      if (!result.success) {
        console.log("[LOGIN PAGE] Login failed:", result.error);
        toast.error("Error al iniciar sesión", {
          description: result.error || "Ocurrió un error inesperado",
        });
        setIsSubmitting(false);
      } else if (result.redirectTo) {
        // Si es exitoso, forzar un refresh completo para que el cliente lea las cookies
        // Esto sincroniza el estado de autenticación entre servidor y cliente
        window.location.href = result.redirectTo;
      } else {
        console.log(
          "[LOGIN PAGE] WARNING: result.success is true but redirectTo is missing!"
        );
        console.log(
          "[LOGIN PAGE] Full result object:",
          JSON.stringify(result, null, 2)
        );
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("[LOGIN PAGE] Unexpected error:", error);
      toast.error("Error inesperado", {
        description: "No se pudo iniciar sesión. Intenta nuevamente.",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa tus credenciales para acceder a Mammas Bahía
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      {...field}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
