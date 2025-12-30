export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
