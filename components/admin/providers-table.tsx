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
import type { Proveedor } from "@/lib/types";
import { toggleProviderActive } from "@/app/actions/proveedores";
import { ProviderFormDialog } from "@/components/admin/provider-form-dialog";

type Props = {
  providers: Proveedor[];
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProvidersTable({ providers }: Props) {
  console.log("[ADMIN/PROVEEDORES] ProvidersTable render", {
    count: providers?.length ?? 0,
    first: providers?.[0]
      ? { id: providers[0].id, nombre: providers[0].nombre }
      : null,
  });

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    provider: Proveedor | null;
  }>({
    open: false,
    provider: null,
  });

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
              <TableHead>Categoría</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell>{p.categoria || "-"}</TableCell>
                <TableCell>{p.zona || "-"}</TableCell>
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
                        onClick={() => onToggle(p.id, true)}
                      >
                        Activar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProviderFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        provider={dialog.provider}
      />
    </div>
  );
}
