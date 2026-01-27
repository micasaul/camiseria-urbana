import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProductosConFiltros } from '../../api/productos.js'
import { getProductoEnums } from '../../api/enums.js'
import { obtenerDescuentosActivos } from '../../api/promos.js'
import { calcularCantidadTotal } from '../../utils/adminHelpers.js'
import ColorSelector from '../../components/forms/color/ColorSelector.jsx'
import ProductCard from '../../components/cards/product-card/ProductCard.jsx'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import './Catalogo.css'

const ITEMS_POR_PAGINA = 6; 

export default function Catalogo() {
  const [searchParams] = useSearchParams()
  const materialFromUrl = searchParams.get('material') || ''
  const ofertasFromUrl = searchParams.get('ofertas') === '1'
  
  const [productos, setProductos] = useState([]) 
  const [cargando, setCargando] = useState(true)
  const [paginacion, setPaginacion] = useState({ page: 1, pageCount: 1, total: 0 })
  
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    material: '',
    precioMin: '',
    precioMax: '',
    colores: [],
    talles: [],
    marca: '',
    ordenarPor: ''
  })
  
  const [ordenarPor, setOrdenarPor] = useState('')
  const [materialPendiente, setMaterialPendiente] = useState('')
  const [precioMinPendiente, setPrecioMinPendiente] = useState('')
  const [precioMaxPendiente, setPrecioMaxPendiente] = useState('')
  const [coloresPendientes, setColoresPendientes] = useState([])
  const [tallesPendientes, setTallesPendientes] = useState([])
  const [marcaPendiente, setMarcaPendiente] = useState('')
  const [errorPrecioMin, setErrorPrecioMin] = useState('')
  const [errorPrecioMax, setErrorPrecioMax] = useState('')
  
  const [materiales, setMateriales] = useState([])
  const [talles, setTalles] = useState([])
  const [colores, setColores] = useState([])
  const [marcas, setMarcas] = useState([])
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

    const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL
    fetch(`${VITE_BACKEND_URL}/api/marcas?pagination[pageSize]=1000`)
      .then(res => res.json())
      .then(data => {
        if (!activo) return
        const marcasList = (data.data || []).map(item => {
          const attrs = item?.attributes ?? item
          return {
            id: item.documentId ?? attrs?.documentId ?? item.id ?? attrs?.id,
            nombre: attrs?.nombre ?? item?.nombre ?? ''
          }
        })
        setMarcas(marcasList)
      })
      .catch(() => {
        if (!activo) return
        setMarcas([])
      })

    return () => { activo = false }
  }, [])

  useEffect(() => {
    if (materialFromUrl && materiales.length > 0) {
      if (materiales.includes(materialFromUrl)) {
        setMaterialPendiente(materialFromUrl)
        setFiltrosAplicados(prev => ({ ...prev, material: materialFromUrl }))
      }
    }
  }, [materialFromUrl, materiales])

  useEffect(() => {
    let activo = true
    const obtenerPreciosReales = async () => {
      try {
        const [resMin, resMax] = await Promise.all([
          fetch(`${VITE_BACKEND_URL}/api/productos?sort=precio:asc&pagination[pageSize]=1`),
          fetch(`${VITE_BACKEND_URL}/api/productos?sort=precio:desc&pagination[pageSize]=1`)
        ])
        if (resMin.ok) {
          const dataMin = await resMin.json()
          if (activo) setPrecioMinReal(dataMin?.data?.[0]?.attributes?.precio ?? 0)
        }
        if (resMax.ok) {
          const dataMax = await resMax.json()
          if (activo) setPrecioMaxReal(dataMax?.data?.[0]?.attributes?.precio ?? 10000)
        }
      } catch (error) {
        if (activo) { setPrecioMinReal(0); setPrecioMaxReal(10000); }
      }
    }
    obtenerPreciosReales()
    
    obtenerDescuentosActivos()
      .then((map) => {
        if (activo) { setDescuentosMap(map); setDescuentosLoaded(true); }
      })
      .catch(() => {
        if (activo) { setDescuentosMap(new Map()); setDescuentosLoaded(true); }
      })
    
    return () => { activo = false }
  }, [])

  useEffect(() => {
    let activo = true
    setCargando(true)

    if (ofertasFromUrl && !descuentosLoaded) return () => { activo = false }

    const idsOfertas = ofertasFromUrl
      ? [...descuentosMap.entries()].filter(([, d]) => (Number(d) ?? 0) > 0).map(([id]) => id)
      : []

    if (ofertasFromUrl && idsOfertas.length === 0) {
      setProductos([])
      setPaginacion({ page: 1, pageCount: 1, total: 0 })
      setCargando(false)
      return () => { activo = false }
    }

    const filtros = {
      ...(filtrosAplicados.material && { material: filtrosAplicados.material }),
      ...(filtrosAplicados.precioMin && { precioMin: Number(filtrosAplicados.precioMin) }),
      ...(filtrosAplicados.precioMax && { precioMax: Number(filtrosAplicados.precioMax) }),
      ...(filtrosAplicados.colores.length > 0 && { colores: filtrosAplicados.colores }),
      ...(filtrosAplicados.talles.length > 0 && { talles: filtrosAplicados.talles }),
      ...(filtrosAplicados.marca && { marca: filtrosAplicados.marca }),
      ...(ordenarPor && { ordenarPor: ordenarPor }),
      ...(ofertasFromUrl && idsOfertas.length > 0 && { ids: idsOfertas })
    }

    const filtrosSinMarca = { ...filtros }
    const marcaFiltro = filtrosSinMarca.marca
    delete filtrosSinMarca.marca

    const obtenerProductos = async () => {
      let productosIds = null
      
      if (marcaFiltro) {
        const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL
        const marcaUrl = `${VITE_BACKEND_URL}/api/marcas/${marcaFiltro}?populate[productos][populate][0]=variacions&populate[productos][populate][1]=promo_productos&populate[productos][populate][2]=promo_productos.promo&populate[productos][populate][3]=imagen`
        
        try {
          const marcaRes = await fetch(marcaUrl)
          if (marcaRes.ok) {
            const marcaData = await marcaRes.json()
            const productos = marcaData?.data?.productos ?? marcaData?.data?.attributes?.productos?.data ?? []
            productosIds = productos.map(item => {
              return item?.documentId ?? item?.attributes?.documentId ?? item?.id ?? item?.attributes?.id
            }).filter(Boolean)
          } else {
            const todosRes = await fetch(`${VITE_BACKEND_URL}/api/productos?populate[0]=variacions&populate[1]=marca&populate[2]=promo_productos&populate[3]=promo_productos.promo&populate[4]=imagen&pagination[pageSize]=1000`)
            const todosData = await todosRes.json()
            const productosFiltrados = (todosData.data || []).filter(item => {
              const attrs = item?.attributes ?? item
              const marca = attrs?.marca?.data ?? attrs?.marca
              if (!marca) return false
              const marcaDocId = marca?.documentId ?? marca?.attributes?.documentId ?? marca?.id ?? marca?.attributes?.id
              return String(marcaDocId) === String(marcaFiltro)
            })
            productosIds = productosFiltrados.map(item => item?.documentId ?? item?.attributes?.documentId).filter(Boolean)
          }
        } catch (error) {
          console.error('Error obteniendo productos por marca:', error)
        }
      }
      
      const filtrosFinales = productosIds && productosIds.length > 0
        ? { ...filtrosSinMarca, ids: productosIds }
        : filtrosSinMarca
      
      return getProductosConFiltros(filtrosFinales, 1, 1000)
    }

    obtenerProductos()
      .then((data) => {
        if (!activo) return
        
        let items = data.items ?? []
        
        const productosProcesados = items.map((producto) => {
          const variacionesRaw = producto?.variaciones ?? producto?.variacions?.data ?? producto?.variacions ?? []
          const variacionesLista = Array.isArray(variacionesRaw) ? variacionesRaw : (variacionesRaw?.data ?? [])
          
          const variacionesNormalizadas = variacionesLista.map((variacion) => {
            const attrs = variacion?.attributes ?? variacion
            return { stock: Number(attrs?.stock ?? variacion?.stock ?? attrs?.cantidad ?? variacion?.cantidad ?? 0) }
          })

          const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
          const tieneStock = cantidadTotal > 0

          const prioridad = tieneStock ? 1 : 2

          return { ...producto, cantidadTotal, prioridad, nombre: producto.nombre || '' }
        })

        productosProcesados.sort((a, b) => {
          if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad
          
          const ordenarPorValue = ordenarPor || ''
          
          if (ordenarPorValue === 'precio:desc') {
            const precioA = Number(a.precio ?? 0)
            const precioB = Number(b.precio ?? 0)
            if (precioA !== precioB) return precioB - precioA
          } else if (ordenarPorValue === 'precio:asc') {
            const precioA = Number(a.precio ?? 0)
            const precioB = Number(b.precio ?? 0)
            if (precioA !== precioB) return precioA - precioB
          } else if (ordenarPorValue === 'createdAt:desc') {
            const fechaA = a.createdAt || a.publishedAt
            const fechaB = b.createdAt || b.publishedAt
            if (!fechaA && !fechaB) return 0
            if (!fechaA) return 1
            if (!fechaB) return -1
            const timeA = new Date(fechaA).getTime()
            const timeB = new Date(fechaB).getTime()
              if (isNaN(timeA) || isNaN(timeB)) return 0
              return timeB - timeA
          } else if (ordenarPorValue === 'createdAt:asc') {
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
          
          return a.nombre.localeCompare(b.nombre, 'es')
        })
        
        setProductos(productosProcesados)
        const totalItems = productosProcesados.length
        setPaginacion({
          page: 1,
          pageCount: Math.ceil(totalItems / ITEMS_POR_PAGINA) || 1,
          total: totalItems
        })
      })
      .catch(() => {
        if (activo) {
          setProductos([])
          setPaginacion({ page: 1, pageCount: 1, total: 0 })
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [filtrosAplicados, ofertasFromUrl, descuentosLoaded, descuentosMap, ordenarPor])

  const productosEnPantalla = useMemo(() => {
    const inicio = (paginacion.page - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    return productos.slice(inicio, fin);
  }, [productos, paginacion.page]);

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
      if (isNaN(numMin)) { setErrorPrecioMin('Inválido'); hayError = true; }
      else if (numMin < precioMinReal) { setErrorPrecioMin(`Mínimo: $${precioMinReal}`); hayError = true; }
      else if (numMin > precioMaxReal) { setErrorPrecioMin(`Máximo: $${precioMaxReal}`); hayError = true; }
    }

    if (precioMaxPendiente !== '') {
      const numMax = Number(precioMaxPendiente)
      if (isNaN(numMax)) { setErrorPrecioMax('Inválido'); hayError = true; }
      else if (numMax > precioMaxReal) { setErrorPrecioMax(`Máximo: $${precioMaxReal}`); hayError = true; }
      else if (numMax < precioMinReal) { setErrorPrecioMax(`Mínimo: $${precioMinReal}`); hayError = true; }
    }

    if (!hayError) {
      setFiltrosAplicados({
        material: materialPendiente,
        precioMin: precioMinPendiente,
        precioMax: precioMaxPendiente,
        colores: coloresPendientes,
        talles: tallesPendientes,
        marca: marcaPendiente,
        ordenarPor: ordenarPor
      })
    }
  }

  const limpiarFiltros = () => {
    setOrdenarPor(''); setMaterialPendiente(''); setPrecioMinPendiente(''); setPrecioMaxPendiente('');
    setColoresPendientes([]); setTallesPendientes([]); setMarcaPendiente(''); setErrorPrecioMin(''); setErrorPrecioMax('');
    setFiltrosAplicados({ material: '', precioMin: '', precioMax: '', colores: [], talles: [], marca: '', ordenarPor: '' })
  }

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, page: nuevaPagina }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hayFiltrosActivos = filtrosAplicados.material || filtrosAplicados.precioMin || filtrosAplicados.precioMax || filtrosAplicados.colores.length > 0 || filtrosAplicados.talles.length > 0 || filtrosAplicados.marca || filtrosAplicados.ordenarPor

  return (
    <div className="catalogo-page">
      <div className="catalogo-container">
        <aside className="catalogo-filters">
          <div className="catalogo-filters-header">
            <h2>Filtros</h2>
            {hayFiltrosActivos && (
              <button type="button" className="catalogo-filters-clear" onClick={limpiarFiltros}>
                Limpiar
              </button>
            )}
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Material</label>
            <div className="catalogo-materiales">
              {materiales.map((mat) => {
                const isSelected = materialPendiente === mat
                return (
                  <button key={mat} type="button" className={`catalogo-material-btn${isSelected ? ' selected' : ''}`} onClick={() => setMaterialPendiente(isSelected ? '' : mat)}>
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
                  <input type="text" className={`catalogo-precio-input${errorPrecioMin ? ' error' : ''}`} placeholder="Mín" value={precioMinPendiente} onChange={handlePrecioMinChange} inputMode="numeric" />
                </div>
                <span className="catalogo-precio-separator">-</span>
                <div className="catalogo-precio-input-wrapper">
                  <input type="text" className={`catalogo-precio-input${errorPrecioMax ? ' error' : ''}`} placeholder="Máx" value={precioMaxPendiente} onChange={handlePrecioMaxChange} inputMode="numeric" />
                </div>
              </div>
              <p className="catalogo-precio-range-info">Rango: ${precioMinReal.toFixed(2)} - ${precioMaxReal.toFixed(2)}</p>
            </div>
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Color</label>
            <ColorSelector colores={colores} selectedColors={coloresPendientes} onColorToggle={setColoresPendientes} multiple={true} />
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Talle</label>
            <div className="catalogo-talles">
              {talles.map((talle) => {
                const isSelected = tallesPendientes.includes(talle)
                return (
                  <button key={talle} type="button" className={`catalogo-talle-btn${isSelected ? ' selected' : ''}`} onClick={() => setTallesPendientes(isSelected ? tallesPendientes.filter(t => t !== talle) : [...tallesPendientes, talle])}>
                    {talle}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Marca</label>
            <select className="catalogo-filter-select" value={marcaPendiente} onChange={(e) => setMarcaPendiente(e.target.value)}>
              <option value="">Todas las marcas</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>{marca.nombre}</option>
              ))}
            </select>
          </div>

          <div className="catalogo-filter-apply">
            <BlueButton width="100%" height="40px" onClick={aplicarFiltros}>Aplicar</BlueButton>
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
              <div className="catalogo-sort">
                <select 
                  className="catalogo-sort-select" 
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
              <div className="catalogo-grid">
                {productosEnPantalla.map((producto) => {
                  const productoKey = String(producto.documentId ?? producto.id)
                  const descuento = descuentosMap.get(productoKey) ?? 0
                  return (
                    <ProductCard key={producto.id} producto={producto} descuento={descuento} />
                  )
                })}
              </div>

              <PageButton
                pagina={paginacion.page}
                pageCount={paginacion.pageCount}
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