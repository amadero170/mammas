"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Evento } from "@/lib/types";
import { listMyEvents, deleteMyEvent, updateMyEvent } from "@/app/actions/eventos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventForm } from "@/components/forms/event-form";

export default function MisEventosPage() {
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Evento[]>([]);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await listMyEvents({ q });
      if (!res.success) {
        toast.error("No se pudieron cargar los eventos", {
          description: res.error,
        });
        return;
      }
      setEvents(res.events);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Segura que querés eliminar "${titulo}"?`)) return;

    const res = await deleteMyEvent(id);
    if (!res.success) {
      toast.error("No se pudo eliminar", { description: res.error });
      return;
    }
    toast.success("Evento eliminado");
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Eventos</h1>
        <p className="text-muted-foreground">
          Eventos que creaste. Quedan como borrador hasta que un admin los
          publique.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-background p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título o descripción..."
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setQ("")}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no creaste eventos
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Podés crear uno desde &ldquo;Agregar Evento&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((evt) => (
            <Card key={evt.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{evt.titulo}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(evt.id, evt.titulo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evt.zona && (
                    <Badge variant="secondary">{evt.zona}</Badge>
                  )}
                  <Badge
                    variant={
                      evt.estado === "publicado" ? "default" : "outline"
                    }
                  >
                    {evt.estado === "publicado" ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  📅 {formatDate(evt.fecha_inicio)}
                  {evt.fecha_fin && ` — ${formatDate(evt.fecha_fin)}`}
                </div>
                {evt.horario_inicio && (
                  <div className="text-sm text-muted-foreground">
                    🕐 {evt.horario_inicio}
                    {evt.horario_fin && ` - ${evt.horario_fin}`}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  📍 {evt.ubicacion}
                </div>
                {evt.descripcion && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {evt.descripcion}
                  </p>
                )}
              </CardContent>
              {evt.estado !== "publicado" && (
                <div className="px-6 pb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEvent(evt)}
                  >
                    Editar borrador
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Evento</DialogTitle>
              <DialogDescription>
                Modificá los datos del evento en estado borrador. Los cambios requerirán aprobación del administrador.
              </DialogDescription>
            </DialogHeader>
            <EventForm
              event={editingEvent}
              onSubmit={(values) => updateMyEvent(editingEvent.id, values)}
              submitLabel="Guardar Cambios"
              savingLabel="Guardando..."
              onCancel={() => setEditingEvent(null)}
              onSuccess={() => {
                setEditingEvent(null);
                fetchEvents();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
