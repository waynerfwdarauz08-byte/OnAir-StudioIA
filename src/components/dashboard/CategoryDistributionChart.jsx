import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import useAccessibility from "../../hooks/useAccessibility.js";

const STANDARD_COLORS = [
  "#00c7f2",
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#64748b",
];

const COLORBLIND_FRIENDLY_COLORS = [
  "#0072b2",
  "#e69f00",
  "#009e73",
  "#cc79a7",
  "#56b4e9",
  "#999999",
];

function CategoryTooltip({
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

function CategoryDistributionChart({
  news = [],
  categories = [],
}) {
  const {
    language,
    colorVision,
    reduceMotion,
  } = useAccessibility();
  const isEnglish = language === "en";

  const categoryNames = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ])
  );

  const totalsByCategory = news.reduce(
    (totals, newsItem) => {
      const categoryId = newsItem.categoryId || "unassigned";

      totals.set(
        categoryId,
        (totals.get(categoryId) || 0) + 1
      );

      return totals;
    },
    new Map()
  );

  const colors =
    colorVision === "colorblind"
      ? COLORBLIND_FRIENDLY_COLORS
      : STANDARD_COLORS;

  const chartData = Array.from(
    totalsByCategory.entries()
  )
    .map(([categoryId, value], index) => ({
      categoryId,
      label:
        categoryNames.get(categoryId) ||
        (isEnglish ? "Unassigned" : "Sin categor\u00eda"),
      value,
      color: colors[index % colors.length],
    }))
    .sort((firstItem, secondItem) =>
      secondItem.value - firstItem.value
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
      aria-labelledby="category-chart-title"
    >
      <header className="dashboard-chart-heading">
        <div>
          <p className="eyebrow">
            {isEnglish
              ? "CONTENT MIX"
              : "DISTRIBUCI\u00d3N DE CONTENIDO"}
          </p>

          <h2 id="category-chart-title">
            {isEnglish
              ? "News by category"
              : "Noticias por categor\u00eda"}
          </h2>

          <p>
            {isEnglish
              ? "The editorial topics currently represented in the newsroom."
              : "Los temas editoriales presentes actualmente en la sala de redacci\u00f3n."}
          </p>
        </div>

        <div className="dashboard-chart-total">
          <span>{isEnglish ? "TOTAL" : "TOTAL"}</span>
          <strong>{news.length}</strong>
        </div>
      </header>

      {chartData.length > 0 ? (
        <>
          <div
            className="dashboard-chart-container dashboard-chart-container-pie"
            role="img"
            aria-label={
              isEnglish
                ? `News by category chart. ${accessibleChartDescription}.`
                : `Gr\u00e1fico de noticias por categor\u00eda. ${accessibleChartDescription}.`
            }
          >
            <ResponsiveContainer width="100%" height={310}>
              <PieChart>
                <Tooltip
                  content={
                    <CategoryTooltip language={language} />
                  }
                />

                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={63}
                  outerRadius={105}
                  paddingAngle={4}
                  stroke="var(--tone-0a0f1d)"
                  strokeWidth={3}
                  isAnimationActive={!reduceMotion}
                >
                  {chartData.map((chartItem) => (
                    <Cell
                      key={chartItem.categoryId}
                      fill={chartItem.color}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div
              className="dashboard-chart-donut-total"
              aria-hidden="true"
            >
              <strong>{news.length}</strong>
              <span>{isEnglish ? "TOTAL" : "TOTAL"}</span>
            </div>
          </div>

          <div
            className="dashboard-chart-legend"
            aria-label={
              isEnglish
                ? "Category details"
                : "Detalle por categor\u00eda"
            }
          >
            {chartData.map((chartItem) => (
              <div
                key={chartItem.categoryId}
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
        </>
      ) : (
        <p className="dashboard-chart-empty" role="status">
          {isEnglish
            ? "There are no news stories to group by category yet."
            : "A\u00fan no hay noticias para agrupar por categor\u00eda."}
        </p>
      )}
    </section>
  );
}

export default CategoryDistributionChart;
