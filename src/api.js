// שכבת התקשורת היחידה מול השרת: כתובת בסיס, header של Authorization וטיפול מרוכז בשגיאות.

const BASE_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:5196').replace(/\/$/, '')
const SESSION_KEY = 'session'

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  get isConflict() {
    return this.status === 409
  }
}

// ---------- session (token + פרטי המשתמשת), נשמר ב-localStorage ----------

export function getSession() {
  try {
    const raw = globalThis.localStorage?.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(authResponse) {
  try {
    globalThis.localStorage?.setItem(SESSION_KEY, JSON.stringify(authResponse))
  } catch {
    // אם האחסון חסום, ההתחברות תעבוד עד לרענון הדף בלבד
  }
}

export function clearSession() {
  try {
    globalThis.localStorage?.removeItem(SESSION_KEY)
  } catch {
    // התעלמות מכוונת
  }
}

// ה-App רושם כאן פונקציה שמעבירה למסך ההתחברות כשה-token פג
let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

// ---------- הבקשה עצמה ----------

function errorMessage(status, data) {
  if (data?.errors) {
    // ולידציה אוטומטית של [ApiController]: { errors: { Field: ["הודעה"] } }
    return Object.values(data.errors).flat().join(' ')
  }
  if (data?.detail) return data.detail
  if (status === 403) return 'אין לך הרשאה לבצע פעולה זו.'
  if (status === 404) return 'הפריט המבוקש לא נמצא.'
  if (status === 409) return 'הפעולה התנגשה עם שינוי אחר. יש לרענן ולנסות שוב.'
  return 'אירעה שגיאה בשרת. נסי שוב מאוחר יותר.'
}

async function request(method, path, { body, query, auth = true } = {}) {
  const url = new URL(BASE_URL + path)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getSession()?.token
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'לא ניתן להתחבר לשרת. בדקי שהשרת פועל.')
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)
  if (response.ok) return data

  // 401 עם token קיים: פג תוקפו (או שהוא לא תקין). מנקים ומעבירים למסך ההתחברות
  if (response.status === 401 && auth && token) {
    clearSession()
    onUnauthorized()
    throw new ApiError(401, 'פג תוקף ההתחברות. יש להתחבר מחדש.', data)
  }

  throw new ApiError(response.status, errorMessage(response.status, data), data)
}

// ---------- auth ----------

export async function login(email, password) {
  const session = await request('POST', '/api/auth/login', { body: { email, password }, auth: false })
  saveSession(session)
  return session
}

export async function register(fullName, email, password) {
  const session = await request('POST', '/api/auth/register', {
    body: { fullName, email, password },
    auth: false,
  })
  saveSession(session)
  return session
}

export const logout = clearSession

// ---------- אירועים ----------

export const listEvents = (params) => request('GET', '/api/events', { query: params, auth: false })
export const getEvent = (id) => request('GET', `/api/events/${id}`, { auth: false })
export const listCategories = () => request('GET', '/api/categories', { auth: false })
export const listTags = () => request('GET', '/api/tags', { auth: false })

// ---------- הזמנות ----------

export const createOrder = (sessionId, quantity) =>
  request('POST', '/api/orders', { body: { sessionId, quantity } })
export const listOrders = (page = 1, pageSize = 10) =>
  request('GET', '/api/orders', { query: { page, pageSize } })
export const cancelOrder = (id) => request('DELETE', `/api/orders/${id}`)
