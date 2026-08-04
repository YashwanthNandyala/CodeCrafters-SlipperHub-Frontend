import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CustomerHeader from '../components/CustomerHeader.jsx'
import { fetchCartCount } from '../services/cartService.js'
import { fetchOrders } from '../services/orderService.js'
import { isTokenValid } from '../utils/token.js'

const TOKEN_KEY = 'registration.token'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function formatPrice(price) {
  return priceFormatter.format(price)
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function OrdersPage() {
  const { user, token, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [expandedOrderIds, setExpandedOrderIds] = useState({})

  useEffect(() => {
    let cancelled = false

    const loadOrders = async () => {
      setOrdersLoading(true)
      setOrdersError('')
      try {
        const data = await fetchOrders(token)
        if (cancelled) return
        setOrders(data)
      } catch (err) {
        if (cancelled) return
        if (err.status === 401) {
          logout()
          return
        }
        setOrdersError(err.message)
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }

    const loadCartCount = async () => {
      try {
        const count = await fetchCartCount(token)
        if (!cancelled) setCartCount(count)
      } catch (err) {
        if (!cancelled && err.status === 401) logout()
      }
    }

    loadOrders()
    loadCartCount()
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const toggleDetails = (orderId) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const tokenValid = isTokenValid(localStorage.getItem(TOKEN_KEY))

  if (!tokenValid) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="customer-page">
      <CustomerHeader userName={user.fullName} cartCount={cartCount} />

      <main className="customer-content">
        <section className="orders-section" aria-label="Orders">
          <h2 className="orders-heading">My Orders</h2>
          <p className="orders-subheading">
            View your successful purchases and order details.
          </p>

          {ordersLoading && (
            <p className="section-message">Loading your orders...</p>
          )}

          {ordersError && (
            <p className="section-message error-message" role="alert">
              {ordersError}
            </p>
          )}

          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="orders-empty">
              <p className="section-message">You have no successful orders yet.</p>
              <Link to="/customer-home" className="cart-empty-link">
                Continue Shopping
              </Link>
            </div>
          )}

          {!ordersLoading && !ordersError && orders.length > 0 && (
            <div className="orders-list">
              {orders.map((order) => {
                const expanded = Boolean(expandedOrderIds[order.orderId])
                return (
                  <article className="order-card" key={order.orderId}>
                    <div className="order-card-header">
                      <div className="order-card-title">
                        <h3 className="order-id">Order {order.orderId}</h3>
                        <span className="order-status-badge">{order.status}</span>
                      </div>
                    </div>

                    <div className="order-card-meta">
                      <span>
                        Date: <strong>{formatDate(order.orderDate)}</strong>
                      </span>
                      <span>
                        Products: <strong>{order.itemCount}</strong>
                      </span>
                      <span>
                        Grand Total:{' '}
                        <strong className="order-grand-total">
                          {formatPrice(order.grandTotal)}
                        </strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      className="order-details-button"
                      onClick={() => toggleDetails(order.orderId)}
                      aria-expanded={expanded}
                    >
                      {expanded ? 'Hide Details' : 'Show Details'}
                    </button>

                    {expanded && (
                      <div className="order-items">
                        {order.items.map((item) => (
                          <div className="order-item" key={item.productId}>
                            <div className="order-item-image">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} />
                              ) : null}
                            </div>
                            <div className="order-item-info">
                              <h4 className="order-item-name">{item.name}</h4>
                              {item.description ? (
                                <p className="order-item-description">
                                  {item.description}
                                </p>
                              ) : null}
                              {item.category ? (
                                <p className="order-item-category">
                                  Category: {item.category}
                                </p>
                              ) : null}
                              <div className="order-item-prices">
                                <span>
                                  Qty: <strong>{item.quantity}</strong>
                                </span>
                                <span>
                                  Price/Unit:{' '}
                                  <strong>{formatPrice(item.pricePerUnit)}</strong>
                                </span>
                                <span>
                                  Total:{' '}
                                  <strong>{formatPrice(item.totalPrice)}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="order-items-total">
                          <span>Grand Total</span>
                          <span className="cart-grand-total">
                            {formatPrice(order.grandTotal)}
                          </span>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
