import { useEffect, useMemo, useState } from 'react'
import { getVentasDashboard } from '../../api/ventas.js'
import { formatearPrecio } from '../../utils/adminHelpers.js'
import { calcularTopClientes, calcularTopProductos } from '../../utils/ventasStats.js'
import { getImageUrl } from '../../utils/url.js'
import NgrokImage from '../../components/NgrokImage.jsx'
import './admin.css'

export default function AdminPanel() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getVentasDashboard()
      .then((data) => {
        if (!activo) return
        setVentas(data)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudieron cargar las métricas.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const topClientes = useMemo(() => calcularTopClientes(ventas), [ventas])
  const topProductos = useMemo(() => calcularTopProductos(ventas), [ventas])

  return (
    <div className="admin-page">
      <h1 className="admin-title">Dashboard</h1>
      <div className="admin-card-grid">
        <div className="admin-card">
          <h2 className="admin-card-title">Mejores clientes</h2>
          <div className="admin-stats-table">
            <div className="admin-stats-header">
              <span>Cliente</span>
              <span>Total comprado</span>
            </div>
            {cargando && (
              <div className="admin-stats-row">
                <span>Cargando...</span>
                <span>—</span>
              </div>
            )}
            {!cargando && error && (
              <div className="admin-stats-row">
                <span>{error}</span>
                <span>—</span>
              </div>
            )}
            {!cargando && !error && topClientes.length === 0 && (
              <div className="admin-stats-row">
                <span>Sin datos</span>
                <span>—</span>
              </div>
            )}
            {!cargando &&
              !error &&
              topClientes.slice(0, 3).map((cliente, index) => (
                <div key={`${cliente.cliente}-${index}`} className="admin-stats-row">
                  <span>{cliente.cliente}</span>
                  <span>{formatearPrecio(cliente.total)}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="admin-card">
          <h2 className="admin-card-title">Artículos más comprados</h2>
          <div className="admin-stats-table">
            <div className="admin-stats-header">
              <span>Artículo</span>
              <span>Cantidad</span>
            </div>
            {cargando && (
              <div className="admin-stats-row">
                <span className="admin-item-cell">
                  <span className="admin-item-thumb" />
                  Cargando...
                </span>
                <span>—</span>
              </div>
            )}
            {!cargando && error && (
              <div className="admin-stats-row">
                <span className="admin-item-cell">
                  <span className="admin-item-thumb" />
                  {error}
                </span>
                <span>—</span>
              </div>
            )}
            {!cargando && !error && topProductos.length === 0 && (
              <div className="admin-stats-row">
                <span className="admin-item-cell">
                  <span className="admin-item-thumb" />
                  Sin datos
                </span>
                <span>—</span>
              </div>
            )}
            {!cargando &&
              !error &&
              topProductos.slice(0, 3).map((producto, index) => (
                <div key={`${producto.nombre}-${index}`} className="admin-stats-row">
                  <span className="admin-item-cell">
                    <span className="admin-item-thumb">
                      {producto.imagen ? (
                        <NgrokImage
                          src={getImageUrl(producto.imagen)}
                          alt=""
                          className="admin-item-thumb-img"
                        />
                      ) : null}
                    </span>
                    {producto.nombre}
                  </span>
                  <span>{producto.cantidad}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
