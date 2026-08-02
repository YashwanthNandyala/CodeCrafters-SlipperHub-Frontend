import { useState } from 'react'
import { registerUser } from '../services/registrationApi.js'

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function validateField(name, value, form) {
  switch (name) {
    case 'fullName':
      return value.trim() ? '' : 'Full name is required.'
    case 'email':
      if (!value.trim()) return 'Email is required.'
      return /^\S+@\S+\.\S+$/.test(value.trim())
        ? ''
        : 'Enter a valid email address.'
    case 'phone':
      if (!value.trim()) return 'Phone number is required.'
      return /^\d{10}$/.test(value.trim())
        ? ''
        : 'Phone must contain exactly 10 digits.'
    case 'password':
      return value.length >= 8
        ? ''
        : 'Password must contain at least 8 characters.'
    case 'confirmPassword':
      if (!value) return 'Please confirm your password.'
      return value === form.password ? '' : 'Passwords do not match.'
    default:
      return ''
  }
}

function validateForm(form) {
  const errors = {}
  for (const field of Object.keys(form)) {
    const message = validateField(field, form[field], form)
    if (message) errors[field] = message
  }
  return errors
}

const FIELDS = [
  { name: 'fullName', label: 'Full name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'numeric',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    autoComplete: 'new-password',
  },
]

export default function RegistrationForm({ onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)
    setSubmitted(false)
    setServerError('')

    const message = validateField(name, value, nextForm)
    setErrors((prev) => {
      const next = { ...prev }
      if (message) next[name] = message
      else delete next[name]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSubmitted(false)

    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      }
      await registerUser(payload)
      setForm(EMPTY_FORM)
      setErrors({})
      setSubmitted(true)
      onSuccess?.()
    } catch (err) {
      if (err.status === 400) {
        const fieldErrors = err.data?.message
        if (fieldErrors && typeof fieldErrors === 'object') {
          setErrors(fieldErrors)
          setServerError('Please correct the highlighted fields.')
        } else {
          setServerError('Please correct the highlighted fields and try again.')
        }
      } else if (err.status === 409) {
        setServerError(
          err.data?.message ??
            'That email or phone is already registered.',
        )
      } else {
        setServerError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit} noValidate>
      {FIELDS.map((field) => {
        const errorId = `${field.name}-error`
        const hasError = Boolean(errors[field.name])
        return (
          <div className="form-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              value={form[field.name]}
              onChange={handleChange}
              disabled={loading}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? errorId : undefined}
              className={hasError ? 'input-error' : undefined}
            />
            {hasError && (
              <p id={errorId} className="error-message" role="alert">
                {errors[field.name]}
              </p>
            )}
          </div>
        )
      })}

      {serverError && (
        <p className="error-message" role="alert">
          {serverError}
        </p>
      )}

      {submitted && (
        <p className="success-message" role="status">
          Registration successful! Your account has been created.
        </p>
      )}

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  )
}
