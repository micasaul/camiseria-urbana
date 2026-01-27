import { useEffect, useState } from "react"
import { getProductosConFiltros } from "../../api/productos.js"
import { getCombos } from "../../api/combos.js"
import { obtenerDescuentosActivos } from "../../api/promos.js"
import { ordenarPorStock } from "../../utils/producto.js"
import { calcularCantidadTotal } from "../../utils/adminHelpers.js"
import ProductCard from "../cards/product-card/ProductCard.jsx"
import "./Destacados.css"

export default function Destacados() {
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

    if (!descuentosLoaded) return () => { activo = false }

    const idsOfertas = [...descuentosMap.entries()]
      .filter(([, d]) => (Number(d) ?? 0) > 0)
      .map(([id]) => id)

    const promesas = []
    if (idsOfertas.length > 0) {
      promesas.push(getProductosConFiltros({ ids: idsOfertas }, 1, 1000))
    } else {
      promesas.push(Promise.resolve({ items: [] })) 
    }
    promesas.push(getCombos(1, 1000))

    Promise.all(promesas)
      .then(([productosData, combosData]) => {
        if (!activo) return
        
        const items = productosData.items ?? []
        
        const productosConStock = items.filter((producto) => {
          const variacionesRaw = producto?.variaciones ?? producto?.variacions?.data ?? producto?.variacions ?? []
          const variacionesLista = Array.isArray(variacionesRaw) ? variacionesRaw : (variacionesRaw?.data ?? [])
          
          const variacionesNormalizadas = variacionesLista.map((variacion) => {
            const attrs = variacion?.attributes ?? variacion
            return { stock: Number(attrs?.stock ?? variacion?.stock ?? attrs?.cantidad ?? variacion?.cantidad ?? 0) }
          })

          const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
          return cantidadTotal > 0
        })
        
        const productosOrdenados = ordenarPorStock(productosConStock)
        let itemsFinales = productosOrdenados.slice(0, 4)
        
        if (itemsFinales.length < 4) {
          const combosItems = combosData.items ?? []
          
          const combosConStock = combosItems.filter((combo) => {
            const variacionesRaw = combo?.variaciones ?? []
            const variacionesLista = Array.isArray(variacionesRaw) ? variacionesRaw : []
            
            const variacionesNormalizadas = variacionesLista.map((variacion) => {
              return { stock: Number(variacion?.stock ?? 0) }
            })

            const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
            return cantidadTotal > 0
          })
          
          const combosOrdenados = ordenarPorStock(combosConStock)
          const cantidadNecesaria = 4 - itemsFinales.length
          const combosParaCompletar = combosOrdenados.slice(0, cantidadNecesaria)
          
          const combosAdaptados = combosParaCompletar.map(combo => ({
            ...combo,
            esCombo: true
          }))
          
          itemsFinales = [...itemsFinales, ...combosAdaptados]
        }
        
        setProductos(itemsFinales)
      })
      .catch(error => {
        console.error("Error cargando productos:", error)
        if (activo) setProductos([])
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    return () => { activo = false }
  }, [descuentosLoaded, descuentosMap])

  if (loading) return <div className="destacados-loading">Cargando destacados...</div>
  if (productos.length === 0) return null

  return (
    <div className="destacados-container">
      <div className="destacados-grid">
        {productos.map(prod => {
          const productoKey = String(prod.documentId ?? prod.id)
          const descuento = descuentosMap.get(productoKey) ?? 0
          const comboIdForRoute = prod.esCombo ? (prod.documentId ?? prod.id) : null
          return (
            <ProductCard 
              key={prod.documentId ?? prod.id} 
              producto={prod} 
              descuento={descuento}
              to={comboIdForRoute ? `/combo/${comboIdForRoute}` : null}
            />
          )
        })}
      </div>
    </div>
  )
}
