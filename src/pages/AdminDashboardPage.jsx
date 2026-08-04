import { useEffect, useState } from 'react'
import { adminApi } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'
import RevenueChart from '../components/RevenueChart.jsx'
import { formatDateTime, formatINR } from '../utils/format.js'

const STATUS_CLASSES = {
  SUCCESS: 'order-status-badge',
  PENDING: 'order-status-badge pending',
  FAILED: 'order-status-badge failed',
}

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [summaryData, revenueData] = await Promise.all([
          adminApi.dashboardSummary(token),
          adminApi.getDailyRevenue(token, 7),
        ])
        if (!cancelled) {
          setSummary(summaryData)
          setRevenue(revenueData)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const retry = () => setReloadKey((key) => key + 1)

  if (loading && !summary) {
    return <p className="admin-loading">Loading dashboard...</p>
  }

  if (error && !summary) {
    return (
      <div className="admin-card">
        <p className="error-message" role="alert">
          {error}
        </p>
        <button type="button" className="submit-button" onClick={retry}>
          Try again
        </button>
      </div>
    )
  }

  const cards = [
    { label: 'Total Revenue', value: formatINR(summary.totalRevenue), accent: true },
    { label: "Today's Revenue", value: formatINR(summary.todayRevenue) },
    { label: 'Total Orders', value: summary.orderCount },
    { label: 'Paid Orders', value: summary.paidOrderCount },
    { label: 'Products', value: summary.productCount },
    { label: 'Users', value: summary.userCount },
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-card-grid">
        {cards.map((card) => (
          <div key={card.label} className={`admin-stat-card${card.accent ? ' accent' : ''}`}>
            <span className="admin-stat-label">{card.label}</span>
            <span className="admin-stat-value">{card.value}</span>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Last 7 Days Revenue</h2>
          <span className="admin-card-subtitle">{formatINR(revenue?.total)}</span>
        </div>
        <RevenueChart points={revenue?.points} />
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Recent Orders</h2>
        {summary.recentOrders.length === 0 ? (
          <p className="section-message">No orders yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed At</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="admin-table-mono">{order.orderId}</td>
                    <td>{order.customerName}</td>
                    <td className="admin-table-strong">{formatINR(order.totalAmount)}</td>
                    <td>
                      <span className={STATUS_CLASSES[order.status] ?? 'order-status-badge'}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
