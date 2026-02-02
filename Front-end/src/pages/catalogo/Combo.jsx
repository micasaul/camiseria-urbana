import { useState, useEffect } from 'react'
import { getCombos } from '../../api/combos.js'
import ProductCard from '../../components/cards/product-card/ProductCard.jsx'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import './Combo.css'

const ITEMS_POR_PAGINA = 8

export default function Combo() {
  const [combos, setCombos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [paginacion, setPaginacion] = useState({ page: 1, pageCount: 1, total: 0 })
  const [ordenarPor, setOrdenarPor] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)

    getCombos(1, 1000)
      .then((data) => {
        if (!activo) return

        const items = data.items ?? []
        let combosAdaptados = items.map(combo => ({
          ...combo,
          esCombo: true,
          variaciones: combo.variaciones ?? [{ stock: 1 }]
        }))
        
        if (ordenarPor) {
          combosAdaptados.sort((a, b) => {
            if (ordenarPor === 'precio:desc') {
              const precioA = Number(a.precio ?? 0)
              const precioB = Number(b.precio ?? 0)
              if (precioA !== precioB) return precioB - precioA
            } else if (ordenarPor === 'precio:asc') {
              const precioA = Number(a.precio ?? 0)
              const precioB = Number(b.precio ?? 0)
              if (precioA !== precioB) return precioA - precioB
            } else if (ordenarPor === 'createdAt:desc') {
              const fechaA = a.createdAt || a.publishedAt
              const fechaB = b.createdAt || b.publishedAt
              if (!fechaA && !fechaB) return 0
              if (!fechaA) return 1
              if (!fechaB) return -1
              const timeA = new Date(fechaA).getTime()
              const timeB = new Date(fechaB).getTime()
              if (isNaN(timeA) || isNaN(timeB)) return 0
              return timeB - timeA
            } else if (ordenarPor === 'createdAt:asc') {
              const fechaA = a.createdAt || a.publishedAt
              const fechaB = b.createdAt || b.publishedAt
              if (!fechaA && !fechaB) return 0
              if (!fechaA) return 1
              if (!fechaB) return -1
              const timeA = new Date(fechaA).getTime()
              const timeB = new Date(fechaB).getTime()
              if (isNaN(timeA) || isNaN(timeB)) return 0
              return timeA - timeB
            }
            return 0
          })
        }
        
        setCombos(combosAdaptados)
        const totalItems = combosAdaptados.length
        setPaginacion({
          page: 1,
          pageCount: Math.ceil(totalItems / ITEMS_POR_PAGINA) || 1,
          total: totalItems
        })
      })
      .catch(() => {
        if (activo) {
          setCombos([])
          setPaginacion({ page: 1, pageCount: 1, total: 0 })
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [ordenarPor])

  const combosEnPantalla = combos.slice(
    (paginacion.page - 1) * ITEMS_POR_PAGINA,
    paginacion.page * ITEMS_POR_PAGINA
  )

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, page: nuevaPagina }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="combo-page">
      <div className="combo-container">
        <main className="combo-content">
          <h1 className="combo-title">Combos</h1>
          {cargando ? (
            <div className="combo-loading">Cargando combos...</div>
          ) : combos.length === 0 ? (
            <div className="combo-empty">
              <p>No se encontraron combos disponibles.</p>
            </div>
          ) : (
            <>
              <div className="combo-sort">
                <select 
                  className="combo-sort-select" 
                  value={ordenarPor} 
                  onChange={(e) => setOrdenarPor(e.target.value)}
                >
                  <option value="">Ordenar por</option>
                  <option value="precio:desc">Precio: Mayor a menor</option>
                  <option value="precio:asc">Precio: Menor a mayor</option>
                  <option value="createdAt:desc">Fecha: Más recientes</option>
                  <option value="createdAt:asc">Fecha: Más antiguos</option>
                </select>
              </div>
              <div className="combo-grid">
                {combosEnPantalla.map((combo) => {
                  const comboKey = String(combo.documentId ?? combo.id)
                  const comboIdForRoute = combo.documentId ?? combo.id
                  return (
                    <ProductCard
                      key={comboKey}
                      producto={combo}
                      descuento={0}
                      to={comboIdForRoute ? `/combo/${comboIdForRoute}` : null}
                    />
                  )
                })}
              </div>

              <PageButton
                pagina={paginacion.page}
                pageCount={paginacion.pageCount}
                onPageChange={cambiarPagina}
                className="combo-pagination"
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
