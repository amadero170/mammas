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
import type { Evento, UserDetail } from "@/lib/types";
import { toggleEventEstado } from "@/app/actions/eventos";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { UserDetailModal } from "@/components/admin/user-detail-modal";
import { DuplicateConfirmModal } from "@/components/admin/duplicate-confirm-modal";
import { findEventDuplicates, type DuplicateMatch } from "@/lib/duplicate-checker";
import { User as UserIcon, AlertTriangle } from "lucide-react";

type Props = {
  events: Evento[];
  usersMap?: Record<string, UserDetail>;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EventsTable({ events, usersMap = {} }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    event: Evento | null;
  }>({
    open: false,
    event: null,
  });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    event: Evento | null;
    matches: DuplicateMatch<Evento>[];
  }>({
    open: false,
    event: null,
    matches: [],
  });

  const publishedEvents = useMemo(
    () => events.filter((e) => e.estado === "publicado"),
    [events]
  );

  const duplicatesMap = useMemo(() => {
    const map: Record<string, DuplicateMatch<Evento>[]> = {};
    for (const e of events) {
      if (e.estado !== "publicado") {
        const matches = findEventDuplicates(e, publishedEvents);
        if (matches.length > 0) map[e.id] = matches;
      }
    }
    return map;
  }, [events, publishedEvents]);

  const [statusFilter, setStatusFilter] = useState<"all" | "publicado" | "draft" | "archivado">("all");

  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter((e) => e.estado === "publicado").length;
    const draft = events.filter((e) => e.estado === "draft").length;
    const archived = events.filter((e) => e.estado === "archivado").length;
    return { total, published, draft, archived };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (statusFilter === "publicado") return events.filter((e) => e.estado === "publicado");
    if (statusFilter === "draft") return events.filter((e) => e.estado === "draft");
    if (statusFilter === "archivado") return events.filter((e) => e.estado === "archivado");
    return events;
  }, [events, statusFilter]);

  const onToggleState = async (id: string, next: "draft" | "publicado" | "archivado") => {
    setLoadingId(id);
    try {
      const res = await toggleEventEstado(id, next);
      if (!res.success) {
        toast.error("No se pudo actualizar", { description: res.error });
        return;
      }
      let msg = "Evento actualizado";
      if (next === "publicado") msg = "Evento publicado";
      if (next === "draft") msg = "Evento movido a borrador";
      if (next === "archivado") msg = "Evento archivado";
      toast.success(msg);
      window.location.reload();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePublishClick = (e: Evento) => {
    const matches = duplicatesMap[e.id];
    if (matches && matches.length > 0) {
      setConfirmModal({
        open: true,
        event: e,
        matches,
      });
    } else {
      onToggleState(e.id, "publicado");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={statusFilter === "all" ? "bg-[#4c2f92]" : ""}
          >
            Todos ({stats.total})
          </Button>
          <Button
            variant={statusFilter === "publicado" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("publicado")}
            className={statusFilter === "publicado" ? "bg-[#4c2f92]" : ""}
          >
            Publicados ({stats.published})
          </Button>
          <Button
            variant={statusFilter === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("draft")}
            className={statusFilter === "draft" ? "bg-[#4c2f92]" : ""}
          >
            Borradores ({stats.draft})
          </Button>
          <Button
            variant={statusFilter === "archivado" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("archivado")}
            className={statusFilter === "archivado" ? "bg-[#4c2f92]" : ""}
          >
            Archivados ({stats.archived})
          </Button>
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
              <TableHead>Zona</TableHead>
              <TableHead>Cargado por</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron eventos para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((e) => {
                const creator = e.creado_por ? usersMap[e.creado_por] : null;
                const matches = duplicatesMap[e.id];
                const hasDuplicates = matches && matches.length > 0;
                const isArchived = e.estado === "archivado";

                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{e.titulo}</span>
                        {hasDuplicates && (
                          <div
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit cursor-pointer hover:bg-amber-100 transition-colors"
                            onClick={() => setConfirmModal({ open: true, event: e, matches })}
                            title="Clic para ver coincidencia"
                          >
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Posible duplicado ({matches.length})</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(e.fecha_inicio)}</TableCell>
                    <TableCell>{e.zona || "-"}</TableCell>
                    <TableCell>
                      {creator ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUser(creator)}
                          className="text-left font-medium text-primary hover:underline hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
                        >
                          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{creator.nombre}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs font-mono">
                          {e.creado_por ? `${e.creado_por.slice(0, 8)}...` : "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isArchived ? (
                        <Badge variant="outline" className="text-gray-500 border-gray-400 bg-gray-50">
                          Archivado
                        </Badge>
                      ) : e.estado === "publicado" ? (
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
                        {isArchived ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={loadingId === e.id}
                              onClick={() => onToggleState(e.id, "draft")}
                            >
                              Restaurar
                            </Button>
                            <Button
                              size="sm"
                              disabled={loadingId === e.id}
                              onClick={() => handlePublishClick(e)}
                            >
                              Publicar
                            </Button>
                          </>
                        ) : e.estado === "publicado" ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={loadingId === e.id}
                              onClick={() => onToggleState(e.id, "draft")}
                            >
                              Despublicar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={loadingId === e.id}
                              onClick={() => onToggleState(e.id, "archivado")}
                            >
                              Archivar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              disabled={loadingId === e.id}
                              className={hasDuplicates ? "border border-amber-500 bg-amber-600 hover:bg-amber-700 text-white" : ""}
                              onClick={() => handlePublishClick(e)}
                            >
                              Publicar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={loadingId === e.id}
                              onClick={() => onToggleState(e.id, "archivado")}
                            >
                              Archivar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <EventFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        event={dialog.event}
      />

      <UserDetailModal
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {confirmModal.event && (
        <DuplicateConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((m) => ({ ...m, open }))}
          targetName={confirmModal.event.titulo}
          targetType="evento"
          matches={confirmModal.matches}
          onConfirm={() => {
            if (confirmModal.event) {
              onToggleState(confirmModal.event.id, "publicado");
            }
          }}
        />
      )}
    </div>
  );
}

