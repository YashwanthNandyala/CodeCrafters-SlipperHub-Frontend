const LOGIN_URL = 'http://localhost:8080/api/auth/login'
const LOGOUT_URL = 'http://localhost:8080/api/auth/logout'

export async function loginUser(payload) {
  let response
  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    const networkError = new Error(
      'Unable to reach the server. Please check your connection and try again.',
    )
    networkError.isNetwork = true
    throw networkError
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message ?? 'Login failed.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function logoutUser(token) {
  let response
  try {
    response = await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    const networkError = new Error(
      'Unable to reach the server. Please check your connection and try again.',
    )
    networkError.isNetwork = true
    throw networkError
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message ?? 'Logout failed.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
