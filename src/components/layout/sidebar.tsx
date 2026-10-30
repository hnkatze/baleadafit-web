"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { Logo } from "@/components/brand/logo";
import { MAIN_NAV, SECONDARY_NAV, type NavItem } from "@/lib/nav";

/** `/` solo coincide exacto; el resto también ilumina sus subrutas (`/pacientes/[id]`). */
function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const shared =
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

  if (!item.href) {
    return (
      <span
        aria-disabled
        title="Próximamente"
        className={cn(shared, "cursor-not-allowed text-foreground/35")}
      >
        <Icon className="size-5 shrink-0" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        shared,
        active
          ? "bg-brand-soft font-semibold text-brand-deep"
          : "text-foreground/70 hover:bg-default/60 hover:text-foreground",
      )}
    >
      {active ? (
        <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />
      ) : null}
      <Icon className="size-5 shrink-0" />
      {item.label}
      {item.badge ? (
        <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ nombre, rol }: { nombre: string; rol: string }) {
  const pathname = usePathname();
  const initials = nombre
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-surface lg:flex">
      <div className="px-5 py-5">
        <Link href="/" aria-label="BaleadaFit Pro — inicio">
          <Logo size="sm" descriptor="Pro · Clinical Nutrition" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/40">
          Panel clínico
        </p>
        {MAIN_NAV.map((item) => (
          <NavEntry key={item.label} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="mt-auto flex flex-col gap-1 pb-3">
          {SECONDARY_NAV.map((item) => (
            <NavEntry key={item.label} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/12 text-xs font-bold text-brand-deep">
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{nombre}</span>
          <span className="block truncate text-[11px] capitalize text-foreground/55">
            {rol}
          </span>
        </span>
      </div>
    </aside>
  );
}
