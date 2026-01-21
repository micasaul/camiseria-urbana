'use strict';

const { estaPromoActiva } = require('../../utils/promo');

const actualizarPromosActivas = async () => {
  const pageSize = 100;
  let page = 1;

  while (true) {
    const promoProductos = await strapi.entityService.findMany(
      'api::promo-producto.promo-producto',
      {
        publicationState: 'preview',
        populate: { promo: true },
        pagination: { page, pageSize },
      }
    );

    if (!promoProductos.length) {
      break;
    }

    await Promise.all(
      promoProductos.map(async (promoProducto) => {
        const promoProductoEntity = /** @type {any} */ (promoProducto);
        const shouldBeActive = estaPromoActiva(promoProductoEntity?.promo);
        if (promoProducto.activo !== shouldBeActive) {
          await strapi.entityService.update(
            'api::promo-producto.promo-producto',
            promoProducto.id,
            { data: { activo: shouldBeActive } }
          );
        }
      })
    );

    if (promoProductos.length < pageSize) {
      break;
    }

    page += 1;
  }
};

module.exports = {
  actualizarPromosActivas,
};
