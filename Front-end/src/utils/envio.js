/**
 * @type {Map<string, number>}


 */
export const preciosEnvioPorProvincia = new Map([
  // El más barato
  ["Entre Ríos", 200],
  // Mismo precio
  ["Corrientes", 300],
  ["Santa Fe", 300],
  ["Buenos Aires", 300],
  // Mismo precio
  ["Misiones", 400],
  ["Chaco", 400],
  ["Santiago del Estero", 400],
  ["Córdoba", 400],
  ["La Pampa", 400],
  // Mismo precio
  ["San Juan", 500],
  ["San Luis", 500],
  ["Mendoza", 500],
  // Mismo precio
  ["Formosa", 600],
  ["Salta", 600],
  ["Jujuy", 600],
  ["Catamarca", 600],
  ["La Rioja", 600],
  ["Tucumán", 600],
  // Mismo precio
  ["Río Negro", 700],
  ["Neuquén", 700],
  // Individual
  ["Chubut", 800],
  ["Santa Cruz", 900],
  ["Tierra del Fuego", 1000]
]);

/**
 * @param {string}
 * @returns {number} 
 */
export const obtenerPrecioEnvio = (provincia) => {
  if (!provincia) return 0;
  return preciosEnvioPorProvincia.get(provincia) ?? 0;
}