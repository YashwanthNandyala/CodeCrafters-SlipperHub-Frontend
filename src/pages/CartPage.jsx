import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  deleteCartItem,
  fetchCart,
  fetchCartCount,
  updateCartItem,
} from '../services/cartService.js'
import CustomerHeader from '../components/CustomerHeader.jsx'
import { isTokenValid } from '../utils/token.js'

const TOKEN_KEY = 'registration.token'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function formatPrice(price) {
  return priceFormatter.format(price)
}

export default function CartPage() {
  const { user, token, logout } = useAuth()
  const [items, setItems] = useState([])
  const [overallTotalPrice, setOverallTotalPrice] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError, setCartError] = useState('')
  const [busyProductId, setBusyProductId] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (message, isError = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, isError })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    let cancelled = false

    const loadCart = async () => {
      setCartLoading(true)
      setCartError('')
      try {
        const cart = await fetchCart(token)
        if (cancelled) return
        setItems(cart.items)
        setOverallTotalPrice(cart.overallTotalPrice)
        const count = await fetchCartCount(token)
        if (cancelled) return
        setCartCount(count)
      } catch (err) {
        if (cancelled) return
        if (err.status === 401) {
          logout()
          return
        }
        setCartError(err.message)
      } finally {
        if (!cancelled) setCartLoading(false)
      }
    }

    loadCart()
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const refreshCart = async () => {
    const cart = await fetchCart(token)
    setItems(cart.items)
    setOverallTotalPrice(cart.overallTotalPrice)
    const count = await fetchCartCount(token)
    setCartCount(count)
  }

  const handleUpdate = async (productId, action) => {
    if (busyProductId !== null) return
    setBusyProductId(productId)
    try {
      await updateCartItem(productId, action, token)
      await refreshCart()
      showToast('Cart updated')
    } catch (err) {
      if (err.status === 401) {
        logout()
        return
      }
      showToast(err.message || 'Could not update cart. Please try again.', true)
    } finally {
      setBusyProductId(null)
    }
  }

  const handleRemove = async (productId) => {
    if (busyProductId !== null) return
    setBusyProductId(productId)
    try {
      await deleteCartItem(productId, token)
      await refreshCart()
      showToast('Removed from cart')
    } catch (err) {
      if (err.status === 401) {
        logout()
        return
      }
      showToast(err.message || 'Could not remove item. Please try again.', true)
    } finally {
      setBusyProductId(null)
    }
  }

  const handleCheckout = () => {
    showToast('Checkout is coming soon.')
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const tokenValid = isTokenValid(localStorage.getItem(TOKEN_KEY))

  if (!tokenValid) {
    return <Navigate to="/login" replace />
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="customer-page">
      <CustomerHeader userName={user.fullName} cartCount={cartCount} />

      <main className="customer-content">
        <section className="cart-section" aria-label="Cart">
          <h2 className="section-heading">Your Cart</h2>

          {cartLoading && (
            <p className="section-message">Loading your cart...</p>
          )}

          {cartError && (
            <p className="section-message error-message" role="alert">
              {cartError}
            </p>
          )}

          {!cartLoading && !cartError && items.length === 0 && (
            <div className="cart-empty">
              <p className="section-message">Your cart is empty.</p>
              <Link to="/customer-home" className="cart-empty-link">
                Continue Shopping
              </Link>
            </div>
          )}

          {!cartLoading && !cartError && items.length > 0 && (
            <div className="cart-layout">
              <div className="cart-items">
                {items.map((item) => {
                  const busy = busyProductId === item.productId
                  return (
                    <article className="cart-item" key={item.productId}>
                      <div className="cart-item-image">
                        <img src={item.imageUrl} alt={item.name} />
                      </div>
                      <div className="cart-item-info">
                        <h3 className="cart-item-name">{item.name}</h3>
                        <p className="cart-item-description">
                          {item.description}
                        </p>
                        <p className="cart-item-unit-price">
                          {formatPrice(item.pricePerUnit)} each
                        </p>
                      </div>
                      <div className="cart-item-controls">
                        <div className="cart-quantity">
                          <button
                            type="button"
                            className="cart-quantity-button"
                            onClick={() =>
                              handleUpdate(item.productId, 'DECREMENT')
                            }
                            disabled={busy}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            −
                          </button>
                          <span className="cart-quantity-value">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="cart-quantity-button"
                            onClick={() =>
                              handleUpdate(item.productId, 'INCREMENT')
                            }
                            disabled={busy}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                        <p className="cart-item-total">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <button
                          type="button"
                          className="cart-remove-button"
                          onClick={() => handleRemove(item.productId)}
                          disabled={busy}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <aside className="cart-summary" aria-label="Order summary">
                <h3 className="cart-summary-heading">Order Summary</h3>
                <div className="cart-summary-row">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Grand Total</span>
                  <span className="cart-grand-total">
                    {formatPrice(overallTotalPrice)}
                  </span>
                </div>
                <button
                  type="button"
                  className="checkout-button"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>
              </aside>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div
          className={`cart-toast${toast.isError ? ' error' : ''}`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
