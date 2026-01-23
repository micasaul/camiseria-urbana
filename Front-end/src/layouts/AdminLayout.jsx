import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminHeader from '../components/Header/AdminHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminLayout() {
  const { rol, cargando, refrescarUsuario } = useAuth()
  const esAdmin = typeof rol === 'string' && rol.toLowerCase().includes('admin')
  const token = window.localStorage.getItem('strapiToken')
  const esperandoRol = Boolean(token) && rol === 'guest'
  const [reintento, setReintento] = useState(false)

  useEffect(() => {
    if (cargando) return
    if (!token) return
    if (esAdmin) return
    if (reintento) return

    refrescarUsuario()
      .catch(() => {})
      .finally(() => setReintento(true))
  }, [cargando, token, esAdmin, reintento, refrescarUsuario])

  if (cargando || esperandoRol || (token && !esAdmin && !reintento)) {
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
