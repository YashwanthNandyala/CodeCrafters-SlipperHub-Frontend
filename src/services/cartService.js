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

export async function addToCart(productId, token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/cart/add`, {
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
    response = await fetch(`${BASE_URL}/api/cart/items/count`, {
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

export async function fetchCart(token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/cart/items`, {
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
  if (!data || !Array.isArray(data.items)) {
    throw new Error('Unexpected response format from the server.')
  }

  return {
    items: data.items,
    overallTotalPrice: data.overallTotalPrice ?? 0,
  }
}

export async function updateCartItem(productId, action, token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/cart/update`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ productId, action }),
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

export async function deleteCartItem(productId, token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/cart/delete`, {
      method: 'DELETE',
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
