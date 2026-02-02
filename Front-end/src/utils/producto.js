/**
 * @param {Array<number>}  
 * @returns {number} 
 */
export function calcularPromedioValoraciones(valoraciones) {
  if (!valoraciones || valoraciones.length === 0) return 0;
  const suma = valoraciones.reduce((acc, v) => acc + (Number(v) || 0), 0);
  return suma / valoraciones.length;
}

/**
 * @param {Array} 
 * @returns {Array<string>} 
 */
export function obtenerColoresEnStock(variaciones) {
  if (!variaciones) return []
  const colores = new Set()
  variaciones.forEach(v => {
    if (v.stock > 0) {
      colores.add(v.color)
    }
  })
  return Array.from(colores)
}

/**
 * @param {Array} 
 * @param {string} 
 * @returns {Array<string>} 
 */
export function obtenerTallesEnStock(variaciones, colorSeleccionado = '') {
  if (!variaciones) return []
  const talles = new Map()
  variaciones.forEach(v => {
    if (v.stock > 0 && (!colorSeleccionado || v.color === colorSeleccionado)) {
      const talle = v.talle
      const stockActual = talles.get(talle) ?? 0
      talles.set(talle, stockActual + v.stock)
    }
  })
  return Array.from(talles.keys())
}

const ORDER_TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

/**
 * @param {Array<string>} 
 * @returns {Array<string>}
 */
export function ordenarTalles(talles) {
  if (!Array.isArray(talles)) return []
  return [...talles].sort((a, b) => {
    const i = ORDER_TALLES.indexOf(String(a).toUpperCase())
    const j = ORDER_TALLES.indexOf(String(b).toUpperCase())
    return (i === -1 ? 999 : i) - (j === -1 ? 999 : j)
  })
}

/**
 * @param {Array} 
 * @param {string} 
 * @param {string} 
 * @param {Array} 
 * @returns {boolean} 
 */
export function talleDisponible(variaciones, talle, colorSeleccionado = '', tallesEnStock = []) {
  if (!colorSeleccionado) return tallesEnStock.includes(talle)
  return variaciones?.some(v => 
    v.talle === talle && 
    v.color === colorSeleccionado && 
    v.stock > 0
  ) ?? false
}

/**
 * @param {Array} 
 * @param {string} 
 * @param {string} 
 * @returns {number} 
 */
export function obtenerStockDisponible(variaciones, colorSeleccionado, talleSeleccionado) {
  if (!colorSeleccionado || !talleSeleccionado || !variaciones) return 0
  const variacion = variaciones.find(v => 
    v.color === colorSeleccionado && v.talle === talleSeleccionado
  )
  return variacion?.stock ?? 0
}

/**
 * @param {Array} 
 * @param {string} 
 * @param {string} 
 * @returns {Object|null} 
 */
export function encontrarVariacion(variaciones, color, talle) {
  if (!variaciones || !color || !talle) return null
  return variaciones.find(v => v.color === color && v.talle === talle) ?? null
}

/**
 * Para variaciones sin imagen, asigna la imagen de otra variación del mismo color (mismo producto).
 * @param {Array<{ color?: string; imagen?: string | null }>} variaciones
 * @returns {void} Modifica el array in place.
 */
export function enriquecerVariacionesConImagenFallback(variaciones) {
  if (!Array.isArray(variaciones) || variaciones.length === 0) return
  for (const v of variaciones) {
    if (v?.imagen && v.imagen !== '' && v.imagen !== null) continue
    const color = v?.color ?? ''
    const conMismoColorYImagen = variaciones.find(
      (u) => u !== v && (u?.color ?? '') === color && u?.imagen && u.imagen !== '' && u.imagen !== null
    )
    if (conMismoColorYImagen?.imagen) {
      v.imagen = conMismoColorYImagen.imagen
    }
  }
}

/**
 * @param {Array<{ variaciones?: Array<{ stock?: number }>; nombre?: string }>} 
 * @returns {Array}
 */
export function ordenarPorStock(items) {
  const list = items ?? []
  const conStock = []
  const sinStock = []
  for (const p of list) {
    const vars = p?.variaciones ?? []
    const algunaConStock = vars.some((v) => Number(v?.stock ?? 0) > 0)
    const sinDatos = vars.length === 0
    const agotado = !sinDatos && !algunaConStock
    if (agotado) sinStock.push(p)
    else conStock.push(p)
  }
  const porNombre = (a, b) =>
    String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es')
  conStock.sort(porNombre)
  sinStock.sort(porNombre)
  return [...conStock, ...sinStock]
}
