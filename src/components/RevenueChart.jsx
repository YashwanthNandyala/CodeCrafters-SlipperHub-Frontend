import { useMemo } from 'react'
import { formatINR } from '../utils/format.js'

const WIDTH = 720
const PAD = 8
const TOP = 22

export default function RevenueChart({ points, height = 260 }) {
  const chart = useMemo(() => {
    const list = Array.isArray(points) ? points : []
    const base = height - 30
    const amounts = list.map((point) => Number(point?.amount) || 0)
    const max = Math.max(...amounts, 1)
    const count = list.length
    const step = (WIDTH - PAD * 2) / Math.max(count, 1)
    const barWidth = Math.max(6, step * 0.55)
    const labelEvery = count > 16 ? Math.ceil(count / 10) : 1

    const bars = list.map((point, index) => {
      const value = amounts[index]
      const barHeight = (value / max) * (base - TOP)
      const x = PAD + index * step + (step - barWidth) / 2
      const y = base - barHeight
      return {
        x,
        y,
        barWidth,
        barHeight,
        value,
        label: point?.label ?? '',
        showLabel: index % labelEvery === 0,
      }
    })

    return { bars, base, count }
  }, [points, height])

  if (chart.count === 0) {
    return <p className="section-message">No revenue data available.</p>
  }

  return (
    <div className="revenue-chart" style={{ height }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label="Revenue chart"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={PAD}
          y1={chart.base}
          x2={WIDTH - PAD}
          y2={chart.base}
          className="revenue-chart-baseline"
        />
        {chart.bars.map((bar, index) => (
          <g key={`${bar.label}-${index}`}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.barWidth}
              height={Math.max(bar.barHeight, 2)}
              rx="3"
              className="revenue-chart-bar"
            />
            {bar.value > 0 && (
              <text
                x={bar.x + bar.barWidth / 2}
                y={bar.y - 4}
                textAnchor="middle"
                className="revenue-chart-value"
              >
                {formatINR(bar.value)}
              </text>
            )}
            {bar.showLabel && (
              <text
                x={bar.x + bar.barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                className="revenue-chart-label"
              >
                {bar.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
