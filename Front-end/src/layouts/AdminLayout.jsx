import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminHeader from '../components/Header/AdminHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminLayout() {
  const { rol, cargando, refrescarUsuario } = useAuth()
  const esAdmin = typeof rol === 'string' && rol.toLowerCase().includes('admin')
  const token = window.localStorage.getItem('strapiToken')
  const esperandoAuth = Boolean(token) && rol === 'guest'

  useEffect(() => {
    if (cargando) return
    if (!token) return
    if (esAdmin) return
    refrescarUsuario().catch(() => {})
  }, [cargando, token, esAdmin, refrescarUsuario])

  if (cargando || esperandoAuth) {
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
