import { FormEvent, useState } from 'react'

import { APPLICATION_TYPES } from '../types'

import type { ApplicationFormData } from '../types'

interface ApplicationFormProps {
  title: string
  submitLabel: string
  initialValue: ApplicationFormData
  isSaving: boolean
  onCancel: () => void
  onSave: (
    payload: ApplicationFormData,
  ) => Promise<void>
}

function ApplicationForm({
  title,
  submitLabel,
  initialValue,
  isSaving,
  onCancel,
  onSave,
}: Readonly<ApplicationFormProps>) {
  const [formData, setFormData] =
    useState<ApplicationFormData>(
      initialValue,
    )

  function updateField<
    Field extends keyof ApplicationFormData,
  >(
    field: Field,
    value: ApplicationFormData[Field],
  ): void {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }))
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    void onSave(formData)
  }

  return (
    <form
      className="panel form-panel"
      onSubmit={handleSubmit}
    >
      <div className="form-heading">
        <h2>{title}</h2>

        <button
          className="ghost-button"
          type="button"
          onClick={onCancel}
        >
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
              updateField(
                'applicant_name',
                event.target.value,
              )
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
              updateField(
                'applicant_email',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>Company name</span>

          <input
            required
            value={formData.company_name}
            onChange={(event) =>
              updateField(
                'company_name',
                event.target.value,
              )
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
                event.target
                  .value as ApplicationFormData['application_type'],
              )
            }
          >
            {APPLICATION_TYPES.map(
              (applicationType) => (
                <option
                  key={applicationType}
                  value={applicationType}
                >
                  {applicationType}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <label>
        <span>Description</span>

        <textarea
          required
          rows={7}
          value={formData.description}
          onChange={(event) =>
            updateField(
              'description',
              event.target.value,
            )
          }
        />
      </label>

      <div className="form-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={isSaving}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export default ApplicationForm