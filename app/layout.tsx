import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Mammas Bahía — Sabiduría Local Colectiva",
  description:
    "Red de mamás en Bahía de Banderas. Recomendaciones reales de servicios, productos y experiencias locales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-karla antialiased" suppressHydrationWarning>
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
