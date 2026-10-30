import {
  Calendar,
  Gear,
  House,
  ListCheck,
  Persons,
  SquareListUl,
} from "@gravity-ui/icons";

export type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
};

/** Rutas todavía no construidas: se muestran deshabilitadas para no romper la navegación. */
export const MAIN_NAV: NavItem[] = [
  { label: "Inicio", href: "/", icon: House },
  { label: "Pacientes", href: "/pacientes", icon: Persons },
  { label: "Planes", icon: ListCheck },
  { label: "Alimentos", icon: SquareListUl },
  { label: "Agenda", icon: Calendar },
];

export const SECONDARY_NAV: NavItem[] = [{ label: "Configuración", icon: Gear }];
