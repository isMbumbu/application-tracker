import DetailItem from './DetailItem'
import ReviewerDecisionForm from './ReviewerDecisionForm'
import StatusBadge from './StatusBadge'

import type {
  Application,
  ReviewerDecisionData,
} from '../types'

interface ApplicationDetailProps {
  application: Application
  isSaving: boolean
  onBack: () => void
  onEdit: () => void
  onSubmit: () => void
  onStartReview: () => void
  onDecision: (
    payload: ReviewerDecisionData,
  ) => Promise<void>

  formatDate: (value: string | null) => string
}

function ApplicationDetail({
  application,
  isSaving,
  onBack,
  onEdit,
  onSubmit,
  onStartReview,
  onDecision,
  formatDate,
}: Readonly<ApplicationDetailProps>) {
  const canEdit =
    application.status === 'Draft' ||
    application.status ===
      'Need More Information'

  const canSubmit = canEdit

  const canStartReview =
    application.status === 'Submitted'

  const canRecordDecision =
    application.status === 'Under Review'

  return (
    <section className="detail-layout">
      <div className="detail-heading">
        <button
          className="ghost-button"
          type="button"
          onClick={onBack}
        >
          Back to list
        </button>

        <div>
          <p className="eyebrow">
            {application.tracking_number}
          </p>

          <h2>{application.company_name}</h2>
        </div>

        <StatusBadge
          status={application.status}
        />
      </div>

      <div
        className="action-bar"
        aria-label="Available actions"
      >
        {canEdit ? (
          <button
            className="secondary-button"
            type="button"
            disabled={isSaving}
            onClick={onEdit}
          >
            Edit
          </button>
        ) : null}

        {canSubmit ? (
          <button
            className="primary-button"
            type="button"
            disabled={isSaving}
            onClick={onSubmit}
          >
            {application.status ===
            'Need More Information'
              ? 'Resubmit'
              : 'Submit'}
          </button>
        ) : null}

        {canStartReview ? (
          <button
            className="primary-button"
            type="button"
            disabled={isSaving}
            onClick={onStartReview}
          >
            Start review
          </button>
        ) : null}
      </div>

      <div className="detail-grid">
        <DetailItem
          label="Applicant"
          value={application.applicant_name}
        />

        <DetailItem
          label="Email"
          value={application.applicant_email}
        />

        <DetailItem
          label="Application type"
          value={application.application_type}
        />

        <DetailItem
          label="Created"
          value={formatDate(
            application.created_at,
          )}
        />

        <DetailItem
          label="Updated"
          value={formatDate(
            application.updated_at,
          )}
        />

        <DetailItem
          label="Submitted"
          value={formatDate(
            application.submitted_at,
          )}
        />

        <DetailItem
          label="Reviewed"
          value={formatDate(
            application.reviewed_at,
          )}
        />
      </div>

      <section className="panel">
        <h3>Description</h3>

        <p className="pre-wrap">
          {application.description}
        </p>
      </section>

      {application.reviewer_comment ? (
        <section className="panel">
          <h3>Reviewer comment</h3>

          <p className="pre-wrap">
            {application.reviewer_comment}
          </p>
        </section>
      ) : null}

      {canRecordDecision ? (
        <ReviewerDecisionForm
          isSaving={isSaving}
          onDecision={onDecision}
        />
      ) : null}
    </section>
  )
}

export default ApplicationDetail