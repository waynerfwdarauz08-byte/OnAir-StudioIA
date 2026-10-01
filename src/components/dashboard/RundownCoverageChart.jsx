import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useAccessibility from "../../hooks/useAccessibility.js";

function getDateKey(value) {
  if (!value) {
    return "";
  }

  const date = new Date(
    String(value).includes("T")
      ? value
      : `${value}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(key, language, options) {
  if (!key) {
    return language === "en" ? "No date" : "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "es-CR",
    {
      timeZone: "UTC",
      ...options,
    }
  ).format(new Date(`${key}T00:00:00.000Z`));
}

function RundownCoverageTooltip({
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
        ? "scheduled story"
        : "noticia programada"
      : language === "en"
        ? "scheduled stories"
        : "noticias programadas";

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

function RundownCoverageChart({ rundowns = [] }) {
  const {
    language,
    colorVision,
    reduceMotion,
  } = useAccessibility();
  const isEnglish = language === "en";
  const chartColor =
    colorVision === "colorblind" ? "#e69f00" : "#8b5cf6";

  const chartData = rundowns
    .map((rundown) => {
      const dateKey = getDateKey(rundown.broadcastDate);

      return {
        id: rundown.id,
        dateKey,
        sortKey: dateKey || "0000-00-00",
        shortLabel: formatDate(dateKey, language, {
          month: "short",
          day: "numeric",
        }),
        label: formatDate(dateKey, language, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        value: Array.isArray(rundown.newsIds)
          ? rundown.newsIds.length
          : 0,
        color: chartColor,
      };
    })
    .sort((firstItem, secondItem) =>
      firstItem.sortKey.localeCompare(secondItem.sortKey)
    )
    .slice(-6);

  const totalStories = chartData.reduce(
    (total, chartItem) => total + chartItem.value,
    0
  );
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
      aria-labelledby="rundown-coverage-chart-title"
    >
      <header className="dashboard-chart-heading">
        <div>
          <p className="eyebrow">
            {isEnglish ? "PROGRAMMING" : "PROGRAMACI\u00d3N"}
          </p>

          <h2 id="rundown-coverage-chart-title">
            {isEnglish
              ? "Rundown coverage"
              : "Cobertura de escaletas"}
          </h2>

          <p>
            {isEnglish
              ? "Stories scheduled in each of the six most recent rundowns."
              : "Noticias programadas en cada una de las seis escaletas m\u00e1s recientes."}
          </p>
        </div>

        <div className="dashboard-chart-total">
          <span>{isEnglish ? "STORIES" : "NOTICIAS"}</span>
          <strong>{totalStories}</strong>
        </div>
      </header>

      {chartData.length > 0 ? (
        <div
          className="dashboard-chart-container"
          role="img"
          aria-label={
            isEnglish
              ? `Rundown coverage chart. ${accessibleChartDescription}.`
              : `Gr\u00e1fico de cobertura de escaletas. ${accessibleChartDescription}.`
          }
        >
          <ResponsiveContainer width="100%" height={310}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 12,
                bottom: 10,
                left: -10,
              }}
              accessibilityLayer
            >
              <CartesianGrid
                stroke="var(--tone-26344c)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="shortLabel"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--tone-94a3b8)",
                  fontSize: 12,
                }}
              />

              <YAxis
                allowDecimals={false}
                domain={[0, maximumValue]}
                axisLine={false}
                tickLine={false}
                width={34}
                tick={{
                  fill: "var(--tone-64748b)",
                  fontSize: 12,
                }}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(139, 92, 246, 0.08)",
                }}
                content={
                  <RundownCoverageTooltip language={language} />
                }
              />

              <Bar
                dataKey="value"
                name={
                  isEnglish
                    ? "Scheduled stories"
                    : "Noticias programadas"
                }
                fill={chartColor}
                minPointSize={5}
                radius={[8, 8, 2, 2]}
                maxBarSize={70}
                isAnimationActive={!reduceMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="dashboard-chart-empty" role="status">
          {isEnglish
            ? "There are no rundowns to show yet."
            : "A\u00fan no hay escaletas para mostrar."}
        </p>
      )}
    </section>
  );
}

export default RundownCoverageChart;
