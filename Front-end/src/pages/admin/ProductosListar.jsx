import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProductos, actualizarVariacion } from '../../api/productos.js'
import { COLOR_HEX_MAP } from '../../utils/colorMap.js'
import './admin.css'

export default function ProductosListar() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getProductos()
      .then((data) => {
        if (!activo) return
        setProductos(data)
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
  }, [])

  const filas = useMemo(
    () =>
      productos.map((producto) => {
        const coloresDisponibles = Array.from(
          new Set(
            (producto.variaciones ?? [])
              .map((variacion) => variacion.color)
              .filter(Boolean)
          )
        )
        const cantidadTotal = (producto.variaciones ?? []).reduce(
          (acc, variacion) => acc + Number(variacion.stock || 0),
          0
        )
        return {
          ...producto,
          coloresDisponibles,
          cantidadTotal
        }
      }),
    [productos]
  )

  const formatearPrecio = (valor) => {
    const numero = Number(valor)
    if (!Number.isFinite(numero)) {
      return '$ 0'
    }
    return `$ ${numero.toLocaleString('es-AR')}`
  }

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
          filas.map((producto) => (
            <div key={producto.id} className="admin-table-row admin-table-products">
              <span>
                <span className="admin-product-thumb" />
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
          ))}
      </div>
      <div className="admin-pagination">
        <span>Anterior</span>
        <span>1</span>
        <span>Siguiente</span>
      </div>
    </div>
  )
}
