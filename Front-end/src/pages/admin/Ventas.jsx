import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVentas } from '../../api/ventas.js'
import './admin.css'

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getVentas()
      .then((data) => {
        if (!activo) return
        setVentas(data)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudieron cargar las ventas.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const formatearFecha = (valor) => {
    if (!valor) return '—'
    return valor.split('T')[0]
  }

  const obtenerCliente = (venta) => {
    const attrs = venta?.attributes ?? venta
    const usuario = attrs?.users_permissions_user?.data ?? attrs?.users_permissions_user ?? null
    return usuario?.email ?? usuario?.username ?? '—'
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Ventas</h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-ventas">
          <span>Fecha</span>
          <span>Orden</span>
          <span>Cliente</span>
          <span>Monto</span>
          <span>Estado</span>
          <span></span>
        </div>
        {cargando && (
          <div className="admin-table-row admin-table-ventas">
            <span>—</span>
            <span>Cargando...</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && error && (
          <div className="admin-table-row admin-table-ventas">
            <span>—</span>
            <span>{error}</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && !error && ventas.length === 0 && (
          <div className="admin-table-row admin-table-ventas">
            <span>—</span>
            <span>Sin ventas</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando &&
          !error &&
          ventas.map((venta) => {
            const attrs = venta?.attributes ?? venta
            return (
              <div key={venta.id ?? attrs?.id} className="admin-table-row admin-table-ventas">
                <span>{formatearFecha(attrs?.fecha)}</span>
                <span>{attrs?.nroSeguimiento ? `#${attrs.nroSeguimiento}` : '—'}</span>
                <span>{obtenerCliente(venta)}</span>
                <span>{attrs?.total ? `$ ${Number(attrs.total).toLocaleString('es-AR')}` : '$ 0'}</span>
                <span>{attrs?.estado ?? '—'}</span>
                <Link
                  className="admin-detail-link"
                  to={`/admin/ventas/detalle/${venta.documentId ?? attrs?.documentId ?? venta.id ?? attrs?.id}`}
                >
                  Ver detalle
                </Link>
              </div>
            )
          })}
      </div>
      <div className="admin-pagination">
        <span>Anterior</span>
        <span>1</span>
        <span>Siguiente</span>
      </div>
    </div>
  )
}
