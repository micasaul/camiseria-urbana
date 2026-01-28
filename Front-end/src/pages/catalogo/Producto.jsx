import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getProductoPorId } from '../../api/productos.js'
import { obtenerDescuentosActivos } from '../../api/promos.js'
import { obtenerCarritoUsuario, agregarAlCarrito } from '../../api/carrito.js'
import { agregarAWishlist, eliminarDeWishlist, estaEnWishlist } from '../../api/wishlist.js'
import { 
  calcularPromedioValoraciones,
  obtenerColoresEnStock, 
  obtenerTallesEnStock, 
  talleDisponible, 
  obtenerStockDisponible,
  encontrarVariacion
} from '../../utils/producto.js'
import ColorSelector from '../../components/forms/color/ColorSelector.jsx'
import ReviewCard from '../../components/cards/review-card/ReviewCard.jsx'
import ProductosMismaMarca from '../../components/cards/ProductosMismaMarca.jsx'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import './Producto.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function Producto() {
  const { documentId } = useParams()
  const { rol } = useAuth()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [colorSeleccionado, setColorSeleccionado] = useState('')
  const [talleSeleccionado, setTalleSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [descuento, setDescuento] = useState(0)
  const [enWishlist, setEnWishlist] = useState(false)
  const [carritoError, setCarritoError] = useState('')
  const [marcaId, setMarcaId] = useState(null)

  const obtenerErrorCarrito = () => {
    if (!colorSeleccionado && !talleSeleccionado) {
      return 'Selecciona color y talle para agregar al carrito.'
    }
    if (!colorSeleccionado) {
      return 'Selecciona un color para agregar al carrito.'
    }
    if (!talleSeleccionado) {
      return 'Selecciona un talle para agregar al carrito.'
    }
    return ''
  }

  useEffect(() => {
    let activo = true
    
    const cargarProducto = async () => {
      try {
        const res = await getProductoPorId(documentId)
        if (!activo) return
        
        const item = res?.data ?? res
        const attrs = item?.attributes ?? item
        
        const descuentosMap = await obtenerDescuentosActivos()
        const productoId = item?.documentId ?? item?.id
        const descuentoProducto = descuentosMap.get(String(productoId)) ?? 0
        
        const marca = attrs?.marca?.data ?? attrs?.marca
        const marcaAttrs = marca?.attributes ?? marca
        const marcaIdValue = marca?.documentId ?? marcaAttrs?.documentId ?? marca?.id ?? marcaAttrs?.id ?? null
        
        setProducto({
          id: item.id ?? attrs?.id,
          documentId: item.documentId ?? attrs?.documentId ?? null,
          nombre: attrs?.nombre ?? item?.nombre ?? '',
          descripcion: attrs?.descripcion ?? item?.descripcion ?? '',
          precio: attrs?.precio ?? item?.precio ?? 0,
          material: attrs?.material ?? item?.material ?? '',
          variaciones: item?.variaciones ?? [],
          wishlists: attrs?.wishlists?.data ?? attrs?.wishlists ?? item?.wishlists ?? [],
          resenas: item?.resenas ?? [],
          valoraciones: item?.valoraciones ?? []
        })
        setDescuento(descuentoProducto)
        setMarcaId(marcaIdValue)
      } catch (error) {
        console.error('Error al cargar producto:', error)
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }
    
    cargarProducto()
    
    return () => {
      activo = false
    }
  }, [documentId])

  const promedioValoraciones = useMemo(() => {
    return calcularPromedioValoraciones(producto?.valoraciones)
  }, [producto])

  const coloresEnStock = useMemo(() => {
    return obtenerColoresEnStock(producto?.variaciones)
  }, [producto])

  const tallesEnStock = useMemo(() => {
    return obtenerTallesEnStock(producto?.variaciones, colorSeleccionado)
  }, [producto, colorSeleccionado])

  const esTalleDisponible = (talle) => {
    return talleDisponible(producto?.variaciones, talle, colorSeleccionado, tallesEnStock)
  }

  const stockDisponible = useMemo(() => {
    return obtenerStockDisponible(producto?.variaciones, colorSeleccionado, talleSeleccionado)
  }, [producto, colorSeleccionado, talleSeleccionado])

  const sinStockProducto = useMemo(() => {
    const variaciones = producto?.variaciones ?? []
    if (!variaciones.length) return true
    return !variaciones.some((variacion) => Number(variacion?.stock ?? 0) > 0)
  }, [producto])

  const imagenUrl = useMemo(() => {
    const vars = producto?.variaciones ?? []
    
    if (colorSeleccionado && talleSeleccionado) {
      const v = encontrarVariacion(vars, colorSeleccionado, talleSeleccionado)
      if (v?.imagen) return v.imagen
    }
    
    if (colorSeleccionado) {
      const variacionesColor = vars.filter((v) => v?.color === colorSeleccionado && v?.imagen)
      if (variacionesColor.length > 0) return variacionesColor[0].imagen
    }
    
    if (talleSeleccionado) {
      const variacionesTalle = vars.filter((v) => v?.talle === talleSeleccionado && v?.imagen)
      if (variacionesTalle.length > 0) return variacionesTalle[0].imagen
    }
    
    const conImg = vars.filter((variacion) => variacion?.imagen)
    if (conImg.length) return conImg[0].imagen
    return `${BACKEND_URL}/assets/fallback.jpg`
  }, [producto?.variaciones, colorSeleccionado, talleSeleccionado])

  const precioBase = Number(producto?.precio ?? 0)
  const precioFinal = descuento > 0 
    ? precioBase - (precioBase * descuento) / 100 
    : precioBase

  const handleAgregarCarrito = async () => {
    const error = obtenerErrorCarrito()
    if (error) {
      setCarritoError(error)
      return
    }
    
    if (rol === 'guest') {
      return
    }

    if (sinStockProducto) {
      return
    }

    try {
      const variacion = encontrarVariacion(producto.variaciones, colorSeleccionado, talleSeleccionado)
      if (!variacion || !variacion.documentId) {
        return
      }

      const carrito = await obtenerCarritoUsuario()
      
      await agregarAlCarrito(carrito.documentId, variacion.documentId, cantidad)
      setCarritoError('')
      window.dispatchEvent(new CustomEvent('cart:open'))
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
    }
  }

  const handleToggleWishlist = async () => {
    if (rol === 'guest') {
      return
    }

    if (!producto?.documentId) {
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

      const creada = await agregarAWishlist(producto.documentId)
      const item = creada?.data ?? creada
      const attrs = item?.attributes ?? item
      const wishlistId = item?.documentId ?? attrs?.documentId ?? true
      setEnWishlist(wishlistId)
    } catch (error) {
      console.error('Error al agregar a wishlist:', error)
    }
  }

  useEffect(() => {
    if (producto?.documentId && rol !== 'guest') {
      estaEnWishlist(producto.documentId)
        .then((resultado) => setEnWishlist(resultado || false))
        .catch(() => setEnWishlist(false))
    }
  }, [producto?.documentId, rol])

  useEffect(() => {
    if (carritoError) {
      setCarritoError(obtenerErrorCarrito())
    }
  }, [colorSeleccionado, talleSeleccionado, carritoError])

  if (cargando) {
    return <div className="producto-page">Cargando...</div>
  }

  if (!producto) {
    return <div className="producto-page">Producto no encontrado</div>
  }

  return (
    <div className="producto-page">
      <div className="producto-container">
        <div className={`producto-imagen-wrap${sinStockProducto ? ' agotado' : ''}`}>
          <img src={imagenUrl} alt={producto.nombre} className="producto-imagen" />
          {sinStockProducto && <div className="producto-agotado">AGOTADO</div>}
        </div>

        <div className="producto-info">
          <div className="producto-header">
            <h1 className="producto-nombre">{producto.nombre}</h1>
            <button 
              className={`producto-wishlist-btn ${enWishlist ? 'activo' : ''}`}
              onClick={handleToggleWishlist}
              aria-label="Agregar a wishlist"
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
              ({(producto.resenas?.length ?? 0)} {(producto.resenas?.length ?? 0) === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>

          <div className="producto-precio">
            {descuento > 0 ? (
              <>
                <span className="producto-precio-original">${precioBase.toFixed(2)}</span>
                <span className="producto-precio-final">${precioFinal.toFixed(2)}</span>
                <span className="producto-descuento">-{descuento}%</span>
              </>
            ) : (
              <span className="producto-precio-final">${precioBase.toFixed(2)}</span>
            )}
          </div>

          <div className="producto-descripcion">
            <p>{producto.descripcion}</p>
          </div>

          <div className="producto-seleccion">
            <label className="producto-seleccion-label">Elegir color</label>
            <ColorSelector
              colores={coloresEnStock}
              selectedColors={colorSeleccionado ? [colorSeleccionado] : []}
              onColorToggle={(colores) => {
                setColorSeleccionado(colores[0] ?? '')
                setTalleSeleccionado('') 
              }}
              multiple={false}
            />
          </div>

          <div className="producto-seleccion">
            <label className="producto-seleccion-label">Elegir talle</label>
            <div className="producto-talles">
              {tallesEnStock.map(talle => {
                const disponible = esTalleDisponible(talle)
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
              {stockDisponible > 0 && (
                <span className="producto-stock">Stock disponible: {stockDisponible}</span>
              )}
            </div>
            <div className="producto-accion">
              <BlueButton
                width="100%"
                height="48px"
                fontSize="16px"
                onClick={sinStockProducto ? undefined : handleAgregarCarrito}
                disabled={sinStockProducto || (stockDisponible === 0 && colorSeleccionado && talleSeleccionado)}
              >
                {sinStockProducto ? 'Sin stock' : 'Agregar al carrito'}
              </BlueButton>
              {stockDisponible > 0 && stockDisponible < 5 && colorSeleccionado && talleSeleccionado && (
                <span className="producto-ultimas-unidades">¡Ultimas unidades!</span>
              )}
              {carritoError && (
                <span className="producto-error">{carritoError}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {producto.resenas && producto.resenas.length > 0 && (
        <div className="producto-resenas-section">
          <h2 className="producto-resenas-titulo">Reseñas</h2>
          <div className="producto-resenas-grid">
            {producto.resenas.map((resena) => (
              <ReviewCard key={resena.id ?? resena.documentId} resena={resena} />
            ))}
          </div>
        </div>
      )}

      {marcaId && (
        <div className="producto-resenas-section">
          <h2 className="producto-resenas-titulo">Productos relacionados</h2>
          <ProductosMismaMarca 
            marcaId={marcaId} 
            productoActualId={producto.documentId ?? producto.id}
          />
        </div>
      )}
    </div>
  )
}
