import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProductos, actualizarVariacion } from '../../api/productos.js'
import { COLOR_HEX_MAP } from '../../utils/colorMap.js'
import { calcularCantidadTotal, formatearPrecio, ordenarSinStockAlFinal } from '../../utils/adminHelpers.js'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import './admin.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function ProductosListar() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ page: 1, pageCount: 1 })

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getProductos(pagina, 10)
      .then((data) => {
        if (!activo) return
        setProductos(data.items)
        setPaginacion(data.pagination)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudieron cargar los productos.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [pagina])

  const filas = useMemo(
    () =>
      productos.map((producto) => {
        const variacionesRaw =
          producto?.variaciones ??
          producto?.variacions?.data ??
          producto?.variacions ??
          []
        const variacionesLista = Array.isArray(variacionesRaw)
          ? variacionesRaw
          : variacionesRaw?.data ?? []
        const variacionesNormalizadas = variacionesLista.map((variacion) => {
          const attrs = variacion?.attributes ?? variacion
          return {
            id: variacion?.id ?? attrs?.id,
            documentId: variacion?.documentId ?? attrs?.documentId ?? null,
            color: attrs?.color ?? variacion?.color ?? '',
            stock: Number(
              attrs?.stock ??
              variacion?.stock ??
              attrs?.cantidad ??
              variacion?.cantidad ??
              0
            )
          }
        })
        const coloresDisponibles = Array.from(
          new Set(
            variacionesNormalizadas
              .map((variacion) => variacion.color)
              .filter(Boolean)
          )
        )
        const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
        return {
          ...producto,
          variaciones: variacionesNormalizadas,
          coloresDisponibles,
          cantidadTotal
        }
      }),
    [productos]
  )

  const filasOrdenadas = useMemo(() => ordenarSinStockAlFinal(filas), [filas])

  const handleEditar = (producto) => {
    const destino = producto.documentId ?? producto.id
    navigate(`/admin/productos/editar/${destino}`)
  }

  const handleEliminarStock = async (producto) => {
    try {
      const variaciones = producto.variaciones ?? []
      await Promise.all(
        variaciones.map((variacion) => {
          const variacionId = variacion.documentId ?? variacion.id
          if (!variacionId) return Promise.resolve()
          return actualizarVariacion(variacionId, {
            data: { stock: 0 }
          })
        })
      )

      setProductos((prev) =>
        prev.map((item) =>
          item.id === producto.id
            ? {
                ...item,
                variaciones: (item.variaciones ?? []).map((variacion) => ({
                  ...variacion,
                  stock: 0
                }))
              }
            : item
        )
      )
    } catch {
      setError('No se pudo eliminar el stock.')
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Productos <span className="admin-title-sub">- Listar</span>
      </h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-products">
          <span>Imagen</span>
          <span>Nombre</span>
          <span>Material</span>
          <span>Precio</span>
          <span>Cantidad</span>
          <span>Colores</span>
          <span>Acción</span>
        </div>
        {cargando && (
          <div className="admin-table-row admin-table-products">
            <span>—</span>
            <span>Cargando...</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && error && (
          <div className="admin-table-row admin-table-products">
            <span>—</span>
            <span>{error}</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && !error && filas.length === 0 && (
          <div className="admin-table-row admin-table-products">
            <span>—</span>
            <span>Sin productos</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando &&
          !error &&
          filasOrdenadas.map((producto) => {
            const sinStock = producto.cantidadTotal <= 0
            const imagenUrl = producto.imagen?.startsWith('http')
              ? producto.imagen
              : `${BACKEND_URL}${producto.imagen || '/assets/fallback.jpg'}`
            return (
            <div
              key={producto.id}
              className={`admin-table-row admin-table-products${sinStock ? ' admin-row-muted' : ''}`}
            >
              <span>
                <img
                  src={imagenUrl}
                  alt={producto.nombre || 'Producto'}
                  className="admin-product-img"
                />
              </span>
              <span>{producto.nombre || 'Sin nombre'}</span>
              <span>{producto.material || '—'}</span>
              <span>{formatearPrecio(producto.precio)}</span>
              <span>{producto.cantidadTotal}</span>
              <span className="admin-color-options admin-color-options-inline">
                {producto.coloresDisponibles.length === 0 && (
                  <span className="admin-color-dot" title="Sin color" />
                )}
                {producto.coloresDisponibles.map((color) => (
                  <span
                    key={color}
                    className="admin-color-dot"
                    title={color}
                    style={{ backgroundColor: COLOR_HEX_MAP[color] ?? '#e5e7eb' }}
                  />
                ))}
              </span>
              <span className="admin-action-group">
                <button className="admin-action-btn" type="button" onClick={() => handleEditar(producto)}>
                  Editar
                </button>
                <button
                  className="admin-action-btn admin-action-delete"
                  type="button"
                  onClick={() => handleEliminarStock(producto)}
                >
                  Eliminar stock
                </button>
              </span>
            </div>
          )})}
      </div>
      <PageButton
        pagina={paginacion.page}
        pageCount={paginacion.pageCount || 1}
        onPageChange={(nuevaPagina) => setPagina(nuevaPagina)}
      />
    </div>
  )
}
