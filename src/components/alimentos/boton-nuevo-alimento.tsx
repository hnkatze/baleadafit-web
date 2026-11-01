"use client";

import { useRouter } from "next/navigation";
import { Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

/**
 * Acceso al alta de alimento (T5). Igual que el alta de paciente: es un `Button` con
 * `router.push` y no un `Link`, para no anidar un `button` dentro de un `a`.
 */
export function BotonNuevoAlimento() {
  const router = useRouter();

  return (
    <Button onPress={() => router.push("/alimentos/nuevo")}>
      <Plus className="size-4" />
      Nuevo alimento
    </Button>
  );
}
