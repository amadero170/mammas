import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-background p-8 text-center">
        <h1 className="text-2xl font-bold">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          El link que abriste no existe o fue movido.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}

