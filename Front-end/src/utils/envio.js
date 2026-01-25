/**
 * Tarifas de envío por proximidad a Entre Ríos
 * Tier 1 (1000): Provincias más cercanas - Distancia corta
 * Tier 2 (2000): Provincias intermedias - Distancia media
 * Tier 3 (3000): Provincias más lejanas - Distancia larga
 */
export const tarifasEnvioPorProvincia = {
  // TIER 1 - 1000 (Más cercanas a Entre Ríos)
  "Entre Ríos": 1000,
  "Corrientes": 1000,
  "Misiones": 1000,
  "Santa Fe": 1000,
  "Chaco": 1000,
  
  // TIER 2 - 2000 (Distancia intermedia)
  "Buenos Aires": 2000,
  "Córdoba": 2000,
  "Santiago del Estero": 2000,
  "Formosa": 2000,
  "Paraguay": 2000,
  "Jujuy": 2000,
  "Salta": 2000,
  "La Rioja": 2000,
  "Catamarca": 2000,
  "Tucumán": 2000,
  
  // TIER 3 - 3000 (Más lejanas)
  "Mendoza": 3000,
  "San Juan": 3000,
  "San Luis": 3000,
  "La Pampa": 3000,
  "Neuquén": 3000,
  "Río Negro": 3000,
  "Chubut": 3000,
  "Santa Cruz": 3000,
  "Tierra del Fuego": 3000
};

/**
 * Obtiene el precio de envío para una provincia basado en la proximidad a Entre Ríos
 * @param {string} provincia - Nombre de la provincia
 * @returns {number} - Precio de envío (1000, 2000 o 3000), 0 si no se encuentra
 */
export const obtenerPrecioEnvio = (provincia) => {
  if (!provincia) return 0;
  return tarifasEnvioPorProvincia[provincia] ?? 0;
};
