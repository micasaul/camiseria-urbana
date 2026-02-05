import { useState } from 'react'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import { crearCuponConUsuarios, obtenerCuponPorNombre } from '../../api/cupones.js'
import { validarPorcentaje } from '../../utils/adminHelpers.js'
import './admin.css'

export default function CuponesAgregar() {
  const [nombre, setNombre] = useState('')
  const [descuento, setDescuento] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

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
    try {
      const yaExiste = await obtenerCuponPorNombre(nombreTrim)
      if (yaExiste) {
        setError('Ya existe un cupón con ese nombre.')
        return
      }
    } catch {
    }

    try {
      setCargando(true)
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
    } catch (err) {
      setError(err?.message || 'Error al crear el cupón.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Cupones <span className="admin-title-sub">– Agregar</span>
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
