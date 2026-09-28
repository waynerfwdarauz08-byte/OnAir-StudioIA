import { getEditorialStatusLabel } from "../../utils/news.js";

function StatusBadge({ status }) {
  const validStatuses = [
    "draft",
    "review",
    "correction",
    "approved",
  ];

  const safeStatus = validStatuses.includes(status)
    ? status
    : "draft";

  return (
    <span className={`status-badge status-${safeStatus}`}>
      <span className="status-dot" aria-hidden="true" />
      {getEditorialStatusLabel(status)}
    </span>
  );
}

export default StatusBadge;