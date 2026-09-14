import { relativeDate } from "../utils";

const DISTRIBUTION_STALE_DAYS = 2; // plans are meant to be published daily

export default function DistributionStatus({ activeDistribution, loading }) {
  if (loading) return null;

  if (!activeDistribution) {
    return (
      <div className="distribution-status distribution-status-warning">
        ⚠ No allocation plan has been published yet.
      </div>
    );
  }

  const days = (Date.now() - new Date(activeDistribution.publishedAt).getTime()) / 86400000;
  const isStale = days > DISTRIBUTION_STALE_DAYS;

  return (
    <div className={`distribution-status ${isStale ? "distribution-status-warning" : "distribution-status-ok"}`}>
      {isStale && "⚠ "}
      {activeDistribution.title || "Active allocation plan"} — published {relativeDate(activeDistribution.publishedAt)}
      {isStale && " — may be overdue for an update"}
    </div>
  );
}