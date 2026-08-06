"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updatePassword } from "@/app/actions/auth";
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const updatePasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function ActualizarContrasenaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      console.log("[ACTUALIZAR_CONTRASENA] Mount auth check:", {
        userEmail: user?.email,
        userId: user?.id,
        error: error?.message,
      });

      if (!user) {
        console.warn("[ACTUALIZAR_CONTRASENA] No active session found. Redirecting...");
        toast.error("Enlace no válido o expirado", {
          description: "Debes ingresar mediante un enlace válido para actualizar tu contraseña.",
        });
        router.push("/login?error=Invalid_Token");
      } else {
        setUserId(user.id);
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router, supabase]);

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: UpdatePasswordFormValues) {
    setIsSubmitting(true);
    console.log("[ACTUALIZAR_CONTRASENA] Submitting password update for user:", userId);
    try {
      const result = await updatePassword(data.password);
      console.log("[ACTUALIZAR_CONTRASENA] Update result:", result);
      if (!result.success) {
        toast.error("Error al actualizar la contraseña", {
          description: result.error || "Asegúrate de haber ingresado por el link de tu correo.",
        });
      } else {
        toast.success("Contraseña actualizada", {
          description: "Tu contraseña ha sido guardada correctamente",
        });
        
        // Consultar el rol del usuario para redirigir al panel o dashboard correcto
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

          if (profile?.role === "admin") {
            router.push("/admin/solicitudes");
            return;
          }
        }
        router.push("/dashboard/mis-proveedores");
      }
    } catch (error) {
      console.error("[ACTUALIZAR_CONTRASENA] Unexpected error:", error);
      toast.error("Error inesperado", {
        description: "No se pudo actualizar. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Establecer nueva contraseña</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa tu nueva contraseña para tu cuenta
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
