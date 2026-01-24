import { useEffect, useState } from "react"
import ProductCard from "../cards/product-card/ProductCard.jsx"
import "./Destacados.css"

const BACKEND_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337"

export default function Destacados() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    fetch(`${BACKEND_URL}/api/productos?pagination[pageSize]=4&sort=createdAt:desc`)
      .then(res => res.json())
      .then(json => {
        if (!activo) return
        setProductos(json.data || [])
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
          <ProductCard key={prod.id} producto={prod} />
        ))}
      </div>
    </div>
  )
}
