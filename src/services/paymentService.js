const BASE_URL = 'http://localhost:8080'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function networkError() {
  const error = new Error(
    'Unable to reach the server. Please check your connection and try again.',
  )
  error.isNetwork = true
  return error
}

function unauthorizedError() {
  const error = new Error('Session expired. Please log in again.')
  error.status = 401
  return error
}

async function readErrorMessage(response) {
  try {
    const data = await response.json()
    const message = data?.message
    if (typeof message === 'string' && message.trim()) return message
    if (message && typeof message === 'object') {
      const joined = Object.values(message).filter(Boolean).join(', ')
      if (joined) return joined
    }
    return 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

export async function createOrder(token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: authHeaders(token),
    })
  } catch {
    throw networkError()
  }

  if (response.status === 401) {
    throw unauthorizedError()
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = await response.json().catch(() => null)
  if (!data || !data.razorpayOrderId || !data.keyId || !data.amount) {
    throw new Error('Unexpected response format from the server.')
  }
  return data
}

export async function verifyPayment(payload, token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
  } catch {
    throw networkError()
  }

  if (response.status === 401) {
    throw unauthorizedError()
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json().catch(() => null)
}
