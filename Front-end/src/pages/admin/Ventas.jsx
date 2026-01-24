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
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ page: 1, pageCount: 1 })

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getVentas(pagina, 10)
      .then((data) => {
        if (!activo) return
        setVentas(data.items)
        setPaginacion(data.pagination)
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
  }, [pagina])

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
                <span>{obtenerClienteVenta(venta)}</span>
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
      <PageButton
        pagina={paginacion.page}
        pageCount={paginacion.pageCount || 1}
        onPageChange={(nuevaPagina) => setPagina(nuevaPagina)}
      />
    </div>
  )
}
