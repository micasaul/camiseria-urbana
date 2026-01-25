/**
 * Parsea un valor de precio a número, manejando diferentes formatos
 * @param {string|number} valor - El valor a parsear
 * @returns {number} - El valor numérico parseado
 */
export const parsearPrecio = (valor) => {
  if (typeof valor === 'number') {
    return valor
  }
  if (!valor) {
    return 0
  }
  const limpio = String(valor).replace(/[^0-9,.-]/g, '')
  if (!limpio) {
    return 0
  }
  const tieneComa = limpio.includes(',')
  const tienePunto = limpio.includes('.')
  if (tieneComa && tienePunto) {
    if (limpio.lastIndexOf(',') > limpio.lastIndexOf('.')) {
      return Number(limpio.replace(/\./g, '').replace(',', '.')) || 0
    }
    return Number(limpio.replace(/,/g, '')) || 0
  }
  if (tieneComa) {
    return Number(limpio.replace(',', '.')) || 0
  }
  return Number(limpio) || 0
}

/**
 * Aplica descuentos a los items del carrito
 * @param {Array} items - Array de items del carrito
 * @param {Map} descuentosMap - Mapa de descuentos por productoId
 * @returns {Array} - Array de items con descuentos aplicados
 */
export const aplicarDescuentos = (items, descuentosMap) => {
  return (items ?? []).map((item) => {
    const baseValue =
      typeof item.priceValue === 'number' ? item.priceValue : parsearPrecio(item.price)
    const descuento = descuentosMap.get(String(item.productoId ?? '')) ?? 0
    const finalValue =
      descuento > 0 ? baseValue - (baseValue * descuento) / 100 : baseValue
    return {
      ...item,
      descuento,
      priceOriginalValue: baseValue,
      priceValue: finalValue,
      priceOriginal: `$${baseValue.toFixed(2)}`,
      priceFinal: `$${finalValue.toFixed(2)}`,
      hasDiscount: descuento > 0
    }
  })
}

/**
 * Calcula el subtotal de los productos del carrito
 * @param {Array} productos - Array de productos del carrito
 * @returns {number} - El subtotal calculado
 */
export const calcularSubtotal = (productos) => {
  return productos.reduce((acc, producto) => {
    const precioUnitario =
      typeof producto.priceValue === 'number' ? producto.priceValue : parsearPrecio(producto.price)
    const cantidad = producto.quantity ?? 1
    return acc + precioUnitario * cantidad
  }, 0)
}
