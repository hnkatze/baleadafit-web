"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ArrowChevronLeft, ArrowChevronRight, ArrowRightFromSquare } from "@gravity-ui/icons";
import { cn } from "@heroui/react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SessionSync } from "@/components/auth/session-sync";
import { clearSession } from "@/components/auth/client-session";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { MAIN_NAV, SECONDARY_NAV, type NavItem } from "@/lib/nav";

/** `/` solo coincide exacto; el resto también ilumina sus subrutas (`/pacientes/[id]`). */
function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavEntry({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  // La etiqueta sigue en el DOM (sr-only) para que el nombre accesible no dependa
  // solo del `title`, y el icono queda centrado en el riel.
  const shared = cn(
    "relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors",
    collapsed ? "justify-center px-0" : "gap-3 px-3",
  );
  const label = cn("whitespace-nowrap", collapsed && "sr-only");

  if (!item.href) {
    return (
      <span
        aria-disabled
        title={collapsed ? `${item.label} — próximamente` : "Próximamente"}
        className={cn(shared, "cursor-not-allowed text-foreground/35")}
      >
        <Icon className="size-5 shrink-0" />
        <span className={label}>{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
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
      <span className={label}>{item.label}</span>
      {item.badge && !collapsed ? (
        <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function SignOutButton({
  collapsed,
  pending,
  onSignOut,
}: {
  collapsed: boolean;
  pending: boolean;
  onSignOut: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      aria-label="Cerrar sesión"
      title={collapsed ? "Cerrar sesión" : undefined}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-foreground/55 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <ArrowRightFromSquare className="size-4" />
    </button>
  );
}

export function Sidebar({ nombre, rol }: { nombre: string; rol: string }) {
  const pathname = usePathname();
  const router = useRouter();
  // Solo estado local: el ancho del riel no se persiste entre sesiones.
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Sin sesión de Firebase (o sin config): igual limpiamos la cookie.
    }

    try {
      await clearSession();
    } catch {
      // Si el route handler falla igual volvemos al login.
    }

    router.replace("/login");
  }

  const initials = nombre
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      id="app-sidebar"
      className={cn(
        // Debajo de `lg` el panel sigue oculto (la navegación móvil es aparte).
        "hidden shrink-0 flex-col overflow-hidden border-r border-border/70 bg-surface transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          collapsed ? "flex-col gap-3 px-2 py-4" : "justify-between gap-2 px-5 py-5",
        )}
      >
        <Link
          href="/"
          aria-label="BaleadaFit Pro — inicio"
          className={collapsed ? "grid place-items-center" : undefined}
        >
          {collapsed ? (
            <LogoMark className="size-7 h-auto text-foreground" />
          ) : (
            <Logo size="sm" descriptor="Pro · Clinical Nutrition" />
          )}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar-nav"
          aria-label={collapsed ? "Expandir el panel lateral" : "Contraer el panel lateral"}
          title={collapsed ? "Expandir el panel" : "Contraer el panel"}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-foreground/55 transition-colors hover:bg-default/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {collapsed ? (
            <ArrowChevronRight className="size-4" />
          ) : (
            <ArrowChevronLeft className="size-4" />
          )}
        </button>
      </div>

      <nav
        id="app-sidebar-nav"
        aria-label="Navegación principal"
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {collapsed ? null : (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/40">
            Panel clínico
          </p>
        )}
        {MAIN_NAV.map((item) => (
          <NavEntry
            key={item.label}
            item={item}
            active={isActive(pathname, item.href)}
            collapsed={collapsed}
          />
        ))}

        <div className="mt-auto flex flex-col gap-1 pb-3">
          {SECONDARY_NAV.map((item) => (
            <NavEntry
              key={item.label}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {collapsed ? (
        <div className="mx-auto mb-3 flex shrink-0 flex-col items-center gap-2">
          <div
            title={`${nombre} · ${rol}`}
            className="grid size-9 place-items-center rounded-full bg-brand/12 text-xs font-bold text-brand-deep"
          >
            <span className="sr-only">{`${nombre} · ${rol}`}</span>
            {initials}
          </div>
          <SignOutButton collapsed pending={signingOut} onSignOut={handleSignOut} />
        </div>
      ) : (
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
          <span className="ml-auto">
            <SignOutButton collapsed={false} pending={signingOut} onSignOut={handleSignOut} />
          </span>
        </div>
      )}

      <SessionSync />
    </aside>
  );
}
