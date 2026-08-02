import { Link, useNavigate } from 'react-router-dom'
import RegistrationForm from '../components/RegistrationForm.jsx'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Create Account</h1>
        <p className="auth-subtitle">Enter your details to create your account</p>

        <RegistrationForm onSuccess={() => navigate('/login?registered=1')} />

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  )
}
