'use strict';

/**
 * promo-producto controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { actualizarPromosActivas } = require('../../../extensions/promos/promo-cron');

module.exports = createCoreController('api::promo-producto.promo-producto', ({ strapi }) => ({
  async activa(ctx) {
    await actualizarPromosActivas();
    const activos = await strapi.entityService.findMany('api::promo-producto.promo-producto', {
      publicationState: 'preview',
      filters: { activo: true },
      pagination: { limit: 1 }
    });

    ctx.body = {
      activa: activos.length > 0
    };
  },

  async activarYListar(ctx) {
    await actualizarPromosActivas();
    const promoProductos = await strapi.entityService.findMany('api::promo-producto.promo-producto', {
      publicationState: 'preview',
      filters: { activo: true },
      populate: { producto: true }
    });

    ctx.body = {
      productos: promoProductos
        .map((item) => /** @type {any} */ (item)?.producto)
        .filter(Boolean)
    };
  }
}));
