import { apiGet } from "./client";

export type CitaHoy = {
  id: string;
  /** Instante ISO con zona; se muestra en GMT-6 (regla 1 de docs/contexto-api.md). */
  fechaHora: string;
  duracionMin: number;
  estado: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    telefono?: string | null;
  };
  /** La API todavía no devuelve la modalidad de la cita; se muestra si algún día llega. */
  modalidad?: "PRESENCIAL" | "VIRTUAL";
};

export type DashboardSummary = {
  pacientesActivos: number;
  planesEnBorrador: number;
  citasHoy: CitaHoy[];
};

export type Nutricionista = {
  rol: string;
  /** `/auth/me` responde `perfil: null` cuando la cuenta no tiene perfil (rol `sin_perfil`). */
  perfil: {
    id: string;
    nombre: string;
    correo: string;
    colegiado: string | null;
    telefono: string | null;
  } | null;
};

export function getDashboard() {
  return apiGet<DashboardSummary>("/dashboard");
}

export function getSesion() {
  return apiGet<Nutricionista>("/auth/me");
}
