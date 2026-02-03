import { Link } from 'react-router-dom'
import { getImageUrl } from '../../../utils/url.js'
import NgrokImage from '../../NgrokImage.jsx'
import './product-card.css'

const FALLBACK_IMAGEN = '/assets/fallback.jpg'

function imagenDeVariacion(producto) {
  const todasVariaciones = producto?.variaciones ?? []
  const vars = todasVariaciones.filter((v) => v?.imagen && v.imagen !== null && v.imagen !== '')
  if (!vars.length) return getImageUrl(FALLBACK_IMAGEN)
  const idx = Math.abs((producto?.documentId ?? producto?.id ?? '').toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % vars.length
  return vars[idx].imagen
}

export default function ProductCard({ producto, descuento = 0, to = null }) {
  const imagenUrl =
    producto?.esCombo && producto?.imagen
      ? (getImageUrl(producto.imagen) ?? producto.imagen)
      : imagenDeVariacion(producto)

  const variaciones = producto?.variaciones ?? []
  const sinStock = !variaciones.some((variacion) => Number(variacion?.stock ?? 0) > 0)

  const precioBase = Number(producto.precio) || 0
  const descuentoNum = Number(descuento) || 0
  const precioFinal = descuentoNum > 0 
    ? precioBase - (precioBase * descuentoNum) / 100 
    : precioBase
  const tieneDescuento = descuentoNum > 0

  const productoId = producto.documentId ?? producto.id
  const linkTo = to ?? (productoId ? `/producto/${productoId}` : null)
  
  const cardContent = (
    <>
      <div className={`product-card-image-container${sinStock ? ' agotado' : ''}`}>
        <NgrokImage 
          src={imagenUrl} 
          alt={producto.nombre} 
          className="product-card-image"
        />
        {sinStock && <div className="product-card-agotado">AGOTADO</div>}
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{producto.nombre}</h3>
        {producto.descripcion ? (
          <p className="product-card-descripcion" title={producto.descripcion}>
            {producto.descripcion.length > 80 ? `${producto.descripcion.slice(0, 80)}…` : producto.descripcion}
          </p>
        ) : null}
        <div className="product-card-price-container">
          {tieneDescuento ? (
            <>
              <span className="product-card-price-original">${precioBase.toFixed(2)}</span>
              <span className="product-card-price">${precioFinal.toFixed(2)}</span>
              <span className="product-card-descuento">-{descuentoNum}%</span>
            </>
          ) : (
            <span className="product-card-price">${precioBase.toFixed(2)}</span>
          )}
        </div>
      </div>
    </>
  )
  
  if (linkTo) {
    return (
      <Link to={linkTo} className="product-card">
        {cardContent}
      </Link>
    )
  }
  
  return (
    <div className="product-card">
      {cardContent}
    </div>
  )
}
