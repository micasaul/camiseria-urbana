import { useEffect, useState } from "react"
import { getProductosConFiltros } from "../../api/productos.js"
import { ordenarPorStock } from "../../utils/producto.js"
import ProductCard from "../cards/product-card/ProductCard.jsx"
import "./Destacados.css"

export default function Destacados() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    getProductosConFiltros({ ordenarPor: "createdAt:desc" }, 1, 4)
      .then((data) => {
        if (!activo) return
        setProductos(ordenarPorStock(data.items))
      })
      .catch(error => {
        console.error("Error cargando productos:", error)
        if (!activo) setProductos([])
      })
      .finally(() => {
        if (!activo) return
        setLoading(false)
      })

    return () => { activo = false }
  }, [])

  if (loading) return <div className="destacados-loading">Cargando destacados...</div>
  if (productos.length === 0) return <div className="destacados-empty">No hay productos destacados</div>

  return (
    <div className="destacados-container">
      <div className="destacados-grid">
        {productos.map(prod => (
          <ProductCard key={prod.documentId ?? prod.id} producto={prod} />
        ))}
      </div>
    </div>
  )
}
