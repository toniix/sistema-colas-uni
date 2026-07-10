// Cliente HTTP de bajo nivel sobre fetch.
// - Adjunta el accessToken (JWT) en Authorization.
// - Ante un 401, intenta rotar el token con /api/auth/refresh y reintenta 1 vez.
// - Traduce el esquema de error del backend a un Error con mensaje legible.
import { getAuth, setAuth, notifyExpired } from '../auth/tokenStore'

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8080'

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function toApiError(res) {
  let body = null
  try {
    body = await res.json()
  } catch {
    // respuesta sin cuerpo JSON
  }
  let message = body?.message
  if (!message && body?.validationErrors) {
    message = Object.values(body.validationErrors).join(' ')
  }
  if (!message) message = body?.error || `Error ${res.status}`
  return new ApiError(message, res.status, body)
}

// Evita disparar varios refresh en paralelo: se comparte una sola promesa.
let refreshPromise = null

async function doRefresh() {
  const auth = getAuth()
  if (!auth?.refreshToken) throw new ApiError('Sesión no iniciada', 401)

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: auth.refreshToken }),
  })
  if (!res.ok) throw await toApiError(res)

  const data = await res.json()
  const next = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: auth.user, // el usuario no cambia en un refresh
  }
  setAuth(next)
  return next.accessToken
}

function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * Comprueba si el token actual de acceso ha expirado o está a punto de hacerlo (próximos 10 segundos).
 * Si ha expirado, ejecuta el refresco y retorna el nuevo accessToken.
 * De lo contrario, retorna el token existente.
 */
export async function garantizarTokenValido() {
  const auth = getAuth()
  if (!auth?.accessToken) return null

  try {
    // Decodificar payload JWT (segundo segmento separado por puntos)
    const payload = JSON.parse(atob(auth.accessToken.split('.')[1]))
    const exp = payload.exp * 1000 // Convertir a milisegundos
    
    // Si ya expiró o vencerá en los próximos 10 segundos, refrescar
    if (Date.now() + 10000 >= exp) {
      return await refreshToken()
    }
  } catch (e) {
    // Si no se puede decodificar, retornar el token actual
  }
  return auth.accessToken
}


async function rawRequest(path, { method = 'GET', body, auth = true, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const accessToken = token ?? (auth ? getAuth()?.accessToken : null)
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function request(path, opts = {}) {
  let res = await rawRequest(path, opts)

  // Token vencido: rotamos y reintentamos una sola vez.
  if (res.status === 401 && opts.auth !== false && !opts._retried) {
    try {
      const newToken = await refreshToken()
      res = await rawRequest(path, { ...opts, token: newToken, _retried: true })
    } catch {
      notifyExpired()
      throw new ApiError('Tu sesión expiró. Inicia sesión nuevamente.', 401)
    }
  }

  if (res.status === 204) return null
  if (!res.ok) throw await toApiError(res)
  if (res.status === 205) return null

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
