import Footer from "@/components/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-16 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
