import { Navigate, Outlet } from 'react-router-dom'
import AdminHeader from '../components/Header/AdminHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminLayout() {
  const { rol, cargando } = useAuth()
  const esAdmin = typeof rol === 'string' && rol.toLowerCase().includes('admin')

  if (cargando) {
    return null
  }

  if (!esAdmin) {
    return <Navigate to="/error" replace />
  }

  return (
    <div className="layout admin-layout">
      <AdminHeader />
      <main className="content admin-content">
        <Outlet />
      </main>
    </div>
  )
}
