"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag, CheckCircle, XCircle, User as UserIcon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  getReports,
  resolveReport,
  type ReportItem,
} from "@/app/actions/reports";
import { ConfirmActionModal } from "@/components/confirm-action-modal";
import { DeactivateDialog } from "@/components/admin/deactivate-dialog";

export default function ReportesAdminPage() {
  const [filter, setFilter] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    const res = await getReports(filter);
    if (res.success) {
      setReports(res.reports);
    } else {
      toast.error("Error al cargar reportes", { description: res.error });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "primary" | "destructive";
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "primary",
    action: async () => {},
  });

  const [deactivateTarget, setDeactivateTarget] = useState<ReportItem | null>(null);

  const handleDeactivate = async (r: ReportItem, motivo: string) => {
    setActionLoadingId(r.id);
    const res = await resolveReport(r.id, "deactivate_target", motivo);
    if (res.success) {
      if (res.emailSent === false) {
        toast.warning("Elemento desactivado y reporte resuelto", {
          description: "No se pudo enviar el correo de aviso a quien lo cargó",
        });
      } else {
        toast.success("Elemento desactivado y reporte marcado como resuelto ✅");
      }
      setDeactivateTarget(null);
      loadReports();
    } else {
      toast.error("Error al resolver el reporte", { description: res.error });
    }
    setActionLoadingId(null);
  };

  const handleDismiss = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Desestimar reporte",
      description: "¿Desestimar este reporte sin desactivar el contenido?",
      variant: "primary",
      action: async () => {
        setActionLoadingId(id);
        const res = await resolveReport(id, "dismiss");
        if (res.success) {
          toast.success("Reporte desestimado");
          loadReports();
        } else {
          toast.error("Error al desestimar el reporte", { description: res.error });
        }
        setActionLoadingId(null);
        setConfirmModal((c) => ({ ...c, open: false }));
      },
    });
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-aller text-3xl font-bold text-[#2e1b40] flex items-center gap-2">
          <Flag className="h-7 w-7 text-red-600" />
          Reportes de la Comunidad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de denuncias y reportes enviados por mamás sobre proveedores o eventos.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          className={filter === "pending" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          onClick={() => setFilter("pending")}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === "resolved" ? "default" : "outline"}
          size="sm"
          className={filter === "resolved" ? "bg-emerald-600 text-white" : ""}
          onClick={() => setFilter("resolved")}
        >
          Resueltos
        </Button>
        <Button
          variant={filter === "dismissed" ? "default" : "outline"}
          size="sm"
          className={filter === "dismissed" ? "bg-gray-600 text-white" : ""}
          onClick={() => setFilter("dismissed")}
        >
          Desestimados
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Cargando reportes...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No hay reportes {filter === "pending" ? "pendientes" : filter === "resolved" ? "resueltos" : "desestimados"}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm space-y-4 border-l-4 border-l-red-500"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px] uppercase font-semibold">
                      {r.target_type === "provider" ? "Proveedor" : "Evento"}
                    </Badge>
                    <h3 className="font-bold text-[#2e1b40] text-lg leading-tight">
                      {r.target_nombre}
                    </h3>
                  </div>

                  <Badge
                    className={
                      r.estado === "pending"
                        ? "bg-red-600"
                        : r.estado === "resolved"
                        ? "bg-emerald-600"
                        : "bg-gray-500"
                    }
                  >
                    {r.estado === "pending" ? "Pendiente" : r.estado === "resolved" ? "Resuelto" : "Desestimado"}
                  </Badge>
                </div>

                {/* Motivo Badge */}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{r.motivo}</span>
                  </span>
                </div>

                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-[#4c2f92]" />
                    <span>Reportado por: <strong>{r.user_nombre}</strong></span>
                  </div>
                  <div>Fecha: {formatDate(r.created_at)}</div>
                </div>

                {r.detalles && (
                  <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs italic text-gray-700 border">
                    &quot;{r.detalles}&quot;
                  </div>
                )}
              </div>

              {r.estado === "pending" && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoadingId === r.id}
                    onClick={() => handleDismiss(r.id)}
                  >
                    <XCircle className="mr-1.5 h-4 w-4 text-gray-500" />
                    Desestimar
                  </Button>

                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={actionLoadingId === r.id}
                    onClick={() => setDeactivateTarget(r)}
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Desactivar {r.target_type === "provider" ? "Proveedor" : "Evento"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DeactivateDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title={deactivateTarget?.target_type === "event" ? "Despublicar evento" : "Desactivar proveedor"}
        description={`"${deactivateTarget?.target_nombre ?? "Este elemento"}" dejará de verse y el reporte quedará resuelto.`}
        confirmText={deactivateTarget?.target_type === "event" ? "Despublicar" : "Desactivar"}
        loading={!!deactivateTarget && actionLoadingId === deactivateTarget.id}
        onConfirm={(motivo) => {
          if (deactivateTarget) handleDeactivate(deactivateTarget, motivo);
        }}
      />

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((c) => ({ ...c, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        loading={!!actionLoadingId}
        onConfirm={confirmModal.action}
      />
    </div>
  );
}
