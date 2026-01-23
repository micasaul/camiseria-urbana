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
  actualizarVariacion
} from '../../api/productos.js'
import { getProductoEnums } from '../../api/enums.js'
import { crearMarca, getMarcas } from '../../api/marcas.js'
import { COLOR_HEX_MAP } from '../../utils/colorMap.js'
import './admin.css'

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
    { id: 1, talle: '', color: '', cantidad: '', backendId: null, backendDocumentId: null }
  ])
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [productoId, setProductoId] = useState(null)
  const [productoDocumentId, setProductoDocumentId] = useState(null)
  const [cargandoProducto, setCargandoProducto] = useState(false)
  const { id } = useParams()

  const coloresMeta = useMemo(
    () =>
      colores.map((colorValor, index) => ({
        id: `color-${index}`,
        nombre: colorValor,
        valor: colorValor,
        color: COLOR_HEX_MAP[colorValor] ?? '#e5e7eb'
      })),
    [colores]
  )

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

  const resetearFormulario = () => {
    setNombre('')
    setDescripcion('')
    setMarcaSeleccionada('')
    setMarcaNueva('')
    setMaterial('')
    setPrecio('')
    setVariaciones([{ id: 1, talle: '', color: '', cantidad: '', backendId: null, backendDocumentId: null }])
    setMensaje('')
    setError('')
    setProductoId(null)
    setProductoDocumentId(null)
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
        setProductoId(item?.id ?? attrs?.id ?? null)
        setProductoDocumentId(item?.documentId ?? attrs?.documentId ?? null)
        setNombre(attrs?.nombre ?? '')
        setDescripcion(attrs?.descripcion ?? '')
        setMaterial(attrs?.material ?? '')
        setPrecio(String(attrs?.precio ?? ''))

        const marcaData = attrs?.marca?.data ?? attrs?.marca ?? null
        const marcaId = marcaData?.id ?? marcaData?.documentId ?? ''
        if (marcaId) {
          setMarcaSeleccionada(String(marcaId))
        }

        const variacionesRaw =
          attrs?.variacions?.data ??
          attrs?.variacions ??
          item?.variacions ??
          []
        const listaVariaciones = (Array.isArray(variacionesRaw) ? variacionesRaw : []).map((variacion, index) => {
          const variacionAttrs = variacion?.attributes ?? variacion
          return {
            id: index + 1,
            talle: variacionAttrs?.talle ?? '',
            color: variacionAttrs?.color ?? '',
            cantidad: String(variacionAttrs?.stock ?? ''),
            backendId: variacion?.id ?? variacionAttrs?.id ?? null,
            backendDocumentId: variacion?.documentId ?? variacionAttrs?.documentId ?? null
          }
        })
        setVariaciones(listaVariaciones.length ? listaVariaciones : [{ id: 1, talle: '', color: '', cantidad: '', backendId: null, backendDocumentId: null }])
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
      (variacion) =>
        variacion.talle &&
        variacion.color &&
        variacion.cantidad &&
        Number(variacion.cantidad) >= 1
    )

    if (!variacionesValidas.length) {
      setError('Agregá al menos una variación completa con cantidad mayor o igual a 1.')
      return
    }

    const precioNumero = Number(precio)
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      setError('El precio debe ser un número válido.')
      return
    }

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
        descripcion,
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

      const relacionProducto = docId
        ? { connect: [{ documentId: docId }] }
        : prodId
          ? prodId
          : null

      for (const variacion of variacionesValidas) {
        const payloadVariacion = {
          data: {
            talle: variacion.talle,
            color: variacion.color,
            stock: Number(variacion.cantidad),
            producto: relacionProducto
          }
        }

        if (variacion.backendDocumentId || variacion.backendId) {
          const variacionId = variacion.backendDocumentId ?? variacion.backendId
          await actualizarVariacion(variacionId, payloadVariacion)
        } else {
          await crearVariacion(payloadVariacion)
        }
      }

      setMensaje(id ? 'Actualización exitosa.' : 'Producto creado correctamente.')
      if (!id) {
        resetearFormulario()
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
                <div className="admin-color-options">
                  {coloresMeta.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`admin-color-dot${
                        variacion.color === color.valor ? ' selected' : ''
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.nombre}
                      aria-label={color.nombre}
                      aria-pressed={variacion.color === color.valor}
                      onClick={() => actualizarVariacion(index, { color: color.valor })}
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
