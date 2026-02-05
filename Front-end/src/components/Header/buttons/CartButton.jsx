import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CartCard from '../../cards/cart-card/CartCard.jsx'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'
import BlueButton from '../../buttons/blue-btn/BlueButton.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import {
  obtenerCarritoCompleto,
  actualizarDetalleCarrito,
  eliminarDetalleCarrito
} from '../../../api/carrito.js'
import { obtenerDescuentosActivos } from '../../../api/promos.js'
import { parsearPrecio } from '../../../utils/carrito.js'

export default function CartButton({ isOpen, onClick, onClose }) {
  const navigate = useNavigate()
  const { rol } = useAuth()
  const [itemsCarrito, setItemsCarrito] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (isOpen && rol !== 'guest') {
      setCargando(true)
      const cargar = async () => {
        try {
          const [items, descuentosMap] = await Promise.all([
            obtenerCarritoCompleto(),
            obtenerDescuentosActivos()
          ])
          const itemsConDescuento = (items ?? []).map((item) => {
            const baseValue =
              typeof item.priceValue === 'number' ? item.priceValue : parsearPrecio(item.price)
            const descuento = descuentosMap.get(String(item.productoId ?? '')) ?? 0
            const finalValue =
              descuento > 0 ? baseValue - (baseValue * descuento) / 100 : baseValue
            return {
              ...item,
              descuento,
              priceOriginalValue: baseValue,
              priceValue: finalValue,
              priceOriginal: `$${baseValue.toFixed(2)}`,
              priceFinal: `$${finalValue.toFixed(2)}`,
              hasDiscount: descuento > 0
            }
          })
          setItemsCarrito(itemsConDescuento)
        } catch (error) {
          console.error('Error al cargar carrito:', error)
          setItemsCarrito([])
        } finally {
          setCargando(false)
        }
      }

      cargar()
    } else if (rol === 'guest') {
      setItemsCarrito([])
    }
  }, [isOpen, rol])

  const subtotal = useMemo(() => {
    return itemsCarrito.reduce((acum, item) => {
      const precioUnitario =
        typeof item.priceValue === 'number' ? item.priceValue : parsearPrecio(item.price)
      const cantidad = item.quantity ?? 1
      return acum + precioUnitario * cantidad
    }, 0)
  }, [itemsCarrito])

  const subtotalFormateado = `$${subtotal.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

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
    navigate('/compra')
  }

  const actualizarCantidad = async (detalleDocumentId, nuevaCantidad) => {
    if (!detalleDocumentId) return
    const anterior = itemsCarrito.find(
      (item) => (item.documentId ?? item.id) === detalleDocumentId
    )?.quantity

    setItemsCarrito((prevItems) =>
      prevItems.map((item) =>
        (item.documentId ?? item.id) === detalleDocumentId
          ? { ...item, quantity: nuevaCantidad }
          : item
      )
    )

    try {
      await actualizarDetalleCarrito(detalleDocumentId, nuevaCantidad)
    } catch (error) {
      console.error('Error al actualizar cantidad:', error)
      if (typeof anterior === 'number') {
        setItemsCarrito((prevItems) =>
          prevItems.map((item) =>
            (item.documentId ?? item.id) === detalleDocumentId
              ? { ...item, quantity: anterior }
              : item
          )
        )
      }
    }
  }

  const handleRemove = async (detalleDocumentId) => {
    if (!detalleDocumentId) return
    try {
      await eliminarDetalleCarrito(detalleDocumentId)
      setItemsCarrito((prevItems) =>
        prevItems.filter((item) => (item.documentId ?? item.id) !== detalleDocumentId)
      )
    } catch (error) {
      console.error('Error al eliminar del carrito:', error)
    }
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
            ) : cargando ? (
              <div className="cart-empty">
                <p className="cart-empty-text">Cargando...</p>
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
                      priceOriginal={item.priceOriginal}
                      priceFinal={item.priceFinal}
                      hasDiscount={item.hasDiscount}
                      size={item.size}
                      color={item.color}
                      quantity={item.quantity}
                      stock={item.stock}
                      sinStock={item.sinStock}
                      onQuantityChange={(cantidad) =>
                        actualizarCantidad(item.documentId ?? item.id, cantidad)
                      }
                      onRemove={() => handleRemove(item.documentId ?? item.id)}
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
