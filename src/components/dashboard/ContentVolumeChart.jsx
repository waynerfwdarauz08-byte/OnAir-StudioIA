import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useAccessibility from "../../hooks/useAccessibility.js";

function getDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(key, language, options) {
  const date = new Date(`${key}T00:00:00.000Z`);

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "es-CR",
    {
      timeZone: "UTC",
      ...options,
    }
  ).format(date);
}

function ContentVolumeTooltip({
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
        ? "news story added"
        : "noticia registrada"
      : language === "en"
        ? "news stories added"
        : "noticias registradas";

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

function ContentVolumeChart({ news = [] }) {
  const {
    language,
    colorVision,
    reduceMotion,
  } = useAccessibility();
  const isEnglish = language === "en";

  const newsDateKeys = news
    .map((newsItem) => getDateKey(newsItem.createdAt))
    .filter(Boolean)
    .sort();

  const hasData = newsDateKeys.length > 0;
  const latestDateKey = hasData
    ? newsDateKeys[newsDateKeys.length - 1]
    : "";
  const latestDate = latestDateKey
    ? new Date(`${latestDateKey}T00:00:00.000Z`)
    : null;

  const chartColor =
    colorVision === "colorblind" ? "#0072b2" : "#00c7f2";

  const chartData = latestDate
    ? Array.from({ length: 7 }, (ignoredValue, index) => {
        const date = new Date(latestDate);

        date.setUTCDate(latestDate.getUTCDate() - 6 + index);

        const dateKey = date.toISOString().slice(0, 10);

        return {
          dateKey,
          shortLabel: formatDate(dateKey, language, {
            month: "short",
            day: "numeric",
          }),
          label: formatDate(dateKey, language, {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          value: newsDateKeys.filter(
            (newsDateKey) => newsDateKey === dateKey
          ).length,
          color: chartColor,
        };
      })
    : [];

  const totalInPeriod = chartData.reduce(
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
      className="dashboard-chart-card dashboard-chart-card-compact"
      aria-labelledby="content-volume-chart-title"
    >
      <header className="dashboard-chart-heading">
        <div>
          <p className="eyebrow">
            {isEnglish
              ? "EDITORIAL PACE"
              : "RITMO EDITORIAL"}
          </p>

          <h2 id="content-volume-chart-title">
            {isEnglish
              ? "News intake over 7 days"
              : "Ingreso de noticias en 7 d\u00edas"}
          </h2>

          <p>
            {isEnglish
              ? "Daily volume ending on the most recent registered story."
              : "Volumen diario hasta la noticia registrada m\u00e1s reciente."}
          </p>
        </div>

        <div className="dashboard-chart-total">
          <span>
            {isEnglish ? "7 DAYS" : "7 D\u00cdAS"}
          </span>
          <strong>{totalInPeriod}</strong>
        </div>
      </header>

      {hasData ? (
        <div
          className="dashboard-chart-container"
          role="img"
          aria-label={
            isEnglish
              ? `Seven-day news intake chart. ${accessibleChartDescription}.`
              : `Gr\u00e1fico de ingreso de noticias de siete d\u00edas. ${accessibleChartDescription}.`
          }
        >
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 12,
                bottom: 10,
                left: -10,
              }}
              accessibilityLayer
            >
              <defs>
                <linearGradient
                  id="content-volume-gradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={chartColor}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartColor}
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>

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
                  fontSize: 11,
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
                  stroke: chartColor,
                  strokeDasharray: "4 4",
                }}
                content={
                  <ContentVolumeTooltip language={language} />
                }
              />

              <Area
                type="monotone"
                dataKey="value"
                name={
                  isEnglish ? "News stories" : "Noticias"
                }
                stroke={chartColor}
                strokeWidth={3}
                fill="url(#content-volume-gradient)"
                activeDot={{ r: 5 }}
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="dashboard-chart-empty" role="status">
          {isEnglish
            ? "There are no dated news stories to show yet."
            : "A\u00fan no hay noticias con fecha para mostrar."}
        </p>
      )}
    </section>
  );
}

export default ContentVolumeChart;
