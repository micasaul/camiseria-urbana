import { useEffect, useState } from 'react'
import './cart-card.css'

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
  onQuantityChange,
  onRemove
}) {
  const [count, setCount] = useState(quantity)

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
    if (count <= 1) {
      return
    }
    updateCount(count - 1)
  }

  const handleIncrease = () => {
    if (count + 1 > stock) {
      return
    }
    updateCount(count + 1)
  }

  return (
    <div className="cart-card">
      <img className="cart-card-image" src={imageSrc} alt={name} />
      <div className="cart-card-details">
        <span className="cart-card-name">{name}</span>
        <div className="cart-card-variant">
          <span>Talle: {size ?? '-'}</span>
          <span>Color: {color ?? '-'}</span>
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
            <div className="cart-card-counter">
              <button type="button" onClick={handleDecrease} aria-label="Restar">
                -
              </button>
              <span>{count}</span>
              <button type="button" onClick={handleIncrease} aria-label="Sumar">
                +
              </button>
            </div>
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
