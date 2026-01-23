'use strict';

/**
 * producto controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

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
}));
