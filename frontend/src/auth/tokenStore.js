// Almacén de sesión en localStorage, compartido por AuthContext (estado de React)
// y el cliente HTTP (que necesita el token en cada request y rota el refresh).
const STORAGE_KEY = 'colasuni.auth'

// Evento que emitimos cuando la sesión caduca definitivamente (refresh falló),
// para que AuthContext limpie su estado y redirija al login.
export const AUTH_EXPIRED_EVENT = 'colasuni:auth-expired'

export function getAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuth(auth) {
  if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  else localStorage.removeItem(STORAGE_KEY)
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

export function notifyExpired() {
  clearAuth()
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
}
