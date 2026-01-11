import { Suspense } from "react";
import RegistroClient from "./registroClient";

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <RegistroClient />
    </Suspense>
  );
}
