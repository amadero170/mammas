"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { reviewEvent, toggleEventEstado } from "@/app/actions/eventos";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { UserDetailModal } from "@/components/admin/user-detail-modal";
import { DuplicateConfirmModal } from "@/components/admin/duplicate-confirm-modal";
import { RejectDialog } from "@/components/admin/reject-dialog";
import { DeactivateDialog } from "@/components/admin/deactivate-dialog";
import { ConfirmActionModal } from "@/components/confirm-action-modal";
import { findEventDuplicates, type DuplicateMatch } from "@/lib/duplicate-checker";
import { eventCompleteness } from "@/lib/completeness";
import {
  CompletenessBadge,
  CompletenessFilter,
  applyCompleteness,
  type LevelFilter,
  type SortMode,
} from "@/components/admin/completeness";
import { User as UserIcon, AlertTriangle } from "lucide-react";

type Props = {
  events: Evento[];
  usersMap?: Record<string, UserDetail>;
};

type StatusFilter = "pendiente" | "publicado" | "draft" | "rechazado" | "all";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const isPublished = (e: Evento) => e.aprobacion === "aprobado" && e.estado === "publicado";
const isUnpublished = (e: Evento) => e.aprobacion === "aprobado" && e.estado !== "publicado";

export function EventsTable({ events, usersMap = {} }: Props) {
  const router = useRouter();
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

  const [rejectTarget, setRejectTarget] = useState<Evento | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<Evento | null>(null);
  const [approveTarget, setApproveTarget] = useState<Evento | null>(null);
  const [publishTarget, setPublishTarget] = useState<Evento | null>(null);

  const publishedEvents = useMemo(() => events.filter(isPublished), [events]);

  const duplicatesMap = useMemo(() => {
    const map: Record<string, DuplicateMatch<Evento>[]> = {};
    for (const e of events) {
      if (!isPublished(e)) {
        const matches = findEventDuplicates(e, publishedEvents);
        if (matches.length > 0) map[e.id] = matches;
      }
    }
    return map;
  }, [events, publishedEvents]);

  const stats = useMemo(
    () => ({
      total: events.length,
      pending: events.filter((e) => e.aprobacion === "pendiente").length,
      published: events.filter(isPublished).length,
      unpublished: events.filter(isUnpublished).length,
      rejected: events.filter((e) => e.aprobacion === "rechazado").length,
    }),
    [events]
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    stats.pending > 0 ? "pendiente" : "all"
  );

  const byStatus = useMemo(() => {
    if (statusFilter === "pendiente") return events.filter((e) => e.aprobacion === "pendiente");
    if (statusFilter === "publicado") return events.filter(isPublished);
    if (statusFilter === "draft") return events.filter(isUnpublished);
    if (statusFilter === "rechazado") return events.filter((e) => e.aprobacion === "rechazado");
    return events;
  }, [events, statusFilter]);

  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const scores = useMemo(
    () => Object.fromEntries(events.map((e) => [e.id, eventCompleteness(e)])),
    [events]
  );

  const { items: filteredEvents, counts: levelCounts } = useMemo(
    () => applyCompleteness(byStatus, scores, levelFilter, sortMode),
    [byStatus, scores, levelFilter, sortMode]
  );

  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string; emailSent?: boolean }>, msg: string) => {
    setLoadingId(id);
    try {
      const res = await action();
      if (!res.success) {
        toast.error("No se pudo actualizar", { description: res.error });
        return;
      }
      if (res.emailSent === false) {
        toast.warning(msg, { description: "No se pudo enviar el correo de aviso a quien lo cargó" });
      } else {
        toast.success(msg);
      }
      router.refresh();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoadingId(null);
    }
  };

  const approve = (e: Evento) =>
    run(e.id, () => reviewEvent(e.id, "aprobado"), "Evento aprobado y publicado");

  const handleApproveClick = (e: Evento) => {
    const matches = duplicatesMap[e.id];
    if (matches && matches.length > 0) {
      // El aviso de duplicados ya pide confirmación
      setConfirmModal({ open: true, event: e, matches });
    } else {
      setApproveTarget(e);
    }
  };

  const filterButton = (value: StatusFilter, label: string, count: number) => (
    <Button
      variant={statusFilter === value ? "default" : "outline"}
      size="sm"
      onClick={() => setStatusFilter(value)}
      className={statusFilter === value ? "bg-[#4c2f92]" : ""}
    >
      {label} ({count})
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {filterButton("pendiente", "Pendientes", stats.pending)}
          {filterButton("publicado", "Publicados", stats.published)}
          {filterButton("draft", "Despublicados", stats.unpublished)}
          {filterButton("rechazado", "Rechazados", stats.rejected)}
          {filterButton("all", "Todos", stats.total)}
        </div>

        <Button onClick={() => setDialog({ open: true, event: null })}>
          Nuevo evento
        </Button>
      </div>

      <CompletenessFilter
        level={levelFilter}
        onLevelChange={setLevelFilter}
        sort={sortMode}
        onSortChange={setSortMode}
        counts={levelCounts}
        defaultSortLabel="Por fecha"
      />

      <div className="rounded-lg border">
        <Table className="[&_td]:px-3 [&_th]:px-3">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Cargado por</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Llenado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron eventos para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((e) => {
                const creator = e.creado_por ? usersMap[e.creado_por] : null;
                const matches = duplicatesMap[e.id];
                const hasDuplicates = matches && matches.length > 0;
                const loading = loadingId === e.id;

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
                    <TableCell className="whitespace-nowrap">{formatDate(e.fecha_inicio)}</TableCell>
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
                      {e.aprobacion === "pendiente" ? (
                        <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
                          Pendiente
                        </Badge>
                      ) : e.aprobacion === "rechazado" ? (
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-red-700"
                          title={e.motivo_rechazo ? `Motivo: ${e.motivo_rechazo}` : undefined}
                        >
                          Rechazado
                        </Badge>
                      ) : e.estado === "publicado" ? (
                        <Badge variant="default">Publicado</Badge>
                      ) : (
                        <Badge variant="outline">Despublicado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <CompletenessBadge value={scores[e.id]} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1.5 [&>button]:w-28">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDialog({ open: true, event: e })}
                        >
                          Editar
                        </Button>
                        {e.aprobacion !== "aprobado" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={loading}
                              className={hasDuplicates ? "border border-amber-500 bg-amber-600 hover:bg-amber-700 text-white" : ""}
                              onClick={() => handleApproveClick(e)}
                            >
                              Aprobar
                            </Button>
                            {e.aprobacion === "pendiente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={loading}
                                onClick={() => setRejectTarget(e)}
                              >
                                Rechazar
                              </Button>
                            )}
                          </>
                        ) : e.estado === "publicado" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={loading}
                            onClick={() => setUnpublishTarget(e)}
                          >
                            Despublicar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => setPublishTarget(e)}
                          >
                            Publicar
                          </Button>
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

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        targetType="evento"
        targetName={rejectTarget?.titulo ?? ""}
        loading={!!rejectTarget && loadingId === rejectTarget.id}
        onConfirm={(motivo) => {
          if (!rejectTarget) return;
          run(rejectTarget.id, () => reviewEvent(rejectTarget.id, "rechazado", motivo), "Evento rechazado");
        }}
      />

      <DeactivateDialog
        open={!!unpublishTarget}
        onOpenChange={(open) => !open && setUnpublishTarget(null)}
        title="Despublicar evento"
        description={`"${unpublishTarget?.titulo ?? ""}" dejará de verse en la página de eventos. Podrás volver a publicarlo cuando quieras.`}
        confirmText="Despublicar"
        loading={!!unpublishTarget && loadingId === unpublishTarget.id}
        onConfirm={(motivo) => {
          if (!unpublishTarget) return;
          run(unpublishTarget.id, () => toggleEventEstado(unpublishTarget.id, "draft", motivo), "Evento despublicado");
        }}
      />

      <ConfirmActionModal
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Aprobar evento"
        description={`"${approveTarget?.titulo ?? ""}" se publicará en la página de eventos y se avisará por correo a quien lo cargó.`}
        confirmText="Aprobar"
        loading={!!approveTarget && loadingId === approveTarget.id}
        onConfirm={() => {
          if (approveTarget) approve(approveTarget);
        }}
      />

      <ConfirmActionModal
        open={!!publishTarget}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        title="Publicar evento"
        description={`"${publishTarget?.titulo ?? ""}" volverá a verse en la página de eventos.`}
        confirmText="Publicar"
        loading={!!publishTarget && loadingId === publishTarget.id}
        onConfirm={() => {
          if (!publishTarget) return;
          run(publishTarget.id, () => toggleEventEstado(publishTarget.id, "publicado"), "Evento publicado");
        }}
      />

      {confirmModal.event && (
        <DuplicateConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((m) => ({ ...m, open }))}
          targetName={confirmModal.event.titulo}
          targetType="evento"
          matches={confirmModal.matches}
          onConfirm={() => {
            if (confirmModal.event) approve(confirmModal.event);
          }}
        />
      )}
    </div>
  );
}
