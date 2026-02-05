import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import {
  crearCombo,
  crearComboVariacion,
  existeComboPorNombre,
  getComboPorId,
  actualizarCombo,
  actualizarComboVariacion
} from '../../api/combos.js'
import { getProductoEnums } from '../../api/enums.js'
import { validarPrecio } from '../../utils/adminHelpers.js'
import { getImageUrl } from '../../utils/url.js'
import NgrokImage from '../../components/NgrokImage.jsx'
import './admin.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function CombosAgregar() {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [talles, setTalles] = useState([])
  const [cargandoEnums, setCargandoEnums] = useState(false)
  const [precio, setPrecio] = useState('')
  const [variaciones, setVariaciones] = useState([
    { id: 1, talle: '', cantidad: '15', backendId: null, backendDocumentId: null }
  ])
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [comboId, setComboId] = useState(null)
  const [comboDocumentId, setComboDocumentId] = useState(null)
  const [cargandoCombo, setCargandoCombo] = useState(false)
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState('')
  const [imagenId, setImagenId] = useState(null)
  const { id } = useParams()

  useEffect(() => {
    let activo = true
    setCargandoEnums(true)
    getProductoEnums()
      .then((data) => {
        if (!activo) return
        setTalles(data?.talle ?? [])
      })
      .catch(() => {
        if (!activo) return
        setTalles([])
      })
      .finally(() => {
        if (!activo) return
        setCargandoEnums(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const agregarVariacion = () => {
    setVariaciones((prev) => [
      ...prev,
      { id: prev.length + 1, talle: '', cantidad: '15' }
    ])
  }

  const actualizarVariacion = (index, cambios) => {
    setVariaciones((prev) =>
      prev.map((variacion, idx) =>
        idx === index ? { ...variacion, ...cambios } : variacion
      )
    )
  }

  const resetearFormulario = () => {
    if (imagenPreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPreview)
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setVariaciones([{ id: 1, talle: '', cantidad: '15', backendId: null, backendDocumentId: null }])
    setMensaje('')
    setError('')
    setComboId(null)
    setComboDocumentId(null)
    setImagenFile(null)
    setImagenPreview('')
    setImagenId(null)
  }

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0]
    if (imagenPreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPreview)
    if (!file) {
      setImagenFile(null)
      setImagenPreview('')
      setImagenId(null)
      e.target.value = ''
      return
    }
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
    setImagenId(null)
    e.target.value = ''
  }

  useEffect(() => {
    if (!id) return
    let activo = true
    setCargandoCombo(true)
    getComboPorId(id)
      .then((data) => {
        if (!activo) return
        const item = data?.data ?? data
        const attrs = item?.attributes ?? item
        setComboId(item?.id ?? attrs?.id ?? null)
        setComboDocumentId(item?.documentId ?? attrs?.documentId ?? null)
        setNombre(attrs?.nombre ?? '')
        setDescripcion(attrs?.descripcion ?? '')
        setPrecio(String(attrs?.precio ?? ''))

        const imagenUrl = typeof item?.imagen === 'string' ? item.imagen : (attrs?.imagen?.data?.attributes?.url ?? attrs?.imagen?.url)
        if (imagenUrl) {
          setImagenPreview(imagenUrl.startsWith('http') || imagenUrl.startsWith('blob') ? imagenUrl : getImageUrl(imagenUrl))
        }
        if (item?.imagenId != null) {
          setImagenId(item.imagenId)
        } else {
          const img = attrs?.imagen?.data ?? attrs?.imagen ?? null
          if (img?.id != null) setImagenId(img.id)
        }

        const variacionesRaw =
          attrs?.variaciones ??
          item?.variaciones ??
          attrs?.['combos-variaciones']?.data ??
          attrs?.['combos-variaciones'] ??
          []
        const listaVariaciones = (Array.isArray(variacionesRaw) ? variacionesRaw : []).map((variacion, index) => {
          const variacionAttrs = variacion?.attributes ?? variacion
          return {
            id: index + 1,
            talle: variacionAttrs?.talle ?? variacion?.talle ?? '',
            cantidad: String(variacionAttrs?.stock ?? variacion?.stock ?? ''),
            backendId: variacion?.id ?? variacionAttrs?.id ?? null,
            backendDocumentId: variacion?.documentId ?? variacionAttrs?.documentId ?? null
          }
        })
        setVariaciones(listaVariaciones.length ? listaVariaciones : [{ id: 1, talle: '', cantidad: '15', backendId: null, backendDocumentId: null }])
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudo cargar el combo.')
      })
      .finally(() => {
        if (!activo) return
        setCargandoCombo(false)
      })

    return () => {
      activo = false
    }
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMensaje('')
    setError('')

    if (!nombre || !precio) {
      setError('Completá los campos obligatorios.')
      return
    }

    const variacionesValidas = variaciones.filter(
      (variacion) =>
        variacion.talle &&
        variacion.cantidad &&
        Number(variacion.cantidad) >= 1
    )

    if (!variacionesValidas.length) {
      setError('Agregá al menos una variación completa con cantidad mayor o igual a 1.')
      return
    }

    const errorPrecio = validarPrecio(precio)
    if (errorPrecio) {
      setError(errorPrecio)
      return
    }
    const precioNumero = Number(precio)

    let imagenPayload = undefined
    if (imagenFile) {
      const form = new FormData()
      form.append('files', imagenFile, imagenFile.name)
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('strapiToken') || ''}`
        },
        body: form
      })
      if (!res.ok) {
        setError('No se pudo subir la imagen.')
        return
      }
      const uploadData = await res.json()
      const arr = Array.isArray(uploadData) ? uploadData : [uploadData]
      const first = arr[0]
      if (!first?.id) {
        setError('Respuesta de upload inválida.')
        return
      }
      imagenPayload = first.id
    } else if (id && imagenId != null) {
      imagenPayload = imagenId
    } else if (id && !imagenFile && imagenId == null) {
      imagenPayload = null
    }

    const nombreNormalizado = nombre.trim()
    const existeNombre = await existeComboPorNombre(nombreNormalizado)
    const idActual = comboDocumentId ?? comboId
    if (existeNombre && (existeNombre.documentId ?? existeNombre.id) !== idActual) {
      setError('Ya existe un combo con ese nombre.')
      return
    }

    const payloadCombo = {
      data: {
        nombre: nombreNormalizado,
        descripcion: (descripcion ?? '').trim(),
        precio: precioNumero,
        ...(imagenPayload !== undefined && { imagen: imagenPayload })
      }
    }

    try {
      setEnviando(true)
      let comboCreado = null
      let docId = comboDocumentId
      let combId = comboId

      if (id) {
        comboCreado = await actualizarCombo(id, payloadCombo)
      } else {
        comboCreado = await crearCombo(payloadCombo)
      }

      const comboData = comboCreado?.data
      docId = comboData?.documentId ?? docId
      combId = comboData?.id ?? combId

      if (!docId && !combId) {
        throw new Error('No se pudo obtener el identificador del combo.')
      }

      const relacionCombo = docId
        ? { connect: [{ documentId: docId }] }
        : combId
          ? combId
          : null

      for (const variacion of variacionesValidas) {
        const payloadVariacion = {
          data: {
            talle: variacion.talle,
            stock: Number(variacion.cantidad),
            combo: relacionCombo
          }
        }

        if (variacion.backendDocumentId || variacion.backendId) {
          const variacionId = variacion.backendDocumentId ?? variacion.backendId
          await actualizarComboVariacion(variacionId, payloadVariacion)
        } else {
          await crearComboVariacion(payloadVariacion)
        }
      }

      setError('')
      if (id) {
        setMensaje('Actualización exitosa.')
      } else {
        resetearFormulario()
        setMensaje('Agregado con éxito.')
      }
    } catch (err) {
      setError(
        err?.message ||
          (id
            ? 'Ocurrió un error, no se pudo actualizar.'
            : 'Error al guardar el combo.')
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Combos <span className="admin-title-sub">{id ? '- Editar' : '- Agregar'}</span>
      </h1>
      <form className="admin-product-form" onSubmit={handleSubmit}>
        <div className="admin-product-main">
          <div className="admin-field">
            <label>
              Nombre<span className="admin-required">*</span>
            </label>
            <input
              className="admin-input"
              type="text"
              placeholder="Nombre del combo"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Descripción</label>
            <textarea
              className="admin-input"
              placeholder="Descripción del combo"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              rows={3}
            />
          </div>
          <div className="admin-field">
            <label>
              Precio<span className="admin-required">*</span>
            </label>
            <input
              className="admin-input"
              type="number"
              placeholder="Precio"
              min={0}
              value={precio}
              onChange={(event) => setPrecio(event.target.value)}
            />
          </div>
        </div>

        <div className="admin-product-media">
          <div className="admin-media-box">
            <p className="admin-media-title">Imagen</p>
            <p className="admin-media-hint">Se sube a la Media Library y se asocia por ID al combo.</p>
            {imagenPreview ? (
              <div className="admin-media-preview-wrap">
                <NgrokImage src={imagenPreview} alt="Vista previa" className="admin-media-preview" />
                <div className="admin-media-actions">
                  <label className="admin-media-upload">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImagenChange}
                    />
                    <span>Cambiar</span>
                  </label>
                  <button
                    type="button"
                    className="admin-media-quitar"
                    onClick={() => {
                      if (imagenPreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPreview)
                      setImagenFile(null)
                      setImagenPreview('')
                      setImagenId(null)
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <label className="admin-media-upload">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImagenChange}
                />
                <span>Seleccionar archivo</span>
              </label>
            )}
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
                  <option value="">{cargandoEnums ? 'Cargando...' : 'Seleccionar'}</option>
                  {talles.map((talleItem) => (
                    <option key={talleItem} value={talleItem}>
                      {talleItem}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field admin-variant-field">
                <label>
                  Cantidad<span className="admin-required">*</span>
                </label>
                <input
                  className="admin-input"
                  type="number"
                  placeholder="Cantidad"
                  min={1}
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
          <BlueButton width="180px" height="40px" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </BlueButton>
          <WhiteButton
            width="140px"
            height="40px"
            className="admin-white-action"
            type="button"
            onClick={resetearFormulario}
            disabled={enviando}
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
