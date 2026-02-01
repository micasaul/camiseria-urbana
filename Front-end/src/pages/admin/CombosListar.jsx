import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCombos, actualizarComboVariacion } from '../../api/combos.js'
import { calcularCantidadTotal, formatearPrecio } from '../../utils/adminHelpers.js'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import { getImageUrl } from '../../utils/url.js'
import NgrokImage from '../../components/NgrokImage.jsx'
import './admin.css'

export default function CombosListar() {
  const navigate = useNavigate()
  const [combos, setCombos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ page: 1, pageCount: 1 })

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getCombos(pagina, 10)
      .then((data) => {
        if (!activo) return
        setCombos(data.items)
        setPaginacion(data.pagination)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudieron cargar los combos.')
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
      combos.map((combo) => {
        const variacionesLista = combo?.variaciones ?? []
        const variacionesNormalizadas = variacionesLista.map((variacion) => {
          return {
            id: variacion?.id,
            documentId: variacion?.documentId ?? null,
            talle: variacion?.talle ?? '',
            stock: Number(variacion?.stock ?? 0)
          }
        })
        const tallesDisponibles = Array.from(
          new Set(
            variacionesNormalizadas
              .map((variacion) => variacion.talle)
              .filter(Boolean)
          )
        )
        const cantidadTotal = calcularCantidadTotal(variacionesNormalizadas)
        return {
          ...combo,
          variaciones: variacionesNormalizadas,
          tallesDisponibles,
          cantidadTotal
        }
      }),
    [combos]
  )

  const filasOrdenadas = useMemo(() => {
    
    const conStockYFoto = []
    const conStockSinFoto = []
    const sinStockConFoto = []
    const sinStockSinFoto = []
    
    for (const combo of filas) {
      const tieneStock = combo.cantidadTotal > 0
      const tieneFoto = combo.imagen && 
                        combo.imagen !== '/assets/fallback.jpg' && 
                        !combo.imagen.includes('fallback')
      
      if (tieneStock && tieneFoto) {
        conStockYFoto.push(combo)
      } else if (tieneStock && !tieneFoto) {
        conStockSinFoto.push(combo)
      } else if (!tieneStock && tieneFoto) {
        sinStockConFoto.push(combo)
      } else {
        sinStockSinFoto.push(combo)
      }
    }
    
    const porNombre = (a, b) =>
      String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es')
    
    conStockYFoto.sort(porNombre)
    conStockSinFoto.sort(porNombre)
    sinStockConFoto.sort(porNombre)
    sinStockSinFoto.sort(porNombre)
    
    return [...conStockYFoto, ...conStockSinFoto, ...sinStockConFoto, ...sinStockSinFoto]
  }, [filas])

  const handleEditar = (combo) => {
    const destino = combo.documentId ?? combo.id
    navigate(`/admin/combos/editar/${destino}`)
  }

  const handleEliminarStock = async (combo) => {
    try {
      const variaciones = combo.variaciones ?? []
      await Promise.all(
        variaciones.map((variacion) => {
          const variacionId = variacion.documentId ?? variacion.id
          if (!variacionId) return Promise.resolve()
          return actualizarComboVariacion(variacionId, {
            data: { stock: 0 }
          })
        })
      )

      setCombos((prev) =>
        prev.map((item) =>
          item.id === combo.id
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
        Combos <span className="admin-title-sub">- Listar</span>
      </h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-products">
          <span>Imagen</span>
          <span>Nombre</span>
          <span>Precio</span>
          <span>Cantidad</span>
          <span>Talles</span>
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
          </div>
        )}
        {!cargando && !error && filas.length === 0 && (
          <div className="admin-table-row admin-table-products">
            <span>—</span>
            <span>Sin combos</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando &&
          !error &&
          filasOrdenadas.map((combo) => {
            const sinStock = combo.cantidadTotal <= 0
            const imagenUrl = combo.imagen?.startsWith('http')
              ? combo.imagen
              : `${BACKEND_URL}${combo.imagen || '/assets/fallback.jpg'}`
            return (
            <div
              key={combo.id}
              className={`admin-table-row admin-table-products${sinStock ? ' admin-row-muted' : ''}`}
            >
              <span>
                <NgrokImage
                  src={imagenUrl}
                  alt={combo.nombre || 'Combo'}
                  className="admin-product-img"
                />
              </span>
              <span>{combo.nombre || 'Sin nombre'}</span>
              <span>{formatearPrecio(combo.precio)}</span>
              <span>{combo.cantidadTotal}</span>
              <span>
                {combo.tallesDisponibles.length === 0 ? (
                  <span>—</span>
                ) : (
                  combo.tallesDisponibles.join(', ')
                )}
              </span>
              <span className="admin-action-group">
                <button className="admin-action-btn" type="button" onClick={() => handleEditar(combo)}>
                  Editar
                </button>
                <button
                  className="admin-action-btn admin-action-delete"
                  type="button"
                  onClick={() => handleEliminarStock(combo)}
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
