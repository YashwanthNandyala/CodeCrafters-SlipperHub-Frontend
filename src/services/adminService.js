const BASE_URL = 'http://localhost:8080'

function networkError() {
  const error = new Error(
    'Unable to reach the server. Please check your connection and try again.',
  )
  error.isNetwork = true
  return error
}

async function request(path, { method = 'GET', token, body } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw networkError()
  }

  const data = await response.json().catch(() => null)

  if (response.status === 401) {
    const error = new Error('Session expired. Please log in again.')
    error.status = 401
    throw error
  }

  if (!response.ok) {
    const error = new Error(data?.message ?? 'Request failed.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const adminApi = {
  dashboardSummary: (token) => request('/api/admin/dashboard/summary', { token }),

  getUsers: (token) => request('/api/admin/users', { token }),
  updateUserRole: (token, userId, role) =>
    request(`/api/admin/users/${userId}/role`, { method: 'PUT', token, body: { role } }),

  getProducts: (token) => request('/api/admin/products', { token }),
  createProduct: (token, payload) =>
    request('/api/admin/products', { method: 'POST', token, body: payload }),
  updateProduct: (token, productId, payload) =>
    request(`/api/admin/products/${productId}`, { method: 'PUT', token, body: payload }),
  deleteProduct: (token, productId) =>
    request(`/api/admin/products/${productId}`, { method: 'DELETE', token }),

  getCategories: (token) => request('/api/admin/categories', { token }),
  createCategory: (token, categoryName) =>
    request('/api/admin/categories', { method: 'POST', token, body: { categoryName } }),

  getDailyRevenue: (token, days = 7) =>
    request(`/api/admin/revenue/daily?days=${days}`, { token }),
  getMonthlyRevenue: (token, months = 12) =>
    request(`/api/admin/revenue/monthly?months=${months}`, { token }),
  getYearlyRevenue: (token) => request('/api/admin/revenue/yearly', { token }),
  getOverallRevenue: (token) => request('/api/admin/revenue/overall', { token }),
}
