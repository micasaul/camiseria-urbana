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
    await actualizarPromosActivas();
    
    const queryOptions = {
      ...ctx.query,
      populate: {
        marca: true,
        variacions: { populate: ['imagen'] },
        promo_productos: { populate: ['promo'] },
        wishlists: true,
      },
    };
    const productos = await strapi.entityService.findMany(
      'api::producto.producto',
      /** @type {any} */ (queryOptions)
    );
  
    return productos;
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const isDocumentId = typeof id === 'string' && /^[a-z0-9]+$/i.test(id) && id.length > 10;
    const queryOptions = {
      ...ctx.query,
      populate: {
        marca: true,
        variacions: { populate: ['imagen'] },
        promo_productos: { populate: ['promo'] },
        wishlists: true,
        resenas: { populate: ['users_permissions_user'] },
      },
    };
    let producto;
    if (isDocumentId) {
      const list = await strapi.entityService.findMany(
        'api::producto.producto',
        /** @type {any} */ ({
          ...queryOptions,
          filters: { documentId: id },
          pagination: { page: 1, pageSize: 1 },
        })
      );
      producto = Array.isArray(list) ? list[0] : null;
    } else {
      producto = await strapi.entityService.findOne(
        'api::producto.producto',
        id,
        /** @type {any} */ (queryOptions)
      );
    }
    if (!producto) return ctx.notFound();
    return producto;
  },
}));
