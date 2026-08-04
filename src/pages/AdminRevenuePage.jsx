import { useEffect, useState } from 'react'
import { adminApi } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'
import RevenueChart from '../components/RevenueChart.jsx'
import { formatINR } from '../utils/format.js'

const MODE_META = {
  daily: {
    title: 'Daily Revenue',
    subtitle: 'Revenue from successful payments each day.',
    fetch: (token, days) => adminApi.getDailyRevenue(token, days),
    ranges: [
      { label: '7 days', value: 7 },
      { label: '30 days', value: 30 },
      { label: '90 days', value: 90 },
    ],
    defaultRange: 7,
  },
  monthly: {
    title: 'Monthly Revenue',
    subtitle: 'Revenue from successful payments each month.',
    fetch: (token, months) => adminApi.getMonthlyRevenue(token, months),
    ranges: [
      { label: '6 months', value: 6 },
      { label: '12 months', value: 12 },
      { label: '24 months', value: 24 },
    ],
    defaultRange: 12,
  },
  yearly: {
    title: 'Yearly Revenue',
    subtitle: 'Revenue from successful payments each year.',
    fetch: (token) => adminApi.getYearlyRevenue(token),
    ranges: null,
    defaultRange: null,
  },
  overall: {
    title: 'Overall Revenue',
    subtitle: 'Aggregate revenue across all successful payments.',
    fetch: (token) => adminApi.getOverallRevenue(token),
    ranges: null,
    defaultRange: null,
  },
}

export default function AdminRevenuePage({ mode }) {
  const { token } = useAuth()
  const meta = MODE_META[mode] ?? MODE_META.overall
  const [range, setRange] = useState(meta.defaultRange)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await meta.fetch(token, range)
        if (!cancelled) setData(result)
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
  }, [meta, token, range])

  if (mode === 'overall') {
    const cards = [
      { label: 'Total Revenue', value: formatINR(data?.totalRevenue) },
      { label: 'Total Orders', value: data?.totalOrders ?? 0 },
      { label: 'Paid Orders', value: data?.paidOrders ?? 0 },
      { label: 'Average Order Value', value: formatINR(data?.averageOrderValue) },
    ]

    return (
      <div className="admin-dashboard">
        {loading && !data ? (
          <p className="admin-loading">Loading revenue...</p>
        ) : (
          <>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="admin-card-grid">
              {cards.map((card) => (
                <div key={card.label} className="admin-stat-card accent">
                  <span className="admin-stat-label">{card.label}</span>
                  <span className="admin-stat-value">{card.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">{meta.title}</h2>
            <p className="section-message">{meta.subtitle}</p>
          </div>
          {meta.ranges && (
            <div className="admin-range-switch" role="group" aria-label={`${meta.title} range`}>
              {meta.ranges.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={range === option.value ? 'active' : undefined}
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && !data ? (
          <p className="admin-loading">Loading revenue...</p>
        ) : error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : (
          <>
            <div className="admin-card-header">
              <span className="admin-stat-label">Total in selected period</span>
              <span className="admin-total-value">{formatINR(data?.total)}</span>
            </div>
            <RevenueChart points={data?.points} />
          </>
        )}
      </div>
    </div>
  )
}
