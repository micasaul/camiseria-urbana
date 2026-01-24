/**
 * @param {Array}
 * @returns {number} 
 */
export function calcularPromedioResenas(resenas) {
  if (!resenas || resenas.length === 0) return 0
  const suma = resenas.reduce((acc, r) => acc + (r.valoracion ?? 0), 0)
  return suma / resenas.length
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
