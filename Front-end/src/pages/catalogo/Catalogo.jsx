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
  const [coloresConStock, setColoresConStock] = useState(new Set())
  const [tallesConStock, setTallesConStock] = useState(new Set())
  const [marcasConStock, setMarcasConStock] = useState(new Set())

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

    const ordenarPorPrecio = ordenarPor === 'precio:asc' || ordenarPor === 'precio:desc'
    const filtros = {
      ...(filtrosAplicados.material && { material: filtrosAplicados.material }),
      ...(filtrosAplicados.colores.length > 0 && { colores: filtrosAplicados.colores }),
      ...(filtrosAplicados.talles.length > 0 && { talles: filtrosAplicados.talles }),
      ...(filtrosAplicados.marca && { marca: filtrosAplicados.marca }),
      ...(ordenarPor && !ordenarPorPrecio && { ordenarPor: ordenarPor }),
      ...(ofertasFromUrl && idsOfertas.length > 0 && { ids: idsOfertas })
    }

    const filtrosSinMarca = { ...filtros }
    const marcaFiltro = filtrosSinMarca.marca
    delete filtrosSinMarca.marca

    const obtenerProductos = async () => {
      let productosIds = null
      
      if (marcaFiltro) {
        const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL
        const marcaUrl = `${VITE_BACKEND_URL}/api/marcas/${marcaFiltro}?populate[productos][populate][0]=variacions&populate[productos][populate][1]=variacions.imagen&populate[productos][populate][2]=promo_productos&populate[productos][populate][3]=promo_productos.promo`
        
        try {
          const marcaRes = await fetch(marcaUrl)
          if (marcaRes.ok) {
            const marcaData = await marcaRes.json()
            const productos = marcaData?.data?.productos ?? marcaData?.data?.attributes?.productos?.data ?? []
            productosIds = productos.map(item => {
              return item?.documentId ?? item?.attributes?.documentId ?? item?.id ?? item?.attributes?.id
            }).filter(Boolean)
          } else {
            const todosRes = await fetch(`${VITE_BACKEND_URL}/api/productos?populate[0]=variacions&populate[1]=variacions.imagen&populate[2]=marca&populate[3]=promo_productos&populate[4]=promo_productos.promo&filters[$or][0][inactivo][$eq]=false&filters[$or][1][inactivo][$null]=true&pagination[pageSize]=1000`)
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

          const productoKey = String(producto.documentId ?? producto.id)
          const descuento = descuentosMap.get(productoKey) ?? 0
          const precioBase = Number(producto.precio ?? 0)
          const precioFinal = descuento > 0 ? precioBase * (1 - descuento / 100) : precioBase

          return { ...producto, cantidadTotal, prioridad, nombre: producto.nombre || '', precioFinal }
        })

        const coloresSet = new Set()
        const tallesSet = new Set()
        const marcasSet = new Set()
        productosProcesados.forEach((p) => {
          const vars = p?.variaciones ?? []
          const tieneStock = vars.some((v) => Number(v?.stock ?? 0) > 0)
          if (tieneStock && p.marca) {
            const marcaId = p.marca?.documentId ?? p.marca?.id
            if (marcaId != null) marcasSet.add(String(marcaId))
          }
          vars.forEach((v) => {
            if (Number(v?.stock ?? 0) > 0) {
              if (v?.color) coloresSet.add(v.color)
              if (v?.talle) tallesSet.add(v.talle)
            }
          })
        })
        if (activo) {
          setColoresConStock(coloresSet)
          setTallesConStock(tallesSet)
          setMarcasConStock(marcasSet)
        }

        const precioMinFiltro = filtrosAplicados.precioMin ? Number(filtrosAplicados.precioMin) : null
        const precioMaxFiltro = filtrosAplicados.precioMax ? Number(filtrosAplicados.precioMax) : null

        let filtrados = productosProcesados
        if (precioMinFiltro != null && !isNaN(precioMinFiltro)) {
          filtrados = filtrados.filter((p) => (p.precioFinal ?? 0) >= precioMinFiltro)
        }
        if (precioMaxFiltro != null && !isNaN(precioMaxFiltro)) {
          filtrados = filtrados.filter((p) => (p.precioFinal ?? 0) <= precioMaxFiltro)
        }
        if (filtrosAplicados.colores?.length > 0) {
          filtrados = filtrados.filter((p) => {
            const vars = p?.variaciones ?? []
            return vars.some((v) => filtrosAplicados.colores.includes(v?.color))
          })
        }
        if (filtrosAplicados.talles?.length > 0) {
          filtrados = filtrados.filter((p) => {
            const vars = p?.variaciones ?? []
            return vars.some((v) => filtrosAplicados.talles.includes(v?.talle))
          })
        }

        const preciosFinales = productosProcesados.map((p) => p.precioFinal ?? 0).filter((n) => n > 0)
        const minReal = preciosFinales.length ? Math.min(...preciosFinales) : 0
        const maxReal = preciosFinales.length ? Math.max(...preciosFinales) : 10000
        if (activo) {
          setPrecioMinReal(minReal)
          setPrecioMaxReal(maxReal)
        }

        filtrados.sort((a, b) => {
          if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad
          
          const ordenarPorValue = ordenarPor || ''
          
          if (ordenarPorValue === 'precio:desc') {
            const precioA = a.precioFinal ?? Number(a.precio ?? 0)
            const precioB = b.precioFinal ?? Number(b.precio ?? 0)
            if (precioA !== precioB) return precioB - precioA
          } else if (ordenarPorValue === 'precio:asc') {
            const precioA = a.precioFinal ?? Number(a.precio ?? 0)
            const precioB = b.precioFinal ?? Number(b.precio ?? 0)
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
          
          return (a.nombre || '').localeCompare(b.nombre || '', 'es')
        })
        
        setProductos(filtrados)
        const totalItems = filtrados.length
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
          setColoresConStock(new Set())
          setTallesConStock(new Set())
          setMarcasConStock(new Set())
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
      setErrorPrecioMin('')
      setErrorPrecioMax('')
    }
  }

  const handlePrecioMaxChange = (e) => {
    const valor = e.target.value
    if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
      setPrecioMaxPendiente(valor)
      setErrorPrecioMin('')
      setErrorPrecioMax('')
    }
  }

  const aplicarFiltros = () => {
    let hayError = false
    setErrorPrecioMin('')
    setErrorPrecioMax('')

    const numMin = precioMinPendiente !== '' ? Number(precioMinPendiente) : null
    const numMax = precioMaxPendiente !== '' ? Number(precioMaxPendiente) : null

    if (numMin != null && precioMinPendiente !== '') {
      if (isNaN(numMin)) {
        setErrorPrecioMin('Valor inválido')
        hayError = true
      } else if (numMin < precioMinReal) {
        setErrorPrecioMin(`El mínimo no puede ser menor a $${precioMinReal.toFixed(0)}`)
        hayError = true
      } else if (numMin > precioMaxReal) {
        setErrorPrecioMin(`El mínimo no puede ser mayor a $${precioMaxReal.toFixed(0)}`)
        hayError = true
      }
    }

    if (numMax != null && precioMaxPendiente !== '') {
      if (isNaN(numMax)) {
        setErrorPrecioMax('Valor inválido')
        hayError = true
      } else if (numMax > precioMaxReal) {
        setErrorPrecioMax(`El máximo no puede ser mayor a $${precioMaxReal.toFixed(0)}`)
        hayError = true
      } else if (numMax < precioMinReal) {
        setErrorPrecioMax(`El máximo no puede ser menor a $${precioMinReal.toFixed(0)}`)
        hayError = true
      }
    }

    if (numMin != null && numMax != null && !isNaN(numMin) && !isNaN(numMax) && numMax < numMin) {
      setErrorPrecioMax('El precio máximo debe ser mayor o igual al mínimo')
      if (!hayError) setErrorPrecioMin('')
      hayError = true
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
                  {errorPrecioMin && <p className="catalogo-precio-error">{errorPrecioMin}</p>}
                </div>
                <span className="catalogo-precio-separator">-</span>
                <div className="catalogo-precio-input-wrapper">
                  <input type="text" className={`catalogo-precio-input${errorPrecioMax ? ' error' : ''}`} placeholder="Máx" value={precioMaxPendiente} onChange={handlePrecioMaxChange} inputMode="numeric" />
                  {errorPrecioMax && <p className="catalogo-precio-error">{errorPrecioMax}</p>}
                </div>
              </div>
              <p className="catalogo-precio-range-info">Rango: ${precioMinReal.toFixed(2)} - ${precioMaxReal.toFixed(2)}</p>
            </div>
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Color</label>
            <ColorSelector colores={coloresConStock.size > 0 ? colores.filter((c) => coloresConStock.has(c) || coloresPendientes.includes(c)) : colores} selectedColors={coloresPendientes} onColorToggle={setColoresPendientes} multiple={true} />
          </div>

          <div className="catalogo-filter-group">
            <label className="catalogo-filter-label">Talle</label>
            <div className="catalogo-talles">
              {(tallesConStock.size > 0 ? talles.filter((t) => tallesConStock.has(t) || tallesPendientes.includes(t)) : talles).map((talle) => {
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
              {(marcasConStock.size > 0 ? marcas.filter((m) => marcasConStock.has(String(m.id)) || marcaPendiente === String(m.id)) : marcas).map((marca) => (
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