// src/pages/mi-cuenta/DetalleCompra.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVentas } from '../../api/ventas.js'
import { formatearFecha } from '../../utils/adminHelpers.js'
import LinkButton from '../../components/buttons/link-btn/LinkButton.jsx'
import './DetalleCompra.css'

export default function DetalleCompra() {
  const { id } = useParams()
  const [venta, setVenta] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')

    getVentas(1, 100)
      .then((data) => {
        if (!activo) return
        const ventaEncontrada = data.items.find(v => 
          (v.id ?? v.attributes?.id) === Number(id) ||
          (v.documentId ?? v.attributes?.documentId) === id
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
  }, [id])

  if (cargando) return <p className="detalle-loading">Cargando detalles de la compra...</p>
  if (error) return <p className="detalle-error">{error}</p>
  if (!venta) return <p className="detalle-error">No se encontró la venta</p>

  const attrs = venta.attributes ?? venta

  return (
    <div className="detalle-compra-page">
      <div className="detalle-compra-container">
        {/* Columna izquierda */}
        <div className="detalle-columna-izq">
          <h1 className="detalle-orden">ORDEN #{venta.id ?? attrs.id}</h1>
          
          <p>
            <strong className="detalle-label">Fecha:</strong>{" "}
            {attrs?.fecha ? formatearFecha(attrs.fecha) : "—"}
          </p>
          
          <p>
            <strong className="detalle-label">Estado:</strong>{" "}
            {attrs?.estado ?? "—"}
          </p>
          
          <p>
            <strong className="detalle-label">Número de seguimiento:</strong>{" "}
            {attrs?.nroSeguimiento ?? "—"}
          </p>
          
          <p>
            <strong className="detalle-label">Total:</strong>{" "}
            {attrs?.total != null ? `$${attrs.total}` : "$0"}
          </p>
        </div>

        {/* Columna derecha */}
        <div className="detalle-columna-der">
          <h2>Productos</h2>
          {attrs.detalle_ventas?.length > 0 ? (
            <div className="detalle-productos">
              <div className="detalle-productos-header">
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio unitario</span>
                <span>Subtotal</span>
              </div>
              {attrs.detalle_ventas.map(item => (
                <div key={item.id} className="detalle-producto-row">
                  <span>{item.nombre}</span>
                  <span>{item.cantidad}</span>
                  <span>${item.precio}</span>
                  <span>${item.cantidad * item.precio}</span>
                </div>
              ))}
            </div>
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
