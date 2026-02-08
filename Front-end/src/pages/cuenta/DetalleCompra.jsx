import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVentasUsuario } from '../../api/ventas.js'
import { formatearFecha } from '../../utils/adminHelpers.js'
import LinkButton from '../../components/buttons/link-btn/LinkButton.jsx'
import './DetalleCompra.css'

export default function DetalleCompra() {
  const { documentId } = useParams()
  const [venta, setVenta] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')

    getVentasUsuario(1, 100)
      .then((data) => {
        if (!activo) return
        const ventaEncontrada = data.items.find(v => 
          (v.documentId ?? v.attributes?.documentId) === documentId
        )
        if (!ventaEncontrada) {
          setError('Venta no encontrada')
          return
        }
        setVenta(ventaEncontrada)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudo cargar la venta.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => { activo = false }
  }, [documentId])

  if (cargando) return <p className="detalle-loading">Cargando detalles de la compra...</p>
  if (error) return <p className="detalle-error">{error}</p>
  if (!venta) return <p className="detalle-error">No se encontró la venta</p>

  const attrs = venta.attributes ?? venta
  
  let direccion = {}
  if (attrs?.direccion) {
    if (attrs.direccion.data) {
      direccion = attrs.direccion.data.attributes ?? attrs.direccion.data ?? {}
    } else if (attrs.direccion.attributes) {
      direccion = attrs.direccion.attributes
    } else {
      direccion = attrs.direccion
    }
  }
  
  const detalleVentasRaw = attrs?.detalle_ventas?.data ?? attrs?.detalle_ventas ?? []
  const detalleVentas = Array.isArray(detalleVentasRaw) ? detalleVentasRaw.map(item => {
    const itemAttrs = item?.attributes ?? item
    const variacionData = itemAttrs?.variacion?.data ?? itemAttrs?.variacion
    const comboVariacionData = itemAttrs?.combo_variacion?.data ?? itemAttrs?.combo_variacion
    const comboData = comboVariacionData?.combo?.data ?? comboVariacionData?.combo ?? comboVariacionData?.attributes?.combo
    const esCombo = !!comboVariacionData
    
    const variacion = variacionData?.attributes ?? variacionData ?? {}
    const comboVariacionAttrs = comboVariacionData?.attributes ?? comboVariacionData ?? {}
    const combo = comboData?.attributes ?? comboData ?? {}
    
    const productoData = variacion?.producto?.data ?? variacion?.producto
    const producto = productoData?.attributes ?? productoData ?? {}
    
    const descuento = Number(itemAttrs?.descuento ?? item?.descuento ?? 0)
    const precioUnitario = Number(itemAttrs?.precioUnitario ?? item?.precioUnitario ?? 0)

    const precioOriginal = descuento > 0 && descuento < 100 
      ? precioUnitario / (1 - descuento / 100) 
      : precioUnitario
    
    const color = variacion?.color ?? variacion?.attributes?.color ?? "";
    const talle = variacion?.talle ?? variacion?.attributes?.talle ?? "";
    const talleCombo = comboVariacionAttrs?.talle ?? comboVariacionData?.talle ?? "";

    return {
      id: item?.id ?? itemAttrs?.id,
      cantidad: itemAttrs?.cantidad ?? item?.cantidad ?? 0,
      precioUnitario,
      precioOriginal,
      descuento,
      subtotal: itemAttrs?.subtotal ?? item?.subtotal ?? 0,
      esCombo,
      color,
      talle,
      talleCombo,
      variacion: esCombo ? null : {
        producto: {
          id: producto?.id ?? productoData?.id,
          documentId: productoData?.documentId ?? producto?.documentId,
          nombre: producto?.nombre ?? "—"
        }
      },
      combo: esCombo ? {
        id: combo?.id ?? comboData?.id,
        documentId: comboData?.documentId ?? combo?.documentId,
        nombre: combo?.nombre ?? "—"
      } : null
    }
  }) : []
  
  const subtotal = detalleVentas.reduce((sum, item) => {
    return sum + (Number(item.subtotal) || 0)
  }, 0)
  
  const envio = attrs?.envio != null ? Number(attrs.envio) : 0
  const descuentoCupon = attrs?.descuento_cupon != null ? Number(attrs.descuento_cupon) : 0
  const total = Math.max(0, subtotal + envio - descuentoCupon)

  return (
    <div className="detalle-compra-page">
      <div className="detalle-compra-container">
        {/* Columna izquierda */}
        <div className="detalle-columna-izq">
          <div className="detalle-orden-heading">
            <h1 className="detalle-orden">ORDEN #{venta.documentId ?? attrs.documentId}</h1>
            <p className="detalle-fecha">
              {attrs?.fecha ? attrs.fecha.split('T')[0] : "—"}
            </p>
          </div>
          
          <p>
            <strong className="detalle-label">Dirección de envío:</strong>{" "}
            {direccion.calle && direccion.numero 
              ? `${direccion.calle} ${direccion.numero}, CP: ${direccion.cp ?? "—"}${direccion.provincia ? `, ${direccion.provincia}` : ""}`
              : "—"}
          </p>
          
          <p>
            <strong className="detalle-label">Número de seguimiento:</strong>{" "}
            {attrs?.nroSeguimiento ?? "—"}
          </p>
          
          <p>
            <strong className="detalle-label">Estado:</strong>{" "}
            {attrs?.estado ?? "—"}
          </p>
        </div>

        {/* Columna derecha */}
        <div className="detalle-columna-der">
          <h2>Productos</h2>
          {detalleVentas.length > 0 ? (
            <>
              <div className="detalle-productos">
                <div className="detalle-productos-header">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio unitario</span>
                  <span>Subtotal</span>
                  <span>Acción</span>
                </div>
                {detalleVentas.map(item => {
                  const nombre = item.esCombo
                    ? (item.combo?.nombre ?? 'Combo')
                    : (item.variacion?.producto?.nombre ?? 'Producto')
                  const variacionTexto = item.esCombo
                    ? (item.talleCombo ? `Talle ${item.talleCombo}` : '')
                    : [item.color, item.talle].filter(Boolean).join(' / ')
                  const itemId = item.esCombo
                    ? (item.combo?.documentId ?? item.combo?.id)
                    : (item.variacion?.producto?.documentId ?? item.variacion?.producto?.id)
                  
                  return (
                    <div key={item.id} className="detalle-producto-row">
                      <span>
                        <span>{nombre}</span>
                        {variacionTexto ? (
                          <span className="detalle-producto-variacion">{variacionTexto}</span>
                        ) : null}
                      </span>
                      <span>{item.cantidad}</span>
                      <span>
                        {item.descuento > 0 ? (
                          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.9rem' }}>
                              ${item.precioOriginal.toFixed(2)}
                            </span>
                            <span>${item.precioUnitario.toFixed(2)}</span>
                          </span>
                        ) : (
                          `$${item.precioUnitario.toFixed(2)}`
                        )}
                      </span>
                      <span>${item.subtotal.toFixed(2)}</span>
                      <span>
                        {itemId && (attrs?.estado ?? venta?.estado) === 'Entregado' ? (
                          <Link 
                            to={`/cuenta/crear-resena/${itemId}`} 
                            className="detalle-resena-link"
                          >
                            Agregar reseña
                          </Link>
                        ) : itemId ? (
                          <span className="detalle-resena-disabled">Agregar reseña (disponible cuando esté entregado)</span>
                        ) : (
                          <span>—</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              <div className="detalle-totales">
                <div className="detalle-total-row">
                  <span>Envío:</span>
                  <span>${envio.toFixed(2)}</span>
                </div>
                {descuentoCupon > 0 && (
                  <div className="detalle-total-row detalle-total-descuento">
                    <span>Descuento cupón:</span>
                    <span>-${descuentoCupon.toFixed(2)}</span>
                  </div>
                )}
                <div className="detalle-total-row detalle-total-final">
                  <span>TOTAL:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <p>No hay productos asociados a esta venta</p>
          )}
        </div>
      </div>

      <div className="detalle-volver">
        <Link to="/mi-cuenta">
          <LinkButton>Volver a mi cuenta</LinkButton>
        </Link>
      </div>
    </div>
  )
}
