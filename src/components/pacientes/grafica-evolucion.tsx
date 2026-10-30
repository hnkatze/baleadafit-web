import { ChartLine } from "@gravity-ui/icons";
import type { EvolucionPunto } from "@/lib/api/pacientes";

/**
 * Las fechas de `evolucion` son fechas de calendario guardadas como medianoche UTC
 * (regla 1 de docs/contexto-api.md): se formatean en UTC para no correr el día.
 */
const CALENDAR_TZ = "UTC";

const shortDate = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "short",
  timeZone: CALENDAR_TZ,
});

const longDate = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: CALENDAR_TZ,
});

const decimal = new Intl.NumberFormat("es-HN", { maximumFractionDigits: 1 });

/** Ancho lógico del viewBox; el SVG escala con el contenedor (`w-full h-auto`). */
const WIDTH = 720;
const MARGIN = { top: 28, right: 30, bottom: 30, left: 44 };
/** Con más puntos que esto las etiquetas de valor se pisan: solo se anotan las puntas. */
const MAX_VALUE_LABELS = 8;
const MAX_DATE_LABELS = 6;

type SeriesPoint = { index: number; fecha: string; valor: number };
type DateGroup = { center: number; fecha: string };

function dayKey(value: string) {
  return value.slice(0, 10);
}

/** Etiqueta corta del eje ("29 oct"): `es-HN` separa día y mes con guion. */
function axisDate(value: string) {
  const parts = shortDate.formatToParts(new Date(value));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${day} ${month}`.trim();
}

/** Agrupa mediciones consecutivas del mismo día y centra la etiqueta del eje. */
function dateGroups(points: SeriesPoint[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let start = 0;

  for (let i = 1; i <= points.length; i += 1) {
    const isEnd = i === points.length;
    if (!isEnd && dayKey(points[i].fecha) === dayKey(points[i - 1].fecha)) continue;

    // El centro se calcula sobre los índices reales: la serie puede ser dispersa.
    const group = points.slice(start, i);
    const center = group.reduce((sum, point) => sum + point.index, 0) / group.length;
    groups.push({ center, fecha: points[start].fecha });
    start = i;
  }

  return groups;
}

/** Si hay muchas fechas distintas se muestran seis repartidas para no amontonar. */
function visibleDateGroups(groups: DateGroup[]): DateGroup[] {
  if (groups.length <= MAX_DATE_LABELS) return groups;

  const picks = Array.from({ length: MAX_DATE_LABELS }, (_, k) =>
    Math.round((k * (groups.length - 1)) / (MAX_DATE_LABELS - 1)),
  );

  return [...new Set(picks)].map((index) => groups[index]);
}

function SeriesChart({
  points,
  total,
  height,
  unit,
  label,
  color,
}: {
  points: SeriesPoint[];
  /** Cantidad de mediciones totales: define la posición en el eje X. */
  total: number;
  height: number;
  unit: string;
  label: string;
  color: string;
}) {
  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const values = points.map((point) => point.valor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Si todos los valores coinciden, el rango es una banda de 1 para no dividir por 0.
  const span = max - min || Math.max(1, Math.abs(max) * 0.05);
  const low = min - span * 0.2;
  const high = max + span * 0.2;

  const y = (value: number) =>
    MARGIN.top + innerHeight - ((value - low) / (high - low)) * innerHeight;
  const x = (index: number) =>
    MARGIN.left + (total <= 1 ? innerWidth / 2 : (index * innerWidth) / (total - 1));

  const ticks = Array.from({ length: 4 }, (_, k) => high - (k * (high - low)) / 3);
  const path = points.map((point) => `${x(point.index)},${y(point.valor)}`).join(" ");

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="h-auto w-full"
    >
      <title>{label}</title>

      {ticks.map((tick) => (
        <g key={`tick-${tick}`}>
          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="currentColor"
            strokeWidth={1}
            className="text-border/60"
          />
          <text
            x={MARGIN.left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={11}
            className="fill-current text-foreground/45"
          >
            {decimal.format(tick)}
          </text>
        </g>
      ))}

      {path ? (
        <polyline
          points={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {points.map((point) => {
        const cx = x(point.index);
        const cy = y(point.valor);
        const isLast = point === points[points.length - 1];
        const showLabel = points.length <= MAX_VALUE_LABELS || isLast || point === points[0];
        const above = cy - 10 >= MARGIN.top;

        return (
          <g key={`point-${point.index}-${point.fecha}`}>
            <circle cx={cx} cy={cy} r={isLast ? 4.5 : 3.5} fill={color} />
            {showLabel ? (
              <text
                x={cx}
                y={above ? cy - 10 : cy + 16}
                textAnchor="middle"
                fontSize={isLast ? 12 : 10}
                fontWeight={isLast ? 700 : 400}
                className={isLast ? "fill-current text-foreground" : "fill-current text-foreground/55"}
              >
                {`${decimal.format(point.valor)}${isLast ? ` ${unit}` : ""}`}
              </text>
            ) : null}
          </g>
        );
      })}

      {visibleDateGroups(dateGroups(points)).map((group) => (
        <text
          key={`date-${group.center}`}
          x={x(group.center)}
          y={height - MARGIN.bottom + 18}
          textAnchor="middle"
          fontSize={11}
          className="fill-current text-foreground/45"
        >
          {axisDate(group.fecha)}
        </text>
      ))}
    </svg>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <ChartLine className="size-6 text-foreground/30" />
      <p className="text-sm font-medium text-foreground/70">{title}</p>
      <p className="max-w-sm text-xs text-foreground/50">{hint}</p>
    </div>
  );
}

export function GraficaEvolucion({ evolucion }: { evolucion: EvolucionPunto[] }) {
  const measurements = [...evolucion]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .filter((point) => Number.isFinite(point.pesoKg));

  const total = measurements.length;
  const first = measurements[0];
  const last = measurements[total - 1];

  if (total === 0) {
    return (
      <EmptyState
        title="Sin mediciones registradas"
        hint="La gráfica de evolución aparece cuando el paciente tenga al menos dos mediciones de peso."
      />
    );
  }

  if (total === 1) {
    return (
      <EmptyState
        title={`Una sola medición: ${decimal.format(first.pesoKg)} kg`}
        hint={`Registrada el ${longDate.format(new Date(first.fecha))}. Registrá otra para ver la evolución.`}
      />
    );
  }

  const weightPoints = measurements.map((point, index) => ({
    index,
    fecha: point.fecha,
    valor: point.pesoKg,
  }));
  const fatPoints = measurements.flatMap((point, index) =>
    point.pctGrasa === null || !Number.isFinite(point.pctGrasa)
      ? []
      : [{ index, fecha: point.fecha, valor: point.pctGrasa }],
  );

  const range =
    dayKey(first.fecha) === dayKey(last.fecha)
      ? `Mediciones del ${longDate.format(new Date(first.fecha))}`
      : `Del ${longDate.format(new Date(first.fecha))} al ${longDate.format(new Date(last.fecha))}`;

  return (
    <div className="flex flex-col gap-6">
      <figure className="flex flex-col gap-2">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">Peso (kg)</span>
          <span className="text-xs text-foreground/50">{range}</span>
        </figcaption>
        <SeriesChart
          points={weightPoints}
          total={total}
          height={260}
          unit="kg"
          color="var(--brand)"
          label={`Evolución de peso: ${total} mediciones, de ${decimal.format(first.pesoKg)} kg el ${longDate.format(new Date(first.fecha))} a ${decimal.format(last.pesoKg)} kg el ${longDate.format(new Date(last.fecha))}`}
        />
      </figure>

      <figure className="flex flex-col gap-2">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">% de grasa corporal</span>
          <span className="text-xs text-foreground/50">
            {fatPoints.length === 0
              ? "Sin registros de composición"
              : `${fatPoints.length} de ${total} mediciones con composición`}
          </span>
        </figcaption>
        {fatPoints.length >= 2 ? (
          <SeriesChart
            points={fatPoints}
            total={total}
            height={170}
            unit="%"
            color="var(--brand-deep)"
            label={`Evolución del porcentaje de grasa: ${fatPoints.length} mediciones, de ${decimal.format(fatPoints[0].valor)} % a ${decimal.format(fatPoints[fatPoints.length - 1].valor)} %`}
          />
        ) : (
          <EmptyState
            title="Todavía no hay suficientes datos de composición"
            hint="Necesitás al menos dos mediciones con % de grasa para dibujar esta serie."
          />
        )}
      </figure>

      {/* Respaldo textual de la gráfica: los valores no dependen solo del color ni del SVG. */}
      <table className="sr-only">
        <caption>Mediciones registradas</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Peso (kg)</th>
            <th scope="col">% de grasa</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((point, index) => (
            <tr key={`row-${point.fecha}-${index}`}>
              <td>{longDate.format(new Date(point.fecha))}</td>
              <td>{decimal.format(point.pesoKg)}</td>
              <td>{point.pctGrasa === null ? "sin dato" : decimal.format(point.pctGrasa)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
