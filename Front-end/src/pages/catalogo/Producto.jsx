import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getProductoPorId } from '../../api/productos.js'
import { obtenerDescuentosActivos } from '../../api/promos.js'
import { obtenerCarritoUsuario, agregarAlCarrito } from '../../api/carrito.js'
import { agregarAWishlist, estaEnWishlist } from '../../api/wishlist.js'
import { 
  calcularPromedioResenas, 
  obtenerColoresEnStock, 
  obtenerTallesEnStock, 
  talleDisponible, 
  obtenerStockDisponible,
  encontrarVariacion
} from '../../utils/producto.js'
import ColorSelector from '../../components/forms/color/ColorSelector.jsx'
import ReviewCard from '../../components/cards/review-card/ReviewCard.jsx'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import './Producto.css'

const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337'

export default function Producto() {
  const { documentId } = useParams()
  const { rol } = useAuth()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0)
  const [colorSeleccionado, setColorSeleccionado] = useState('')
  const [talleSeleccionado, setTalleSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [descuento, setDescuento] = useState(0)
  const [enWishlist, setEnWishlist] = useState(false)

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
        
        setProducto({
          id: item.id ?? attrs?.id,
          documentId: item.documentId ?? attrs?.documentId ?? null,
          nombre: attrs?.nombre ?? '',
          descripcion: attrs?.descripcion ?? '',
          precio: attrs?.precio ?? 0,
          material: attrs?.material ?? '',
          imagen: attrs?.imagen?.data?.attributes?.url ?? attrs?.imagen?.url ?? '/assets/fallback.jpg',
          variaciones: (attrs?.variacions?.data ?? attrs?.variacions ?? []).map(v => ({
            id: v.id ?? v.attributes?.id,
            documentId: v.documentId ?? v.attributes?.documentId ?? null,
            color: v.attributes?.color ?? v.color ?? '',
            talle: v.attributes?.talle ?? v.talle ?? '',
            stock: Number(v.attributes?.stock ?? v.stock ?? 0)
          })),
          resenas: (attrs?.resenas?.data ?? attrs?.resenas ?? []).map(r => ({
            id: r.id ?? r.attributes?.id,
            documentId: r.documentId ?? r.attributes?.documentId ?? null,
            valoracion: r.attributes?.valoracion ?? r.valoracion ?? 0,
            comentario: r.attributes?.comentario ?? r.comentario ?? '',
            users_permissions_user: r.attributes?.users_permissions_user ?? r.users_permissions_user
          })),
          wishlists: attrs?.wishlists?.data ?? attrs?.wishlists ?? []
        })
        setDescuento(descuentoProducto)
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

  const promedioResenas = useMemo(() => {
    return calcularPromedioResenas(producto?.resenas)
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

  const imagenes = useMemo(() => {
    if (!producto) return []
    return [producto.imagen, producto.imagen, producto.imagen, producto.imagen]
  }, [producto])

  const precioBase = Number(producto?.precio ?? 0)
  const precioFinal = descuento > 0 
    ? precioBase - (precioBase * descuento) / 100 
    : precioBase

  const handleAgregarCarrito = async () => {
    if (!colorSeleccionado || !talleSeleccionado) {
      alert('Por favor selecciona color y talle')
      return
    }
    
    if (rol === 'guest') {
      alert('Necesitas iniciar sesión para agregar al carrito')
      return
    }

    try {
      const variacion = encontrarVariacion(producto.variaciones, colorSeleccionado, talleSeleccionado)
      if (!variacion || !variacion.documentId) {
        alert('No se pudo encontrar la variación seleccionada')
        return
      }

      const carrito = await obtenerCarritoUsuario()
      
      await agregarAlCarrito(carrito.documentId, variacion.documentId, cantidad)
      
      alert('Producto agregado al carrito exitosamente')
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
      alert('Error al agregar al carrito. Por favor intenta nuevamente.')
    }
  }

  const handleToggleWishlist = async () => {
    if (rol === 'guest') {
      alert('Necesitas iniciar sesión para agregar a wishlist')
      return
    }

    if (!producto?.documentId) {
      alert('Error: no se pudo obtener el producto')
      return
    }

    try {
      if (enWishlist) {
        // TODO: Implementar eliminar de wishlist si es necesario
        alert('Eliminar de wishlist aún no implementado')
        return
      }

      await agregarAWishlist(producto.documentId)
      setEnWishlist(true)
      alert('Producto agregado a wishlist')
    } catch (error) {
      console.error('Error al agregar a wishlist:', error)
      alert('Error al agregar a wishlist. Por favor intenta nuevamente.')
    }
  }

  useEffect(() => {
    if (producto?.documentId && rol !== 'guest') {
      estaEnWishlist(producto.documentId)
        .then(setEnWishlist)
        .catch(() => setEnWishlist(false))
    }
  }, [producto?.documentId, rol])

  if (cargando) {
    return <div className="producto-page">Cargando...</div>
  }

  if (!producto) {
    return <div className="producto-page">Producto no encontrado</div>
  }

  const imagenUrl = imagenes[imagenSeleccionada]?.startsWith('http') 
    ? imagenes[imagenSeleccionada] 
    : `${BACKEND_URL}${imagenes[imagenSeleccionada] || '/assets/fallback.jpg'}`

  return (
    <div className="producto-page">
      <div className="producto-container">
        <div className="producto-imagenes">
          <div className="producto-imagenes-pequenas">
            {imagenes.slice(0, 3).map((img, index) => {
              const imgUrl = img?.startsWith('http') ? img : `${BACKEND_URL}${img || '/assets/fallback.jpg'}`
              return (
                <button
                  key={index}
                  className={`producto-imagen-pequena ${imagenSeleccionada === index ? 'activa' : ''}`}
                  onClick={() => setImagenSeleccionada(index)}
                >
                  <img src={imgUrl} alt={`${producto.nombre} ${index + 1}`} />
                </button>
              )
            })}
          </div>
          <div className="producto-imagen-grande">
            <img src={imagenUrl} alt={producto.nombre} />
          </div>
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
                <span key={i} className={i < Math.round(promedioResenas) ? 'estrella llena' : 'estrella vacia'}>
                  ★
                </span>
              ))}
            </div>
            <span className="producto-resenas-texto">
              ({producto.resenas.length} {producto.resenas.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>

          <div className="producto-precio">
            {descuento > 0 ? (
              <>
                <span className="producto-precio-original">${precioBase.toFixed(2)}</span>
                <span className="producto-precio-final">${precioFinal.toFixed(2)}</span>
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
            <BlueButton
              width="100%"
              height="48px"
              fontSize="16px"
              onClick={handleAgregarCarrito}
              disabled={!colorSeleccionado || !talleSeleccionado || stockDisponible === 0}
            >
              Agregar al carrito
            </BlueButton>
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
    </div>
  )
}
