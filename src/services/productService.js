const BASE_URL = 'http://localhost:8080'

function networkError() {
  const error = new Error(
    'Unable to reach the server. Please check your connection and try again.',
  )
  error.isNetwork = true
  return error
}

function normalizeProduct(item) {
  const images = Array.isArray(item.images) ? item.images : []
  const numericPrice = Number(item.price)
  return {
    id: item.productId ?? item.id,
    name: item.name ?? item.productName,
    description: item.description ?? item.productDescription ?? '',
    price: Number.isNaN(numericPrice) ? 0 : numericPrice,
    imageUrl:
      item.imageUrl ??
      item.image ??
      images[0]?.imageUrl ??
      images[0]?.url ??
      '',
  }
}

export async function fetchProducts(token) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/products`, {
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
    throw new Error('Failed to load products.')
  }

  const data = await response.json().catch(() => null)
  const list = Array.isArray(data) ? data : data?.products
  if (!Array.isArray(list)) {
    throw new Error('Unexpected response format from the server.')
  }

  return list.map(normalizeProduct)
}
