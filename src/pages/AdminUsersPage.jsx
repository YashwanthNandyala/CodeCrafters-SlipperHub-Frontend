import { useEffect, useState } from 'react'
import { FaUserShield } from 'react-icons/fa'
import { adminApi } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { formatDate } from '../utils/format.js'

export default function AdminUsersPage() {
  const { token, user: currentAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingChange, setPendingChange] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await adminApi.getUsers(token)
        if (!cancelled) setUsers(data)
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

  const requestChange = (user, role) => {
    if (role === user.role || user.id === currentAdmin.id) return
    setPendingChange({ user, role })
  }

  const confirmChange = async () => {
    if (!pendingChange) return
    const { user, role } = pendingChange
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await adminApi.updateUserRole(token, user.id, role)
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setSuccess(`Role of ${updated.fullName} changed to ${updated.role}.`)
      setPendingChange(null)
    } catch (err) {
      setError(err.message)
      setPendingChange(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading && users.length === 0) {
    return <p className="admin-loading">Loading users...</p>
  }

  return (
    <div className="admin-form-page">
      <div className="admin-card">
        <h2 className="admin-card-title">User Management</h2>
        <p className="section-message">Manage user roles. Your own role cannot be changed.</p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}

        {!loading && users.length === 0 && !error && (
          <p className="section-message">No users to show.</p>
        )}

        {users.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentAdmin.id
                  return (
                    <tr key={user.id} className={user.role === 'ADMIN' ? 'admin-row-admin' : undefined}>
                      <td>
                        <span className="admin-user-name-cell">
                          {user.role === 'ADMIN' && <FaUserShield aria-hidden="true" />}
                          {user.fullName}
                          {isSelf && <span className="admin-badge">you</span>}
                        </span>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>
                        <select
                          className="admin-role-select"
                          value={user.role}
                          onChange={(e) => requestChange(user, e.target.value)}
                          disabled={isSelf}
                          aria-label={`Role for ${user.fullName}`}
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <span
                          className={`role-badge ${user.role === 'ADMIN' ? 'admin' : 'customer'}`}
                        >
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {error && users.length > 0 && (
          <div className="admin-retry">
            <button type="button" className="secondary-button" onClick={retry}>
              Try again
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingChange)}
        title="Change user role?"
        message={
          pendingChange
            ? `Change the role of ${pendingChange.user.fullName} (${pendingChange.user.email}) from ${pendingChange.user.role} to ${pendingChange.role}?`
            : ''
        }
        confirmLabel="Change role"
        loading={saving}
        onConfirm={confirmChange}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  )
}
