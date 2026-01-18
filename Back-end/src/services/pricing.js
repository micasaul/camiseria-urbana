'use strict';

const { estaPromoActiva } = require('../utils/promo');

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
};

const getPrecioFinal = async (variacionId) => {
  if (!variacionId) {
    throw new Error('variacionId requerido');
  }

  const variacion = await strapi.entityService.findOne(
    'api::variacion.variacion',
    variacionId,
    {
      populate: {
        producto: {
          populate: {
            promo_productos: {
              populate: {
                promo: true,
              },
            },
          },
        },
      },
    }
  );

  const variacionEntity = /** @type {any} */ (variacion);
  const producto = variacionEntity?.producto;

  if (!variacion || !producto) {
    throw new Error('Variacion no encontrada');
  }

  const precioBase = toNumber(producto.precio);
  const promoProductos = producto.promo_productos || [];
  const descuentos = promoProductos
    .filter((promoProducto) => promoProducto?.activo && estaPromoActiva(promoProducto?.promo))
    .map((promoProducto) => toNumber(promoProducto?.promo?.descuento))
    .filter((value) => value > 0);

  const descuento = descuentos.length ? Math.max(...descuentos) : 0;
  const precioFinal = precioBase - (precioBase * descuento) / 100;

  return {
    precioBase,
    descuento,
    precioFinal,
  };
};

module.exports = {
  getPrecioFinal,
};
