export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-8 md:p-24"
      style={
        {
          // Temporary inline style to verify CSS variables work
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
        } as React.CSSProperties
      }
    >
      <div className="z-10 max-w-5xl w-full text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Mammas Bahía
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Plataforma de directorio de proveedores
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/directorio"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            Explorar Directorio
          </a>
          <a
            href="/solicitar-acceso"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:shadow-md"
          >
            Solicitar Acceso
          </a>
        </div>
      </div>
    </main>
  );
}
