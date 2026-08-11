"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Eye, FileText, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  getSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  type SuggestionItem,
} from "@/app/actions/suggestions";
import { ConfirmActionModal } from "@/components/confirm-action-modal";

export default function SugerenciasAdminPage() {
  const [filter, setFilter] = useState<"pending" | "accepted" | "rejected">("pending");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);

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

  const loadSuggestions = async () => {
    setLoading(true);
    const res = await getSuggestions(filter);
    if (res.success) {
      setSuggestions(res.suggestions);
    } else {
      toast.error("Error al cargar sugerencias", { description: res.error });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAccept = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Aceptar sugerencia",
      description: "¿Aceptar esta sugerencia? Se actualizarán automáticamente los datos del elemento en la base de datos.",
      variant: "primary",
      action: async () => {
        setActionLoadingId(id);
        const res = await acceptSuggestion(id);
        if (res.success) {
          toast.success("Sugerencia aceptada y datos actualizados correctamente 🎉");
          setSelectedSuggestion(null);
          loadSuggestions();
        } else {
          toast.error("Error al aceptar sugerencia", { description: res.error });
        }
        setActionLoadingId(null);
        setConfirmModal((c) => ({ ...c, open: false }));
      },
    });
  };

  const handleReject = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Rechazar sugerencia",
      description: "¿Seguro que deseas rechazar esta sugerencia de cambio?",
      variant: "destructive",
      action: async () => {
        setActionLoadingId(id);
        const res = await rejectSuggestion(id);
        if (res.success) {
          toast.success("Sugerencia rechazada");
          setSelectedSuggestion(null);
          loadSuggestions();
        } else {
          toast.error("Error al rechazar sugerencia", { description: res.error });
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
        <h1 className="font-aller text-3xl font-bold text-[#2e1b40]">
          Sugerencias de Cambios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá las solicitudes de modificación enviadas por las mamás de la comunidad.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          className={filter === "pending" ? "bg-[#4c2f92]" : ""}
          onClick={() => setFilter("pending")}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === "accepted" ? "default" : "outline"}
          size="sm"
          className={filter === "accepted" ? "bg-[#4c2f92]" : ""}
          onClick={() => setFilter("accepted")}
        >
          Aceptadas
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          size="sm"
          className={filter === "rejected" ? "bg-[#4c2f92]" : ""}
          onClick={() => setFilter("rejected")}
        >
          Rechazadas
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Cargando sugerencias...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No hay sugerencias {filter === "pending" ? "pendientes" : filter === "accepted" ? "aceptadas" : "rechazadas"}.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px] uppercase font-semibold">
                      {s.target_type === "provider" ? "Proveedor" : "Evento"}
                    </Badge>
                    <h3 className="font-bold text-[#4c2f92] text-lg leading-tight">
                      {s.target_nombre}
                    </h3>
                  </div>

                  <Badge
                    className={
                      s.estado === "pending"
                        ? "bg-amber-500"
                        : s.estado === "accepted"
                        ? "bg-emerald-600"
                        : "bg-red-500"
                    }
                  >
                    {s.estado === "pending" ? "Pendiente" : s.estado === "accepted" ? "Aceptada" : "Rechazada"}
                  </Badge>
                </div>

                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-[#4c2f92]" />
                    <span>Sugerido por: <strong>{s.user_nombre}</strong></span>
                  </div>
                  <div>Fecha: {formatDate(s.created_at)}</div>
                </div>

                {s.comentario && (
                  <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs italic text-gray-700 border">
                    &quot;{s.comentario}&quot;
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSuggestion(s)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Ver cambios
                </Button>

                {s.estado === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      disabled={actionLoadingId === s.id}
                      onClick={() => handleReject(s.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#4c2f92] hover:bg-[#3d2575] text-white"
                      disabled={actionLoadingId === s.id}
                      onClick={() => handleAccept(s.id)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Aceptar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSuggestion && (
        <Dialog
          open={!!selectedSuggestion}
          onOpenChange={(open) => {
            if (!open) setSelectedSuggestion(null);
          }}
        >
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#4c2f92]">
                <FileText className="h-5 w-5" />
                <DialogTitle>Detalle de Cambios Sugeridos</DialogTitle>
              </div>
              <DialogDescription>
                {selectedSuggestion.target_nombre} ({selectedSuggestion.target_type === "provider" ? "Proveedor" : "Evento"})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded border bg-muted/30 p-3 space-y-1">
                <div><strong>Sugerido por:</strong> {selectedSuggestion.user_nombre} ({selectedSuggestion.user_email})</div>
                <div><strong>Fecha:</strong> {formatDate(selectedSuggestion.created_at)}</div>
                {selectedSuggestion.comentario && (
                  <div><strong>Comentario:</strong> &quot;{selectedSuggestion.comentario}&quot;</div>
                )}
              </div>

              {(() => {
                const currentObj = selectedSuggestion.target_data || {};
                const suggestedObj = selectedSuggestion.datos_sugeridos || {};

                const formatValue = (val: any) => {
                  if (val === null || val === undefined) return "";
                  if (Array.isArray(val)) return val.join(", ").trim();
                  return String(val).trim();
                };

                // Filter only keys that actually changed
                const changedKeys = Object.keys(suggestedObj).filter((key) => {
                  const beforeStr = formatValue(currentObj[key]);
                  const afterStr = formatValue(suggestedObj[key]);
                  return beforeStr !== afterStr;
                });

                if (changedKeys.length === 0) {
                  return (
                    <div className="rounded border border-gray-200 bg-gray-50 p-4 text-center text-muted-foreground">
                      No se detectaron diferencias de valor con la información publicada actualmente.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 pt-1">
                    <div className="font-bold text-sm text-[#4c2f92] flex items-center justify-between">
                      <span>Campos modificados ({changedKeys.length}):</span>
                    </div>
                    {changedKeys.map((key) => {
                      const beforeVal = formatValue(currentObj[key]);
                      const afterVal = formatValue(suggestedObj[key]);

                      return (
                        <div key={key} className="rounded-lg border bg-white p-3 space-y-2 shadow-xs">
                          <div className="font-bold capitalize text-[#4c2f92] text-xs">
                            Campo: <span className="font-mono bg-purple-50 text-[#4c2f92] px-1.5 py-0.5 rounded border border-purple-100">{key}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* ANTES */}
                            <div className="rounded border bg-red-50/70 p-2.5 text-red-900 border-red-200">
                              <div className="font-bold text-[10px] text-red-700 uppercase tracking-wide mb-1">
                                Antes (Valor Actual)
                              </div>
                              <div className="font-mono break-words text-[11px] leading-relaxed">
                                {beforeVal ? beforeVal : <span className="italic opacity-60">— (Sin información)</span>}
                              </div>
                            </div>

                            {/* DESPUÉS */}
                            <div className="rounded border bg-emerald-50/70 p-2.5 text-emerald-900 border-emerald-200">
                              <div className="font-bold text-[10px] text-emerald-700 uppercase tracking-wide mb-1">
                                Después (Sugerencia)
                              </div>
                              <div className="font-mono break-words text-[11px] leading-relaxed font-semibold">
                                {afterVal ? afterVal : <span className="italic opacity-60">— (Eliminado)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSuggestion(null)}
              >
                Cerrar
              </Button>

              {selectedSuggestion.estado === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={actionLoadingId === selectedSuggestion.id}
                    onClick={() => handleReject(selectedSuggestion.id)}
                  >
                    Rechazar
                  </Button>
                  <Button
                    className="bg-[#4c2f92] hover:bg-[#3d2575] text-white"
                    disabled={actionLoadingId === selectedSuggestion.id}
                    onClick={() => handleAccept(selectedSuggestion.id)}
                  >
                    Aceptar e implementar
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
