import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { buscarProductos } from '../../api/productos.js'
import ProductCard from '../../components/cards/product-card/ProductCard.jsx'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import './Buscar.css'

export default function Buscar() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('query') || ''
  
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ page: 1, pageSize: 12, pageCount: 1, total: 0 })

  useEffect(() => {
    setPagina(1)
  }, [query])

  useEffect(() => {
    let activo = true
    setCargando(true)
    
    if (!query.trim()) {
      setProductos([])
      setPaginacion({ page: 1, pageSize: 12, pageCount: 1, total: 0 })
      setCargando(false)
      return
    }

    buscarProductos(query, pagina, 12)
      .then((data) => {
        if (!activo) return
        setProductos(data.items)
        setPaginacion(data.pagination)
      })
      .catch(() => {
        if (!activo) return
        setProductos([])
        setPaginacion({ page: 1, pageSize: 12, pageCount: 1, total: 0 })
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [query, pagina])

  const cambiarPagina = (nuevaPagina) => {
    setPagina(nuevaPagina)
  }

  const sinResultados = !cargando && productos.length === 0 && query.trim()

  return (
    <div className="buscar-page">
      <div className="buscar-container">
        <main className="buscar-products">
          {cargando ? (
            <div className="buscar-loading">Buscando productos...</div>
          ) : sinResultados ? (
            <div className="buscar-empty">
              <p className="buscar-error-message">
                No se encontraron resultados para "{query}". Prueba con una palabra diferente.
              </p>
              <BlueButton
                width="200px"
                height="40px"
                onClick={() => navigate('/catalogo')}
              >
                Explorar otros productos
              </BlueButton>
            </div>
          ) : productos.length > 0 ? (
            <>
              <h2 className="buscar-title">Resultados para "{query}"</h2>
              <div className="buscar-grid">
                {productos.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>

              <PageButton
                pagina={pagina}
                pageCount={paginacion.pageCount || 1}
                onPageChange={cambiarPagina}
                className="buscar-pagination"
              />
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
