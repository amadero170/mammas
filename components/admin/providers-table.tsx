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
import { toggleProviderActive } from "@/app/actions/proveedores";
import { ProviderFormDialog } from "@/components/admin/provider-form-dialog";
import { UserDetailModal } from "@/components/admin/user-detail-modal";
import { DuplicateConfirmModal } from "@/components/admin/duplicate-confirm-modal";
import { findProviderDuplicates, type DuplicateMatch } from "@/lib/duplicate-checker";
import { User as UserIcon, AlertTriangle } from "lucide-react";

type Props = {
  providers: Proveedor[];
  usersMap?: Record<string, UserDetail>;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

  const activeProviders = useMemo(
    () => providers.filter((p) => p.is_active),
    [providers]
  );

  // Pre-calculate duplicates for inactive providers
  const duplicatesMap = useMemo(() => {
    const map: Record<string, DuplicateMatch<Proveedor>[]> = {};
    for (const p of providers) {
      if (!p.is_active) {
        const matches = findProviderDuplicates(p, activeProviders);
        if (matches.length > 0) map[p.id] = matches;
      }
    }
    return map;
  }, [providers, activeProviders]);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");

  const stats = useMemo(() => {
    const total = providers.length;
    const active = providers.filter((p) => p.is_active && (p as any).estado !== "archivado").length;
    const inactive = providers.filter((p) => !p.is_active && (p as any).estado !== "archivado").length;
    const archived = providers.filter((p) => (p as any).estado === "archivado").length;
    return { total, active, inactive, archived };
  }, [providers]);

  const filteredProviders = useMemo(() => {
    if (statusFilter === "active") return providers.filter((p) => p.is_active && (p as any).estado !== "archivado");
    if (statusFilter === "inactive") return providers.filter((p) => !p.is_active && (p as any).estado !== "archivado");
    if (statusFilter === "archived") return providers.filter((p) => (p as any).estado === "archivado");
    return providers;
  }, [providers, statusFilter]);

  const onToggleState = async (id: string, nextState: "active" | "inactive" | "archivado") => {
    setLoadingId(id);
    try {
      const res = await toggleProviderActive(id, nextState);
      if (!res.success) {
        toast.error("No se pudo actualizar", { description: res.error });
        return;
      }
      let msg = "Proveedor actualizado";
      if (nextState === "active") msg = "Proveedor activado";
      if (nextState === "inactive") msg = "Proveedor desactivado";
      if (nextState === "archivado") msg = "Proveedor archivado";
      toast.success(msg);
      window.location.reload();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivateClick = (p: Proveedor) => {
    const matches = duplicatesMap[p.id];
    if (matches && matches.length > 0) {
      setConfirmModal({
        open: true,
        provider: p,
        matches,
      });
    } else {
      onToggleState(p.id, "active");
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
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className={statusFilter === "active" ? "bg-[#4c2f92]" : ""}
          >
            Activos ({stats.active})
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("inactive")}
            className={statusFilter === "inactive" ? "bg-[#4c2f92]" : ""}
          >
            Inactivos ({stats.inactive})
          </Button>
          <Button
            variant={statusFilter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("archived")}
            className={statusFilter === "archived" ? "bg-[#4c2f92]" : ""}
          >
            Archivados ({stats.archived})
          </Button>
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
                const isArchived = (p as any).estado === "archivado";

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
                      {isArchived ? (
                        <Badge variant="outline" className="text-gray-500 border-gray-400 bg-gray-50">
                          Archivado
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
                        {isArchived ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={loadingId === p.id}
                              onClick={() => onToggleState(p.id, "inactive")}
                            >
                              Restaurar
                            </Button>
                            <Button
                              size="sm"
                              disabled={loadingId === p.id}
                              onClick={() => handleActivateClick(p)}
                            >
                              Activar
                            </Button>
                          </>
                        ) : p.is_active ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={loadingId === p.id}
                              onClick={() => onToggleState(p.id, "inactive")}
                            >
                              Desactivar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={loadingId === p.id}
                              onClick={() => onToggleState(p.id, "archivado")}
                            >
                              Archivar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              disabled={loadingId === p.id}
                              className={hasDuplicates ? "border border-amber-500 bg-amber-600 hover:bg-amber-700 text-white" : ""}
                              onClick={() => handleActivateClick(p)}
                            >
                              Activar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={loadingId === p.id}
                              onClick={() => onToggleState(p.id, "archivado")}
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

      {confirmModal.provider && (
        <DuplicateConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((m) => ({ ...m, open }))}
          targetName={confirmModal.provider.nombre}
          targetType="proveedor"
          matches={confirmModal.matches}
          onConfirm={() => {
            if (confirmModal.provider) {
              onToggleState(confirmModal.provider.id, "active");
            }
          }}
        />
      )}
    </div>
  );
}

