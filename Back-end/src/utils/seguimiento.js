'use strict';

const CODIGOS_PROVINCIA = new Map([
  ['Buenos Aires', 'BA'],
  ['Catamarca', 'CT'],
  ['Chaco', 'CC'],
  ['Chubut', 'CH'],
  ['Córdoba', 'CB'],
  ['Corrientes', 'CR'],
  ['Entre Ríos', 'ER'],
  ['Formosa', 'FO'],
  ['Jujuy', 'JJ'],
  ['La Pampa', 'LP'],
  ['La Rioja', 'LR'],
  ['Mendoza', 'MZ'],
  ['Misiones', 'MI'],
  ['Neuquén', 'NQ'],
  ['Río Negro', 'RN'],
  ['Salta', 'SA'],
  ['San Juan', 'SJ'],
  ['San Luis', 'SL'],
  ['Santa Cruz', 'SC'],
  ['Santa Fe', 'SF'],
  ['Santiago del Estero', 'SE'],
  ['Tierra del Fuego', 'TF'],
  ['Tucumán', 'TU'],
]);

function randomDigito() {
  return Math.floor(Math.random() * 10);
}

const DEFAULT_PROVINCIA = 'AR';

/**
 * @param {string} [provincia]
 * @returns {string}
 */
function generarNroSeguimiento(provincia) {
  const prefijo = (provincia && CODIGOS_PROVINCIA.get(provincia)) || DEFAULT_PROVINCIA;
  const numeros = Array.from({ length: 6 }, () => randomDigito()).join('');
  return `${prefijo}${numeros}`;
}

module.exports = {
  generarNroSeguimiento,
  CODIGOS_PROVINCIA,
};
