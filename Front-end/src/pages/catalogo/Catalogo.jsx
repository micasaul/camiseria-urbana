import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProductosConFiltros } from '../../api/productos.js'
import { getProductoEnums } from '../../api/enums.js'
import { obtenerDescuentosActivos } from '../../api/promos.js'
import { ordenarPorStock } from '../../utils/producto.js'
import ColorSelector from '../../components/forms/color/ColorSelector.jsx'
import ProductCard from '../../components/cards/product-card/ProductCard.jsx'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import './Catalogo.css'

const BACKEND_URL = import.meta.env.BACKEND_URL

export default function Catalogo() {
  const [searchParams] = useSearchParams()
  const materialFromUrl = searchParams.get('material') || ''
  const ofertasFromUrl = searchParams.get('ofertas') === '1'
  
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [paginacion, setPaginacion] = useState({ page: 1, pageSize: 6, pageCount: 1, total: 0 })
  
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    material: '',
    precioMin: '',
    precioMax: '',
    colores: [],
    talles: [],
    ordenarPor: ''
  })
  
  const [ordenarPorPendiente, setOrdenarPorPendiente] = useState('')
  const [materialPendiente, setMaterialPendiente] = useState('')
  const [precioMinPendiente, setPrecioMinPendiente] = useState('')
  const [precioMaxPendiente, setPrecioMaxPendiente] = useState('')
  const [coloresPendientes, setColoresPendientes] = useState([])
  const [tallesPendientes, setTallesPendientes] = useState([])
  const [errorPrecioMin, setErrorPrecioMin] = useState('')
  const [errorPrecioMax, setErrorPrecioMax] = useState('')
  
  const [materiales, setMateriales] = useState([])
  const [talles, setTalles] = useState([])
  const [colores, setColores] = useState([])
  const [precioMinReal, setPrecioMinReal] = useState(0)
  const [precioMaxReal, setPrecioMaxReal] = useState(0)
  const [descuentosMap, setDescuentosMap] = useState(new Map())
  const [descuentosLoaded, setDescuentosLoaded] = useState(false)

  useEffect(() => {
    let activo = true
    getProductoEnums()
      .then((data) => {
        if (!activo) return
        setMateriales(data?.material ?? [])
        setTalles(data?.talle ?? [])
        setColores(data?.color ?? [])
      })
      .catch(() => {
        if (!activo) return
        setMateriales([])
        setTalles([])
        setColores([])
      })

    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (materialFromUrl && materiales.length > 0) {
      if (materiales.includes(materialFromUrl)) {
        setMaterialPendiente(materialFromUrl)
        setFiltrosAplicados(prev => ({
          ...prev,
          material: materialFromUrl
        }))
      }
    }
  }, [materialFromUrl, materiales])

  useEffect(() => {
    let activo = true
    
    const obtenerPreciosReales = async () => {
      try {
        const [resMin, resMax] = await Promise.all([
          fetch(`${BACKEND_URL}/api/productos?sort=precio:asc&pagination[pageSize]=1`),
          fetch(`${BACKEND_URL}/api/productos?sort=precio:desc&pagination[pageSize]=1`)
        ])
        
        if (resMin.ok) {
          const dataMin = await resMin.json()
          const itemMin = dataMin?.data?.[0]
          if (itemMin) {
            const attrsMin = itemMin?.attributes ?? itemMin
            if (activo) setPrecioMinReal(attrsMin?.precio ?? 0)
          }
        }
        
        if (resMax.ok) {
          const dataMax = await resMax.json()
          const itemMax = dataMax?.data?.[0]
          if (itemMax) {
            const attrsMax = itemMax?.attributes ?? itemMax
            if (activo) setPrecioMaxReal(attrsMax?.precio ?? 10000)
          }
        }
      } catch (error) {
        console.error('Error al obtener precios reales:', error)
        if (activo) {
          setPrecioMinReal(0)
          setPrecioMaxReal(10000)
        }
      }
    }
    obtenerPreciosReales()
    
    obtenerDescuentosActivos()
      .then((map) => {
        if (!activo) return
        setDescuentosMap(map)
        setDescuentosLoaded(true)
      })
      .catch((error) => {
        console.error('Error al obtener descuentos:', error)
        if (!activo) return
        setDescuentosMap(new Map())
        setDescuentosLoaded(true)
      })
    
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    let activo = true
    setCargando(true)

    if (ofertasFromUrl && !descuentosLoaded) {
      return () => { activo = false }
    }

    const idsOfertas = ofertasFromUrl
      ? [...descuentosMap.entries()]
          .filter(([, d]) => (Number(d) ?? 0) > 0)
          .map(([id]) => id)
      : []

    if (ofertasFromUrl && idsOfertas.length === 0) {
      setProductos([])
      setPaginacion({ page: 1, pageSize: paginacion.pageSize, pageCount: 1, total: 0 })
      setCargando(false)
      return () => { activo = false }
    }

    const filtros = {
      ...(filtrosAplicados.material && { material: filtrosAplicados.material }),
      ...(filtrosAplicados.precioMin && { precioMin: Number(filtrosAplicados.precioMin) }),
      ...(filtrosAplicados.precioMax && { precioMax: Number(filtrosAplicados.precioMax) }),
      ...(filtrosAplicados.colores.length > 0 && { colores: filtrosAplicados.colores }),
      ...(filtrosAplicados.talles.length > 0 && { talles: filtrosAplicados.talles }),
      ...(filtrosAplicados.ordenarPor && { ordenarPor: filtrosAplicados.ordenarPor }),
      ...(ofertasFromUrl && idsOfertas.length > 0 && { ids: idsOfertas })
    }

    getProductosConFiltros(filtros, paginacion.page, paginacion.pageSize)
      .then((data) => {
        if (!activo) return
        setProductos(ordenarPorStock(data.items))
        setPaginacion(data.pagination)
      })
      .catch((error) => {
        console.error('Error al cargar productos:', error)
        if (!activo) return
        setProductos([])
        setPaginacion({ page: 1, pageSize: paginacion.pageSize, pageCount: 1, total: 0 })
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [filtrosAplicados, paginacion.page, ofertasFromUrl, descuentosLoaded, descuentosMap])

  useEffect(() => {
    setPaginacion(prev => ({ ...prev, page: 1 }))
  }, [filtrosAplicados])

  useEffect(() => {
    setPaginacion(prev => ({ ...prev, page: 1 }))
  }, [ofertasFromUrl])

  const handlePrecioMinChange = (e) => {
    const valor = e.target.value
    if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
      setPrecioMinPendiente(valor)
      const numValor = Number(valor)
      if (valor !== '' && !isNaN(numValor) && precioMaxPendiente && numValor > Number(precioMaxPendiente)) {
        setPrecioMaxPendiente(valor)
      }
    }
  }

  const handlePrecioMaxChange = (e) => {
    const valor = e.target.value
    if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
      setPrecioMaxPendiente(valor)
      const numValor = Number(valor)
      if (valor !== '' && !isNaN(numValor) && precioMinPendiente && numValor < Number(precioMinPendiente)) {
        setPrecioMinPendiente(valor)
      }
    }
  }

  const aplicarFiltros = () => {
    let hayError = false
    setErrorPrecioMin('')
    setErrorPrecioMax('')

    if (precioMinPendiente !== '') {
      const numMin = Number(precioMinPendiente)
      if (isNaN(numMin)) {
        setErrorPrecioMin('Debe ser un número válido')
        hayError = true
      } else if (numMin < precioMinReal) {
        setErrorPrecioMin(`El mínimo no puede ser menor a $${precioMinReal.toFixed(2)}`)
        hayError = true
      } else if (numMin > precioMaxReal) {
        setErrorPrecioMin(`El mínimo no puede ser mayor a $${precioMaxReal.toFixed(2)}`)
        hayError = true
      }
    }

    if (precioMaxPendiente !== '') {
      const numMax = Number(precioMaxPendiente)
      if (isNaN(numMax)) {
        setErrorPrecioMax('Debe ser un número válido')
        hayError = true
      } else if (numMax > precioMaxReal) {
        setErrorPrecioMax(`El máximo no puede ser mayor a $${precioMaxReal.toFixed(2)}`)
        hayError = true
      } else if (numMax < precioMinReal) {
        setErrorPrecioMax(`El máximo no puede ser menor a $${precioMinReal.toFixed(2)}`)
        hayError = true
      }
    }

    if (precioMinPendiente !== '' && precioMaxPendiente !== '') {
      const numMin = Number(precioMinPendiente)
      const numMax = Number(precioMaxPendiente)
      if (!isNaN(numMin) && !isNaN(numMax) && numMax < numMin) {
        setErrorPrecioMax('El máximo no puede ser menor que el mínimo')
        hayError = true
      }
    }

    if (hayError) {
      return
    }

    setFiltrosAplicados({
      material: materialPendiente,
      precioMin: precioMinPendiente,
      precioMax: precioMaxPendiente,
      colores: coloresPendientes,
      talles: tallesPendientes,
      ordenarPor: ordenarPorPendiente
    })
  }

  const limpiarFiltros = () => {
    setOrdenarPorPendiente('')
    setMaterialPendiente('')
    setPrecioMinPendiente('')
    setPrecioMaxPendiente('')
    setColoresPendientes([])
    setTallesPendientes([])
    setErrorPrecioMin('')
    setErrorPrecioMax('')
    setFiltrosAplicados({
      material: '',
      precioMin: '',
      precioMax: '',
      colores: [],
      talles: [],
      ordenarPor: ''
    })
  }

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, page: nuevaPagina }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hayFiltrosActivos = filtrosAplicados.material || filtrosAplicados.precioMin || filtrosAplicados.precioMax || filtrosAplicados.colores.length > 0 || filtrosAplicados.talles.length > 0 || filtrosAplicados.ordenarPor

  return (
    <div className="catalogo-page">
      <div className="catalogo-container">
        <aside className="catalogo-filters">
          <div className="catalogo-filters-header">
            <h2>Filtros</h2>
            {hayFiltrosActivos && (
              <button 
                type="button" 
                className="catalogo-filters-clear"
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Ordenar por</label>
            <select
              className="catalogo-filter-select"
              value={ordenarPorPendiente}
              onChange={(e) => setOrdenarPorPendiente(e.target.value)}
            >
              <option value="">Sin ordenar</option>
              <option value="precio:desc">Precio: Mayor a menor</option>
              <option value="precio:asc">Precio: Menor a mayor</option>
              <option value="nombre:asc">Nombre: A-Z</option>
              <option value="nombre:desc">Nombre: Z-A</option>
            </select>
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Material</label>
            <div className="catalogo-materiales">
              {materiales.map((mat) => {
                const isSelected = materialPendiente === mat
                return (
                  <button
                    key={mat}
                    type="button"
                    className={`catalogo-material-btn${isSelected ? ' selected' : ''}`}
                    onClick={() => setMaterialPendiente(isSelected ? '' : mat)}
                  >
                    {mat}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Precio</label>
            <div className="catalogo-precio-range">
              <div className="catalogo-precio-inputs">
                <div className="catalogo-precio-input-wrapper">
                  <input
                    type="text"
                    className={`catalogo-precio-input${errorPrecioMin ? ' error' : ''}`}
                    placeholder="Mín"
                    value={precioMinPendiente}
                    onChange={handlePrecioMinChange}
                    inputMode="numeric"
                  />
                  {errorPrecioMin && (
                    <span className="catalogo-precio-error">{errorPrecioMin}</span>
                  )}
                </div>
                <span className="catalogo-precio-separator">-</span>
                <div className="catalogo-precio-input-wrapper">
                  <input
                    type="text"
                    className={`catalogo-precio-input${errorPrecioMax ? ' error' : ''}`}
                    placeholder="Máx"
                    value={precioMaxPendiente}
                    onChange={handlePrecioMaxChange}
                    inputMode="numeric"
                  />
                  {errorPrecioMax && (
                    <span className="catalogo-precio-error">{errorPrecioMax}</span>
                  )}
                </div>
              </div>
              <p className="catalogo-precio-range-info">
                Rango: ${precioMinReal.toFixed(2)} - ${precioMaxReal.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Color</label>
            <ColorSelector
              colores={colores}
              selectedColors={coloresPendientes}
              onColorToggle={setColoresPendientes}
              multiple={true}
            />
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Talle</label>
            <div className="catalogo-talles">
              {talles.map((talle) => {
                const isSelected = tallesPendientes.includes(talle)
                return (
                  <button
                    key={talle}
                    type="button"
                    className={`catalogo-talle-btn${isSelected ? ' selected' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        setTallesPendientes(tallesPendientes.filter(t => t !== talle))
                      } else {
                        setTallesPendientes([...tallesPendientes, talle])
                      }
                    }}
                  >
                    {talle}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="catalogo-filter-apply">
            <BlueButton
              width="100%"
              height="40px"
              onClick={aplicarFiltros}
            >
              Aplicar
            </BlueButton>
          </div>
        </aside>

        <main className="catalogo-products">
          {cargando ? (
            <div className="catalogo-loading">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="catalogo-empty">
              <p>No se encontraron productos con los filtros seleccionados.</p>
            </div>
          ) : (
            <>
              <div className="catalogo-grid">
                {productos.map((producto) => {
                  const productoKey = String(producto.documentId ?? producto.id)
                  const descuento = descuentosMap.get(productoKey) ?? 0
                  return (
                    <ProductCard 
                      key={producto.id} 
                      producto={producto} 
                      descuento={descuento}
                    />
                  )
                })}
              </div>

              <PageButton
                pagina={paginacion.page}
                pageCount={paginacion.pageCount || 1}
                onPageChange={cambiarPagina}
                className="catalogo-pagination"
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
