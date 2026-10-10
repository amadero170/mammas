"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGoogleMapsUrl } from "@/lib/utils";
import { AlertTriangle, HelpCircle } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

/** Campo para el enlace de Google Maps, con instrucciones paso a paso. */
export function MapsLinkField({ value, onChange }: Props) {
  const invalid = !isGoogleMapsUrl(value);

  return (
    <div className="grid grid-cols-1 gap-2">
      <Label>Ubicación en Google Maps</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pega aquí el enlace, ej: https://maps.app.goo.gl/..."
        inputMode="url"
      />

      {invalid && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Esto no parece un enlace de Google Maps. Sigue los pasos de abajo para copiarlo.
        </p>
      )}

      <details className="group rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-[#4c2f92]">
          <HelpCircle className="h-4 w-4" />
          ¿Cómo copio el enlace?
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 text-muted-foreground sm:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold text-foreground">Desde el celular</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Abre la app de Google Maps y busca el lugar.</li>
              <li>Toca el nombre del lugar para ver su ficha.</li>
              <li>Toca <strong>Compartir</strong>.</li>
              <li>Elige <strong>Copiar enlace</strong>.</li>
              <li>Regresa aquí y pégalo en el campo.</li>
            </ol>
          </div>
          <div>
            <p className="mb-1 font-semibold text-foreground">Desde la computadora</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Entra a maps.google.com y busca el lugar.</li>
              <li>Haz clic en el lugar y luego en <strong>Compartir</strong>.</li>
              <li>Haz clic en <strong>Copiar vínculo</strong>.</li>
              <li>Pégalo en el campo de arriba.</li>
            </ol>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          El enlace debe empezar con <code>https://maps.app.goo.gl/</code> o{" "}
          <code>https://www.google.com/maps/</code>. No escribas la dirección a mano.
        </p>
      </details>
    </div>
  );
}
