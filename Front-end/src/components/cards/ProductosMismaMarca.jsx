import { useEffect, useState } from "react"
import { getProductosConFiltros } from "../../api/productos.js"
import { obtenerDescuentosActivos } from "../../api/promos.js"
import { ordenarPorStock } from "../../utils/producto.js"
import { calcularCantidadTotal } from "../../utils/adminHelpers.js"
import ProductCard from "../cards/product-card/ProductCard.jsx"
import "./Destacados.css"

export default function ProductosMismaMarca({ marcaId, productoActualId }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [descuentosMap, setDescuentosMap] = useState(new Map())
  const [descuentosLoaded, setDescuentosLoaded] = useState(false)

  useEffect(() => {
    let activo = true
    obtenerDescuentosActivos()
      .then((map) => {
        if (activo) { 
          setDescuentosMap(map)
          setDescuentosLoaded(true)
        }
      })
      .catch(() => {
        if (activo) { 
          setDescuentosMap(new Map())
          setDescuentosLoaded(true)
        }
      })
    
    return () => { activo = false }
  }, [])

  useEffect(() => {
    let activo = true
    setLoading(true)

    if (!descuentosLoaded || !marcaId) {
      if (!marcaId) setLoading(false)
      return () => { activo = false }
    }

    const marcaUrl = `${import.meta.env.VITE_BACKEND_URL}/api/marcas/${marcaId}?populate[productos][populate][0]=variacions&populate[productos][populate][1]=promo_productos&populate[productos][populate][2]=promo_productos.promo`
    
    fetch(marcaUrl)
      .then(async res => {
        if (!res.ok) {
          return fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productos?populate[0]=variacions&populate[1]=marca&populate[2]=promo_productos&populate[3]=promo_productos.promo&filters[$or][0][inactivo][$eq]=false&filters[$or][1][inactivo][$null]=true&pagination[pageSize]=1000`)
            .then(res2 => res2.json())
            .then(data => ({ esFallback: true, data }))
        }
        return res.json()
      })
      .then(async (marcaData) => {
        if (!activo) return
        
        let productosIds = []
        
        if (marcaData.esFallback) {
          const productosFiltrados = (marcaData.data?.data || []).filter(item => {
            const attrs = item?.attributes ?? item
            const marca = attrs?.marca?.data ?? attrs?.marca
            if (!marca) return false
            const marcaDocId = marca?.documentId ?? marca?.attributes?.documentId ?? marca?.id ?? marca?.attributes?.id
            return String(marcaDocId) === String(marcaId)
          })
          productosIds = productosFiltrados.map(item => item?.documentId ?? item?.attributes?.documentId).filter(Boolean)
        } else {
          const productos = marcaData?.data?.productos ?? marcaData?.data?.attributes?.productos?.data ?? []
          productosIds = productos.map(item => {
            return item?.documentId ?? item?.attributes?.documentId ?? item?.id ?? item?.attributes?.id
          }).filter(Boolean)
        }
        
        let productosOrdenados = []
        
        if (productosIds.length === 0) {
          const otrosProductos = await getProductosConFiltros({}, 1, 1000)
          const otrosConStock = otrosProductos.items.filter((producto) => {
            if (productoActualId && String(producto.documentId ?? producto.id) === String(productoActualId)) {
              return false
            }
            const variacionesNormalizadas = (producto.variaciones || []).map((variacion) => {
              return { stock: Number(variacion?.stock ?? 0) }
            })
            const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
            return cantidadTotal > 0
          })
          productosOrdenados = ordenarPorStock(otrosConStock).slice(0, 4)
        } else {
          const productosNormalizados = await getProductosConFiltros({ ids: productosIds }, 1, 1000)
          
          const productosConStock = productosNormalizados.items.filter((producto) => {
            if (productoActualId && String(producto.documentId ?? producto.id) === String(productoActualId)) {
              return false
            }
            
            const variacionesNormalizadas = (producto.variaciones || []).map((variacion) => {
              return { stock: Number(variacion?.stock ?? 0) }
            })

            const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
            return cantidadTotal > 0
          })
          
          productosOrdenados = ordenarPorStock(productosConStock).slice(0, 4)
          
          if (productosOrdenados.length < 4) {
            const cantidadNecesaria = 4 - productosOrdenados.length
            const otrosProductos = await getProductosConFiltros({}, 1, 1000)
            
            const otrosConStock = otrosProductos.items.filter((producto) => {
              const productoId = String(producto.documentId ?? producto.id)
              const yaIncluido = productosOrdenados.some(p => String(p.documentId ?? p.id) === productoId)
              if (yaIncluido) return false
              if (productoActualId && productoId === String(productoActualId)) return false
              
              const variacionesNormalizadas = (producto.variaciones || []).map((variacion) => {
                return { stock: Number(variacion?.stock ?? 0) }
              })
              const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
              return cantidadTotal > 0
            })
            
            const otrosOrdenados = ordenarPorStock(otrosConStock).slice(0, cantidadNecesaria)
            productosOrdenados = [...productosOrdenados, ...otrosOrdenados]
          }
        }
        
        setProductos(productosOrdenados)
      })
      .catch(error => {
        console.error("Error cargando productos de la misma marca:", error)
        if (activo) setProductos([])
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    return () => { activo = false }
  }, [descuentosLoaded, marcaId, productoActualId])

  if (loading) return <div className="destacados-loading">Cargando productos...</div>
  if (productos.length === 0) return null

  return (
    <div className="destacados-container">
      <div className="destacados-grid">
        {productos.map(prod => {
          const productoKey = String(prod.documentId ?? prod.id)
          const descuento = descuentosMap.get(productoKey) ?? 0
          return (
            <ProductCard 
              key={prod.documentId ?? prod.id} 
              producto={prod} 
              descuento={descuento}
            />
          )
        })}
      </div>
    </div>
  )
}
