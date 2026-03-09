import { useState, useEffect, useCallback } from 'react'
import { dashboardApi, teamsApi, usersApi } from '../services/api'
import { TrendingUp, Users, Target, Activity, BarChart2, RefreshCw } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#17b374', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = { brand: 'text-brand-500 bg-brand-500/10', blue: 'text-blue-500 bg-blue-500/10', amber: 'text-amber-500 bg-amber-500/10', red: 'text-red-500 bg-red-500/10' }
  return (
    <div className="card hover:border-brand-500/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold font-display text-[var(--text)] mt-1">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ team_id: '', user_id: '', date_from: '', date_to: '', date_single: '' })

  const loadTeams = async () => {
    const res = await teamsApi.getAll()
    setTeams(res.data)
  }

  const loadUsers = async (teamId) => {
    if (teamId) {
      const res = await usersApi.getAll({ team_id: teamId })
      setUsers(res.data)
    } else {
      const res = await usersApi.getAll({})
      setUsers(res.data)
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await dashboardApi.getSummary(params)
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { loadTeams(); loadUsers('') }, [])
  useEffect(() => { loadData() }, [loadData])

  const handleTeamChange = (e) => {
    const teamId = e.target.value
    setFilters(f => ({ ...f, team_id: teamId, user_id: '' }))
    loadUsers(teamId)
  }

  const s = data?.summary || {}

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="card text-xs p-3 shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>)}
      </div>
    )
    return null
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Production analytics & performance overview</p>
        </div>
        <button onClick={loadData} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-sm font-medium text-[var(--text)] mb-4">Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Team</label>
            <select className="input" value={filters.team_id} onChange={handleTeamChange}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">User</label>
            <select className="input" value={filters.user_id} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))}>
              <option value="">All Users</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date (Single)</label>
            <input type="date" className="input" value={filters.date_single}
              onChange={e => setFilters(f => ({ ...f, date_single: e.target.value, date_from: '', date_to: '' }))} />
          </div>
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input" value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, date_single: '' }))} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input" value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, date_single: '' }))} />
          </div>
        </div>
        <button onClick={() => setFilters({ team_id: '', user_id: '', date_from: '', date_to: '', date_single: '' })}
          className="btn-secondary text-xs mt-3">Clear Filters</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Activity} label="Total Entries" value={s.total_entries || 0} color="brand" />
            <StatCard icon={TrendingUp} label="Total Production" value={(s.total_production || 0).toLocaleString()} color="blue" />
            <StatCard icon={Target} label="Total Target" value={(s.total_target || 0).toLocaleString()} color="amber" />
            <StatCard icon={BarChart2} label="Avg Performance" value={`${s.avg_percentage || 0}%`} color={(s.avg_percentage || 0) >= 80 ? 'brand' : 'red'} />
            <StatCard icon={Users} label="Teams" value={s.teams_count || 0} color="blue" />
            <StatCard icon={Users} label="Users" value={s.users_count || 0} color="amber" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-[var(--text)] mb-4">Daily Production Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data?.daily_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="production" stroke="#17b374" name="Production" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="target" stroke="#f59e0b" name="Target" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-[var(--text)] mb-4">Performance % by Day</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.daily_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 150]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" name="%" fill="#17b374" radius={[4, 4, 0, 0]}
                    label={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-[var(--text)] mb-4">Team Performance</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.team_performance || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 120]} />
                  <YAxis type="category" dataKey="team_name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" name="Performance %" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-[var(--text)] mb-4">Top 10 Performers</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(data?.top_performers || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs font-mono text-[var(--text-muted)] w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate">{p.user_name}</span>
                        <span className="text-xs font-medium ml-2 text-brand-500">{p.percentage}%</span>
                      </div>
                      <div className="w-full bg-[var(--border)] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-brand-500 transition-all"
                          style={{ width: `${Math.min(p.percentage, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.top_performers?.length) && <p className="text-[var(--text-muted)] text-sm text-center py-8">No data available</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
