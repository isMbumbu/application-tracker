import type { WorkflowStatus } from '../types'

interface StatusSummaryProps {
  total: number
  counts: Record<WorkflowStatus, number>
}

function StatusSummary({
  total,
  counts,
}: Readonly<StatusSummaryProps>) {
  return (
    <div
      className="status-summary"
      aria-label="Application status counts"
    >
      <span>All {total}</span>
      <span>Draft {counts.Draft}</span>
      <span>Submitted {counts.Submitted}</span>
      <span>Review {counts['Under Review']}</span>
      <span>
        Needs info {counts['Need More Information']}
      </span>
      <span>
        Done {counts.Approved + counts.Rejected}
      </span>
    </div>
  )
}

export default StatusSummary