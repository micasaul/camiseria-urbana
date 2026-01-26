export const formatearPrecio = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return '$ 0'
  }
  return `$ ${numero.toLocaleString('es-AR')}`
}

export const formatearFecha = (valor) => {
  if (!valor) return '—'
  return valor.split('T')[0]
}

export const ordenarPorNombre = (items, getNombre = (item) => item?.nombre ?? '') => {
  if (!Array.isArray(items)) {
    return []
  }
  return [...items].sort((a, b) => getNombre(a).localeCompare(getNombre(b)))
}

export const ordenarSinStockAlFinal = (filas) => {
  if (!Array.isArray(filas)) {
    return []
  }
  return [...filas].sort((a, b) => {
    const aSinStock = a.cantidadTotal <= 0
    const bSinStock = b.cantidadTotal <= 0
    if (aSinStock === bSinStock) return 0
    return aSinStock ? 1 : -1
  })
}

export const esPromoFinalizada = (promo) => {
  const attrs = promo?.attributes ?? promo
  if (!attrs?.fechaFin) return false
  const hoy = new Date()
  const fechaFin = new Date(attrs.fechaFin)
  return fechaFin < hoy
}

export const ordenarPromosFinalizadasAlFinal = (promos) => {
  if (!Array.isArray(promos)) {
    return []
  }
  return [...promos].sort((a, b) => {
    const aFinalizada = esPromoFinalizada(a)
    const bFinalizada = esPromoFinalizada(b)
    if (aFinalizada === bFinalizada) return 0
    return aFinalizada ? 1 : -1
  })
}

export const toggleSeleccion = (prev, id) => {
  return prev.includes(id)
    ? prev.filter((item) => item !== id)
    : [...prev, id]
}

export const validarPorcentaje = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) {
    return 'El porcentaje debe estar entre 0 y 100.'
  }
  return ''
}

export const validarPrecio = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0) {
    return 'El precio debe ser un número válido.'
  }
  return ''
}

export const calcularCantidadTotal = (variaciones) => {
  return (variaciones ?? []).reduce(
    (acc, variacion) => acc + Number(variacion?.stock ?? variacion?.cantidad ?? 0),
    0
  )
}

export const obtenerClienteVenta = (venta) => {
  const attrs = venta?.attributes ?? venta
  const usuario = attrs?.users_permissions_user?.data ?? attrs?.users_permissions_user ?? null
  const u = usuario?.attributes ?? usuario
  return u?.email ?? u?.username ?? '—'
}

export const resetearFormularioProducto = ({
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
  setProductoDocumentId,
  setImagenFile,
  setImagenPreview,
  setImagenId
}) => {
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
  if (setImagenFile) setImagenFile(null)
  if (setImagenPreview) setImagenPreview('')
  if (setImagenId) setImagenId(null)
}

export const resetearFormularioPromo = ({
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
}) => {
  setNombre('')
  setPorcentaje('')
  setDesde('')
  setHasta('')
  setProductosSeleccionados([])
  setMensaje('')
  setError('')
  if (!id) {
    setPromoId(null)
    setPromoDocumentId(null)
  }
}
