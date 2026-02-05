import { useEffect, useState } from 'react'
import { getImageUrl } from '../../../utils/url.js'
import NgrokImage from '../../NgrokImage.jsx'
import './cart-card.css'

const FALLBACK_IMAGEN = '/assets/fallback.jpg'

export default function CartCard({
  imageSrc,
  name,
  size,
  color,
  price,
  priceOriginal,
  priceFinal,
  hasDiscount = false,
  quantity = 1,
  stock = Infinity,
  sinStock = false,
  onQuantityChange,
  onRemove
}) {
  const src = imageSrc || getImageUrl(FALLBACK_IMAGEN)
  const [count, setCount] = useState(quantity)
  const inhabilitada = sinStock

  useEffect(() => {
    setCount(quantity)
  }, [quantity])

  const updateCount = (next) => {
    setCount(next)
    if (onQuantityChange) {
      onQuantityChange(next)
    }
  }

  const handleDecrease = () => {
    if (count <= 1 || inhabilitada) return
    updateCount(count - 1)
  }

  const handleIncrease = () => {
    if (inhabilitada || count + 1 > stock) return
    updateCount(count + 1)
  }

  return (
    <div className={`cart-card${inhabilitada ? ' cart-card--sin-stock' : ''}`}>
      <NgrokImage className="cart-card-image" src={src} alt={name} />
      <div className="cart-card-details">
        <span className="cart-card-name">{name}</span>
        <div className="cart-card-variant">
          {size !== null && <span>Talle: {size ?? '-'}</span>}
          {color !== null && <span>Color: {color ?? '-'}</span>}
        </div>
        <div className="cart-card-footer">
          <span className="cart-card-price">
            {hasDiscount ? (
              <>
                <span className="cart-card-price-original">{priceOriginal}</span>
                <span className="cart-card-price-final">{priceFinal}</span>
              </>
            ) : (
              <span className="cart-card-price-final">{priceFinal ?? price}</span>
            )}
          </span>
          <div className="cart-card-actions">
            {inhabilitada ? (
              <span className="cart-card-cantidad-fija">{count} unidad{count !== 1 ? 'es' : ''}</span>
            ) : (
              <div className="cart-card-counter">
                <button type="button" onClick={handleDecrease} aria-label="Restar">
                  -
                </button>
                <span>{count}</span>
                <button type="button" onClick={handleIncrease} aria-label="Sumar">
                  +
                </button>
              </div>
            )}
            <button
              type="button"
              className="cart-card-remove"
              onClick={onRemove}
              aria-label="Eliminar del carrito"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v6M15 11v6M6 7l1 12a1 1 0 0 0 1 .93h8a1 1 0 0 0 1-.93l1-12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
