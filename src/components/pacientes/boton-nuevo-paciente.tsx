"use client";

import { useRouter } from "next/navigation";
import { Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

/**
 * Acceso al alta de paciente (T6). Es un `Button` con `router.push` y no un `Link`: la pantalla de
 * alta es una ruta del shell y no tiene sentido anidar un `button` dentro de un `a`.
 */
export function BotonNuevoPaciente() {
  const router = useRouter();

  return (
    <Button onPress={() => router.push("/pacientes/nuevo")}>
      <Plus className="size-4" />
      Nuevo paciente
    </Button>
  );
}
