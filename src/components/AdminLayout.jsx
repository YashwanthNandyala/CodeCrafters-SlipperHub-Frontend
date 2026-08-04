import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaCalendarAlt,
  FaCalendarCheck,
  FaCalendarDay,
  FaChartLine,
  FaHome,
  FaPlus,
  FaSignOutAlt,
  FaTimes,
  FaTrashAlt,
  FaUsers,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: <FaHome />, end: true },
  { to: '/admin/add-product', label: 'Add Product', icon: <FaPlus /> },
  { to: '/admin/delete-product', label: 'Delete Product', icon: <FaTrashAlt /> },
  { to: '/admin/users', label: 'User Management', icon: <FaUsers /> },
  { to: '/admin/revenue/daily', label: 'Daily Revenue', icon: <FaCalendarDay /> },
  { to: '/admin/revenue/monthly', label: 'Monthly Revenue', icon: <FaCalendarAlt /> },
  { to: '/admin/revenue/yearly', label: 'Yearly Revenue', icon: <FaCalendarCheck /> },
  { to: '/admin/revenue/overall', label: 'Overall Revenue', icon: <FaChartLine /> },
]

const TITLES = {
  '/admin': 'Dashboard',
  '/admin/add-product': 'Add Product',
  '/admin/delete-product': 'Delete Product',
  '/admin/users': 'User Management',
  '/admin/revenue/daily': 'Daily Revenue',
  '/admin/revenue/monthly': 'Monthly Revenue',
  '/admin/revenue/yearly': 'Yearly Revenue',
  '/admin/revenue/overall': 'Overall Revenue',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, logoutFromServer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = TITLES[location.pathname] ?? 'Admin'

  const closeSidebar = () => setSidebarOpen(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutFromServer()
    } catch {
      // Session is cleared locally regardless of server response.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-icon">A</span>
          <span className="admin-brand-name">Admin Panel</span>
          <button
            type="button"
            className="admin-close-button"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'admin-nav-item active' : 'admin-nav-item'
              }
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-user-name">{user?.fullName}</p>
          <button
            type="button"
            className="admin-nav-item admin-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span className="admin-nav-icon">
              <FaSignOutAlt />
            </span>
            <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <FaBars />
          </button>
          <h1 className="admin-topbar-title">{pageTitle}</h1>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
