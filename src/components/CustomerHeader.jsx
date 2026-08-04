import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaBox,
  FaRegUserCircle,
  FaShoppingCart,
  FaSignOutAlt,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext.jsx'

export default function CustomerHeader({ userName, cartCount }) {
  const navigate = useNavigate()
  const { logout, logoutFromServer } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  const toggleMenu = () => {
    setLogoutError('')
    setMenuOpen((open) => !open)
  }

  const handleGoToOrders = () => {
    setMenuOpen(false)
    navigate('/orders')
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logoutFromServer()
    } catch (err) {
      if (err.status === 401) {
        logout()
      } else {
        setLogoutError(err.message || 'Could not log out. Please try again.')
        return
      }
    } finally {
      setLoggingOut(false)
    }
    setMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className="customer-header">
      <div className="customer-brand">
        <img
          src="/ShoesHub_logo.jpg"
          alt="ShoesHub logo"
          className="customer-logo"
        />
        <span className="customer-name">ShoesHub</span>
      </div>

      <div className="customer-actions">
        <span className="customer-user-name">{userName}</span>

        <div className="profile-menu" ref={menuRef}>
          <button
            type="button"
            className="icon-button"
            aria-label="Profile"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <FaRegUserCircle />
          </button>

          {menuOpen && (
            <div className="profile-dropdown" role="menu">
              <button
                type="button"
                className="profile-menu-item"
                role="menuitem"
                onClick={handleGoToOrders}
              >
                <FaBox />
                <span>My Orders</span>
              </button>
              <button
                type="button"
                className="profile-menu-item"
                role="menuitem"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <FaSignOutAlt />
                <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
              {logoutError && (
                <p className="profile-dropdown-error" role="alert">
                  {logoutError}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-button"
          aria-label="Cart"
          onClick={() => navigate('/cart')}
        >
          <FaShoppingCart />
          <span className="cart-badge">{cartCount}</span>
        </button>
      </div>
    </header>
  )
}
