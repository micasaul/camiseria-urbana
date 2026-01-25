'use strict';

/**
 * venta controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::venta.venta', ({ strapi }) => ({
  async fromCarrito(ctx) {
    const { carritoId, envio } = ctx.request.body || {};

    if (!carritoId) {
      return ctx.badRequest('carritoId requerido');
    }

    try {
      const result = await strapi
        .service('api::venta.venta')
        .createFromCarrito(carritoId, envio || 0);

      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error.message || 'Error creando venta desde carrito');
    }
  },
  async revertir(ctx) {
    const { ventaId } = ctx.request.body || {};

    if (!ventaId) {
      return ctx.badRequest('ventaId requerido');
    }

    try {
      const result = await strapi
        .service('api::venta.venta')
        .revertirVenta(ventaId);

      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error.message || 'Error revirtiendo venta');
    }
  },
}));
