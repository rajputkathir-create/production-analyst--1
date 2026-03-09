import { useState, useEffect } from 'react'
import { targetsApi, teamsApi, usersApi } from '../services/api'
import { Plus, Edit2, Trash2, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const initForm = { team_id: '', team_name: '', user_id: '', user_name: '', target_value: '', period: 'daily', effective_date: '' }

export default function TargetsPage() {
  const [targets, setTargets] = useState([])
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(initForm)

  const load = async () => {
    setLoading(true)
    try {
      const [tr, tmr] = await Promise.all([targetsApi.getAll({}), teamsApi.getAll()])
      setTargets(tr.data); setTeams(tmr.data)
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleTeamSelect = async (tid) => {
    const team = teams.find(t => t.id === tid)
    setForm(f => ({ ...f, team_id: tid, team_name: team?.name || '', user_id: '', user_name: '' }))
    if (tid) { const r = await teamsApi.getMembers(tid); setUsers(r.data) }
    else { const r = await usersApi.getAll({}); setUsers(r.data) }
  }

  const openAdd = () => { setEditTarget(null); setForm(initForm); setShowModal(true) }
  const openEdit = (t) => { setEditTarget(t); setForm(t); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.target_value) return toast.error('Target value required')
    try {
      if (editTarget) { await targetsApi.update(editTarget.id, { target_value: +form.target_value, period: form.period, effective_date: form.effective_date }); toast.success('Updated') }
      else { await targetsApi.create({ ...form, target_value: +form.target_value }); toast.success('Target set') }
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this target?')) return
    await targetsApi.delete(id); toast.success('Deleted'); load()
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Targets</h1>
          <p className="text-sm text-[var(--text-muted)]">Set production targets for teams and users</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Set Target</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
              <tr>
                {['Team','User','Target Value','Period','Effective Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">Loading...</td></tr>
              : targets.map(t => (
                <tr key={t.id} className="hover:bg-[var(--bg)]">
                  <td className="px-4 py-3 text-sm">{t.team_name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{t.user_name || 'All Users'}</td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-brand-500">{t.target_value?.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="badge-blue capitalize">{t.period}</span></td>
                  <td className="px-4 py-3 text-sm font-mono">{t.effective_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="text-[var(--text-muted)] hover:text-brand-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="text-[var(--text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && targets.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">No targets set</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Target' : 'Set Target'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Team</label>
            <select className="input" value={form.team_id} onChange={e => handleTeamSelect(e.target.value)}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">User</label>
            <select className="input" value={form.user_id} onChange={e => {
              const u = users.find(u => u.id === e.target.value)
              setForm(f => ({ ...f, user_id: e.target.value, user_name: u?.full_name || '' }))
            }}>
              <option value="">All Users in Team</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Value *</label>
              <input type="number" className="input" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
            <div>
              <label className="label">Period</label>
              <select className="input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                {['daily','weekly','monthly'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Effective Date</label>
            <input type="date" className="input" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">{editTarget ? 'Update' : 'Set Target'}</button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
