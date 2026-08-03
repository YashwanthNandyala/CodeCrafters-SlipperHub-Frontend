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
    return data.message || 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

export async function addToCart(productId, token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ productId }),
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
}

export async function fetchCartCount(token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/cart/count`, {
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
  return data?.count ?? 0
}
