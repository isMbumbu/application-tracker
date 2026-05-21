export const APPLICATION_TYPES = [
  'Recordation',
  'Renewal',
  'Change of Ownership',
  'Change of Name',
  'Discontinuation',
] as const

export const DECISION_STATUSES = [
  'Approved',
  'Need More Information',
  'Rejected',
] as const

export type ApplicationType = (typeof APPLICATION_TYPES)[number]

export type WorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Need More Information'
  | 'Approved'
  | 'Rejected'

export type ReviewerDecisionStatus = (typeof DECISION_STATUSES)[number]

export interface ApplicationFormData {
  applicant_name: string
  applicant_email: string
  company_name: string
  application_type: ApplicationType
  description: string
}

export interface ReviewerDecisionData {
  status: ReviewerDecisionStatus
  reviewer_comment: string
}

export interface Application extends ApplicationFormData {
  id: number
  tracking_number: string
  status: WorkflowStatus
  reviewer_comment: string
  created_at: string
  updated_at: string
  submitted_at: string | null
  reviewed_at: string | null
}

export const EMPTY_APPLICATION_FORM: ApplicationFormData = {
  applicant_name: '',
  applicant_email: '',
  company_name: '',
  application_type: 'Recordation',
  description: '',
}
