/**
 * api.js – centralised API client for the Medical RAG backend.
 *
 * Base URL is read from the VITE_API_URL env variable so you can swap
 * environments without touching this file.  Falls back to the local
 * backend during development.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

/** Returns the stored JWT, or null if the user isn't logged in. */
export const getToken = () => localStorage.getItem('access_token')

/** Persists the JWT returned by /login. */
export const saveToken = (token) => localStorage.setItem('access_token', token)

/** Removes the JWT (used on logout). */
export const clearToken = () => localStorage.removeItem('access_token')

/**
 * Small fetch wrapper that:
 *  - Always sends/receives JSON
 *  - Optionally adds the Bearer token header
 *  - Throws a structured error with the backend's detail message
 */
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // FastAPI returns JSON even for errors, so parse it first
  let data
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      (typeof data === 'string' ? data : 'An unexpected error occurred')
    const err = new Error(message)
    err.status = response.status
    throw err
  }

  return data
}

// ── Auth endpoints ─────────────────────────────────────────────────────────

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{id: number, email: string}>}
 */
export const registerUser = (email, password) =>
  request('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

/**
 * Log in and retrieve a JWT.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token: string, token_type: string}>}
 */
export const loginUser = (email, password) =>
  request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// ── RAG endpoint ───────────────────────────────────────────────────────────

/**
 * Ask a medical question.
 * Requires a valid Bearer token in localStorage.
 * @param {string} question
 * @returns {Promise<object>} The RAG controller's response
 */
export const askQuestion = (question) =>
  request('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
