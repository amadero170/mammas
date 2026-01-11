"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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
import { getInviteInfo, consumeInviteAndCreateUser } from "@/app/actions/invites";

const schema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "La confirmación es requerida"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegistroClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<
    "loading" | "valid" | "invalid"
  >("loading");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setInviteStatus("loading");
      setInviteEmail(null);
      const info = await getInviteInfo(token);
      if (cancelled) return;

      if (info.valid) {
        setInviteEmail(info.email);
        setInviteStatus("valid");
        return;
      }

      setInviteStatus("invalid");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Link inválido");
      return;
    }

    const res = await consumeInviteAndCreateUser(token, values.password);
    if (!res.success) {
      toast.error("No se pudo crear la cuenta", { description: res.error });
      return;
    }

    toast.success("Cuenta creada", {
      description: `Ya podés iniciar sesión con ${res.email}`,
    });
    router.push("/login");
  }

  const disabled =
    inviteStatus !== "valid" || form.formState.isSubmitting || !token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Crear Cuenta</h1>
          <p className="mt-2 text-muted-foreground">
            {inviteStatus === "loading"
              ? "Verificando invitación..."
              : inviteStatus === "valid"
                ? `Invitación válida para ${inviteEmail}`
                : "Invitación inválida o vencida"}
          </p>
        </div>

        {inviteStatus === "invalid" ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Este link no es válido, ya fue utilizado o venció.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Volver al inicio
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        autoComplete="new-password"
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
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={disabled}>
                {form.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

