import { useEffect, useMemo, useState } from 'react'

import {
  createApplication,
  getApplication,
  listApplications,
  recordDecision,
  startReview,
  submitApplication,
  updateApplication,
} from './api'

import { EMPTY_APPLICATION_FORM } from './types'

import type {
  Application,
  ApplicationFormData,
  ReviewerDecisionData,
  WorkflowStatus,
} from './types'

import ApplicationDetail from './components/ApplicationDetail'
import ApplicationForm from './components/ApplicationForm'
import ApplicationList from './components/ApplicationList'

type ViewMode =
  | 'list'
  | 'create'
  | 'detail'
  | 'edit'

/**
 * Formats API date values into a readable string.
 */
function formatDate(
  value: string | null,
): string {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/**
 * Main application container.
 *
 * Handles:
 * - data fetching
 * - workflow actions
 * - view switching
 * - notifications
 */
function App() {
  const [applications, setApplications] =
    useState<Application[]>([])

  const [activeApplication, setActiveApplication] =
    useState<Application | null>(null)

  const [viewMode, setViewMode] =
    useState<ViewMode>('list')

  const [isLoading, setIsLoading] =
    useState<boolean>(true)

  const [isSaving, setIsSaving] =
    useState<boolean>(false)

  const [error, setError] =
    useState<string | null>(null)

  const [notice, setNotice] =
    useState<string | null>(null)

  /**
   * Derived application counts by workflow status.
   */
  const counts = useMemo(() => {
    return applications.reduce<
      Record<WorkflowStatus, number>
    >(
      (currentCounts, application) => ({
        ...currentCounts,

        [application.status]:
          currentCounts[
            application.status
          ] + 1,
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

  /**
   * Fetches all applications from the API.
   */
  async function refreshApplications(): Promise<void> {
    setIsLoading(true)

    try {
      const response =
        await listApplications()

      setApplications(response)
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

  /**
   * Opens a single application detail view.
   */
  async function openDetail(
    applicationId: number,
  ): Promise<void> {
    setIsSaving(true)
    setNotice(null)

    try {
      const application =
        await getApplication(applicationId)

      setActiveApplication(application)

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

  /**
   * Shared workflow action executor.
   *
   * Used for:
   * - create
   * - update
   * - submit
   * - review
   * - decisions
   */
  async function runWorkflowAction(
    action: () => Promise<Application>,
    successMessage: string,
  ): Promise<void> {
    setIsSaving(true)
    setNotice(null)

    try {
      const updatedApplication =
        await action()

      setActiveApplication(
        updatedApplication,
      )

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

  /**
   * Creates a new draft application.
   */
  async function handleCreate(
    payload: ApplicationFormData,
  ): Promise<void> {
    await runWorkflowAction(
      async () =>
        createApplication(payload),

      'Draft created.',
    )
  }

  /**
   * Updates an existing application.
   */
  async function handleUpdate(
    payload: ApplicationFormData,
  ): Promise<void> {
    if (!activeApplication) {
      return
    }

    await runWorkflowAction(
      async () =>
        updateApplication(
          activeApplication.id,
          payload,
        ),

      'Application updated.',
    )
  }

  /**
   * Resets UI back to list view.
   */
  function showList(): void {
    setViewMode('list')

    setActiveApplication(null)

    setNotice(null)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">
            Application Workflow
          </p>

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

      {error ? (
        <p className="alert alert-error">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="alert alert-success">
          {notice}
        </p>
      ) : null}

      {viewMode === 'list' ? (
        <ApplicationList
          applications={applications}
          counts={counts}
          isLoading={isLoading}
          isSaving={isSaving}
          formatDate={formatDate}
          onOpen={(applicationId) => {
            void openDetail(applicationId)
          }}
        />
      ) : null}

      {viewMode === 'create' ? (
        <ApplicationForm
          title="Create draft"
          submitLabel="Save draft"
          initialValue={
            EMPTY_APPLICATION_FORM
          }
          isSaving={isSaving}
          onCancel={showList}
          onSave={handleCreate}
        />
      ) : null}

      {viewMode === 'edit' &&
      activeApplication ? (
        <ApplicationForm
          title="Edit application"
          submitLabel="Save changes"
          initialValue={activeApplication}
          isSaving={isSaving}
          onCancel={() =>
            setViewMode('detail')
          }
          onSave={handleUpdate}
        />
      ) : null}

      {viewMode === 'detail' &&
      activeApplication ? (
        <ApplicationDetail
          application={activeApplication}
          isSaving={isSaving}
          formatDate={formatDate}
          onBack={showList}
          onEdit={() =>
            setViewMode('edit')
          }
          onSubmit={() => {
            void runWorkflowAction(
              async () =>
                submitApplication(
                  activeApplication.id,
                ),

              activeApplication.status ===
                'Need More Information'
                ? 'Application resubmitted.'
                : 'Application submitted.',
            )
          }}
          onStartReview={() => {
            void runWorkflowAction(
              async () =>
                startReview(
                  activeApplication.id,
                ),

              'Review started.',
            )
          }}
          onDecision={(
            payload: ReviewerDecisionData,
          ) =>
            runWorkflowAction(
              async () =>
                recordDecision(
                  activeApplication.id,
                  payload,
                ),

              'Reviewer decision recorded.',
            )
          }
        />
      ) : null}
    </main>
  )
}

export default App