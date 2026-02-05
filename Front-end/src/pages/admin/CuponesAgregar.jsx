import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import { crearCuponConUsuarios, obtenerCuponPorNombre, getCuponPorId, actualizarCupon } from '../../api/cupones.js'
import { validarPorcentaje } from '../../utils/adminHelpers.js'
import './admin.css'

export default function CuponesAgregar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [descuento, setDescuento] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cargandoCupon, setCargandoCupon] = useState(!!id)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setCargandoCupon(true)
    setError('')
    getCuponPorId(id)
      .then((cupon) => {
        setNombre(cupon.nombre ?? '')
        setDescuento(String(cupon.descuento ?? ''))
        setFechaInicio(cupon.fechaInicio ? cupon.fechaInicio.slice(0, 10) : '')
        setFechaFin(cupon.fechaFin ? cupon.fechaFin.slice(0, 10) : '')
      })
      .catch((err) => setError(err?.message ?? 'No se pudo cargar el cupón.'))
      .finally(() => setCargandoCupon(false))
  }, [id])

  const resetearFormulario = () => {
    setNombre('')
    setDescuento('')
    setFechaInicio('')
    setFechaFin('')
    setMensaje('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMensaje('')
    setError('')

    if (!nombre.trim()) {
      setError('Completá el nombre.')
      return
    }
    if (descuento === '' || descuento == null) {
      setError('Completá el porcentaje de descuento.')
      return
    }

    const errorPorcentaje = validarPorcentaje(descuento)
    if (errorPorcentaje) {
      setError(errorPorcentaje)
      return
    }
    const descuentoNumero = Number(descuento)

    if (!fechaInicio || !fechaFin) {
      setError('Completá fecha de inicio y fecha de fin.')
      return
    }

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    if (inicio > fin) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin.')
      return
    }

    const nombreTrim = nombre.trim()
    const idActual = id?.trim() || null

    if (!id) {
      try {
        const yaExiste = await obtenerCuponPorNombre(nombreTrim)
        if (yaExiste) {
          setError('Ya existe un cupón con ese nombre.')
          return
        }
      } catch {
        // Si falla la consulta, dejamos que el backend valide
      }
    } else {
      try {
        const yaExiste = await obtenerCuponPorNombre(nombreTrim)
        if (yaExiste && (yaExiste.documentId ?? '') !== idActual) {
          setError('Ya existe otro cupón con ese nombre.')
          return
        }
      } catch {
      }
    }

    try {
      setCargando(true)
      if (idActual) {
        await actualizarCupon(idActual, {
          nombre: nombreTrim,
          descuento: descuentoNumero,
          fechaInicio: inicio.toISOString(),
          fechaFin: fin.toISOString(),
        })
        setMensaje('Cupón actualizado correctamente.')
        setError('')
      } else {
        const resultado = await crearCuponConUsuarios({
          nombre: nombreTrim,
          descuento: descuentoNumero,
          fechaInicio: inicio.toISOString(),
          fechaFin: fin.toISOString(),
        })
        setMensaje(
          `Cupón creado correctamente. Se asignó a ${resultado?.cuponesUsuariosCreados ?? 0} usuario(s).`
        )
        setNombre('')
        setDescuento('')
        setFechaInicio('')
        setFechaFin('')
        setError('')
      }
    } catch (err) {
      setError(err?.message || (idActual ? 'Error al actualizar el cupón.' : 'Error al crear el cupón.'))
    } finally {
      setCargando(false)
    }
  }

  if (cargandoCupon) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Cupones <span className="admin-title-sub">– Editar</span></h1>
        <p>Cargando cupón...</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Cupones <span className="admin-title-sub">– {id ? 'Editar' : 'Agregar'}</span>
      </h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-field">
          <label>
            Nombre<span className="admin-required">*</span>
          </label>
          <input
            className="admin-input"
            type="text"
            placeholder="Nombre del cupón (código)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label>
            Descuento (%)<span className="admin-required">*</span>
          </label>
          <input
            className="admin-input"
            type="number"
            placeholder="% de descuento"
            min={0}
            max={100}
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <div className="admin-date-row">
            <div className="admin-date-field">
              <label>
                Fecha inicio<span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="admin-date-field">
              <label>
                Fecha fin<span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
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
            onClick={() => (id ? navigate('/admin/cupones/listar') : resetearFormulario())}
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
