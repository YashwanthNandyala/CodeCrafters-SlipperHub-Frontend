const REGISTRATION_URL = 'http://localhost:8080/api/users/register'

export async function registerUser(payload) {
  let response
  try {
    response = await fetch(REGISTRATION_URL, {
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
    const error = new Error(data?.message ?? 'Registration failed.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
