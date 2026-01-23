import { useState } from 'react'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import './admin.css'

const MATERIALES = ['Lino', 'Algodón', 'Jean']
const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLORES = [
  { id: 'blanco', nombre: 'Blanco', color: '#ffffff' },
  { id: 'negro', nombre: 'Negro', color: '#111111' },
  { id: 'azul', nombre: 'Azul', color: '#1b2a41' },
  { id: 'rosa', nombre: 'Rosa', color: '#f4acb7' }
]

export default function ProductosAgregar() {
  const [variaciones, setVariaciones] = useState([
    { id: 1, talle: '', color: '', cantidad: '' }
  ])

  const agregarVariacion = () => {
    setVariaciones((prev) => [
      ...prev,
      { id: prev.length + 1, talle: '', color: '', cantidad: '' }
    ])
  }

  const actualizarVariacion = (index, cambios) => {
    setVariaciones((prev) =>
      prev.map((variacion, idx) =>
        idx === index ? { ...variacion, ...cambios } : variacion
      )
    )
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Productos <span className="admin-title-sub">- Agregar</span>
      </h1>
      <form className="admin-product-form">
        <div className="admin-product-main">
          <div className="admin-field">
            <label>
              Nombre<span className="admin-required">*</span>
            </label>
            <input className="admin-input" type="text" placeholder="Nombre del producto" />
          </div>
          <div className="admin-field">
            <label>
              Descripción<span className="admin-required">*</span>
            </label>
            <textarea className="admin-textarea" placeholder="Descripción" />
          </div>
          <div className="admin-field">
            <label>
              Marca<span className="admin-required">*</span>
            </label>
            <input className="admin-input" type="text" placeholder="Marca" />
          </div>
          <div className="admin-field">
            <label>
              Material<span className="admin-required">*</span>
            </label>
            <select className="admin-select">
              <option value="">Seleccionar</option>
              {MATERIALES.map((material) => (
                <option key={material} value={material.toLowerCase()}>
                  {material}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>
              Precio<span className="admin-required">*</span>
            </label>
            <input className="admin-input" type="number" placeholder="Precio" />
          </div>
        </div>

        <div className="admin-product-media">
          <div className="admin-media-box">
            <p className="admin-media-title">Imágenes</p>
            <p className="admin-media-hint">Podés subir más de una.</p>
            <label className="admin-media-upload">
              <input type="file" multiple />
              <span>Seleccionar archivos</span>
            </label>
          </div>
        </div>

        {variaciones.map((variacion, index) => (
          <div key={variacion.id} className="admin-variant-block">
            <p className="admin-variant-title">Variante {index + 1}</p>
            <div className="admin-variant-row">
              <div className="admin-field admin-variant-field">
                <label>
                  Talle<span className="admin-required">*</span>
                </label>
                <select
                  className="admin-select"
                  value={variacion.talle}
                  onChange={(event) =>
                    actualizarVariacion(index, { talle: event.target.value })
                  }
                >
                  <option value="">Seleccionar</option>
                  {TALLES.map((talle) => (
                    <option key={talle} value={talle.toLowerCase()}>
                      {talle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field admin-variant-field">
                <label>
                  Color<span className="admin-required">*</span>
                </label>
                <div className="admin-color-options">
                  {COLORES.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`admin-color-dot${
                        variacion.color === color.id ? ' selected' : ''
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.nombre}
                      aria-label={color.nombre}
                      aria-pressed={variacion.color === color.id}
                      onClick={() => actualizarVariacion(index, { color: color.id })}
                    />
                  ))}
                </div>
              </div>
              <div className="admin-field admin-variant-field">
                <label>
                  Cantidad<span className="admin-required">*</span>
                </label>
                <input
                  className="admin-input"
                  type="number"
                  placeholder="Cantidad"
                  value={variacion.cantidad}
                  onChange={(event) =>
                    actualizarVariacion(index, { cantidad: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <div className="admin-variant-actions">
          <WhiteButton
            width="100%"
            height="40px"
            className="admin-white-action"
            type="button"
            onClick={agregarVariacion}
          >
            + Agregar nueva variación
          </WhiteButton>
        </div>

        <div className="admin-actions">
          <BlueButton width="180px" height="40px">Guardar</BlueButton>
          <WhiteButton width="140px" height="40px" className="admin-white-action">
            Cancelar
          </WhiteButton>
        </div>
      </form>
    </div>
  )
}
