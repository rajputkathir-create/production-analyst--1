import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, ClipboardList, Users, Building2, Target, Upload, Settings, LogOut, Moon, Sun, Activity, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin'] },
  { to: '/production', icon: ClipboardList, label: 'Production', roles: ['super_admin', 'admin', 'tl', 'member'] },
  { to: '/targets', icon: Target, label: 'Targets', roles: ['super_admin', 'admin'] },
  { to: '/teams', icon: Building2, label: 'Teams', roles: ['super_admin', 'admin'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['super_admin', 'admin'] },
  { to: '/excel', icon: Upload, label: 'Excel Import', roles: ['super_admin', 'admin', 'tl'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin', 'admin'] },
]

const roleColors = { super_admin: 'badge-red', admin: 'badge-blue', tl: 'badge-amber', member: 'badge-green' }
const roleLabels = { super_admin: 'Super Admin', admin: 'Admin', tl: 'Team Leader', member: 'Member' }

export default function Layout() {
  const { user, logout, theme, toggleTheme } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const allowed = navItems.filter(item => item.roles.includes(user?.role))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-wide text-[var(--text)]">PRODUCTION</div>
              <div className="font-display font-bold text-sm tracking-wider text-brand-500">ANALYST</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowed.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500 font-bold text-xs">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-[var(--text)]">{user?.full_name}</div>
              <span className={`text-xs ${roleColors[user?.role]}`}>{roleLabels[user?.role]}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button onClick={handleLogout} className="btn-danger flex-1 justify-center py-1.5 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
          <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-display font-bold text-brand-500">PRODUCTION ANALYST</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
