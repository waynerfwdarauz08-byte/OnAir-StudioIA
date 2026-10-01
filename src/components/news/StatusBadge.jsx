import { getEditorialStatusLabel } from "../../utils/news.js";
import useAccessibility from "../../hooks/useAccessibility.js";

const STATUS_LABELS_EN = {
  draft: "Draft",
  review: "Under review",
  correction: "Needs correction",
  approved: "Approved",
};

function StatusBadge({ status }) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const validStatuses = [
    "draft",
    "review",
    "correction",
    "approved",
  ];

  const safeStatus = validStatuses.includes(status)
    ? status
    : "draft";

  const label = isEnglish
    ? STATUS_LABELS_EN[safeStatus]
    : getEditorialStatusLabel(safeStatus);

  return (
    <span className={`status-badge status-${safeStatus}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export default StatusBadge;