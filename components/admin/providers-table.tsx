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
import type { Proveedor, UserDetail } from "@/lib/types";
import { reviewProvider, toggleProviderActive } from "@/app/actions/proveedores";
import { ProviderFormDialog } from "@/components/admin/provider-form-dialog";
import { UserDetailModal } from "@/components/admin/user-detail-modal";
import { DuplicateConfirmModal } from "@/components/admin/duplicate-confirm-modal";
import { RejectDialog } from "@/components/admin/reject-dialog";
import { ConfirmActionModal } from "@/components/confirm-action-modal";
import { findProviderDuplicates, type DuplicateMatch } from "@/lib/duplicate-checker";
import { User as UserIcon, AlertTriangle } from "lucide-react";

type Props = {
  providers: Proveedor[];
  usersMap?: Record<string, UserDetail>;
};

type StatusFilter = "pendiente" | "active" | "inactive" | "rechazado" | "all";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const isActive = (p: Proveedor) => p.aprobacion === "aprobado" && p.is_active;
const isInactive = (p: Proveedor) => p.aprobacion === "aprobado" && !p.is_active;

export function ProvidersTable({ providers, usersMap = {} }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    provider: Proveedor | null;
  }>({
    open: false,
    provider: null,
  });

  // Duplicate confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    provider: Proveedor | null;
    matches: DuplicateMatch<Proveedor>[];
  }>({
    open: false,
    provider: null,
    matches: [],
  });

  const [rejectTarget, setRejectTarget] = useState<Proveedor | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Proveedor | null>(null);

  const activeProviders = useMemo(() => providers.filter(isActive), [providers]);

  // Pre-calculate duplicates for providers not yet visible
  const duplicatesMap = useMemo(() => {
    const map: Record<string, DuplicateMatch<Proveedor>[]> = {};
    for (const p of providers) {
      if (!isActive(p)) {
        const matches = findProviderDuplicates(p, activeProviders);
        if (matches.length > 0) map[p.id] = matches;
      }
    }
    return map;
  }, [providers, activeProviders]);

  const stats = useMemo(
    () => ({
      total: providers.length,
      pending: providers.filter((p) => p.aprobacion === "pendiente").length,
      active: providers.filter(isActive).length,
      inactive: providers.filter(isInactive).length,
      rejected: providers.filter((p) => p.aprobacion === "rechazado").length,
    }),
    [providers]
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    stats.pending > 0 ? "pendiente" : "all"
  );

  const filteredProviders = useMemo(() => {
    if (statusFilter === "pendiente") return providers.filter((p) => p.aprobacion === "pendiente");
    if (statusFilter === "active") return providers.filter(isActive);
    if (statusFilter === "inactive") return providers.filter(isInactive);
    if (statusFilter === "rechazado") return providers.filter((p) => p.aprobacion === "rechazado");
    return providers;
  }, [providers, statusFilter]);

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
      window.location.reload();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoadingId(null);
    }
  };

  const approve = (p: Proveedor) =>
    run(p.id, () => reviewProvider(p.id, "aprobado"), "Proveedor aprobado y activo");

  const handleApproveClick = (p: Proveedor) => {
    const matches = duplicatesMap[p.id];
    if (matches && matches.length > 0) {
      setConfirmModal({ open: true, provider: p, matches });
    } else {
      approve(p);
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
          {filterButton("active", "Activos", stats.active)}
          {filterButton("inactive", "Inactivos", stats.inactive)}
          {filterButton("rechazado", "Rechazados", stats.rejected)}
          {filterButton("all", "Todos", stats.total)}
        </div>

        <Button onClick={() => setDialog({ open: true, provider: null })}>
          Nuevo proveedor
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categorías</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Cargado por</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron proveedores para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filteredProviders.map((p) => {
                const creator = p.creado_por ? usersMap[p.creado_por] : null;
                const matches = duplicatesMap[p.id];
                const hasDuplicates = matches && matches.length > 0;
                const loading = loadingId === p.id;

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{p.nombre}</span>
                        {hasDuplicates && (
                          <div
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit cursor-pointer hover:bg-amber-100 transition-colors"
                            onClick={() => setConfirmModal({ open: true, provider: p, matches })}
                            title="Clic para ver coincidencia"
                          >
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Posible duplicado ({matches.length})</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.categorias?.length ? p.categorias.join(" - ") : "-"}
                    </TableCell>
                    <TableCell>{p.zona || "-"}</TableCell>
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
                          {p.creado_por ? `${p.creado_por.slice(0, 8)}...` : "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.aprobacion === "pendiente" ? (
                        <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
                          Pendiente
                        </Badge>
                      ) : p.aprobacion === "rechazado" ? (
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-red-700"
                          title={p.motivo_rechazo ? `Motivo: ${p.motivo_rechazo}` : undefined}
                        >
                          Rechazado
                        </Badge>
                      ) : p.is_active ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(p.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDialog({ open: true, provider: p })}
                        >
                          Editar
                        </Button>
                        {p.aprobacion !== "aprobado" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={loading}
                              className={hasDuplicates ? "border border-amber-500 bg-amber-600 hover:bg-amber-700 text-white" : ""}
                              onClick={() => handleApproveClick(p)}
                            >
                              Aprobar
                            </Button>
                            {p.aprobacion === "pendiente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={loading}
                                onClick={() => setRejectTarget(p)}
                              >
                                Rechazar
                              </Button>
                            )}
                          </>
                        ) : p.is_active ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={loading}
                            onClick={() => setDeactivateTarget(p)}
                          >
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => run(p.id, () => toggleProviderActive(p.id, true), "Proveedor activado")}
                          >
                            Activar
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

      <ProviderFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        provider={dialog.provider}
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
        targetType="proveedor"
        targetName={rejectTarget?.nombre ?? ""}
        loading={!!rejectTarget && loadingId === rejectTarget.id}
        onConfirm={(motivo) => {
          if (!rejectTarget) return;
          run(rejectTarget.id, () => reviewProvider(rejectTarget.id, "rechazado", motivo), "Proveedor rechazado");
        }}
      />

      <ConfirmActionModal
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Desactivar proveedor"
        description={`"${deactivateTarget?.nombre ?? ""}" dejará de verse en el directorio. Podrás volver a activarlo cuando quieras.`}
        confirmText="Desactivar"
        loading={!!deactivateTarget && loadingId === deactivateTarget.id}
        onConfirm={() => {
          if (!deactivateTarget) return;
          run(deactivateTarget.id, () => toggleProviderActive(deactivateTarget.id, false), "Proveedor desactivado");
        }}
      />

      {confirmModal.provider && (
        <DuplicateConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((m) => ({ ...m, open }))}
          targetName={confirmModal.provider.nombre}
          targetType="proveedor"
          matches={confirmModal.matches}
          onConfirm={() => {
            if (confirmModal.provider) approve(confirmModal.provider);
          }}
        />
      )}
    </div>
  );
}
