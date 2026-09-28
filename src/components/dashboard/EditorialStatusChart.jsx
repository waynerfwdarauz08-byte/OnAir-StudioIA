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

const STATUS_CONFIGURATION = [
  {
    status: "draft",
    label: "Borrador",
    shortLabel: "Borrador",
    color: "#64748b",
  },
  {
    status: "review",
    label: "En revisión",
    shortLabel: "Revisión",
    color: "#f59e0b",
  },
  {
    status: "correction",
    label: "En corrección",
    shortLabel: "Corrección",
    color: "#ef4444",
  },
  {
    status: "approved",
    label: "Aprobadas",
    shortLabel: "Aprobadas",
    color: "#22c55e",
  },
];

function ChartTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !Array.isArray(payload) ||
    payload.length === 0
  ) {
    return null;
  }

  const chartItem =
    payload[0]?.payload;

  if (!chartItem) {
    return null;
  }

  return (
    <div className="dashboard-chart-tooltip">
      <span
        className="dashboard-chart-tooltip-dot"
        style={{
          backgroundColor:
            chartItem.color,
        }}
      />

      <div>
        <strong>{chartItem.label}</strong>

        <span>
          {chartItem.value}{" "}
          {chartItem.value === 1
            ? "noticia"
            : "noticias"}
        </span>
      </div>
    </div>
  );
}

function EditorialStatusChart({
  news = [],
}) {
  const chartData =
    STATUS_CONFIGURATION.map(
      (configuration) => ({
        ...configuration,
        value: news.filter(
          (newsItem) =>
            newsItem.editorialStatus ===
            configuration.status
        ).length,
      })
    );

  const maximumValue = Math.max(
    ...chartData.map(
      (chartItem) =>
        chartItem.value
    ),
    1
  );

  return (
    <section
      className="dashboard-chart-card"
      aria-labelledby="editorial-chart-title"
    >
      <header className="dashboard-chart-heading">
        <div>
          <p className="eyebrow">
            MÉTRICAS EDITORIALES
          </p>

          <h2 id="editorial-chart-title">
            Noticias por estado
          </h2>

          <p>
            Distribución actual del contenido
            registrado en la mesa editorial.
          </p>
        </div>

        <div className="dashboard-chart-total">
          <span>TOTAL</span>
          <strong>{news.length}</strong>
        </div>
      </header>

      <div
        className="dashboard-chart-container"
        role="img"
        aria-label={`Gráfico de noticias por estado. ${chartData
          .map(
            (chartItem) =>
              `${chartItem.label}: ${chartItem.value}`
          )
          .join(", ")}.`}
      >
        <ResponsiveContainer
          width="100%"
          height={330}
        >
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
                fill:
                  "rgba(0, 199, 242, 0.05)",
              }}
              content={<ChartTooltip />}
            />

            <Bar
              dataKey="value"
              name="Noticias"
              minPointSize={5}
              radius={[8, 8, 2, 2]}
              maxBarSize={80}
            >
              {chartData.map(
                (chartItem) => (
                  <Cell
                    key={chartItem.status}
                    fill={chartItem.color}
                  />
                )
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="dashboard-chart-legend"
        aria-label="Detalle de estados editoriales"
      >
        {chartData.map((chartItem) => (
          <div
            key={chartItem.status}
            className="dashboard-chart-legend-item"
          >
            <span
              className="dashboard-chart-legend-color"
              style={{
                backgroundColor:
                  chartItem.color,
              }}
              aria-hidden="true"
            />

            <div>
              <span>{chartItem.label}</span>
              <strong>
                {chartItem.value}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EditorialStatusChart;