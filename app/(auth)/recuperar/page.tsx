"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { recoverPassword } from "@/app/actions/auth";
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
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const recoverSchema = z.object({
  email: z.string().email("Email inválido"),
});

type RecoverFormValues = z.infer<typeof recoverSchema>;

export default function RecuperarPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<RecoverFormValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: RecoverFormValues) {
    setIsSubmitting(true);
    try {
      const result = await recoverPassword(data.email);
      if (!result.success) {
        toast.error("Error al solicitar recuperación", {
          description: result.error || "Asegúrate de ingresar un correo válido.",
        });
      } else {
        setIsSuccess(true);
        toast.success("Enlace enviado", {
          description: "Si tu correo está registrado, recibirás las instrucciones",
        });
      }
    } catch (error) {
      toast.error("Error inesperado", {
        description: "No se pudo procesar la solicitud. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold">Revisa tu correo</h1>
          <p className="text-muted-foreground">
            Hemos enviado un enlace a tu correo. Haz clic en él para establecer tu nueva contraseña.
          </p>
          <div className="pt-4">
            <Link href="/login" className="text-primary hover:underline flex items-center justify-center gap-2 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md relative">
        <Link 
          href="/login" 
          className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Recuperar Contraseña</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa tu email y te enviaremos instrucciones para reestablecer tu contraseña
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
