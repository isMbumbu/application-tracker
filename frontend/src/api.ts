import type {
  Application,
  ApplicationFormData,
  ReviewerDecisionData,
} from './types'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
).replace(/\/$/, '')

async function readError(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`
  const text = await response.text()

  try {
    const payload = JSON.parse(text) as { detail?: unknown }
    if (typeof payload.detail === 'string') {
      return payload.detail
    }
    if (payload.detail) {
      return JSON.stringify(payload.detail)
    }
  } catch {
    return text || fallback
  }

  return fallback
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return (await response.json()) as T
}

export function listApplications(): Promise<Application[]> {
  return request<Application[]>('/applications/')
}

export function getApplication(id: number): Promise<Application> {
  return request<Application>(`/applications/${id}/`)
}

export function createApplication(
  payload: ApplicationFormData,
): Promise<Application> {
  return request<Application>('/applications/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateApplication(
  id: number,
  payload: ApplicationFormData,
): Promise<Application> {
  return request<Application>(`/applications/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitApplication(id: number): Promise<Application> {
  return request<Application>(`/applications/${id}/submit/`, {
    method: 'POST',
  })
}

export function startReview(id: number): Promise<Application> {
  return request<Application>(`/applications/${id}/start-review/`, {
    method: 'POST',
  })
}

export function recordDecision(
  id: number,
  payload: ReviewerDecisionData,
): Promise<Application> {
  return request<Application>(`/applications/${id}/decision/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
