const BASE_URL = 'http://localhost:8080'

function networkError() {
  const error = new Error(
    'Unable to reach the server. Please check your connection and try again.',
  )
  error.isNetwork = true
  return error
}

function normalizeCategory(item) {
  return {
    id: item.categoryId ?? item.id,
    name: item.categoryName ?? item.name,
  }
}

export async function fetchCategories(token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/categories`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw networkError()
  }

  if (response.status === 401) {
    const error = new Error('Session expired. Please log in again.')
    error.status = 401
    throw error
  }

  if (!response.ok) {
    throw new Error('Failed to load categories.')
  }

  const data = await response.json().catch(() => null)
  const list = Array.isArray(data) ? data : data?.categories
  if (!Array.isArray(list)) {
    throw new Error('Unexpected response format from the server.')
  }

  return list.map(normalizeCategory)
}
