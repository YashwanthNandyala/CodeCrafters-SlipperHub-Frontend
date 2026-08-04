import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const justRegistered = searchParams.get('registered')
  const isAdminMode = searchParams.get('mode') === 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const nextErrors = {}
    if (!identifier.trim()) {
      nextErrors.identifier = 'Email or phone number is required.'
    }
    if (!password) {
      nextErrors.password = 'Password is required.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const response = await login(identifier.trim(), password)
      if (isAdminMode) {
        if (response.role !== 'ADMIN') {
          logout()
          setServerError('Only admin accounts can access the admin panel.')
        } else {
          navigate('/admin', { replace: true })
        }
      } else {
        navigate(response.role === 'ADMIN' ? '/admin' : '/customer-home', { replace: true })
      }
    } catch (err) {
      if (err.status === 401) {
        setServerError('Incorrect credentials')
      } else {
        setServerError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">{isAdminMode ? 'Admin Login' : 'Login'}</h1>
        <p className="auth-subtitle">
          {isAdminMode
            ? 'Sign in with an admin account to manage the store'
            : 'Enter your credentials to continue'}
        </p>

        <form className="registration-form" onSubmit={handleSubmit} noValidate>
          {justRegistered && (
            <p className="success-message" role="status">
              Account created! You can now sign in.
            </p>
          )}

          <div className="form-field">
            <label htmlFor="identifier">Email or Phone Number</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.identifier) || undefined}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
              className={errors.identifier ? 'input-error' : undefined}
            />
            {errors.identifier && (
              <p id="identifier-error" className="error-message" role="alert">
                {errors.identifier}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.password) || undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={errors.password ? 'input-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="error-message" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {serverError && (
            <p className="error-message" role="alert">
              {serverError}
            </p>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Signing in...' : isAdminMode ? 'Admin Login' : 'Login'}
          </button>
        </form>

        {isAdminMode ? (
          <p className="auth-switch">
            Looking for customer access? <Link to="/login">Customer login</Link>
          </p>
        ) : (
          <p className="auth-switch">
            Are you an admin? <Link to="/login?mode=admin">Admin login</Link>
          </p>
        )}
        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </main>
  )
}
