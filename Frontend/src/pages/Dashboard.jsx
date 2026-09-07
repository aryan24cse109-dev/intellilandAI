import PageHeader from "../components/layout/PageHeader";

import StatCard from "../components/dashboard/StatCard";
import WorkflowCard from "../components/dashboard/WorkflowCard";
import RecentDocuments from "../components/dashboard/RecentDocuments";

import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

import useDashboard from "../hooks/useDashboard";

import { formatNumber } from "../utils/formatters";

function getStat(stats, keys, fallback = 0) {
  if (!stats) {
    return fallback;
  }

  for (const key of keys) {
    if (
      stats[key] !== undefined &&
      stats[key] !== null
    ) {
      return stats[key];
    }
  }

  return fallback;
}

function Dashboard() {
  const {
    stats,
    documents,
    loading,
    error,
    refresh,
  } = useDashboard();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader
          size="large"
          text="Loading dashboard..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-page">
        <PageHeader
          title="Dashboard"
          description="Intelligent land-record processing overview"
        />

        <ErrorMessage
          title="Unable to load dashboard"
          message={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  const totalDocuments = getStat(
    stats,
    [
      "total_documents",
      "totalDocuments",
      "documents",
    ]
  );

  const processedDocuments = getStat(
    stats,
    [
      "processed_documents",
      "processedDocuments",
      "completed_documents",
      "completedDocuments",
    ]
  );

  const pendingDocuments = getStat(
    stats,
    [
      "pending_documents",
      "pendingDocuments",
      "uploaded_documents",
      "uploadedDocuments",
    ]
  );

  const reviewDocuments = getStat(
    stats,
    [
      "needs_review",
      "needsReview",
      "review_required",
      "reviewRequired",
    ]
  );

  const failedDocuments = getStat(
    stats,
    [
      "failed_documents",
      "failedDocuments",
    ]
  );

  const landRecords = getStat(
    stats,
    [
      "total_land_records",
      "totalLandRecords",
      "land_records",
      "landRecords",
    ]
  );

  const validationMatches = getStat(
    stats,
    [
      "validation_matches",
      "validationMatches",
      "matched_validations",
    ]
  );

  return (
    <div className="content-page dashboard-page">
      <PageHeader
        title="Dashboard"
        description="Intelligent land-record digitization, validation and parcel-linking overview"
        actions={
          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={refresh}
          >
            ↻ Refresh
          </button>
        }
      />

      {/* Statistics */}
      <section className="dashboard-stats-grid">
        <StatCard
          title="Total Documents"
          value={formatNumber(totalDocuments)}
          subtitle="All uploaded records"
          icon="▤"
          variant="primary"
        />

        <StatCard
          title="Processed"
          value={formatNumber(processedDocuments)}
          subtitle="Successfully processed"
          icon="✓"
          variant="success"
        />

        <StatCard
          title="Needs Review"
          value={formatNumber(reviewDocuments)}
          subtitle="Officer attention required"
          icon="!"
          variant="warning"
        />

        <StatCard
          title="Failed"
          value={formatNumber(failedDocuments)}
          subtitle="Processing failures"
          icon="×"
          variant="danger"
        />
      </section>

      {/* Secondary statistics */}
      <section className="dashboard-secondary-stats">
        <div className="dashboard-mini-stat">
          <span>Pending Processing</span>
          <strong>
            {formatNumber(pendingDocuments)}
          </strong>
        </div>

        <div className="dashboard-mini-stat">
          <span>Land Records</span>
          <strong>
            {formatNumber(landRecords)}
          </strong>
        </div>

        <div className="dashboard-mini-stat">
          <span>Validation Matches</span>
          <strong>
            {formatNumber(validationMatches)}
          </strong>
        </div>
      </section>

      {/* Workflow */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Land Record Workflow</h2>
            <p>
              Track documents through the digitization
              and verification pipeline.
            </p>
          </div>
        </div>

        <div className="workflow-grid">
          <WorkflowCard
            step="01"
            icon="↑"
            title="Upload"
            description="Upload scanned land records and legacy documents."
            count={pendingDocuments}
            status="normal"
            path="/documents/upload"
          />

          <WorkflowCard
            step="02"
            icon="AI"
            title="AI Processing"
            description="OCR, document understanding and structured extraction."
            count={processedDocuments}
            status="success"
            path="/documents"
          />

          <WorkflowCard
            step="03"
            icon="✓"
            title="Validation"
            description="Compare extracted information with reference records."
            count={validationMatches}
            status="success"
            path="/validation"
          />

          <WorkflowCard
            step="04"
            icon="!"
            title="Human Review"
            description="Officer verifies low-confidence or disputed records."
            count={reviewDocuments}
            status="warning"
            path="/validation"
          />
        </div>
      </section>

      {/* Recent documents */}
      <section className="dashboard-section">
        <RecentDocuments
          documents={documents}
          loading={false}
        />
      </section>
    </div>
  );
}

export default Dashboard;