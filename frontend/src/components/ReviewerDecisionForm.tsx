import { FormEvent, useState } from 'react'

import { DECISION_STATUSES } from '../types'

import type {
  ReviewerDecisionData,
  ReviewerDecisionStatus,
} from '../types'

interface ReviewerDecisionFormProps {
  isSaving: boolean
  onDecision: (
    payload: ReviewerDecisionData,
  ) => Promise<void>
}

function ReviewerDecisionForm({
  isSaving,
  onDecision,
}: Readonly<ReviewerDecisionFormProps>) {
  const [status, setStatus] =
    useState<ReviewerDecisionStatus>('Approved')

  const [reviewerComment, setReviewerComment] =
    useState('')

  const [localError, setLocalError] =
    useState<string | null>(null)

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    if (
      status !== 'Approved' &&
      reviewerComment.trim().length === 0
    ) {
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
    <form
      className="panel form-panel"
      onSubmit={handleSubmit}
    >
      <h3>Reviewer decision</h3>

      {localError ? (
        <p className="alert alert-error">
          {localError}
        </p>
      ) : null}

      <label>
        <span>Decision</span>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as ReviewerDecisionStatus,
            )
          }
        >
          {DECISION_STATUSES.map((decisionStatus) => (
            <option
              key={decisionStatus}
              value={decisionStatus}
            >
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
          onChange={(event) =>
            setReviewerComment(event.target.value)
          }
        />
      </label>

      <div className="form-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={isSaving}
        >
          Record decision
        </button>
      </div>
    </form>
  )
}

export default ReviewerDecisionForm