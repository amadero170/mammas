"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Shield } from "lucide-react";
import type { UserDetail } from "@/lib/types";

interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDetail | null;
}

export function UserDetailModal({
  open,
  onOpenChange,
  user,
}: UserDetailModalProps) {
  if (!user) return null;

  const getInitials = (nombre: string, email: string) => {
    if (nombre && nombre !== "Usuario") {
      return nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return (email || "U")
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();
  };

  const roleLabel =
    user.role === "admin"
      ? "Administrador"
      : user.role === "mamma"
      ? "Mamma"
      : "Usuario";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Información del Creador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* User header pill */}
          <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
            <Avatar className="h-14 w-14 shadow-sm">
              <AvatarFallback className="bg-[#4c2f92] text-lg font-bold text-white uppercase font-aller">
                {getInitials(user.nombre, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-base font-semibold capitalize tracking-wide truncate">
                {user.nombre}
              </span>
              <div>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#4c2f92] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  Correo Electrónico
                </p>
                <p className="text-foreground font-medium truncate">
                  {user.email || "No registrado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#4c2f92] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  Teléfono / Contacto
                </p>
                <p className="text-foreground font-medium">
                  {user.telefono ? (
                    <a
                      href={`tel:${user.telefono}`}
                      className="text-primary hover:underline"
                    >
                      {user.telefono}
                    </a>
                  ) : (
                    "No registrado"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
