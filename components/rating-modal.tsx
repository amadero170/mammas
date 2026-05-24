"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { rateProvider } from "@/app/actions/ratings";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  currentRating: number | null; // existing rating by this user, or null
  onRated: (providerId: string, score: number) => void; // callback after successful rating
}

export function RatingModal({
  open,
  onOpenChange,
  providerId,
  providerName,
  currentRating,
  onRated,
}: RatingModalProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedScore, setSelectedScore] = useState(currentRating ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens with new data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedScore(currentRating ?? 0);
      setHoveredStar(0);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (selectedScore < 1 || selectedScore > 5) {
      toast.error("Selecciona una calificación");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rateProvider(providerId, selectedScore);
      if (!result.success) {
        toast.error("Error al calificar", { description: result.error });
      } else {
        toast.success("¡Calificación guardada!");
        onRated(providerId, selectedScore);
        onOpenChange(false);
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayScore = hoveredStar || selectedScore;

  const ratingLabels: Record<number, string> = {
    1: "Malo",
    2: "Regular",
    3: "Bueno",
    4: "Muy bueno",
    5: "Excelente",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-[#2e1b40]">
            Calificar
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Provider name */}
          <p className="text-center font-semibold text-[#4c2f92]">
            {providerName}
          </p>

          {/* Interactive stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setSelectedScore(star)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= displayScore
                      ? "fill-[#e5f34a] text-[#e5f34a]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating label */}
          <p className="h-5 text-sm font-medium text-[#2e1b40]/70">
            {displayScore > 0 ? ratingLabels[displayScore] : ""}
          </p>

          {/* Current rating indicator */}
          {currentRating && (
            <p className="text-xs text-muted-foreground">
              Tu calificación actual: {currentRating} estrella
              {currentRating > 1 ? "s" : ""}
            </p>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedScore === 0}
            className="mt-2 w-full rounded-full bg-[#4c2f92] px-8 py-2.5 font-bold text-white hover:bg-[#3d2575] disabled:opacity-50"
          >
            {isSubmitting
              ? "Guardando..."
              : currentRating
              ? "Actualizar calificación"
              : "Guardar calificación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
