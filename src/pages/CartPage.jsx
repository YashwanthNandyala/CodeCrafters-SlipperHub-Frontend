import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchCartCount } from '../services/cartService.js'
import CustomerHeader from '../components/CustomerHeader.jsx'
import { isTokenValid } from '../utils/token.js'

const TOKEN_KEY = 'registration.token'

export default function CartPage() {
  const { user, token, logout } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadCartCount = async () => {
      try {
        const count = await fetchCartCount(token)
        if (!cancelled) setCartCount(count)
      } catch (err) {
        if (!cancelled && err.status === 401) logout()
      }
    }

    loadCartCount()
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const tokenValid = isTokenValid(localStorage.getItem(TOKEN_KEY))

  if (!tokenValid) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="customer-page">
      <CustomerHeader userName={user.fullName} cartCount={cartCount} />
      <main className="customer-content">
        <section className="cart-placeholder" aria-label="Cart">
          <h2 className="section-heading">Cart Page</h2>
          <p className="section-message">
            Your cart page will be implemented later.
          </p>
        </section>
      </main>
    </div>
  )
}
