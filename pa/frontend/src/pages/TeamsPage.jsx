import { useState, useEffect } from 'react'
import { teamsApi } from '../services/api'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTeam, setEditTeam] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', client_name: '' })

  const load = async () => {
    setLoading(true)
    try { const res = await teamsApi.getAll(); setTeams(res.data) }
    catch { toast.error('Failed to load teams') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditTeam(null); setForm({ name: '', description: '', client_name: '' }); setShowModal(true) }
  const openEdit = (t) => { setEditTeam(t); setForm(t); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Team name required')
    try {
      if (editTeam) { await teamsApi.update(editTeam.id, form); toast.success('Team updated') }
      else { await teamsApi.create(form); toast.success('Team created') }
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this team?')) return
    await teamsApi.delete(id); toast.success('Team deactivated'); load()
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Teams</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage production teams</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Team</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="card hover:border-brand-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(team)} className="text-[var(--text-muted)] hover:text-brand-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(team.id)} className="text-[var(--text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-[var(--text)]">{team.name}</h3>
              {team.client_name && <p className="text-xs text-brand-500 mt-0.5">Client: {team.client_name}</p>}
              {team.description && <p className="text-sm text-[var(--text-muted)] mt-2">{team.description}</p>}
            </div>
          ))}
          {teams.length === 0 && <div className="col-span-3 text-center py-12 text-[var(--text-muted)]">No teams yet</div>}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTeam ? 'Edit Team' : 'Create Team'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Client Name</label>
            <input className="input" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">{editTeam ? 'Update' : 'Create'}</button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
