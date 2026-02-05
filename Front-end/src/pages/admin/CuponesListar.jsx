import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eliminarCupon, getCupones } from '../../api/cupones.js'
import { esPromoFinalizada, formatearFecha, ordenarPromosFinalizadasAlFinal } from '../../utils/adminHelpers.js'
import PageButton from '../../components/forms/page-button/page-button.jsx'
import './admin.css'

export default function CuponesListar() {
  const navigate = useNavigate()
  const [cupones, setCupones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState({ page: 1, pageCount: 1 })

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    getCupones(pagina, 10)
      .then((data) => {
        if (!activo) return
        setCupones(data.items)
        setPaginacion(data.pagination)
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudieron cargar los cupones.')
      })
      .finally(() => {
        if (!activo) return
        setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [pagina])

  const handleEditar = (cupon) => {
    const destino = cupon.documentId ?? cupon.id
    navigate(`/admin/cupones/editar/${destino}`)
  }

  const handleEliminar = async (cupon) => {
    try {
      const cuponId = cupon.documentId ?? cupon.id
      await eliminarCupon(cuponId)
      setCupones((prev) => prev.filter((item) => (item.documentId ?? item.id) !== cuponId))
    } catch {
      setError('No se pudo eliminar el cupón.')
    }
  }

  const cuponesOrdenados = useMemo(() => ordenarPromosFinalizadasAlFinal(cupones), [cupones])

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Cupones <span className="admin-title-sub">- Listar</span>
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
        {!cargando && !error && cupones.length === 0 && (
          <div className="admin-table-row admin-table-promos">
            <span>—</span>
            <span>Sin cupones</span>
            <span>—</span>
            <span>—</span>
          </div>
        )}
        {!cargando &&
          !error &&
          cuponesOrdenados.map((cupon) => {
            const attrs = cupon?.attributes ?? cupon
            const finalizado = esPromoFinalizada(cupon)
            return (
              <div
                key={cupon.id ?? cupon.documentId ?? attrs?.id}
                className={`admin-table-row admin-table-promos${finalizado ? ' admin-row-muted' : ''}`}
              >
                <span className="admin-date-stack">
                  <span>{formatearFecha(attrs?.fechaInicio)}</span>
                  <span>{formatearFecha(attrs?.fechaFin)}</span>
                </span>
                <span>{attrs?.nombre ?? 'Sin nombre'}</span>
                <span>{attrs?.descuento ?? 0}%</span>
                <span className="admin-action-group">
                  <button className="admin-action-btn" type="button" onClick={() => handleEditar(cupon)}>
                    Editar
                  </button>
                  <button className="admin-action-btn admin-action-delete" type="button" onClick={() => handleEliminar(cupon)}>
                    Eliminar
                  </button>
                </span>
              </div>
            )
          })}
      </div>
      <PageButton
        pagina={paginacion.page}
        pageCount={paginacion.pageCount || 1}
        onPageChange={(nuevaPagina) => setPagina(nuevaPagina)}
      />
    </div>
  )
}
