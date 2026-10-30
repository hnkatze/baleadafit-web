import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · BaleadaFit",
};

const highlights = [
  "Planes alimenticios con comida hondureña",
  "Cálculo de requerimientos y adherencia",
  "Expediente clínico por paciente",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-soft p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-brand-mint/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 size-[24rem] rounded-full bg-brand/15 blur-3xl"
        />

        <Logo
          size="lg"
          descriptor="Pro · Clinical Nutrition"
          className="relative z-10"
        />

        <div className="relative z-10 flex max-w-md flex-col gap-6">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-deep">
            Nutrición clínica con comida hondureña, medida al gramo.
          </h2>
          <ul className="flex flex-col gap-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-deep/80">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-brand-deep/50">
          BaleadaFit Pro · San Pedro Sula, Honduras
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo
            size="md"
            descriptor="Pro · Clinical Nutrition"
            className="mb-10 lg:hidden"
          />
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
