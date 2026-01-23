import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import { getProductos } from '../../api/productos.js'
import {
  crearPromo,
  actualizarPromo,
  crearPromoProducto,
  eliminarPromoProducto,
  existePromoPorNombre,
  getPromoPorId,
  getPromoProductos
} from '../../api/promos.js'
import { ordenarPorNombre, resetearFormularioPromo, toggleSeleccion, validarPorcentaje } from '../../utils/adminHelpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './admin.css'

export default function PromosAgregar() {
  const { id } = useParams()
  const { cargando: cargandoAuth } = useAuth()
  const [nombre, setNombre] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [productos, setProductos] = useState([])
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [promoId, setPromoId] = useState(null)
  const [promoDocumentId, setPromoDocumentId] = useState(null)
  const [relacionesPrevias, setRelacionesPrevias] = useState([])

  useEffect(() => {
    if (cargandoAuth) return
    const token = window.localStorage.getItem('strapiToken')
    if (!token) {
      setError('Necesitás iniciar sesión para ver las promos.')
      return
    }
    let activo = true
    getProductos()
      .then((data) => {
        if (!activo) return
        setProductos(data.items ?? [])
      })
      .catch(() => {
        if (!activo) return
        setProductos([])
      })

    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (!id) return
    if (cargandoAuth) return
    const token = window.localStorage.getItem('strapiToken')
    if (!token) {
      setError('Necesitás iniciar sesión para ver las promos.')
      return
    }
    let activo = true
    getPromoPorId(id)
      .then((data) => {
        if (!activo) return
        const item = data?.data ?? data
        const attrs = item?.attributes ?? item
        setPromoId(item?.id ?? attrs?.id ?? null)
        setPromoDocumentId(item?.documentId ?? attrs?.documentId ?? null)
        setNombre(attrs?.nombre ?? '')
        setPorcentaje(String(attrs?.descuento ?? ''))
        setDesde(attrs?.fechaInicio ? attrs.fechaInicio.slice(0, 10) : '')
        setHasta(attrs?.fechaFin ? attrs.fechaFin.slice(0, 10) : '')
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudo cargar la promo.')
      })

    getPromoProductos(id)
      .then((data) => {
        if (!activo) return
        setRelacionesPrevias(data)
        const ids = data.map((rel) => rel?.attributes?.producto?.data?.id ?? rel?.producto?.id).filter(Boolean)
        setProductosSeleccionados(ids)
      })
      .catch(() => {
        if (!activo) return
        setRelacionesPrevias([])
      })

    return () => {
      activo = false
    }
  }, [id])

  const productosOrdenados = useMemo(
    () => ordenarPorNombre(productos, (item) => item.nombre || ''),
    [productos]
  )

  const toggleProducto = (productoId) => {
    setProductosSeleccionados((prev) => toggleSeleccion(prev, productoId))
  }

  const resetearFormulario = () => {
    resetearFormularioPromo({
      setNombre,
      setPorcentaje,
      setDesde,
      setHasta,
      setProductosSeleccionados,
      setMensaje,
      setError,
      setPromoId,
      setPromoDocumentId,
      id
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMensaje('')
    setError('')

    if (!nombre || !porcentaje || !desde || !hasta) {
      setError('Completá los campos obligatorios.')
      return
    }

    const errorPorcentaje = validarPorcentaje(porcentaje)
    if (errorPorcentaje) {
      setError(errorPorcentaje)
      return
    }
    const porcentajeNumero = Number(porcentaje)

    const fechaInicio = new Date(desde)
    const fechaFin = new Date(hasta)
    if (fechaInicio > fechaFin) {
      setError('La fecha Desde debe ser anterior a Hasta.')
      return
    }

    if (productosSeleccionados.length === 0) {
      setError('Seleccioná al menos un producto.')
      return
    }

    const nombreNormalizado = nombre.trim()
    const existeNombre = await existePromoPorNombre(nombreNormalizado)
    const idActual = promoDocumentId ?? promoId
    if (existeNombre && (existeNombre.documentId ?? existeNombre.id) !== idActual) {
      setError('Ya existe una promo con ese nombre.')
      return
    }

    const payloadPromo = {
      data: {
        nombre: nombreNormalizado,
        descuento: porcentajeNumero,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      }
    }

    try {
      setCargando(true)
      let promoCreada = null
      let docId = promoDocumentId
      let promoIdActual = promoId

      if (id) {
        promoCreada = await actualizarPromo(id, payloadPromo)
      } else {
        promoCreada = await crearPromo(payloadPromo)
      }

      const promoData = promoCreada?.data
      docId = promoData?.documentId ?? docId
      promoIdActual = promoData?.id ?? promoIdActual

      if (!docId && !promoIdActual) {
        throw new Error('No se pudo obtener el identificador de la promo.')
      }

      if (relacionesPrevias.length) {
        await Promise.all(
          relacionesPrevias.map((rel) => eliminarPromoProducto(rel.id))
        )
      }

      await Promise.all(
        productosSeleccionados.map((productoId) =>
          crearPromoProducto({
            data: {
              activo: false,
              promo: docId ? { connect: [{ documentId: docId }] } : promoIdActual,
              producto: productoId
            }
          })
        )
      )

      setMensaje(id ? 'Actualización exitosa.' : 'Promo creada correctamente.')
      if (!id) {
        resetearFormulario()
      }
    } catch (err) {
      setError(err?.message || (id ? 'Ocurrió un error, no se pudo actualizar.' : 'Error al guardar la promo.'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Promos <span className="admin-title-sub">{id ? '- Editar' : '- Agregar'}</span>
      </h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-field">
          <label>
            Nombre<span className="admin-required">*</span>
          </label>
          <input
            className="admin-input"
            type="text"
            placeholder="Nombre de la promo"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />
        </div>
        <div className="admin-field">
          <label>
            Porcentaje<span className="admin-required">*</span>
          </label>
          <input
            className="admin-input"
            type="number"
            placeholder="% de descuento"
            min={0}
            max={100}
            value={porcentaje}
            onChange={(event) => setPorcentaje(event.target.value)}
          />
        </div>
        <div className="admin-field">
          <div className="admin-date-row">
            <div className="admin-date-field">
              <label>
                Desde<span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
              />
            </div>
            <div className="admin-date-field">
              <label>
                Hasta<span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                type="date"
                value={hasta}
                min={desde || undefined}
                onChange={(event) => setHasta(event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="admin-field">
          <label>
            Productos<span className="admin-required">*</span>
          </label>
          <div className="admin-product-select">
            {productosOrdenados.map((producto) => (
              <label key={producto.id} className="admin-product-option">
                <input
                  type="checkbox"
                  checked={productosSeleccionados.includes(producto.id)}
                  onChange={() => toggleProducto(producto.id)}
                />
                <span className="admin-product-thumb" />
                <span>{producto.nombre || 'Sin nombre'}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="admin-actions admin-actions-fixed">
          <BlueButton width="180px" height="40px" type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar'}
          </BlueButton>
          <WhiteButton
            width="140px"
            height="40px"
            className="admin-white-action"
            type="button"
            onClick={resetearFormulario}
            disabled={cargando}
          >
            Cancelar
          </WhiteButton>
        </div>
        {(mensaje || error) && (
          <p className={`admin-form-message${error ? ' error' : ''}`}>
            {error || mensaje}
          </p>
        )}
      </form>
    </div>
  )
}
