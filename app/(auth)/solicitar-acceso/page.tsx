"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSolicitud } from "@/app/actions/solicitudes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckCircle2, Mail } from "lucide-react";

const solicitudSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  mensaje: z.string().optional(),
});

type SolicitudFormValues = z.infer<typeof solicitudSchema>;

export default function SolicitarAccesoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviada, setEnviada] = useState<{ email: string; remitente: string | null } | null>(null);

  const form = useForm<SolicitudFormValues>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      mensaje: "",
    },
  });

  async function onSubmit(data: SolicitudFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createSolicitud(data);

      if (result.success) {
        setEnviada({ email: data.email, remitente: result.remitente ?? null });
        form.reset();
      } else {
        toast.error("Error al enviar solicitud", {
          description: result.error || "Ocurrió un error inesperado",
        });
      }
    } catch (error) {
      toast.error("Error inesperado", {
        description: "No se pudo enviar la solicitud. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (enviada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
        <div className="w-full max-w-md rounded-lg border bg-background p-6 sm:p-8">
          <div className="mb-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-2xl font-bold">¡Recibimos tu solicitud!</h1>
            <p className="mt-2 text-muted-foreground">
              Gracias por querer sumarte a Mammas Bahía.
            </p>
          </div>

          <h2 className="mb-3 font-semibold">¿Qué sigue?</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-xs font-bold text-white">1</span>
              <span>Una administradora revisará tu solicitud.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-xs font-bold text-white">2</span>
              <span>
                Si es aprobada, te enviaremos un correo a <strong className="break-all">{enviada.email}</strong> con
                un enlace para crear tu contraseña.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-xs font-bold text-white">3</span>
              <span>
                Con tu cuenta lista podrás iniciar sesión, agregar proveedores y eventos, y calificar a los proveedores.
              </span>
            </li>
          </ol>

          <div className="mt-6 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Mail className="h-5 w-5 shrink-0" />
            <p>
              Revisa también tu carpeta de <strong>spam</strong> o <strong>promociones</strong>.
              {enviada.remitente ? (
                <>
                  {" "}El correo llegará desde <strong className="break-all">{enviada.remitente}</strong>.
                </>
              ) : null}
            </p>
          </div>

          <Button asChild className="mt-6 w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Solicitar Acceso</h1>
          <p className="mt-2 text-muted-foreground">
            Completa el formulario para solicitar acceso a Mammas Bahía
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 322 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mensaje"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos sobre ti..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
