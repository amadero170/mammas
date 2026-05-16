"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Evento } from "@/lib/types";
import { toggleEventEstado } from "@/app/actions/eventos";
import { EventFormDialog } from "@/components/admin/event-form-dialog";

type Props = {
  events: Evento[];
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EventsTable({ events }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    event: Evento | null;
  }>({
    open: false,
    event: null,
  });

  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter((e) => e.estado === "published").length;
    return { total, published };
  }, [events]);

  const onToggle = async (id: string, next: "draft" | "published") => {
    setLoadingId(id);
    try {
      const res = await toggleEventEstado(id, next);
      if (!res.success) {
        toast.error("No se pudo actualizar", { description: res.error });
        return;
      }
      toast.success(
        next === "published" ? "Evento publicado" : "Evento despublicado"
      );
      window.location.reload();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {stats.total} eventos · {stats.published} publicados
        </div>
        <Button onClick={() => setDialog({ open: true, event: null })}>
          Nuevo evento
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.titulo}</TableCell>
                <TableCell>{formatDate(e.fecha_inicio)}</TableCell>
                <TableCell>{e.categoria || "-"}</TableCell>
                <TableCell>{e.zona || "-"}</TableCell>
                <TableCell>
                  {e.estado === "published" ? (
                    <Badge variant="default">Publicado</Badge>
                  ) : (
                    <Badge variant="outline">Borrador</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog({ open: true, event: e })}
                    >
                      Editar
                    </Button>
                    {e.estado === "published" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={loadingId === e.id}
                        onClick={() => onToggle(e.id, "draft")}
                      >
                        Despublicar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={loadingId === e.id}
                        onClick={() => onToggle(e.id, "published")}
                      >
                        Publicar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EventFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        event={dialog.event}
      />
    </div>
  );
}
