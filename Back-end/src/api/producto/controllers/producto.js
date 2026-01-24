'use strict';

/**
 * producto controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { actualizarPromosActivas } = require('../../../extensions/promos/promo-cron');

module.exports = createCoreController('api::producto.producto', ({ strapi }) => ({
  async enums(ctx) {
    const producto = strapi.contentTypes['api::producto.producto'];
    const variacion = strapi.contentTypes['api::variacion.variacion'];

    ctx.body = {
      data: {
        material: producto?.attributes?.material?.enum ?? [],
        talle: variacion?.attributes?.talle?.enum ?? [],
        color: variacion?.attributes?.color?.enum ?? [],
      },
    };
  },

  async find(ctx) {
    // Activar promos antes de devolver productos (igual que el menú)
    await actualizarPromosActivas();
    
    // Usar el método find por defecto de Strapi
    return super.find(ctx);
  },
}));
