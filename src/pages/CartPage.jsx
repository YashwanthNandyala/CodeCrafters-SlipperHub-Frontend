import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  deleteCartItem,
  fetchCart,
  fetchCartCount,
  updateCartItem,
} from '../services/cartService.js'
import { createOrder, verifyPayment } from '../services/paymentService.js'
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

let razorpayScriptPromise = null

function loadRazorpayScript() {
  if (razorpayScriptPromise) return razorpayScriptPromise
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      if (window.Razorpay) {
        resolve()
      } else {
        reject(new Error('Payment script loaded but failed to initialize.'))
      }
    }
    script.onerror = () => {
      reject(
        new Error(
          'Could not load the payment script. Please check your connection and try again.',
        ),
      )
    }
    setTimeout(() => {
      if (!window.Razorpay) {
        reject(new Error('Payment script timed out. Please try again.'))
      }
    }, 15000)
    document.body.appendChild(script)
  }).catch((error) => {
    razorpayScriptPromise = null
    throw error
  })
  return razorpayScriptPromise
}

export default function CartPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [overallTotalPrice, setOverallTotalPrice] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError, setCartError] = useState('')
  const [busyProductId, setBusyProductId] = useState(null)
  const [checkoutPending, setCheckoutPending] = useState(false)
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

  const handleCheckout = async () => {
    if (checkoutPending) return
    setCheckoutPending(true)
    try {
      const order = await createOrder(token)
      await loadRazorpayScript()

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'ShoesHub',
        description: `Order ${order.applicationOrderId}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: { color: '#535bf2' },
        modal: {
          ondismiss: () => {
            setCheckoutPending(false)
            showToast('Payment cancelled. Your cart is unchanged.', true)
          },
        },
        handler: async (response) => {
          try {
            const verify = await verifyPayment(
              {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              },
              token,
            )
            if (verify?.success) {
              showToast('Payment successful! Redirecting to your orders.')
              navigate('/orders')
            } else {
              showToast(
                verify?.message ||
                  'Payment could not be confirmed. Your order has not been marked as paid.',
                true,
              )
            }
          } catch (err) {
            if (err.status === 401) {
              logout()
              return
            }
            showToast(
              err.message ||
                'Payment could not be verified. Your order is not marked as paid.',
              true,
            )
          } finally {
            setCheckoutPending(false)
          }
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', () => {
        setCheckoutPending(false)
        showToast('Payment failed. Your order has not been marked as paid.', true)
      })
      razorpay.open()
    } catch (err) {
      if (err.status === 401) {
        logout()
        return
      }
      showToast(err.message || 'Could not start payment. Please try again.', true)
      setCheckoutPending(false)
    }
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
                  disabled={checkoutPending}
                >
                  {checkoutPending ? 'Processing...' : 'Proceed to Checkout'}
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
