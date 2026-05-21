import type { WorkflowStatus } from '../types'

interface StatusBadgeProps {
  status: WorkflowStatus
}

function statusClassName(status: WorkflowStatus): string {
  return `status-badge status-${status
    .toLowerCase()
    .replace(/\s+/g, '-')}`
}

function StatusBadge({
  status,
}: Readonly<StatusBadgeProps>) {
  return (
    <span className={statusClassName(status)}>
      {status}
    </span>
  )
}

export default StatusBadge