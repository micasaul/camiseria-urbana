import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getComboPorId } from '../../api/combos.js'
import { obtenerCarritoUsuario, agregarComboAlCarrito } from '../../api/carrito.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { agregarAWishlist, eliminarDeWishlist, estaEnWishlist } from '../../api/wishlist.js'
import { calcularPromedioValoraciones } from '../../utils/producto.js'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import ReviewCard from '../../components/cards/review-card/ReviewCard.jsx'
import './Producto.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function DetalleCombo() {
  const { documentId } = useParams()
  const { rol } = useAuth()

  const [combo, setCombo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [talleSeleccionado, setTalleSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [enWishlist, setEnWishlist] = useState(false)
  const [carritoError, setCarritoError] = useState('')

  useEffect(() => {
    let activo = true

    const cargarCombo = async () => {
      try {
        const res = await getComboPorId(documentId)
        if (!activo) return

        const item = res?.data ?? res

        setCombo({
          id: item.id,
          documentId: item.documentId ?? null,
          nombre: item.nombre ?? '',
          precio: item.precio ?? 0,
          imagen: item.imagen ?? '/assets/fallback.jpg',
          variaciones: item.variaciones ?? [],
          wishlists: item.wishlists ?? [],
          resenas: item.resenas ?? [],
          valoraciones: item.valoraciones ?? []
        })
      } catch (error) {
        console.error('Error al cargar combo:', error)
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargarCombo()

    return () => {
      activo = false
    }
  }, [documentId])

  const promedioValoraciones = useMemo(() => {
    return calcularPromedioValoraciones(combo?.valoraciones)
  }, [combo])

  const tallesEnStock = useMemo(() => {
    if (!combo?.variaciones) return []
    const talles = new Set()
    combo.variaciones.forEach(v => {
      if (Number(v.stock ?? 0) > 0) {
        talles.add(v.talle)
      }
    })
    return Array.from(talles)
  }, [combo])

  useEffect(() => {
    if (tallesEnStock.length > 0 && !talleSeleccionado) {
      setTalleSeleccionado(tallesEnStock[0])
    }
  }, [tallesEnStock, talleSeleccionado])

  const stockDisponible = useMemo(() => {
    if (!combo?.variaciones || !talleSeleccionado) return 0
    const variacion = combo.variaciones.find(v => v.talle === talleSeleccionado)
    return variacion?.stock ?? 0
  }, [combo, talleSeleccionado])

  const sinStockCombo = useMemo(() => {
    const variaciones = combo?.variaciones ?? []
    if (!variaciones.length) return true
    return !variaciones.some((variacion) => Number(variacion?.stock ?? 0) > 0)
  }, [combo])

  const obtenerErrorCarrito = () => {
    if (!talleSeleccionado) {
      return 'Selecciona un talle para agregar al carrito.'
    }
    return ''
  }

  const handleAgregarCarrito = async () => {
    const error = obtenerErrorCarrito()
    if (error) {
      setCarritoError(error)
      return
    }
    
    if (rol === 'guest') {
      return
    }

    if (sinStockCombo) {
      return
    }

    try {
      const variacion = combo.variaciones.find(v => v.talle === talleSeleccionado)
      if (!variacion || variacion.stock < cantidad) {
        setCarritoError('No hay suficiente stock disponible.')
        return
      }

      const carrito = await obtenerCarritoUsuario()
      
      await agregarComboAlCarrito(carrito.documentId, combo.documentId, cantidad)
      setCarritoError('')
      window.dispatchEvent(new CustomEvent('cart:open'))
    } catch (error) {
      console.error('Error al agregar combo al carrito:', error)
      setCarritoError('No se pudo agregar el combo al carrito.')
    }
  }

  const handleToggleWishlist = async () => {
    if (rol === 'guest') {
      return
    }

    if (!combo?.documentId) {
      return
    }

    try {
      if (enWishlist) {
        const wishlistId = typeof enWishlist === 'string' ? enWishlist : null
        if (wishlistId) {
          await eliminarDeWishlist(wishlistId)
        }
        setEnWishlist(false)
        return
      }

      const creada = await agregarAWishlist(null, combo.documentId)
      const item = creada?.data ?? creada
      const attrs = item?.attributes ?? item
      const wishlistId = item?.documentId ?? attrs?.documentId ?? true
      setEnWishlist(wishlistId)
    } catch (error) {
      console.error('Error al agregar combo a wishlist:', error)
    }
  }

  useEffect(() => {
    if (combo?.documentId && rol !== 'guest') {
      estaEnWishlist(null, combo.documentId)
        .then((resultado) => setEnWishlist(resultado || false))
        .catch(() => setEnWishlist(false))
    }
  }, [combo?.documentId, rol])

  useEffect(() => {
    if (carritoError) {
      setCarritoError(obtenerErrorCarrito())
    }
  }, [talleSeleccionado, carritoError])

  if (cargando) {
    return <div className="producto-page">Cargando...</div>
  }

  if (!combo) {
    return <div className="producto-page">Combo no encontrado</div>
  }

  const imagenUrl = combo.imagen?.startsWith('http')
    ? combo.imagen
    : `${BACKEND_URL}${combo.imagen || '/assets/fallback.jpg'}`

  const precioBase = Number(combo?.precio ?? 0)

  return (
    <div className="producto-page">
      <div className="producto-container">
        <div className={`producto-imagen-wrap${sinStockCombo ? ' agotado' : ''}`}>
          <img src={imagenUrl} alt={combo.nombre} className="producto-imagen" />
          {sinStockCombo && <div className="producto-agotado">AGOTADO</div>}
        </div>

        <div className="producto-info">
          <div className="producto-header">
            <h1 className="producto-nombre">{combo.nombre}</h1>
            <button
              className={`producto-wishlist-btn ${enWishlist ? 'activo' : ''}`}
              onClick={handleToggleWishlist}
              aria-label="Agregar combo a wishlist"
            >
              <svg width="24" height="24" fill={enWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"
                />
              </svg>
            </button>
          </div>

          <div className="producto-resenas">
            <div className="producto-resenas-estrellas">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < Math.round(promedioValoraciones) ? 'estrella llena' : 'estrella vacia'}>
                  ★
                </span>
              ))}
            </div>
            <span className="producto-resenas-texto">
              ({(combo.resenas?.length ?? 0)} {(combo.resenas?.length ?? 0) === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>

          <div className="producto-precio">
            <span className="producto-precio-final">${precioBase.toFixed(2)}</span>
          </div>

          <div className="producto-seleccion">
            <label className="producto-seleccion-label">Elegir talle</label>
            <div className="producto-talles">
              {tallesEnStock.map(talle => {
                const variacion = combo.variaciones.find(v => v.talle === talle)
                const disponible = variacion && variacion.stock > 0
                return (
                  <button
                    key={talle}
                    className={`producto-talle-btn ${talleSeleccionado === talle ? 'seleccionado' : ''} ${!disponible ? 'deshabilitado' : ''}`}
                    onClick={() => disponible && setTalleSeleccionado(talle)}
                    disabled={!disponible}
                  >
                    {talle}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="producto-cantidad-boton">
            <div className="producto-cantidad">
              <div className="producto-cantidad-controls">
                <button
                  className="producto-cantidad-btn"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                >
                  −
                </button>
                <span className="producto-cantidad-valor">{cantidad}</span>
                <button
                  className="producto-cantidad-btn"
                  onClick={() => setCantidad(Math.min(stockDisponible, cantidad + 1))}
                  disabled={cantidad >= stockDisponible}
                >
                  +
                </button>
              </div>
              <span className="producto-stock">Stock disponible: {stockDisponible}</span>
            </div>
            <div className="producto-accion">
              <BlueButton
                width="100%"
                height="48px"
                fontSize="16px"
                onClick={sinStockCombo ? undefined : handleAgregarCarrito}
                disabled={sinStockCombo || (stockDisponible === 0 && talleSeleccionado)}
              >
                {sinStockCombo ? 'Sin stock' : 'Agregar al carrito'}
              </BlueButton>
              {carritoError && (
                <span className="producto-error">{carritoError}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {combo.resenas && combo.resenas.length > 0 && (
        <div className="producto-resenas-section">
          <h2 className="producto-resenas-titulo">Reseñas</h2>
          <div className="producto-resenas-grid">
            {combo.resenas.map((resena) => (
              <ReviewCard key={resena.id ?? resena.documentId} resena={resena} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

