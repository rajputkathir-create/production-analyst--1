import { useState, useEffect } from 'react'
import { usersApi, teamsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Edit2, Trash2, Key, Search, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const ROLES = ['member', 'tl', 'admin', 'super_admin']
const roleColors = { super_admin: 'badge-red', admin: 'badge-blue', tl: 'badge-amber', member: 'badge-green' }
const roleLabels = { super_admin: 'Super Admin', admin: 'Admin', tl: 'Team Leader', member: 'Member' }

const initForm = { username: '', full_name: '', email: '', password: '', role: 'member', team_id: '', team_name: '' }

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [form, setForm] = useState(initForm)
  const [resetForm, setResetForm] = useState({ new_password: '', confirm_password: '' })
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [ur, tr] = await Promise.all([usersApi.getAll({}), teamsApi.getAll()])
      setUsers(ur.data)
      setTeams(tr.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditUser(null); setForm(initForm); setShowModal(true) }
  const openEdit = (u) => { setEditUser(u); setForm({ ...u, password: '' }); setShowModal(true) }
  const openReset = (u) => { setResetUser(u); setResetForm({ new_password: '', confirm_password: '' }); setShowResetModal(true) }

  const handleTeamSelect = (tid) => {
    const team = teams.find(t => t.id === tid)
    setForm(f => ({ ...f, team_id: tid, team_name: team?.name || '' }))
  }

  const handleSubmit = async () => {
    if (!editUser && (!form.username || !form.password || !form.full_name)) return toast.error('Fill required fields')
    try {
      if (editUser) {
        const { password, username, ...updateData } = form
        await usersApi.update(editUser.id, updateData)
        toast.success('User updated')
      } else {
        await usersApi.create(form)
        toast.success('User created')
      }
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleReset = async () => {
    if (!resetForm.new_password || resetForm.new_password !== resetForm.confirm_password) return toast.error('Passwords do not match')
    try {
      await usersApi.resetPassword(resetUser.id, resetForm)
      toast.success('Password reset successfully')
      setShowResetModal(false)
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleToggleActive = async (u) => {
    await usersApi.update(u.id, { is_active: !u.is_active })
    toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`)
    load()
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.full_name}?`)) return
    try { await usersApi.delete(u.id); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Users</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage team members and access</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add User</button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input className="input pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
              <tr>
                {['Name','Username','Email','Role','Team','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">Loading...</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className={`hover:bg-[var(--bg)] transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500 text-xs font-bold">
                        {u.full_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--text-muted)]">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{u.email || '—'}</td>
                  <td className="px-4 py-3"><span className={roleColors[u.role]}>{roleLabels[u.role]}</span></td>
                  <td className="px-4 py-3 text-sm">{u.team_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.username !== 'SUPERADMIN' && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} title="Edit" className="text-[var(--text-muted)] hover:text-brand-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => openReset(u)} title="Reset Password" className="text-[var(--text-muted)] hover:text-amber-500 transition-colors"><Key className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'} className="text-[var(--text-muted)] hover:text-blue-500 transition-colors">
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {currentUser?.role === 'super_admin' && (
                          <button onClick={() => handleDelete(u)} title="Delete" className="text-[var(--text-muted)] hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Create User'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Username *</label>
              <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} disabled={!!editUser} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.filter(r => currentUser?.role === 'super_admin' || r !== 'super_admin').map(r => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Team</label>
            <select className="input" value={form.team_id} onChange={e => handleTeamSelect(e.target.value)}>
              <option value="">No Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {!editUser && (
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">{editUser ? 'Update' : 'Create User'}</button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Reset password for <strong>{resetUser?.full_name}</strong></p>
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" value={resetForm.new_password} onChange={e => setResetForm(f => ({ ...f, new_password: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" value={resetForm.confirm_password} onChange={e => setResetForm(f => ({ ...f, confirm_password: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleReset} className="btn-primary flex-1 justify-center">Reset Password</button>
            <button onClick={() => setShowResetModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
