"use client";

import { useId } from "react";
import { cn } from "@heroui/react";

type LogoVariant = "clinic" | "pro";

const markSizes = {
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
} as const;

const wordSizes = {
  sm: "text-[13px]",
  md: "text-base",
  lg: "text-xl",
} as const;

export function LogoMark({ className }: { className?: string }) {
  // El degradado se referencia por id, y el logo se renderiza más de una vez por
  // página (sidebar + topbar, panel y formulario del login): el id tiene que ser
  // único por instancia para no duplicar ids en el documento.
  const gradientId = `bf-pulse-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      role="img"
      aria-label="BaleadaFit"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <g
        transform="translate(100, 100)"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M -80,10 A 80 80 0 0 1 80 10"
          stroke="currentColor"
          strokeWidth={16}
        />
        <path d="M -70,-5 Q 0 -65 70,-5" stroke="currentColor" strokeWidth={14} />
        <polyline
          points="-45,5 -15,5 0,-30 15,22 30,5 50,5"
          stroke={`url(#${gradientId})`}
          strokeWidth={14}
        />
      </g>
    </svg>
  );
}

export function Logo({
  variant = "clinic",
  size = "md",
  descriptor,
  className,
}: {
  variant?: LogoVariant;
  size?: keyof typeof markSizes;
  descriptor?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark
        className={cn(
          markSizes[size],
          "h-auto",
          variant === "pro" ? "text-white" : "text-foreground",
        )}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight",
            wordSizes[size],
            variant === "pro" ? "text-white" : "text-foreground",
          )}
        >
          BALEADA<span className="text-brand">FIT</span>
        </span>
        {descriptor ? (
          <span
            className={cn(
              "mt-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
              variant === "pro" ? "text-white/60" : "text-foreground/50",
            )}
          >
            {descriptor}
          </span>
        ) : null}
      </span>
    </span>
  );
}
