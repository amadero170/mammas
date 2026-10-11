"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  /** Se llama al cerrar el aviso (botón "Entendido", X o clic afuera). */
  onClose: () => void;
};

/** Aviso centrado que la persona tiene que cerrar, para que lea qué sigue después de enviar algo. */
export function SuccessDialog({ open, title, description, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center sm:text-center">
          <CheckCircle2 className="mb-2 h-12 w-12 text-green-600" />
          <DialogTitle className="text-xl font-bold text-[#4c2f92]">{title}</DialogTitle>
          {description && (
            <DialogDescription className="pt-2 text-sm text-gray-600">{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="pt-2 sm:justify-center">
          <Button
            type="button"
            onClick={onClose}
            className="w-full bg-[#4c2f92] text-white hover:bg-[#3d2575] sm:w-auto"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
