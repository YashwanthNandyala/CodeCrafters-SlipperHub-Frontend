import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="app">
      <h1>Registration App</h1>
      {location.state?.loggedIn && (
        <p className="success-message" role="status">
          Successfully logged in
        </p>
      )}
      <div className="home-card">
        <h2>Welcome, {user.fullName}!</h2>
        <p className="home-info">Email: {user.email}</p>
        <p className="home-info">Role: {user.role}</p>
        <p className="home-info">User ID: {user.id}</p>
        <button
          type="button"
          className="submit-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
