/**
 * @param {Object} 
 * @returns {boolean}
 */
export function estaPromoActiva(promo) {
  if (!promo) return false
  const now = new Date()
  const start = promo.fechaInicio ? new Date(promo.fechaInicio) : null
  const end = promo.fechaFin ? new Date(promo.fechaFin) : null
  if (!start || !end) return false
  return start <= now && now <= end
}

/**
 * @param {number} 
 * @param {Array} 
 * @returns {{precioBase: number, descuento: number, precioFinal: number}}
 */
export function calcularPrecioConDescuento(precioBase, promoProductos = []) {
  const precio = Number(precioBase) || 0
  
  const descuentos = promoProductos
    .filter((promoProducto) => {
      const activo = promoProducto?.activo ?? promoProducto?.attributes?.activo ?? false
      const promo = promoProducto?.promo?.data ?? promoProducto?.promo ?? promoProducto?.attributes?.promo?.data ?? promoProducto?.attributes?.promo
      return activo && estaPromoActiva(promo)
    })
    .map((promoProducto) => {
      const promo = promoProducto?.promo?.data ?? promoProducto?.promo ?? promoProducto?.attributes?.promo?.data ?? promoProducto?.attributes?.promo
      return Number(promo?.descuento ?? promo?.attributes?.descuento ?? 0)
    })
    .filter((value) => value > 0)

  const descuento = descuentos.length ? Math.max(...descuentos) : 0
  const precioFinal = precio - (precio * descuento) / 100

  return {
    precioBase: precio,
    descuento,
    precioFinal
  }
}
