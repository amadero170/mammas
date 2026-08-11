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

  const stats = useMemo(() => {
    const total = providers.length;
    const active = providers.filter((p) => p.is_active).length;
    return { total, active };
  }, [providers]);

  const onToggle = async (id: string, next: boolean) => {
    setLoadingId(id);
    try {
      const res = await toggleProviderActive(id, next);
      if (!res.success) {
        toast.error("No se pudo actualizar", { description: res.error });
        return;
      }
      toast.success(next ? "Proveedor activado" : "Proveedor desactivado");
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
      onToggle(p.id, true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {stats.total} proveedores · {stats.active} activos
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
            {providers.map((p) => {
              const creator = p.creado_por ? usersMap[p.creado_por] : null;
              const matches = duplicatesMap[p.id];
              const hasDuplicates = matches && matches.length > 0;

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
                    {p.is_active ? (
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
                      {p.is_active ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={loadingId === p.id}
                          onClick={() => onToggle(p.id, false)}
                        >
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={loadingId === p.id}
                          className={hasDuplicates ? "border border-amber-500 bg-amber-600 hover:bg-amber-700 text-white" : ""}
                          onClick={() => handleActivateClick(p)}
                        >
                          Activar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
              onToggle(confirmModal.provider.id, true);
            }
          }}
        />
      )}
    </div>
  );
}

