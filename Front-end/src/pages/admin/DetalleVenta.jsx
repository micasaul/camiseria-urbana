import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import { actualizarEstadoVenta, getVentaPorId } from '../../api/ventas.js'
import './admin.css'

const ESTADOS_VENTA = ['En proceso', 'Enviado', 'Entregado']

export default function DetalleVenta() {
  const { id } = useParams()
  const [venta, setVenta] = useState(null)
  const [estado, setEstado] = useState('En proceso')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let activo = true
    setCargando(true)
    setError('')
    getVentaPorId(id)
      .then((data) => {
        if (!activo) return
        const item = data?.data ?? data
        const attrs = item?.attributes ?? item
        setVenta(item)
        setEstado(attrs?.estado ?? 'En proceso')
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudo cargar la venta.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [id])

  const detalle = useMemo(() => {
    const item = venta?.data ?? venta
    return item?.attributes ?? item ?? {}
  }, [venta])

  const detalleItems = useMemo(() => {
    const attrs = detalle
    const raw = attrs?.detalle_ventas?.data ?? attrs?.detalle_ventas ?? []
    return Array.isArray(raw) ? raw : []
  }, [detalle])

  const handleGuardarEstado = async () => {
    if (!id) return
    setMensaje('')
    setError('')
    try {
      await actualizarEstadoVenta(id, estado)
      setMensaje('Actualización exitosa.')
    } catch (err) {
      setError(err?.message || 'Ocurrió un error, no se pudo actualizar.')
    }
  }

  return (
    <div className="admin-page admin-page-full">
      <h1 className="admin-title admin-title-offset">
        Ventas <span className="admin-title-sub">- Detalle</span>
      </h1>
      <div className="admin-card admin-detail-card">
        <div className="admin-venta-detail">
          <div className="admin-venta-col">
            <div className="admin-venta-heading">
              <h2 className="admin-venta-title">
                Orden {detalle?.nroSeguimiento ? `#${detalle.nroSeguimiento}` : '—'}
              </h2>
              <p className="admin-venta-date">{detalle?.fecha ? detalle.fecha.split('T')[0] : '—'}</p>
            </div>

            <div className="admin-venta-meta admin-venta-meta-center">
              <div className="admin-venta-meta-item">
                <span className="admin-venta-meta-title">Dirección:</span>
                <span className="admin-venta-meta-value">—</span>
              </div>
              <div className="admin-venta-meta-item">
                <span className="admin-venta-meta-title">Seguimiento:</span>
                <span className="admin-venta-meta-value">{detalle?.nroSeguimiento || '—'}</span>
              </div>
              <div className="admin-venta-meta-item">
                <span className="admin-venta-meta-title">Estados:</span>
                <select
                  className="admin-select admin-venta-select"
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                >
                  {ESTADOS_VENTA.map((estadoItem) => (
                    <option key={estadoItem} value={estadoItem}>
                      {estadoItem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-venta-actions">
              <BlueButton width="160px" height="40px" onClick={handleGuardarEstado} disabled={cargando}>
                Guardar
              </BlueButton>
              {(mensaje || error) && (
                <p className={`admin-form-message${error ? ' error' : ''}`}>
                  {error || mensaje}
                </p>
              )}
            </div>
          </div>

          <div className="admin-venta-col">
            <div className="admin-venta-products">
              {detalleItems.length === 0 && (
                <div className="admin-venta-product">
                  <span className="admin-venta-product-thumb" />
                  <div className="admin-venta-product-info">
                    <span className="admin-venta-product-name">Sin productos</span>
                  </div>
                </div>
              )}
              {detalleItems.map((detalleItem, index) => {
                const item = detalleItem?.attributes ?? detalleItem
                const variacion = item?.variacion?.data ?? item?.variacion ?? null
                const variacionAttrs = variacion?.attributes ?? variacion ?? {}
                const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto ?? null
                const productoAttrs = producto?.attributes ?? producto ?? {}
                return (
                  <div key={detalleItem.id ?? index} className="admin-venta-product">
                    <span className="admin-venta-product-thumb" />
                    <div className="admin-venta-product-info">
                      <span className="admin-venta-product-name">{productoAttrs?.nombre || 'Producto'}</span>
                      <span className="admin-venta-product-variant">
                        Talle: {variacionAttrs?.talle || '—'} - Color: {variacionAttrs?.color || '—'}
                      </span>
                      <span className="admin-venta-product-qty">Cantidad: {item?.cantidad ?? 0}</span>
                    </div>
                    <span className="admin-venta-product-price">
                      {item?.subtotal ? `$ ${Number(item.subtotal).toLocaleString('es-AR')}` : '$ 0'}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="admin-venta-summary">
              <div className="admin-venta-summary-row">
                <span>Subtotal</span>
                <span>{detalle?.total ? `$ ${Number(detalle.total).toLocaleString('es-AR')}` : '$ 0'}</span>
              </div>
              <div className="admin-venta-summary-row">
                <span>Envío</span>
                <span>$ 0</span>
              </div>
              <div className="admin-venta-summary-row total">
                <span className="admin-venta-total-label">Total</span>
                <span>{detalle?.total ? `$ ${Number(detalle.total).toLocaleString('es-AR')}` : '$ 0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
