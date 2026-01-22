import { Navigate, Outlet } from 'react-router-dom'
import AdminHeader from '../components/Header/AdminHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminLayout() {
  const { rol } = useAuth()

  if (rol !== 'admin') {
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
