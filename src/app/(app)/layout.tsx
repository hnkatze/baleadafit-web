import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getSesion } from "@/lib/api/dashboard";

// Cache Components: el shell lee la sesión por request (API en vivo).
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const sesion = await getSesion().catch(() => null);
  const nombre = sesion?.perfil?.nombre ?? "Nutricionista";
  const rol = sesion?.rol ?? "nutricionista";

  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar nombre={nombre} rol={rol} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar nombre={nombre} />
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
