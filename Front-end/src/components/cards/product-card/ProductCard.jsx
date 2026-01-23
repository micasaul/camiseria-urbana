import { Link } from 'react-router-dom'
import './product-card.css'

const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337'

export default function ProductCard({ producto }) {
  const imagenUrl = producto.imagen?.startsWith('http') 
    ? producto.imagen 
    : `${BACKEND_URL}${producto.imagen || '/assets/fallback.jpg'}`

  return (
    <Link to={`/catalogo/producto/${producto.id}`} className="product-card">
      <div className="product-card-image-container">
        <img 
          src={imagenUrl} 
          alt={producto.nombre} 
          className="product-card-image"
        />
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{producto.nombre}</h3>
        <p className="product-card-price">${producto.precio?.toFixed(2) || '0.00'}</p>
      </div>
    </Link>
  )
}
