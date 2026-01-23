import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CartCard from '../../cards/cart-card/CartCard.jsx'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'
import BlueButton from '../../buttons/blue-btn/BlueButton.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'

const formatearPrecio = (valor) => {
  if (typeof valor === 'number') {
    return valor
  }
  if (!valor) {
    return 0
  }
  const limpio = String(valor).replace(/[^0-9,.-]/g, '')
  if (limpio.includes(',')) {
    const normalizado = limpio.replace(/\./g, '').replace(',', '.')
    return Number(normalizado) || 0
  }
  return Number(limpio.replace(/\./g, '')) || 0
}

export default function CartButton({ isOpen, onClick, onClose, items = [] }) {
  const navigate = useNavigate()
  const { rol } = useAuth()
  const [itemsCarrito, setItemsCarrito] = useState(items)

  useEffect(() => {
    setItemsCarrito(items)
  }, [items])

  const subtotal = useMemo(() => {
    return itemsCarrito.reduce((acum, item) => {
      const precioUnitario = formatearPrecio(item.price)
      const cantidad = item.quantity ?? 1
      return acum + precioUnitario * cantidad
    }, 0)
  }, [itemsCarrito])

  const subtotalFormateado = `$${subtotal.toLocaleString('es-AR')}`

  const handleExplorar = () => {
    if (onClose) {
      onClose()
    }
    navigate('/catalogo')
  }

  const handleLogin = () => {
    if (onClose) {
      onClose()
    }
    navigate('/login')
  }

  const handleComprar = () => {
    if (onClose) {
      onClose()
    }
    navigate('/checkout')
  }

  const actualizarCantidad = (id, nuevaCantidad) => {
    setItemsCarrito((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: nuevaCantidad } : item
      )
    )
  }

  return (
    <>
      <WhiteButton className="header-icon-btn ghost-btn" onClick={onClick} aria-expanded={isOpen}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"
          />
        </svg>
      </WhiteButton>

      {isOpen && (
        <aside className="side-panel right">
          <div className="side-panel-header">
            <span>Carrito</span>
            <button className="close-btn" onClick={onClose} aria-label="Cerrar carrito">×</button>
          </div>
          <div className="side-panel-body">
            {rol === 'guest' ? (
              <div className="cart-empty">
                <p className="cart-empty-text">Necesitas loguearte para acceder.</p>
                <BlueButton width="220px" height="36px" fontSize="15px" onClick={handleLogin}>
                  Login
                </BlueButton>
              </div>
            ) : itemsCarrito.length === 0 ? (
              <div className="cart-empty">
                <p className="cart-empty-text">Explora nuestro catálogo.</p>
                <BlueButton width="220px" height="36px" fontSize="15px" onClick={handleExplorar}>
                  Explorar
                </BlueButton>
              </div>
            ) : (
              <div className="cart-content">
                <div className="side-panel-cards">
                  {itemsCarrito.map((item) => (
                    <CartCard
                      key={item.id}
                      imageSrc={item.imageSrc}
                      name={item.name}
                      price={item.price}
                      size={item.size}
                      color={item.color}
                      quantity={item.quantity}
                      stock={item.stock}
                      onQuantityChange={(cantidad) => actualizarCantidad(item.id, cantidad)}
                      onRemove={() => {}}
                    />
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-summary">
                    <span className="cart-summary-label">Subtotal:</span>
                    <span className="cart-summary-value">{subtotalFormateado}</span>
                  </div>
                  <BlueButton className="cart-checkout-button" width="100%" onClick={handleComprar}>
                    Iniciar compra
                  </BlueButton>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  )
}
