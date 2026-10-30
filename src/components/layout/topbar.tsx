import Link from "next/link";
import { Bell, Magnifier } from "@gravity-ui/icons";
import { Logo } from "@/components/brand/logo";

export function Topbar({
  nombre,
  busqueda = "Buscar paciente, plan o alimento…",
}: {
  nombre: string;
  busqueda?: string;
}) {
  const firstName = nombre.replace(/^(Dra?\.|Lic\.)\s*/i, "").split(" ")[0];

  return (
    <header className="flex items-center gap-3 border-b border-border/70 bg-surface px-4 py-3 lg:px-6">
      <Link href="/" aria-label="BaleadaFit Pro — inicio" className="lg:hidden">
        <Logo size="sm" />
      </Link>

      <label className="relative flex flex-1 items-center">
        <span className="sr-only">Buscar</span>
        <Magnifier className="pointer-events-none absolute left-3 size-4 text-foreground/40" />
        <input
          type="search"
          placeholder={busqueda}
          className="h-10 w-full rounded-xl border border-border/70 bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
        />
      </label>

      <span className="hidden items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-brand-deep sm:flex">
        <span className="size-1.5 rounded-full bg-brand" />
        Tegucigalpa · GMT-6
      </span>

      <button
        type="button"
        aria-label="Notificaciones"
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/70 text-foreground/60 transition-colors hover:bg-default/60 hover:text-foreground"
      >
        <Bell className="size-4.5" />
      </button>

      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white lg:hidden">
        {firstName?.[0]?.toUpperCase() ?? "N"}
      </span>
    </header>
  );
}
