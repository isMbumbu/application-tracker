import StatusBadge from './StatusBadge'
import StatusSummary from './StatusSummary'

import type {
  Application,
  WorkflowStatus,
} from '../types'

interface ApplicationListProps {
  applications: Application[]
  counts: Record<WorkflowStatus, number>
  isLoading: boolean
  isSaving: boolean
  onOpen: (applicationId: number) => void
  formatDate: (value: string | null) => string
}

function ApplicationList({
  applications,
  counts,
  isLoading,
  isSaving,
  onOpen,
  formatDate,
}: Readonly<ApplicationListProps>) {
  return (
    <section className="panel">
      <StatusSummary
        total={applications.length}
        counts={counts}
      />

      {isLoading ? (
        <p className="muted">
          Loading applications...
        </p>
      ) : null}

      {!isLoading &&
      applications.length === 0 ? (
        <div className="empty-state">
          <h2>No applications yet</h2>

          <p>
            Start by creating the first draft.
          </p>
        </div>
      ) : null}

      {applications.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking number</th>
                <th>Applicant</th>
                <th>Company</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>

                <th>
                  <span className="sr-only">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="tracking">
                    {application.tracking_number}
                  </td>

                  <td>
                    {application.applicant_name}
                  </td>

                  <td>
                    {application.company_name}
                  </td>

                  <td>
                    {application.application_type}
                  </td>

                  <td>
                    <StatusBadge
                      status={application.status}
                    />
                  </td>

                  <td>
                    {formatDate(
                      application.created_at,
                    )}
                  </td>

                  <td>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        onOpen(application.id)
                      }
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default ApplicationList