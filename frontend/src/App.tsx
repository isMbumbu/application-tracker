import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createApplication,
  getApplication,
  listApplications,
  recordDecision,
  startReview,
  submitApplication,
  updateApplication,
} from './api'
import {
  APPLICATION_TYPES,
  DECISION_STATUSES,
  EMPTY_APPLICATION_FORM,
} from './types'
import type {
  Application,
  ApplicationFormData,
  ReviewerDecisionData,
  ReviewerDecisionStatus,
  WorkflowStatus,
} from './types'

type ViewMode = 'list' | 'create' | 'detail' | 'edit'

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusClassName(status: WorkflowStatus): string {
  return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

function App() {
  const [applications, setApplications] = useState<Application[]>([])
  const [activeApplication, setActiveApplication] =
    useState<Application | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const counts = useMemo(() => {
    return applications.reduce<Record<WorkflowStatus, number>>(
      (currentCounts, application) => ({
        ...currentCounts,
        [application.status]: currentCounts[application.status] + 1,
      }),
      {
        Draft: 0,
        Submitted: 0,
        'Under Review': 0,
        'Need More Information': 0,
        Approved: 0,
        Rejected: 0,
      },
    )
  }, [applications])

  async function refreshApplications(): Promise<void> {
    setIsLoading(true)
    try {
      setApplications(await listApplications())
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not load applications.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshApplications()
  }, [])

  async function openDetail(applicationId: number): Promise<void> {
    setIsSaving(true)
    setNotice(null)
    try {
      setActiveApplication(await getApplication(applicationId))
      setViewMode('detail')
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not open application.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function runWorkflowAction(
    action: () => Promise<Application>,
    successMessage: string,
  ): Promise<void> {
    setIsSaving(true)
    setNotice(null)
    try {
      const updatedApplication = await action()
      setActiveApplication(updatedApplication)
      await refreshApplications()
      setNotice(successMessage)
      setError(null)
      setViewMode('detail')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Workflow action failed.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreate(payload: ApplicationFormData): Promise<void> {
    await runWorkflowAction(
      async () => createApplication(payload),
      'Draft created.',
    )
  }

  async function handleUpdate(payload: ApplicationFormData): Promise<void> {
    if (!activeApplication) {
      return
    }

    await runWorkflowAction(
      async () => updateApplication(activeApplication.id, payload),
      'Application updated.',
    )
  }

  function showList(): void {
    setViewMode('list')
    setActiveApplication(null)
    setNotice(null)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Application Workflow</p>
          <h1>Mini workflow tracker</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setActiveApplication(null)
            setNotice(null)
            setViewMode('create')
          }}
        >
          New draft
        </button>
      </header>

      {error ? <p className="alert alert-error">{error}</p> : null}
      {notice ? <p className="alert alert-success">{notice}</p> : null}

      {viewMode === 'list' ? (
        <ApplicationList
          applications={applications}
          counts={counts}
          isLoading={isLoading}
          isSaving={isSaving}
          onOpen={(applicationId) => {
            void openDetail(applicationId)
          }}
        />
      ) : null}

      {viewMode === 'create' ? (
        <ApplicationForm
          title="Create draft"
          submitLabel="Save draft"
          initialValue={EMPTY_APPLICATION_FORM}
          isSaving={isSaving}
          onCancel={showList}
          onSave={handleCreate}
        />
      ) : null}

      {viewMode === 'edit' && activeApplication ? (
        <ApplicationForm
          title="Edit application"
          submitLabel="Save changes"
          initialValue={activeApplication}
          isSaving={isSaving}
          onCancel={() => setViewMode('detail')}
          onSave={handleUpdate}
        />
      ) : null}

      {viewMode === 'detail' && activeApplication ? (
        <ApplicationDetail
          application={activeApplication}
          isSaving={isSaving}
          onBack={showList}
          onEdit={() => setViewMode('edit')}
          onSubmit={() => {
            void runWorkflowAction(
              async () => submitApplication(activeApplication.id),
              activeApplication.status === 'Need More Information'
                ? 'Application resubmitted.'
                : 'Application submitted.',
            )
          }}
          onStartReview={() => {
            void runWorkflowAction(
              async () => startReview(activeApplication.id),
              'Review started.',
            )
          }}
          onDecision={(payload) =>
            runWorkflowAction(
              async () => recordDecision(activeApplication.id, payload),
              'Reviewer decision recorded.',
            )
          }
        />
      ) : null}
    </main>
  )
}

interface ApplicationListProps {
  applications: Application[]
  counts: Record<WorkflowStatus, number>
  isLoading: boolean
  isSaving: boolean
  onOpen: (applicationId: number) => void
}

function ApplicationList({
  applications,
  counts,
  isLoading,
  isSaving,
  onOpen,
}: ApplicationListProps) {
  return (
    <section className="panel">
      <div className="status-summary" aria-label="Application status counts">
        <span>All {applications.length}</span>
        <span>Draft {counts.Draft}</span>
        <span>Submitted {counts.Submitted}</span>
        <span>Review {counts['Under Review']}</span>
        <span>Needs info {counts['Need More Information']}</span>
        <span>Done {counts.Approved + counts.Rejected}</span>
      </div>

      {isLoading ? <p className="muted">Loading applications...</p> : null}

      {!isLoading && applications.length === 0 ? (
        <div className="empty-state">
          <h2>No applications yet</h2>
          <p>Start by creating the first draft.</p>
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
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="tracking">{application.tracking_number}</td>
                  <td>{application.applicant_name}</td>
                  <td>{application.company_name}</td>
                  <td>{application.application_type}</td>
                  <td>
                    <StatusBadge status={application.status} />
                  </td>
                  <td>{formatDate(application.created_at)}</td>
                  <td>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => onOpen(application.id)}
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

interface ApplicationDetailProps {
  application: Application
  isSaving: boolean
  onBack: () => void
  onEdit: () => void
  onSubmit: () => void
  onStartReview: () => void
  onDecision: (payload: ReviewerDecisionData) => Promise<void>
}

function ApplicationDetail({
  application,
  isSaving,
  onBack,
  onEdit,
  onSubmit,
  onStartReview,
  onDecision,
}: ApplicationDetailProps) {
  const canEdit =
    application.status === 'Draft' ||
    application.status === 'Need More Information'
  const canSubmit = canEdit
  const canStartReview = application.status === 'Submitted'
  const canRecordDecision = application.status === 'Under Review'

  return (
    <section className="detail-layout">
      <div className="detail-heading">
        <button className="ghost-button" type="button" onClick={onBack}>
          Back to list
        </button>
        <div>
          <p className="eyebrow">{application.tracking_number}</p>
          <h2>{application.company_name}</h2>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="action-bar" aria-label="Available actions">
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
            {application.status === 'Need More Information'
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
        <DetailItem label="Applicant" value={application.applicant_name} />
        <DetailItem label="Email" value={application.applicant_email} />
        <DetailItem label="Application type" value={application.application_type} />
        <DetailItem label="Created" value={formatDate(application.created_at)} />
        <DetailItem label="Updated" value={formatDate(application.updated_at)} />
        <DetailItem label="Submitted" value={formatDate(application.submitted_at)} />
        <DetailItem label="Reviewed" value={formatDate(application.reviewed_at)} />
      </div>

      <section className="panel">
        <h3>Description</h3>
        <p className="pre-wrap">{application.description}</p>
      </section>

      {application.reviewer_comment ? (
        <section className="panel">
          <h3>Reviewer comment</h3>
          <p className="pre-wrap">{application.reviewer_comment}</p>
        </section>
      ) : null}

      {canRecordDecision ? (
        <ReviewerDecisionForm isSaving={isSaving} onDecision={onDecision} />
      ) : null}
    </section>
  )
}

interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

interface ApplicationFormProps {
  title: string
  submitLabel: string
  initialValue: ApplicationFormData
  isSaving: boolean
  onCancel: () => void
  onSave: (payload: ApplicationFormData) => Promise<void>
}

function ApplicationForm({
  title,
  submitLabel,
  initialValue,
  isSaving,
  onCancel,
  onSave,
}: ApplicationFormProps) {
  const [formData, setFormData] =
    useState<ApplicationFormData>(initialValue)

  function updateField<Field extends keyof ApplicationFormData>(
    field: Field,
    value: ApplicationFormData[Field],
  ): void {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void onSave(formData)
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="form-heading">
        <h2>{title}</h2>
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="form-grid">
        <label>
          <span>Applicant name</span>
          <input
            required
            value={formData.applicant_name}
            onChange={(event) =>
              updateField('applicant_name', event.target.value)
            }
          />
        </label>

        <label>
          <span>Applicant email</span>
          <input
            required
            type="email"
            value={formData.applicant_email}
            onChange={(event) =>
              updateField('applicant_email', event.target.value)
            }
          />
        </label>

        <label>
          <span>Company name</span>
          <input
            required
            value={formData.company_name}
            onChange={(event) =>
              updateField('company_name', event.target.value)
            }
          />
        </label>

        <label>
          <span>Application type</span>
          <select
            value={formData.application_type}
            onChange={(event) =>
              updateField(
                'application_type',
                event.target.value as ApplicationFormData['application_type'],
              )
            }
          >
            {APPLICATION_TYPES.map((applicationType) => (
              <option key={applicationType} value={applicationType}>
                {applicationType}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea
          required
          rows={7}
          value={formData.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSaving}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

interface ReviewerDecisionFormProps {
  isSaving: boolean
  onDecision: (payload: ReviewerDecisionData) => Promise<void>
}

function ReviewerDecisionForm({
  isSaving,
  onDecision,
}: ReviewerDecisionFormProps) {
  const [status, setStatus] = useState<ReviewerDecisionStatus>('Approved')
  const [reviewerComment, setReviewerComment] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (status !== 'Approved' && reviewerComment.trim().length === 0) {
      setLocalError(
        'Comment is required for Need More Information or Rejected.',
      )
      return
    }

    setLocalError(null)
    void onDecision({
      status,
      reviewer_comment: reviewerComment,
    })
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <h3>Reviewer decision</h3>

      {localError ? <p className="alert alert-error">{localError}</p> : null}

      <label>
        <span>Decision</span>
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ReviewerDecisionStatus)
          }
        >
          {DECISION_STATUSES.map((decisionStatus) => (
            <option key={decisionStatus} value={decisionStatus}>
              {decisionStatus}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Reviewer comment</span>
        <textarea
          rows={5}
          value={reviewerComment}
          onChange={(event) => setReviewerComment(event.target.value)}
        />
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSaving}>
          Record decision
        </button>
      </div>
    </form>
  )
}

interface StatusBadgeProps {
  status: WorkflowStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={statusClassName(status)}>{status}</span>
}

export default App
