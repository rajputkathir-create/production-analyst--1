import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/common/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductionPage from './pages/ProductionPage'
import UsersPage from './pages/UsersPage'
import TeamsPage from './pages/TeamsPage'
import TargetsPage from './pages/TargetsPage'
import ExcelImportPage from './pages/ExcelImportPage'
import SettingsPage from './pages/SettingsPage'
import ChangePasswordPage from './pages/ChangePasswordPage'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/production" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'member' ? '/production' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to={user?.role === 'member' ? '/production' : '/dashboard'} />} />
        <Route path="dashboard" element={<PrivateRoute roles={['super_admin','admin']}><DashboardPage /></PrivateRoute>} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="targets" element={<PrivateRoute roles={['super_admin','admin']}><TargetsPage /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute roles={['super_admin','admin']}><UsersPage /></PrivateRoute>} />
        <Route path="teams" element={<PrivateRoute roles={['super_admin','admin']}><TeamsPage /></PrivateRoute>} />
        <Route path="excel" element={<PrivateRoute roles={['super_admin','admin','tl']}><ExcelImportPage /></PrivateRoute>} />
        <Route path="settings" element={<PrivateRoute roles={['super_admin','admin']}><SettingsPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' },
          success: { iconTheme: { primary: '#17b374', secondary: '#fff' } }
        }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
