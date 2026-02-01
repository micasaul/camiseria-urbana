import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import { actualizarEstadoVenta, getVentaPorId } from '../../api/ventas.js'
import { getImageUrl } from '../../utils/url.js'
import NgrokImage from '../../components/NgrokImage.jsx'
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

  const ventaItem = useMemo(() => venta?.data ?? venta, [venta])
  const detalle = useMemo(() => {
    return ventaItem?.attributes ?? ventaItem ?? {}
  }, [ventaItem])
  const ordenId = ventaItem?.documentId ?? ventaItem?.id

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
                Orden {ordenId ? `#${ordenId}` : '—'}
              </h2>
              <p className="admin-venta-date">{detalle?.fecha ? detalle.fecha.split('T')[0] : '—'}</p>
            </div>

            <div className="admin-venta-meta admin-venta-meta-center">
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
                const comboVariacion = item?.combo_variacion?.data ?? item?.combo_variacion ?? null
                const combo = comboVariacion?.combo?.data ?? comboVariacion?.combo ?? comboVariacion?.attributes?.combo ?? null
                
                const esCombo = !!comboVariacion
                const variacionAttrs = variacion?.attributes ?? variacion ?? {}
                const comboAttrs = combo?.attributes ?? combo ?? {}
                
                const nombre = esCombo 
                  ? (comboAttrs?.nombre || 'Combo')
                  : (variacionAttrs?.producto?.data?.attributes?.nombre ?? variacionAttrs?.producto?.attributes?.nombre ?? variacionAttrs?.producto?.nombre ?? 'Producto')
                
                let imgPath = '/assets/fallback.jpg'
                if (esCombo) {
                  const img = comboAttrs?.imagen?.data ?? comboAttrs?.imagen ?? null
                  if (img) {
                    const imgAttrs = img?.attributes ?? img ?? {}
                    const url = imgAttrs?.url ?? img?.url ?? null
                    if (url) {
                      imgPath = url
                    }
                  }
                } else {
                  const img = variacionAttrs?.imagen?.data ?? variacionAttrs?.imagen ?? null
                  if (img) {
                    const imgAttrs = img?.attributes ?? img ?? {}
                    const url = imgAttrs?.url ?? img?.url ?? null
                    if (url) {
                      imgPath = url
                    }
                  }
                }
                const imagenUrl = getImageUrl(imgPath)
                
                const descuento = Number(item?.descuento ?? 0)
                const precioUnitario = Number(item?.precioUnitario ?? 0)
                const precioOriginal = descuento > 0 && descuento < 100 
                  ? precioUnitario / (1 - descuento / 100) 
                  : precioUnitario
                
                return (
                  <div key={detalleItem.id ?? index} className="admin-venta-product">
                    <NgrokImage
                      src={imagenUrl}
                      alt={nombre}
                      className="admin-venta-product-img"
                    />
                    <div className="admin-venta-product-info">
                      <span className="admin-venta-product-name">{nombre}</span>
                      <span className="admin-venta-product-variant">
                        {esCombo ? (
                          <>Talle: {comboVariacion?.talle ?? comboVariacion?.attributes?.talle ?? '—'}</>
                        ) : (
                          <>Talle: {variacionAttrs?.talle || '—'} - Color: {variacionAttrs?.color || '—'}</>
                        )}
                      </span>
                      <span className="admin-venta-product-qty">Cantidad: {item?.cantidad ?? 0}</span>
                    </div>
                    <span className="admin-venta-product-price">
                      {descuento > 0 ? (
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                          <span style={{ textDecoration: 'line-through', color: '#9aa3af', fontSize: '0.9rem' }}>
                            $ {precioOriginal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span>
                            {item?.subtotal ? `$ ${Number(item.subtotal).toLocaleString('es-AR')}` : '$ 0'}
                          </span>
                        </span>
                      ) : (
                        item?.subtotal ? `$ ${Number(item.subtotal).toLocaleString('es-AR')}` : '$ 0'
                      )}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="admin-venta-summary">
              <div className="admin-venta-summary-row">
                <span>Subtotal</span>
                <span>{detalle?.total != null ? `$ ${Number(detalle.total).toLocaleString('es-AR')}` : '$ 0'}</span>
              </div>
              <div className="admin-venta-summary-row">
                <span>Envío</span>
                <span>{detalle?.envio != null ? `$ ${Number(detalle.envio).toLocaleString('es-AR')}` : '$ 0'}</span>
              </div>
              <div className="admin-venta-summary-row total">
                <span className="admin-venta-total-label">Total</span>
                <span>{`$ ${(Number(detalle?.total ?? 0) + Number(detalle?.envio ?? 0)).toLocaleString('es-AR')}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
