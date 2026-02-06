import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import {
  crearProducto,
  crearVariacion,
  existeProductoPorNombre,
  getProductoPorId,
  actualizarProducto,
  actualizarVariacion as APIactualizarVariacion,
  subirImagen
} from '../../api/productos.js'

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
import { getProductoEnums } from '../../api/enums.js'
import { crearMarca, getMarcas } from '../../api/marcas.js'
import { resetearFormularioProducto, validarPrecio } from '../../utils/adminHelpers.js'
import ColorSelector from '../../components/forms/color/ColorSelector.jsx'
import { getImageUrl } from '../../utils/url.js'
import NgrokImage from '../../components/NgrokImage.jsx'
import './admin.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function ProductosAgregar() {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('')
  const [marcaNueva, setMarcaNueva] = useState('')
  const [marcas, setMarcas] = useState([])
  const [cargandoMarcas, setCargandoMarcas] = useState(false)
  const [material, setMaterial] = useState('')
  const [materiales, setMateriales] = useState([])
  const [talles, setTalles] = useState([])
  const [colores, setColores] = useState([])
  const [cargandoEnums, setCargandoEnums] = useState(false)
  const [precio, setPrecio] = useState('')
  const [variaciones, setVariaciones] = useState([
    { id: 1, talle: '', color: '', cantidad: '15', backendId: null, backendDocumentId: null }
  ])
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [productoId, setProductoId] = useState(null)
  const [productoDocumentId, setProductoDocumentId] = useState(null)
  const [cargandoProducto, setCargandoProducto] = useState(false)
  const [imagenesVariaciones, setImagenesVariaciones] = useState({})
  const { id } = useParams()

  useEffect(() => {
    let activo = true
    setCargandoMarcas(true)
    getMarcas()
      .then((data) => {
        if (!activo) return
        setMarcas(data)
      })
      .catch(() => {
        if (!activo) return
        setMarcas([])
      })
      .finally(() => {
        if (!activo) return
        setCargandoMarcas(false)
      })

    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    let activo = true
    setCargandoEnums(true)
    getProductoEnums()
      .then((data) => {
        if (!activo) return
        setMateriales(data?.material ?? [])
        setTalles(data?.talle ?? [])
        setColores(data?.color ?? [])
      })
      .catch(() => {
        if (!activo) return
        setMateriales([])
        setTalles([])
        setColores([])
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
      { id: prev.length + 1, talle: '', color: '', cantidad: '15', backendId: null, backendDocumentId: null }
    ])
  }

  const handleImagenVariacionChange = (index, e) => {
    const file = e.target.files?.[0]
    const current = imagenesVariaciones[index]
    if (current?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(current.preview)
    }
    if (!file) {
      setImagenesVariaciones((prev) => {
        const nuevo = { ...prev }
        delete nuevo[index]
        return nuevo
      })
      e.target.value = ''
      return
    }
    setImagenesVariaciones((prev) => ({
      ...prev,
      [index]: {
        file,
        preview: URL.createObjectURL(file),
        id: null
      }
    }))
    e.target.value = ''
  }

  const eliminarImagenVariacion = (index) => {
    const current = imagenesVariaciones[index]
    if (current?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(current.preview)
    }
    setImagenesVariaciones((prev) => {
      const nuevo = { ...prev }
      delete nuevo[index]
      return nuevo
    })
  }

  const actualizarVariacion = (index, cambios) => {
    setVariaciones((prev) =>
      prev.map((variacion, idx) =>
        idx === index ? { ...variacion, ...cambios } : variacion
      )
    )
  }

  const resetearFormulario = () => {
    Object.values(imagenesVariaciones).forEach((img) => {
      if (img?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview)
      }
    })
    setImagenesVariaciones({})
    resetearFormularioProducto({
      setNombre,
      setDescripcion,
      setMarcaSeleccionada,
      setMarcaNueva,
      setMaterial,
      setPrecio,
      setVariaciones,
      setMensaje,
      setError,
      setProductoId,
      setProductoDocumentId
    })
  }

  useEffect(() => {
    if (!id) return
    let activo = true
    setCargandoProducto(true)
    getProductoPorId(id)
      .then((data) => {
        if (!activo) return
        const item = data?.data ?? data
        const attrs = item?.attributes ?? item
        const productoDocId = item?.documentId ?? attrs?.documentId ?? null
        setProductoId(item?.id ?? attrs?.id ?? null)
        setProductoDocumentId(productoDocId)
        setNombre(attrs?.nombre ?? '')
        setDescripcion(attrs?.descripcion ?? '')
        setMaterial(attrs?.material ?? '')
        setPrecio(String(attrs?.precio ?? ''))

        const marcaData = attrs?.marca?.data ?? attrs?.marca ?? null
        const marcaId = marcaData?.id ?? marcaData?.documentId ?? ''
        if (marcaId) {
          setMarcaSeleccionada(String(marcaId))
        }

        const variacionesNormalizadas = item?.variaciones ?? []
        const listaVariaciones = variacionesNormalizadas.map((variacion, index) => {
          return {
            id: index + 1,
            talle: variacion?.talle ?? '',
            color: variacion?.color ?? '',
            cantidad: String(variacion?.stock ?? ''),
            backendId: variacion?.id ?? null,
            backendDocumentId: variacion?.documentId ?? null
          }
        })
        setVariaciones(listaVariaciones.length ? listaVariaciones : [{ id: 1, talle: '', color: '', cantidad: '15', backendId: null, backendDocumentId: null }])
        
        const imagenesNuevas = {}
        if (variacionesNormalizadas.length > 0 && productoDocId) {
          fetch(
            `${BACKEND_URL}/api/variaciones?filters[producto][documentId][$eq]=${productoDocId}&populate=imagen`,
            { headers: { ...getAuthHeaders() } }
          )
            .then((variacionesRes) => {
              if (!variacionesRes.ok) {
                const imagenesFallback = {}
                variacionesNormalizadas.forEach((variacion, idx) => {
                  if (variacion?.imagen) {
                    imagenesFallback[idx] = {
                      file: null,
                      preview: variacion.imagen,
                      id: null
                    }
                  }
                })
                if (activo) setImagenesVariaciones(imagenesFallback)
                return
              }
              return variacionesRes.json()
            })
            .then((variacionesData) => {
              if (!variacionesData || !activo) return
              const variacionesConImagen = variacionesData?.data ?? []
              const imagenesConId = {}
              
              variacionesNormalizadas.forEach((variacionNormalizada, index) => {
                if (variacionNormalizada?.imagen) {
                  const variacionRaw = variacionesConImagen.find(
                    (v) => {
                      const vDocId = v?.documentId ?? v?.attributes?.documentId ?? v?.id ?? v?.attributes?.id
                      return String(vDocId) === String(variacionNormalizada.documentId)
                    }
                  )
                  const img = variacionRaw?.attributes?.imagen?.data ?? variacionRaw?.attributes?.imagen ?? null
                  const imagenId = img?.id ?? null
                  
                  imagenesConId[index] = {
                    file: null,
                    preview: variacionNormalizada.imagen,
                    id: imagenId
                  }
                }
              })
              if (activo) setImagenesVariaciones(imagenesConId)
            })
            .catch((error) => {
              console.error('Error obteniendo IDs de imágenes:', error)
              const imagenesFallback = {}
              variacionesNormalizadas.forEach((variacion, idx) => {
                if (variacion?.imagen) {
                  imagenesFallback[idx] = {
                    file: null,
                    preview: variacion.imagen,
                    id: null
                  }
                }
              })
              if (activo) setImagenesVariaciones(imagenesFallback)
            })
        } else {
          const variacionesRaw = attrs?.variacions?.data ?? attrs?.variacions ?? item?.variacions ?? []
          variacionesRaw.forEach((variacionRaw, index) => {
            const variacionAttrs = variacionRaw?.attributes ?? variacionRaw
            const img = variacionAttrs?.imagen?.data ?? variacionAttrs?.imagen ?? null
            if (img) {
              const imgAttrs = img?.attributes ?? img ?? {}
              const imgUrl = imgAttrs?.url ?? img?.url
              const imagenId = img?.id ?? imgAttrs?.id ?? null
              if (imgUrl) {
                imagenesNuevas[index] = {
                  file: null,
                  preview: getImageUrl(imgUrl),
                  id: imagenId
                }
              }
            }
          })
          setImagenesVariaciones(imagenesNuevas)
        }
      })
      .catch(() => {
        if (!activo) return
        setError('No se pudo cargar el producto.')
      })
      .finally(() => {
        if (!activo) return
        setCargandoProducto(false)
      })

    return () => {
      activo = false
    }
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMensaje('')
    setError('')

    if (!nombre || !descripcion || !material || !precio) {
      setError('Completá los campos obligatorios.')
      return
    }

    const variacionesValidas = variaciones.filter(
      (variacion) => {
        const tieneTalleYColor = variacion.talle && variacion.color
        const cantidadNum = Number(variacion.cantidad)
        const cantidadValida = !Number.isNaN(cantidadNum) && cantidadNum >= 1
        const usaDefault = (variacion.cantidad === '' || variacion.cantidad === undefined) && !variacion.backendId && !variacion.backendDocumentId
        return tieneTalleYColor && (cantidadValida || usaDefault)
      }
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

    let marcaRelacion = null
    const marcaSeleccion = marcaSeleccionada

    if (marcaSeleccion && marcaSeleccion !== 'nueva') {
      const marcaExistente = marcas.find(
        (item) => String(item?.id) === marcaSeleccion
      )
      if (marcaExistente) {
        marcaRelacion = marcaExistente.documentId
          ? { connect: [{ documentId: marcaExistente.documentId }] }
          : marcaExistente.id
      }
    }

    if (marcaSeleccion === 'nueva') {
      const nombreMarcaNueva = marcaNueva.trim()
      if (!nombreMarcaNueva) {
        setError('Ingresá el nombre de la nueva marca.')
        return
      }
      const marcaCreada = await crearMarca(nombreMarcaNueva)
      const marcaData = marcaCreada?.data
      marcaRelacion = marcaData?.documentId
        ? { connect: [{ documentId: marcaData.documentId }] }
        : marcaData?.id
    }

    const nombreNormalizado = nombre.trim()
    const existeNombre = await existeProductoPorNombre(nombreNormalizado)
    const idActual = productoDocumentId ?? productoId
    if (existeNombre && (existeNombre.documentId ?? existeNombre.id) !== idActual) {
      setError('Ya existe un producto con ese nombre.')
      return
    }

    const payloadProducto = {
      data: {
        nombre: nombreNormalizado,
        descripcion: (descripcion ?? '').trim(),
        material,
        precio: precioNumero,
        ...(marcaRelacion ? { marca: marcaRelacion } : {})
      }
    }

    try {
      setEnviando(true)
      let productoCreado = null
      let docId = productoDocumentId
      let prodId = productoId

      if (id) {
        productoCreado = await actualizarProducto(id, payloadProducto)
      } else {
        productoCreado = await crearProducto(payloadProducto)
      }

      const productoData = productoCreado?.data
      docId = productoData?.documentId ?? docId
      prodId = productoData?.id ?? prodId

      if (!docId && !prodId) {
        throw new Error('No se pudo obtener el identificador del producto.')
      }

      if (!docId && variacionesValidas.some((v) => !v.backendDocumentId && !v.backendId)) {
        throw new Error('No se pudo obtener el documento del producto. Recargá e intentá de nuevo.')
      }

      for (let i = 0; i < variacionesValidas.length; i++) {
        const variacion = variacionesValidas[i]
        const variacionIndex = variaciones.findIndex((v) => v.id === variacion.id)
        const imagenVariacion = imagenesVariaciones[variacionIndex]
        
        let imagenPayload = undefined
        if (imagenVariacion?.file) {
          const imagenSubida = await subirImagen(imagenVariacion.file)
          imagenPayload = imagenSubida.id
        } else if (imagenVariacion?.id) {
          imagenPayload = imagenVariacion.id
        } else if (variacion.backendDocumentId || variacion.backendId) {
          imagenPayload = undefined
        }
        
        const cantidadRaw = variacion.cantidad
        const cantidadNum = Number(cantidadRaw)
        const esNueva = !variacion.backendDocumentId && !variacion.backendId
        const cantidadVacia = cantidadRaw === '' || cantidadRaw === undefined || cantidadRaw === null
        const stockEnviar = cantidadVacia && esNueva
          ? 15
          : !Number.isNaN(cantidadNum) && cantidadNum >= 0
            ? Math.max(0, Math.floor(cantidadNum))
            : esNueva
              ? 15
              : 0

        const esActualizacion = !!(variacion.backendDocumentId || variacion.backendId)

        if (esActualizacion) {
          const variacionDocumentId = variacion.backendDocumentId
          if (!variacionDocumentId) {
            throw new Error('Falta documentId de la variación para actualizar. Recargá la página e intentá de nuevo.')
          }
          const payloadUpdate = {
            data: {
              talle: variacion.talle,
              color: variacion.color,
              stock: stockEnviar,
              ...(imagenPayload !== undefined ? { imagen: imagenPayload } : {})
            }
          }
          console.log('[ProductosAgregar] PUT variación (actualizar):', {
            documentId: variacionDocumentId,
            payload: payloadUpdate,
            stockEnviar,
            tipoStock: typeof stockEnviar
          })
          await APIactualizarVariacion(variacionDocumentId, payloadUpdate)
        } else {
          const payloadVariacion = {
            data: {
              talle: variacion.talle,
              color: variacion.color,
              stock: stockEnviar,
              ...(docId ? { producto: docId } : {}),
              ...(imagenPayload !== undefined ? { imagen: imagenPayload } : {})
            }
          }
          if (!payloadVariacion.data.producto) {
            throw new Error('Falta el producto para crear la variación. Guardá de nuevo.')
          }
          console.log('[ProductosAgregar] POST variación (crear):', {
            payload: payloadVariacion,
            stockEnviar,
            tipoStock: typeof payloadVariacion.data.stock
          })
          await crearVariacion(payloadVariacion)
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
            : 'Error al guardar el producto.')
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Productos <span className="admin-title-sub">{id ? '- Editar' : '- Agregar'}</span>
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
              placeholder="Nombre del producto"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>
              Descripción<span className="admin-required">*</span>
            </label>
            <textarea
              className="admin-textarea"
              placeholder="Descripción"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>
              Marca<span className="admin-required">*</span>
            </label>
            <select
              className="admin-select"
              value={marcaSeleccionada}
              onChange={(event) => {
                setMarcaSeleccionada(event.target.value)
                if (event.target.value !== 'nueva') {
                  setMarcaNueva('')
                }
              }}
            >
              <option value="">
                {cargandoMarcas ? 'Cargando marcas...' : 'Seleccionar'}
              </option>
              {marcas.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item?.nombre || 'Sin nombre'}
                </option>
              ))}
              <option value="nueva">Crear nueva marca</option>
            </select>
            {marcaSeleccionada === 'nueva' && (
              <input
                className="admin-input"
                type="text"
                placeholder="Nombre de la nueva marca"
                value={marcaNueva}
                onChange={(event) => setMarcaNueva(event.target.value)}
              />
            )}
          </div>
          <div className="admin-field">
            <label>
              Material<span className="admin-required">*</span>
            </label>
            <select
              className="admin-select"
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
            >
              <option value="">{cargandoEnums ? 'Cargando...' : 'Seleccionar'}</option>
              {materiales.map((materialItem) => (
                <option key={materialItem} value={materialItem}>
                  {materialItem}
                </option>
              ))}
            </select>
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
                  Color<span className="admin-required">*</span>
                </label>
                <ColorSelector
                  colores={colores}
                  selectedColors={variacion.color ? [variacion.color] : []}
                  onColorToggle={(newColors) => actualizarVariacion(index, { color: newColors[0] || '' })}
                  multiple={false}
                />
              </div>
              <div className="admin-field admin-variant-field">
                <label>
                  Cantidad<span className="admin-required">*</span>
                </label>
                <input
                  className="admin-input"
                  type="number"
                  placeholder="15"
                  min={0}
                  value={variacion.cantidad ?? ''}
                  onChange={(event) =>
                    actualizarVariacion(index, { cantidad: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="admin-field admin-variant-image">
              <label>Imagen de la variación</label>
              {imagenesVariaciones[index]?.preview && (
                <div className="admin-media-preview-container">
                  <NgrokImage
                    src={imagenesVariaciones[index].preview}
                    alt={`Preview variación ${index + 1}`}
                    className="admin-media-preview"
                  />
                  <button
                    type="button"
                    className="admin-remove-image"
                    onClick={() => eliminarImagenVariacion(index)}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => handleImagenVariacionChange(index, e)}
                className="admin-file-input"
              />
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
