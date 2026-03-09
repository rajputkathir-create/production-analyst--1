import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) return toast.error('Passwords do not match')
    if (form.new_password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await authApi.changePassword(form)
      toast.success('Password changed successfully! Please log in again.')
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md card animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--text)]">Change Password Required</h2>
            <p className="text-xs text-[var(--text-muted)]">Please set a new password for your account</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['current_password', 'new_password', 'confirm_password'].map(field => (
            <div key={field}>
              <label className="label">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input className="input pl-9" type="password" value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            </div>
          ))}
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
