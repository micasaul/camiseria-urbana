import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVentas } from '../../api/ventas.js'
import { formatearFecha, obtenerClienteVenta } from '../../utils/adminHelpers.js'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import './admin.css'

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [paginacion, setPaginacion] = useState({ page: 1, pageSize: 10, pageCount: 1, total: 0 })

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    
    getVentas(paginacion.page, paginacion.pageSize)
      .then((data) => {
        if (!activo) return
        setVentas(data.items)
        setPaginacion(prev => ({ 
          ...prev, 
          pageCount: data.pagination.pageCount,
          total: data.pagination.total
        }))
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
  }, [paginacion.page])

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, page: nuevaPagina }))
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Ventas</h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-ventas">
          <span>Fecha</span>
          <span className="admin-venta-orden">Orden</span>
          <span className="admin-venta-cliente">Cliente</span>
          <span>Monto</span>
          <span>Estado</span>
          <span></span>
        </div>
        {cargando && (
          <div className="admin-table-row admin-table-ventas">
            <span>—</span>
            <span className="admin-venta-orden">—</span>
            <span className="admin-venta-cliente">—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && error && (
          <div className="admin-table-row admin-table-ventas">
            <span>—</span>
            <span className="admin-venta-orden">{error}</span>
            <span className="admin-venta-cliente">—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && !error && ventas.length === 0 && (
          <div className="admin-table-row admin-table-ventas">
            <span>—</span>
            <span className="admin-venta-orden">Sin ventas</span>
            <span className="admin-venta-cliente">—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando &&
          !error &&
          ventas.map((venta) => {
            const attrs = venta?.attributes ?? venta
            const ordenId = venta.documentId ?? attrs?.documentId ?? venta.id ?? attrs?.id
            const subtotal = Number(attrs?.total ?? 0)
            const envio = Number(attrs?.envio ?? 0)
            const descuentoCupon = Number(attrs?.descuento_cupon ?? 0)
            const total = Math.max(0, subtotal + envio - descuentoCupon)
            return (
              <div key={venta.id ?? attrs?.id} className="admin-table-row admin-table-ventas">
                <span>{formatearFecha(attrs?.fecha)}</span>
                <span className="admin-venta-orden">{ordenId ? `#${ordenId}` : '—'}</span>
                <span className="admin-venta-cliente">{obtenerClienteVenta(venta)}</span>
                <span>{`$ ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
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
      <PageButton
        pagina={paginacion.page}
        pageCount={paginacion.pageCount || 1}
        onPageChange={cambiarPagina}
      />
    </div>
  )
}
