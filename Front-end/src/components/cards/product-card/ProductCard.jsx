import { Link } from 'react-router-dom'
import './product-card.css'

const BACKEND_URL = import.meta.env.BACKEND_URL

export default function ProductCard({ producto, descuento = 0 }) {
  const imagenUrl = producto.imagen?.startsWith('http') 
    ? producto.imagen 
    : `${BACKEND_URL}${producto.imagen || '/assets/fallback.jpg'}`

  const variaciones = producto?.variaciones ?? []
  const sinStock = !variaciones.some((variacion) => Number(variacion?.stock ?? 0) > 0)

  const precioBase = Number(producto.precio) || 0
  const descuentoNum = Number(descuento) || 0
  const precioFinal = descuentoNum > 0 
    ? precioBase - (precioBase * descuentoNum) / 100 
    : precioBase
  const tieneDescuento = descuentoNum > 0

  const productoId = producto.documentId ?? producto.id
  
  return (
    <Link to={`/producto/${productoId}`} className="product-card">
      <div className={`product-card-image-container${sinStock ? ' agotado' : ''}`}>
        <img 
          src={imagenUrl} 
          alt={producto.nombre} 
          className="product-card-image"
        />
        {sinStock && <div className="product-card-agotado">AGOTADO</div>}
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{producto.nombre}</h3>
        <div className="product-card-price-container">
          {tieneDescuento ? (
            <>
              <span className="product-card-price-original">${precioBase.toFixed(2)}</span>
              <span className="product-card-price">${precioFinal.toFixed(2)}</span>
            </>
          ) : (
            <span className="product-card-price">${precioBase.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
