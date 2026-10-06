import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useAccessibility from "../../hooks/useAccessibility.js";

const STATUS_LABELS = {
  es: {
    draft: {
      label: "Borrador",
      shortLabel: "Borrador",
    },
    review: {
      label: "En revisión",
      shortLabel: "Revisión",
    },
    correction: {
      label: "En corrección",
      shortLabel: "Corrección",
    },
    approved: {
      label: "Aprobadas",
      shortLabel: "Aprobadas",
    },
  },
  en: {
    draft: {
      label: "Draft",
      shortLabel: "Draft",
    },
    review: {
      label: "Under review",
      shortLabel: "Review",
    },
    correction: {
      label: "Needs correction",
      shortLabel: "Correction",
    },
    approved: {
      label: "Approved",
      shortLabel: "Approved",
    },
  },
};

const STANDARD_COLORS = {
  draft: "var(--dashboard-muted, #64748b)",
  review: "var(--dashboard-warning, #f59e0b)",
  correction: "var(--dashboard-danger, #ef4444)",
  approved: "var(--dashboard-success, #22c55e)",
};

const COLORBLIND_FRIENDLY_COLORS = {
  draft: "#64748b",
  review: "#e69f00",
  correction: "#0072b2",
  approved: "#009e73",
};

function ChartTooltip({
  active,
  payload,
  language,
}) {
  if (
    !active ||
    !Array.isArray(payload) ||
    payload.length === 0
  ) {
    return null;
  }

  const chartItem = payload[0]?.payload;

  if (!chartItem) {
    return null;
  }

  const itemLabel =
    chartItem.value === 1
      ? language === "en"
        ? "news story"
        : "noticia"
      : language === "en"
        ? "news stories"
        : "noticias";

  return (
    <div className="dashboard-chart-tooltip">
      <span
        className="dashboard-chart-tooltip-dot"
        style={{ backgroundColor: chartItem.color }}
      />

      <div>
        <strong>{chartItem.label}</strong>

        <span>
          {chartItem.value} {itemLabel}
        </span>
      </div>
    </div>
  );
}

function EditorialStatusChart({ news = [] }) {
  const { language, colorVision, reduceMotion } = useAccessibility();
  const isEnglish = language === "en";
  const labels = STATUS_LABELS[isEnglish ? "en" : "es"];

  const colors =
    colorVision === "colorblind"
      ? COLORBLIND_FRIENDLY_COLORS
      : STANDARD_COLORS;

  const chartData = Object.keys(labels).map((status) => ({
    status,
    ...labels[status],
    color: colors[status],
    value: news.filter(
      (newsItem) => newsItem.editorialStatus === status
    ).length,
  }));

  const maximumValue = Math.max(
    ...chartData.map((chartItem) => chartItem.value),
    1
  );

  const accessibleChartDescription = chartData
    .map(
      (chartItem) =>
        `${chartItem.label}: ${chartItem.value}`
    )
    .join(", ");

  return (
    <section
      className="dashboard-chart-card"
      aria-labelledby="editorial-chart-title"
    >
      <header className="dashboard-chart-heading">
        <div>
          <p className="eyebrow">
            {isEnglish ? "EDITORIAL METRICS" : "MÉTRICAS EDITORIALES"}
          </p>

          <h2 id="editorial-chart-title">
            {isEnglish
              ? "News by status"
              : "Noticias por estado"}
          </h2>

          <p>
            {isEnglish
              ? "Current distribution of content in the newsroom."
              : "Distribución actual del contenido registrado en la mesa editorial."}
          </p>
        </div>

        <div className="dashboard-chart-total">
          <span>{isEnglish ? "TOTAL" : "TOTAL"}</span>
          <strong>{news.length}</strong>
        </div>
      </header>

      <div
        className="dashboard-chart-container"
        role="img"
        aria-label={
          isEnglish
            ? `News by status chart. ${accessibleChartDescription}.`
            : `Gráfico de noticias por estado. ${accessibleChartDescription}.`
        }
      >
        <ResponsiveContainer width="100%" height={330}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              bottom: 10,
              left: -10,
            }}
            accessibilityLayer
          >
            <CartesianGrid
              stroke="#263449"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="shortLabel"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 12,
              }}
            />

            <YAxis
              allowDecimals={false}
              domain={[0, maximumValue]}
              axisLine={false}
              tickLine={false}
              width={40}
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
            />

            <Tooltip
              cursor={{
                fill: "rgba(0, 199, 242, 0.05)",
              }}
              content={
                <ChartTooltip language={language} />
              }
            />

            <Bar
              dataKey="value"
              name={isEnglish ? "News" : "Noticias"}
              minPointSize={5}
              radius={[8, 8, 2, 2]}
              maxBarSize={80}
            isAnimationActive={!reduceMotion}
            animationDuration={1100}
            animationEasing="ease-out"
            activeBar={{ filter: "brightness(1.2)" }}
            >
              {chartData.map((chartItem) => (
                <Cell
                  key={chartItem.status}
                  fill={chartItem.color}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="dashboard-chart-legend"
        aria-label={
          isEnglish
            ? "Editorial status details"
            : "Detalle de estados editoriales"
        }
      >
        {chartData.map((chartItem) => (
          <div
            key={chartItem.status}
            className="dashboard-chart-legend-item"
          >
            <span
              className="dashboard-chart-legend-color"
              style={{ backgroundColor: chartItem.color }}
              aria-hidden="true"
            />

            <div>
              <span>{chartItem.label}</span>
              <strong>{chartItem.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EditorialStatusChart;
