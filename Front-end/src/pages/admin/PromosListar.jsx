import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eliminarPromo, getPromos } from '../../api/promos.js'
import './admin.css'

export default function PromosListar() {
  const navigate = useNavigate()
  const [promos, setPromos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getPromos()
      .then((data) => {
        if (!activo) return
        setPromos(data)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudieron cargar las promos.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const handleEditar = (promo) => {
    const destino = promo.documentId ?? promo.id
    navigate(`/admin/promos/editar/${destino}`)
  }

  const handleEliminar = async (promo) => {
    try {
      const promoId = promo.documentId ?? promo.id
      await eliminarPromo(promoId)
      setPromos((prev) => prev.filter((item) => item.id !== promo.id))
    } catch {
      setError('No se pudo eliminar la promo.')
    }
  }

  const formatearFecha = (valor) => {
    if (!valor) return '—'
    return valor.split('T')[0]
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Promos <span className="admin-title-sub">- Listar</span>
      </h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-promos">
          <span>Fechas</span>
          <span>Nombre</span>
          <span>Descuento</span>
          <span>Acción</span>
        </div>
        {cargando && (
          <div className="admin-table-row admin-table-promos">
            <span>—</span>
            <span>Cargando...</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && error && (
          <div className="admin-table-row admin-table-promos">
            <span>—</span>
            <span>{error}</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando && !error && promos.length === 0 && (
          <div className="admin-table-row admin-table-promos">
            <span>—</span>
            <span>Sin promos</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando &&
          !error &&
          promos.map((promo) => {
            const attrs = promo?.attributes ?? promo
            return (
              <div key={promo.id ?? attrs?.id} className="admin-table-row admin-table-promos">
                <span className="admin-date-stack">
                  <span>{formatearFecha(attrs?.fechaInicio)}</span>
                  <span>{formatearFecha(attrs?.fechaFin)}</span>
                </span>
                <span>{attrs?.nombre ?? 'Sin nombre'}</span>
                <span>{attrs?.descuento ?? 0}%</span>
                <span className="admin-action-group">
                  <button className="admin-action-btn" type="button" onClick={() => handleEditar(promo)}>
                    Editar
                  </button>
                  <button className="admin-action-btn admin-action-delete" type="button" onClick={() => handleEliminar(promo)}>
                    Eliminar
                  </button>
                </span>
              </div>
            )
          })}
      </div>
      <div className="admin-pagination">
        <span>Anterior</span>
        <span>1</span>
        <span>Siguiente</span>
      </div>
    </div>
  )
}
