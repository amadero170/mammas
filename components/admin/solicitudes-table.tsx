"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import type { SolicitudMamma } from "@/lib/types";

interface SolicitudesTableProps {
  solicitudes: SolicitudMamma[];
  adminId: string;
  onAprobar: (
    id: string,
    adminId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onRechazar: (
    id: string,
    adminId: string,
    razon: string
  ) => Promise<{ success: boolean; error?: string }>;
  readOnly?: boolean;
}

export function SolicitudesTable({
  solicitudes,
  adminId,
  onAprobar,
  onRechazar,
  readOnly = false,
}: SolicitudesTableProps) {
  const [rechazarDialog, setRechazarDialog] = useState<{
    open: boolean;
    solicitudId: string | null;
    razon: string;
  }>({
    open: false,
    solicitudId: null,
    razon: "",
  });
  const [loading, setLoading] = useState<string | null>(null);

  const handleAprobar = async (id: string) => {
    setLoading(id);
    try {
      const result = await onAprobar(id, adminId);
      if (result.success) {
        toast.success("Solicitud aprobada");
        window.location.reload();
      } else {
        toast.error("Error al aprobar", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setLoading(null);
    }
  };

  const handleRechazar = async () => {
    if (!rechazarDialog.solicitudId || !rechazarDialog.razon.trim()) {
      toast.error("Debes proporcionar una razón para el rechazo");
      return;
    }

    setLoading(rechazarDialog.solicitudId);
    try {
      const result = await onRechazar(
        rechazarDialog.solicitudId,
        adminId,
        rechazarDialog.razon
      );
      if (result.success) {
        toast.success("Solicitud rechazada");
        setRechazarDialog({ open: false, solicitudId: null, razon: "" });
        window.location.reload();
      } else {
        toast.error("Error al rechazar", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (solicitudes.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No hay solicitudes en este estado
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Fecha</TableHead>
              {readOnly && <TableHead>Razón</TableHead>}
              {!readOnly && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudes.map((solicitud) => (
              <TableRow key={solicitud.id}>
                <TableCell className="font-medium">
                  {solicitud.nombre}
                </TableCell>
                <TableCell>{solicitud.email}</TableCell>
                <TableCell>{solicitud.telefono || "-"}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {solicitud.mensaje || "-"}
                </TableCell>
                <TableCell>{formatDate(solicitud.created_at)}</TableCell>
                {readOnly && (
                  <TableCell>
                    {solicitud.razon_rechazo && (
                      <span className="text-sm text-muted-foreground">
                        {solicitud.razon_rechazo}
                      </span>
                    )}
                  </TableCell>
                )}
                {!readOnly && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAprobar(solicitud.id)}
                        disabled={loading === solicitud.id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setRechazarDialog({
                            open: true,
                            solicitudId: solicitud.id,
                            razon: "",
                          })
                        }
                        disabled={loading === solicitud.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={rechazarDialog.open}
        onOpenChange={(open) =>
          setRechazarDialog({ open, solicitudId: null, razon: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Proporciona una razón para el rechazo de esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="razon">Razón del rechazo</Label>
              <Textarea
                id="razon"
                placeholder="Ej: No cumple con los requisitos..."
                value={rechazarDialog.razon}
                onChange={(e) =>
                  setRechazarDialog({
                    ...rechazarDialog,
                    razon: e.target.value,
                  })
                }
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRechazarDialog({ open: false, solicitudId: null, razon: "" })
              }
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRechazar}
              disabled={loading !== null}
            >
              {loading ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
