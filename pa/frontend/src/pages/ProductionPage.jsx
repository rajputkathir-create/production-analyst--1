import { useState, useEffect, useCallback } from 'react'
import { productionApi, teamsApi, usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const initialForm = { team_id: '', team_name: '', user_id: '', user_name: '', client_name: '', date: new Date().toISOString().split('T')[0], production_value: '', target_value: '', notes: '' }

export default function ProductionPage() {
  const { user, isTLOrAbove, isAdminOrAbove } = useAuth()
  const [entries, setEntries] = useState([])
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState({ team_id: '', user_id: '', date_from: '', date_to: '', date_single: '' })
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await productionApi.getAll(params)
      setEntries(res.data)
    } catch { toast.error('Failed to load production data') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => {
    teamsApi.getAll().then(r => setTeams(r.data))
    if (isAdminOrAbove()) usersApi.getAll({}).then(r => setUsers(r.data))
    load()
  }, [])

  useEffect(() => { load() }, [load])

  const handleTeamSelect = async (teamId) => {
    const team = teams.find(t => t.id === teamId)
    setForm(f => ({ ...f, team_id: teamId, team_name: team?.name || '', user_id: '', user_name: '' }))
    if (teamId) {
      const res = await teamsApi.getMembers(teamId)
      setUsers(res.data)
    }
  }

  const handleUserSelect = (userId) => {
    const u = users.find(u => u.id === userId)
    setForm(f => ({ ...f, user_id: userId, user_name: u?.full_name || '' }))
  }

  const openAdd = () => {
    setEditEntry(null)
    const defaultTeam = user.role === 'tl' ? { team_id: user.team_id, team_name: user.team_name } : {}
    setForm({ ...initialForm, ...defaultTeam })
    setShowModal(true)
    if (user.role === 'tl' && user.team_id) handleTeamSelect(user.team_id)
  }

  const openEdit = (entry) => { setEditEntry(entry); setForm({ ...entry, production_value: entry.production_value, target_value: entry.target_value }); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.team_id || !form.user_id || !form.production_value || !form.date) return toast.error('Please fill required fields')
    try {
      if (editEntry) {
        await productionApi.update(editEntry.id, { production_value: +form.production_value, target_value: +form.target_value, client_name: form.client_name, notes: form.notes })
        toast.success('Entry updated')
      } else {
        await productionApi.create({ ...form, production_value: +form.production_value, target_value: +form.target_value })
        toast.success('Entry added')
      }
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    await productionApi.delete(id)
    toast.success('Entry deleted')
    load()
  }

  const pctColor = (p) => p >= 100 ? 'badge-green' : p >= 80 ? 'badge-amber' : 'badge-red'

  const filtered = entries.filter(e =>
    e.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.team_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Production</h1>
          <p className="text-sm text-[var(--text-muted)]">Track and manage production entries</p>
        </div>
        {isTLOrAbove() && <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Entry</button>}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input className="input pl-9" placeholder="Search users, teams..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {isAdminOrAbove() && <>
            <div>
              <label className="label">Team</label>
              <select className="input" value={filters.team_id} onChange={e => setFilters(f => ({ ...f, team_id: e.target.value }))}>
                <option value="">All Teams</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </>}
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={filters.date_single} onChange={e => setFilters(f => ({ ...f, date_single: e.target.value, date_from: '', date_to: '' }))} />
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, date_single: '' }))} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, date_single: '' }))} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
              <tr>
                {['Date','Team','User','Client','Production','Target','%','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">No production entries found</td></tr>
              ) : filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-[var(--bg)] transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">{entry.date}</td>
                  <td className="px-4 py-3 text-sm">{entry.team_name}</td>
                  <td className="px-4 py-3 text-sm font-medium">{entry.user_name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{entry.client_name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{entry.production_value?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-mono">{entry.target_value?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={pctColor(entry.production_percentage)}>{entry.production_percentage}%</span>
                  </td>
                  <td className="px-4 py-3">
                    {isTLOrAbove() && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(entry)} className="text-[var(--text-muted)] hover:text-brand-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdminOrAbove() && (
                          <button onClick={() => handleDelete(entry.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            Showing {filtered.length} entries
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editEntry ? 'Edit Entry' : 'Add Production Entry'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Team *</label>
              <select className="input" value={form.team_id} onChange={e => handleTeamSelect(e.target.value)} disabled={user.role === 'tl'}>
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">User *</label>
              <select className="input" value={form.user_id} onChange={e => handleUserSelect(e.target.value)}>
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Client Name</label>
              <input className="input" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Production Value *</label>
              <input type="number" className="input" value={form.production_value} onChange={e => setForm(f => ({ ...f, production_value: e.target.value }))} />
            </div>
            <div>
              <label className="label">Target Value</label>
              <input type="number" className="input" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
          </div>
          {form.production_value && form.target_value && (
            <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-lg text-sm">
              Calculated Percentage: <strong className="text-brand-500">{((+form.production_value / +form.target_value) * 100).toFixed(2)}%</strong>
            </div>
          )}
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">{editEntry ? 'Update' : 'Save Entry'}</button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
