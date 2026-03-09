import { useState, useEffect } from 'react'
import { settingsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Moon, Sun, Bell, Shield, Users, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const PERMISSIONS = {
  admin: { label: 'Admin', permissions: ['dashboard', 'users', 'teams', 'production', 'targets', 'settings', 'excel'] },
  tl: { label: 'Team Leader', permissions: ['production', 'excel'] },
  member: { label: 'Member', permissions: ['production_view'] },
}
const ALL_FEATURES = ['dashboard', 'users', 'teams', 'production', 'targets', 'settings', 'excel', 'production_view']

export default function SettingsPage() {
  const { theme, toggleTheme } = useAuth()
  const [settings, setSettings] = useState(null)
  const [rolePerms, setRolePerms] = useState(PERMISSIONS)
  const [notifs, setNotifs] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi.get().then(r => {
      setSettings(r.data)
      setNotifs(r.data.notifications_enabled ?? true)
      if (r.data.role_permissions) {
        setRolePerms(prev => {
          const updated = { ...prev }
          Object.entries(r.data.role_permissions).forEach(([role, perms]) => {
            if (updated[role]) updated[role] = { ...updated[role], permissions: perms }
          })
          return updated
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const togglePerm = (role, feature) => {
    setRolePerms(prev => {
      const perms = prev[role].permissions
      const newPerms = perms.includes(feature) ? perms.filter(p => p !== feature) : [...perms, feature]
      return { ...prev, [role]: { ...prev[role], permissions: newPerms } }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const role_permissions = {}
      Object.entries(rolePerms).forEach(([role, data]) => { role_permissions[role] = data.permissions })
      await settingsApi.update({ notifications_enabled: notifs, role_permissions })
      toast.success('Settings saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">System configuration and preferences</p>
      </div>

      {/* Theme */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-500" /> : <Sun className="w-4 h-4 text-brand-500" />}
          </div>
          <h3 className="font-semibold text-[var(--text)]">Theme Settings</h3>
        </div>
        <div className="flex gap-3">
          {['dark', 'light'].map(t => (
            <button key={t} onClick={() => theme !== t && toggleTheme()}
              className={`flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === t ? 'border-brand-500 bg-brand-500/5' : 'border-[var(--border)] hover:border-brand-500/30'}`}>
              {t === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span className="text-sm font-medium capitalize">{t} Mode</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-brand-500" />
          </div>
          <h3 className="font-semibold text-[var(--text)]">Notification Settings</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Enable Notifications</p>
            <p className="text-xs text-[var(--text-muted)]">System alerts and production updates</p>
          </div>
          <button onClick={() => setNotifs(n => !n)}
            className={`relative w-11 h-6 rounded-full transition-colors ${notifs ? 'bg-brand-500' : 'bg-[var(--border)]'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Role Permissions */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">Role Permission Management</h3>
            <p className="text-xs text-[var(--text-muted)]">Configure feature access per role</p>
          </div>
        </div>
        <div className="space-y-6">
          {Object.entries(rolePerms).map(([role, data]) => (
            <div key={role}>
              <p className="text-sm font-medium text-[var(--text)] mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />{data.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_FEATURES.map(feature => (
                  <label key={feature} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${data.permissions.includes(feature) ? 'border-brand-500/50 bg-brand-500/5' : 'border-[var(--border)] hover:border-brand-500/30'}`}>
                    <input type="checkbox" className="accent-brand-500" checked={data.permissions.includes(feature)}
                      onChange={() => togglePerm(role, feature)} />
                    <span className="text-xs capitalize">{feature.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary py-2.5 px-6" disabled={saving}>
        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
